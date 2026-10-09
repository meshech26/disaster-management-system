const express = require('express');
const router = express.Router();
const {
  getShelters,
  getShelterById,
  createShelter,
  updateOccupancy
} = require('../controllers/shelterController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', getShelters);
router.get('/:id', getShelterById);
router.post('/', authenticate, authorize('responder', 'admin', 'district_officer'), createShelter);
router.patch('/:id/occupancy', authenticate, authorize('responder', 'admin', 'district_officer'), updateOccupancy);

module.exports = router;
