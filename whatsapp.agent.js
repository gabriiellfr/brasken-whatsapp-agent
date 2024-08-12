const { initializeClient } = require('./services/agent.service');
const logger = require('./utils/logger.util');

// Retry configuration
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000; // 2 seconds

let botClient;

const initializeBot = async (retryCount = 0) => {
    try {
        logger('Attempting to initialize client...');

        botClient = await initializeClient();

        retryCount = 0;

        return botClient;
    } catch (error) {
        logger(`Error initializing client: ${error}`);

        if (retryCount < MAX_RETRIES) {
            retryCount += 1;
            logger(
                `Retrying initialization... (Attempt ${retryCount}/${MAX_RETRIES})`,
            );
            setTimeout(() => initializeBot(retryCount), RETRY_DELAY_MS);
        } else {
            logger('Max retry attempts reached. Initialization failed.');
        }
    }
};

module.exports = {
    initializeBot,
};
