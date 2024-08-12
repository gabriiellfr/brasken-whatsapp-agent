const { Client, RemoteAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const mongoose = require('mongoose');
const path = require('path');
const { MongoStore } = require('wwebjs-mongo');

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
                    logger(`Error handling QR code for client: ${err}`);
                }
            });

            botClient.on('ready', () => {
                try {
                    logger(
                        `WhatsApp client is ready for client ID: ${clientId}`,
                    );
                    lastActiveTime = Math.floor(Date.now() / 1000);

                    sendToWebSocketClients({
                        status: 'connected',
                        agentEnabled: readConfig().agentEnabled,
                    });
                } catch (err) {
                    logger(
                        `Error on ready event for client ID ${clientId}: ${err}`,
                    );
                }
            });

            botClient.on('authenticated', async () => {
                try {
                    logger('Authenticated!');

                    sendToWebSocketClients({
                        status: 'authenticated',
                        agentEnabled: readConfig().agentEnabled,
                    });
                } catch (error) {}
            });

            botClient.on('remote_session_saved', async () => {
                logger('remote_session_saved');
            });

            botClient.on('auth_failure', (message) => {
                try {
                    logger(`Authentication failed: ${message}`);
                    sendToWebSocketClients({
                        status: 'auth_failure',
                        agentEnabled: readConfig().agentEnabled,
                    });
                } catch (error) {}
            });

            botClient.on('message', (message) => {
                try {
                    const chatId = message.from;

                    logger(
                        `message received ${chatId}: ${JSON.stringify(
                            message.body,
                        )}`,
                    );

                    if (
                        message.fromMe ||
                        message.author ||
                        message.from.endsWith('@g.us')
                    )
                        return;

                    if (message.timestamp < lastActiveTime) return;

                    const agentEnabled = readConfig().agentEnabled;

                    if (agentEnabled)
                        handleResponse(
                            message,
                            chatId,
                            botClient,
                            states,
                            users,
                        );
                } catch (error) {}
            });

            botClient.on('message_create', (message) => {
                try {
                    const chatId = message.to;

                    if (message.fromMe) {
                        if (states[chatId] && states[chatId] == 'SUPPORT')
                            if (message.body == '/fechar') {
                                states[chatId] = 'START';
                                logger(`Suporte finalizado: ${chatId}`);

                                botClient.sendMessage(
                                    chatId,
                                    'Até breve! Se precisar de mais alguma coisa, é só chamar.',
                                );
                            }
                    }
                } catch (error) {}
            });

            botClient.initialize();
        });
    } catch (err) {
        logger(`Error initializing WhatsApp client: ${err}`);
    }
};

module.exports = {
    initializeClient,
};
