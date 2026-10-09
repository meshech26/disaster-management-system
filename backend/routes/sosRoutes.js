const express = require('express');
const router = express.Router();
const {
  triggerSos,
  getActiveSosAlerts,
  getMyActiveSos,
  getSosById,
  updateSosStatus
} = require('../controllers/sosController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', authenticate, triggerSos);
router.get('/', authenticate, authorize('responder', 'admin'), getActiveSosAlerts);
router.get('/me', authenticate, getMyActiveSos);
router.get('/:id', authenticate, getSosById);
router.patch('/:id/status', authenticate, updateSosStatus);

module.exports = router;
