# Suối Tiên · Vé Combo 360°

Trang landing giới thiệu & gợi ý các **combo vé** cho khu du lịch Suối Tiên, với
phong cách "vé giấy" (editorial paper-ticket): quiz gợi ý combo theo nhu cầu,
bản đồ định hướng (wayfinding), trải nghiệm VR và hành trình tham quan.

Toàn bộ giao diện được dựng **thuần (vanilla)** — không framework, không build
tool. Dữ liệu combo/điểm đến được nạp động từ `data.json`.

## Ngôn ngữ & công nghệ sử dụng

| Hạng mục | Công nghệ | Vai trò trong dự án |
|----------|-----------|----------------------|
| Đánh dấu (markup) | **HTML5** | `index.html` — khung trang tối giản, chỉ một `<div id="app">` làm điểm gắn |
| Giao diện (styling) | **CSS3** thuần | `styles.css` — toàn bộ layout, hiệu ứng, responsive; không dùng Tailwind/Bootstrap |
| Logic | **JavaScript (ES6+), vanilla** | `app.js` — render bằng template string, quản lý state thủ công, không React/Vue |
| Dữ liệu | **JSON** | `data.json` — combo, điểm đến, toạ độ bản đồ, bộ câu hỏi quiz (nạp qua `fetch`) |
| Font | **Google Fonts** | `Lora` (serif) + `Be Vietnam Pro` (sans) — nạp qua CDN |
| Icon | **Lucide** (path nhúng sẵn) | Các path SVG lấy từ thư viện [Lucide](https://lucide.dev), nhúng trực tiếp vào `app.js` — không cài như dependency |

> **Không có** framework JS, không có Node/npm, không có bước build hay bundler.
> Mở thẳng `index.html` trong trình duyệt là chạy được.

## Cấu trúc dự án

```
.
├── index.html     # khung HTML, nạp font + styles.css + app.js
├── styles.css     # toàn bộ CSS (~1.4k dòng)
├── app.js         # toàn bộ logic & render (~1.4k dòng)
└── data.json      # dữ liệu: ICONS, DEST, SEA_DEST, COMBOS, QUIZ
```

## Tính năng chính

- **Quiz gợi ý combo** — trả lời vài câu hỏi (đi cùng ai, muốn ngày như thế nào,
  có thêm công viên nước không) → hệ thống chấm điểm và đề xuất combo phù hợp.
- **3 nhóm combo** — Tham Quan, Khám Phá, Thử Thách; mỗi combo có giá người
  lớn/trẻ em và tuỳ chọn thêm Biển Tiên Đồng (công viên nước).
- **Thanh mua vé (buybar)** — chọn số lượng người lớn/trẻ em, tính tổng tiền.
- **Vé chi tiết (sheet)** — modal hiển thị vé dạng dọc với danh sách điểm đến.
- **Bản đồ định hướng (explore)** — bản đồ wayfinding có pin điểm đến, kéo-thả,
  zoom, và engine chỉ đường from/to.
- **Trải nghiệm VR & hành trình** — xem trước hành trình tham quan trong combo.

## Chạy thử

Không cần cài đặt gì. Có thể:

- Mở trực tiếp `index.html` bằng trình duyệt, **hoặc**
- Dùng một static server bất kỳ (khuyến nghị, để `fetch('data.json')` không bị
  chặn bởi CORS khi mở file local):

```bash
# ví dụ với Python
python -m http.server 8000
# rồi mở http://localhost:8000
```
