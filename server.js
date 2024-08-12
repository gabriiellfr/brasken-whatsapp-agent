const express = require('express');
const path = require('path');
const http = require('http');

require('dotenv').config();

const { initializeBot } = require('./whatsapp.agent');
const { setupWebSocket } = require('./services/socket.service');
const logger = require('./utils/logger.util');

const apiRoutes = require('./routes/api.routes');

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Parse incoming request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/', apiRoutes);

const startServer = async () => {
    try {
        // Initialize WhatsApp bot
        const botClient = await initializeBot();

        // Create HTTP server and integrate WebSocket server
        const server = http.createServer(app);
        setupWebSocket(server, botClient);

        server.listen(port, () => {
            logger(`Server running at http://localhost:${port}`);
        });
    } catch (error) {
        logger(`Error starting server: ${error}`);
    }
};

// Start the server
startServer();
