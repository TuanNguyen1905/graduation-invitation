# Cấu Trúc Cơ Sở Dữ Liệu GradInvite (SQLite & Cloud DB Guide)

Tài liệu hướng dẫn quản lý, di chuyển (migration) và bàn giao cơ sở dữ liệu cho hệ thống Thiệp Mời Tốt Nghiệp Cá Nhân Hóa.

---

## 📁 Cấu Trúc Thư Mục Database

- **`db/schema.sql`**: File DDL định nghĩa toàn bộ 6 bảng dữ liệu, quan hệ khóa ngoại (`FOREIGN KEY ... ON DELETE CASCADE`) và các chỉ mục hiệu năng cao (`INDEXES`).
- **`db/seed.sql`**: Dữ liệu mẫu khởi tạo ban đầu (Tân cử nhân, Khách mời, Lịch trình, Ảnh kỷ yếu, Sổ lưu bút, Cảm xúc).
- **`db/init-db.js`**: Script khởi tạo hoặc reset database SQLite cục bộ.
- **`db/graduation.db`**: File cơ sở dữ liệu SQLite thực tế đang chạy trên máy.
- **`server/index.js`**: REST API Server (Node.js chuẩn không phụ thuộc thư viện ngoài) chạy tại cổng `http://localhost:3001`.

---

## 🗄️ Chi Tiết Các Bảng Dữ Liệu (Tables & Relations)

```mermaid
erDiagram
    INVITATIONS ||--o{ GUESTS : "has"
    INVITATIONS ||--o{ CEREMONY_TIMELINE : "has"
    INVITATIONS ||--o{ GALLERY_PHOTOS : "has"
    INVITATIONS ||--o{ GUESTBOOK_WISHES : "has"
    INVITATIONS ||--|| INVITATION_REACTIONS : "tracks"

    INVITATIONS {
        string id PK "Slug định danh (VD: minh-dhbk-2026)"
        string full_name "Họ và tên cử nhân"
        string degree "Học vị / Ngành học"
        string school "Trường đại học"
        string ceremony_date "Ngày làm lễ (YYYY-MM-DD)"
        string ceremony_time "Giờ khai mạc"
        string venue_name "Hội trường tổ chức"
        string address "Địa chỉ cụ thể"
        string theme_id "ID giao diện được chọn"
        string layout_settings "JSON cấu hình layout tự thiết kế"
    }

    GUESTS {
        string id PK
        string invitation_id FK
        string name "Tên khách mời"
        string salutation "Cách xưng hô (Hú le, Kính mời...)"
        string relationship "Quan hệ (Gia đình, Bạn bè...)"
        string custom_note "Lời nhắn riêng cho khách"
        string access_code "Mã định danh riêng cho URL"
        string rsvp_status "pending | confirmed | declined"
        int guest_count "Số người đi cùng"
    }

    CEREMONY_TIMELINE {
        string id PK
        string invitation_id FK
        int step_order "Thứ tự mốc giờ"
        string time "Giờ diễn ra"
        string title "Tên hoạt động"
        string description "Mô tả chi tiết"
    }

    GALLERY_PHOTOS {
        string id PK
        string invitation_id FK
        string title "Tên ảnh kỷ niệm"
        string photo_url "Đường dẫn URL ảnh"
        int display_order
    }

    GUESTBOOK_WISHES {
        string id PK
        string invitation_id FK
        string guest_name "Tên người gửi"
        string message "Nội dung lời chúc"
        string emoji "Icon cảm xúc kèm theo"
        int likes_count
    }

    INVITATION_REACTIONS {
        string invitation_id PK, FK
        int heart_count "Số lượt thả tim"
        int fire_count "Số lượt thả lửa"
        int grad_count "Số lượt vinh danh"
        int congrats_count "Số lượt chúc mừng"
    }
```

---

## 🚀 Hướng Dẫn Di Chuyển Lên Cloud (Supabase / PostgreSQL / Neon)

File `db/schema.sql` được viết hoàn toàn theo chuẩn ANSI SQL nên khi cần deploy lên các dịch vụ đám mây:
1. **Supabase / PostgreSQL**: Mở giao diện **SQL Editor** trong Supabase hoặc Neon, dán nội dung từ `db/schema.sql` rồi nhấn **Run**.
2. **Drizzle ORM / Prisma**: Subagent hoặc lập trình viên có thể ánh xạ trực tiếp 6 bảng này vào `schema.prisma` hoặc `schema.ts`.

---

## 📡 Các Điểm Cuối REST API Sẵn Sàng Sử Dụng (`http://localhost:3001`)

| Method | Endpoint | Mô Tả |
| :--- | :--- | :--- |
| `GET` | `/api/invitation?id=minh-dhbk-2026` | Lấy toàn bộ thông tin thiệp, khách mời, lịch trình, ảnh kỷ yếu, lời chúc |
| `POST` | `/api/rsvp` | Gửi xác nhận tham dự (`guestId`, `status`, `guestCount`, `note`) |
| `POST` | `/api/wishes` | Gửi lời chúc mừng mới lên Sổ lưu bút |
| `POST` | `/api/guests` | Thêm khách mời cá nhân mới |

