"use client";

import { useState } from "react";
import { completeOnboarding } from "../services/api";

const onboardingSteps = [
  {
    title: "Welcome to ScamShield NG",
    description:
      "You are now protected against Nigerian financial fraud. ScamShield NG uses AI to detect scam messages in real time — in English and Nigerian Pidgin.",
    items: [
      "Fake bank alerts",
      "BVN phishing",
      "OTP theft",
      "Investment scams",
      "Fake job offers",
      "Government impersonation",
      "Loan scams",
      "Crypto fraud",
    ],
  },
  {
    title: "See ScamShield NG in action",
    description: "This is a real Nigerian scam message our AI detected:",
    example:
      '"Dear GTBank customer, your BVN don dey flagged. Click here to verify or your account go freeze in 24hrs."',
    flags: ["BVN phishing", "Urgency language", "External link"],
  },
  {
    title: "Your Protection Score",
    description: "Your score increases every time you use ScamShield NG",
    score: 20,
    scoreLabel: "/ 100",
    note: "You start at 20 points",
    items: [
      { label: "Check a message", value: "+3 points" },
      { label: "Catch a scam", value: "+5 points" },
      { label: "Reach 100 points", value: "🏆 Fully Protected" },
    ],
  },
];

export default function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);

  const current = onboardingSteps[step - 1];
  const isLastStep = step === onboardingSteps.length;

  const nextStep = () =>
    setStep((prev) => Math.min(prev + 1, onboardingSteps.length));

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await completeOnboarding();
    } catch (err) {
      console.error("Onboarding complete failed", err);
    } finally {
      setIsCompleting(false);
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4 py-6">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-lg w-full mx-auto shadow-2xl shadow-black/40">
        <div className="flex items-center justify-center gap-2 mb-8">
          {onboardingSteps.map((_, index) => {
            const indexPlusOne = index + 1;
            const isActive = indexPlusOne === step;
            const isComplete = indexPlusOne < step;
            return (
              <span
                key={indexPlusOne}
                className={`h-3 w-3 rounded-full transition-colors ${
                  isComplete
                    ? "bg-emerald-400"
                    : isActive
                      ? "bg-blue-400"
                      : "bg-slate-600"
                }`}
              />
            );
          })}
        </div>

        {step === 1 && (
          <div className="text-center">
            <div className="text-6xl mb-4">🛡️</div>
            <h2 className="text-2xl font-bold text-white mb-3">
              {current.title}
            </h2>
            <p className="text-slate-400 mb-6 leading-relaxed">
              {current.description}
            </p>
            <div className="bg-slate-900 rounded-xl p-4 mb-6 border border-slate-700">
              <p className="text-slate-400 text-sm mb-3 font-medium">
                🇳🇬 We protect you from:
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {current.items.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-slate-300"
                  >
                    <span className="text-green-400">✓</span> {item}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={nextStep}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              Get Started →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              {current.title}
            </h2>
            <p className="text-slate-400 text-sm text-center mb-6">
              {current.description}
            </p>
            <div className="bg-slate-900 border border-red-900 rounded-xl p-4 mb-4">
              <p className="text-slate-300 text-sm italic leading-relaxed">
                {current.example}
              </p>
            </div>
            <div className="text-center text-slate-500 text-2xl mb-4">↓</div>
            <div className="bg-red-950 border border-red-800 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">🚨</span>
                <span className="text-red-400 font-bold">
                  SCAM DETECTED — 98% confidence
                </span>
              </div>
              <p className="text-red-300 text-sm leading-relaxed">
                This na scam message. GTBank never dey send BVN verification via
                SMS or WhatsApp. No click anything.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {current.flags.map((flag) => (
                  <span
                    key={flag}
                    className="px-2 py-1 bg-red-900 border border-red-700 rounded-full text-red-300 text-xs"
                  >
                    ⚠ {flag}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={nextStep}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              I understand — protect me →
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">
              {current.title}
            </h2>
            <p className="text-slate-400 text-sm mb-6">{current.description}</p>
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - current.score / 100)}`}
                  style={{ transition: "stroke-dashoffset 1.5s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">
                  {current.score}
                </span>
                <span className="text-slate-400 text-xs">
                  {current.scoreLabel}
                </span>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-2">{current.note}</p>
            <div className="bg-slate-900 rounded-xl p-4 mb-6 text-sm text-slate-400">
              {current.items.map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between mb-2 last:mb-0"
                >
                  <span>{item.label}</span>
                  <span className="text-blue-400">{item.value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-60"
            >
              {isCompleting ? "Finishing..." : "🛡️ Start protecting myself"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
