const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');

const { sendToWebSocketClients } = require('./socket.service');
const { handleResponse } = require('../utils/whatsapp.util');
const { readConfig } = require('../utils/update.config');
const logger = require('../utils/logger.util');
const { readDatabase } = require('../utils/database.config');

const MONGODB_URL = process.env.MONGODB_URL;
const LOCAL_STORE = process.env.LOCAL_STORE;

let dataPath = path.join(__dirname, '..', LOCAL_STORE);
let lastActiveTime = Math.floor(Date.now() / 1000);

const states = [];
let users = readDatabase();

const initializeClient = () => {
    try {
        logger('Starting agent...');

        const clientId = `brasken-agent`;

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
            authStrategy: new LocalAuth({
                dataPath,
                clientId,
            }),
        });

        botClient.on('qr', (qr) => {
            try {
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
            } catch (err) {
                logger(`Error handling QR code: ${err}`);
            }
        });

        botClient.on('ready', () => {
            try {
                logger('WhatsApp client is ready!');
                lastActiveTime = Math.floor(Date.now() / 1000);

                sendToWebSocketClients({
                    status: 'connected',
                    agentEnabled: readConfig().agentEnabled,
                });
            } catch (err) {
                logger(`Error on ready event: ${err}`);
            }
        });

        botClient.on('authenticated', async () => {
            try {
                logger('Authenticated!');
                sendToWebSocketClients({
                    status: 'authenticated',
                    agentEnabled: readConfig().agentEnabled,
                });
            } catch (err) {
                logger(`Error on authenticated event: ${err}`);
            }
        });

        botClient.on('remote_session_saved', async () => {
            try {
                logger('Remote session saved');
            } catch (err) {
                logger(`Error on remote_session_saved event: ${err}`);
            }
        });

        botClient.on('auth_failure', (message) => {
            try {
                logger(`Authentication failed: ${message}`);
                sendToWebSocketClients({
                    status: 'auth_failure',
                    agentEnabled: readConfig().agentEnabled,
                });
            } catch (err) {
                logger(`Error on auth_failure event: ${err}`);
            }
        });

        botClient.on('message', (message) => {
            try {
                if (message.fromMe) {
                    logger(
                        `Message from self: ${JSON.stringify(message.body)}`,
                    );
                    return;
                }

                const chatId = message.from;
                logger(
                    `Message received from ${chatId}: ${JSON.stringify(
                        message.body,
                    )}`,
                );

                if (message.timestamp < lastActiveTime) return;

                const agentEnabled = readConfig().agentEnabled;
                if (agentEnabled)
                    handleResponse(message, chatId, botClient, states, users);
            } catch (err) {
                logger(`Error handling message: ${err}`);
            }
        });

        botClient.on('message_create', (message) => {
            try {
                const chatId = message.to;
                logger(
                    `Message create received from ${chatId}: ${JSON.stringify(
                        message.body,
                    )}`,
                );

                if (message.fromMe) {
                    if (
                        states[chatId] === 'SUPPORT' &&
                        message.body === '/fechar'
                    ) {
                        states[chatId] = 'START';
                        logger(`Support session ended: ${chatId}`);

                        botClient.sendMessage(
                            chatId,
                            'Até breve! Se precisar de mais alguma coisa, é só chamar.',
                        );
                    }
                }
            } catch (err) {
                logger(`Error handling message_create: ${err}`);
            }
        });

        botClient.initialize();
    } catch (err) {
        logger(`Error initializing WhatsApp client: ${err}`);
    }
};

module.exports = {
    initializeClient,
};
