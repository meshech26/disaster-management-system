const Shelter = require('../models/Shelter');
const ApiResponse = require('../utils/apiResponse');
const { calculateDistanceKm } = require('../utils/distance');
const { getIo } = require('../socket/socketHandler');

// @desc    Get all shelters / relief camps with proximity calculation & district filter
// @route   GET /api/shelters
const getShelters = async (req, res, next) => {
  try {
    const { status, lat, lng, district } = req.query;
    const query = {};
    if (status) query.status = status;

    if (district && district !== 'All Districts' && district.trim()) {
      query.$or = [
        { district: district },
        { district: { $regex: new RegExp(district.trim(), 'i') } },
        { 'location.address': { $regex: new RegExp(district.trim(), 'i') } }
      ];
    }

    let shelters = await Shelter.find(query).sort({ createdAt: -1 }).lean();

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      shelters = shelters.map((shelter) => {
        const [sLng, sLat] = shelter.location.coordinates;
        const distanceKm = calculateDistanceKm(userLat, userLng, sLat, sLng);
        return {
          ...shelter,
          distanceKm
        };
      });

      shelters.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return ApiResponse.success(res, shelters, `Retrieved ${shelters.length} shelters`);
  } catch (error) {
    next(error);
  }
};

// @desc    Get shelter by ID
// @route   GET /api/shelters/:id
const getShelterById = async (req, res, next) => {
  try {
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
      return ApiResponse.error(res, 'Shelter not found', 404);
    }
    return ApiResponse.success(res, shelter, 'Shelter details');
  } catch (error) {
    next(error);
  }
};

// @desc    Create new shelter (District Officer / Admin / Responder)
// @route   POST /api/shelters
const createShelter = async (req, res, next) => {
  try {
    const {
      name,
      latitude,
      longitude,
      address,
      district,
      totalCapacity,
      currentOccupancy,
      facilities,
      contactPerson,
      contactPhone
    } = req.body;

    if (!name || !name.trim()) {
      return ApiResponse.error(res, 'Shelter name is required', 400);
    }

    const lat = latitude !== undefined && latitude !== null ? parseFloat(latitude) : 6.037;
    const lng = longitude !== undefined && longitude !== null ? parseFloat(longitude) : 80.218;

    const capacityBeds = Number(totalCapacity) || 100;
    const current = Number(currentOccupancy) || 0;
    let status = 'open';
    if (current >= capacityBeds) {
      status = 'full';
    } else if (current >= capacityBeds * 0.85) {
      status = 'nearing_capacity';
    }

    const shelter = await Shelter.create({
      name: name.trim(),
      district: district || 'Galle District',
      location: {
        type: 'Point',
        coordinates: [lng, lat],
        address: address || `${name}, ${district || 'Galle District'}`
      },
      totalCapacity: capacityBeds,
      currentOccupancy: current,
      facilities: facilities || ['Clean Water', 'Food Rations', 'First Aid', 'Emergency Power'],
      contactPerson: contactPerson || 'Shelter Officer',
      contactPhone: contactPhone || '+94 91 224 4380',
      status
    });

    try {
      const io = getIo();
      io.emit('shelter_created', shelter);
    } catch (e) {}

    return ApiResponse.success(res, shelter, 'Shelter created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update shelter occupancy and capacity
// @route   PATCH /api/shelters/:id/occupancy
const updateOccupancy = async (req, res, next) => {
  try {
    const { currentOccupancy, totalCapacity, status: customStatus } = req.body;
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return ApiResponse.error(res, 'Shelter not found', 404);
    }

    if (totalCapacity !== undefined && totalCapacity !== null) {
      shelter.totalCapacity = Number(totalCapacity);
    }

    if (currentOccupancy !== undefined && currentOccupancy !== null) {
      shelter.currentOccupancy = Number(currentOccupancy);
    }

    if (customStatus) {
      shelter.status = customStatus;
    } else {
      if (shelter.currentOccupancy >= shelter.totalCapacity) {
        shelter.status = 'full';
      } else if (shelter.currentOccupancy >= shelter.totalCapacity * 0.85) {
        shelter.status = 'nearing_capacity';
      } else {
        shelter.status = 'open';
      }
    }

    await shelter.save();

    try {
      const io = getIo();
      io.emit('shelter_updated', shelter);
    } catch (e) {}

    return ApiResponse.success(res, shelter, 'Shelter occupancy updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShelters,
  getShelterById,
  createShelter,
  updateOccupancy
};
