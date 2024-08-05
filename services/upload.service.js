const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const uploadService = {
    convertXlsxToJson: (filePath) => {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Get the first sheet
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        return json;
    },

    saveJsonFile: (data) => {
        const jsonFileName = `data-${Date.now()}.json`;
        const jsonFilePath = path.join(
            __dirname,
            '../public/json',
            jsonFileName,
        );
        fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
        return jsonFileName;
    },
};

module.exports = uploadService;
