/**
 * API Service for GradInvite
 * Connects React frontend with Backend API (/api proxy on dev, Vercel Serverless on production).
 * Includes automatic offline/fallback handling when backend is unreachable.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// === AUTH TOKEN HELPERS ===
// Token được lưu trong sessionStorage — tự xóa khi đóng tab (không persist qua reload)
const TOKEN_KEY = 'gradinvite_admin_token';

export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function getAuthHeaders() {
  const token = getAuthToken();
  return token
    ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

// === AUTH API ===

export async function loginToApi(password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      setAuthToken(data.token);
      return { success: true };
    }
    return { success: false, error: data.error || 'Đăng nhập thất bại' };
  } catch (err) {
    return { success: false, error: 'Không thể kết nối máy chủ. Hãy khởi động backend.' };
  }
}

export async function logoutFromApi() {
  try {
    const token = getAuthToken();
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    }
  } catch {
    // ignore error on logout
  } finally {
    clearAuthToken();
  }
}

export async function verifyAuthToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    const data = await res.json();
    return data.authenticated === true;
  } catch {
    return false;
  }
}

export async function checkServerHealth() {
  try {
    const res = await fetch(`${API_BASE}/invitation`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchInvitationFromApi() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/invitation`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to fetch invitation');
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[API] Could not connect to backend, using local state:', err.message);
    return null;
  }
}

export async function fetchGuestInvitationFromApi(inviteCode, unlockToken = null) {
  const code = String(inviteCode || '').trim();
  if (!code) return { found: false, status: 400, error: 'Thiếu mã thiệp mời' };

  try {
    const headers = unlockToken ? { 'X-Unlock-Token': unlockToken } : {};
    const res = await fetch(`${API_BASE}/invitation?invite=${encodeURIComponent(code)}`, { headers });
    const data = await res.json();
    if (res.status === 429) {
      return {
        found: false,
        status: 429,
        rateLimited: true,
        error: data.error || 'Bạn đã thử sai quá nhiều lần. Vui lòng thử lại sau ít phút.'
      };
    }
    if (res.status === 404) {
      return { found: false, status: 404, error: data.error || 'Không tìm thấy thiệp mời với mã này.' };
    }
    if (!res.ok) {
      return { found: false, status: res.status, error: data.error || 'Không thể tải thiệp mời.' };
    }
    return { found: true, status: 200, data };
  } catch (err) {
    return { found: false, status: 0, error: 'Không thể kết nối máy chủ.' };
  }
}

export async function verifyGuestUnlockInApi(inviteCode, answer) {
  try {
    const res = await fetch(`${API_BASE}/guests/verify-unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode, answer }),
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, ...data };
  } catch (err) {
    return { ok: false, status: 0, error: 'Không thể kết nối máy chủ.' };
  }
}

export async function regenerateGuestCodeInApi(guestId, newInviteCode = null) {
  try {
    const res = await fetch(`${API_BASE}/guests/regenerate-code`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ guestId, newInviteCode }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: 'Không thể kết nối máy chủ.' };
  }
}

export async function sendRsvpToApi(guestId, status, guestCount = 1, note = '', inviteCode = '') {
  try {
    const res = await fetch(`${API_BASE}/rsvp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ guestId, inviteCode, status, guestCount, note }),
    });
    return await res.json();
  } catch (err) {
    console.warn('[API] RSVP offline fallback:', err);
    return { success: false, offline: true };
  }
}

export async function sendWishToApi({ invitationId = 'minh-dhbk-2026', guestName, relationship, message, emoji = '🎓' }) {
  try {
    const res = await fetch(`${API_BASE}/wishes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationId, guestName, relationship, message, emoji }),
    });
    return await res.json();
  } catch (err) {
    console.warn('[API] Wish offline fallback:', err);
    return { success: false, offline: true };
  }
}

export async function deleteWishFromApi(wishId) {
  try {
    const res = await fetch(`${API_BASE}/wishes?id=${encodeURIComponent(wishId)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return await res.json();
  } catch (err) {
    console.warn('[API] Delete wish offline fallback:', err);
    return { success: false, offline: true };
  }
}

export async function createGuestInApi(guestData) {
  try {
    const res = await fetch(`${API_BASE}/guests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(guestData),
    });
    return await res.json();
  } catch (err) {
    console.warn('[API] Create guest offline fallback:', err);
    return { success: false, offline: true };
  }
}

export async function createBulkGuestsInApi(bulkPayload) {
  try {
    const res = await fetch(`${API_BASE}/guests/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bulkPayload),
    });
    return await res.json();
  } catch (err) {
    console.warn('[API] Bulk create guests offline fallback:', err);
    return { success: false, offline: true };
  }
}

export async function updateGuestModeInApi(guestId, themeMode) {
  try {
    const res = await fetch(`${API_BASE}/guests/update-mode`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ guestId, themeMode }),
    });
    return await res.json();
  } catch (err) {
    console.warn('[API] Update guest mode offline fallback:', err);
    return { success: false, offline: true };
  }
}

export async function applyModeToAllGuestsInApi(themeMode, invitationId = 'minh-dhbk-2026') {
  try {
    const res = await fetch(`${API_BASE}/guests/apply-all-mode`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ themeMode, invitationId }),
    });
    return await res.json();
  } catch (err) {
    console.warn('[API] Apply mode to all guests offline fallback:', err);
    return { success: false, offline: true };
  }
}

export async function updateGuestInApi(guestData) {
  try {
    const res = await fetch(`${API_BASE}/guests/update`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(guestData),
    });
    return await res.json();
  } catch (err) {
    console.warn('[API] Update guest offline fallback:', err);
    return { success: false, offline: true };
  }
}

export async function applyThemeToAllGuestsInApi(payload) {
  try {
    const res = await fetch(`${API_BASE}/guests/apply-theme-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.warn('[API] Apply theme to all guests offline fallback:', err);
    return { success: false, offline: true };
  }
}

export async function deleteGuestFromApi(guestId) {
  try {
    const res = await fetch(`${API_BASE}/guests?id=${encodeURIComponent(guestId)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return await res.json();
  } catch (err) {
    console.warn('[API] Delete guest offline fallback:', err);
    return { success: false, offline: true };
  }
}

export async function saveCustomTemplateToApi(templatePayload) {
  try {
    const res = await fetch(`${API_BASE}/templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(templatePayload),
    });
    return await res.json();
  } catch (err) {
    console.warn('[API] Save custom template offline fallback:', err);
    return { success: false, offline: true };
  }
}

export async function deleteCustomTemplateFromApi(templateId) {
  try {
    const res = await fetch(`${API_BASE}/templates?id=${encodeURIComponent(templateId)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
    });
    return await res.json();
  } catch (err) {
    console.warn('[API] Delete template offline fallback:', err);
    return { success: false, offline: true };
  }
}

export async function updateInvitationToApi(invitationData) {
  try {
    const res = await fetch(`${API_BASE}/invitation/update`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id: 'minh-dhbk-2026',
        graduate: invitationData.graduate,
        ceremony: invitationData.ceremony,
        layout: invitationData.layout,
        themeId: invitationData.theme?.id || 'genz-holographic'
      }),
    });
    return await res.json();
  } catch (err) {
    console.warn('[API] Update invitation offline fallback:', err);
    return { success: false, offline: true };
  }
}

export async function uploadImageToApi(dataUrl, filename = 'image.png', options = {}) {
  try {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        dataUrl,
        filename,
        privateMedia: Boolean(options?.privateMedia),
        guestId: options?.guestId || null
      }),
    });
    return await res.json();
  } catch (err) {
    console.warn('[API] Upload image offline fallback:', err);
    return { success: false, offline: true };
  }
}

export async function verifySmtpConnection(smtpConfig) {
  try {
    const res = await fetch(`${API_BASE}/verify-smtp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ smtpConfig }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: 'Không thể kết nối đến máy chủ gửi mail API.' };
  }
}

export async function sendInvitationEmail(payload) {
  try {
    const res = await fetch(`${API_BASE}/send-email`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: `Lỗi kết nối máy chủ gửi mail: ${err.message}` };
  }
}

