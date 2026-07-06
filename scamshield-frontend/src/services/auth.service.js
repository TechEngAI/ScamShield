/**
 * Auth Service Module for Node.js + Express Backend
 * 
 * Provides wrapper functions for calling Supabase Edge Functions to handle
 * OTP-based email authentication. Designed for use in Express route handlers.
 * 
 * Dependencies:
 * - axios (or any HTTP client)
 * - @supabase/supabase-js (optional, for additional auth operations)
 * 
 * Usage:
 * const authService = require('./auth.service');
 * const result = await authService.sendOtp('user@example.com');
 */

const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

/**
 * Configuration - loaded from environment variables
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1`;

/**
 * Validates that all required environment variables are set
 * 
 * @throws {Error} If any required environment variable is missing
 */
function validateEnv() {
  const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

/**
 * Creates an axios instance for calling Edge Functions
 * 
 * @returns {AxiosInstance} Configured axios instance with base URL and headers
 */
function createEdgeFunctionClient() {
  return axios.create({
    baseURL: EDGE_FUNCTION_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    timeout: 30000, // 30 seconds
  });
}

/**
 * Sends an OTP to the user's email
 * 
 * This function calls the Supabase Edge Function 'send-otp' which generates
 * a 6-digit numeric OTP and sends it via email. The OTP expires in 10 minutes.
 * 
 * @async
 * @param {string} email - The user's email address
 * @returns {Promise<Object>} Result object with success status
 * @returns {Promise<Object>.success} {boolean} Whether the OTP was sent successfully
 * @returns {Promise<Object>.message} {string} Success message or error details
 * 
 * @example
 * try {
 *   const result = await authService.sendOtp('john@example.com');
 *   if (result.success) {
 *     console.log('OTP sent:', result.message);
 *   } else {
 *     console.error('Failed to send OTP:', result.message);
 *   }
 * } catch (error) {
 *   console.error('Network error:', error.message);
 * }
 * 
 * @throws {Error} If network error or invalid input
 */
async function sendOtp(email) {
  try {
    validateEnv();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: "Invalid email format",
      };
    }

    const client = createEdgeFunctionClient();

    const response = await client.post("/send-otp", {
      email,
    });

    return {
      success: response.data.success,
      message: response.data.message || response.data.error,
    };
  } catch (error) {
    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const statusCode = error.response.status;
      const errorMessage = error.response.data?.error || "Unknown error";

      if (statusCode === 429) {
        return {
          success: false,
          message: "Too many OTP requests. Please try again in a few minutes.",
        };
      }

      return {
        success: false,
        message: errorMessage,
      };
    }

    // Network or other error
    console.error("Error calling send-otp Edge Function:", error.message);
    return {
      success: false,
      message: "Failed to send OTP. Please check your connection and try again.",
    };
  }
}

/**
 * Verifies a 6-digit OTP and creates an authenticated session
 * 
 * This function calls the Supabase Edge Function 'verify-otp' which verifies
 * the OTP token and returns a Supabase session with access and refresh tokens.
 * On successful verification, the user profile is automatically created/updated.
 * 
 * @async
 * @param {string} email - The user's email address
 * @param {string} token - The 6-digit OTP token
 * @returns {Promise<Object>} Result object with session data
 * @returns {Promise<Object>.success} {boolean} Whether the OTP was verified successfully
 * @returns {Promise<Object>.session} {Object} Supabase session object (if successful)
 * @returns {Promise<Object>.session.access_token} {string} JWT access token
 * @returns {Promise<Object>.session.refresh_token} {string} Refresh token for session renewal
 * @returns {Promise<Object>.session.expires_in} {number} Token expiry in seconds
 * @returns {Promise<Object>.session.user} {Object} User object with id and email
 * @returns {Promise<Object>.message} {string} Error message (if failed)
 * 
 * @example
 * try {
 *   const result = await authService.verifyOtp('john@example.com', '123456');
 *   if (result.success) {
 *     // Store session tokens securely
 *     const { access_token, refresh_token } = result.session;
 *     console.log('User authenticated:', result.session.user.email);
 *   } else {
 *     console.error('Verification failed:', result.message);
 *   }
 * } catch (error) {
 *   console.error('Network error:', error.message);
 * }
 * 
 * @throws {Error} If network error or invalid input
 */
async function verifyOtp(email, token) {
  try {
    validateEnv();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: "Invalid email format",
      };
    }

    // Validate token format (6 digits)
    if (!/^\d{6}$/.test(token)) {
      return {
        success: false,
        message: "Token must be 6 digits",
      };
    }

    const client = createEdgeFunctionClient();

    const response = await client.post("/verify-otp", {
      email,
      token,
    });

    if (!response.data.success) {
      return {
        success: false,
        message: response.data.error || "Verification failed",
      };
    }

    return {
      success: true,
      session: response.data.session,
    };
  } catch (error) {
    // Handle specific error cases
    if (error.response) {
      const statusCode = error.response.status;
      const errorMessage = error.response.data?.error || "Unknown error";

      if (statusCode === 401) {
        return {
          success: false,
          message: "Invalid or expired OTP. Please request a new one.",
        };
      }

      return {
        success: false,
        message: errorMessage,
      };
    }

    // Network or other error
    console.error("Error calling verify-otp Edge Function:", error.message);
    return {
      success: false,
      message: "Failed to verify OTP. Please check your connection and try again.",
    };
  }
}

/**
 * Creates a Supabase client for database operations (optional)
 * 
 * Use this to perform database operations with service role permissions
 * or to create an authenticated client with user session tokens.
 * 
 * @param {string} [accessToken] - Optional user session access token
 * @returns {SupabaseClient} Configured Supabase client
 * 
 * @example
 * // Use with service role for admin operations
 * const adminClient = createSupabaseClient();
 * 
 * // Use with user session token
 * const userClient = createSupabaseClient(sessionData.access_token);
 */
function createSupabaseClient(accessToken = null) {
  const key = accessToken ? SUPABASE_ANON_KEY : SUPABASE_SERVICE_KEY;
  const client = createClient(SUPABASE_URL, key);

  if (accessToken) {
    // Set the session to allow user-scoped queries
    client.auth.setSession({
      access_token: accessToken,
      refresh_token: "", // You would store and pass the actual refresh token
    });
  }

  return client;
}

/**
 * Retrieves the current user's profile data
 * 
 * @async
 * @param {string} userId - The user's UUID from Supabase auth
 * @param {string} accessToken - The user's session access token
 * @returns {Promise<Object>} User profile object or error
 * @returns {Promise<Object>.success} {boolean} Whether profile was retrieved
 * @returns {Promise<Object>.profile} {Object} User profile data (if successful)
 * @returns {Promise<Object>.message} {string} Error message (if failed)
 * 
 * @example
 * const result = await authService.getUserProfile(userId, accessToken);
 * if (result.success) {
 *   console.log('User:', result.profile.full_name);
 * }
 */
async function getUserProfile(userId, accessToken) {
  try {
    const client = createSupabaseClient(accessToken);
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      profile: data,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    return {
      success: false,
      message: "Failed to retrieve user profile",
    };
  }
}

/**
 * Updates user profile information
 * 
 * @async
 * @param {string} userId - The user's UUID from Supabase auth
 * @param {string} accessToken - The user's session access token
 * @param {Object} updates - Object containing fields to update (full_name, etc)
 * @returns {Promise<Object>} Updated profile or error
 * @returns {Promise<Object>.success} {boolean} Whether update was successful
 * @returns {Promise<Object>.profile} {Object} Updated profile data (if successful)
 * @returns {Promise<Object>.message} {string} Error message (if failed)
 * 
 * @example
 * const result = await authService.updateUserProfile(
 *   userId,
 *   accessToken,
 *   { full_name: 'John Doe' }
 * );
 */
async function updateUserProfile(userId, accessToken, updates) {
  try {
    if (!updates || typeof updates !== "object") {
      return {
        success: false,
        message: "Updates object is required",
      };
    }

    const client = createSupabaseClient(accessToken);
    const { data, error } = await client
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      profile: data,
    };
  } catch (error) {
    console.error("Error updating user profile:", error.message);
    return {
      success: false,
      message: "Failed to update user profile",
    };
  }
}

/**
 * Logs out a user by invalidating their session
 * 
 * This function calls Supabase to invalidate the user's session tokens.
 * The refresh token should be revoked.
 * 
 * @async
 * @param {string} accessToken - The user's session access token
 * @returns {Promise<Object>} Result object
 * @returns {Promise<Object>.success} {boolean} Whether logout was successful
 * @returns {Promise<Object>.message} {string} Status or error message
 * 
 * @example
 * const result = await authService.logout(accessToken);
 * if (result.success) {
 *   console.log('User logged out successfully');
 * }
 */
async function logout(accessToken) {
  try {
    const client = createSupabaseClient(accessToken);
    const { error } = await client.auth.signOut();

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (error) {
    console.error("Error logging out:", error.message);
    return {
      success: false,
      message: "Failed to logout",
    };
  }
}

// Export all functions
module.exports = {
  sendOtp,
  verifyOtp,
  createSupabaseClient,
  getUserProfile,
  updateUserProfile,
  logout,
  validateEnv,
};
