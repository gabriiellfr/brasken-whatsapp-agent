//server.js

const express = require('express');
const path = require('path');

const { initializeBot } = require('./whatsapp.agent');
const apiRoutes = require('./routes/api.routes');

const app = express();
const port = 3000;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Parse incoming request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Use API routes
app.use('/', apiRoutes);

// Initialize WhatsApp bot and WebSocket server
const wsServer = initializeBot();

// Integrate WebSocket with the HTTP server
const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, (ws) => {
        wsServer.emit('connection', ws, request);
    });
});
