const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load .env BEFORE importing anything that reads process.env
dotenv.config({ path: require('path').join(__dirname, '.env') });

const { connectDB } = require('./config/database');
const { sequelize, Room } = require('./models');

const app = express();
connectDB();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', require('./routes/auth'));
const { authenticate } = require('./middleware/auth');
app.use('/api/users', authenticate, require('./routes/users'));
app.use('/api/rooms', authenticate, require('./routes/rooms'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'StreamCam API', protocol: req.protocol, secure: req.secure });
});

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'StreamCam API',
    version: '1.0.0',
    authentication: 'JWT',
    endpoints: {
      health: '/api/health',
      login: '/api/auth/login',
      register: '/api/auth/register',
      users: '/api/users',
      rooms: '/api/rooms'
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5008;
const HTTPS_PORT = process.env.HTTPS_PORT || 5443;
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// HTTP server
const httpServer = http.createServer(app);

// WebSocket signaling server for rooms (avoid dev server HMR path '/ws')
const { WebSocketServer } = require('ws');

// Map roomId -> Set of clients
const roomClients = new Map();

function broadcastToRoom(roomId, data, except) {
  const clients = roomClients.get(roomId);
  if (!clients) return;
  for (const client of clients) {
    if (client !== except && client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  }
}

// WebSocket setup function
const setupWebSocket = (server) => {
  const wssInstance = new WebSocketServer({ server, path: '/signal' });
  
  wssInstance.on('connection', (ws) => {
    ws.on('message', async (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        const { type } = data;
        if (type === 'join') {
          const { roomId, userId } = data;
          ws._roomId = roomId;
          ws._userId = userId;
          if (!roomClients.has(roomId)) roomClients.set(roomId, new Set());
          roomClients.get(roomId).add(ws);
          broadcastToRoom(roomId, { type: 'peer-joined', userId }, ws);
        } else if (type === 'signal') {
          const { roomId, payload } = data;
          broadcastToRoom(roomId, { type: 'signal', from: ws._userId, payload }, ws);
        } else if (type === 'live') {
          const { roomId, isLive } = data;
          const room = await Room.findByPk(roomId);
          if (room) {
            room.isLive = !!isLive;
            await room.save();
            broadcastToRoom(roomId, { type: 'live', isLive: room.isLive }, null);
          }
        }
      } catch (e) {
        console.error('WS message error:', e.message);
      }
    });
    ws.on('close', () => {
      const roomId = ws._roomId;
      const set = roomClients.get(roomId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) roomClients.delete(roomId);
      }
    });
  });
  
  return wssInstance;
};

try {
  httpServer.listen(PORT, '0.0.0.0', async () => {
    console.log(`HTTP Server is running on port ${PORT}`);
    setupWebSocket(httpServer);
    // Ensure tables exist
    await sequelize.sync();
  });
} catch (error) {
  console.error('Failed to start HTTP server:', error.message);
}

if (USE_HTTPS) {
  const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, 'certs', 'server.crt');
  const keyPath = process.env.SSL_KEY_PATH || path.join(__dirname, 'certs', 'server.key');
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const httpsOptions = { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
    const httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
      console.log(`HTTPS Server is running on port ${HTTPS_PORT}`);
      setupWebSocket(httpsServer);
    });
  } else {
    console.log('HTTPS disabled or certificates missing');
  }
}

module.exports = app;


