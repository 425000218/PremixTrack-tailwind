const fs = require('fs');

// SubstitutionsTab.tsx
{
  const p = 'src/components/masterdata/tabs/SubstitutionsTab.tsx';
  let lines = fs.readFileSync(p, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('confirm(') && (lines[i].includes('quy') || lines[i].includes('thay'))) {
      lines[i] = "    if (confirm('Xác nhận xóa quy tắc thay thế này?')) {";
    }
  }
  fs.writeFileSync(p, lines.join('\n'), 'utf8');
}

// ConfirmActionModal.tsx
{
  const p = 'src/components/shared/ConfirmActionModal.tsx';
  let lines = fs.readFileSync(p, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('confirmLabel =')) {
      lines[i] = "  confirmLabel = 'Xác Nhận',";
    } else if (lines[i].includes('cancelLabel =')) {
      lines[i] = "  cancelLabel = 'Hủy Bỏ',";
    }
  }
  fs.writeFileSync(p, lines.join('\n'), 'utf8');
}

// EmptyDataPlaceholder.tsx
{
  const p = 'src/components/shared/EmptyDataPlaceholder.tsx';
  let lines = fs.readFileSync(p, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('title =')) {
      lines[i] = "  title = 'Không có dữ liệu',";
    } else if (lines[i].includes('description =')) {
      lines[i] = "  description = 'Chưa có bản ghi nào phù hợp với điều kiện tìm kiếm hoặc dữ liệu chưa được nạp.',";
    }
  }
  fs.writeFileSync(p, lines.join('\n'), 'utf8');
}

// ErrorBoundary.tsx
{
  const p = 'src/components/shared/ErrorBoundary.tsx';
  let lines = fs.readFileSync(p, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('text-lg font-bold text-white') && lines[i].includes('h1')) {
      lines[i] = '          <h1 className="text-lg font-bold text-white">Đã Xảy Ra Sự Cố Hiển Thị Giao Diện</h1>';
    } else if (lines[i].includes('Kh') && lines[i].includes('Ph') && lines[i].includes('Trang')) {
      lines[i] = '              <span>Khôi Phục & Tải Lại Trang</span>';
    }
  }
  fs.writeFileSync(p, lines.join('\n'), 'utf8');
}

// FilterBar.tsx
{
  const p = 'src/components/shared/FilterBar.tsx';
  let lines = fs.readFileSync(p, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('placeholder =')) {
      lines[i] = "  placeholder = 'Tìm kiếm...',";
    }
  }
  fs.writeFileSync(p, lines.join('\n'), 'utf8');
}

// authRoutes.ts
{
  const p = 'server/routes/authRoutes.ts';
  let lines = fs.readFileSync(p, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('400') && lines[i].includes('message:')) {
      lines[i] = "      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.' });";
    } else if (lines[i].includes('401') && lines[i].includes('message:')) {
      lines[i] = "      return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });";
    } else if (lines[i].includes('403') && lines[i].includes('message:')) {
      lines[i] = "      return res.status(403).json({ success: false, message: 'Tài khoản này đang bị khóa. Vui lòng liên hệ Quản trị viên (Admin).' });";
    }
  }
  fs.writeFileSync(p, lines.join('\n'), 'utf8');
}

console.log('All remaining single files fixed cleanly!');
