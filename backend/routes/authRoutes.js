const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateLocation,
  updatePushToken,
  addEmergencyContact
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/location', authenticate, updateLocation);
router.put('/push-token', authenticate, updatePushToken);
router.post('/emergency-contacts', authenticate, addEmergencyContact);

module.exports = router;
