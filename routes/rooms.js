const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createRoom, myRooms, visibleRooms, setLiveStatus, deleteRoom, deleteRoomByBody, getRoom } = require('../controllers/roomsController');

// Debug logging for routing (helps diagnose 404)
router.use((req, res, next) => {
  try { console.log(`[rooms] ${req.method} ${req.originalUrl}`); } catch (_) {}
  next();
});

// Static routes first to avoid being captured by ":roomId"
router.post('/', authenticate, createRoom);
router.get('/mine', authenticate, myRooms);
router.get('/visible', authenticate, visibleRooms);
router.post('/delete', authenticate, deleteRoomByBody);
router.post('/manage', authenticate, (req, res, next) => {
  const action = (req.body && req.body.action) || '';
  if (action === 'delete') return deleteRoomByBody(req, res, next);
  return res.status(400).json({ success: false, message: 'Unknown action' });
});

// Actions on a specific room
router.get('/:roomId/status', authenticate, async (req, res) => {
  const { roomId } = req.params;
  const room = await require('../models').Room.findByPk(roomId);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  res.json({ success: true, isLive: room.isLive });
});
router.patch('/:roomId/live', authenticate, setLiveStatus);
// Some environments/proxies block PATCH; provide POST fallback
router.post('/:roomId/live', authenticate, setLiveStatus);
// Multiple aliases for delete to avoid proxy/hosting constraints
router.post('/:roomId/delete', authenticate, deleteRoom);
router.post('/delete/:roomId', authenticate, deleteRoom);
router.get('/:roomId', authenticate, getRoom);
router.delete('/:roomId', authenticate, deleteRoom);
router.delete('/delete/:roomId', authenticate, deleteRoom);

module.exports = router;


