const express = require('express');
const authController = require('../controllers/authController');
const messageController = require('../controllers/messageController');

const router = express.Router();

router.get(
  '/:chatId',
  authController.protect,
  messageController.getAllMessages
);

router.post('/', authController.protect, messageController.sendMessage);

module.exports = router;
