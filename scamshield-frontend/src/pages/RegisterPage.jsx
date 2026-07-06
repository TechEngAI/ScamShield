import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import LoadingSpinner from "../components/ui/LoadingSpinner";

function RegisterPage() {
  const navigate = useNavigate();
  const { register, user, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  useEffect(() => {
    document.title = "Create Account | ScamShield NG";
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  const validateField = (name, value) => {
    const errors = { ...fieldErrors };

    switch (name) {
      case "firstName":
        if (!value.trim()) {
          errors.firstName = "First name is required";
        } else if (value.trim().length < 2 || value.trim().length > 50) {
          errors.firstName = "First name must be 2-50 characters";
        } else {
          delete errors.firstName;
        }
        break;

      case "lastName":
        if (!value.trim()) {
          errors.lastName = "Last name is required";
        } else if (value.trim().length < 2 || value.trim().length > 50) {
          errors.lastName = "Last name must be 2-50 characters";
        } else {
          delete errors.lastName;
        }
        break;

      case "email":
        if (!value.trim()) {
          errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = "Please enter a valid email address";
        } else {
          delete errors.email;
        }
        break;

      case "phoneNumber":
        if (!value.trim()) {
          errors.phoneNumber = "Phone number is required";
        } else if (!/^(\+234|0)[789]\d{9}$/.test(value)) {
          errors.phoneNumber = "Please enter a valid Nigerian phone number";
        } else {
          delete errors.phoneNumber;
        }
        break;

      case "username":
        if (!value.trim()) {
          errors.username = "Username is required";
        } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
          errors.username = "Username must be 3-20 characters, letters, numbers, and underscores only";
        } else {
          delete errors.username;
        }
        break;

      case "password":
        if (!value) {
          errors.password = "Password is required";
        } else if (value.length < 8) {
          errors.password = "Password must be at least 8 characters";
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          errors.password = "Password must contain uppercase, lowercase, and number";
        } else {
          delete errors.password;
        }
        break;

      default:
        break;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
    setGeneralError("");
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: "none", color: "bg-slate-700", text: "" };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;

    if (score <= 1) return { strength: "weak", color: "bg-red-500", text: "Weak" };
    if (score <= 2) return { strength: "medium", color: "bg-amber-500", text: "Medium" };
    return { strength: "strong", color: "bg-green-500", text: "Strong" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const isValid = Object.keys(formData).every((key) => validateField(key, formData[key]));

    if (!isValid) {
      setGeneralError("Please fix the errors above");
      return;
    }

    setIsSubmitting(true);
    setGeneralError("");

    try {
      const result = await register(
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.phoneNumber,
        formData.username,
        formData.password
      );

      if (result.success) {
        toast.success("Account created! Check your email for verification code");
        navigate("/verify-email", {
          state: { email: formData.email.toLowerCase() }
        });
      } else {
        // Handle specific field errors from backend
        if (result.errors) {
          const backendErrors = {};
          result.errors.forEach((err) => {
            if (err.path) {
              backendErrors[err.path[0]] = err.msg;
            }
          });
          setFieldErrors(backendErrors);
        }

        // Handle general errors
        if (result.message?.includes("email already exists")) {
          setFieldErrors((prev) => ({ ...prev, email: result.message }));
        } else if (result.message?.includes("username is already taken")) {
          setFieldErrors((prev) => ({ ...prev, username: result.message }));
        } else {
          setGeneralError(result.message || "Failed to create account");
        }
      }
    } catch (error) {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading..." />;
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
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
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="mt-2 text-sm text-slate-400">Join ScamShield NG — protect yourself from financial fraud</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Name and Last Name - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-2">
                  First name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className={`w-full rounded-lg border px-4 py-3 text-white placeholder-slate-500 transition-colors focus:ring-2 focus:ring-blue-500/20 outline-none ${
                    fieldErrors.firstName
                      ? "border-red-500 bg-slate-950 focus:border-red-500"
                      : "border-slate-700 bg-slate-950 focus:border-blue-500"
                  }`}
                  required
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-xs font-medium text-red-400">{fieldErrors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-2">
                  Last name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className={`w-full rounded-lg border px-4 py-3 text-white placeholder-slate-500 transition-colors focus:ring-2 focus:ring-blue-500/20 outline-none ${
                    fieldErrors.lastName
                      ? "border-red-500 bg-slate-950 focus:border-red-500"
                      : "border-slate-700 bg-slate-950 focus:border-blue-500"
                  }`}
                  required
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-xs font-medium text-red-400">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full rounded-lg border px-4 py-3 text-white placeholder-slate-500 transition-colors focus:ring-2 focus:ring-blue-500/20 outline-none ${
                  fieldErrors.email
                    ? "border-red-500 bg-slate-950 focus:border-red-500"
                    : "border-slate-700 bg-slate-950 focus:border-blue-500"
                }`}
                required
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs font-medium text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-300 mb-2">
                Phone number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+234 or 08012345678"
                className={`w-full rounded-lg border px-4 py-3 text-white placeholder-slate-500 transition-colors focus:ring-2 focus:ring-blue-500/20 outline-none ${
                  fieldErrors.phoneNumber
                    ? "border-red-500 bg-slate-950 focus:border-red-500"
                    : "border-slate-700 bg-slate-950 focus:border-blue-500"
                }`}
                required
              />
              {fieldErrors.phoneNumber && (
                <p className="mt-1 text-xs font-medium text-red-400">{fieldErrors.phoneNumber}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="letters, numbers, underscores"
                className={`w-full rounded-lg border px-4 py-3 text-white placeholder-slate-500 transition-colors focus:ring-2 focus:ring-blue-500/20 outline-none ${
                  fieldErrors.username
                    ? "border-red-500 bg-slate-950 focus:border-red-500"
                    : "border-slate-700 bg-slate-950 focus:border-blue-500"
                }`}
                required
              />
              {fieldErrors.username && (
                <p className="mt-1 text-xs font-medium text-red-400">{fieldErrors.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full rounded-lg border px-4 py-3 pr-12 text-white placeholder-slate-500 transition-colors focus:ring-2 focus:ring-blue-500/20 outline-none ${
                    fieldErrors.password
                      ? "border-red-500 bg-slate-950 focus:border-red-500"
                      : "border-slate-700 bg-slate-950 focus:border-blue-500"
                  }`}
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
              {fieldErrors.password && (
                <p className="mt-1 text-xs font-medium text-red-400">{fieldErrors.password}</p>
              )}

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-slate-700 overflow-hidden flex gap-1">
                      <div
                        className={`h-full w-1/3 rounded-full transition-all duration-300 ${
                          passwordStrength.strength === "weak" ? "bg-red-500" :
                          passwordStrength.strength === "medium" ? "bg-amber-500" : "bg-green-500"
                        }`}
                      />
                      <div
                        className={`h-full w-1/3 rounded-full transition-all duration-300 ${
                          passwordStrength.strength === "medium" || passwordStrength.strength === "strong" ? "bg-amber-500" : "bg-slate-700"
                        }`}
                      />
                      <div
                        className={`h-full w-1/3 rounded-full transition-all duration-300 ${
                          passwordStrength.strength === "strong" ? "bg-green-500" : "bg-slate-700"
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${
                      passwordStrength.strength === "weak" ? "text-red-400" :
                      passwordStrength.strength === "medium" ? "text-amber-400" : "text-green-400"
                    }`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Must be 8+ characters with uppercase, lowercase, and number
                  </p>
                </div>
              )}
            </div>

            {/* General Error */}
            {generalError && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/50 px-4 py-3 text-sm font-medium text-red-400 flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <span>{generalError}</span>
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
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default RegisterPage;
