# 🔒 REFACTORING SAFETY RULES — BẮT BUỘC TUÂN THỦ (PREMIXTRACK)

---

## 1. Mục tiêu chính

Đây là **REFACTORING**, không phải REWRITE.

Mục tiêu duy nhất là:

* Tách nhỏ các file/component/backend module quá lớn.
* Cải thiện cấu trúc thư mục.
* Tăng khả năng bảo trì và mở rộng.
* Giảm độ phức tạp của từng file.
* **Giữ nguyên toàn bộ chức năng hiện tại của hệ thống.**

Không được tự ý thay đổi business logic hoặc hành vi của ứng dụng trong quá trình refactoring.

---

## 2. 🚫 TUYỆT ĐỐI KHÔNG THAY ĐỔI

Trong quá trình PM2 và PM1, **KHÔNG được tự ý thay đổi**:

### Frontend

* UI/UX hiện tại.
* Layout.
* Styling.
* CSS/Tailwind class.
* Tên component đang được sử dụng bên ngoài.
* Props contract.
* State behavior.
* Filter.
* Search.
* Sort.
* Pagination.
* Modal behavior.
* Form validation.
* Loading state.
* Error state.
* Empty state.
* Toast/notification.
* Export Excel.
* Import Excel/CSV.
* Các API call hiện tại.
* Authentication/authorization behavior.

### Backend

* API endpoint.
* HTTP method.
* Request body.
* Query parameters.
* Response JSON structure.
* HTTP status code.
* Error response structure.
* Authentication.
* Authorization.
* Session/token behavior.
* Database queries.
* Database schema.
* Business rules.
* Validation rules.
* Gemini AI behavior.
* Gemini fallback behavior.

**Nếu không bắt buộc để thực hiện refactoring thì KHÔNG được sửa.**

---

## 3. 🔌 API CONTRACT MUST REMAIN IDENTICAL

Sau PM1, tất cả API hiện tại phải tiếp tục hoạt động với **cùng contract**.

Ví dụ:

```text
POST /api/...
GET /api/...
PUT /api/...
DELETE /api/...
```

Không được tự ý:

* Đổi URL.
* Đổi method.
* Đổi tên field.
* Đổi kiểu dữ liệu.
* Đổi response structure.
* Đổi status code.
* Đổi cách authentication hoạt động.

Frontend hiện tại phải có thể tiếp tục gọi backend **mà không cần sửa App.tsx hoặc các API client hiện tại chỉ vì lý do refactoring**.

---

## 4. 🧩 PROPS CONTRACT MUST REMAIN COMPATIBLE

Khi tách component:

* Giữ nguyên Props Interface hiện tại nếu có thể.
* Không đổi tên props.
* Không đổi kiểu dữ liệu props.
* Không đổi default behavior.
* Không làm mất callback.
* Không làm thay đổi thứ tự hoặc logic xử lý event.

Nếu bắt buộc phải tạo interface mới cho component con, phải đảm bảo component cha vẫn cung cấp đúng dữ liệu và behavior như trước.

---

## 5. 🧠 BUSINESS LOGIC MUST NOT MOVE INCORRECTLY

Có thể **di chuyển code** sang file/module khác.

Nhưng không được **thay đổi logic**.

Việc di chuyển logic là được phép.

Nhưng công thức, điều kiện, rounding, validation, fallback... không được tự ý thay đổi nếu không nằm trong mục tiêu refactoring.

---

## 6. 🛡️ PRESERVE EDGE CASES

Phải giữ nguyên behavior đối với các trường hợp:

* Không có dữ liệu.
* Dữ liệu rỗng.
* Dữ liệu null/undefined.
* API lỗi.
* API timeout.
* Gemini API lỗi.
* Gemini API không trả kết quả.
* Import file lỗi.
* File sai format.
* Duplicate data.
* Invalid input.
* Permission denied.
* Unauthorized request.
* Database không có record.

**Không được đơn giản hóa code bằng cách loại bỏ các edge case hiện tại.**

---

## 7. 🤖 GEMINI AI & FALLBACK MUST REMAIN FUNCTIONALLY IDENTICAL

Khi tách `geminiService.ts`:

* Giữ nguyên prompt hiện tại.
* Giữ nguyên model configuration.
* Giữ nguyên API configuration.
* Giữ nguyên request format.
* Giữ nguyên response parsing.
* Giữ nguyên error handling.
* Giữ nguyên fallback generator.
* Giữ nguyên điều kiện kích hoạt fallback.

Việc tách file chỉ nhằm cô lập AI logic.

**Không được nhân cơ hội này để redesign AI system.**

---

## 8. 📦 IMPORT PATHS

Khi di chuyển file:

* Cập nhật toàn bộ import liên quan.
* Không để lại import path chết.
* Không tạo duplicate component.
* Không tạo circular dependency nếu có thể tránh.
* Không giữ hai phiên bản của cùng một component chỉ để "cho chắc".

Sau khi refactoring phải kiểm tra:

```text
Unused imports
Unused exports
Broken imports
Circular dependencies
Duplicate components
Dead code
```

---

## 9. 🧪 BUILD MUST PASS

Sau mỗi giai đoạn refactoring phải chạy build/type checking phù hợp với project:

```bash
node "node_modules/vite/bin/vite.js" build
node "node_modules/esbuild/bin/esbuild" server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs
```

**Không được coi task hoàn thành nếu build bị lỗi.**

---

## 10. 🔍 CHECK BEFORE DELETE

Không được xóa file/code cũ ngay sau khi tách.

Quy trình:

```text
1. Copy/move logic
2. Update imports
3. Build
4. Test
5. Verify behavior
6. Chỉ sau đó mới xóa code cũ
```

Không được xóa code chỉ vì cho rằng "không còn dùng". Phải kiểm tra reference trước.

---

## 11. 📝 ONE CHANGE GROUP AT A TIME

Không thực hiện quá nhiều thay đổi không liên quan trong cùng một bước.

Ưu tiên theo từng bước kiểm soát:

```text
PM2.1: MasterDataManagement (Tách tabs & modals)
  ↓
Build/Test
  ↓
PM2.2: ForecastManagement (Tách version/compare/detail)
  ↓
Build/Test
  ↓
PM2.3: Shared Components
  ↓
Build/Test
  ↓
PM1.1: Backend Routes (Express Router)
  ↓
Build/Test
  ↓
PM1.2: Gemini Service
  ↓
Build/Test
```

Nếu một bước phát sinh lỗi, **dừng tại bước đó và sửa trước khi tiếp tục.**

---

## 12. 🚨 STOP CONDITIONS

AI agent phải **DỪNG và báo cáo**, không tự ý tiếp tục nếu phát hiện:

* Business logic không rõ.
* Có nhiều implementation khác nhau của cùng một logic.
* Không xác định được component nào đang được sử dụng.
* API contract không rõ.
* Có dependency vòng.
* Build đang lỗi từ trước và không xác định được nguyên nhân.
* Refactoring có nguy cơ làm thay đổi behavior.
* Không chắc một đoạn code có thể xóa hay không.
* Phát hiện bug hiện tại nhưng bug đó không liên quan trực tiếp đến refactoring.

Trong các trường hợp trên:

> **KHÔNG tự ý sửa ngoài scope. Hãy báo cáo vấn đề và chờ APPROVAL.**

---

## 13. 🧹 KHÔNG "CLEAN UP" NGOÀI SCOPE

Trong quá trình refactoring, không tự ý:

* Đổi tên hàng loạt file.
* Đổi naming convention toàn project.
* Đổi database.
* Đổi framework.
* Đổi package.
* Upgrade dependency.
* Đổi version Node.js.
* Đổi TypeScript configuration.
* Đổi ESLint/Prettier configuration.
* Đổi Tailwind configuration.
* Đổi authentication system.
* Đổi API architecture ngoài phạm vi PM1.
* Tối ưu performance không liên quan.
* Redesign UI.

Nếu phát hiện những vấn đề này, **ghi chú lại thành TODO riêng**.

---

## 14. 📊 NO UNNECESSARY OPTIMIZATION

Không tối ưu code chỉ để giảm số dòng.

**Chất lượng cấu trúc quan trọng hơn số dòng.**

---

## 15. 💾 GIT SAFETY

Nếu Git repository đang được sử dụng:

Mỗi nhóm refactoring phải tạo một commit riêng:

```text
refactor(masterdata): split MasterDataManagement tabs and modals
refactor(forecast): split ForecastManagement components
refactor(shared): extract shared frontend components
refactor(server): split backend API routes into Express routers
refactor(ai): extract Gemini service and fallbacks
```

Không gộp tất cả PM1 + PM2 vào một commit khổng lồ.

---

## 16. 🔄 ROLLBACK PRINCIPLE

Nếu sau refactoring phát hiện behavior bị thay đổi:

> **Ưu tiên rollback thay vì tiếp tục chồng thêm workaround.**

Không được sửa một lỗi refactoring bằng cách tạo thêm nhiều thay đổi không liên quan.

---

## 17. ✅ DEFINITION OF DONE

Một task refactoring chỉ được coi là hoàn thành khi:

* [ ] Code đã được tách đúng trách nhiệm.
* [ ] Không thay đổi business logic.
* [ ] Không thay đổi API contract.
* [ ] Không thay đổi UI/UX ngoài ý muốn.
* [ ] Không mất chức năng hiện tại.
* [ ] Không có broken import.
* [ ] Không có duplicate implementation.
* [ ] TypeScript/build pass (`vite build` & `esbuild`).
* [ ] Test hiện có pass.
* [ ] Các API liên quan hoạt động bình thường.
* [ ] Gemini/Fallback vẫn hoạt động như trước.
* [ ] Không có thay đổi ngoài scope.
* [ ] Git diff đã được kiểm tra.
* [ ] Có thể rollback từng nhóm thay đổi.

---

## 🟢 NGUYÊN TẮC CUỐI CÙNG

> **Refactor safely, preserve behavior.**

Ưu tiên theo thứ tự:

1. **Không phá chức năng hiện tại**
2. **Không thay đổi business logic**
3. **Không thay đổi API contract**
4. **Không thay đổi UI/UX**
5. **Sau đó mới tối ưu cấu trúc code**
