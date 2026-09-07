# 📌 PREMIXTRACK - PROJECT STATUS & AI AGENT CONTEXT
> **Tài liệu định hướng và ghi nhớ trạng thái dự án dành cho TẤT CẢ các AI Agents (Gemini, Claude, Cursor, ChatGPT, Copilot...)**  
> **Lưu ý bắt buộc cho AI:** ĐỌC KỸ FILE NÀY TRƯỚC KHI THỰC HIỆN BẤT KỲ THAO TÁC NÀO TRÊN CODEBASE!

---

## 🏛️ 1. THÔNG TIN HỆ THỐNG & MÔI TRƯỜNG

- **Dự án:** PremixTrack - Quản Lý & Điều Phối Nguyên Liệu Premix & TACN Toàn Quốc (22 Cơ sở)
- **Thư mục làm việc:** `<PROJECT_DIR>/PremixTrack-FE`
- **Môi trường Triển khai Production (Proxmox Virtual Environment):**
  - **LXC 101 (Application Server):** Docker multi-stage build, Node 20, Vite SPA + Express API (Cổng 3000, cấu hình IP/Domain qua .env).
  - **LXC 102 (Database Server):** MS SQL Server 2022 (DB: `PremixTrackDB`, Cổng 1433, thông tin xác thực cấu hình qua .env).
  - **LXC 100 (Ingress Gateway):** Cloudflare Tunnel + Tailscale routing.
- **Kho lưu trữ GitHub:** `https://github.com/425000218/PremixTrack-tailwind.git` (Branch chính: `main`).

---

## ⚠️ 2. QUY TẮC BẮT BUỘC CHO TẤT CẢ AI AGENT (CRITICAL RULES)

1. **QUY TẮC PHÊ DUYỆT (APPROVAL FIRST):**
   - AI **tuyệt đối KHÔNG ĐƯỢC tự ý sửa code trước**.
   - Phải luôn trình bày **Kế hoạch triển khai chi tiết từng bước** và **chỉ được code khi người dùng nói rõ: `appro` hoặc `approve`**.
2. **QUY TẮC DEPLOY & DATABASE MIGRATION:**
   - Script `deploy_lxc101.sh` đã được tinh gọn còn **3 bước** và **ĐÃ LOẠI BỎ bước tự động migrate DB**.
   - **Tuyệt đối KHÔNG** tự ý thêm lại bước chạy migrate vào script deploy trừ khi người dùng yêu cầu rõ ràng.
   - Khi cần migrate DB thủ công: `docker compose exec premixtrack-app npm run db:migrate`.
3. **QUY TẮC AN TOÀN POWERSHELL & MÃ HÓA:**
   - Trên môi trường Windows, **KHÔNG dùng `Add-Content`** của PowerShell để ghi file vì nó sinh ra ký tự `NUL` (UTF-16LE) làm crash Node.js/Vite.
   - Sử dụng Node.js `fs.writeFileSync(..., 'utf8')` cho các thao tác tạo/sửa file lớn.
4. **QUY TẮC GIỮ NGUYÊN NGHIỆP VỤ:**
   - Giữ nguyên các thuật toán tính toán S&OP: `DOI_Total`, `SOHQty`, `DailyUsage`, cơ chế đa ngôn ngữ (vi/en) và Factory Slicer.

---

## 🟢 3. DANH MỤC CÁC TÍNH NĂNG ĐÃ HOÀN TẤT [DONE] (CẤM SỬA LẠI / DO NOT REFACTOR)

Các mục dưới đây đã được kiểm thử, nghiệm thu và deploy ổn định trên LXC 101. **AI không được tự ý sửa lại:**

- [x] **[DONE] Bảo mật mật khẩu Admin:**
  - Chuyển toàn bộ mật khẩu sang Bcrypt Hash chuẩn (10 salt rounds).
  - Đã xóa triệt để cột mật khẩu thô (plaintext) khỏi Database.
  - Mật khẩu Admin do Quản trị viên tự thiết lập và quản lý bí mật (Tuyệt đối không lưu vào mã nguồn/tài liệu).
- [x] **[DONE] Dọn dẹp Database (Clean Database Dump):**
  - Đã loại bỏ các bảng thừa không còn dùng trong `SQL_PremixTrackDB.sql` (`Fact_PurchaseOrder`, `Formula_BOM`, `Formula_BOM_Item`, `Dim_PIC`, `Fact_InterFactory_Transfer`).
- [x] **[DONE] Bảo mật RBAC Phân Quyền Nút Đổi Tài Khoản Demo:**
  - Nút *"Đổi Tài Khoản Demo (RBAC)"* trong Header đã được bảo vệ: **Chỉ hiển thị khi đang đăng nhập tài khoản Quản trị viên (`System_Admin` / `admin`)**. Các tài khoản khác bị khóa hoàn toàn.
- [x] **[DONE] Tái Thiết Kế Bento Grid Dashboard (`DashboardOverview.tsx`):**
  - **Khối 1 (4 thẻ KPI):** Tổng SOH khả dụng, Điểm nóng Nguy cấp (DOI < 7), Đơn hàng đang về (Inbound PO), Sức khỏe tồn kho (Avg DOI).
  - **Khối 2 (Cột Trái 65%):** Cán cân Cung - Cầu sử dụng `ComposedChart` của Recharts (Stack Bar SOH + PO, Line Nhu cầu 30 ngày).
  - **Khối 3 (Cột Phải 35%):** Xếp hạng điểm nóng tồn kho `BarChart` xoay dọc, đổ màu động (`Cell`) theo ngưỡng nguy cơ rủi ro.
- [x] **[DONE] Sửa Lỗi Giao Diện & Responsive Mobile:**
  - **Header:** Đã áp dụng `flex-1 min-w-0`, `truncate` và `shrink-0` để chữ *"Trung Tâm Điều Phối Cung Ứng"* không bao giờ bị gãy thành nhiều dòng trên điện thoại.
  - **Sidebar:** Đã sửa class thành `fixed lg:relative`, loại bỏ hoàn toàn thuộc tính `relative` gây khoảng trống ma (Ghost space 256px bên trái) trên giao diện Mobile.
- [x] **[DONE] Chức Năng Tự Phục Vụ Đổi Mật Khẩu (Self-Serve Password Change):**
  - Tạo endpoint riêng `POST /api/auth/change-password` cho phép mọi user đã đăng nhập tự đổi mật khẩu cá nhân.
  - Bắt buộc xác thực đúng mật khẩu hiện tại bằng `bcrypt.compare` trước khi băm và lưu mật khẩu mới.
- [x] **[DONE] Tối Ưu Script Deploy LXC 101 (`deploy_lxc101.sh`):**
  - Rút ngắn còn 3 bước: `git pull` -> `docker compose up -d --build` -> `docker compose ps`.
  - Không còn tự động chạy migrate database gây chậm hoặc xung đột dữ liệu.
- [x] **[DONE] Chuẩn Hóa Tên Thư Mục Làm Việc:**
  - Chuyển đổi tên thư mục dài chứa ký tự đặc biệt sang: `C:\Users\NamArg\antigravity\PremixTrack-FE`.
- [x] **[DONE] Bảo Mật Tầng Giao Vận - Chống Brute-Force (Rate Limiting):**
  - Đã cài đặt và áp dụng `express-rate-limit` trên route `/api/auth/login`.
  - Giới hạn tối đa **5 lần thử trong vòng 5 phút** từ 1 địa chỉ IP, vượt quá sẽ trả về mã HTTP 429 và thông báo tiếng Việt rõ ràng.
- [x] **[DONE] Bảo Mật Phiên Đăng Nhập - HttpOnly Cookie (Chống XSS):**
  - Tích hợp `cookie-parser` vào Express.
  - Khi login thành công, token JWT được cấp phát an toàn qua HttpOnly Cookie (`httpOnly: true`, `sameSite: 'lax'`, `maxAge: 24h`).
  - `authMiddleware.ts` ưu tiên đọc token từ Cookie, có fallback dự phòng đọc header `Bearer` để tương thích ngược 100%.
  - Thêm route `POST /api/auth/logout` tự động xóa sạch Cookie khi người dùng bấm Đăng xuất.
  - Frontend (`apiClient.ts` & `LoginGate.tsx`) tự động gửi cookie bằng `credentials: 'include'`.

---

## ⏳ 4. KẾ HOẠCH PHÁT TRIỂN TIẾP THEO (BACKLOG & ROADMAP)

Chi tiết lộ trình mở rộng dài hạn xem tại: `ROADMAP_AND_ARCHITECTURE_AUDIT.md`. Các tính năng chuẩn bị làm tiếp:

1. **Sprint 1 - Tối ưu Bundle & Tốc độ tải trang:**
   - [ ] Áp dụng `React.lazy()` (Code-splitting) cho các tab nặng (`PositionMatrixView`, `MasterDataManagement`, `AiSupplyChainAdvisor`) để hạ kích thước file JS từ 1.5MB xuống dưới 500KB.
2. **Sprint 2 - Quản trị & Kiểm toán:**
   - [ ] Xây dựng bảng `sys_Audit_Log` lưu vết lịch sử thao tác của User (Ai đã duyệt điều chuyển kho, ai đã chỉnh sửa Master Data).
   - [ ] Viết bộ Unit Test tự động (Vitest) cho các thuật toán tính toán S&OP.
3. **Sprint 3 - Trải nghiệm nâng cao:**
   - [ ] Thiết kế Card View cho Mobile đối với các bảng ma trận nhiều cột.
   - [ ] Cảnh báo tự động qua Telegram/Zalo Webhook khi có nhà máy bị cạn hàng (`DOI < 7 ngày`).
