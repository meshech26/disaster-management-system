const ApiResponse = require('../utils/apiResponse');

const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    const effectiveRoles = [...roles];
    if (roles.includes('responder') && !effectiveRoles.includes('volunteer')) {
      effectiveRoles.push('volunteer');
    }
    if (roles.includes('volunteer') && !effectiveRoles.includes('responder')) {
      effectiveRoles.push('responder');
    }
    if (roles.includes('responder') && !effectiveRoles.includes('rescue_team')) {
      effectiveRoles.push('rescue_team');
    }
    if (roles.includes('rescue_team') && !effectiveRoles.includes('responder')) {
      effectiveRoles.push('responder');
    }
    if (roles.includes('admin') && !effectiveRoles.includes('dmc_officer')) {
      effectiveRoles.push('dmc_officer');
    }
    if (roles.includes('admin') && !effectiveRoles.includes('district_officer')) {
      effectiveRoles.push('district_officer');
    }
    if (roles.includes('district_officer') && !effectiveRoles.includes('admin')) {
      effectiveRoles.push('admin');
    }
    if (roles.includes('dmc_officer') && !effectiveRoles.includes('admin')) {
      effectiveRoles.push('admin');
    }

    if (!req.user || !effectiveRoles.includes(userRole)) {
      return ApiResponse.error(
        res,
        `Role '${userRole || 'Guest'}' is not authorized to access this resource`,
        403
      );
    }
    next();
  };
};

module.exports = {
  authorize
};
