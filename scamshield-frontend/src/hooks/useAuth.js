/**
 * React Authentication Hook (useAuth)
 *
 * Provides authentication state and functions for traditional email+password login
 * with OTP email verification on registration.
 *
 * @module useAuth
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

/**
 * Initialize Supabase client
 * @returns {Object}
 */
function createSupabaseClient() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables not configured. Please check REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in .env"
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Custom React Hook for Authentication
 * @returns {Object}
 */
export function useAuth() {
  const supabaseRef = useRef(null);
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const listenerRef = useRef(null);

  // Initialize Supabase client
  useEffect(() => {
    try {
      supabaseRef.current = createSupabaseClient();
    } catch (err) {
      console.error("Failed to initialize Supabase client:", err);
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  // Restore session from localStorage and set up auth state listener
  useEffect(() => {
    if (!supabaseRef.current) return;

    const initializeAuth = async () => {
      try {
        // Check for existing session
        const {
          data: { session: existingSession },
        } = await supabaseRef.current.auth.getSession();

        if (existingSession) {
          setSession(existingSession);
          
          // Fetch profile data to get username and other custom fields
          const { data: profile } = await supabaseRef.current
            .from('profiles')
            .select('id, email, first_name, last_name, username, phone_number, role, created_at')
            .eq('id', existingSession.user.id)
            .single();
          
          // Merge profile data with user object
          setUser({
            ...existingSession.user,
            ...profile
          });
        }

        // Set up auth state change listener
        const {
          data: { subscription },
        } = supabaseRef.current.auth.onAuthStateChange(
          async (_event, newSession) => {
            setSession(newSession);
            
            if (newSession?.user) {
              // Fetch profile data when session changes
              const { data: profile } = await supabaseRef.current
                .from('profiles')
                .select('id, email, first_name, last_name, username, phone_number, role, created_at')
                .eq('id', newSession.user.id)
                .single();
              
              setUser({
                ...newSession.user,
                ...profile
              });
            } else {
              setUser(null);
            }
          }
        );

        listenerRef.current = subscription;
      } catch (err) {
        console.error("Failed to initialize auth:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Cleanup listener on unmount
    return () => {
      if (listenerRef.current) {
        listenerRef.current.unsubscribe();
      }
    };
  }, []);

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
  const register = useCallback(
    async (firstName, lastName, email, phoneNumber, username, password) => {
      try {
        setError(null);

        const response = await fetch(
          `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/api/auth/register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              first_name: firstName,
              last_name: lastName,
              email: email.toLowerCase(),
              phone_number: phoneNumber,
              username: username.toLowerCase(),
              password,
            }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          const errorMsg =
            data.message ||
            data.error ||
            `HTTP ${response.status}: Failed to register`;
          setError(errorMsg);
          return { success: false, message: errorMsg, errors: data.errors };
        }

        const data = await response.json();

        if (!data.success) {
          setError(data.message);
          return { success: false, message: data.message, errors: data.errors };
        }

        return { success: true, message: data.message, data: data.data };
      } catch (err) {
        console.error("Error registering:", err);
        const errorMsg =
          err.message ||
          "An unexpected error occurred while registering";
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    },
    []
  );

  /**
   * Verify email with OTP token
   * @param {string} email
   * @param {string} token
   * @returns {Promise<Object>}
   */
  const verifyEmail = useCallback(
    async (email, token) => {
      try {
        setError(null);

        const response = await fetch(
          `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/api/auth/verify-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email.toLowerCase(),
              token,
            }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          const errorMsg =
            data.message ||
            data.error ||
            `HTTP ${response.status}: Failed to verify email`;
          setError(errorMsg);
          return { success: false, message: errorMsg };
        }

        const data = await response.json();

        if (!data.success) {
          setError(data.message);
          return { success: false, message: data.message };
        }

        // Set the session in Supabase auth
        await supabaseRef.current.auth.setSession(data.data.session);

        // Merge profile data with user object
        const mergedUser = {
          ...data.data.session.user,
          ...data.data.user
        };
        setUser(mergedUser);

        return { success: true, session: data.data.session, user: mergedUser };
      } catch (err) {
        console.error("Error verifying email:", err);
        const errorMsg =
          err.message ||
          "An unexpected error occurred while verifying email";
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    },
    []
  );

  /**
   * Login with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>}
   */
  const login = useCallback(
    async (email, password) => {
      try {
        setError(null);

        const response = await fetch(
          `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/api/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email.toLowerCase(),
              password,
            }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          const errorMsg =
            data.message ||
            data.error ||
            `HTTP ${response.status}: Failed to login`;
          setError(errorMsg);
          return { 
            success: false, 
            message: errorMsg, 
            requiresVerification: data.data?.requires_verification 
          };
        }

        const data = await response.json();

        if (!data.success) {
          setError(data.message);
          return { success: false, message: data.message };
        }

        // Set the session in Supabase auth
        await supabaseRef.current.auth.setSession(data.data.session);

        // Merge profile data with user object
        const mergedUser = {
          ...data.data.session.user,
          ...data.data.user
        };
        setUser(mergedUser);

        return { success: true, session: data.data.session, user: mergedUser };
      } catch (err) {
        console.error("Error logging in:", err);
        const errorMsg =
          err.message ||
          "An unexpected error occurred while logging in";
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    },
    []
  );

  /**
   * Logout current user
   * @returns {Promise<Object>}
   */
  const logout = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/api/auth/logout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        const errorMsg =
          data.message ||
          data.error ||
          `HTTP ${response.status}: Failed to logout`;
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }

      const data = await response.json();

      if (!data.success) {
        setError(data.message);
        return { success: false, message: data.message };
      }

      // Sign out from Supabase client
      await supabaseRef.current.auth.signOut();

      // Clear local state
      setUser(null);
      setSession(null);

      return { success: true, message: data.message };
    } catch (err) {
      console.error("Error logging out:", err);
      const errorMsg =
        err.message ||
        "An unexpected error occurred while logging out";
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }
  }, [session]);

  /**
   * Resend verification OTP
   * @param {string} email
   * @returns {Promise<Object>}
   */
  const resendOtp = useCallback(
    async (email) => {
      try {
        setError(null);

        const response = await fetch(
          `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/api/auth/resend-otp`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email.toLowerCase(),
            }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          const errorMsg =
            data.message ||
            data.error ||
            `HTTP ${response.status}: Failed to resend OTP`;
          setError(errorMsg);
          return { success: false, message: errorMsg };
        }

        const data = await response.json();

        if (!data.success) {
          setError(data.message);
          return { success: false, message: data.message };
        }

        return { success: true, message: data.message };
      } catch (err) {
        console.error("Error resending OTP:", err);
        const errorMsg =
          err.message ||
          "An unexpected error occurred while resending OTP";
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    },
    []
  );

  /**
   * Clear the error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get the current access token
   * @returns {string|null}
   */
  const getAccessToken = useCallback(() => {
    return session?.access_token || null;
  }, [session]);

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  const isAuthenticated = useCallback(() => {
    return !!user;
  }, [user]);

  return {
    user,
    session,
    isLoading,
    error,
    register,
    verifyEmail,
    login,
    logout,
    resendOtp,
    clearError,
    getAccessToken,
    isAuthenticated,
  };
}

export default useAuth;
