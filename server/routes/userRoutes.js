const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/login', authController.login);
router.post('/signup', authController.createUser);
router.get('/me', authController.protect, userController.getCurrentUser);
router.get('/get-user', authController.protect, userController.findUser);
router.get('/logout', authController.logedOut);

module.exports = router;
