const { supabaseAdmin } = require('../config/supabase');
const { sendError } = require('../utils/response');

function getBearerToken(req) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.replace('Bearer ', '').trim();
}

async function loadProfile(user) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, email, first_name, last_name, username, phone_number, role, created_at')
    .eq('id', user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: data?.email || user.email || null,
    first_name: data?.first_name || null,
    last_name: data?.last_name || null,
    full_name: data?.first_name && data?.last_name ? `${data.first_name} ${data.last_name}` : null,
    username: data?.username || null,
    phone_number: data?.phone_number || null,
    role: data?.role || 'user',
    created_at: data?.created_at || user.created_at || null,
  };
}

async function optionalAuth(req, _res, next) {
  const token = getBearerToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    req.user = null;
    return next();
  }

  req.user = await loadProfile(user);
  return next();
}

async function authMiddleware(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return sendError(res, 'authorization required', 401);
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return sendError(res, 'invalid or expired token', 401);
  }

  req.accessToken = token;
  req.user = await loadProfile(user);
  return next();
}

authMiddleware.optional = optionalAuth;

module.exports = authMiddleware;
