require('dotenv').config();
const { sequelize } = require('../models');

(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced');
    process.exit(0);
  } catch (e) {
    console.error('DB sync error:', e);
    process.exit(1);
  }
})();


