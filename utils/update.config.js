const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config', 'settings.json');

const readConfig = () => {
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({ agentEnabled: false }));
    }
    return JSON.parse(fs.readFileSync(configPath));
};

const writeConfig = (data) => {
    fs.writeFileSync(configPath, JSON.stringify(data));
};

module.exports = {
    readConfig,
    writeConfig,
};
