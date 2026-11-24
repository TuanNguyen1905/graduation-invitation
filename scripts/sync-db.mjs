/**
 * Script đồng bộ dữ liệu A4, A5 và cấu hình thiệp riêng cho Nguyễn Thị Như Thùy (C1)
 * Hỗ trợ tự động chạy trên SQLite cục bộ hoặc Cloud Firestore (tùy biến môi trường .env).
 * CHỈ CHẠY KHI ĐƯỢC NGƯỜI DÙNG XÁC NHẬN.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDbAdapter } from '../server/db-adapter.js';
import { DEFAULT_INVITATION_ID, DEFAULT_LAYOUT_SETTINGS, DEFAULT_TIMELINE } from '../server/defaults.js';
import { generateServerInviteCode } from '../server/invite-codes.js';
import { ROMANTIC_SPECIAL_TEMPLATE_ID } from '../server/special-guest-helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch {
    // ignore
  }
}

async function main() {
  const adapter = await getDbAdapter();
  console.log(`Connected DB adapter: ${adapter.kind}`);

  const bundle = await adapter.getInvitationBundle(DEFAULT_INVITATION_ID, { isAdmin: true });
  if (!bundle?.invitation) {
    throw new Error('Không tìm thấy bản ghi invitation minh-dhbk-2026');
  }

  const inv = bundle.invitation;

  // 1. Đồng bộ A4 (07:30 - 11:30) và A5 (dấu '·')
  await adapter.updateInvitation(DEFAULT_INVITATION_ID, {
    graduate: {
      fullName: inv.full_name || 'NGUYỄN ĐÌNH TUẤN',
      nickname: inv.nickname || 'Tuna Nguyễn',
      degree: inv.degree || 'Cử Nhân Công Nghệ Thông Tin',
      honor: '',
      school: inv.school || 'ĐẠI HỌC BÁCH KHOA',
      faculty: inv.faculty || 'Khoa Khoa Học & Kỹ Thuật Máy Tính',
      classBatch: 'K22 · 2022 - 2026',
      avatarUrl: inv.avatar_url || '/uploads/img-1794464175331-v1mjf0.jpg',
      quote: inv.quote || '',
      spotifySong: ''
    },
    ceremony: {
      date: inv.ceremony_date || '2026-11-28',
      time: '07:30',
      endExpected: '11:30',
      venueName: inv.venue_name || 'Hội Trường Lớn A5',
      address: inv.address || '268 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh',
      mapQuery: inv.map_query || '268 Lý Thường Kiệt, Phường 14, Quận 10, TP Hồ Chí Minh',
      dressCode: inv.dress_code || '',
      timeline: DEFAULT_TIMELINE.map((t) => ({
        time: t.time,
        title: t.title,
        desc: t.description
      }))
    },
    layout: DEFAULT_LAYOUT_SETTINGS,
    themeId: inv.theme_id || 'genz-holographic'
  });

  // 2. Tạo/Cập nhật khách Nguyễn Thị Như Thùy (C1) với mã mới >=8 ký tự ngẫu nhiên
  const guests = bundle.guests || [];
  const existingThuy = guests.find(
    (g) =>
      String(g.invite_code || '').toUpperCase() === 'INV-NGUYENTHIN-S0G4' ||
      String(g.name || '').toLowerCase().includes('như thùy')
  );

  const initialSpecialConfig = {
    paletteId: 'blush-rose',
    coupleInitials: 'T & T',
    petName: '',
    openingMessage: '',
    closingWish: '',
    signatureDataUrl: '',
    rsvpButtonLabel: '',
    musicUrl: '',
    musicTitle: '',
    milestones: [],
    photos: [],
    unlockGate: {
      enabled: false,
      question: '',
      answerHint: ''
    }
  };

  let finalCode;
  if (existingThuy) {
    finalCode = generateServerInviteCode('NHUTHUY', 8);
    await adapter.updateGuest(existingThuy.id, {
      inviteCode: finalCode,
      name: 'Nguyễn Thị Như Thùy',
      salutation: 'Gửi người thương',
      relationship: 'Người yêu',
      gender: 'female',
      persona: 'gentle',
      themeId: ROMANTIC_SPECIAL_TEMPLATE_ID,
      themeMode: 'light',
      customTheme: null,
      specialConfig: existingThuy.special_config ? JSON.parse(existingThuy.special_config) : initialSpecialConfig
    });
    await adapter.updateRsvp(existingThuy.id, {
      status: 'confirmed',
      guestCount: 1,
      bypassCodeCheck: true
    });
    console.log(`Updated existing guest (${existingThuy.id}) -> new inviteCode: ${finalCode}`);
  } else {
    finalCode = generateServerInviteCode('NHUTHUY', 8);
    const created = await adapter.createGuest({
      invitationId: DEFAULT_INVITATION_ID,
      inviteCode: finalCode,
      name: 'Nguyễn Thị Như Thùy',
      salutation: 'Gửi người thương',
      relationship: 'Người yêu',
      gender: 'female',
      persona: 'gentle',
      themeId: ROMANTIC_SPECIAL_TEMPLATE_ID,
      themeMode: 'light',
      customNote: '',
      specialConfig: initialSpecialConfig
    });
    await adapter.updateRsvp(created.id, {
      status: 'confirmed',
      guestCount: 1,
      bypassCodeCheck: true
    });
    console.log(`Created guest (${created.id}) -> inviteCode: ${finalCode}`);
  }

  console.log('Sync completed successfully.');
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
