# React + Vite

# GradInvite - Hệ Thống Tạo Thiệp Mời Tốt Nghiệp Cá Nhân Hóa

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.
Hệ thống kết hợp toàn diện giữa **Web Thiệp Mời Tương Tác (Interactive Web Invitation)** và **Studio Thiết Kế Trực Quan & Xuất Ảnh Thiệp 2K (Card Studio Generator)** xây dựng trên nền tảng **React + Tailwind CSS**.

Currently, two official plugins are available:
----------------------------------------------

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## 🌟 Tính Năng Nổi Bật

## React Compiler

### 1. 🎨 Studio Thiết Kế (Design Studio - Phương án B)

- **Tùy chỉnh thông tin cử nhân**: Họ tên, học vị/ngành học, trường đại học, khoa, niên khóa, danh hiệu nổi bật (Thủ khoa, Xuất sắc...).
- **Tải ảnh chân dung**: Hỗ trợ upload ảnh chụp cử nhân trực tiếp từ máy tính hoặc dùng ảnh mẫu.
- **Bảng màu & Templates cao cấp**:
  - *Royal Navy & Gold*: Sang trọng hoàng gia, viền vàng ánh kim.
  - *Modern Sage & Pearl*: Hiện đại, thanh tao, tông xanh ngọc bích.
  - *Crimson Ceremony*: Rượu vang Burgundy quyền lực, ấn tượng.
  - *Minimalist Editorial*: Phong cách báo chí tối giản, tinh tế.
- **Tùy chỉnh thời gian, địa điểm & Lịch trình (Timeline)**: Tự do thêm/bớt các mốc giờ làm lễ.
- **Live Preview song song**: Mô phỏng màn hình điện thoại cập nhật thời gian thực khi chỉnh sửa.

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

### 2. 💌 Web Thiệp Mời Tương Tác Cho Khách (Interactive Web - Phương án A)

- **Hiệu ứng Mở Phong Bì (Envelope Unboxing)**: Hiệu ứng mở nắp phong bì niêm phong sáp cử nhân cùng màn bắn pháo hoa giấy (confetti) vàng rực rỡ.
- **Cá nhân hóa theo từng khách**:
  - Tự động hiển thị lời chào đích danh (`Kính gửi: Gia Đình Chú Bảy`, `Thân gửi: Nhóm Bạn Thân`).
  - Lời nhắn nhủ riêng biệt chỉ khách đó mới thấy.
- **Đồng hồ đếm ngược (Countdown Timer)**: Đếm chính xác Ngày - Giờ - Phút - Giây đến buổi lễ.
- **Bản đồ & Lịch**:
  - Tích hợp mở nhanh Google Maps chỉ đường đến hội trường.
  - Nút thêm sự kiện vào Google Calendar tự động.
  - Tải file sự kiện `.ics` dùng cho Apple Calendar và Outlook.
- **Xác nhận tham dự (RSVP)**: Khách chọn "Chắc chắn tham dự" kèm số người đi cùng hoặc "Báo vắng".
- **Sổ lưu bút trực tuyến (Wishes Wall)**: Khách gửi lời chúc kèm icon biểu cảm, hiển thị ngay trên tường lưu niệm.

## Expanding the Oxlint configuration

### 3. 📸 Xuất Ảnh Thiệp Chất Lượng Cao (Card Generator)

- Render ảnh thiệp chuẩn 2K/Ultra HD với `html-to-image`.
- Hỗ trợ 3 tỉ lệ phổ biến:
  - **Story 9:16**: Chuẩn đăng Zalo Story, Facebook, Instagram.
  - **Vuông 1:1**: Tối ưu gửi tin nhắn Zalo/Messenger.
  - **Thiệp In 5:7**: Chuẩn kích thước in ấn thiệp giấy vật lý.
- Tự động sinh **Mã QR Code động** in trên thiệp, quét là dẫn ngay về link web thiệp của khách đó.

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

### 4. 👥 Quản Lý Khách Mời & Thống Kê RSVP

- Danh sách link cá nhân hóa riêng biệt cho từng khách (`?guest=Tên+Khách`).
- Nút sao chép link 1-click.
- Dashboard thống kê: Tổng khách, số người tham dự, số người vắng mặt, số người chưa phản hồi.

---

## 🚀 Khởi Chạy Dự Án

```bash
# Cài đặt thư viện
npm install

# Khởi chạy môi trường phát triển
npm run dev

# Mở trình duyệt tại:
http://localhost:5173
```
