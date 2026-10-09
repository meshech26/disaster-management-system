const express = require('express');
const router = express.Router();
const {
  getResources,
  createResource,
  updateResourceStock
} = require('../controllers/resourceController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', getResources);
router.post('/', authenticate, authorize('responder', 'admin'), createResource);
router.patch('/:id', authenticate, authorize('responder', 'admin'), updateResourceStock);

module.exports = router;
