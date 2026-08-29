const fs = require('fs');
const path = require('path');

const results = [];

function scan(dir) {
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const p = path.join(dir, item);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== '.git' && item !== 'dist' && item !== 'scratch') {
        scan(p);
      }
    } else if (/\.(tsx?|jsx?|json|sql)$/.test(item)) {
      const content = fs.readFileSync(p, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        // Find lines with corrupted unicode or question marks inside text
        const hasCorruptedChar = /\uFFFD/.test(line) || /[à-ỹa-zA-Z]+\?[à-ỹa-zA-Z]+/.test(line);
        // Find tags containing ? like <span>Thu G?n</span> or alert('...')
        const hasTagQuestion = />[^<]*\?[^<]*</.test(line) && !line.includes('?') && !line.includes(':') ? false : false;
        
        if (hasCorruptedChar || (line.includes('?') && (line.includes('<span>') || line.includes('alert(') || line.includes('confirm(') || line.includes('title=') || line.includes('placeholder=')))) {
          if (!line.includes('?') || line.includes('?') && !line.includes('?:') && !line.includes('?.') && !line.includes('===') && !line.includes('!==') && !line.includes('function') && !line.includes('import ') && !line.includes('export ')) {
            results.push({
              file: p,
              line: index + 1,
              content: line.trim()
            });
          }
        }
      });
    }
  }
}

scan('src');
scan('server');
fs.writeFileSync('scratch/mojibake_report.json', JSON.stringify(results, null, 2), 'utf8');
console.log(`Found ${results.length} potential issues. Saved to scratch/mojibake_report.json`);
