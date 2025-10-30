const { Op } = require('sequelize');
const { User, Friendship } = require('../models');

exports.me = async (req, res) => {
  res.json({ success: true, user: { id: req.user.id, name: req.user.name, email: req.user.email } });
};

exports.search = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ success: true, users: [] });
  const users = await User.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
      ],
      id: { [Op.ne]: req.userId },
    },
    limit: 20,
    order: [['name', 'ASC']],
  });
  res.json({ success: true, users: users.map(u => ({ id: u.id, name: u.name, email: u.email })) });
};

exports.addFriend = async (req, res) => {
  const { friendId } = req.body;
  if (!friendId || friendId === req.userId) return res.status(400).json({ success: false, message: 'Invalid friendId' });
  
  // Check if already exists
  const existing = await Friendship.findOne({ where: { userId: req.userId, friendId } });
  if (existing && existing.status === 'accepted') {
    return res.json({ success: true, message: 'Already friends', friendship: existing });
  }
  
  // Create pending request from requester
  const [record] = await Friendship.findOrCreate({
    where: { userId: req.userId, friendId },
    defaults: { status: 'pending' },
  });
  
  // Create pending request to recipient
  await Friendship.findOrCreate({
    where: { userId: friendId, friendId: req.userId },
    defaults: { status: 'pending' },
  });
  
  res.json({ success: true, friendship: { id: record.id, friendId, status: 'pending' } });
};

exports.listFriends = async (req, res) => {
  const friends = await Friendship.findAll({ where: { userId: req.userId, status: 'accepted' } });
  const friendIds = friends.map(f => f.friendId);
  const users = await User.findAll({ where: { id: friendIds } });
  res.json({ success: true, friends: users.map(u => ({ id: u.id, name: u.name, email: u.email })) });
};

exports.getPendingRequests = async (req, res) => {
  const pending = await Friendship.findAll({ where: { friendId: req.userId, status: 'pending' } });
  const senderIds = pending.map(p => p.userId);
  const users = await User.findAll({ where: { id: senderIds } });
  res.json({ success: true, requests: users.map(u => ({ id: u.id, name: u.name, email: u.email })) });
};

exports.acceptFriend = async (req, res) => {
  const { friendId } = req.body;
  if (!friendId) return res.status(400).json({ success: false, message: 'Invalid friendId' });
  
  // Accept both directions
  await Friendship.update({ status: 'accepted' }, { where: { userId: req.userId, friendId } });
  await Friendship.update({ status: 'accepted' }, { where: { userId: friendId, friendId: req.userId } });
  
  res.json({ success: true });
};

exports.rejectFriend = async (req, res) => {
  const { friendId } = req.body;
  if (!friendId) return res.status(400).json({ success: false, message: 'Invalid friendId' });
  
  // Remove both pending requests
  await Friendship.destroy({ where: { userId: req.userId, friendId } });
  await Friendship.destroy({ where: { userId: friendId, friendId: req.userId } });
  
  res.json({ success: true });
};


