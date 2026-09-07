# 🧭 BẢN ĐÁNH GIÁ CHẤT LƯỢNG & LỘ TRÌNH PHÁT TRIỂN MODULE PREMIXTRACK
> **Dự án:** PremixTrack - Quản Lý Chuỗi Cung Ứng & Nguyên Liệu Premix Toàn Quốc  
> **Phiên bản hiện tại:** v1.2 (Production Ready - LXC 101)  
> **Ngày cập nhật:** 06/09/2026  
> **Tiêu chuẩn tham chiếu:** ISO/IEC 25010 (Software Product Quality) & 12-Factor App  

---

## 🏆 1. BẢNG ĐÁNH GIÁ ĐIỂM CHUẨN KỸ THUẬT (ISO/IEC 25010)

| Tiêu Chí Đánh Giá | Trọng Số | Điểm Số | Xếp Loại | Đánh Giá Tóm Tắt |
|---|:---:|:---:|:---:|---|
| **1. Tính Phù Hợp Nghiệp Vụ (Functional Suitability)** | 20% | **9.2 / 10** | 🟢 Xuất sắc | Đầy đủ nghiệp vụ thực tế: S&OP, DOI, SOH, Inbound, Cân đối & Điều chuyển 22 nhà máy. |
| **2. Hiệu Năng & Tối Ưu (Performance Efficiency)** | 15% | **8.2 / 10** | 🟢 Tốt | Vite + TS chạy mượt; cần code-splitting để giảm bundle size frontend (~1.5MB). |
| **3. An Toàn & Bảo Mật (Security)** | 20% | **8.8 / 10** | 🟢 Tốt | Bcrypt hash, JWT Auth, RBAC middleware, self-serve password change. Cần thêm Rate Limit. |
| **4. Trải Nghiệm Giao Diện (Usability / UX)** | 15% | **8.8 / 10** | 🟢 Tốt | Bento Grid hiện đại, Recharts trực quan, song ngữ Vi/En. Cần tối ưu bảng ma trận trên mobile. |
| **5. Khả Năng Vận Hành & DevOps (Maintainability)** | 15% | **8.5 / 10** | 🟢 Tốt | Docker Multi-stage, Proxmox LXC 101/102/100, Script deploy tự động tối ưu 3 bước. |
| **6. Kiểm Thử Tự Động (Reliability & Testing)** | 15% | **6.0 / 10** | 🟡 Cần bổ sung | Chưa có bộ kiểm thử tự động (Unit / Integration Tests) cho các hàm tính toán trọng yếu. |
| **TỔNG ĐIỂM TRUNG BÌNH (OVERALL SCORE)** | **100%** | **8.3 / 10** | ⭐ **Enterprise Ready** |

---

## 🧩 2. BẢN ĐỒ PHÂN RÃ MODULE HỆ THỐNG (SYSTEM MODULAR BREAKDOWN)

Để quản lý và mở rộng dự án lâu dài mà không bị xung đột khi nhiều người tham gia code, codebase được phân chia thành **6 Module độc lập**:

```
PremixTrack Codebase
├── 📊 Module 1: Dashboard & Analytics Engine
├── ⚖️ Module 2: Supply-Demand Matrix & Inter-Factory Transfer
├── 🚚 Module 3: Inbound Logistics & Warehouse Receiving
├── 📚 Module 4: Master Data Management & Excel Dynamic Mapper
├── 🔐 Module 5: Authentication, Security & RBAC
└── 🤖 Module 6: AI Supply Chain Advisor (Gemini)
```

### 📊 Module 1: Dashboard & Analytics Engine
- **Mục tiêu:** Cung cấp bức tranh toàn cảnh S&OP theo thời gian thực.
- **Thành phần chính:**
  - `src/components/DashboardOverview.tsx`: Khung Bento Grid 4 thẻ KPI, Biểu đồ cân đối Cung - Cầu (ComposedChart), Xếp hạng điểm nóng DOI (BarChart).
  - `src/components/DashboardFactorySlicer.tsx`: Bộ lọc nhà máy toàn quốc (22 nhà máy, Gia Súc / Thủy Sản).
  - `src/utils/calculations.ts`: Thuật toán tính toán SOH, DOI ngày khả dụng, phân loại mức độ rủi ro (<7 ngày, <15 ngày, an toàn, dư thừa).

### ⚖️ Module 2: Supply-Demand Matrix & Inter-Factory Transfer
- **Mục tiêu:** Phát hiện nhà máy thiếu hụt và sinh đề xuất điều chuyển kho tối ưu cước phí.
- **Thành phần chính:**
  - `src/components/PositionMatrixView.tsx`: Bảng ma trận vị thế chi tiết theo từng nhà máy và từng nguyên liệu.
  - `src/components/InterFactoryTransferModal.tsx`: Phiếu điều động nội bộ, xác nhận xe tải, cước vận chuyển, trừ SOH kho xuất và cộng SOH kho nhập.
  - `server/routes/transferRoutes.ts`: API quản lý vòng đời lệnh chuyển kho (Pending -> Approved -> In-Transit -> Completed).

### 🚚 Module 3: Inbound Logistics & Warehouse Receiving
- **Mục tiêu:** Theo dõi các lô hàng mua đang trên đường về và quản lý tiếp nhận tại trạm cân.
- **Thành phần chính:**
  - `src/components/InboundScheduleTab.tsx`: Danh sách PO Inbound, ngày dự kiến cập cảng/kho, trạng thái thanh toán LC/TT.
  - `src/components/ReceiveShipmentModal.tsx`: Xác nhận khối lượng thực tế cân tại cổng, gán số Lot/Batch và tự động cập nhật tồn kho tức thời.

### 📚 Module 4: Master Data & Excel Dynamic Mapper
- **Mục tiêu:** Quản lý dữ liệu gốc và chuyển hóa các báo cáo Excel thô từ D365 Finance & Operations.
- **Thành phần chính:**
  - `src/components/MasterDataManagement.tsx`: Danh mục SKU Premix, Nhà máy, Nhà cung cấp, Tỷ lệ thay thế (Substitution BOM).
  - `src/components/ExcelImportModal.tsx`: Cơ chế Dynamic Header Mapping tự học từ điển cột Excel để nạp dữ liệu không cần sửa format file gốc.
  - `server/routes/importRoutes.ts`: Tầng xử lý backend cho nạp và chuẩn hóa dữ liệu Excel.

### 🔐 Module 5: Authentication, Security & RBAC
- **Mục tiêu:** Bảo vệ tài nguyên, phân quyền đa cấp bậc và quản trị định danh người dùng.
- **Thành phần chính:**
  - `server/routes/authRoutes.ts`: Đăng ký, Đăng nhập, Tự đổi mật khẩu (Bcrypt), CRUD tài khoản.
  - `server/middleware/authMiddleware.ts`: Xác thực JWT Token và chặn quyền Admin/Role.
  - `src/components/UserManagementModal.tsx`: Giao diện duyệt tài khoản, phân quyền vai trò (Admin, Supply Planner, Plant Manager, Viewer).
  - `src/components/UserProfileModal.tsx`: Quản lý hồ sơ cá nhân và đổi mật khẩu tự phục vụ.

### 🤖 Module 6: AI Supply Chain Advisor
- **Mục tiêu:** Trợ lý ảo AI phân tích cảnh báo đứt gãy chuỗi cung ứng và đề xuất quyết định thông minh.
- **Thành phần chính:**
  - `server/services/geminiService.ts`: Tích hợp Google Gemini API phân tích báo cáo S&OP.
  - `src/components/AIAdvisorChat.tsx`: Cửa sổ trò chuyện trực tiếp để hỏi đáp dữ liệu tồn kho bằng ngôn ngữ tự nhiên.

---

## 🚀 3. LỘ TRÌNH TRIỂN KHAI PHÁT TRIỂN (DEVELOPMENT ROADMAP)

### 🟢 GIAI ĐOẠN 1: Tối Ưu Hiệu Năng & Làm Sạch Codebase (Sprint 1)
- [ ] **Code-Splitting (Tải động):** Áp dụng `React.lazy()` cho các tab nặng (`PositionMatrixView`, `MasterDataManagement`, `AIAdvisorChat`), hạ bundle size từ 1.5MB xuống dưới 500KB.
- [ ] **Bảo vệ Brute-Force:** Tích hợp middleware `express-rate-limit` giới hạn tối đa 5 lần thử đăng nhập/phút trên route `/api/auth/login`.
- [ ] **Dọn dẹp mã nguồn tạm:** Xóa bỏ hoàn toàn các script phụ tạm thời trong thư mục `scratch/`.

### 🟡 GIAI ĐOẠN 2: Nhật Ký Kiểm Toán & Kiểm Thử Tự Động (Sprint 2)
- [ ] **Bảng Nhật Ký Hoạt Động (`sys_Audit_Log`):** Ghi nhận tự động vào MSSQL mỗi khi có thao tác nhạy cảm: Ai đã duyệt chuyển kho? Ai đã sửa công thức BOM? Ai đã đổi vai trò tài khoản?
- [ ] **Tích hợp Bộ Test Vitest:** Viết Unit Test tự động kiểm thử công thức:
  - Công thức tính `DOI_Total = (SOH + OpenPO) / DailyUsage`
  - Logic xác định trạng thái cảnh báo nguy cấp (Critical Hotspots)
  - Logic kiểm tra xung đột mật khẩu Bcrypt.

### 🔵 GIAI ĐOẠN 3: Tối Ưu Trải Nghiệm & Tự Động Hóa Vận Hành (Sprint 3)
- [ ] **Card View cho Mobile:** Khi người dùng mở trên Smartphone, các bảng nhiều cột (như Position Matrix) tự động chuyển sang dạng thẻ Card vuốt dọc trực quan.
- [ ] **Cảnh Báo Tự Động Qua Webhook:** Thiết lập webhook bắn thông báo tức thời về Telegram hoặc Zalo khi một nhà máy rơi vào ngưỡng cạn hàng (`DOI < 7 ngày`).
- [ ] **Tự Động Sao Lưu Database Định Kỳ:** Script sao lưu database MSSQL (LXC 102) sang ổ đĩa backup định kỳ hàng ngày.

---

## 📋 4. CHECKLIST AN TOÀN TRƯỚC MỖI LẦN DEPLOY (LXC 101)

Mỗi lần chuẩn bị deploy phiên bản mới lên máy chủ Production Proxmox LXC 101, cần đối chiếu:
1. **Kiểm tra biên dịch:** Đã chạy `node node_modules/typescript/bin/tsc --noEmit` và không có lỗi TypeScript.
2. **Kiểm tra bảo mật:** Không để lộ mật khẩu, JWT_SECRET trong code nguồn git.
3. **Database Migration:** Nếu có thay đổi bảng trong database, chạy thủ công lệnh:
   ```bash
   docker compose exec premixtrack-app npm run db:migrate
   ```
4. **Deploy Script:** Thực thi `./deploy_lxc101.sh` (Quy trình 3 bước không làm gián đoạn DB).
