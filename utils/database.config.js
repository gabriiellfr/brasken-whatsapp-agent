const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db', 'brasken-db.json');

const readDatabase = () => {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({}));
    }

    return JSON.parse(fs.readFileSync(dbPath));
};

module.exports = {
    readDatabase,
};
