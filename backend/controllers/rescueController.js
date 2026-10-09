const RescueTeam = require('../models/RescueTeam');
const RescueMission = require('../models/RescueMission');
const AlertBroadcast = require('../models/AlertBroadcast');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { getIo } = require('../socket/socketHandler');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

// @desc    Get all rescue teams
// @route   GET /api/rescue/teams
const getRescueTeams = async (req, res, next) => {
  try {
    const { type, district, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (district && district !== 'All Districts') filter.district = district;
    if (status) filter.status = status;

    const teams = await RescueTeam.find(filter).sort({ name: 1 });
    return ApiResponse.success(res, teams, `Retrieved ${teams.length} rescue teams`);
  } catch (error) {
    next(error);
  }
};

// @desc    Get summary availability by category (4 seeded types)
// @route   GET /api/rescue/categories
const getRescueTeamCategories = async (req, res, next) => {
  try {
    const { district } = req.query;
    const baseFilter = {};
    if (district && district !== 'All Districts') baseFilter.district = district;

    const categories = [
      {
        type: 'water_rescue',
        typeName: 'Water Rescue Team',
        description: 'Specialized in flood and water rescue operations',
        icon: 'boat',
        defaultAvailable: 3
      },
      {
        type: 'medical_response',
        typeName: 'Medical Response Team',
        description: 'Provide emergency medical care and first aid',
        icon: 'medical-bag',
        defaultAvailable: 4
      },
      {
        type: 'fire_rescue',
        typeName: 'Fire & Rescue Team',
        description: 'Fire suppression and technical rescue',
        icon: 'fire',
        defaultAvailable: 2
      },
      {
        type: 'evacuation_support',
        typeName: 'Evacuation Support Team',
        description: 'Support evacuation and community assistance',
        icon: 'account-group',
        defaultAvailable: 5
      }
    ];

    const result = await Promise.all(
      categories.map(async (cat) => {
        const total = await RescueTeam.countDocuments({ ...baseFilter, type: cat.type });
        const available = await RescueTeam.countDocuments({
          ...baseFilter,
          type: cat.type,
          status: 'available'
        });

        return {
          ...cat,
          totalCount: total > 0 ? total : cat.defaultAvailable,
          availableCount: total > 0 ? available : cat.defaultAvailable
        };
      })
    );

    return ApiResponse.success(res, result, 'Rescue team categories summary');
  } catch (error) {
    next(error);
  }
};

// @desc    Get all missions (or active tracking missions)
// @route   GET /api/rescue/missions
const getRescueMissions = async (req, res, next) => {
  try {
    const { district, status, trackingActive, disasterEventId } = req.query;
    const filter = {};
    if (district && district !== 'All Districts') filter.district = district;
    if (status) filter.status = status;
    if (trackingActive !== undefined) filter.trackingActive = trackingActive === 'true';
    if (disasterEventId) filter.disasterEventId = disasterEventId;

    const missions = await RescueMission.find(filter)
      .populate('teamId')
      .populate('disasterEventId')
      .populate('dispatchedBy', 'name role agency')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, missions, `Retrieved ${missions.length} rescue missions`);
  } catch (error) {
    next(error);
  }
};

// @desc    Get active mission for mobile Rescue Team
// @route   GET /api/rescue/missions/current
const getCurrentMissionForTeam = async (req, res, next) => {
  try {
    const { teamId, teamType } = req.query;
    const filter = { trackingActive: true };

    if (teamId) {
      filter.teamId = teamId;
    } else if (teamType) {
      filter.teamType = teamType;
    } else if (req.user?.username === 'medical_rescue' || req.user?.agency?.toLowerCase().includes('medical')) {
      filter.teamType = 'medical_response';
    } else if (req.user?.username === 'fire_rescue' || req.user?.agency?.toLowerCase().includes('fire')) {
      filter.teamType = 'fire_rescue';
    } else if (req.user?.username === 'evacuation_rescue' || req.user?.agency?.toLowerCase().includes('evacuation')) {
      filter.teamType = 'evacuation_support';
    } else if (req.user?.username === 'water_rescue' || req.user?.agency?.toLowerCase().includes('water')) {
      filter.teamType = 'water_rescue';
    }

    let mission = await RescueMission.findOne(filter)
      .populate('teamId')
      .populate('disasterEventId')
      .sort({ createdAt: -1 });

    if (!mission && filter.teamType) {
      mission = await RescueMission.findOne({ teamType: filter.teamType })
        .populate('teamId')
        .populate('disasterEventId')
        .sort({ createdAt: -1 });
    }

    if (!mission) {
      // Find latest mission overall
      mission = await RescueMission.findOne()
        .populate('teamId')
        .populate('disasterEventId')
        .sort({ createdAt: -1 });
    }

    return ApiResponse.success(res, mission, 'Current active mission');
  } catch (error) {
    next(error);
  }
};

// @desc    Assign / Dispatch rescue team to disaster event (by District Officer)
// @route   POST /api/rescue/assign
const assignRescueTeam = async (req, res, next) => {
  try {
    const {
      disasterEventId,
      disasterTitle,
      teamType,
      teamId,
      district,
      destinationAddress,
      destinationLat,
      destinationLng,
      instructions
    } = req.body;

    // Find team: either specified teamId or first available team of requested type
    let team = null;
    if (teamId) {
      team = await RescueTeam.findById(teamId);
    }
    if (!team && teamType) {
      team = await RescueTeam.findOne({ type: teamType, status: 'available' });
      if (!team) {
        team = await RescueTeam.findOne({ type: teamType });
      }
    }

    if (!team) {
      // Fallback create default team
      team = await RescueTeam.create({
        name: `${teamType === 'water_rescue' ? 'Water Rescue' : 'Emergency Rescue'} Team - 01`,
        type: teamType || 'water_rescue',
        typeName: 'Water Rescue Team',
        district: district || 'Galle',
        vehicle: 'Rescue Boat WB-01',
        membersCount: 6,
        status: 'assigned'
      });
    }

    const destLat = destinationLat ? parseFloat(destinationLat) : 6.037;
    const destLng = destinationLng ? parseFloat(destinationLng) : 80.218;

    const mission = await RescueMission.create({
      title: disasterTitle || 'Flood Rescue Operation',
      disasterEventId: disasterEventId || null,
      district: district || team.district || 'Galle',
      severity: 'high',
      destination: {
        address: destinationAddress || 'Rambukkana - Ginigathena Road, Galle',
        latitude: destLat,
        longitude: destLng
      },
      startLocation: {
        address: 'Hikkaduwa Command Depot, Galle',
        latitude: 6.138,
        longitude: 80.125
      },
      teamId: team._id,
      teamName: team.name,
      teamType: team.type,
      dispatchedBy: req.user?._id,
      status: 'assigned',
      instructions: instructions || [
        'Rescue stranded civilians (priority: children, elderly).',
        'Coordinate with local authorities and Grama Niladhari.',
        'Ensure team safety (fast-flowing currents).',
        'Report situation updates regularly to District Officer.'
      ],
      description: 'Multiple families stranded due to flash floods. Rescue and relocate affected people to the nearest safe shelter.',
      timeline: {
        assignedAt: new Date()
      },
      latestUpdate: {
        message: `${team.name} assigned to disaster area in ${district || 'Galle District'}.`,
        timestamp: new Date()
      },
      trackingActive: true
    });

    // Update team status
    team.status = 'assigned';
    team.activeMissionId = mission._id;
    await team.save();

    const populatedMission = await RescueMission.findById(mission._id).populate('teamId');

    // Emit live Socket.IO update
    try {
      const io = getIo();
      io.emit('mission_assigned', populatedMission);
    } catch (e) {}

    return ApiResponse.success(res, populatedMission, 'Rescue team assigned successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update mission status (En Route, At Destination, Rescue in Progress, Completed)
// @route   PATCH /api/rescue/missions/:id/status
const updateMissionStatus = async (req, res, next) => {
  try {
    const { status, message, completionNote, peopleRescued, coordinates } = req.body;
    const mission = await RescueMission.findById(req.params.id).populate('teamId');

    if (!mission) {
      return ApiResponse.error(res, 'Mission not found', 404);
    }

    mission.status = status;
    const now = new Date();

    if (status === 'en_route') {
      mission.timeline.enRouteAt = now;
      mission.latestUpdate = {
        message: message || 'Rescue team is en route to mission location.',
        timestamp: now
      };
      if (mission.teamId) {
        await RescueTeam.findByIdAndUpdate(mission.teamId._id, { status: 'en_route' });
      }
    } else if (status === 'at_destination' || status === 'arrived_destination') {
      mission.status = 'at_destination';
      mission.timeline.arrivedAt = now;
      mission.latestUpdate = {
        message: message || 'Arrived at destination – beginning rescue operations.',
        timestamp: now
      };
      if (mission.teamId) {
        await RescueTeam.findByIdAndUpdate(mission.teamId._id, { status: 'at_destination' });
      }
    } else if (status === 'rescue_in_progress') {
      mission.latestUpdate = {
        message: message || 'Rescue in progress - evacuating residents to designated safe shelter.',
        timestamp: now
      };
      if (mission.teamId) {
        await RescueTeam.findByIdAndUpdate(mission.teamId._id, { status: 'rescue_in_progress' });
      }
    } else if (status === 'completed') {
      mission.timeline.completedAt = now;
      mission.trackingActive = false;
      mission.completionNote = completionNote || '12 people rescued and moved to nearest safe shelter. Area secured.';
      mission.peopleRescued = Number(peopleRescued) || 12;
      mission.latestUpdate = {
        message: 'Rescue operation completed. Mission marked as complete.',
        timestamp: now
      };
      if (mission.teamId) {
        await RescueTeam.findByIdAndUpdate(mission.teamId._id, {
          status: 'available',
          activeMissionId: null
        });
      }
    }

    await mission.save();

    // Broadcast live over Socket.IO
    try {
      const io = getIo();
      io.emit('mission_status_updated', mission);
      if (status === 'completed') {
        io.emit('mission_completed', {
          missionId: mission._id,
          title: mission.title,
          completedAt: mission.timeline.completedAt
        });
      }
    } catch (e) {}

    return ApiResponse.success(res, mission, `Mission status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

// @desc    Send status update message from Rescue Team to District Officer
// @route   POST /api/rescue/missions/:id/update-message
const sendMissionUpdateMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return ApiResponse.error(res, 'Message text is required', 400);
    }

    const mission = await RescueMission.findById(req.params.id).populate('teamId');
    if (!mission) {
      return ApiResponse.error(res, 'Mission not found', 404);
    }

    mission.latestUpdate = {
      message: message.trim(),
      timestamp: new Date()
    };
    await mission.save();

    try {
      const io = getIo();
      io.emit('mission_update_message', {
        missionId: mission._id,
        latestUpdate: mission.latestUpdate,
        status: mission.status
      });
    } catch (e) {}

    return ApiResponse.success(res, mission, 'Update sent to District Officer');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRescueTeams,
  getRescueTeamCategories,
  getRescueMissions,
  getCurrentMissionForTeam,
  assignRescueTeam,
  updateMissionStatus,
  sendMissionUpdateMessage
};
