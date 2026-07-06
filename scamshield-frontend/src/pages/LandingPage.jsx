import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BrainCircuit, Languages, ShieldCheck, MessageSquare, Image, Smartphone } from "lucide-react";
import useAuth from "../hooks/useAuth";

const features = [
  {
    icon: MessageSquare,
    title: "AI Text Analysis",
    description: "Paste any suspicious message and get an instant verdict powered by AI trained on Nigerian fraud patterns.",
  },
  {
    icon: Image,
    title: "Screenshot Detection",
    description: "Upload a screenshot — we extract the text and analyse it for scam indicators automatically.",
  },
  {
    icon: Smartphone,
    title: "WhatsApp Bot",
    description: "Forward suspicious messages directly on WhatsApp for instant scam detection.",
  },
];

const steps = [
  {
    number: "1",
    title: "Paste or upload the suspicious message",
    description: "Copy the message or upload a screenshot of it",
  },
  {
    number: "2",
    title: "Our AI analyses it against 100+ Nigerian scam patterns",
    description: "We check for bank impersonation, fake links, and urgency tactics",
  },
  {
    number: "3",
    title: "Get an instant verdict in Pidgin or English",
    description: "Receive clear guidance on whether to respond or ignore",
  },
];

function LandingPage() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "ScamShield NG | Nigerian Fraud Detection";
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center dot-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/80 to-slate-950" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-400">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              Built for Nigeria
            </p>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Protect Yourself From{" "}
              <span className="gradient-text">Nigerian Financial Scams</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-slate-400">
              ScamShield NG uses AI to detect fraudulent messages, fake bank alerts, and BVN phishing — in Pidgin
              and English.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                to={user ? "/check" : "/register"}
                className="btn-base inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-blue-500/40"
              >
                {user ? "Check a Message Now" : "Create Account"}
              </Link>
              <Link
                to={user ? "/dashboard" : "/login"}
                className="btn-base inline-flex items-center justify-center rounded-xl border border-slate-700 px-8 py-4 text-base font-semibold text-slate-300 transition-all hover:border-blue-500 hover:text-white hover:bg-slate-800"
              >
                {user ? "View Dashboard" : "Already have an account? Sign in"}
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <span className="text-lg">🛡️</span> Free
              </span>
              <span className="text-slate-700">•</span>
              <span className="flex items-center gap-1">
                <span className="text-lg">🤖</span> AI-Powered
              </span>
              <span className="text-slate-700">•</span>
              <span className="flex items-center gap-1">
                <span className="text-lg">🇳🇬</span> Built for Nigeria
              </span>
              <span className="text-slate-700">•</span>
              <span className="flex items-center gap-1">
                <span className="text-lg">📱</span> Works on WhatsApp
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-slate-800 bg-slate-900/50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-4xl font-black text-blue-400">₦9.5B</p>
            <p className="mt-2 text-sm font-medium text-slate-400">lost to fraud annually (FITC 2023)</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-black text-blue-400">120M+</p>
            <p className="mt-2 text-sm font-medium text-slate-400">mobile money users at risk</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-black text-blue-400">10</p>
            <p className="mt-2 text-sm font-medium text-slate-400">scam categories detected</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black sm:text-4xl">How ScamShield NG Protects You</h2>
            <p className="mt-4 text-lg text-slate-400">Three powerful ways to stay safe from financial fraud</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="card-hover rounded-xl border border-slate-800 bg-slate-900 p-8"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                    <Icon className="h-6 w-6 text-blue-400" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold">{feature.title}</h3>
                  <p className="mt-3 text-slate-400 leading-relaxed">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-slate-400">Get protected in three simple steps</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{step.title}</h3>
                    <p className="mt-2 text-slate-400">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-5 left-10 w-full h-0.5 bg-slate-800 -z-10">
                    <div className="h-full w-full border-t-2 border-dashed border-slate-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
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
              <span className="font-bold">ScamShield NG</span>
            </div>
            <p className="text-center text-slate-400">Protecting Nigerians from financial fraud</p>
            <p className="text-slate-500 text-sm">Built for the AI Guardrails Hackathon</p>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            © 2025 ScamShield NG. Free to use.
          </div>
        </div>
      </footer>
    </main>
  );
}

export default LandingPage;
