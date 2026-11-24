/**
 * IP-based sliding/fixed-window Rate Limiter cho GradInvite API
 * Bảo vệ các endpoint tra cứu mã thiệp và mở khóa thiệp trước brute-force.
 */

export const DEFAULT_WINDOW_MS = 10 * 60 * 1000; // 10 phút
export const DEFAULT_MAX_ATTEMPTS = 10;

export function getClientIp(req) {
  const xff = req.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0].trim();
  }
  const realIp = req.headers?.['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

export function createRateLimiter({
  windowMs = DEFAULT_WINDOW_MS,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  now = () => Date.now()
} = {}) {
  const buckets = new Map();

  function getKey(ip, scope) {
    return `${scope}:${ip || 'unknown'}`;
  }

  function pruneAndGet(key) {
    const current = now();
    const list = buckets.get(key) || [];
    const active = list.filter((ts) => current - ts < windowMs);
    if (active.length > 0) {
      buckets.set(key, active);
    } else {
      buckets.delete(key);
    }
    return { active, current };
  }

  return {
    isBlocked(ip, scope = 'invite_lookup') {
      const key = getKey(ip, scope);
      const { active, current } = pruneAndGet(key);
      if (active.length < maxAttempts) {
        return { blocked: false, remaining: maxAttempts - active.length, retryAfterSec: 0 };
      }
      const oldest = active[0];
      const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - current) / 1000));
      return { blocked: true, remaining: 0, retryAfterSec };
    },

    recordFailure(ip, scope = 'invite_lookup') {
      const key = getKey(ip, scope);
      const { active, current } = pruneAndGet(key);
      active.push(current);
      buckets.set(key, active);
      return {
        attempts: active.length,
        remaining: Math.max(0, maxAttempts - active.length),
        blocked: active.length >= maxAttempts
      };
    },

    reset(ip, scope = 'invite_lookup') {
      buckets.delete(getKey(ip, scope));
    },

    clearAll() {
      buckets.clear();
    }
  };
}

export const sharedRateLimiter = createRateLimiter();
