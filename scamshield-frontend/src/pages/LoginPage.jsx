import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import LoadingSpinner from "../components/ui/LoadingSpinner";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout, resendOtp, user, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [requiresVerificationEmail, setRequiresVerificationEmail] = useState(null);

  useEffect(() => {
    document.title = "Login | ScamShield NG";
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setRequiresVerificationEmail(null);
    setIsSubmitting(true);

    try {
      const result = await login(email.trim().toLowerCase(), password);

      if (result.success) {
        toast.success("Welcome back!");
        navigate("/dashboard", { replace: true });
      } else {
        // Check if email verification is required
        if (result.requiresVerification) {
          setRequiresVerificationEmail(email.trim().toLowerCase());
          setError("Your email is not verified.");
        } else {
          setError("Invalid email or password");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!requiresVerificationEmail) return;

    try {
      const result = await resendOtp(requiresVerificationEmail);
      if (result.success) {
        toast.success("Verification code resent");
        navigate("/verify-email", {
          state: { email: requiresVerificationEmail }
        });
      } else {
        toast.error(result.message || "Failed to resend verification code");
      }
    } catch (err) {
      toast.error("Failed to resend verification code");
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading secure login..." />;
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <svg width="48" height="48" viewBox="0 0 32 32" fill="none" className="mx-auto">
            <path
              d="M16 2L4 7V15C4 21.6 9.2 27.8 16 30C22.8 27.8 28 21.6 28 15V7L16 2Z"
              fill="#3B82F6"
            />
            <path
              d="M12 16L15 19L21 13"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-400">Sign in to your ScamShield NG account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 pr-12 text-white placeholder-slate-500 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/50 px-4 py-3 text-sm font-medium text-red-400 flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <span>{error}</span>
                {requiresVerificationEmail && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="ml-auto font-semibold underline hover:text-red-300"
                  >
                    Resend verification code
                  </button>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-base w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
