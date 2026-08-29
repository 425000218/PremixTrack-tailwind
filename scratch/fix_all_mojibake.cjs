const fs = require('fs');
const path = require('path');

// Dictionary of known Mojibake / Corrupted text replacements
const replacements = [
  // MasterData & Forecast
  [/Thu G\?n Header/g, 'Thu Gọn Header'],
  [/M\? R\?ng Header/g, 'Mở Rộng Header'],
  [/Ln d\?u b\?ng \(Home\)/g, 'Lên đầu bảng (Home)'],
  [/Xu\?ng cu\?i b\?ng \(End\)/g, 'Xuống cuối bảng (End)'],
  [/Vui lng ch\?n M nguyn li\?u v Nh my\./g, 'Vui lòng chọn Mã nguyên liệu và Nhà máy.'],
  [/Thm Dng Nguyn Li\?u M\?i \(Manual Add\)/g, 'Thêm Dòng Nguyên Liệu Mới (Manual Add)'],
  [/Ch\?nh S\?a Dng:/g, 'Chỉnh Sửa Dòng:'],
  [/C\?p nh\?t s\? li\?u Forecast chi ti\?t theo t\?ng ngy d\?t ch\?y c\?a R&amp;D\./g, 'Cập nhật số liệu Forecast chi tiết theo từng ngày đợt chạy của R&D.'],
  [/Nguyn Li\?u \(Material\)/g, 'Nguyên Liệu (Material)'],
  [/Nh My \/ Recipe Site/g, 'Nhà Máy / Recipe Site'],
  [/Tn Hi\?n Th\? \(DESC\)/g, 'Tên Hiển Thị (DESC)'],
  [/Ngnh \(Division\)/g, 'Ngành (Division)'],
  [/Gia sc \(Livestock\)/g, 'Gia súc (Livestock)'],
  [/Th\?y s\?n \(Aqua\)/g, 'Thủy sản (Aqua)'],
  [/Nh\?p Kh\?i Lu\?ng Forecast Theo T\?ng Ngy \(kg\)/g, 'Nhập Khối Lượng Forecast Theo Từng Ngày (kg)'],
  [/H\?y/g, 'Hủy'],
  [/Thm Dng M\?i/g, 'Thêm Dòng Mới'],
  [/Luu Thay \?i/g, 'Lưu Thay Đổi'],
  [/Lưu Thay \?i/g, 'Lưu Thay Đổi'],
  [/Khng th\? xa version duy nh\?t cn l\?i trong h\? th\?ng\./g, 'Không thể xóa version duy nhất còn lại trong hệ thống.'],
  [/Xc nh\?n xa b\?n ghi d\?t ch\?y Forecast ny\?/g, 'Xác nhận xóa bản ghi đợt chạy Forecast này?'],
  [/'M Nguyn Li\?u'/g, "'Mã Nguyên Liệu'"],
  [/'Tn Nguyn Li\?u'/g, "'Tên Nguyên Liệu'"],
  [/'on V\? Tnh'/g, "'Đơn Vị Tính'"],
  [/b\?n ghi T\?n kho th\?c t\? \(SOH\) t\?i cc nh my/g, 'bản ghi Tồn kho thực tế (SOH) tại các nhà máy'],
  [/dng D\? bo nhu c\?u k\? ho\?ch \(Forecast\)/g, 'dòng Dự báo nhu cầu kế hoạch (Forecast)'],
  [/Cng th\?c s\?n xu\?t \(Formula BOM\) dang s\? d\?ng/g, 'Công thức sản xuất (Formula BOM) đang sử dụng'],
  [/nh\?t k Tiu hao s\?n xu\?t \(Usage Logs\)/g, 'nhật ký Tiêu hao sản xuất (Usage Logs)'],
  [/on d\?t hng mua \(PO Details\)/g, 'Đơn đặt hàng mua (PO Details)'],
  [/quy t\?c trong Ma Tr\?n Thay Th\? Nguyn Li\?u \(Substitution Rules\)/g, 'quy tắc trong Ma Trận Thay Thế Nguyên Liệu (Substitution Rules)'],
  [/Vi\?t Nam/g, 'Việt Nam'],
  [/Xc nh\?n xa quy t\?c thay th\? ny\?/g, 'Xác nhận xóa quy tắc thay thế này?'],
  
  // Shared components
  [/confirmLabel = 'Xc Nh\?n'/g, "confirmLabel = 'Xác Nhận'"],
  [/cancelLabel = 'H\?y B\?'/g, "cancelLabel = 'Hủy Bỏ'"],
  [/title = 'Khng c d\? li\?u'/g, "title = 'Không có dữ liệu'"],
  [/description = 'Chua c b\?n ghi no ph h\?p v\?i di\?u ki\?n tm ki\?m ho\?c d\? li\?u chua du\?c n\?p\.'/g, "description = 'Chưa có bản ghi nào phù hợp với điều kiện tìm kiếm hoặc dữ liệu chưa được nạp.'"],
  [/ X\?y Ra S\? C\? Hi\?n Th\? Giao Di\?n/g, 'Đã Xảy Ra Sự Cố Hiển Thị Giao Diện'],
  [/Khi Ph\?c & T\?i L\?i Trang/g, 'Khôi Phục & Tải Lại Trang'],
  [/Trang Ch\?/g, 'Trang Chủ'],
  [/label = 'T\?i Data Excel'/g, "label = 'Tải Data Excel'"],
  [/title=\"T\?i template Excel m\?u\"/g, 'title="Tải template Excel mẫu"'],
  [/<span>T\?i Template<\/span>/g, '<span>Tải Template</span>'],
  [/title=\"Xu\?t d\? li\?u ra file Excel\"/g, 'title="Xuất dữ liệu ra file Excel"'],
  [/placeholder = 'Tm ki\?m\.\.\.'/g, "placeholder = 'Tìm kiếm...'"],

  // Backend / Server routes
  [/Vui lng nh\?p d\?y d\? Tn dang nh\?p v M\?t kh\?u\./g, 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.'],
  [/Tn dang nh\?p ho\?c m\?t kh\?u khng chnh xc\./g, 'Tên đăng nhập hoặc mật khẩu không chính xác.'],
  [/Ti kho\?n ny dang b\? kha\. Vui lng lin h\? Qu\?n tr\? vin \(Admin\)\./g, 'Tài khoản này đang bị khóa. Vui lòng liên hệ Quản trị viên (Admin).'],
  [/Tnh ton hon t\?t cho ngy/g, 'Tính toán hoàn tất cho ngày'],
  [/'Khu V\?c'/g, "'Khu Vực'"],
  [/'Nhm NL'/g, "'Nhóm NL'"],
  [/'Ngnh'/g, "'Ngành'"],
  [/'Nh My'/g, "'Nhà Máy'"],
  [/'M SKU'/g, "'Mã SKU'"],
  [/'Tn Nguyn Li\?u'/g, "'Tên Nguyên Liệu'"],
  [/'Ph\? Trch'/g, "'Phụ Trách'"],
  [/'T\?n Kho SOH \(kg\)'/g, "'Tồn Kho SOH (kg)'"],
  [/'K\? Ho\?ch Thng \(kg\)'/g, "'Kế Hoạch Tháng (kg)'"],
  [/'% Ti\?n \? Dng'/g, "'% Tiến Độ Dùng'"],
  [/'\?nh M\?c \/ Ngy'/g, "'Định Mức / Ngày'"],
  [/'Ngy T\?n SOH \(Plan\)'/g, "'Ngày Tồn SOH (Plan)'"],
  [/'Ngy T\?n SOH \(MTD\)'/g, "'Ngày Tồn SOH (MTD)'"],
  [/'Ngy H\?t Hng SOH'/g, "'Ngày Hết Hàng SOH'"],
  [/'Lu\?ng B\? \?p \(Arrange\)'/g, "'Lượng Bù Đắp (Arrange)'"],
  [/'Lu\?ng B \?p \(Arrange\)'/g, "'Lượng Bù Đắp (Arrange)'"],
  [/'Ngy T\?n Sau B\?'/g, "'Ngày Tồn Sau Bù'"],
  [/'Ngy T\?n Sau B'/g, "'Ngày Tồn Sau Bù'"],
  [/'PO ang V\? \(kg\)'/g, "'PO Đang Về (kg)'"],
  [/'T\?ng Ngy Che Ph\?'/g, "'Tổng Ngày Che Phủ'"],
  [/'Ngy B\?o V\? T\?i a'/g, "'Ngày Bảo Vệ Tối Đa'"],
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist' && f !== 'scratch') {
        processDir(full);
      }
    } else if (/\.(tsx?|jsx?|json|sql)$/.test(f)) {
      let content = fs.readFileSync(full, 'utf8');
      let changed = false;
      for (const [pattern, repl] of replacements) {
        if (pattern.test(content)) {
          content = content.replace(pattern, repl);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(full, content, 'utf8');
        console.log(`[FIXED] ${full}`);
      }
    }
  }
}

processDir('src');
processDir('server');
console.log('All replacements completed.');
