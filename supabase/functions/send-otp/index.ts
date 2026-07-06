import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

/**
 * Supabase Edge Function: send-otp
 * 
 * Sends a 6-digit OTP to the user's email using Supabase Auth's email OTP flow.
 * This function does NOT use magic links - it sends a numeric OTP only.
 * 
 * Request Body:
 * {
 *   "email": "user@example.com"
 * }
 * 
 * Response on Success (200):
 * {
 *   "success": true,
 *   "message": "OTP sent to your email"
 * }
 * 
 * Response on Error:
 * {
 *   "success": false,
 *   "error": "Error message describing what went wrong"
 * }
 * 
 * HTTP Status Codes:
 * - 200: OTP sent successfully
 * - 400: Bad request (missing email, invalid format)
 * - 429: Too many requests (rate limit exceeded)
 * - 500: Server error
 */

interface SendOtpRequest {
  email?: string;
}

interface SendOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed. Use POST.",
      } as SendOtpResponse),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Parse request body
    let body: SendOtpRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON in request body",
        } as SendOtpResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate email field
    const { email } = body;
    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email field is required and must be a string",
        } as SendOtpResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid email format",
        } as SendOtpResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with service role key for auth operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error",
        } as SendOtpResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    /**
     * RATE LIMITING HINT:
     * For production, implement rate limiting before calling signInWithOtp:
     * 
     * 1. Check Redis or a rate_limit table for the email address
     * 2. Allow max 3 OTP requests per email per 15 minutes
     * 3. Return 429 Too Many Requests if exceeded
     * 
     * Example:
     * const rateLimitKey = `otp_attempts:${email}`;
     * const attempts = await redis.incr(rateLimitKey);
     * if (attempts === 1) {
     *   await redis.expire(rateLimitKey, 900); // 15 minutes
     * }
     * if (attempts > 3) {
     *   return new Response(
     *     JSON.stringify({ success: false, error: "Too many OTP requests. Try again in 15 minutes." }),
     *     { status: 429, headers: { "Content-Type": "application/json" } }
     *   );
     * }
     */

    // Send OTP via email using Supabase Auth
    // shouldCreateUser: true creates the user if they don't exist yet
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error("Supabase OTP error:", error);
      
      // Return specific error messages based on error type
      if (error.message?.includes("rate limit")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Too many OTP requests. Please try again in a few minutes.",
          } as SendOtpResponse),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send OTP. Please try again.",
        } as SendOtpResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP sent to your email. It will expire in 10 minutes.",
      } as SendOtpResponse),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in send-otp:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred",
      } as SendOtpResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
