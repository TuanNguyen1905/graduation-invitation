/**
 * Shared helpers for bespoke romantic guest config (Part C) & security gating (C3, C5)
 * Used identically across SQLite and Firestore adapters.
 */
import { hashUnlockAnswer, verifyUnlockAnswerHash, verifyUnlockToken } from './invite-codes.js';

export const ROMANTIC_SPECIAL_TEMPLATE_ID = 'romantic-thuy-bespoke';

export function parseSpecialConfig(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function extractPrivateMediaIds(specialConfig) {
  const cfg = parseSpecialConfig(specialConfig);
  if (!cfg) return new Set();
  const ids = new Set();

  const collect = (val) => {
    if (typeof val !== 'string') return;
    const match = val.match(/\/api\/private-media\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/);
    if (match) ids.add(match[1]);
    if (val.startsWith('pm-')) ids.add(val);
  };

  collect(cfg.musicUrl);
  collect(cfg.signatureDataUrl);
  if (Array.isArray(cfg.milestones)) {
    cfg.milestones.forEach((m) => collect(m?.photoUrl));
  }
  if (Array.isArray(cfg.photos)) {
    cfg.photos.forEach((p) => collect(p?.url));
  }
  return ids;
}

function attachMediaAuthParams(url, inviteCode, unlockToken) {
  if (typeof url !== 'string' || !url.includes('/api/private-media')) return url;
  try {
    const u = new URL(url, 'http://localhost');
    if (inviteCode) u.searchParams.set('invite', inviteCode);
    if (unlockToken) u.searchParams.set('unlock', unlockToken);
    return `${u.pathname}${u.search}`;
  } catch {
    return url;
  }
}

/**
 * Chuẩn bị `special_config` khi lưu từ Admin vào DB (hash đáp án C3 trên server, không lưu plaintext)
 */
export function prepareSpecialConfigForStorage(incomingConfig, existingRawConfig, authSecret) {
  if (incomingConfig === undefined) return existingRawConfig || null;
  if (incomingConfig === null) return null;

  const existing = parseSpecialConfig(existingRawConfig) || {};
  const next = { ...existing, ...incomingConfig };

  if (incomingConfig.unlockGate !== undefined) {
    const prevGate = existing.unlockGate || {};
    const nextGateInput = incomingConfig.unlockGate || {};
    let nextHash = prevGate.answerHash || '';

    if (nextGateInput.clearAnswer) {
      nextHash = '';
    } else if (typeof nextGateInput.newAnswer === 'string' && nextGateInput.newAnswer.trim()) {
      nextHash = hashUnlockAnswer(nextGateInput.newAnswer, authSecret);
    }

    next.unlockGate = {
      enabled: Boolean(nextGateInput.enabled),
      question: String(nextGateInput.question || '').trim(),
      answerHint: String(nextGateInput.answerHint || '').trim(),
      answerHash: nextHash
    };
  }

  return JSON.stringify(next);
}

/**
 * Làm sạch guest object trước khi trả ra public hoặc admin (never expose answerHash!)
 */
export function sanitizeGuestRecord(g, options = {}) {
  const {
    isAdmin = false,
    inviteCode = null,
    unlockToken = null,
    authSecret = ''
  } = options;

  const rawSpecial = parseSpecialConfig(g.special_config);
  const gate = rawSpecial?.unlockGate;
  const gateEnabled = Boolean(gate?.enabled && gate?.answerHash);
  const isUnlocked =
    isAdmin ||
    !gateEnabled ||
    verifyUnlockToken(unlockToken, g.id, g.invite_code, authSecret);

  let publicSpecialConfig = null;
  if (rawSpecial) {
    if (isAdmin) {
      publicSpecialConfig = {
        ...rawSpecial,
        unlockGate: {
          enabled: Boolean(gate?.enabled),
          question: gate?.question || '',
          answerHint: gate?.answerHint || '',
          hasAnswer: Boolean(gate?.answerHash)
        }
      };
    } else if (isUnlocked) {
      const code = inviteCode || g.invite_code;
      const tok = gateEnabled ? unlockToken : null;
      publicSpecialConfig = {
        paletteId: rawSpecial.paletteId || 'blush-rose',
        coupleInitials: rawSpecial.coupleInitials || 'T & T',
        petName: rawSpecial.petName || '',
        openingMessage: rawSpecial.openingMessage || '',
        closingWish: rawSpecial.closingWish || '',
        signatureDataUrl: attachMediaAuthParams(rawSpecial.signatureDataUrl || '', code, tok),
        rsvpButtonLabel: rawSpecial.rsvpButtonLabel || '',
        musicUrl: attachMediaAuthParams(rawSpecial.musicUrl || '', code, tok),
        musicTitle: rawSpecial.musicTitle || '',
        milestones: Array.isArray(rawSpecial.milestones)
          ? rawSpecial.milestones.map((m) => ({
              ...m,
              photoUrl: attachMediaAuthParams(m?.photoUrl || '', code, tok)
            }))
          : [],
        photos: Array.isArray(rawSpecial.photos)
          ? rawSpecial.photos.map((p) => ({
              ...p,
              url: attachMediaAuthParams(p?.url || '', code, tok)
            }))
          : [],
        unlockGate: {
          enabled: Boolean(gate?.enabled),
          question: gate?.question || '',
          answerHint: gate?.answerHint || '',
          unlocked: true
        }
      };
    } else {
      // Locked state (C3 + C5): strictly withhold private text, photos, milestones, music
      publicSpecialConfig = {
        paletteId: rawSpecial.paletteId || 'blush-rose',
        coupleInitials: rawSpecial.coupleInitials || 'T & T',
        unlockGate: {
          enabled: true,
          locked: true,
          question: gate?.question || 'Nhập đáp án bí mật để mở phong bì',
          answerHint: gate?.answerHint || ''
        }
      };
    }
  }

  const base = {
    id: g.id,
    invite_code: g.invite_code,
    name: g.name,
    salutation: g.salutation,
    relationship: g.relationship,
    gender: g.gender || 'unisex',
    persona: g.persona || 'energetic',
    template_id: g.template_id || 'genz-ocean-blue',
    theme_mode: g.theme_mode || 'light',
    custom_theme_config: g.custom_theme_config || null,
    custom_note: isUnlocked ? (g.custom_note || null) : null,
    rsvp_status: g.rsvp_status || 'pending',
    guest_count: g.guest_count || 1,
    special_config: publicSpecialConfig ? JSON.stringify(publicSpecialConfig) : null,
    special_locked: Boolean(gateEnabled && !isUnlocked)
  };

  if (isAdmin) {
    return {
      ...g,
      ...base,
      email: g.email || null,
      phone: g.phone || null,
      view_count: g.view_count || 0,
      first_viewed_at: g.first_viewed_at || null
    };
  }

  return base;
}

export function checkUnlockAnswer(guestRow, answer, authSecret) {
  const rawSpecial = parseSpecialConfig(guestRow?.special_config);
  const gate = rawSpecial?.unlockGate;
  if (!gate?.enabled || !gate?.answerHash) {
    return { ok: true, required: false };
  }
  const ok = verifyUnlockAnswerHash(answer, gate.answerHash, authSecret);
  return { ok, required: true };
}
