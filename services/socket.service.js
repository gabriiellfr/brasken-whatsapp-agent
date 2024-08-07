const WebSocket = require('ws');
const { readConfig } = require('../utils/update.config');

const log = require('../utils/logger.util');

let wsServer;

const setupWebSocket = (server) => {
    wsServer = new WebSocket.Server({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        log('WebSocket connection upgraded');

        wsServer.handleUpgrade(request, socket, head, (ws) => {
            wsServer.emit('connection', ws, request);
        });
    });

    wsServer.on('connection', (ws) => {
        log('WebSocket connection established');
        sendInitialStatus(ws);
    });
};

const sendToWebSocketClients = (message) => {
    if (!wsServer) return;

    const msg = JSON.stringify(message);
    wsServer.clients.forEach((client) => {
        log(`WebSocket sending message to clients: ${message}`);

        if (client.readyState === WebSocket.OPEN) client.send(msg);
    });
};

const sendInitialStatus = (ws) => {
    ws.send(
        JSON.stringify({
            agentEnabled: readConfig().agentEnabled,
        }),
    );
};

module.exports = {
    setupWebSocket,
    sendToWebSocketClients,
};
