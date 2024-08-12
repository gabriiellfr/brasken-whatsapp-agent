const fs = require('fs');
const path = require('path');
const { format } = require('date-fns-tz');

// Path to the log file
const logFile = path.join(__dirname, '../logs', 'app.log');

// São Paulo time zone
const TIMEZONE = 'America/Sao_Paulo';

// Logger function
const logger = (message) => {
    try {
        // Get the current time in São Paulo time zone
        const timestamp = format(new Date(), 'dd-MM-yyyy HH:mm:ss', {
            timeZone: TIMEZONE,
        });
        // Write log message to file
        fs.appendFile(logFile, `${timestamp} - ${message}\n`, (err) => {
            if (err) console.error('Error writing to log file', err);
        });
    } catch (err) {
        console.error('Error in logger function:', err);
    }
};

module.exports = logger;
