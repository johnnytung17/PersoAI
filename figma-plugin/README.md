# PersoAI · Figma — luồng người mới (plugin chạy tại máy)

Xoá sạch file Figma `DGtsFSSYC2IziQr6oYi90u` rồi dựng lại chỉ theo luồng của người mới (Lan): đăng ký → khảo sát → thiết lập 4 bước → buổi học đầu tiên. Không dùng MCP.

## Chạy

1. Mở file trong **Figma desktop** (plugin dev không chạy trên trình duyệt). Nên **Duplicate** file hoặc lưu một version trước, vì bước 1 xoá hết.
2. **Plugins → Development → Import plugin from manifest…** → chọn `figma-plugin/manifest.json`.
3. **Plugins → Development → PersoAI · Luồng người mới**.
4. Tick ô xác nhận, bấm **1. Xoá sạch và dựng…** (10–30 giây, chờ log "Xong").
5. Chọn mọi file trong `anh-chup/desktop/` và `anh-chup/mobile/`, bấm **2. Chèn ảnh chụp app**. Plugin chỉ lấy ảnh trong luồng người mới, thu nhỏ còn ≤4096 px.

## Kết quả

| Trang | Section | Nội dung |
|---|---|---|
| Desktop | Luồng người mới · Màn chính (sửa được) | Bắt đầu 0/4 → 1/4 → 3/4 → Hôm nay (Góc học tập) → Trợ lý mở |
| Desktop | Luồng người mới · Ảnh chụp app — Desktop | 15 ảnh đúng thứ tự luồng + 3 ảnh trạng thái trống (hàng riêng) |
| Mobile | như trên | 5 màn 375 px (Trợ lý dạng bottom sheet) + 18 ảnh |
| Thành phần & Token | Component (Coursera) | Button, Pill, Cite chip, Step item, Step chip, Setup row, Header, FAB, Task banner, Slide viewer, Key points, Assistant panel |

Thứ tự ảnh (danh sách `FLOW` đầu `code.js`): Đăng ký → Khảo sát 3 bước → Hôm nay 1/4 → Môn học trống → Môn học đã thêm tài liệu → Lộ trình chọn hướng → Lộ trình đã lưu → Hôm nay 3/4 → Kế hoạch nháp → Kế hoạch xác nhận → Buổi đầu Góc học tập → Trợ lý trả lời về trang → Báo cáo chưa đủ dữ liệu. Ảnh của Tùng không đưa vào.

- Biến: collection **PersoAI v0.3**; text style `v0.3/…` (Be Vietnam Pro, rồi Source Sans 3, rồi Inter); effect `v0.3/Shadow lift`. Collection cũ "PersoAI" và style không thuộc `v0.3/` bị xoá.
- Chạy lại an toàn: mỗi lần chạy nút 1 xoá và dựng lại từ đầu.

## Lưu ý

- Figma Starter chỉ cho 3 trang nên dùng section, không thêm trang.
- Chưa chạy thử trong Figma thật; code mới chỉ qua `node --check`. Nếu lỗi, chép dòng "Lỗi: …" trong log gửi lại.
- Màn sửa được lấy nội dung từ `frontend/`. Khi giao diện đổi, sửa `code.js` rồi chạy lại.
