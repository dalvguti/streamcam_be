const { Room, Friendship, User } = require('../models');

exports.createRoom = async (req, res) => {
  const { name, visibility } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
  const room = await Room.create({ name, visibility: visibility || 'friends', ownerId: req.userId, isLive: false });
  res.json({ success: true, room });
};

exports.getRoom = async (req, res) => {
  const { roomId } = req.params;
  const room = await Room.findByPk(roomId, { include: [{ model: User, as: 'owner', attributes: ['id', 'name'] }] });
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  // visibility is enforced in visibleRooms endpoint for lists; here allow access to owner and friends/public
  if (room.ownerId !== req.userId) {
    const isFriend = await Friendship.findOne({ where: { userId: req.userId, friendId: room.ownerId, status: 'accepted' } });
    if (room.visibility === 'private' || (room.visibility === 'friends' && !isFriend)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
  }
  res.json({ success: true, room });
};

exports.myRooms = async (req, res) => {
  const rooms = await Room.findAll({ where: { ownerId: req.userId }, order: [['updatedAt', 'DESC']] });
  res.json({ success: true, rooms });
};

exports.visibleRooms = async (req, res) => {
  // Rooms visible to requester: public, own, and friends (if friendship accepted)
  const friends = await Friendship.findAll({ where: { userId: req.userId, status: 'accepted' } });
  const friendIds = friends.map(f => f.friendId);
  const rooms = await Room.findAll({
    where: {
      // visibility handled in query logic below
    },
    include: [{ model: User, as: 'owner', attributes: ['id', 'name'] }],
    order: [['updatedAt', 'DESC']],
  });
  const filtered = rooms.filter(r => {
    if (r.ownerId === req.userId) return true;
    if (r.visibility === 'public') return true;
    if (r.visibility === 'friends' && friendIds.includes(r.ownerId)) return true;
    return false;
  });
  res.json({ success: true, rooms: filtered });
};

exports.setLiveStatus = async (req, res) => {
  const { roomId } = req.params;
  const { isLive } = req.body;
  const room = await Room.findByPk(roomId);
  if (!room || room.ownerId !== req.userId) return res.status(404).json({ success: false, message: 'Room not found' });
  room.isLive = !!isLive;
  await room.save();
  res.json({ success: true, room });
};

exports.deleteRoom = async (req, res) => {
  const { roomId } = req.params;
  const id = Number(roomId);
  if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: 'Invalid room id' });
  const room = await Room.findOne({ where: { id, ownerId: req.userId } });
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  await Room.destroy({ where: { id, ownerId: req.userId } });
  res.json({ success: true });
};

exports.deleteRoomByBody = async (req, res) => {
  const { roomId } = req.body || {};
  const id = Number(roomId);
  if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: 'Invalid room id' });
  const room = await Room.findOne({ where: { id, ownerId: req.userId } });
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  await Room.destroy({ where: { id, ownerId: req.userId } });
  res.json({ success: true });
};


