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
    console.log('Optional auth: No token provided');
    req.user = null;
    return next();
  }

  console.log('Optional auth: Token provided, validating...');

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    console.log('Optional auth: Invalid token', { error: error?.message });
    req.user = null;
    return next();
  }

  console.log('Optional auth: Token valid, loading profile...');
  req.user = await loadProfile(user);
  console.log('Optional auth: User loaded', { userId: req.user?.id });
  return next();
}

async function authMiddleware(req, res, next) {
  const token = getBearerToken(req);

  console.log('Auth middleware: Checking token...');

  if (!token) {
    console.log('Auth middleware: No token provided');
    return sendError(res, 'authorization required', 401);
  }

  console.log('Auth middleware: Token provided, validating...');

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    console.log('Auth middleware: Invalid token', { error: error?.message });
    return sendError(res, 'invalid or expired token', 401);
  }

  console.log('Auth middleware: Token valid, loading profile...');
  req.accessToken = token;
  req.user = await loadProfile(user);
  console.log('Auth middleware: User loaded', { userId: req.user?.id });
  return next();
}

authMiddleware.optional = optionalAuth;

module.exports = authMiddleware;
