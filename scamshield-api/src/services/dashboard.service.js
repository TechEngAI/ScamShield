const { supabaseAdmin } = require('../config/supabase');

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

module.exports = {
  getDashboardStats,
  getDashboardRecent,
  getDashboardCategories,
};
