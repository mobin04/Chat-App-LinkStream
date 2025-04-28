const express = require('express');
const chatController = require('../controllers/chatController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/create', authController.protect, chatController.createChat);
router.get('/get-all-chats', authController.protect, chatController.getMyChats);
router.post(
  '/create-group',
  authController.protect,
  chatController.createGroupChat
);
router.get('/single/:id', authController.protect, chatController.getSingleChat);
router.delete('/delete-chat', authController.protect, chatController.deleteChat);
router.delete('/exit-group', authController.protect, chatController.exitGroup);

module.exports = router;
