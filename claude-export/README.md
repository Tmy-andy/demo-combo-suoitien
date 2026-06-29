# Claude export — mang sang dự án khác

Bộ cấu hình Claude Code tái sử dụng được, tách từ dự án Suối Tiên. Các phần
mang tính riêng của dự án (permission cụ thể cho từng file, memory mô tả combo
Suối Tiên) đã được lược bỏ.

## Nội dung

```
claude-export/
├── .claude/
│   ├── commands/
│   │   └── commit-mes.md        # Slash command /commit-mes (hoặc gõ "/commit mes")
│   └── settings.local.json      # Permissions chung, tái dùng được
└── memory/
    ├── MEMORY.md                # Index của memory
    ├── no-auto-open-files.md    # Không tự mở file/browser sau khi sửa
    └── commit-mes-shortcut.md   # '/commit mes' → trả 1 dòng commit, không tự commit
```

## Cách cài vào dự án MỚI

### 1. Command + settings (theo từng dự án)
Copy thư mục `.claude/` vào thư mục gốc của dự án mới:

```
<dự-án-mới>/.claude/commands/commit-mes.md
<dự-án-mới>/.claude/settings.local.json
```

- `commit-mes.md` → dùng được ngay bằng `/commit-mes`.
- `settings.local.json` → nếu dự án đã có file này thì **gộp** mảng
  `permissions.allow` thay vì ghi đè.

### 2. Memory (theo đường dẫn dự án, KHÔNG nằm trong repo)
Claude lưu memory ở thư mục riêng theo đường dẫn từng dự án:

```
C:\Users\ASUS\.claude\projects\<slug-đường-dẫn-dự-án>\memory\
```

`<slug-đường-dẫn-dự-án>` là đường dẫn tuyệt đối của dự án, thay `:` `\` `/`
bằng `-`. Ví dụ dự án `c:\Users\ASUS\Desktop\MyApp` →
`c--Users-ASUS-Desktop-MyApp`.

Copy 3 file trong `memory/` vào thư mục đó. Nếu đã có `MEMORY.md` thì **thêm
dòng** vào index thay vì ghi đè.

> Mẹo: chỉ cần nói với Claude trong dự án mới "ghi nhớ: đừng tự mở file, và khi
> tôi gõ /commit mes thì trả về một dòng commit" — nó sẽ tự tạo các file memory
> này đúng chỗ, khỏi copy thủ công.

## Permissions đã giữ lại (generic)

| Permission | Tác dụng |
|---|---|
| `Bash(node --version)` / `node --check *` / `node -c *` / `node -e *` | Kiểm tra version & syntax JS |
| `Bash(python --version)` / `python -c *` | Kiểm tra version & chạy Python ngắn |
| `Bash(npm -v)` / `npm init *` / `npm pack *` | Thao tác npm cơ bản |
| `Bash(git stash *)` | Stash thay đổi |
| `PowerShell(gh pr list*)` | Liệt kê PR qua GitHub CLI |
| `Skill(update-config*)` | Cho phép skill chỉnh settings |

Bỏ qua các permission gắn chặt với file của Suối Tiên (app.js, styles.css,
data.json, combo-redesign.html, server cổng 8765, domain suoitien...). Khi sang
dự án mới Claude sẽ tự xin quyền cho các lệnh tương ứng.
