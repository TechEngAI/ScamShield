const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboard.service');
const { sendSuccess, sendError } = require('../utils/response');

exports.getStats = asyncHandler(async (req, res) => {
  const result = await dashboardService.getDashboardStats(req.user);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode || 400, result.errors || null);
  }

  return sendSuccess(res, result.data, 'Dashboard stats retrieved', 200);
});

exports.getRecent = asyncHandler(async (req, res) => {
  const result = await dashboardService.getDashboardRecent(req.user);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode || 400, result.errors || null);
  }

  return sendSuccess(res, result.data, 'Recent scam checks retrieved', 200);
});

exports.getCategories = asyncHandler(async (req, res) => {
  const result = await dashboardService.getDashboardCategories(req.user);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode || 400, result.errors || null);
  }

  return sendSuccess(res, result.data, 'Dashboard categories retrieved', 200);
});
