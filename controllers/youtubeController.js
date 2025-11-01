const { YoutubeSound } = require('../models');

exports.create = async (req, res) => {
  const { url, title } = req.body;
  if (!url) return res.status(400).json({ success: false, message: 'URL required' });
  const sound = await YoutubeSound.create({ url, title, userId: req.userId });
  res.json({ success: true, sound });
};

exports.list = async (req, res) => {
  const sounds = await YoutubeSound.findAll({ where: { userId: req.userId }, order: [['position', 'ASC'], ['createdAt', 'ASC']] });
  res.json({ success: true, sounds });
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { url, title, position } = req.body;
  const sound = await YoutubeSound.findOne({ where: { id, userId: req.userId } });
  if (!sound) return res.status(404).json({ success: false, message: 'Not found' });
  if (url !== undefined) sound.url = url;
  if (title !== undefined) sound.title = title;
  if (position !== undefined) sound.position = position;
  await sound.save();
  res.json({ success: true, sound });
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  await YoutubeSound.destroy({ where: { id, userId: req.userId } });
  res.json({ success: true });
};

exports.getByUserId = async (req, res) => {
  const { userId } = req.params;
  const sounds = await YoutubeSound.findAll({ where: { userId }, order: [['position', 'ASC'], ['createdAt', 'ASC']] });
  res.json({ success: true, sounds });
};

