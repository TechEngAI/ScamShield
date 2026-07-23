'use strict';

const { validateApiKey } = require('../services/developer.service');
const { sendError } = require('../utils/response');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Middleware that accepts EITHER:
 * - Bearer JWT token (existing auth)
 * - X-API-Key header (new API key auth)
 */
const apiKeyOrAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (apiKey) {
    const keyRecord = await validateApiKey(apiKey);

    if (!keyRecord) {
      return sendError(res, 'invalid or expired api key', 401);
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, username')
      .eq('id', keyRecord.user_id)
      .single();

    req.user = profile;
    req.apiKeyId = keyRecord.id;
    req.isApiKeyAuth = true;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'authentication required', 401);
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return sendError(res, 'invalid or expired token', 401);
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, username, first_name, last_name')
    .eq('id', user.id)
    .single();

  req.user = profile;
  return next();
};

module.exports = { apiKeyOrAuth };
