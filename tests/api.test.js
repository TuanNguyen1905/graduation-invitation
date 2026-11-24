import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { handleApiRequest } from '../server/router.js';
import { createRateLimiter } from '../server/rate-limit.js';
import { generateServerInviteCode, hashUnlockAnswer } from '../server/invite-codes.js';
import { sanitizeGuestRecord, checkUnlockAnswer } from '../server/special-guest-helper.js';

function createMockAdapter() {
  const invitation = {
    id: 'minh-dhbk-2026',
    full_name: 'NGUYỄN ĐÌNH TUẤN',
    ceremony_date: '2026-11-28',
    ceremony_time: '07:30',
    end_expected: '11:30'
  };

  const guests = [
    {
      id: 'guest-valid',
      invitation_id: 'minh-dhbk-2026',
      invite_code: 'INV-VALID-ABCDEFGH',
      name: 'Khách Hợp Lệ',
      rsvp_status: 'pending',
      guest_count: 1,
      special_config: null
    },
    {
      id: 'guest-locked',
      invitation_id: 'minh-dhbk-2026',
      invite_code: 'INV-NHUTHUY-9K4M7P2X',
      name: 'Nguyễn Thị Như Thùy',
      custom_note: 'Lời nhắn riêng tư bí mật',
      rsvp_status: 'confirmed',
      guest_count: 1,
      special_config: JSON.stringify({
        petName: 'Bé Mèo',
        openingMessage: 'Tin nhắn riêng tư',
        photos: [{ id: 'p1', url: '/api/private-media?id=pm-secret-1' }],
        unlockGate: {
          enabled: true,
          question: 'Ngày kỷ niệm?',
          answerHash: hashUnlockAnswer('20/10/2023', 'gradinvite2026::gradinvite-hmac-v1')
        }
      })
    }
  ];

  const privateMedia = new Map([
    [
      'pm-secret-1',
      {
        id: 'pm-secret-1',
        guest_id: 'guest-locked',
        mime_type: 'text/plain',
        data_url: `data:text/plain;base64,${Buffer.from('secret-photo-bytes').toString('base64')}`
      }
    ]
  ]);

  return {
    kind: 'mock',
    guests,
    async getInvitationBundle(invId, options = {}) {
      if (invId !== 'minh-dhbk-2026') return null;
      const { isAdmin = false, inviteCode = null, unlockToken = null, authSecret = '' } = options;
      if (isAdmin) {
        return { invitation, guests, timeline: [], gallery: [], wishes: [], templates: [] };
      }
      if (!inviteCode) {
        return { invitation, guest: null, guests: [], timeline: [], gallery: [], wishes: [], templates: [] };
      }
      const norm = inviteCode.trim().toUpperCase();
      const found = guests.find((g) => g.invite_code.toUpperCase() === norm);
      if (!found) return { notFoundGuest: true };
      const sanitized = sanitizeGuestRecord(found, {
        isAdmin: false,
        inviteCode: found.invite_code,
        unlockToken,
        authSecret
      });
      return { invitation, guest: sanitized, guests: [sanitized], timeline: [], gallery: [], wishes: [], templates: [] };
    },
    async updateRsvp(guestId, { status, guestCount, inviteCode, bypassCodeCheck }) {
      const existing = guests.find((g) => g.id === guestId);
      if (!bypassCodeCheck) {
        if (!existing) return { ok: false, statusCode: 403, error: 'Mã thiệp mời không hợp lệ hoặc không khớp.' };
        const provided = String(inviteCode || '').trim().toUpperCase();
        if (!provided || provided !== existing.invite_code.toUpperCase()) {
          return { ok: false, statusCode: 403, error: 'Mã thiệp mời không hợp lệ hoặc không khớp.' };
        }
      } else if (!existing) {
        return { ok: false, statusCode: 404, error: 'Not found' };
      }
      existing.rsvp_status = status;
      existing.guest_count = guestCount;
      return { ok: true };
    },
    async getGuestByInviteCode(invId, code) {
      if (invId !== 'minh-dhbk-2026') return null;
      const norm = String(code || '').trim().toUpperCase();
      return guests.find((g) => g.invite_code.toUpperCase() === norm) || null;
    },
    async verifyGuestUnlock(invId, code, answer, authSecret) {
      const found = await this.getGuestByInviteCode(invId, code);
      if (!found) return { found: false, ok: false };
      const res = checkUnlockAnswer(found, answer, authSecret);
      return { found: true, ok: res.ok, guest: found };
    },
    async guestOwnsMedia(guestRow, mediaId) {
      return guestRow?.id === 'guest-locked' && mediaId === 'pm-secret-1';
    },
    async getPrivateMedia(mediaId) {
      return privateMedia.get(mediaId) || null;
    }
  };
}

async function startTestServer(adapter, rateLimiter) {
  const server = http.createServer((req, res) =>
    handleApiRequest(req, res, {
      getAdapter: async () => adapter,
      rateLimiter
    })
  );
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  return {
    baseUrl: `http://127.0.0.1:${addr.port}`,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

test('A1: POST /api/rsvp rejects missing or mismatched inviteCode with 403 and accepts matching code', async () => {
  const adapter = createMockAdapter();
  const limiter = createRateLimiter();
  const srv = await startTestServer(adapter, limiter);
  try {
    // Missing inviteCode -> 403
    const resMissing = await fetch(`${srv.baseUrl}/api/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId: 'guest-valid', status: 'confirmed', guestCount: 2 })
    });
    assert.equal(resMissing.status, 403);

    // Wrong inviteCode -> 403
    const resWrong = await fetch(`${srv.baseUrl}/api/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestId: 'guest-valid',
        inviteCode: 'INV-WRONG-CODE',
        status: 'confirmed',
        guestCount: 2
      })
    });
    assert.equal(resWrong.status, 403);

    // Non-existent guestId + wrong code -> 403 (no enumeration)
    const resNoGuest = await fetch(`${srv.baseUrl}/api/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestId: 'guest-unknown',
        inviteCode: 'INV-FAKE',
        status: 'confirmed',
        guestCount: 1
      })
    });
    assert.equal(resNoGuest.status, 403);

    // Matching inviteCode -> 200
    const resOk = await fetch(`${srv.baseUrl}/api/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestId: 'guest-valid',
        inviteCode: 'inv-valid-abcdefgh',
        status: 'declined',
        guestCount: 1
      })
    });
    assert.equal(resOk.status, 200);
    assert.equal(adapter.guests[0].rsvp_status, 'declined');
  } finally {
    await srv.close();
  }
});

test('A2: Rate-limit blocks after 10 wrong invite lookups per IP and new codes have >= 8 random chars', async () => {
  // Check generated invite code random segment length >= 8
  for (let i = 0; i < 20; i++) {
    const code = generateServerInviteCode('Nguyễn Thị Như Thùy');
    const parts = code.split('-');
    assert.equal(parts[0], 'INV');
    assert.ok(parts[2].length >= 8, `Expected random segment >= 8 chars, got ${parts[2]}`);
  }

  const adapter = createMockAdapter();
  const limiter = createRateLimiter({ maxAttempts: 10, windowMs: 10 * 60 * 1000 });
  const srv = await startTestServer(adapter, limiter);
  try {
    // First 10 bad lookups return 404
    for (let i = 0; i < 10; i++) {
      const r = await fetch(`${srv.baseUrl}/api/invitation?invite=INV-GUESS-${i}`, {
        headers: { 'x-forwarded-for': '203.0.113.99' }
      });
      assert.equal(r.status, 404);
    }

    // 11th lookup from same IP is blocked with 429
    const rBlocked = await fetch(`${srv.baseUrl}/api/invitation?invite=INV-VALID-ABCDEFGH`, {
      headers: { 'x-forwarded-for': '203.0.113.99' }
    });
    assert.equal(rBlocked.status, 429);

    // Different IP is still allowed
    const rOtherIp = await fetch(`${srv.baseUrl}/api/invitation?invite=INV-VALID-ABCDEFGH`, {
      headers: { 'x-forwarded-for': '203.0.113.100' }
    });
    assert.equal(rOtherIp.status, 200);
  } finally {
    await srv.close();
  }
});

test('A3: GET /api/invitation?id=<non-existent> returns 404', async () => {
  const adapter = createMockAdapter();
  const limiter = createRateLimiter();
  const srv = await startTestServer(adapter, limiter);
  try {
    const res = await fetch(`${srv.baseUrl}/api/invitation?id=khong-ton-tai`);
    assert.equal(res.status, 404);

    const resValid = await fetch(`${srv.baseUrl}/api/invitation?id=minh-dhbk-2026`);
    assert.equal(resValid.status, 200);
    const json = await resValid.json();
    assert.equal(json.guests.length, 0);
  } finally {
    await srv.close();
  }
});

test('C3 & C5: Locked special invitation withholds private content and private media until unlocked', async () => {
  const adapter = createMockAdapter();
  const limiter = createRateLimiter();
  const srv = await startTestServer(adapter, limiter);
  try {
    // Before unlock: private data stripped
    const resLocked = await fetch(`${srv.baseUrl}/api/invitation?invite=INV-NHUTHUY-9K4M7P2X`);
    assert.equal(resLocked.status, 200);
    const lockedJson = await resLocked.json();
    assert.equal(lockedJson.guest.special_locked, true);
    assert.equal(lockedJson.guest.custom_note, null);
    const sc = JSON.parse(lockedJson.guest.special_config);
    assert.equal(sc.openingMessage, undefined);
    assert.equal(sc.unlockGate.answerHash, undefined);

    // Private media blocked without unlock token -> 403
    const resMediaBlocked = await fetch(
      `${srv.baseUrl}/api/private-media?id=pm-secret-1&invite=INV-NHUTHUY-9K4M7P2X`
    );
    assert.equal(resMediaBlocked.status, 403);

    // Wrong answer -> 403
    const resWrongAns = await fetch(`${srv.baseUrl}/api/guests/verify-unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: 'INV-NHUTHUY-9K4M7P2X', answer: '01/01/2000' })
    });
    assert.equal(resWrongAns.status, 403);

    // Correct answer -> 200 + unlockToken + full content
    const resOkAns = await fetch(`${srv.baseUrl}/api/guests/verify-unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: 'INV-NHUTHUY-9K4M7P2X', answer: ' 20/10/2023 ' })
    });
    assert.equal(resOkAns.status, 200);
    const unlocked = await resOkAns.json();
    assert.ok(unlocked.unlockToken);
    assert.equal(unlocked.guest.custom_note, 'Lời nhắn riêng tư bí mật');
    const unlockedSc = JSON.parse(unlocked.guest.special_config);
    assert.equal(unlockedSc.openingMessage, 'Tin nhắn riêng tư');

    // Private media accessible with invite + unlockToken -> 200
    const resMediaOk = await fetch(
      `${srv.baseUrl}/api/private-media?id=pm-secret-1&invite=INV-NHUTHUY-9K4M7P2X&unlock=${encodeURIComponent(unlocked.unlockToken)}`
    );
    assert.equal(resMediaOk.status, 200);
    assert.equal(await resMediaOk.text(), 'secret-photo-bytes');
  } finally {
    await srv.close();
  }
});
