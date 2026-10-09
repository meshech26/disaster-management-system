const SosAlert = require('../models/SosAlert');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { triggerSosSchema, updateSosStatusSchema } = require('../validators/sosValidator');
const { reverseGeocode } = require('../services/geocodingService');
const { sendPushNotification } = require('../services/notificationService');
const { getIo } = require('../socket/socketHandler');

// @desc    Trigger emergency SOS beacon
// @route   POST /api/sos
const triggerSos = async (req, res, next) => {
  try {
    const validatedData = triggerSosSchema.parse(req.body);

    let address = validatedData.address;
    if (!address) {
      address = await reverseGeocode(validatedData.latitude, validatedData.longitude);
    }

    // Deactivate previous active SOS alerts for this user if any
    await SosAlert.updateMany(
      { userId: req.user._id, status: { $in: ['ACTIVE', 'ASSIGNED', 'IN_PROGRESS'] } },
      { status: 'CANCELLED' }
    );

    const sosAlert = await SosAlert.create({
      userId: req.user._id,
      location: {
        type: 'Point',
        coordinates: [validatedData.longitude, validatedData.latitude],
        address,
        accuracy: validatedData.accuracy || 10
      },
      batteryLevel: validatedData.batteryLevel || 100,
      emergencyType: validatedData.emergencyType || 'general_danger',
      peopleCount: validatedData.peopleCount || 1,
      notes: validatedData.notes || '',
      status: 'ACTIVE'
    });

    const populatedAlert = await SosAlert.findById(sosAlert._id)
      .populate('userId', 'name phone emergencyContacts');

    // Real-time broadcast via Socket.IO to responders and admins
    try {
      const io = getIo();
      io.to('role_responders').to('role_admins').emit('emergency_sos_beacon', populatedAlert);
      io.emit('map_marker_added', { type: 'sos', item: populatedAlert });
    } catch (socketErr) {
      console.warn('[Socket] Could not broadcast SOS:', socketErr.message);
    }

    // Send push notification to all available responders
    try {
      const responders = await User.find({
        role: { $in: ['responder', 'admin'] },
        expoPushToken: { $exists: true, $ne: '' }
      }).select('expoPushToken');

      const pushTokens = responders.map((r) => r.expoPushToken);
      if (pushTokens.length > 0) {
        await sendPushNotification(
          pushTokens,
          'EMERGENCY SOS BEACON TRIGGERED!',
          `Critical assistance requested by ${req.user.name} at ${address}.`,
          { sosId: sosAlert._id.toString(), type: 'SOS' }
        );
      }
    } catch (pushErr) {
      console.warn('[PushNotification] Error sending push for SOS:', pushErr.message);
    }

    return ApiResponse.success(res, populatedAlert, 'SOS Emergency Signal Activated!', 201);
  } catch (error) {
    if (error.errors) {
      return ApiResponse.error(res, 'Validation error', 400, error.errors);
    }
    next(error);
  }
};

// @desc    Get active SOS alerts for responders & admins
// @route   GET /api/sos
const getActiveSosAlerts = async (req, res, next) => {
  try {
    const alerts = await SosAlert.find({
      status: { $in: ['ACTIVE', 'ASSIGNED', 'IN_PROGRESS'] }
    })
      .populate('userId', 'name phone emergencyContacts lastKnownLocation')
      .populate('assignedResponder', 'name phone agency lastKnownLocation')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, alerts, `Retrieved ${alerts.length} active SOS alerts`);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's active SOS
// @route   GET /api/sos/me
const getMyActiveSos = async (req, res, next) => {
  try {
    const alert = await SosAlert.findOne({
      userId: req.user._id,
      status: { $in: ['ACTIVE', 'ASSIGNED', 'IN_PROGRESS'] }
    }).populate('assignedResponder', 'name phone agency lastKnownLocation');

    return ApiResponse.success(res, alert || null, 'Current active SOS');
  } catch (error) {
    next(error);
  }
};

// @desc    Get SOS by ID
// @route   GET /api/sos/:id
const getSosById = async (req, res, next) => {
  try {
    const alert = await SosAlert.findById(req.params.id)
      .populate('userId', 'name phone emergencyContacts')
      .populate('assignedResponder', 'name phone agency');

    if (!alert) {
      return ApiResponse.error(res, 'SOS alert not found', 404);
    }

    return ApiResponse.success(res, alert, 'SOS alert details');
  } catch (error) {
    next(error);
  }
};

// @desc    Update SOS status (Accept mission, in-progress, resolve, cancel)
// @route   PATCH /api/sos/:id/status
const updateSosStatus = async (req, res, next) => {
  try {
    const validatedData = updateSosStatusSchema.parse(req.body);
    const updateFields = { status: validatedData.status };

    if (validatedData.notes) updateFields.notes = validatedData.notes;
    if (validatedData.status === 'ASSIGNED' || validatedData.status === 'IN_PROGRESS') {
      updateFields.assignedResponder = req.user._id;
    }
    if (validatedData.status === 'RESOLVED') {
      updateFields.resolvedAt = new Date();
    }

    const alert = await SosAlert.findByIdAndUpdate(req.params.id, updateFields, { new: true })
      .populate('userId', 'name phone emergencyContacts')
      .populate('assignedResponder', 'name phone agency');

    if (!alert) {
      return ApiResponse.error(res, 'SOS alert not found', 404);
    }

    // Broadcast status update
    try {
      const io = getIo();
      io.to(`sos_${alert._id}`).emit('sos_status_changed', alert);
      io.to('role_responders').to('role_admins').emit('sos_status_changed', alert);
      io.emit('map_marker_updated', { type: 'sos', item: alert });
    } catch (e) {}

    return ApiResponse.success(res, alert, `SOS alert marked as ${validatedData.status}`);
  } catch (error) {
    if (error.errors) {
      return ApiResponse.error(res, 'Validation error', 400, error.errors);
    }
    next(error);
  }
};

module.exports = {
  triggerSos,
  getActiveSosAlerts,
  getMyActiveSos,
  getSosById,
  updateSosStatus
};
