import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const OTP_LENGTH = 6;

function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const { verifyEmail, resendOtp } = useAuth();

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);
  const hasSubmittedRef = useRef(false);

  const token = useMemo(() => digits.join(""), [digits]);

  useEffect(() => {
    document.title = "Verify Email | ScamShield NG";
  }, []);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCountdown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (token.length === OTP_LENGTH && !digits.includes("") && !hasSubmittedRef.current) {
      hasSubmittedRef.current = true;
      handleVerify(token);
    }
  }, [digits, token]);

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  const handleVerify = async (nextToken = token) => {
    if (!/^\d{6}$/.test(nextToken) || isVerifying) {
      hasSubmittedRef.current = false;
      return;
    }

    setError("");
    setIsVerifying(true);
    const result = await verifyEmail(email, nextToken);
    setIsVerifying(false);

    if (result.success) {
      toast.success("Email verified! Welcome to ScamShield NG");
      navigate("/dashboard", { replace: true });
    } else {
      setError("Invalid or expired code. Try resending.");
      hasSubmittedRef.current = false;
      inputRefs.current[0]?.focus();
    }
  };

  const handleDigitChange = (index, value) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = nextValue;
    setDigits(nextDigits);
    setError("");
    hasSubmittedRef.current = false;

    if (nextValue && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted.length !== OTP_LENGTH) {
      setError("Paste the complete 6-digit code.");
      return;
    }

    setDigits(pasted.split(""));
    setError("");
    hasSubmittedRef.current = false;
  };

  const handleResend = async () => {
    setError("");
    const result = await resendOtp(email);
    if (result.success) {
      toast.success("A fresh verification code has been sent");
      setDigits(Array(OTP_LENGTH).fill(""));
      setCountdown(60);
      hasSubmittedRef.current = false;
      inputRefs.current[0]?.focus();
    } else {
      setError(result.message || "Could not resend verification code. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
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
            <h1 className="text-2xl font-bold text-white">Verify your email</h1>
            <p className="mt-2 text-sm text-slate-400">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-blue-400">{email}</span>
            </p>
          </div>

          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              handleVerify();
            }}
          >
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={`otp-${index}`}
                  ref={(node) => {
                    inputRefs.current[index] = node;
                  }}
                  value={digit}
                  onChange={(event) => handleDigitChange(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 bg-slate-950 text-white placeholder-slate-600 transition-all outline-none ${
                    error
                      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  }`}
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>

            {error ? (
              <p className="text-center text-sm font-medium text-red-400 flex items-center justify-center gap-2">
                <span>⚠️</span>
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isVerifying || token.length !== OTP_LENGTH}
              className="btn-base w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:shadow-none"
            >
              {isVerifying ? (
                <LoadingSpinner label="Verifying..." size="sm" />
              ) : (
                "Verify Email"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            {countdown > 0 ? (
              <p className="text-sm font-medium text-slate-400">Resend code in {countdown}s</p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Resend verification code
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/register"
            className="text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
          >
            Wrong email? Go back
          </Link>
        </div>
      </div>
    </main>
  );
}

export default VerifyEmailPage;
