/**
 * Unified HTTP API Router cho GradInvite
 * Dùng chung cho cả Node.js local server (server/index.js) và Vercel Serverless (api/index.js).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createAliyunTransporter, generateGraduationEmailHtml } from './email-service.js';
import { DEFAULT_INVITATION_ID } from './defaults.js';
import { sharedRateLimiter, getClientIp } from './rate-limit.js';
import { signUnlockToken, verifyUnlockToken } from './invite-codes.js';
import { sanitizeGuestRecord, parseSpecialConfig } from './special-guest-helper.js';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_VERCEL_IMAGE_LENGTH = 900 * 1024; // ~900KB base64 để an toàn với giới hạn 1MB/doc của Firestore

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || 'gradinvite2026';
}

function getAuthSecret() {
  return process.env.AUTH_SECRET || `${getAdminPassword()}::gradinvite-hmac-v1`;
}

/**
 * Tạo token stateless ký HMAC-SHA256 (chạy ổn định qua nhiều Serverless instance trên Vercel)
 */
function signAdminToken() {
  const payload = Buffer.from(
    JSON.stringify({
      role: 'admin',
      exp: Date.now() + TOKEN_TTL_MS,
      nonce: crypto.randomBytes(8).toString('hex')
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', getAuthSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyStatelessToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', getAuthSecret()).update(payload).digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return parsed?.role === 'admin' && typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

function isAuthenticated(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  return verifyStatelessToken(token);
}

function jsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Unlock-Token'
  });
  res.end(JSON.stringify(data));
}

async function parseJsonBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === 'object' && req.body !== null) return req.body;
    if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};
    if (Buffer.isBuffer(req.body)) {
      const text = req.body.toString('utf8');
      return text ? JSON.parse(text) : {};
    }
  }

  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function normalizeUrl(req) {
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  let pathname = parsedUrl.pathname;
  const routeParam = parsedUrl.searchParams.get('route');
  if (routeParam !== null && (pathname === '/api/index' || pathname === '/api' || pathname === '/api/')) {
    pathname = `/api/${routeParam.replace(/^\/+/, '')}`;
  }
  return { parsedUrl, pathname };
}

export async function handleApiRequest(req, res, options = {}) {
  const {
    getAdapter,
    allowDiskUpload = false,
    uploadsDir = '',
    rateLimiter = sharedRateLimiter
  } = options;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Unlock-Token'
    });
    return res.end();
  }

  const { parsedUrl, pathname } = normalizeUrl(req);

  try {
    // 0. Phục vụ file ảnh tĩnh local (/uploads/*) khi chạy Node local server
    if (allowDiskUpload && uploadsDir && req.method === 'GET' && pathname.startsWith('/uploads/')) {
      const filename = path.basename(pathname);
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.gif': 'image/gif'
        };
        res.writeHead(200, {
          'Content-Type': mimeTypes[ext] || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*'
        });
        return fs.createReadStream(filePath).pipe(res);
      }
      return jsonResponse(res, 404, { error: 'File ảnh không tồn tại' });
    }

    // === AUTH ENDPOINTS ===

    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const { password } = await parseJsonBody(req);
      if (!password || password !== getAdminPassword()) {
        return jsonResponse(res, 401, { error: 'Mật khẩu không đúng. Vui lòng thử lại.' });
      }
      const token = signAdminToken();
      return jsonResponse(res, 200, { success: true, token });
    }

    if (req.method === 'POST' && pathname === '/api/auth/logout') {
      return jsonResponse(res, 200, { success: true });
    }

    if (req.method === 'GET' && pathname === '/api/auth/verify') {
      return jsonResponse(res, 200, { authenticated: isAuthenticated(req) });
    }

    // Lấy Database Adapter (Firestore hoặc SQLite local)
    const dbAdapter = await getAdapter();

    // 1. GET /api/invitation (Public chỉ trả thông tin buổi lễ + đúng 1 khách khớp ?invite=CODE; có rate-limit chống brute-force theo IP)
    if (req.method === 'GET' && pathname === '/api/invitation') {
      const invId = parsedUrl.searchParams.get('id') || DEFAULT_INVITATION_ID;
      const inviteCode = (parsedUrl.searchParams.get('invite') || parsedUrl.searchParams.get('code') || '').trim() || null;
      const unlockToken = (req.headers['x-unlock-token'] || parsedUrl.searchParams.get('unlock') || '').trim() || null;
      const isAdmin = isAuthenticated(req);
      const clientIp = getClientIp(req);

      if (inviteCode && !isAdmin) {
        const limitStatus = rateLimiter.isBlocked(clientIp, 'invite_lookup');
        if (limitStatus.blocked) {
          return jsonResponse(res, 429, {
            error: 'Bạn đã tra cứu sai mã thiệp quá nhiều lần. Vui lòng thử lại sau ít phút.',
            rateLimited: true,
            retryAfterSec: limitStatus.retryAfterSec
          });
        }
      }

      const bundle = await dbAdapter.getInvitationBundle(invId, {
        isAdmin,
        inviteCode,
        unlockToken,
        authSecret: getAuthSecret()
      });
      if (!bundle) {
        return jsonResponse(res, 404, { error: 'Không tìm thấy thiệp mời' });
      }
      if (bundle.notFoundGuest) {
        if (!isAdmin) {
          rateLimiter.recordFailure(clientIp, 'invite_lookup');
        }
        return jsonResponse(res, 404, { error: 'Không tìm thấy thiệp mời với mã này', notFound: true });
      }
      return jsonResponse(res, 200, bundle);
    }

    // 1a. GET /api/private-media (Chỉ trả ảnh/nhạc riêng khi có mã thiệp hợp lệ + đã mở khóa nếu bật C3, hoặc Admin)
    if (req.method === 'GET' && pathname === '/api/private-media') {
      const mediaId = (parsedUrl.searchParams.get('id') || '').trim();
      const inviteCode = (parsedUrl.searchParams.get('invite') || '').trim();
      const unlockToken = (req.headers['x-unlock-token'] || parsedUrl.searchParams.get('unlock') || '').trim() || null;
      const isAdmin = isAuthenticated(req);

      if (!mediaId) {
        return jsonResponse(res, 400, { error: 'Thiếu mã media' });
      }

      if (!isAdmin) {
        if (!inviteCode) {
          return jsonResponse(res, 401, { error: 'Yêu cầu mã thiệp mời để xem nội dung riêng tư.' });
        }
        const guest = await dbAdapter.getGuestByInviteCode(DEFAULT_INVITATION_ID, inviteCode);
        if (!guest) {
          return jsonResponse(res, 403, { error: 'Mã thiệp mời không hợp lệ.' });
        }
        const rawSpecial = parseSpecialConfig(guest.special_config);
        const gate = rawSpecial?.unlockGate;
        if (gate?.enabled && gate?.answerHash) {
          const unlocked = verifyUnlockToken(unlockToken, guest.id, guest.invite_code, getAuthSecret());
          if (!unlocked) {
            return jsonResponse(res, 403, { error: 'Vui lòng trả lời câu hỏi mở khóa trước khi xem nội dung này.' });
          }
        }
        const owns = await dbAdapter.guestOwnsMedia(guest, mediaId);
        if (!owns) {
          return jsonResponse(res, 403, { error: 'Không có quyền truy cập tệp riêng tư này.' });
        }
      }

      const media = await dbAdapter.getPrivateMedia(mediaId);
      if (!media || !media.data_url) {
        return jsonResponse(res, 404, { error: 'Không tìm thấy tệp riêng tư.' });
      }

      const match = String(media.data_url).match(/^data:([^;]+);base64,(.+)$/);
      const mimeType = media.mime_type || match?.[1] || 'application/octet-stream';
      const base64Data = match ? match[2] : media.data_url;
      const buffer = Buffer.from(base64Data, 'base64');

      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': buffer.length,
        'Cache-Control': 'private, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(buffer);
    }

    // 1b. POST /api/upload
    if (req.method === 'POST' && pathname === '/api/upload') {
      if (!isAuthenticated(req)) {
        return jsonResponse(res, 401, { error: 'Chưa đăng nhập. Vui lòng đăng nhập vào trang Admin.' });
      }
      const { dataUrl, filename = 'image.png', privateMedia = false, guestId = null } = await parseJsonBody(req);
      if (!dataUrl) {
        return jsonResponse(res, 400, { error: 'Thiếu dữ liệu tệp' });
      }

      if (privateMedia) {
        if (dataUrl.length > MAX_VERCEL_IMAGE_LENGTH) {
          return jsonResponse(res, 400, {
            error: 'Tệp quá lớn để lưu bảo mật (< 650KB sau nén). Vui lòng giảm kích thước ảnh/tệp.'
          });
        }
        const mimeMatch = String(dataUrl).match(/^data:([^;]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/webp';
        const mediaId = `pm-${crypto.randomBytes(16).toString('hex')}`;
        await dbAdapter.savePrivateMedia({ id: mediaId, guestId, mimeType, dataUrl });
        return jsonResponse(res, 200, {
          success: true,
          mediaId,
          url: `/api/private-media?id=${mediaId}`,
          filename
        });
      }

      if (allowDiskUpload && uploadsDir) {
        let ext = path.extname(filename) || '.png';
        let buffer;
        const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          buffer = Buffer.from(matches[2], 'base64');
          if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = '.jpg';
          else if (mimeType.includes('webp')) ext = '.webp';
          else if (mimeType.includes('gif')) ext = '.gif';
          else if (mimeType.includes('png')) ext = '.png';
        } else {
          buffer = Buffer.from(dataUrl, 'base64');
        }

        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const safeName = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        const filePath = path.join(uploadsDir, safeName);
        fs.writeFileSync(filePath, buffer);
        return jsonResponse(res, 200, {
          success: true,
          url: `/uploads/${safeName}`,
          filename: safeName
        });
      }

      // Trên Vercel Serverless (ổ đĩa chỉ đọc): lưu Data URL đã nén trực tiếp vào Firestore
      if (dataUrl.length > MAX_VERCEL_IMAGE_LENGTH) {
        return jsonResponse(res, 400, {
          error: 'Ảnh quá lớn để lưu trực tiếp trên Cloud Firestore. Vui lòng chọn ảnh nhỏ hơn (< 650KB) hoặc dán link URL ảnh.'
        });
      }
      return jsonResponse(res, 200, {
        success: true,
        url: dataUrl,
        filename
      });
    }

    // 1c. PUT /api/invitation | POST /api/invitation/update
    if ((req.method === 'PUT' && pathname === '/api/invitation') || (req.method === 'POST' && pathname === '/api/invitation/update')) {
      if (!isAuthenticated(req)) {
        return jsonResponse(res, 401, { error: 'Chưa đăng nhập. Vui lòng đăng nhập vào trang Admin.' });
      }
      const {
        id = DEFAULT_INVITATION_ID,
        graduate = {},
        ceremony = {},
        layout = null,
        themeId = 'genz-holographic'
      } = await parseJsonBody(req);

      await dbAdapter.updateInvitation(id, { graduate, ceremony, layout, themeId });
      return jsonResponse(res, 200, {
        success: true,
        message: 'Đã lưu toàn bộ thông tin thiệp mời vào hệ thống thành công!'
      });
    }

    // 2. POST /api/rsvp (Bắt buộc kèm mã thiệp khớp với khách, trả 403 nếu sai/thiếu; trừ khi Admin cập nhật)
    if (req.method === 'POST' && pathname === '/api/rsvp') {
      const { guestId, inviteCode, status, guestCount, note } = await parseJsonBody(req);
      if (!guestId) return jsonResponse(res, 400, { error: 'Thiếu guestId' });

      const bypassCodeCheck = isAuthenticated(req);
      if (!bypassCodeCheck && (!inviteCode || !String(inviteCode).trim())) {
        return jsonResponse(res, 403, {
          success: false,
          error: 'Yêu cầu mã thiệp mời khớp với khách để xác nhận RSVP.'
        });
      }

      const allowedStatuses = ['confirmed', 'declined', 'pending'];
      if (!allowedStatuses.includes(status)) {
        return jsonResponse(res, 400, { error: 'Trạng thái RSVP không hợp lệ' });
      }

      const safeCount = Math.min(10, Math.max(1, Number(guestCount) || 1));
      const result = await dbAdapter.updateRsvp(guestId, {
        status,
        guestCount: safeCount,
        note,
        inviteCode,
        bypassCodeCheck
      });

      if (!result?.ok) {
        return jsonResponse(res, result?.statusCode || 403, {
          success: false,
          error: result?.error || 'Không thể xác nhận RSVP'
        });
      }
      return jsonResponse(res, 200, { success: true, message: 'Đã cập nhật RSVP thành công!' });
    }

    // 2b. POST /api/guests/verify-unlock (Kiểm tra câu hỏi mở khóa C3 trên server, không lộ đáp án)
    if (req.method === 'POST' && pathname === '/api/guests/verify-unlock') {
      const clientIp = getClientIp(req);
      const limitStatus = rateLimiter.isBlocked(clientIp, 'unlock_gate');
      if (limitStatus.blocked) {
        return jsonResponse(res, 429, {
          success: false,
          error: 'Bạn đã nhập sai đáp án quá nhiều lần. Vui lòng thử lại sau ít phút.',
          retryAfterSec: limitStatus.retryAfterSec
        });
      }

      const { inviteCode, answer } = await parseJsonBody(req);
      if (!inviteCode) {
        return jsonResponse(res, 400, { success: false, error: 'Thiếu mã thiệp mời' });
      }

      const result = await dbAdapter.verifyGuestUnlock(
        DEFAULT_INVITATION_ID,
        inviteCode,
        answer,
        getAuthSecret()
      );
      if (!result.found) {
        rateLimiter.recordFailure(clientIp, 'unlock_gate');
        return jsonResponse(res, 404, { success: false, error: 'Không tìm thấy thiệp mời' });
      }
      if (!result.ok) {
        rateLimiter.recordFailure(clientIp, 'unlock_gate');
        return jsonResponse(res, 403, { success: false, error: 'Đáp án chưa chính xác, hãy thử lại nhé!' });
      }

      const unlockToken = signUnlockToken(result.guest.id, result.guest.invite_code, getAuthSecret());
      const unlockedGuest = sanitizeGuestRecord(result.guest, {
        isAdmin: false,
        inviteCode: result.guest.invite_code,
        unlockToken,
        authSecret: getAuthSecret()
      });

      return jsonResponse(res, 200, {
        success: true,
        unlockToken,
        guest: unlockedGuest
      });
    }

    // 3. POST /api/wishes
    if (req.method === 'POST' && pathname === '/api/wishes') {
      const { invitationId = DEFAULT_INVITATION_ID, guestName, relationship, message, emoji = '🎓' } = await parseJsonBody(req);
      if (!guestName || !message) {
        return jsonResponse(res, 400, { error: 'Thiếu thông tin người gửi hoặc lời chúc' });
      }

      const newId = await dbAdapter.createWish({ invitationId, guestName, relationship, message, emoji });
      return jsonResponse(res, 201, { success: true, id: newId });
    }

    // 3b. DELETE /api/wishes
    if (req.method === 'DELETE' && pathname === '/api/wishes') {
      if (!isAuthenticated(req)) {
        return jsonResponse(res, 401, { error: 'Chưa đăng nhập. Chỉ Admin mới có quyền xóa lưu bút.' });
      }
      const wishId = parsedUrl.searchParams.get('id');
      if (!wishId) return jsonResponse(res, 400, { error: 'Thiếu id lời chúc cần xóa' });

      await dbAdapter.deleteWish(wishId);
      return jsonResponse(res, 200, { success: true });
    }

    // 4. POST /api/guests
    if (req.method === 'POST' && pathname === '/api/guests') {
      if (!isAuthenticated(req)) {
        return jsonResponse(res, 401, { error: 'Chưa đăng nhập. Vui lòng đăng nhập vào trang Admin.' });
      }
      const body = await parseJsonBody(req);
      if (!body.name) return jsonResponse(res, 400, { error: 'Thiếu tên khách mời' });

      const created = await dbAdapter.createGuest(body, getAuthSecret());
      return jsonResponse(res, 201, { success: true, ...created });
    }

    // 4b. POST /api/guests/bulk
    if (req.method === 'POST' && pathname === '/api/guests/bulk') {
      if (!isAuthenticated(req)) {
        return jsonResponse(res, 401, { error: 'Chưa đăng nhập. Vui lòng đăng nhập vào trang Admin.' });
      }
      const body = await parseJsonBody(req);
      if (!Array.isArray(body.guestsList) || body.guestsList.length === 0) {
        return jsonResponse(res, 400, { error: 'Danh sách khách mời trống' });
      }

      const createdRecords = await dbAdapter.createBulkGuests(body);
      return jsonResponse(res, 201, {
        success: true,
        count: createdRecords.length,
        guests: createdRecords
      });
    }

    // 4c. GET /api/templates
    if (req.method === 'GET' && pathname === '/api/templates') {
      const invId = parsedUrl.searchParams.get('invitationId') || DEFAULT_INVITATION_ID;
      const list = await dbAdapter.getTemplates(invId);
      return jsonResponse(res, 200, { templates: list });
    }

    // 4d. POST /api/templates
    if (req.method === 'POST' && pathname === '/api/templates') {
      if (!isAuthenticated(req)) {
        return jsonResponse(res, 401, { error: 'Chưa đăng nhập. Vui lòng đăng nhập vào trang Admin.' });
      }
      const body = await parseJsonBody(req);
      if (!body.name) return jsonResponse(res, 400, { error: 'Vui lòng nhập tên mẫu template' });

      const template = await dbAdapter.upsertTemplate(body);
      return jsonResponse(res, 201, { success: true, template });
    }

    // 4e. DELETE /api/templates
    if (req.method === 'DELETE' && pathname === '/api/templates') {
      if (!isAuthenticated(req)) {
        return jsonResponse(res, 401, { error: 'Chưa đăng nhập. Vui lòng đăng nhập vào trang Admin.' });
      }
      const tplId = parsedUrl.searchParams.get('id');
      if (!tplId) return jsonResponse(res, 400, { error: 'Thiếu id template cần xóa' });

      await dbAdapter.deleteTemplate(tplId);
      return jsonResponse(res, 200, { success: true });
    }

    // 4f. POST /api/guests/update-mode
    if (req.method === 'POST' && pathname === '/api/guests/update-mode') {
      if (!isAuthenticated(req)) {
        return jsonResponse(res, 401, { error: 'Chưa đăng nhập. Vui lòng đăng nhập vào trang Admin.' });
      }
      const { guestId, themeMode = 'dark' } = await parseJsonBody(req);
      if (!guestId) return jsonResponse(res, 400, { error: 'Thiếu guestId' });

      await dbAdapter.updateGuestMode(guestId, themeMode);
      return jsonResponse(res, 200, { success: true, guestId, themeMode });
    }

    // 4g. POST /api/guests/apply-all-mode
    if (req.method === 'POST' && pathname === '/api/guests/apply-all-mode') {
      if (!isAuthenticated(req)) {
        return jsonResponse(res, 401, { error: 'Chưa đăng nhập. Vui lòng đăng nhập vào trang Admin.' });
      }
      const { invitationId = DEFAULT_INVITATION_ID, themeMode = 'dark' } = await parseJsonBody(req);
      const updatedCount = await dbAdapter.applyModeToAllGuests(invitationId, themeMode);
      return jsonResponse(res, 200, { success: true, themeMode, updatedCount });
    }

    // 4h. POST /api/guests/update
    if (req.method === 'POST' && pathname === '/api/guests/update') {
      if (!isAuthenticated(req)) {
        return jsonResponse(res, 401, { error: 'Chưa đăng nhập. Vui lòng đăng nhập vào trang Admin.' });
      }
      const body = await parseJsonBody(req);
      const guestId = body.id || body.guestId;
      if (!guestId) return jsonResponse(res, 400, { error: 'Thiếu guestId/id' });

      const updated = await dbAdapter.updateGuest(guestId, body, getAuthSecret());
      if (!updated) return jsonResponse(res, 404, { error: 'Không tìm thấy khách mời' });

      return jsonResponse(res, 200, { success: true, id: guestId });
    }

    // 4h-2. POST /api/guests/regenerate-code (Cấp mã mới >= 8 ký tự ngẫu nhiên, vô hiệu mã cũ)
    if (req.method === 'POST' && pathname === '/api/guests/regenerate-code') {
      if (!isAuthenticated(req)) {
        return jsonResponse(res, 401, { error: 'Chưa đăng nhập. Vui lòng đăng nhập vào trang Admin.' });
      }
      const { guestId, id, newInviteCode = null } = await parseJsonBody(req);
      const targetId = guestId || id;
      if (!targetId) return jsonResponse(res, 400, { error: 'Thiếu guestId' });

      const nextCode = await dbAdapter.regenerateGuestCode(targetId, newInviteCode);
      if (!nextCode) return jsonResponse(res, 404, { error: 'Không tìm thấy khách mời' });

      return jsonResponse(res, 200, { success: true, id: targetId, inviteCode: nextCode });
    }

    // 4i. POST /api/guests/apply-theme-all
    if (req.method === 'POST' && pathname === '/api/guests/apply-theme-all') {
      if (!isAuthenticated(req)) {
        return jsonResponse(res, 401, { error: 'Chưa đăng nhập. Vui lòng đăng nhập vào trang Admin.' });
      }
      const {
        invitationId = DEFAULT_INVITATION_ID,
        themeId = 'genz-ocean-blue',
        themeMode = 'dark',
        customTheme = null
      } = await parseJsonBody(req);

      const updatedCount = await dbAdapter.applyThemeToAllGuests(invitationId, { themeId, themeMode, customTheme });
      return jsonResponse(res, 200, { success: true, updatedCount });
    }

    // 4j. DELETE /api/guests
    if (req.method === 'DELETE' && pathname === '/api/guests') {
      if (!isAuthenticated(req)) {
        return jsonResponse(res, 401, { error: 'Chưa đăng nhập. Vui lòng đăng nhập vào trang Admin.' });
      }
      const guestId = parsedUrl.searchParams.get('id');
      if (!guestId) return jsonResponse(res, 400, { error: 'Thiếu id khách mời cần xóa' });

      await dbAdapter.deleteGuest(guestId);
      return jsonResponse(res, 200, { success: true });
    }

    // 5. POST /api/verify-smtp
    if (req.method === 'POST' && pathname === '/api/verify-smtp') {
      if (!isAuthenticated(req)) {
        return jsonResponse(res, 401, { error: 'Chưa đăng nhập. Vui lòng đăng nhập vào trang Admin.' });
      }
      const { smtpConfig = {} } = await parseJsonBody(req);
      try {
        const transporter = createAliyunTransporter(smtpConfig);
        await transporter.verify();
        return jsonResponse(res, 200, {
          success: true,
          message: 'Kết nối máy chủ Aliyun Enterprise Mail (smtp.qiye.aliyun.com) thành công!'
        });
      } catch (err) {
        console.error('[SMTP Verify Error]:', err.message);
        return jsonResponse(res, 400, {
          success: false,
          error: `Không thể kết nối đến Aliyun Mail: ${err.message}`
        });
      }
    }

    // 6. POST /api/send-email
    if (req.method === 'POST' && pathname === '/api/send-email') {
      if (!isAuthenticated(req)) {
        return jsonResponse(res, 401, { error: 'Chưa đăng nhập. Vui lòng đăng nhập vào trang Admin.' });
      }
      const body = await parseJsonBody(req);
      const {
        to,
        guestName,
        salutation,
        relationship,
        customNote,
        invitationUrl,
        graduate,
        ceremony,
        subject,
        smtpConfig = {}
      } = body;

      if (!to || !to.includes('@')) {
        return jsonResponse(res, 400, { error: 'Địa chỉ email người nhận (to) không hợp lệ' });
      }

      try {
        const transporter = createAliyunTransporter(smtpConfig);
        const fromEmail = smtpConfig.user || process.env.ALIYUN_MAIL_USER;
        const fromName = smtpConfig.fromName || process.env.ALIYUN_FROM_NAME || `${graduate?.fullName || 'Tuấn'} - Lễ Tốt Nghiệp`;

        const emailSubject = subject || `🎓 Thư Mời Lễ Tốt Nghiệp Cử Nhân - ${graduate?.fullName || 'Nguyễn Đình Tuấn'}`;
        const htmlContent = generateGraduationEmailHtml({
          guestName,
          salutation,
          relationship,
          customNote,
          invitationUrl,
          graduate,
          ceremony
        });

        const mailOptions = {
          from: `"${fromName}" <${fromEmail}>`,
          to,
          subject: emailSubject,
          html: htmlContent,
          text: `${salutation || 'Trân trọng kính mời'} ${guestName}!\n\nLỄ TỐT NGHIỆP CỬ NHÂN: ${graduate?.fullName}\nThời gian: ${ceremony?.time} - Ngày ${ceremony?.date}\nĐịa điểm: ${ceremony?.venueName} (${ceremony?.address})\n\nXem thiệp mời tương tác: ${invitationUrl}`
        };

        const info = await transporter.sendMail(mailOptions);
        return jsonResponse(res, 200, {
          success: true,
          messageId: info.messageId,
          message: `Đã gửi thiệp mời thành công tới ${to} qua Aliyun Mail!`
        });
      } catch (err) {
        console.error('[Send Mail Error]:', err.message);
        return jsonResponse(res, 500, {
          success: false,
          error: `Lỗi gửi mail qua Aliyun: ${err.message}`
        });
      }
    }

    return jsonResponse(res, 404, { error: 'Endpoint không tồn tại' });
  } catch (error) {
    console.error('[API Error]:', error);
    const msg = String(error?.message || '');
    if (error?.code === 5 || msg.includes('5 NOT_FOUND')) {
      const dbId = process.env.FIREBASE_DATABASE_ID || '(default)';
      return jsonResponse(res, 500, {
        error: `Cloud Firestore database "${dbId}" chưa tồn tại trên Firebase Project này (5 NOT_FOUND). Hãy vào Firebase Console -> Build -> Firestore Database -> Create database (chế độ Native, Database ID: "${dbId}") hoặc khai báo FIREBASE_DATABASE_ID trên Vercel.`
      });
    }
    return jsonResponse(res, 500, { error: msg });
  }
}
