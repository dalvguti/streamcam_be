// HTTP-based signaling (replaces WebSocket for cPanel compatibility)
// In-memory storage shared across the app
const roomSignals = new Map();

// Clean up old signals after 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [roomId, userSignals] of roomSignals.entries()) {
    for (const [userId, signals] of userSignals.entries()) {
      userSignals.set(userId, signals.filter(s => now - s.timestamp < 30000));
      if (userSignals.get(userId).length === 0) {
        userSignals.delete(userId);
      }
    }
    if (userSignals.size === 0) {
      roomSignals.delete(roomId);
    }
  }
}, 30000);

function getOrCreateRoom(roomId) {
  if (!roomSignals.has(roomId)) {
    roomSignals.set(roomId, new Map());
  }
  return roomSignals.get(roomId);
}

exports.sendSignal = async (req, res) => {
  const { roomId, to, payload } = req.body;
  if (!roomId || !to || !payload) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const room = getOrCreateRoom(roomId);
  const signal = { from: req.userId, payload, timestamp: Date.now() };
  
  // If 'all', broadcast to all connected users except sender
  if (to === 'all') {
    for (const userId of room.keys()) {
      if (userId !== req.userId) {
        if (!room.has(userId)) {
          room.set(userId, []);
        }
        room.get(userId).push(signal);
      }
    }
  } else {
    if (!room.has(to)) {
      room.set(to, []);
    }
    room.get(to).push(signal);
  }

  res.json({ success: true });
};

exports.getSignals = async (req, res) => {
  const { roomId } = req.params;
  const { lastSeen = 0 } = req.query;

  const room = getOrCreateRoom(roomId);
  
  // Register this user as present in the room
  if (!room.has(req.userId)) {
    room.set(req.userId, []);
  }
  
  const signals = room.get(req.userId) || [];
  
  // Filter signals we haven't seen yet
  const newSignals = signals.filter(s => s.timestamp > Number(lastSeen));
  
  res.json({
    success: true,
    signals: newSignals.map(s => ({ from: s.from, payload: s.payload })),
    lastSeen: signals.length > 0 ? signals[signals.length - 1].timestamp : lastSeen,
  });
};

exports.clearSignals = async (req, res) => {
  const { roomId } = req.params;
  const room = getOrCreateRoom(roomId);
  room.delete(req.userId);
  res.json({ success: true });
};

exports.getConnectionIds = async (req, res) => {
  const { roomId } = req.params;
  const room = getOrCreateRoom(roomId);
  const userIds = Array.from(room.keys());
  res.json({ success: true, userIds });
};

exports.requestOffer = async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ success: false, message: 'Missing roomId' });
  
  const room = getOrCreateRoom(roomId);
  
  // Send request to all other users in the room (typically the owner)
  const signal = { from: req.userId, payload: { type: 'request-offer' }, timestamp: Date.now() };
  for (const userId of room.keys()) {
    if (userId !== req.userId) {
      if (!room.has(userId)) {
        room.set(userId, []);
      }
      room.get(userId).push(signal);
    }
  }
  
  res.json({ success: true });
};

exports.playYoutube = async (req, res) => {
  const { roomId, youtubeUrl } = req.body;
  if (!roomId || !youtubeUrl) return res.status(400).json({ success: false, message: 'Missing fields' });
  
  const room = getOrCreateRoom(roomId);
  
  // Send play command to all users in the room
  const signal = { from: req.userId, payload: { type: 'play-youtube', url: youtubeUrl }, timestamp: Date.now() };
  for (const userId of room.keys()) {
    if (!room.has(userId)) {
      room.set(userId, []);
    }
    room.get(userId).push(signal);
  }
  
  res.json({ success: true });
};

// Export for sharing with other controllers
exports.roomSignals = roomSignals;

