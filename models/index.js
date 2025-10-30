const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(180), allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

const Room = sequelize.define('Room', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(140), allowNull: false },
  isLive: { type: DataTypes.BOOLEAN, defaultValue: false },
  visibility: { type: DataTypes.ENUM('private', 'friends', 'public'), defaultValue: 'friends' },
});

const Friendship = sequelize.define('Friendship', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  status: { type: DataTypes.ENUM('pending', 'accepted', 'blocked'), defaultValue: 'accepted' },
});

const StreamSession = sequelize.define('StreamSession', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  startedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  endedAt: { type: DataTypes.DATE, allowNull: true },
});

// Associations
User.hasMany(Room, { foreignKey: 'ownerId', as: 'rooms' });
Room.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.belongsToMany(User, {
  through: Friendship,
  as: 'friends',
  foreignKey: 'userId',
  otherKey: 'friendId',
});

Room.hasMany(StreamSession, { foreignKey: 'roomId', as: 'sessions' });
StreamSession.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });

module.exports = { sequelize, User, Room, Friendship, StreamSession };


