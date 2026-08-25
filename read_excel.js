const xlsx = require('xlsx');

const workbook = xlsx.readFile('Tamil Nadu Research.xlsx');
console.log('Sheets:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    data.forEach(row => {
        console.log(row.join(' | '));
    });
});
