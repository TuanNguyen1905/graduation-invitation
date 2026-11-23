/**
 * Cloud Firestore Database Adapter cho GradInvite
 * Dùng firebase-admin để chạy an toàn trên Vercel Serverless & Local Dev.
 */
import fs from 'node:fs';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, initializeFirestore } from 'firebase-admin/firestore';
import {
  DEFAULT_INVITATION_ID,
  DEFAULT_TIMELINE,
  DEFAULT_GALLERY,
  DEFAULT_REACTIONS,
  createDefaultInvitationRecord
} from './defaults.js';

function loadServiceAccountFromEnv() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (rawJson) {
    const trimmed = rawJson.trim();
    try {
      return JSON.parse(trimmed);
    } catch {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
      return JSON.parse(decoded);
    }
  }

  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (filePath && fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n')
    };
  }

  return null;
}

export function hasFirebaseConfig() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY)
  );
}

let cachedDb = null;

function getDb() {
  if (cachedDb) return cachedDb;
  const serviceAccount = loadServiceAccountFromEnv();
  if (!serviceAccount) {
    throw new Error('Thiếu cấu hình Firebase (FIREBASE_SERVICE_ACCOUNT hoặc FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY).');
  }
  const app = getApps().length === 0 ? initializeApp({ credential: cert(serviceAccount) }) : getApp();
  const databaseId = process.env.FIREBASE_DATABASE_ID || '(default)';
  try {
    cachedDb = initializeFirestore(
      app,
      {
        preferRest: Boolean(process.env.VERCEL),
        ignoreUndefinedProperties: true
      },
      databaseId
    );
  } catch {
    cachedDb = getFirestore(app, databaseId);
  }
  return cachedDb;
}

function sortByCreatedDesc(items) {
  return [...items].sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) || 0 : 0;
    const tb = b.created_at ? Date.parse(b.created_at) || 0 : 0;
    return tb - ta;
  });
}

async function ensureInvitationExists(db, invId, allowAutoCreate = false) {
  const docRef = db.collection('invitations').doc(invId);
  const snap = await docRef.get();
  if (snap.exists) {
    return { docRef, data: snap.data() };
  }
  if (!allowAutoCreate || invId !== DEFAULT_INVITATION_ID) {
    return null;
  }
  const initialData = {
    ...createDefaultInvitationRecord(invId),
    timeline: DEFAULT_TIMELINE,
    gallery: DEFAULT_GALLERY,
    reactions: DEFAULT_REACTIONS
  };
  await docRef.set(initialData);
  return { docRef, data: initialData };
}

function sanitizePublicGuest(g) {
  return {
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
    custom_note: g.custom_note || null,
    rsvp_status: g.rsvp_status || 'pending',
    guest_count: g.guest_count || 1
  };
}

export function createFirestoreAdapter() {
  const db = getDb();

  return {
    kind: 'firestore',

    async getInvitationBundle(invId = DEFAULT_INVITATION_ID, options = {}) {
      const isAdmin = typeof options === 'boolean' ? options : Boolean(options?.isAdmin);
      const inviteCode = typeof options === 'object' ? (options?.inviteCode || null) : null;

      const ensured = await ensureInvitationExists(db, invId, invId === DEFAULT_INVITATION_ID);
      if (!ensured) return null;
      const { data: invDoc } = ensured;
      const { timeline = DEFAULT_TIMELINE, gallery = DEFAULT_GALLERY, ...inv } = invDoc;

      const templatesSnap = await db.collection('templates').where('invitation_id', '==', invId).get();
      const templates = sortByCreatedDesc(templatesSnap.docs.map((d) => d.data()));

      let guests = [];
      let matchedGuest = null;
      let wishes = [];

      if (isAdmin) {
        const guestsSnap = await db.collection('guests').where('invitation_id', '==', invId).get();
        guests = sortByCreatedDesc(guestsSnap.docs.map((d) => d.data()));
        const wishesSnap = await db.collection('guestbook_wishes').where('invitation_id', '==', invId).get();
        wishes = sortByCreatedDesc(wishesSnap.docs.map((d) => d.data()));
      } else if (inviteCode) {
        const normalizedCode = inviteCode.trim().toUpperCase();
        const guestsSnap = await db.collection('guests').where('invitation_id', '==', invId).get();
        const found = guestsSnap.docs
          .map((d) => d.data())
          .find((g) => g.invite_code && g.invite_code.trim().toUpperCase() === normalizedCode);

        if (!found) {
          return { notFoundGuest: true };
        }
        matchedGuest = sanitizePublicGuest(found);
        guests = [matchedGuest];
      }

      return {
        invitation: inv,
        guest: matchedGuest,
        guests,
        timeline: [...timeline].sort((a, b) => (a.step_order || 0) - (b.step_order || 0)),
        gallery: [...gallery].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
        wishes,
        templates
      };
    },

    async updateInvitation(invId = DEFAULT_INVITATION_ID, { graduate = {}, ceremony = {}, layout = null, themeId = 'genz-holographic' }) {
      const ensured = await ensureInvitationExists(db, invId, invId === DEFAULT_INVITATION_ID);
      if (!ensured) return false;
      const { docRef, data: existing } = ensured;
      const now = new Date().toISOString();

      const nextTimeline = Array.isArray(ceremony.timeline)
        ? ceremony.timeline.map((step, idx) => ({
            id: `step-${Date.now()}-${idx}`,
            invitation_id: invId,
            step_order: idx + 1,
            time: step.time || '08:00',
            title: step.title || '',
            description: step.desc || step.description || ''
          }))
        : (existing.timeline || DEFAULT_TIMELINE);

      await docRef.set({
        ...existing,
        id: invId,
        full_name: graduate.fullName || existing.full_name || 'NGUYỄN ĐÌNH TUẤN',
        nickname: graduate.nickname !== undefined ? (graduate.nickname || null) : existing.nickname,
        degree: graduate.degree || existing.degree || 'Cử Nhân',
        honor: graduate.honor !== undefined ? (graduate.honor || null) : existing.honor,
        school: graduate.school || existing.school || 'Đại Học Bách Khoa',
        faculty: graduate.faculty !== undefined ? (graduate.faculty || null) : existing.faculty,
        class_batch: graduate.classBatch !== undefined ? (graduate.classBatch || null) : existing.class_batch,
        avatar_url: graduate.avatarUrl !== undefined ? (graduate.avatarUrl || null) : existing.avatar_url,
        quote: graduate.quote !== undefined ? (graduate.quote || null) : existing.quote,
        spotify_song: graduate.spotifySong !== undefined ? (graduate.spotifySong || null) : existing.spotify_song,
        ceremony_date: ceremony.date || existing.ceremony_date || '2026-11-28',
        ceremony_time: ceremony.time || existing.ceremony_time || '09:00',
        end_expected: ceremony.endExpected || existing.end_expected || '11:30',
        venue_name: ceremony.venueName || existing.venue_name || 'Hội Trường Lớn A5',
        address: ceremony.address !== undefined ? ceremony.address : (existing.address || ''),
        map_query: ceremony.mapQuery !== undefined ? (ceremony.mapQuery || null) : existing.map_query,
        dress_code: ceremony.dressCode !== undefined ? (ceremony.dressCode || null) : existing.dress_code,
        theme_id: themeId || existing.theme_id || 'genz-holographic',
        layout_settings: layout ? JSON.stringify(layout) : existing.layout_settings,
        timeline: nextTimeline,
        updated_at: now
      }, { merge: true });
    },

    async updateRsvp(guestId, { status, guestCount = 1, note = null, inviteCode = null, bypassCodeCheck = false }) {
      const ref = db.collection('guests').doc(guestId);
      const snap = await ref.get();
      if (!snap.exists) return { ok: false, statusCode: 404, error: 'Không tìm thấy khách mời' };
      const existing = snap.data();

      if (!bypassCodeCheck) {
        const provided = String(inviteCode || '').trim().toUpperCase();
        const expected = String(existing.invite_code || '').trim().toUpperCase();
        if (!provided || !expected || provided !== expected) {
          return { ok: false, statusCode: 403, error: 'Mã thiệp mời không hợp lệ hoặc không khớp.' };
        }
      }

      await ref.update({
        rsvp_status: status,
        guest_count: guestCount || 1,
        rsvp_note: note || null,
        rsvp_at: new Date().toISOString()
      });
      return { ok: true };
    },

    async createWish({ invitationId = DEFAULT_INVITATION_ID, guestName, relationship = 'Khách mời', message, emoji = '🎓' }) {
      const newId = `wish-${Date.now()}`;
      const record = {
        id: newId,
        invitation_id: invitationId,
        guest_name: guestName,
        relationship: relationship || 'Khách mời',
        message,
        emoji,
        likes_count: 0,
        created_at: new Date().toISOString()
      };
      await db.collection('guestbook_wishes').doc(newId).set(record);
      return newId;
    },

    async deleteWish(wishId) {
      await db.collection('guestbook_wishes').doc(wishId).delete();
    },

    async createGuest(payload) {
      const {
        invitationId = DEFAULT_INVITATION_ID,
        id,
        inviteCode,
        name,
        email = '',
        salutation = 'Kính mời',
        relationship = 'Bạn bè',
        gender = 'unisex',
        persona = 'energetic',
        themeId = 'genz-ocean-blue',
        themeMode = 'dark',
        customNote = ''
      } = payload;

      const newId = id || `guest-${Date.now()}`;
      const code = inviteCode || `INV-${name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const accessCode = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

      const record = {
        id: newId,
        invitation_id: invitationId,
        invite_code: code,
        name,
        email: email || null,
        phone: null,
        salutation,
        relationship,
        gender,
        persona,
        template_id: themeId,
        theme_mode: themeMode || 'dark',
        custom_theme_config: null,
        custom_note: customNote || null,
        access_code: accessCode,
        rsvp_status: 'pending',
        guest_count: 1,
        rsvp_note: null,
        rsvp_at: null,
        view_count: 0,
        first_viewed_at: null,
        created_at: new Date().toISOString()
      };

      await db.collection('guests').doc(newId).set(record);
      return { id: newId, inviteCode: code, accessCode, themeMode: themeMode || 'dark' };
    },

    async createBulkGuests({
      invitationId = DEFAULT_INVITATION_ID,
      guestsList = [],
      templateId = 'genz-ocean-blue',
      themeMode = 'dark',
      salutation = 'Thân mời',
      relationship = 'Bạn bè',
      gender = 'unisex',
      persona = 'energetic',
      customNote = ''
    }) {
      const createdRecords = [];
      const baseTime = Date.now();
      const batch = db.batch();

      guestsList.forEach((item, i) => {
        const gId = item.id || `guest-bulk-${baseTime}-${i}`;
        const gCode = item.inviteCode || `INV-${(item.name || 'GUEST').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const gAccess = `bulk-${baseTime}-${i}`;
        const itemMode = item.themeMode || themeMode || 'dark';
        const nowIso = new Date(baseTime + i).toISOString();

        const docData = {
          id: gId,
          invitation_id: invitationId,
          invite_code: gCode,
          name: item.name,
          email: item.email || null,
          phone: null,
          salutation: item.salutation || salutation,
          relationship: item.relationship || relationship,
          gender: item.gender || gender,
          persona: item.persona || persona,
          template_id: item.themeId || templateId,
          theme_mode: itemMode,
          custom_theme_config: null,
          custom_note: item.customNote || customNote || null,
          access_code: gAccess,
          rsvp_status: 'pending',
          guest_count: 1,
          rsvp_note: null,
          rsvp_at: null,
          view_count: 0,
          first_viewed_at: null,
          created_at: nowIso
        };

        batch.set(db.collection('guests').doc(gId), docData);

        createdRecords.push({
          id: gId,
          inviteCode: gCode,
          name: item.name,
          email: item.email || '',
          salutation: docData.salutation,
          relationship: docData.relationship,
          gender: docData.gender,
          persona: docData.persona,
          themeId: docData.template_id,
          themeMode: itemMode,
          customNote: docData.custom_note || '',
          rsvpStatus: 'pending',
          guestCount: 1
        });
      });

      await batch.commit();
      return createdRecords;
    },

    async getTemplates(invId = DEFAULT_INVITATION_ID) {
      const snap = await db.collection('templates').where('invitation_id', '==', invId).get();
      return sortByCreatedDesc(snap.docs.map((d) => d.data()));
    },

    async upsertTemplate(payload) {
      const {
        invitationId = DEFAULT_INVITATION_ID,
        id,
        name,
        badge = 'Mẫu thiết kế tùy chỉnh ✨',
        mode = 'dark',
        primaryColor = '#0284c7',
        secondaryColor = '#38bdf8',
        envelopeColor = '#082f49',
        sealColor = '#0284c7',
        layoutConfig = null
      } = payload;

      const tplId = id || `tpl-custom-${Date.now()}`;
      await db.collection('templates').doc(tplId).set({
        id: tplId,
        invitation_id: invitationId,
        name,
        badge,
        mode,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        envelope_color: envelopeColor,
        seal_color: sealColor,
        layout_config: layoutConfig ? JSON.stringify(layoutConfig) : null,
        is_builtin: 0,
        created_at: new Date().toISOString()
      });

      return {
        id: tplId,
        name,
        badge,
        mode,
        accentColor: primaryColor,
        secondaryColor,
        envelopeColor,
        sealColor,
        layoutConfig,
        isCustom: true
      };
    },

    async deleteTemplate(tplId) {
      await db.collection('templates').doc(tplId).delete();
    },

    async updateGuestMode(guestId, themeMode) {
      const ref = db.collection('guests').doc(guestId);
      const snap = await ref.get();
      if (!snap.exists) return false;
      await ref.update({ theme_mode: themeMode });
      return true;
    },

    async applyModeToAllGuests(invId = DEFAULT_INVITATION_ID, themeMode = 'dark') {
      const snap = await db.collection('guests').where('invitation_id', '==', invId).get();
      if (snap.empty) return 0;
      const batch = db.batch();
      snap.docs.forEach((doc) => {
        batch.update(doc.ref, { theme_mode: themeMode });
      });
      await batch.commit();
      return snap.size;
    },

    async updateGuest(guestId, body) {
      const ref = db.collection('guests').doc(guestId);
      const snap = await ref.get();
      if (!snap.exists) return false;
      const existing = snap.data();

      const nextTemplateId = body.themeId !== undefined
        ? body.themeId
        : (body.templateId !== undefined ? body.templateId : existing.template_id);

      const nextCustomTheme = body.customTheme !== undefined
        ? (body.customTheme ? JSON.stringify(body.customTheme) : null)
        : existing.custom_theme_config;

      await ref.update({
        name: body.name !== undefined ? body.name : existing.name,
        email: body.email !== undefined ? (body.email || null) : existing.email,
        salutation: body.salutation !== undefined ? body.salutation : existing.salutation,
        relationship: body.relationship !== undefined ? body.relationship : existing.relationship,
        gender: body.gender !== undefined ? body.gender : existing.gender,
        persona: body.persona !== undefined ? body.persona : existing.persona,
        template_id: nextTemplateId,
        theme_mode: body.themeMode !== undefined ? body.themeMode : existing.theme_mode,
        custom_note: body.customNote !== undefined ? (body.customNote || null) : existing.custom_note,
        custom_theme_config: nextCustomTheme
      });
      return true;
    },

    async applyThemeToAllGuests(invId = DEFAULT_INVITATION_ID, { themeId = 'genz-ocean-blue', themeMode = 'dark', customTheme = null }) {
      const snap = await db.collection('guests').where('invitation_id', '==', invId).get();
      if (snap.empty) return 0;
      const serializedCustom = customTheme ? JSON.stringify(customTheme) : null;
      const batch = db.batch();
      snap.docs.forEach((doc) => {
        batch.update(doc.ref, {
          template_id: themeId,
          theme_mode: themeMode,
          custom_theme_config: serializedCustom
        });
      });
      await batch.commit();
      return snap.size;
    },

    async deleteGuest(guestId) {
      await db.collection('guests').doc(guestId).delete();
    }
  };
}
