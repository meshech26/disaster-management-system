const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { registerSchema, loginSchema, updateLocationSchema } = require('../validators/authValidator');
const { reverseGeocode } = require('../services/geocodingService');

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// @desc    Register new user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const query = [{ email: validatedData.email.toLowerCase() }];
    if (validatedData.username) {
      query.push({ username: validatedData.username.toLowerCase() });
    }

    const userExists = await User.findOne({ $or: query });
    if (userExists) {
      return ApiResponse.error(res, 'User already exists with this email or username', 400);
    }

    const user = await User.create({
      ...validatedData,
      email: validatedData.email.toLowerCase(),
      username: validatedData.username ? validatedData.username.toLowerCase() : ''
    });
    const token = generateToken(user._id);

    return ApiResponse.success(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          district: user.district,
          role: user.role,
          agency: user.agency,
          emergencyContacts: user.emergencyContacts
        },
        token
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    if (error.errors) {
      return ApiResponse.error(res, 'Validation error', 400, error.errors);
    }
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const identifier = (validatedData.username || validatedData.email || '').trim().toLowerCase();

    if (!identifier) {
      return ApiResponse.error(res, 'Username or email is required', 400);
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    }).select('+password');

    if (!user) {
      return ApiResponse.error(res, 'Invalid username/email or password', 401);
    }

    const isMatch = await user.comparePassword(validatedData.password);
    if (!isMatch) {
      return ApiResponse.error(res, 'Invalid username/email or password', 401);
    }

    const token = generateToken(user._id);

    return ApiResponse.success(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          district: user.district,
          role: user.role,
          agency: user.agency,
          emergencyContacts: user.emergencyContacts,
          lastKnownLocation: user.lastKnownLocation
        },
        token
      },
      'Login successful'
    );
  } catch (error) {
    if (error.errors) {
      return ApiResponse.error(res, 'Validation error', 400, error.errors);
    }
    next(error);
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  return ApiResponse.success(res, req.user, 'Current user profile');
};

// @desc    Update user location
// @route   PUT /api/auth/location
const updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, address } = updateLocationSchema.parse(req.body);

    let resolvedAddress = address;
    if (!resolvedAddress) {
      resolvedAddress = await reverseGeocode(latitude, longitude);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        lastKnownLocation: {
          type: 'Point',
          coordinates: [longitude, latitude],
          address: resolvedAddress,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    return ApiResponse.success(res, updatedUser.lastKnownLocation, 'Location updated');
  } catch (error) {
    next(error);
  }
};

// @desc    Update Expo push token for notifications
// @route   PUT /api/auth/push-token
const updatePushToken = async (req, res, next) => {
  try {
    const { expoPushToken } = req.body;
    await User.findByIdAndUpdate(req.user._id, { expoPushToken });
    return ApiResponse.success(res, null, 'Push token saved');
  } catch (error) {
    next(error);
  }
};

// @desc    Add emergency contact
// @route   POST /api/auth/emergency-contacts
const addEmergencyContact = async (req, res, next) => {
  try {
    const { name, phone, relation } = req.body;
    if (!name || !phone) {
      return ApiResponse.error(res, 'Contact name and phone are required', 400);
    }

    const user = await User.findById(req.user._id);
    user.emergencyContacts.push({ name, phone, relation: relation || 'Contact' });
    await user.save();

    return ApiResponse.success(res, user.emergencyContacts, 'Emergency contact added');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateLocation,
  updatePushToken,
  addEmergencyContact
};
