const fs = require('fs');
const path = require('path');
const logger = require('./logger.util');

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

    logger(`Agent status changed: ${newData.agentEnabled}`);

    fs.writeFileSync(configPath, JSON.stringify(updatedData, null, 2));
};

module.exports = {
    readConfig,
    writeConfig,
};
