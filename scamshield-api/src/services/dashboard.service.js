const { supabaseAdmin } = require('../config/supabase');
const logger = require('../utils/logger');

const bankLeaderboardCache = {
  data: null,
  fetchedAt: 0,
  CACHE_DURATION: 2 * 60 * 1000, // 2 minutes
};

function applyUserScope(query, user) {
  if (user?.role === 'admin') {
    return query;
  }

  return query.eq('user_id', user.id);
}

function getTopEntry(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

async function countChecks(user, verdict = null) {
  let query = supabaseAdmin.from('scam_checks').select('id', { count: 'exact', head: true });
  query = applyUserScope(query, user);

  if (verdict) {
    query = query.eq('verdict', verdict);
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count || 0;
}

async function getDashboardStats(user) {
  try {
    const [totalChecks, totalScamsBlocked, totalSafe, totalSuspicious, rollupResult] = await Promise.all([
      countChecks(user),
      countChecks(user, 'scam'),
      countChecks(user, 'safe'),
      countChecks(user, 'suspicious'),
      applyUserScope(
        supabaseAdmin.from('scam_checks').select('scam_category, impersonated_bank, created_at').order('created_at', {
          ascending: false,
        }),
        user
      ),
    ]);

    if (rollupResult.error) {
      return { success: false, message: rollupResult.error.message || 'failed to fetch dashboard rollups' };
    }

    const categoryCounts = {};
    const bankCounts = {};
    const rows = rollupResult.data || [];

    rows.forEach((row) => {
      if (row.scam_category) {
        categoryCounts[row.scam_category] = (categoryCounts[row.scam_category] || 0) + 1;
      }
      if (row.impersonated_bank) {
        bankCounts[row.impersonated_bank] = (bankCounts[row.impersonated_bank] || 0) + 1;
      }
    });

    return {
      success: true,
      data: {
        total_checks: totalChecks,
        total_scams_blocked: totalScamsBlocked,
        total_safe: totalSafe,
        total_suspicious: totalSuspicious,
        most_impersonated_bank: getTopEntry(bankCounts),
        top_scam_category: getTopEntry(categoryCounts),
        last_updated: rows[0]?.created_at || null,
      },
    };
  } catch (error) {
    return { success: false, message: error.message || 'failed to fetch dashboard stats' };
  }
}

async function getDashboardCategories(user) {
  try {
    const query = applyUserScope(
      supabaseAdmin.from('scam_checks').select('scam_category').not('scam_category', 'is', null),
      user
    );
    const { data, error } = await query;

    if (error) {
      return { success: false, message: error.message || 'failed to fetch dashboard categories' };
    }

    const counts = (data || []).reduce((acc, row) => {
      const category = row.scam_category || 'uncategorised';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const categories = Object.entries(counts)
      .map(([category, count]) => ({ category, count: Number(count) }))
      .sort((a, b) => b.count - a.count);

    return { success: true, data: categories };
  } catch (error) {
    return { success: false, message: error.message || 'failed to fetch dashboard categories' };
  }
}

async function getDashboardRecent(user) {
  try {
    const query = applyUserScope(
      supabaseAdmin
        .from('scam_checks')
        .select(
          'id, user_id, message_text, verdict, confidence_score, scam_category, impersonated_bank, explanation, language_detected, red_flags, safe_to_click, recommended_action, source, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(20),
      user
    );

    const { data, error } = await query;

    if (error) {
      return { success: false, message: error.message || 'failed to fetch recent scam checks' };
    }

    return {
      success: true,
      data: (data || []).map((check) => ({
        ...check,
        confidence_score: Math.round(Number(check.confidence_score) || 0),
        red_flags: check.red_flags || [],
        safe_to_click: Boolean(check.safe_to_click),
      })),
    };
  } catch (error) {
    return { success: false, message: error.message || 'failed to fetch recent scam checks' };
  }
}

/**
 * Returns ranked list of most impersonated Nigerian banks
 * @returns {Promise<Array>} Array of { bank_name, count, percentage } objects
 */
async function getBankImpersonationLeaderboard() {
  const now = Date.now();

  // Return cached data if still valid
  if (bankLeaderboardCache.data && now - bankLeaderboardCache.fetchedAt < bankLeaderboardCache.CACHE_DURATION) {
    logger.info('Returning cached bank leaderboard data');
    return { success: true, data: bankLeaderboardCache.data };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('scam_checks')
      .select('impersonated_bank')
      .not('impersonated_bank', 'is', null)
      .eq('verdict', 'scam');

    if (error) {
      logger.error('Failed to fetch bank impersonation data', { error: error.message });
      return { success: false, message: error.message || 'failed to fetch bank leaderboard' };
    }

    // Count occurrences of each bank
    const bankCounts = {};
    (data || []).forEach((row) => {
      if (row.impersonated_bank) {
        bankCounts[row.impersonated_bank] = (bankCounts[row.impersonated_bank] || 0) + 1;
      }
    });

    // Calculate total for percentage calculation
    const total = Object.values(bankCounts).reduce((sum, count) => sum + count, 0);

    // Convert to array and sort by count descending
    const leaderboard = Object.entries(bankCounts)
      .map(([bank_name, count]) => ({
        bank_name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0, // Round to 1 decimal
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    // Cache the result
    bankLeaderboardCache.data = leaderboard;
    bankLeaderboardCache.fetchedAt = now;

    logger.info('Bank leaderboard fetched successfully', { count: leaderboard.length });

    return { success: true, data: leaderboard };
  } catch (error) {
    logger.error('Exception fetching bank leaderboard', { error: error.message });
    return { success: false, message: error.message || 'failed to fetch bank leaderboard' };
  }
}

/**
 * Recalculates and updates a user's personal protection score
 * Score increases with usage: checks done, scams caught, account age
 * Max score: 100
 * @param {string} userId
 * @returns {Promise<number>} new score
 */
async function updateProtectionScore(userId) {
  if (!userId) return 0;

  const { data: checks, error } = await supabaseAdmin
    .from('scam_checks')
    .select('verdict, created_at')
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to fetch scam checks for protection score', { error: error.message, userId });
    return 0;
  }

  const totalChecks = checks?.length || 0;
  const scamsCaught = checks?.filter((c) => c.verdict === 'scam').length || 0;

  const checkPoints = Math.min(totalChecks * 3, 40);
  const scamPoints = Math.min(scamsCaught * 5, 40);
  const basePoints = 20;
  const newScore = Math.min(basePoints + checkPoints + scamPoints, 100);

  await supabaseAdmin
    .from('profiles')
    .update({
      protection_score: newScore,
      total_checks_count: totalChecks,
      scams_caught_count: scamsCaught,
    })
    .eq('id', userId);

  return newScore;
}

/**
 * Marks user onboarding as complete
 * @param {string} userId
 */
async function completeOnboarding(userId) {
  if (!userId) return;

  await supabaseAdmin
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', userId);
}

module.exports = {
  getDashboardStats,
  getDashboardRecent,
  getDashboardCategories,
  getBankImpersonationLeaderboard,
  updateProtectionScore,
  completeOnboarding,
};
