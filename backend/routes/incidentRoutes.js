const express = require('express');
const router = express.Router();
const {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  assignResponders
} = require('../controllers/incidentController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', authenticate, upload.array('media', 5), createIncident);
router.get('/', getIncidents);
router.get('/:id', getIncidentById);
router.patch('/:id/status', authenticate, authorize('responder', 'admin', 'duty_officer', 'dmc_officer'), updateIncidentStatus);
router.post('/:id/assign', authenticate, authorize('responder', 'admin', 'dmc_officer'), assignResponders);

module.exports = router;
