-- ==============================================================================
-- INITIAL SEED DATA FOR GRADINVITE
-- Dữ liệu mẫu ban đầu cho buổi lễ tốt nghiệp
-- ==============================================================================

-- 1. Insert thiệp tốt nghiệp mẫu
INSERT OR REPLACE INTO invitations (
    id, full_name, nickname, degree, honor, school, faculty, class_batch,
    avatar_url, quote, spotify_song,
    ceremony_date, ceremony_time, end_expected, venue_name, address, map_query, dress_code,
    theme_id, layout_settings
) VALUES (
    'minh-dhbk-2026',
    'NGUYỄN HOÀNG MINH',
    'Minh Minzy',
    'Cử Nhân Công Nghệ Thông Tin',
    'Tốt Nghiệp Thủ Khoa Xuất Sắc 🏆',
    'TRƯỜNG ĐẠI HỌC BÁCH KHOA - ĐHQG TP.HCM',
    'Khoa Khoa Học & Kỹ Thuật Máy Tính',
    'K22 • 2022 - 2026',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop',
    'Chính thức hết thất học rồi quý dzị ơi! 4 năm cày deadline rực rỡ đã khép lại. Ghé nhận hoa và chụp với tui vài bô ảnh cháy máy nhé! ✨🎓',
    'Thanh Xuân (Graduation Anthem) • Da LAB',
    '2026-11-20',
    '08:00',
    '11:30',
    'Hội Trường Lớn A5 (Tầng 2)',
    '268 Lý Thường Kiệt, Phường 14, Quận 10, TP. Hồ Chí Minh',
    '268 Lý Thường Kiệt, Phường 14, Quận 10, TP Hồ Chí Minh',
    'Tone-sur-tone: Trắng, Pastel, Denim hoặc Outfit Cháy Phố ✨',
    'genz-holographic',
    '{"avatarStyle":"circle","cardRoundness":"rounded-3xl","alignment":"center"}'
);

-- 2. Insert khách mời mẫu
INSERT OR REPLACE INTO guests (id, invitation_id, name, salutation, relationship, custom_note, phone, access_code, rsvp_status, guest_count) VALUES
('guest-3', 'minh-dhbk-2026', 'Hội Bạn Thân ''Dev Bất Ổn''', 'Hú le anh em', 'Bạn bè chí cốt', 'Nhất định phải có mặt đủ quân số nhé, mang hoa to vào và chuẩn bị tinh thần chụp ảnh cháy máy! 🔥', '0987654321', 'hoi-ban-than-dev-bat-on', 'confirmed', 4),
('guest-1', 'minh-dhbk-2026', 'Gia Đình Chú Bảy', 'Kính gửi', 'Gia đình', 'Cháu rất mong được đón tiếp Chú Bảy và đại gia đình đến chung vui ngày cháu nhận bằng cử nhân!', '0901234567', 'gia-dinh-chu-bay', 'confirmed', 3),
('guest-2', 'minh-dhbk-2026', 'Thầy GS.TS Lê Hải Quân', 'Kính mời', 'Thầy cô', 'Em xin chân thành cảm ơn Thầy đã dìu dắt và định hướng cho em trong suốt thời gian học tập & làm đồ án tốt nghiệp.', '0912345678', 'thay-gs-ts-le-hai-quan', 'confirmed', 1),
('guest-4', 'minh-dhbk-2026', 'Anh Hoàng (Team Leader)', 'Kính mời', 'Đồng nghiệp', 'Cảm ơn anh và team đã tạo điều kiện tối đa cho em hoàn thành kỳ bảo vệ tốt nghiệp vừa qua!', '0977889900', 'anh-hoang-team-leader', 'declined', 0);

-- 3. Insert lịch trình mẫu
INSERT OR REPLACE INTO ceremony_timeline (id, invitation_id, step_order, time, title, description) VALUES
('tl-1', 'minh-dhbk-2026', 1, '07:30', 'Check-in & Chụp ảnh sống ảo', 'Nhận hoa, bắt đền thanh xuân và chụp ảnh cháy máy cùng tân cử nhân.'),
('tl-2', 'minh-dhbk-2026', 2, '08:30', 'Khai mạc Lễ Trao Bằng', 'Nghi thức vinh danh chính thức, lắng nghe diễn văn và nhận bằng.'),
('tl-3', 'minh-dhbk-2026', 3, '09:30', 'Khoảnh khắc Lên Bục Vinh Danh', 'Thời khắc nhận bằng cử nhân và bắt tay thầy Hiệu trưởng.'),
('tl-4', 'minh-dhbk-2026', 4, '11:00', 'Ném mũ tốt nghiệp & After Party', 'Ném mũ cử nhân tại sân trường & tụ tập ăn mừng xả láng.');

-- 4. Insert ảnh kỷ yếu mẫu
INSERT OR REPLACE INTO gallery_photos (id, invitation_id, title, photo_url, display_order) VALUES
('pic-1', 'minh-dhbk-2026', 'Chân dung tốt nghiệp', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop', 1),
('pic-2', 'minh-dhbk-2026', 'Khoảnh khắc ném mũ cử nhân', 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800&auto=format&fit=crop', 2),
('pic-3', 'minh-dhbk-2026', 'Kỷ yếu cùng bạn bè đại học', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop', 3),
('pic-4', 'minh-dhbk-2026', 'Bảo vệ khóa luận tốt nghiệp', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop', 4);

-- 5. Insert lời chúc lưu bút mẫu
INSERT OR REPLACE INTO guestbook_wishes (id, invitation_id, guest_name, relationship, message, emoji, likes_count) VALUES
('w-1', 'minh-dhbk-2026', 'Trần Mai Anh', 'Bạn cùng khóa', 'Chúc mừng tân thủ khoa! 4 năm nỗ lực không ngừng nghỉ cuối cùng đã hái quả ngọt. Tự hào về cậu lắm!', '🎓', 12),
('w-2', 'minh-dhbk-2026', 'Chú Bảy & Cô Út', 'Gia đình', 'Cả nhà tự hào về cháu rất nhiều. Chúc cháu vững bước trên con đường tương lai và luôn thành công!', '💐', 8),
('w-3', 'minh-dhbk-2026', 'Lâm Nhật Huy', 'Đồng nghiệp', 'Chào đón chính thức gia nhập hội Full-time Developer! Chúc bạn sự nghiệp rực rỡ và sớm thăng tiến!', '🥂', 5);

-- 6. Insert thống kê cảm xúc
INSERT OR REPLACE INTO invitation_reactions (invitation_id, heart_count, fire_count, grad_count, congrats_count) VALUES
('minh-dhbk-2026', 142, 98, 215, 116);

