const express = require('express');
const router = express.Router();
const {
  getRescueTeams,
  getRescueTeamCategories,
  getRescueMissions,
  getCurrentMissionForTeam,
  assignRescueTeam,
  updateMissionStatus,
  sendMissionUpdateMessage
} = require('../controllers/rescueController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/teams', getRescueTeams);
router.get('/categories', getRescueTeamCategories);
router.get('/missions', getRescueMissions);
router.get('/missions/current', getCurrentMissionForTeam);

router.post('/assign', authenticate, authorize('admin', 'district_officer'), assignRescueTeam);
router.patch('/missions/:id/status', authenticate, authorize('responder', 'rescue_team', 'admin', 'district_officer'), updateMissionStatus);
router.post('/missions/:id/update-message', authenticate, authorize('responder', 'rescue_team', 'admin', 'district_officer'), sendMissionUpdateMessage);

module.exports = router;
