//api.routes.js

const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const { writeConfig } = require('../utils/update.config');

const router = express.Router();

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

const excelDateToJSDate = (serial) => {
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(
        excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000,
    );
    const day = String(jsDate.getDate()).padStart(2, '0');
    const month = String(jsDate.getMonth() + 1).padStart(2, '0');
    const year = jsDate.getFullYear();
    return `${day}/${month}/${year}`;
};

const formatData = (data) => {
    try {
        const formattedData = data.map((e) => {
            if (e['ASO TBS'] == 'N/A') e['VALIDADE - ASO'] = 'N/A';
            if (e['PT VENC'] == 'N/A') e['VENC- PT'] = 'N/A';

            e['CONTATO'] = String(e['CONTATO']).trim();
            if (e['CONTATO'] == '') e['CONTATO'] = 'N/A';

            return e;
        });

        return formattedData;
    } catch (error) {
        console.error('Error formatting data:', error);
        return [];
    }
};

const saveJsonToFile = (formattedData) => {
    try {
        fs.writeFileSync(
            './db/brasken-db.json',
            JSON.stringify(formattedData, null, 2),
            'utf8',
        );
    } catch (error) {
        console.error('Error saving data to file:', error);
        return [];
    }
};

// Handle file upload and conversion
router.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    // Read and convert XLSX file
    const workbook = XLSX.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const headers = rawData[0];

    const jsonData = rawData.slice(1).map((row) => {
        return headers.reduce((obj, header, index) => {
            let cellValue = row[index];

            if (
                cellValue === undefined ||
                cellValue === null ||
                cellValue === ''
            ) {
                cellValue = 'N/A';
            } else if (
                typeof cellValue === 'number' &&
                [
                    'ASO GSI',
                    'ASO TBS',
                    'PT INICIO',
                    'PT VENC',
                    'NR 10',
                    'NR 20',
                    'NR 33',
                    'NR 35',
                ].includes(header)
            ) {
                cellValue = excelDateToJSDate(cellValue);
            }

            obj[header] = cellValue;
            return obj;
        }, {});
    });

    const formattedData = formatData(jsonData);

    saveJsonToFile(formattedData);

    console.log(formattedData);

    res.json(formattedData);
});

router.post('/toggle-agent', (req, res) => {
    const { active } = req.body;

    if (typeof active !== 'boolean')
        return res.status(400).json({ error: 'Invalid value for active.' });

    console.log(active);

    const agentEnabled = { agentEnabled: active };
    writeConfig(agentEnabled);

    res.status(200).json({ success: true, botActive: active });
});

module.exports = router;
