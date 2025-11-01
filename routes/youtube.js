const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { create, list, update, delete: deleteSound, getByUserId } = require('../controllers/youtubeController');

router.post('/', authenticate, create);
router.get('/', authenticate, list);
router.get('/user/:userId', authenticate, getByUserId);
router.patch('/:id', authenticate, update);
router.delete('/:id', authenticate, deleteSound);

module.exports = router;

