const express = require('express');
const router = express.Router();
const {
  getActiveBroadcasts,
  getAllBroadcasts,
  getBroadcastStats,
  getActiveImmediateAlerts,
  createBroadcast,
  updateBroadcast,
  triggerBroadcast,
  triggerImmediateAlert,
  completeBroadcast,
  deactivateBroadcast
} = require('../controllers/broadcastController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public or citizen/volunteer feeds
router.get('/', getActiveBroadcasts);
router.get('/active-immediate', getActiveImmediateAlerts);

// DMC Officer & Admin feeds
router.get('/all', authenticate, authorize('admin', 'dmc_officer', 'duty_officer'), getAllBroadcasts);
router.get('/stats', authenticate, authorize('admin', 'dmc_officer', 'duty_officer'), getBroadcastStats);

// Broadcast management
router.post('/', authenticate, authorize('admin', 'dmc_officer', 'responder'), createBroadcast);
router.put('/:id', authenticate, authorize('admin', 'dmc_officer'), updateBroadcast);
router.post('/:id/broadcast', authenticate, authorize('admin', 'dmc_officer'), triggerBroadcast);
router.post('/:id/immediate-alert', authenticate, authorize('admin', 'dmc_officer'), triggerImmediateAlert);
router.patch('/:id/complete', authenticate, authorize('admin', 'dmc_officer'), completeBroadcast);
router.patch('/:id/deactivate', authenticate, authorize('admin', 'dmc_officer', 'responder'), deactivateBroadcast);

module.exports = router;
