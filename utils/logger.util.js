const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../logs', 'app.log');

const log = (message) => {
    console.log(message);
    const timestamp = new Date().toISOString();
    fs.appendFile(logFile, `${timestamp} - ${message}\n`, (err) => {
        if (err) console.error('Error writing to log file', err);
    });
};

module.exports = log;
