const config = require('../config/env');
const { supabaseAnon } = require('../config/supabase');

/**
 * Refresh an access token using a refresh token
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
async function refreshToken(refreshToken) {
  if (!refreshToken) {
    return { success: false, message: 'refreshToken is required', statusCode: 422 };
  }

  try {
    const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token: refreshToken });

    if (error) {
      return { success: false, message: error.message || 'failed to refresh token' };
    }

    return { success: true, data, message: 'token refreshed' };
  } catch (error) {
    return { success: false, message: error.message || 'refresh error' };
  }
}

module.exports = {
  refreshToken,
};
