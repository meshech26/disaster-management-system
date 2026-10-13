const express = require('express');
const router = express.Router();
const {
  listEvents,
  generateReport,
  getReportStatus,
  getReport,
  verifyReport,
  archiveReport
} = require('../controllers/postEventReportController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// DMC officers (and admins, via the role mapping in roleMiddleware) only
router.use(authenticate, authorize('dmc_officer'));

router.get('/events', listEvents);
router.post('/generate', generateReport);
router.get('/:id/status', getReportStatus);
router.get('/:id/verify', verifyReport);
router.get('/:id', getReport);
router.patch('/:id/archive', archiveReport);

module.exports = router;
