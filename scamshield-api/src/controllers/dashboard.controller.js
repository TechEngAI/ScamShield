const asyncHandler = require('../utils/asyncHandler');
const { supabaseAdmin } = require('../config/supabase');
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

exports.completeOnboarding = asyncHandler(async (req, res) => {
  await dashboardService.completeOnboarding(req.user.id);
  const score = await dashboardService.updateProtectionScore(req.user.id);
  return sendSuccess(res, { score }, 'onboarding completed', 200);
});

exports.getProtectionScore = asyncHandler(async (req, res) => {
  const score = await dashboardService.updateProtectionScore(req.user.id);

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('protection_score, total_checks_count, scams_caught_count, onboarding_completed')
    .eq('id', req.user.id)
    .single();

  if (error) {
    return sendError(res, error.message || 'failed to fetch profile', 500);
  }

  return sendSuccess(
    res,
    {
      score,
      total_checks: profile?.total_checks_count || 0,
      scams_caught: profile?.scams_caught_count || 0,
      onboarding_completed: profile?.onboarding_completed || false,
    },
    'protection score retrieved',
    200
  );
});

exports.getScamsByState = asyncHandler(async (req, res) => {
  // Public endpoint - no auth required
  const result = await dashboardService.getScamsByState();
  
  if (!result.success) {
    return sendError(res, result.message, 400);
  }
  
  return sendSuccess(res, result.data, 'state data retrieved');
});
