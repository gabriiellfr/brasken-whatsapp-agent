const { Client, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const mongoose = require('mongoose');
const path = require('path');

const { handleResponse } = require('../utils/whatsapp.util');
const { readConfig } = require('../utils/update.config');
const { sendToWebSocketClients } = require('./socket.service');
const logger = require('../utils/logger.util');
const { MongoStore } = require('wwebjs-mongo');

MONGODB_URL =
    'mongodb+srv://Aurora:1IY0vD6Z8hOExe4N@cluster0.r33ei.mongodb.net/whatsapp-crm?retryWrites=true&w=majority';

LOCAL_STORE = 'local_store';

let dataPath = path.join(__dirname, '..', LOCAL_STORE);
let lastActiveTime = Math.floor(Date.now() / 1000);

const initializeClient = () => {
    mongoose.connect(MONGODB_URL).then(async () => {
        logger('Connected to mongoose');
        const store = new MongoStore({ mongoose: mongoose });
        const clientId = `${51991868922}`;

        if (store.sessionExists({ session: `RemoteAuth-${clientId}` })) {
            logger('Session exists. Setting it up...');

            sendToWebSocketClients({
                status: 'session_exists',
                agentEnabled: readConfig().agentEnabled,
            });
        }

        const botClient = new Client({
            takeoverOnConflict: true,
            restartOnAuthFail: true,
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                ],
            },
            authStrategy: new RemoteAuth({
                dataPath,
                clientId,
                store,
                backupSyncIntervalMs: 300000,
            }),
        });

        botClient.on('qr', (qr) => {
            logger('QR Code received');
            qrcode.toDataURL(qr, (err, url) => {
                if (err) {
                    logger(`Error generating QR code: ${err}`);
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
            logger('Client is ready!');
            lastActiveTime = Math.floor(Date.now() / 1000);

            sendToWebSocketClients({
                status: 'connected',
                agentEnabled: readConfig().agentEnabled,
            });
        });

        botClient.on('authenticated', async () => {
            logger('Authenticated!');

            sendToWebSocketClients({
                status: 'authenticated',
                agentEnabled: readConfig().agentEnabled,
            });
        });

        botClient.on('remote_session_saved', async () => {
            console.logger('remote_session_saved');
        });

        botClient.on('auth_failure', (message) => {
            logger(`Authentication failed: ${message}`);
            sendToWebSocketClients({
                status: 'auth_failure',
                agentEnabled: readConfig().agentEnabled,
            });
        });

        botClient.on('message', (message) => {
            logger(`message received: ${message}`);
            if (
                message.fromMe ||
                message.author ||
                message.from.endsWith('@g.us')
            )
                return;

            if (message.timestamp < lastActiveTime) return;

            const chatId = message.from;
            const agentEnabled = readConfig().agentEnabled;

            if (agentEnabled) handleResponse(message, chatId, botClient);
        });

        botClient.initialize();
    });
};

module.exports = {
    initializeClient,
};
