// whatsapp.agent.js

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const WebSocket = require('ws');

const { handleResponse } = require('./whatsapp.helper');
const { readConfig } = require('./utils/update.config');

const wsServer = new WebSocket.Server({ noServer: true });
const client = new Client({
    authStrategy: new LocalAuth(),
});

let isSessionReady = false; // Track the session state
let lastActiveTime = Math.floor(Date.now() / 1000);

const initializeBot = () => {
    client.on('qr', (qr) => {
        console.log('QR Code received');
        qrcode.toDataURL(qr, (err, url) => {
            if (err) {
                console.error('Error generating QR code:', err);
                return;
            }
            wsServer.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN)
                    client.send(
                        JSON.stringify({
                            qr: url,
                            status: 'waiting',
                            agentEnabled: readConfig().agentEnabled,
                        }),
                    );
            });
        });
    });

    client.on('ready', () => {
        console.log('Client is ready!');
        isSessionReady = true; // Update session state
        lastActiveTime = Math.floor(Date.now() / 1000);

        wsServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN)
                client.send(
                    JSON.stringify({
                        status: 'connected',
                        agentEnabled: readConfig().agentEnabled,
                    }),
                );
        });
    });

    client.on('authenticated', () => {
        console.log('Authenticated!');
        isSessionReady = true; // Ensure session state is updated
        wsServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN)
                client.send(
                    JSON.stringify({
                        status: 'authenticated',
                        agentEnabled: readConfig().agentEnabled,
                    }),
                );
        });
    });

    client.on('auth_failure', (message) => {
        console.error('Authentication failed:', message);
        wsServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN)
                client.send(
                    JSON.stringify({
                        status: 'auth_failure',
                        agentEnabled: readConfig().agentEnabled,
                    }),
                );
        });
    });

    // Handle incoming messages
    client.on('message', (message) => {
        // Check if the message is from a group or the sender is the bot itself
        if (message.fromMe || message.author || message.from.endsWith('@g.us'))
            return;

        if (message.timestamp < lastActiveTime) return;

        const chatId = message.from;
        const agentEnabled = readConfig().agentEnabled;

        if (agentEnabled) handleResponse(message, chatId, client);
    });

    client.initialize();

    // Handle WebSocket connection
    wsServer.on('connection', (ws) => {
        console.log('WebSocket connection established');

        ws.send(
            JSON.stringify({
                agentEnabled: readConfig().agentEnabled,
            }),
        );

        // Send the current session state to the newly connected client
        if (isSessionReady)
            ws.send(
                JSON.stringify({
                    status: 'connected',
                    agentEnabled: readConfig().agentEnabled,
                }),
            );
        else {
            client.getState().then((state) => {
                if (state === 'AUTHENTICATING') {
                    client.on('qr', (qr) => {
                        qrcode.toDataURL(qr, (err, url) => {
                            if (err) {
                                console.error('Error generating QR code:', err);
                                return;
                            }
                            ws.send(
                                JSON.stringify({
                                    qr: url,
                                    status: 'waiting',
                                    agentEnabled: readConfig().agentEnabled,
                                }),
                            );
                        });
                    });
                }
            });
        }
    });

    return wsServer;
};

module.exports = {
    initializeBot,
};
