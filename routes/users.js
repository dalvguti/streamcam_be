const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { me, search, addFriend, listFriends, getPendingRequests, acceptFriend, rejectFriend } = require('../controllers/usersController');

router.get('/me', authenticate, me);
router.get('/search', authenticate, search);
router.post('/friends', authenticate, addFriend);
router.get('/friends', authenticate, listFriends);
router.get('/friends/pending', authenticate, getPendingRequests);
router.post('/friends/accept', authenticate, acceptFriend);
router.post('/friends/reject', authenticate, rejectFriend);

module.exports = router;


