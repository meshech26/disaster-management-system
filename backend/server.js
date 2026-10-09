const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { PORT, CLIENT_URL } = require('./config/env');
const { setupSocket } = require('./socket/socketHandler');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const sosRoutes = require('./routes/sosRoutes');
const shelterRoutes = require('./routes/shelterRoutes');
const broadcastRoutes = require('./routes/broadcastRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const rescueRoutes = require('./routes/rescueRoutes');

// Initialize app & server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

setupSocket(io);

// Core Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Request logging for dev
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date(),
    service: 'Disaster Management Real-Time API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/shelters', shelterRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/rescue', rescueRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server & Connect Database
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚨 Disaster Management System Server Running`);
    console.log(`🌐 PORT: ${PORT}`);
    console.log(`📡 WebSocket / Socket.IO: Active`);
    console.log(`⚡ Health check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
};

startServer();

module.exports = { app, server };
