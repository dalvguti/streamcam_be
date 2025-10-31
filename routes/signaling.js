const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { sendSignal, getSignals, clearSignals, getConnectionIds } = require('../controllers/signalingController');

// All signaling endpoints require authentication
router.use(authenticate);

// Send a signal to another peer in a room
router.post('/send', sendSignal);

// Poll for incoming signals
router.get('/room/:roomId/signals', getSignals);

// Clear signals for a user in a room
router.delete('/room/:roomId/signals', clearSignals);

// Get all active user IDs in a room
router.get('/room/:roomId/users', getConnectionIds);

module.exports = router;

