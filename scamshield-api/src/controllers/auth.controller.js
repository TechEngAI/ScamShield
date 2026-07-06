const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config/env');
const { supabaseAnon, supabaseAdmin } = require('../config/supabase');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Register a new user account
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.register = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, phone_number, username, password } = req.body;

  // Check if email already exists
  const { data: existingEmail } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (existingEmail) {
    return sendError(res, 'an account with this email already exists', 409);
  }

  // Check if username already exists
  const { data: existingUsername } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle();

  if (existingUsername) {
    return sendError(res, 'username is already taken', 409);
  }

  // Create user in Supabase Auth (this triggers OTP email)
  const { data, error } = await supabaseAnon.auth.signUp({
    email: email.toLowerCase(),
    password,
    options: {
      emailRedirectTo: null,
      data: {
        first_name,
        last_name,
        phone_number,
        username,
      },
    },
  });

  if (error) {
    return sendError(res, error.message || 'failed to create account', 400);
  }

  // Upsert profile data
  await supabaseAdmin.from('profiles').upsert(
    {
      id: data.user.id,
      email: email.toLowerCase(),
      first_name,
      last_name,
      phone_number,
      username: username.toLowerCase(),
      role: 'user',
    },
    { onConflict: 'id' }
  );

  return sendSuccess(
    res,
    {
      email: email.toLowerCase(),
      requires_verification: true,
    },
    'account created. check your email for a 6-digit verification code',
    201
  );
});

/**
 * Verify email with OTP token
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { email, token } = req.body;

  const { data, error } = await supabaseAnon.auth.verifyOtp({
    email: email.toLowerCase(),
    token,
    type: 'signup',
  });

  if (error || !data?.session || !data?.user) {
    return sendError(res, 'invalid or expired verification code', 401);
  }

  // Fetch complete profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, email, first_name, last_name, username, phone_number, role')
    .eq('id', data.user.id)
    .single();

  return sendSuccess(
    res,
    {
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        username: profile?.username || null,
        phone_number: profile?.phone_number || null,
        role: profile?.role || 'user',
      },
    },
    'email verified successfully',
    200
  );
});

/**
 * Login with email and password
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email: email.toLowerCase(),
    password,
  });

  if (error) {
    // Never reveal which field is wrong
    if (error.message?.includes('Email not confirmed')) {
      return sendError(
        res,
        'please verify your email first',
        403,
        null,
        { email: email.toLowerCase(), requires_verification: true }
      );
    }

    return sendError(res, 'invalid email or password', 401);
  }

  // Fetch complete profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, email, first_name, last_name, username, phone_number, role, created_at')
    .eq('id', data.user.id)
    .single();

  return sendSuccess(
    res,
    {
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        username: profile?.username || null,
        phone_number: profile?.phone_number || null,
        role: profile?.role || 'user',
        created_at: profile?.created_at || null,
      },
    },
    'login successful',
    200
  );
});

/**
 * Logout current user
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.logout = asyncHandler(async (req, res) => {
  const authClient = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${req.accessToken}`,
      },
    },
  });

  const { error } = await authClient.auth.signOut();

  if (error) {
    return sendError(res, error.message || 'failed to logout', 400);
  }

  return sendSuccess(res, null, 'logged out successfully', 200);
});

/**
 * Get current user profile
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.me = asyncHandler(async (req, res) => {
  // Fetch fresh profile data from profiles table
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, email, first_name, last_name, username, phone_number, role, created_at')
    .eq('id', req.user.id)
    .single();

  return sendSuccess(
    res,
    {
      id: req.user.id,
      email: req.user.email,
      first_name: profile?.first_name || null,
      last_name: profile?.last_name || null,
      username: profile?.username || null,
      phone_number: profile?.phone_number || null,
      role: profile?.role || 'user',
      created_at: profile?.created_at || null,
    },
    'authenticated user retrieved',
    200
  );
});

/**
 * Resend verification OTP
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const { error } = await supabaseAnon.auth.resend({
    type: 'signup',
    email: email.toLowerCase(),
  });

  if (error) {
    return sendError(res, error.message || 'failed to resend verification code', 400);
  }

  return sendSuccess(res, null, 'verification code resent', 200);
});
