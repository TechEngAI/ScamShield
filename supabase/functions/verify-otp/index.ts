import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

/**
 * Supabase Edge Function: verify-otp
 * 
 * Verifies a 6-digit OTP token and establishes an authenticated session.
 * On successful verification, automatically upserts the user into the profiles table.
 * 
 * Request Body:
 * {
 *   "email": "user@example.com",
 *   "token": "123456"
 * }
 * 
 * Response on Success (200):
 * {
 *   "success": true,
 *   "session": {
 *     "access_token": "eyJhbGc...",
 *     "refresh_token": "abc123...",
 *     "expires_in": 3600,
 *     "expires_at": 1234567890,
 *     "token_type": "bearer",
 *     "user": {
 *       "id": "uuid",
 *       "email": "user@example.com",
 *       ...
 *     }
 *   }
 * }
 * 
 * Response on Error:
 * {
 *   "success": false,
 *   "error": "Error message describing what went wrong"
 * }
 * 
 * HTTP Status Codes:
 * - 200: OTP verified successfully
 * - 400: Bad request (missing fields, invalid format)
 * - 401: Unauthorized (invalid or expired OTP)
 * - 500: Server error
 */

interface VerifyOtpRequest {
  email?: string;
  token?: string;
}

interface VerifyOtpResponse {
  success: boolean;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;
    token_type: string;
    user: {
      id: string;
      email: string;
      [key: string]: unknown;
    };
  };
  error?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed. Use POST.",
      } as VerifyOtpResponse),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Parse request body
    let body: VerifyOtpRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON in request body",
        } as VerifyOtpResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate required fields
    const { email, token } = body;
    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email field is required and must be a string",
        } as VerifyOtpResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!token || typeof token !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Token field is required and must be a string",
        } as VerifyOtpResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid email format",
        } as VerifyOtpResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate token format (should be 6 digits)
    if (!/^\d{6}$/.test(token)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Token must be 6 digits",
        } as VerifyOtpResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error",
        } as VerifyOtpResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Verify the OTP
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      console.error("OTP verification error:", error);

      // Return specific error for expired/invalid OTP
      if (error.message?.includes("invalid") || error.message?.includes("expired")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid or expired OTP. Please request a new one.",
          } as VerifyOtpResponse),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "OTP verification failed. Please try again.",
        } as VerifyOtpResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data.session || !data.user) {
      console.error("No session or user returned from verifyOtp");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create session",
        } as VerifyOtpResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    /**
     * Create an authenticated Supabase client using the session
     * This allows us to upsert the user profile with the correct user_id
     */
    const authenticatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      },
    });

    // Upsert user into profiles table
    const { error: upsertError } = await authenticatedSupabase
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          email: data.user.email || email,
          full_name: data.user.user_metadata?.full_name || null,
          role: "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );

    if (upsertError) {
      console.error("Error upserting profile:", upsertError);
      // Continue anyway - the session is still valid
      // but log this for monitoring
    }

    // Return session with full details
    return new Response(
      JSON.stringify({
        success: true,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          expires_at: data.session.expires_at,
          token_type: data.session.token_type,
          user: {
            id: data.user.id,
            email: data.user.email || email,
            ...data.user,
          },
        },
      } as VerifyOtpResponse),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in verify-otp:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred",
      } as VerifyOtpResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
