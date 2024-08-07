const { initializeClient } = require('./services/agent.service');

const initializeBot = () => {
    initializeClient();
};

module.exports = {
    initializeBot,
};
