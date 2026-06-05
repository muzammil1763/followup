const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const workbook = XLSX.readFile('KSA UAE CITY LIST 2025 UPDATED.xlsx');

console.log('Sheet names:', workbook.SheetNames);

// Get KSA cities from first sheet
const ksaSheet = workbook.Sheets[workbook.SheetNames[0]];
const ksaRange = XLSX.utils.decode_range(ksaSheet['!ref']);
const ksaCities = [];

for (let row = 1; row <= ksaRange.e.r; row++) {
  const cell = ksaSheet[XLSX.utils.encode_cell({ r: row, c: 1 })]; // Column B
  if (cell && cell.v) {
    const value = cell.v.toString().trim();
    if (value && value !== 'KSA' && value !== 'CITY NAMES') {
      ksaCities.push(value);
    }
  }
}

// Get UAE cities from second sheet
const uaeCities = [];
if (workbook.SheetNames.length > 1) {
  const uaeSheet = workbook.Sheets[workbook.SheetNames[1]];
  const uaeRange = XLSX.utils.decode_range(uaeSheet['!ref']);
  
  for (let row = 1; row <= uaeRange.e.r; row++) {
    const cell = uaeSheet[XLSX.utils.encode_cell({ r: row, c: 1 })]; // Column B
    if (cell && cell.v) {
      const value = cell.v.toString().trim();
      if (value && value !== 'UAE' && value !== 'CITY NAMES') {
        uaeCities.push(value);
      }
    }
  }
}

console.log('KSA Cities:', ksaCities.length);
console.log('UAE Cities:', uaeCities.length);

const output = {
  KSA: ksaCities,
  UAE: uaeCities
};

fs.writeFileSync('cities-extracted.json', JSON.stringify(output, null, 2));
console.log('First 5 KSA:', ksaCities.slice(0, 5));
console.log('First 5 UAE:', uaeCities.slice(0, 5));
