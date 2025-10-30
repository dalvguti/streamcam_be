const { Sequelize } = require('sequelize');

const isProd = process.env.NODE_ENV === 'production';

// Allow sensible defaults in dev; require explicit vars in prod
const DB_HOST = process.env.DB_HOST || (isProd ? undefined : '127.0.0.1');
const DB_PORT = process.env.DB_PORT || (isProd ? undefined : '3306');
const DB_USER = process.env.DB_USER || (isProd ? undefined : 'root');
const DB_PASS = process.env.DB_PASS || (isProd ? undefined : '');
const DB_NAME = process.env.DB_NAME || (isProd ? undefined : 'streamcam');
const DB_SOCKET = process.env.DB_SOCKET; // e.g. /var/lib/mysql/mysql.sock (cPanel sometimes)
const DB_SSL = String(process.env.DB_SSL || '').toLowerCase() === 'true';

function validateEnv() {
  const missing = [];
  if (!DB_NAME) missing.push('DB_NAME');
  if (!DB_USER) missing.push('DB_USER');
  if (!DB_SOCKET && !DB_HOST) missing.push('DB_HOST');
  if (!DB_SOCKET && !DB_PORT) missing.push('DB_PORT');
  if (missing.length) {
    console.error('Database configuration is incomplete. Missing:', missing.join(', '));
    console.error('Set the variables in your environment or .env file.');
    process.exit(1);
  }
}

validateEnv();

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_SOCKET ? undefined : DB_HOST,
  port: DB_SOCKET ? undefined : parseInt(DB_PORT, 10),
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    socketPath: DB_SOCKET || undefined,
    ssl: DB_SSL ? { rejectUnauthorized: false } : undefined,
  },
  define: {
    timestamps: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  retry: { max: 3 },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL connected', {
      host: DB_SOCKET ? '(socket)' : DB_HOST,
      port: DB_SOCKET ? '(socket)' : DB_PORT,
      db: DB_NAME,
    });
  } catch (err) {
    console.error('MySQL connection error:', err.message);
    console.error('Configured host:', DB_SOCKET ? DB_SOCKET : `${DB_HOST}:${DB_PORT}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

