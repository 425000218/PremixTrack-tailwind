const fs = require('fs');

function fixFile(filePath, transforms) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [from, to] of transforms) {
    if (content.includes(from)) {
      content = content.replaceAll(from, to);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully fixed: ${filePath}`);
  }
}

// 1. MaterialsTab.tsx
fixFile('src/components/masterdata/tabs/MaterialsTab.tsx', [
  ['b?n ghi T?n kho th?c t? (SOH) t?i cc nh my', 'bản ghi Tồn kho thực tế (SOH) tại các nhà máy'],
  ['dng D? bo nhu c?u k? ho?ch (Forecast)', 'dòng Dự báo nhu cầu kế hoạch (Forecast)'],
  ['Cng th?c s?n xu?t (Formula BOM) dang s? d?ng', 'Công thức sản xuất (Formula BOM) đang sử dụng'],
  ['nh?t k Tiu hao s?n xu?t (Usage Logs)', 'nhật ký Tiêu hao sản xuất (Usage Logs)'],
  ['on d?t hng mua (PO Details)', 'Đơn đặt hàng mua (PO Details)'],
  ['reasons.push(`${subCount} quy t?c trong Ma Tr?n Thay Th? Nguyn Li?u (Substitution Rules)`);', 'reasons.push(`${subCount} quy tắc trong Ma Trận Thay Thế Nguyên Liệu (Substitution Rules)`);'],
  ["CountryOfOrigin: m.CountryOfOrigin || 'Vi?t Nam'", "CountryOfOrigin: m.CountryOfOrigin || 'Việt Nam'"]
]);

// 2. SubstitutionsTab.tsx
fixFile('src/components/masterdata/tabs/SubstitutionsTab.tsx', [
  ["if (confirm('Xc nh?n xa quy t?c thay th? ny?')) {", "if (confirm('Xác nhận xóa quy tắc thay thế này?')) {"]
]);

// 3. ConfirmActionModal.tsx
fixFile('src/components/shared/ConfirmActionModal.tsx', [
  ["confirmLabel = 'Xc Nh?n'", "confirmLabel = 'Xác Nhận'"],
  ["cancelLabel = 'H?y B?'", "cancelLabel = 'Hủy Bỏ'"]
]);

// 4. EmptyDataPlaceholder.tsx
fixFile('src/components/shared/EmptyDataPlaceholder.tsx', [
  ["title = 'Khng c d? li?u'", "title = 'Không có dữ liệu'"],
  ["description = 'Chua c b?n ghi no ph h?p v?i di?u ki?n tm ki?m ho?c d? li?u chua du?c n?p.'", "description = 'Chưa có bản ghi nào phù hợp với điều kiện tìm kiếm hoặc dữ liệu chưa được nạp.'"]
]);

// 5. ErrorBoundary.tsx
fixFile('src/components/shared/ErrorBoundary.tsx', [
  ['<h1 className="text-lg font-bold text-white">Đã Xảy Ra Sự Cố Hiển Thị Giao Diện</h1>', '<h1 className="text-lg font-bold text-white">Đã Xảy Ra Sự Cố Hiển Thị Giao Diện</h1>'],
  ['<h1 className="text-lg font-bold text-white"> X?y Ra S? C? Hi?n Th? Giao Di?n</h1>', '<h1 className="text-lg font-bold text-white">Đã Xảy Ra Sự Cố Hiển Thị Giao Diện</h1>'],
  ['<span>Khi Ph?c & T?i L?i Trang</span>', '<span>Khôi Phục & Tải Lại Trang</span>']
]);

// 6. FilterBar.tsx
fixFile('src/components/shared/FilterBar.tsx', [
  ["placeholder = 'Tm ki?m...'", "placeholder = 'Tìm kiếm...'"]
]);

// 7. authRoutes.ts
fixFile('server/routes/authRoutes.ts', [
  ["message: 'Vui lng nh?p d?y d? Tn dang nh?p v M?t kh?u.'", "message: 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.'"],
  ["message: 'Tn dang nh?p ho?c m?t kh?u khng chnh xc.'", "message: 'Tên đăng nhập hoặc mật khẩu không chính xác.'"],
  ["message: 'Ti kho?n ny dang b? kha. Vui lng lin h? Qu?n tr? vin (Admin).'", "message: 'Tài khoản này đang bị khóa. Vui lòng liên hệ Quản trị viên (Admin).'"]
]);

// 8. positionRoutes.ts
fixFile('server/routes/positionRoutes.ts', [
  ["`Tnh ton hon t?t cho ngy ${snapshotDate}`", "`Tính toán hoàn tất cho ngày ${snapshotDate}`"],
  ["label: isEnterprise ? 'Nhm NL' : 'RM Group'", "label: isEnterprise ? 'Nhóm NL' : 'RM Group'"],
  ["label: isEnterprise ? 'Ngnh' : 'Division'", "label: isEnterprise ? 'Ngành' : 'Division'"],
  ["label: isEnterprise ? 'Nh My' : 'FACTORY'", "label: isEnterprise ? 'Nhà Máy' : 'FACTORY'"],
  ["label: isEnterprise ? 'M SKU' : 'Item number'", "label: isEnterprise ? 'Mã SKU' : 'Item number'"],
  ["label: isEnterprise ? 'Tn Nguyn Li?u' : 'Product name'", "label: isEnterprise ? 'Tên Nguyên Liệu' : 'Product name'"],
  ["label: isEnterprise ? 'Ph? Trch' : 'PIC'", "label: isEnterprise ? 'Phụ Trách' : 'PIC'"],
  ["label: isEnterprise ? 'T?n Kho SOH (kg)' : 'SOH'", "label: isEnterprise ? 'Tồn Kho SOH (kg)' : 'SOH'"],
  ["label: isEnterprise ? 'K? Ho?ch Thng (kg)' : 'Usage/month'", "label: isEnterprise ? 'Kế Hoạch Tháng (kg)' : 'Usage/month'"],
  ["label: isEnterprise ? '% Ti?n ? Dng' : '% Used Usage'", "label: isEnterprise ? '% Tiến Độ Dùng' : '% Used Usage'"],
  ["label: isEnterprise ? '?nh M?c / Ngy' : 'Usage/Day'", "label: isEnterprise ? 'Định Mức / Ngày' : 'Usage/Day'"],
  ["label: isEnterprise ? 'Ngy T?n SOH (Plan)' : 'Covered day Usage'", "label: isEnterprise ? 'Ngày Tồn SOH (Plan)' : 'Covered day Usage'"],
  ["label: isEnterprise ? 'Ngy T?n SOH (MTD)' : 'Covered day MTD'", "label: isEnterprise ? 'Ngày Tồn SOH (MTD)' : 'Covered day MTD'"],
  ["label: isEnterprise ? 'Ngy H?t Hng SOH' : 'Coverage till (1)'", "label: isEnterprise ? 'Ngày Hết Hàng SOH' : 'Coverage till (1)'"],
  ["label: isEnterprise ? 'Lu?ng B ?p (Arrange)' : 'Arrange More'", "label: isEnterprise ? 'Lượng Bù Đắp (Arrange)' : 'Arrange More'"],
  ["label: isEnterprise ? 'Ngy T?n Sau B' : 'Covered day (2)'", "label: isEnterprise ? 'Ngày Tồn Sau Bù' : 'Covered day (2)'"],
  ["label: isEnterprise ? 'PO ang V? (kg)' : 'PO PENDING'", "label: isEnterprise ? 'PO Đang Về (kg)' : 'PO PENDING'"],
  ["label: isEnterprise ? 'T?ng Ngy Che Ph?' : 'Covered day (3)'", "label: isEnterprise ? 'Tổng Ngày Che Phủ' : 'Covered day (3)'"],
  ["label: isEnterprise ? 'Ngy B?o V? T?i a' : 'Coverage till (2)'", "label: isEnterprise ? 'Ngày Bảo Vệ Tối Đa' : 'Coverage till (2)'"]
]);

console.log('Thorough fix finished.');
