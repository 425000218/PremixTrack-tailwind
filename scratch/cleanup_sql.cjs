
const fs = require('fs');

const file = 'SQL_PremixTrackDB.sql';
let content = fs.readFileSync(file, 'utf8');

const tablesToRemove = [
  '[dbo].[Fact_Forecast_Header]',
  '[dbo].[Dim_PIC]',
  '[dbo].[Fact_InterFactory_Transfer]',
  '[dbo].[Fact_PurchaseOrder]',
  '[dbo].[Formula_BOM]',
  '[dbo].[Formula_BOM_Item]'
];

let lines = content.split('\n');
let newLines = [];
let skipMode = false;
let currentTable = '';

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  // Check if this line starts a block for a table to remove
  let isTargetTable = false;
  for (let table of tablesToRemove) {
    if (line.includes(table)) {
      isTargetTable = true;
      currentTable = table;
      break;
    }
  }

  if (line.startsWith('CREATE TABLE ') && isTargetTable) {
    skipMode = true;
    continue;
  }

  // If we hit GO, and we are skipping, we stop skipping (CREATE TABLE block ends with GO)
  if (line.trim() === 'GO' && skipMode) {
    skipMode = false;
    continue; // skip the GO
  }

  // Skip INSERTs
  if (line.startsWith('INSERT ') && isTargetTable) {
    continue; // skip insert, but no GO usually, just one line
  }

  // Skip ALTER TABLE
  if (line.startsWith('ALTER TABLE ') && isTargetTable) {
    // ALTER TABLE usually followed by some constraint, wait, it might not have GO immediately.
    // Actually, SQL Server script usually puts GO after each ALTER TABLE.
    continue;
  }

  // Skip /****** Object:  Table [dbo].[xxx] ... block
  if (line.startsWith('/****** Object:') && isTargetTable) {
    continue;
  }

  if (!skipMode) {
    newLines.push(line);
  }
}

fs.writeFileSync('SQL_PremixTrackDB_Cleaned.sql', newLines.join('\n'));
console.log('Cleaned file saved to SQL_PremixTrackDB_Cleaned.sql');

