const fs = require('fs');

const p = 'src/components/masterdata/tabs/MaterialsTab.tsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('reasons.push') && lines[i].includes('sohCount')) {
    lines[i] = '    if (sohCount > 0) reasons.push(`${sohCount} bản ghi Tồn kho thực tế (SOH) tại các nhà máy`);';
  } else if (lines[i].includes('reasons.push') && lines[i].includes('fcCount')) {
    lines[i] = '    if (fcCount > 0) reasons.push(`${fcCount} dòng Dự báo nhu cầu kế hoạch (Forecast)`);';
  } else if (lines[i].includes('reasons.push') && lines[i].includes('bomCount')) {
    lines[i] = '    if (bomCount > 0) reasons.push(`${bomCount} Công thức sản xuất (Formula BOM) đang sử dụng`);';
  } else if (lines[i].includes('reasons.push') && lines[i].includes('usageCount')) {
    lines[i] = '    if (usageCount > 0) reasons.push(`${usageCount} nhật ký Tiêu hao sản xuất (Usage Logs)`);';
  } else if (lines[i].includes('reasons.push') && lines[i].includes('poCount')) {
    lines[i] = '    if (poCount > 0) reasons.push(`${poCount} Đơn đặt hàng mua (PO Details)`);';
  } else if (lines[i].includes('reasons.push') && lines[i].includes('subCount')) {
    lines[i] = '      reasons.push(`${subCount} quy tắc trong Ma Trận Thay Thế Nguyên Liệu (Substitution Rules)`);';
  } else if (lines[i].includes('CountryOfOrigin: m.CountryOfOrigin')) {
    lines[i] = "      CountryOfOrigin: m.CountryOfOrigin || 'Việt Nam',";
  }
}

fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Fixed MaterialsTab.tsx cleanly!');
