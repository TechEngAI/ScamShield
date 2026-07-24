import axios from "axios";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // 60 seconds — handles Railway cold starts
});

const unwrap = (response) => response.data?.data ?? response.data;

api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);

export const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again.",
) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

/**
 * Register a new user account
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} email
 * @param {string} phoneNumber
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object>}
 */
export async function registerUser(
  firstName,
  lastName,
  email,
  phoneNumber,
  username,
  password,
) {
  const response = await api.post("/api/auth/register", {
    first_name: firstName,
    last_name: lastName,
    email: email.toLowerCase(),
    phone_number: phoneNumber,
    username: username.toLowerCase(),
    password,
  });
  return unwrap(response);
}

/**
 * Verify email with OTP token
 * @param {string} email
 * @param {string} token
 * @returns {Promise<Object>}
 */
export async function verifyEmail(email, token) {
  const response = await api.post("/api/auth/verify-email", {
    email: email.toLowerCase(),
    token,
  });
  return unwrap(response);
}

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>}
 */
export async function loginUser(email, password) {
  const response = await api.post("/api/auth/login", {
    email: email.toLowerCase(),
    password,
  });
  return unwrap(response);
}

/**
 * Logout current user
 * @returns {Promise<Object>}
 */
export async function logoutUser() {
  const response = await api.post("/api/auth/logout");
  return unwrap(response);
}

/**
 * Resend verification OTP
 * @param {string} email
 * @returns {Promise<Object>}
 */
export async function resendOtp(email) {
  const response = await api.post("/api/auth/resend-otp", {
    email: email.toLowerCase(),
  });
  return unwrap(response);
}

export async function checkScam(messageText, source) {
  const response = await api.post("/api/scam/check", {
    message_text: messageText,
    source,
  });
  return unwrap(response);
}

/**
 * Analyse an uploaded image for scam content
 * @param {FormData} formData - FormData containing the image file
 */
export async function checkImageScam(formData) {
  const response = await api.post("/api/scam/check-image", formData);
  return unwrap(response);
}

export async function getScamHistory(page = 1, limit = 10, verdict = "all") {
  const params = { page, limit };
  if (verdict && verdict !== "all") {
    params.verdict = verdict;
  }

  const response = await api.get("/api/scam/history", { params });
  return unwrap(response);
}

export async function getDashboardStats() {
  const response = await api.get("/api/dashboard/stats");
  return unwrap(response);
}

export async function getDashboardRecent() {
  const response = await api.get("/api/dashboard/recent");
  return unwrap(response);
}

export async function completeOnboarding() {
  const response = await api.post("/api/dashboard/complete-onboarding");
  return unwrap(response);
}

export async function getProtectionScore() {
  const response = await api.get("/api/dashboard/protection-score");
  return unwrap(response);
}

export async function getDashboardCategories() {
  const response = await api.get("/api/dashboard/categories");
  return unwrap(response);
}

export async function getBankLeaderboard() {
  const response = await api.get("/api/dashboard/banks");
  return unwrap(response);
}

export async function getScamsByState() {
  const response = await api.get("/api/dashboard/states");
  return unwrap(response);
}

// Developer API endpoints
export async function generateApiKey(name) {
  const response = await api.post("/api/developer/keys", { name });
  return unwrap(response);
}

export async function listApiKeys() {
  const response = await api.get("/api/developer/keys");
  return unwrap(response);
}

export async function revokeApiKey(id) {
  const response = await api.delete(`/api/developer/keys/${id}`);
  return unwrap(response);
}

export async function getDeveloperUsage() {
  const response = await api.get("/api/developer/usage");
  return unwrap(response);
}

export async function checkBulkScam(messages) {
  const response = await api.post("/api/scam/check-bulk", { messages });
  return unwrap(response);
}

// Public feed — no auth needed
export const getPublicFeed = async () => {
  const response = await api.get("/api/scam/feed");
  return unwrap(response);
};

// Public report — no auth needed
export const getPublicReport = async (id) => {
  const response = await api.get(`/api/scam/report/${id}`);
  return unwrap(response);
};

export default api;
