/**
 * Dữ liệu khởi tạo mặc định cho thiệp mời (sử dụng khi khởi tạo document đầu tiên trên Cloud Firestore)
 * Không chứa khách mời (guests) hay lời chúc (wishes) mẫu.
 */

export const DEFAULT_INVITATION_ID = 'minh-dhbk-2026';

export const DEFAULT_LAYOUT_SETTINGS = {
  avatarStyle: 'circle',
  cardRoundness: 'rounded-3xl',
  alignment: 'center',
  sections: [
    { id: 'music', label: 'Trình phát nhạc Spotify', enabled: true, iconName: 'Headphones', desc: 'Thanh phát nhạc & sóng equalizer' },
    { id: 'school', label: 'Huy hiệu Trường & Khoa', enabled: true, iconName: 'GraduationCap', desc: 'Tên trường, khoa và niên khóa' },
    { id: 'hero', label: 'Lời mời & Chân dung Cử nhân', enabled: true, iconName: 'User', desc: 'Ảnh chân dung, lời nhắn gửi đích danh' },
    { id: 'reactions', label: 'Thanh thả cảm xúc Gen Z', enabled: true, iconName: 'Heart', desc: 'Nút thả tim, thả lửa, bắn pháo hoa' },
    { id: 'countdown', label: 'Đồng hồ đếm ngược', enabled: true, iconName: 'Clock', desc: 'Bộ đếm thời gian tới giờ làm lễ' },
    { id: 'venue', label: 'Thời gian & Địa điểm (Maps)', enabled: true, iconName: 'MapPin', desc: 'Thông tin địa điểm, bản đồ & thêm lịch' },
    { id: 'timeline', label: 'Lịch trình chi tiết', enabled: false, iconName: 'Calendar', desc: 'Từng mốc giờ đón khách & nhận bằng' },
    { id: 'gallery', label: 'Kỷ niệm thanh xuân (Album ảnh)', enabled: false, iconName: 'Camera', desc: 'Bộ sưu tập ảnh kỷ yếu & lightbox' },
    { id: 'rsvp', label: 'Xác nhận tham dự (RSVP)', enabled: true, iconName: 'CheckCircle2', desc: 'Form xác nhận tham dự & số người' },
    { id: 'guestbook', label: 'Sổ lưu bút & Lời chúc', enabled: true, iconName: 'MessageSquare', desc: 'Bức tường lời chúc từ bạn bè' }
  ]
};

export const DEFAULT_TIMELINE = [
  { id: 'step-1', step_order: 1, time: '07:30', title: 'Check-in & Chụp ảnh sống ảo', description: 'Nhận hoa, bắt đền thanh xuân và chụp ảnh cháy máy cùng tân cử nhân.' },
  { id: 'step-2', step_order: 2, time: '08:30', title: 'Khai mạc Lễ Trao Bằng', description: 'Nghi thức vinh danh chính thức, lắng nghe diễn văn và nhận bằng.' },
  { id: 'step-3', step_order: 3, time: '09:30', title: 'Khoảnh khắc Lên Bục Vinh Danh', description: 'Thời khắc nhận bằng cử nhân và bắt tay thầy Hiệu trưởng.' },
  { id: 'step-4', step_order: 4, time: '11:00', title: 'Ném mũ tốt nghiệp & After Party', description: 'Ném mũ cử nhân tại sân trường & tụ tập ăn mừng xả láng.' }
];

export const DEFAULT_GALLERY = [
  { id: 'pic-1', title: 'Chân dung tốt nghiệp', photo_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop', display_order: 1 },
  { id: 'pic-2', title: 'Khoảnh khắc ném mũ cử nhân', photo_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800&auto=format&fit=crop', display_order: 2 },
  { id: 'pic-3', title: 'Kỷ yếu cùng bạn bè đại học', photo_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop', display_order: 3 },
  { id: 'pic-4', title: 'Bảo vệ khóa luận tốt nghiệp', photo_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop', display_order: 4 }
];

export const DEFAULT_REACTIONS = {
  heart_count: 142,
  fire_count: 98,
  grad_count: 215,
  congrats_count: 116
};

export function createDefaultInvitationRecord(id = DEFAULT_INVITATION_ID) {
  const now = new Date().toISOString();
  return {
    id,
    full_name: 'NGUYỄN ĐÌNH TUẤN',
    nickname: 'Tuna Nguyễn',
    degree: 'Cử Nhân',
    honor: 'quá đã rùi mọi người ơi',
    school: 'Đại Học Bách Khoa',
    faculty: 'Khoa Khoa Học & Kỹ Thuật Máy Tính',
    class_batch: 'K22 • 2022 - 2026',
    avatar_url: '/uploads/img-1794464175331-v1mjf0.jpg',
    quote: 'Sau bao mùa deadline và những ngày chạy đồ án "hết công suất", cuối cùng Tuấn cũng chính thức tốt nghiệp Bách Khoa rồi đây! 🎓',
    spotify_song: 'Thanh Xuân (Graduation Anthem) • Da LAB',
    ceremony_date: '2026-11-28',
    ceremony_time: '09:00',
    end_expected: '11:30',
    venue_name: 'Hội Trường Lớn A5',
    address: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh',
    map_query: '268 Lý Thường Kiệt, Phường 14, Quận 10, TP Hồ Chí Minh',
    dress_code: null,
    theme_id: 'genz-holographic',
    layout_settings: JSON.stringify(DEFAULT_LAYOUT_SETTINGS),
    created_at: now,
    updated_at: now
  };
}
