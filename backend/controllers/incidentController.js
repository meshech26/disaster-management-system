const Incident = require('../models/Incident');
const ApiResponse = require('../utils/apiResponse');
const { createIncidentSchema, updateIncidentStatusSchema } = require('../validators/incidentValidator');
const { uploadBufferToCloudinary } = require('../services/cloudinaryService');
const { reverseGeocode } = require('../services/geocodingService');
const { getIo } = require('../socket/socketHandler');

// @desc    Create incident with optional media files
// @route   POST /api/incidents
const createIncident = async (req, res, next) => {
  try {
    const validatedData = createIncidentSchema.parse(req.body);

    let address = validatedData.address ? validatedData.address.trim() : '';
    const isRawCoordinates =
      !address ||
      address.includes('°') ||
      address.includes(' N,') ||
      address.includes(' S,') ||
      /^[\d\s.,\-NSEW°]+$/i.test(address);

    if (isRawCoordinates) {
      address = await reverseGeocode(validatedData.latitude, validatedData.longitude);
    }

    const mediaUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadBufferToCloudinary(file.buffer, 'disaster_incidents');
          mediaUrls.push({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: file.mimetype.startsWith('video') ? 'video' : 'image'
          });
        } catch (uploadErr) {
          console.error('[Cloudinary] Failed to upload image:', uploadErr.message);
        }
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Incident.countDocuments();
    const reportNumber = `#DR-${todayStr}-${String(count + 1).padStart(3, '0')}`;

    let disasterType = validatedData.disasterType || 'flood';
    if (disasterType === 'land slide') disasterType = 'landslide';
    if (disasterType === 'extreme wind') disasterType = 'extreme_wind';
    if (disasterType === 'heavy rain with lightning' || disasterType === 'heavy_rain_with_lightning') disasterType = 'heavy_rain_lightning';

    const incident = await Incident.create({
      title: validatedData.title,
      description: validatedData.description,
      disasterType,
      customDisasterType: validatedData.customDisasterType ? validatedData.customDisasterType.trim() : '',
      severity: validatedData.severity || 'medium',
      location: {
        type: 'Point',
        coordinates: [validatedData.longitude, validatedData.latitude],
        address
      },
      mediaUrls,
      reportedBy: req.user._id,
      peopleTrappedCount: validatedData.peopleTrappedCount || 0,
      immediateNeeds: validatedData.immediateNeeds || [],
      reportNumber
    });

    const populatedIncident = await Incident.findById(incident._id).populate('reportedBy', 'name phone email');

    // Emit live socket event to responders and dashboard
    try {
      const io = getIo();
      io.to('role_responders').to('role_admins').emit('new_incident_reported', populatedIncident);
      io.emit('map_marker_added', { type: 'incident', item: populatedIncident });
    } catch (socketErr) {
      // Ignore if socket not ready
    }

    return ApiResponse.success(res, populatedIncident, 'Incident reported successfully', 201);
  } catch (error) {
    if (error.errors) {
      return ApiResponse.error(res, 'Validation error', 400, error.errors);
    }
    next(error);
  }
};

// @desc    Get all incidents with optional filtering & proximity
// @route   GET /api/incidents
const getIncidents = async (req, res, next) => {
  try {
    const { status, disasterType, severity, lat, lng, radiusKm, reportedBy } = req.query;
    const query = {};

    if (reportedBy) query.reportedBy = reportedBy;
    if (status) query.status = status;
    if (req.query.forwardedToDmc !== undefined) {
      query.forwardedToDmc = req.query.forwardedToDmc === 'true';
    }
    if (disasterType) {
      if (disasterType === 'landslide' || disasterType === 'land slide') {
        query.disasterType = { $in: ['landslide', 'land slide'] };
      } else if (disasterType === 'extreme_wind' || disasterType === 'extreme wind') {
        query.disasterType = { $in: ['extreme_wind', 'extreme wind', 'cyclone'] };
      } else if (disasterType === 'heavy_rain_lightning' || disasterType === 'heavy rain with lightning' || disasterType === 'heavy_rain_with_lightning') {
        query.disasterType = { $in: ['heavy_rain_lightning', 'heavy rain with lightning', 'heavy_rain_with_lightning'] };
      } else {
        query.disasterType = disasterType;
      }
    }
    if (severity) query.severity = severity;

    // Geo query if coordinates provided
    if (lat && lng) {
      const maxDistanceMeters = (radiusKm ? Number(radiusKm) : 50) * 1000;
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: maxDistanceMeters
        }
      };
    }

    const incidents = await Incident.find(query)
      .populate('reportedBy', 'name phone email role')
      .populate('assignedResponders', 'name phone agency')
      .populate('verifiedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(100);

    return ApiResponse.success(res, incidents, `Retrieved ${incidents.length} incidents`);
  } catch (error) {
    next(error);
  }
};

// @desc    Get incident by ID
// @route   GET /api/incidents/:id
const getIncidentById = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'name phone email role emergencyContacts')
      .populate('assignedResponders', 'name phone agency lastKnownLocation')
      .populate('verifiedBy', 'name role');

    if (!incident) {
      return ApiResponse.error(res, 'Incident not found', 404);
    }

    return ApiResponse.success(res, incident, 'Incident details');
  } catch (error) {
    next(error);
  }
};

// @desc    Update incident status / verification
// @route   PATCH /api/incidents/:id/status
const updateIncidentStatus = async (req, res, next) => {
  try {
    const validatedData = updateIncidentStatusSchema.parse(req.body);

    const existing = await Incident.findById(req.params.id);
    if (!existing) {
      return ApiResponse.error(res, 'Incident not found', 404);
    }

    // When a ground report is marked as verified or rejected, it cannot be modified again by duty officer
    const lockedStatuses = ['verified', 'rejected', 'dismissed'];
    if (lockedStatuses.includes(existing.status)) {
      if (req.user?.role === 'duty_officer' || !['admin'].includes(req.user?.role)) {
        return ApiResponse.error(
          res,
          `This report is already marked as ${existing.status} and cannot be modified again.`,
          400
        );
      }
    }

    const updateFields = { status: validatedData.status };
    if (validatedData.severity) updateFields.severity = validatedData.severity;
    if (validatedData.status === 'verified') {
      updateFields.verifiedAt = new Date();
      updateFields.verifiedBy = req.user._id;
      updateFields.verificationNote = validatedData.note || validatedData.verificationNote || '';
      updateFields.forwardedToDmc = true;
      updateFields.forwardedAt = new Date();
    }
    if (validatedData.status === 'rejected') {
      updateFields.rejectionNote = validatedData.note || validatedData.rejectionNote || '';
    }
    if (validatedData.status === 'resolved') updateFields.resolvedAt = new Date();

    const incident = await Incident.findByIdAndUpdate(req.params.id, updateFields, { new: true })
      .populate('reportedBy', 'name phone email role')
      .populate('assignedResponders', 'name phone agency')
      .populate('verifiedBy', 'name role');

    if (!incident) {
      return ApiResponse.error(res, 'Incident not found', 404);
    }

    try {
      const io = getIo();
      io.emit('incident_status_updated', incident);
    } catch (e) {}

    return ApiResponse.success(res, incident, 'Incident status updated');
  } catch (error) {
    if (error.errors) {
      return ApiResponse.error(res, 'Validation error', 400, error.errors);
    }
    next(error);
  }
};

// @desc    Assign responders to incident
// @route   POST /api/incidents/:id/assign
const assignResponders = async (req, res, next) => {
  try {
    const { responderIds } = req.body;
    if (!Array.isArray(responderIds) || responderIds.length === 0) {
      return ApiResponse.error(res, 'responderIds must be a non-empty array', 400);
    }

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      {
        $addToSet: { assignedResponders: { $each: responderIds } },
        status: 'in_progress'
      },
      { new: true }
    ).populate('assignedResponders', 'name phone agency');

    try {
      const io = getIo();
      io.emit('incident_status_updated', incident);
    } catch (e) {}

    return ApiResponse.success(res, incident, 'Responders assigned to incident');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  assignResponders
};
