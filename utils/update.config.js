const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'config', 'settings.json');

const readConfig = () => {
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(
            configPath,
            JSON.stringify({ agentEnabled: false }, null, 2),
        );
    }
    return JSON.parse(fs.readFileSync(configPath));
};

const writeConfig = (newData) => {
    const currentData = readConfig();
    const updatedData = { ...currentData, ...newData };
    fs.writeFileSync(configPath, JSON.stringify(updatedData, null, 2));
};

module.exports = {
    readConfig,
    writeConfig,
};
