/**
 * Tiện ích bảo mật server-side cho mã thiệp mời & khóa câu hỏi riêng tư (Part A2 & C3)
 */
import crypto from 'node:crypto';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function removeVietnameseTones(str) {
  if (!str) return '';
  return String(str)
    .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
    .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
    .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
    .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
    .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
    .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A')
    .replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E')
    .replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I')
    .replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O')
    .replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U')
    .replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y')
    .replace(/Đ/g, 'D');
}

export function randomCodeSegment(length = 8) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

/**
 * Sinh mã thiệp mời với phần ngẫu nhiên >= 8 ký tự CSPRNG (A2)
 */
export function generateServerInviteCode(guestName = 'KHACH', randomLength = 8) {
  const cleanName = removeVietnameseTones(guestName)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10) || 'GUEST';
  const suffix = randomCodeSegment(Math.max(8, randomLength));
  return `INV-${cleanName}-${suffix}`;
}

export function normalizeUnlockAnswer(answer) {
  return removeVietnameseTones(String(answer || ''))
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function hashUnlockAnswer(answer, secret) {
  const normalized = normalizeUnlockAnswer(answer);
  if (!normalized) return '';
  return crypto
    .createHmac('sha256', `${secret}::unlock-answer-v1`)
    .update(normalized)
    .digest('hex');
}

export function verifyUnlockAnswerHash(answer, expectedHash, secret) {
  if (!expectedHash) return true;
  const computed = hashUnlockAnswer(answer, secret);
  if (!computed) return false;
  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(String(expectedHash), 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

const UNLOCK_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

export function signUnlockToken(guestId, inviteCode, secret) {
  const payload = Buffer.from(
    JSON.stringify({
      scope: 'unlock',
      guestId,
      code: String(inviteCode || '').trim().toUpperCase(),
      exp: Date.now() + UNLOCK_TOKEN_TTL_MS,
      nonce: crypto.randomBytes(6).toString('hex')
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', `${secret}::unlock-token-v1`)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyUnlockToken(token, guestId, inviteCode, secret) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', `${secret}::unlock-token-v1`)
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return (
      parsed?.scope === 'unlock' &&
      parsed.guestId === guestId &&
      parsed.code === String(inviteCode || '').trim().toUpperCase() &&
      typeof parsed.exp === 'number' &&
      parsed.exp > Date.now()
    );
  } catch {
    return false;
  }
}
