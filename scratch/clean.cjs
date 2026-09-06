
const fs = require('fs');

let content = fs.readFileSync('SQL_PremixTrackDB.utf8.sql', 'utf8');

const tablesToRemove = [
  'Fact_Forecast_Header',
  'Dim_PIC',
  'Fact_InterFactory_Transfer',
  'Fact_PurchaseOrder',
  'Formula_BOM',
  'Formula_BOM_Item'
];

for (const tbl of tablesToRemove) {
  // Regex to match CREATE TABLE [dbo].[tbl] ... GO
  const createRegex = new RegExp('CREATE TABLE \\\\[dbo\\\\]\\\\.\\\\[' + tbl + '\\\\][\\\\s\\\\S]*?GO\\\\s+', 'gi');
  content = content.replace(createRegex, '');

  // Regex to match INSERT ...
  const insertRegex = new RegExp('INSERT \\\\[dbo\\\\]\\\\.\\\\[' + tbl + '\\\\].*?\\\\n', 'gi');
  content = content.replace(insertRegex, '');

  // Regex to match ALTER TABLE ... GO
  const alterGoRegex = new RegExp('ALTER TABLE \\\\[dbo\\\\]\\\\.\\\\[' + tbl + '\\\\][\\\\s\\\\S]*?GO\\\\s+', 'gi');
  content = content.replace(alterGoRegex, '');

  // Regex to match ALTER TABLE ... (single line without GO)
  const alterLineRegex = new RegExp('ALTER TABLE \\\\[dbo\\\\]\\\\.\\\\[' + tbl + '\\\\].*?\\\\n', 'gi');
  content = content.replace(alterLineRegex, '');
}

fs.writeFileSync('SQL_PremixTrackDB.sql', content, 'utf8');
console.log('Done cleaning SQL file.');

