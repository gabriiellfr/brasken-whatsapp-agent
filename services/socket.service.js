const WebSocket = require('ws');
const { readConfig } = require('../utils/update.config');

const logger = require('../utils/logger.util');

let wsServer;

const setupWebSocket = (server, botClient) => {
    wsServer = new WebSocket.Server({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        logger('WebSocket connection upgraded');

        wsServer.handleUpgrade(request, socket, head, (ws) => {
            wsServer.emit('connection', ws, request);
        });
    });

    wsServer.on('connection', (ws) => {
        logger('WebSocket connection established');
        sendInitialStatus(ws, botClient);
    });
};

const sendToWebSocketClients = (message) => {
    if (!wsServer) return;

    const msg = JSON.stringify(message);
    wsServer.clients.forEach((client) => {
        logger(
            `WebSocket sending message to clients: ${JSON.stringify(message)}`,
        );

        if (client.readyState === WebSocket.OPEN) client.send(msg);
    });
};

const sendInitialStatus = (ws, botClient) => {
    ws.send(
        JSON.stringify({
            status: botClient ? 'connected' : '',
            agentEnabled: readConfig().agentEnabled,
        }),
    );
};

module.exports = {
    setupWebSocket,
    sendToWebSocketClients,
};
