-- ==============================================================================
-- GRADINVITE DATABASE SCHEMA (SQLite / PostgreSQL / MySQL Compatible)
-- Hệ thống tạo thiệp mời tốt nghiệp cá nhân hóa & quản lý RSVP
-- ==============================================================================

-- 1. BẢNG THIỆP MỜI & TÂN CỬ NHÂN (invitations)
CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY,                           -- UUID hoặc slug định danh (VD: "minh-dhbk-2026")
    full_name TEXT NOT NULL,                       -- Họ và tên cử nhân (VD: "NGUYỄN HOÀNG MINH")
    nickname TEXT,                                 -- Biệt danh Gen Z (VD: "Minh Minzy")
    degree TEXT NOT NULL,                          -- Học vị / Ngành học (VD: "Cử Nhân Công Nghệ Thông Tin")
    honor TEXT,                                    -- Danh hiệu tốt nghiệp (VD: "Tốt Nghiệp Thủ Khoa Xuất Sắc 🏆")
    school TEXT NOT NULL,                          -- Tên trường đại học (VD: "ĐH Bách Khoa - ĐHQG TP.HCM")
    faculty TEXT,                                  -- Khoa / Bộ môn (VD: "Khoa KH & KT Máy Tính")
    class_batch TEXT,                              -- Niên khóa (VD: "K22 • 2022 - 2026")
    avatar_url TEXT,                               -- Link ảnh chân dung cử nhân
    quote TEXT,                                    -- Thông điệp / lời tri ân cử nhân
    spotify_song TEXT,                             -- Bài hát nhạc nền (VD: "Thanh Xuân • Da LAB")
    
    -- Thông tin buổi lễ
    ceremony_date TEXT NOT NULL,                   -- Ngày tổ chức (YYYY-MM-DD, VD: "2026-11-20")
    ceremony_time TEXT NOT NULL,                   -- Giờ bắt đầu (HH:MM, VD: "08:00")
    end_expected TEXT,                             -- Giờ kết thúc dự kiến (VD: "11:30")
    venue_name TEXT NOT NULL,                      -- Tên hội trường (VD: "Hội Trường Lớn A5")
    address TEXT NOT NULL,                         -- Địa chỉ cụ thể
    map_query TEXT,                                -- Chuỗi tìm kiếm Google Maps
    dress_code TEXT,                               -- Gợi ý trang phục
    
    -- Tùy biến giao diện & layout
    theme_id TEXT NOT NULL DEFAULT 'genz-holographic', -- Theme mặc định
    layout_settings TEXT,                          -- JSON cấu hình layout (avatarStyle, roundness, alignment, sections order/enabled)
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG KHÁCH MỜI CÁ NHÂN HÓA (guests)
CREATE TABLE IF NOT EXISTS guests (
    id TEXT PRIMARY KEY,                           -- Mã khách (VD: "guest-1")
    invitation_id TEXT NOT NULL,                   -- Khóa ngoại liên kết bảng invitations
    invite_code TEXT UNIQUE,                       -- Mã ID thiệp duy nhất (VD: "INV-TUANANH-8E3F")
    name TEXT NOT NULL,                            -- Tên khách mời (VD: "Gia Đình Chú Bảy", "Bạn Nam")
    email TEXT,                                    -- Địa chỉ email nhận thiệp (qua qiye.aliyun)
    phone TEXT,                                    -- Số điện thoại
    salutation TEXT DEFAULT 'Kính mời',            -- Xưng hô riêng (Hú le, Kính mời, Thân gửi...)
    relationship TEXT,                             -- Quan hệ (Gia đình, Bạn bè, Thầy cô, Đồng nghiệp...)
    gender TEXT DEFAULT 'unisex',                  -- Giới tính ('male', 'female', 'unisex')
    persona TEXT DEFAULT 'energetic',              -- Phong cách/Tính cách ('energetic', 'gentle', 'funny', 'formal')
    template_id TEXT DEFAULT 'genz-ocean-blue',    -- Mã template/tone màu gán riêng cho khách này
    custom_note TEXT,                              -- Lời nhắn nhủ riêng hiển thị trên đầu thiệp của khách
    access_code TEXT UNIQUE,                       -- Token/Mã định danh riêng cho URL khách
    
    -- Trạng thái phản hồi RSVP & Lượt xem
    rsvp_status TEXT DEFAULT 'pending',            -- 'pending' (chờ), 'confirmed' (tham dự), 'declined' (vắng)
    guest_count INTEGER DEFAULT 1,                 -- Số người cùng tham dự
    rsvp_note TEXT,                                -- Ghi chú thêm từ khách khi gửi RSVP
    rsvp_at DATETIME,                              -- Thời điểm gửi xác nhận
    view_count INTEGER DEFAULT 0,                  -- Số lượt khách mở xem thiệp
    first_viewed_at DATETIME,                      -- Thời điểm khách mở thiệp lần đầu
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
);

-- 3. BẢNG LỊCH TRÌNH BUỔI LỄ (ceremony_timeline)
CREATE TABLE IF NOT EXISTS ceremony_timeline (
    id TEXT PRIMARY KEY,
    invitation_id TEXT NOT NULL,
    step_order INTEGER NOT NULL,                   -- Thứ tự mốc giờ (1, 2, 3...)
    time TEXT NOT NULL,                            -- Giờ diễn ra (VD: "07:30", "08:30")
    title TEXT NOT NULL,                           -- Tiêu đề (VD: "Đón tiếp & Chụp ảnh sống ảo")
    description TEXT,                              -- Mô tả chi tiết hoạt động
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
);

-- 4. BẢNG BỘ SƯU TẬP ẢNH KỶ YẾU (gallery_photos)
CREATE TABLE IF NOT EXISTS gallery_photos (
    id TEXT PRIMARY KEY,
    invitation_id TEXT NOT NULL,
    title TEXT,                                    -- Chú thích ảnh (VD: "Khoảnh khắc ném mũ cử nhân")
    photo_url TEXT NOT NULL,                       -- Đường dẫn URL ảnh
    display_order INTEGER DEFAULT 0,               -- Thứ tự hiển thị trong album
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
);

-- 5. BẢNG SỔ LƯU BÚT & LỜI CHÚC MỪNG (guestbook_wishes)
CREATE TABLE IF NOT EXISTS guestbook_wishes (
    id TEXT PRIMARY KEY,
    invitation_id TEXT NOT NULL,
    guest_name TEXT NOT NULL,                      -- Tên người gửi lời chúc
    relationship TEXT,                             -- Mối quan hệ
    message TEXT NOT NULL,                         -- Nội dung lời chúc
    emoji TEXT DEFAULT '🎓',                       -- Icon cảm xúc kèm theo
    likes_count INTEGER DEFAULT 0,                 -- Số lượt thả tim lời chúc
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
);

-- 6. BẢNG THỐNG KÊ CẢM XÚC THỜI GIAN THỰC (invitation_reactions)
CREATE TABLE IF NOT EXISTS invitation_reactions (
    invitation_id TEXT PRIMARY KEY,
    heart_count INTEGER DEFAULT 142,               -- Số lượt thả tim ❤️
    fire_count INTEGER DEFAULT 98,                 -- Số lượt thả lửa 🔥
    grad_count INTEGER DEFAULT 215,                -- Số lượt vinh danh 🎓
    congrats_count INTEGER DEFAULT 116,            -- Số lượt chúc mừng 🎉
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
);

-- 7. BẢNG MẪU THIẾT KẾ TÙY CHỈNH (templates)
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,                           -- Mã mẫu (VD: "tpl-cntt-2026")
    invitation_id TEXT NOT NULL DEFAULT 'minh-dhbk-2026',
    name TEXT NOT NULL,                            -- Tên mẫu template (VD: "Mẫu Khoa CNTT Bách Khoa")
    badge TEXT,                                    -- Nhãn mô tả (VD: "Năng động • Tươi sáng")
    mode TEXT DEFAULT 'dark',                      -- 'dark' hoặc 'light'
    primary_color TEXT NOT NULL DEFAULT '#0284c7', -- Màu điểm nhấn chính
    secondary_color TEXT NOT NULL DEFAULT '#38bdf8', -- Màu chuyển gradient phụ
    envelope_color TEXT NOT NULL DEFAULT '#082f49', -- Màu phong bì
    seal_color TEXT NOT NULL DEFAULT '#0284c7',    -- Màu con dấu sáp
    layout_config TEXT,                            -- JSON cấu hình bố cục (avatarStyle, cardRoundness, sections...)
    is_builtin INTEGER DEFAULT 0,                  -- 1: Mẫu mặc định hệ thống, 0: Mẫu người dùng tạo
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE QUERYING
-- Tối ưu tốc độ truy vấn khi có hàng ngàn khách mời truy cập
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_guests_invitation_id ON guests(invitation_id);
CREATE INDEX IF NOT EXISTS idx_guests_invite_code ON guests(invite_code);
CREATE INDEX IF NOT EXISTS idx_guests_access_code ON guests(access_code);
CREATE INDEX IF NOT EXISTS idx_guests_rsvp_status ON guests(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_guests_template_id ON guests(template_id);
CREATE INDEX IF NOT EXISTS idx_templates_invitation_id ON templates(invitation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_invitation_order ON ceremony_timeline(invitation_id, step_order);
CREATE INDEX IF NOT EXISTS idx_gallery_invitation ON gallery_photos(invitation_id, display_order);
CREATE INDEX IF NOT EXISTS idx_wishes_invitation_created ON guestbook_wishes(invitation_id, created_at DESC);

