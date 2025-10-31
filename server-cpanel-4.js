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

// CORS for HTTP requests
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', require('./routes/auth'));
const { authenticate } = require('./middleware/auth');
app.use('/api/users', authenticate, require('./routes/users'));
app.use('/api/rooms', authenticate, require('./routes/rooms'));
app.use('/api/signaling', require('./routes/signaling'));

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

try {
  http.createServer(app).listen(PORT, '0.0.0.0', async () => {
    console.log(`HTTP Server is running on port ${PORT}`);
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
    https.createServer(httpsOptions, app).listen(HTTPS_PORT, '0.0.0.0', () => {
      console.log(`HTTPS Server is running on port ${HTTPS_PORT}`);
    });
  } else {
    console.log('HTTPS disabled or certificates missing');
  }
}

module.exports = app;


