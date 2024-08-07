const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const { handleResponse } = require('../utils/whatsapp.util');
const { readConfig } = require('../utils/update.config');
const { sendToWebSocketClients } = require('./socket.service');
const log = require('../utils/logger.util');

let isSessionReady = false;
let lastActiveTime = Math.floor(Date.now() / 1000);

const initializeClient = () => {
    const botClient = new Client({
        authStrategy: new LocalAuth(),
    });

    botClient.on('qr', (qr) => {
        log('QR Code received');
        qrcode.toDataURL(qr, (err, url) => {
            if (err) {
                log(`Error generating QR code: ${err}`);
                return;
            }
            sendToWebSocketClients({
                qr: url,
                status: 'waiting',
                agentEnabled: readConfig().agentEnabled,
            });
        });
    });

    botClient.on('ready', () => {
        log('Client is ready!');
        isSessionReady = true;
        lastActiveTime = Math.floor(Date.now() / 1000);
        sendToWebSocketClients({
            status: 'connected',
            agentEnabled: readConfig().agentEnabled,
        });
    });

    botClient.on('authenticated', () => {
        log('Authenticated!');
        isSessionReady = true;
        sendToWebSocketClients({
            status: 'authenticated',
            agentEnabled: readConfig().agentEnabled,
        });
    });

    botClient.on('auth_failure', (message) => {
        log(`Authentication failed: ${message}`);
        sendToWebSocketClients({
            status: 'auth_failure',
            agentEnabled: readConfig().agentEnabled,
        });
    });

    botClient.on('message', (message) => {
        log(`message received: ${message}`);
        if (message.fromMe || message.author || message.from.endsWith('@g.us'))
            return;

        if (message.timestamp < lastActiveTime) return;

        const chatId = message.from;
        const agentEnabled = readConfig().agentEnabled;

        if (agentEnabled) handleResponse(message, chatId, botClient);
    });

    botClient.initialize();
};

module.exports = {
    initializeClient,
};
