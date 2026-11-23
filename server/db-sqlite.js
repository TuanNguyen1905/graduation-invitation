/**
 * Local SQLite Database Adapter cho GradInvite (sử dụng khi chạy local chưa nối Firebase)
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_INVITATION_ID, DEFAULT_REACTIONS } from './defaults.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createSqliteAdapter() {
  const { DatabaseSync } = await import('node:sqlite');
  const dbPath = path.join(__dirname, '..', 'db', 'graduation.db');
  const db = new DatabaseSync(dbPath);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
  `);

  // Non-destructive migration
  db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      invitation_id TEXT NOT NULL DEFAULT 'minh-dhbk-2026',
      name TEXT NOT NULL,
      badge TEXT,
      mode TEXT DEFAULT 'dark',
      primary_color TEXT NOT NULL DEFAULT '#0284c7',
      secondary_color TEXT NOT NULL DEFAULT '#38bdf8',
      envelope_color TEXT NOT NULL DEFAULT '#082f49',
      seal_color TEXT NOT NULL DEFAULT '#0284c7',
      layout_config TEXT,
      is_builtin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const columns = db.prepare('PRAGMA table_info(guests)').all().map((c) => c.name);
  const newCols = [
    { name: 'invite_code', def: 'TEXT' },
    { name: 'email', def: 'TEXT' },
    { name: 'gender', def: "TEXT DEFAULT 'unisex'" },
    { name: 'persona', def: "TEXT DEFAULT 'energetic'" },
    { name: 'template_id', def: "TEXT DEFAULT 'genz-ocean-blue'" },
    { name: 'theme_mode', def: "TEXT DEFAULT 'dark'" },
    { name: 'custom_theme_config', def: 'TEXT' },
    { name: 'view_count', def: 'INTEGER DEFAULT 0' },
    { name: 'first_viewed_at', def: 'DATETIME' }
  ];

  for (const col of newCols) {
    if (!columns.includes(col.name)) {
      db.exec(`ALTER TABLE guests ADD COLUMN ${col.name} ${col.def};`);
    }
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_guests_invite_code ON guests(invite_code);
    CREATE INDEX IF NOT EXISTS idx_guests_template_id ON guests(template_id);
    CREATE INDEX IF NOT EXISTS idx_templates_invitation_id ON templates(invitation_id, created_at DESC);
  `);

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

  return {
    kind: 'sqlite',
    dbPath,

    async getInvitationBundle(invId = DEFAULT_INVITATION_ID, options = {}) {
      const isAdmin = typeof options === 'boolean' ? options : Boolean(options?.isAdmin);
      const inviteCode = typeof options === 'object' ? (options?.inviteCode || null) : null;

      const inv = db.prepare('SELECT * FROM invitations WHERE id = ?').get(invId);
      if (!inv) return null;

      const timeline = db.prepare('SELECT * FROM ceremony_timeline WHERE invitation_id = ? ORDER BY step_order ASC').all(invId);
      const gallery = db.prepare('SELECT * FROM gallery_photos WHERE invitation_id = ? ORDER BY display_order ASC').all(invId);
      const templates = db.prepare('SELECT * FROM templates WHERE invitation_id = ? ORDER BY created_at DESC').all(invId);

      let guests = [];
      let matchedGuest = null;
      let wishes = [];

      if (isAdmin) {
        guests = db.prepare('SELECT * FROM guests WHERE invitation_id = ? ORDER BY created_at DESC').all(invId);
        wishes = db.prepare('SELECT * FROM guestbook_wishes WHERE invitation_id = ? ORDER BY created_at DESC').all(invId);
      } else if (inviteCode) {
        const normalizedCode = inviteCode.trim().toUpperCase();
        const found = db
          .prepare('SELECT * FROM guests WHERE invitation_id = ? AND UPPER(TRIM(invite_code)) = ? LIMIT 1')
          .get(invId, normalizedCode);
        if (!found) {
          return { notFoundGuest: true };
        }
        matchedGuest = sanitizePublicGuest(found);
        guests = [matchedGuest];
      }

      return { invitation: inv, guest: matchedGuest, guests, timeline, gallery, wishes, templates };
    },

    async updateInvitation(invId = DEFAULT_INVITATION_ID, { graduate = {}, ceremony = {}, layout = null, themeId = 'genz-holographic' }) {
      db.prepare(`
        UPDATE invitations
        SET full_name = ?,
            nickname = ?,
            degree = ?,
            honor = ?,
            school = ?,
            faculty = ?,
            class_batch = ?,
            avatar_url = ?,
            quote = ?,
            spotify_song = ?,
            ceremony_date = ?,
            ceremony_time = ?,
            end_expected = ?,
            venue_name = ?,
            address = ?,
            map_query = ?,
            dress_code = ?,
            theme_id = ?,
            layout_settings = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        graduate.fullName || 'NGUYỄN ĐÌNH TUẤN',
        graduate.nickname || null,
        graduate.degree || 'Cử Nhân',
        graduate.honor || null,
        graduate.school || 'Đại Học Bách Khoa',
        graduate.faculty || null,
        graduate.classBatch || null,
        graduate.avatarUrl || null,
        graduate.quote || null,
        graduate.spotifySong || null,
        ceremony.date || '2026-11-28',
        ceremony.time || '09:00',
        ceremony.endExpected || '11:30',
        ceremony.venueName || 'Hội Trường Lớn A5',
        ceremony.address || '',
        ceremony.mapQuery || null,
        ceremony.dressCode || null,
        themeId,
        layout ? JSON.stringify(layout) : null,
        invId
      );

      if (Array.isArray(ceremony.timeline)) {
        db.prepare('DELETE FROM ceremony_timeline WHERE invitation_id = ?').run(invId);
        const insertTimeline = db.prepare(`
          INSERT INTO ceremony_timeline (id, invitation_id, step_order, time, title, description)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        ceremony.timeline.forEach((step, idx) => {
          insertTimeline.run(
            `step-${Date.now()}-${idx}`,
            invId,
            idx + 1,
            step.time || '08:00',
            step.title || '',
            step.desc || step.description || ''
          );
        });
      }
    },

    async updateRsvp(guestId, { status, guestCount = 1, note = null, inviteCode = null, bypassCodeCheck = false }) {
      const existing = db.prepare('SELECT id, invite_code FROM guests WHERE id = ?').get(guestId);
      if (!existing) {
        return { ok: false, statusCode: 404, error: 'Không tìm thấy khách mời' };
      }

      if (!bypassCodeCheck) {
        const provided = String(inviteCode || '').trim().toUpperCase();
        const expected = String(existing.invite_code || '').trim().toUpperCase();
        if (!provided || !expected || provided !== expected) {
          return { ok: false, statusCode: 403, error: 'Mã thiệp mời không hợp lệ hoặc không khớp.' };
        }
      }

      db.prepare(`
        UPDATE guests
        SET rsvp_status = ?, guest_count = ?, rsvp_note = ?, rsvp_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, guestCount || 1, note || null, guestId);
      return { ok: true };
    },

    async createWish({ invitationId = DEFAULT_INVITATION_ID, guestName, relationship = 'Khách mời', message, emoji = '🎓' }) {
      const newId = `wish-${Date.now()}`;
      db.prepare(`
        INSERT INTO guestbook_wishes (id, invitation_id, guest_name, relationship, message, emoji, likes_count)
        VALUES (?, ?, ?, ?, ?, ?, 0)
      `).run(newId, invitationId, guestName, relationship || 'Khách mời', message, emoji);
      return newId;
    },

    async deleteWish(wishId) {
      db.prepare('DELETE FROM guestbook_wishes WHERE id = ?').run(wishId);
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
        customNote
      } = payload;

      const newId = id || `guest-${Date.now()}`;
      const code = inviteCode || `INV-${name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const accessCode = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

      db.prepare(`
        INSERT INTO guests (id, invitation_id, invite_code, name, email, salutation, relationship, gender, persona, template_id, theme_mode, custom_note, access_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(newId, invitationId, code, name, email || null, salutation, relationship, gender, persona, themeId, themeMode || 'dark', customNote || null, accessCode);

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
      const stmt = db.prepare(`
        INSERT INTO guests (id, invitation_id, invite_code, name, email, salutation, relationship, gender, persona, template_id, theme_mode, custom_note, access_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const createdRecords = [];
      db.exec('BEGIN TRANSACTION;');
      try {
        for (let i = 0; i < guestsList.length; i++) {
          const item = guestsList[i];
          const gId = item.id || `guest-bulk-${Date.now()}-${i}`;
          const gCode = item.inviteCode || `INV-${(item.name || 'GUEST').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          const gAccess = `bulk-${Date.now()}-${i}`;
          const itemMode = item.themeMode || themeMode || 'dark';

          stmt.run(
            gId,
            invitationId,
            gCode,
            item.name,
            item.email || null,
            item.salutation || salutation,
            item.relationship || relationship,
            item.gender || gender,
            item.persona || persona,
            item.themeId || templateId,
            itemMode,
            item.customNote || customNote || null,
            gAccess
          );

          createdRecords.push({
            id: gId,
            inviteCode: gCode,
            name: item.name,
            email: item.email || '',
            salutation: item.salutation || salutation,
            relationship: item.relationship || relationship,
            gender: item.gender || gender,
            persona: item.persona || persona,
            themeId: item.themeId || templateId,
            themeMode: itemMode,
            customNote: item.customNote || customNote,
            rsvpStatus: 'pending',
            guestCount: 1
          });
        }
        db.exec('COMMIT;');
      } catch (txErr) {
        db.exec('ROLLBACK;');
        throw txErr;
      }

      return createdRecords;
    },

    async getTemplates(invId = DEFAULT_INVITATION_ID) {
      return db.prepare('SELECT * FROM templates WHERE invitation_id = ? ORDER BY created_at DESC').all(invId);
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
      db.prepare(`
        INSERT OR REPLACE INTO templates (id, invitation_id, name, badge, mode, primary_color, secondary_color, envelope_color, seal_color, layout_config)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        tplId,
        invitationId,
        name,
        badge,
        mode,
        primaryColor,
        secondaryColor,
        envelopeColor,
        sealColor,
        layoutConfig ? JSON.stringify(layoutConfig) : null
      );

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
      db.prepare('DELETE FROM templates WHERE id = ?').run(tplId);
    },

    async updateGuestMode(guestId, themeMode) {
      const info = db.prepare('UPDATE guests SET theme_mode = ? WHERE id = ?').run(themeMode, guestId);
      return info.changes > 0;
    },

    async applyModeToAllGuests(invId = DEFAULT_INVITATION_ID, themeMode = 'dark') {
      const info = db.prepare('UPDATE guests SET theme_mode = ? WHERE invitation_id = ?').run(themeMode, invId);
      return info.changes;
    },

    async updateGuest(guestId, body) {
      const existing = db.prepare('SELECT * FROM guests WHERE id = ?').get(guestId);
      if (!existing) return false;

      const nextName = body.name !== undefined ? body.name : existing.name;
      const nextEmail = body.email !== undefined ? (body.email || null) : existing.email;
      const nextSalutation = body.salutation !== undefined ? body.salutation : existing.salutation;
      const nextRelationship = body.relationship !== undefined ? body.relationship : existing.relationship;
      const nextGender = body.gender !== undefined ? body.gender : existing.gender;
      const nextPersona = body.persona !== undefined ? body.persona : existing.persona;
      const nextTemplateId = body.themeId !== undefined ? body.themeId : (body.templateId !== undefined ? body.templateId : existing.template_id);
      const nextThemeMode = body.themeMode !== undefined ? body.themeMode : existing.theme_mode;
      const nextCustomNote = body.customNote !== undefined ? (body.customNote || null) : existing.custom_note;
      const nextCustomTheme = body.customTheme !== undefined
        ? (body.customTheme ? JSON.stringify(body.customTheme) : null)
        : existing.custom_theme_config;

      db.prepare(`
        UPDATE guests
        SET name = ?,
            email = ?,
            salutation = ?,
            relationship = ?,
            gender = ?,
            persona = ?,
            template_id = ?,
            theme_mode = ?,
            custom_note = ?,
            custom_theme_config = ?
        WHERE id = ?
      `).run(
        nextName,
        nextEmail,
        nextSalutation,
        nextRelationship,
        nextGender,
        nextPersona,
        nextTemplateId,
        nextThemeMode,
        nextCustomNote,
        nextCustomTheme,
        guestId
      );
      return true;
    },

    async applyThemeToAllGuests(invId = DEFAULT_INVITATION_ID, { themeId = 'genz-ocean-blue', themeMode = 'dark', customTheme = null }) {
      const info = db.prepare(`
        UPDATE guests
        SET template_id = ?,
            theme_mode = ?,
            custom_theme_config = ?
        WHERE invitation_id = ?
      `).run(
        themeId,
        themeMode,
        customTheme ? JSON.stringify(customTheme) : null,
        invId
      );
      return info.changes;
    },

    async deleteGuest(guestId) {
      db.prepare('DELETE FROM guests WHERE id = ?').run(guestId);
    }
  };
}
