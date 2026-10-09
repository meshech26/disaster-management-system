const Resource = require('../models/Resource');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get resources inventory
// @route   GET /api/resources
const getResources = async (req, res, next) => {
  try {
    const { category, shelterId, status } = req.query;
    const query = {};
    if (category) query.category = category;
    if (shelterId) query.shelterId = shelterId;
    if (status) query.status = status;

    const resources = await Resource.find(query).populate('shelterId', 'name location');
    return ApiResponse.success(res, resources, `Retrieved ${resources.length} resources`);
  } catch (error) {
    next(error);
  }
};

// @desc    Add resource item
// @route   POST /api/resources
const createResource = async (req, res, next) => {
  try {
    const resource = await Resource.create(req.body);
    return ApiResponse.success(res, resource, 'Resource added', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update resource stock
// @route   PATCH /api/resources/:id
const updateResourceStock = async (req, res, next) => {
  try {
    const { quantity, status, notes } = req.body;
    const update = {};
    if (quantity !== undefined) update.quantity = quantity;
    if (status) update.status = status;
    if (notes) update.notes = notes;

    const resource = await Resource.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!resource) {
      return ApiResponse.error(res, 'Resource not found', 404);
    }
    return ApiResponse.success(res, resource, 'Resource updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResources,
  createResource,
  updateResourceStock
};
