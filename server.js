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

// Use API routes
app.use('/', apiRoutes);

// Initialize WhatsApp bot
initializeBot();

// Create HTTP server and integrate WebSocket server
const server = http.createServer(app);
setupWebSocket(server);

server.listen(port, () => {
    logger(`Server running at http://localhost:${port}`);
});
