const ApiResponse = require('../utils/apiResponse');

const notFound = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error(`[Error] ${err.message}`, err.stack);

  let message = err.message || 'Server error';
  let errors = null;

  // Handle Mongoose duplicate key
  if (err.code === 11000) {
    message = 'Duplicate field value entered';
    return ApiResponse.error(res, message, 400, err.keyValue);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    return ApiResponse.error(res, message, 400);
  }

  return ApiResponse.error(res, message, statusCode, errors);
};

module.exports = {
  notFound,
  errorHandler
};
