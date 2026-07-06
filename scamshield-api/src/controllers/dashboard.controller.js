const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboard.service');
const { sendSuccess, sendError } = require('../utils/response');

exports.getStats = asyncHandler(async (req, res) => {
  console.log('Dashboard stats request:', { userId: req.user?.id, user: req.user });
  
  const result = await dashboardService.getDashboardStats(req.user);

  console.log('Dashboard stats result:', result);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode || 400, result.errors || null);
  }

  return sendSuccess(res, result.data, 'Dashboard stats retrieved', 200);
});

exports.getRecent = asyncHandler(async (req, res) => {
  console.log('Dashboard recent request:', { userId: req.user?.id, user: req.user });
  
  const result = await dashboardService.getDashboardRecent(req.user);

  console.log('Dashboard recent result:', result);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode || 400, result.errors || null);
  }

  return sendSuccess(res, result.data, 'Recent scam checks retrieved', 200);
});

exports.getCategories = asyncHandler(async (req, res) => {
  console.log('Dashboard categories request:', { userId: req.user?.id, user: req.user });

  const result = await dashboardService.getDashboardCategories(req.user);

  console.log('Dashboard categories result:', result);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode || 400, result.errors || null);
  }

  return sendSuccess(res, result.data, 'Dashboard categories retrieved', 200);
});

exports.getBankLeaderboard = asyncHandler(async (req, res) => {
  console.log('Bank leaderboard request:', { userId: req.user?.id, user: req.user });

  const result = await dashboardService.getBankImpersonationLeaderboard();

  console.log('Bank leaderboard result:', result);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode || 400, result.errors || null);
  }

  return sendSuccess(res, result.data, 'bank leaderboard retrieved successfully', 200);
});
