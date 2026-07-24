import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Image, Smartphone, Phone, Plug } from "lucide-react";
import useAuth from "../hooks/useAuth";
import usePWA from "../hooks/usePWA";

const features = [
  {
    icon: MessageSquare,
    title: "AI Text Analysis",
    description:
      "Paste any suspicious message and get an instant verdict powered by AI trained on Nigerian fraud patterns.",
  },
  {
    icon: Image,
    title: "Screenshot Detection",
    description:
      "Upload a screenshot — we extract the text and analyse it for scam indicators automatically.",
  },
  {
    icon: Smartphone,
    title: "WhatsApp Bot",
    description:
      "Forward suspicious messages directly on WhatsApp for instant scam detection.",
  },
  {
    icon: Phone,
    title: "USSD Access",
    description:
      "Feature phone users can check scams via USSD — no smartphone or data needed",
    link: "/ussd",
    linkText: "Try simulator",
  },
  {
    icon: Plug,
    title: "Browser Extension",
    description:
      "Coming soon: automatic scam detection while you browse WhatsApp Web and Gmail",
    link: "/extension",
    linkText: "See mockup",
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
    description:
      "We check for bank impersonation, fake links, and urgency tactics",
  },
  {
    number: "3",
    title: "Get an instant verdict in Pidgin or English",
    description: "Receive clear guidance on whether to respond or ignore",
  },
  {
    number: "4",
    title: "Share warnings with your contacts",
    description: "Generate shareable report links to warn others about scams",
  },
];

function LandingPage() {
  const { user } = useAuth();
  const { isInstallable, installApp, isInstalled } = usePWA();

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
              ScamShield NG uses AI to detect fraudulent messages, fake bank
              alerts, and BVN phishing — in Pidgin and English.
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
            {isInstallable && !isInstalled && (
              <div className="mt-4 flex items-center justify-center">
                <button
                  onClick={installApp}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700
                    border border-slate-600 text-slate-300 px-5 py-2.5 rounded-xl
                    text-sm font-medium transition-colors"
                >
                  <span>📱</span>
                  Install ScamShield NG on your phone
                  <span className="bg-green-600 text-white text-xs px-2 py-0.5
                    rounded-full">Free</span>
                </button>
              </div>
            )}
            {isInstalled && (
              <div className="mt-4 text-center">
                <span className="text-green-400 text-sm">
                  ✅ ScamShield NG is installed on your device
                </span>
              </div>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-slate-500 text-xs">
              <span className="flex items-center gap-1">
                <span className="text-green-400">✓</span> CBN consumer
                protection aligned
              </span>
              <span className="flex items-center gap-1">
                <span className="text-green-400">✓</span> NDPR compliant
              </span>
              <span className="flex items-center gap-1">
                <span className="text-green-400">✓</span> 150 Nigerian fraud
                patterns
              </span>
              <span className="flex items-center gap-1">
                <span className="text-green-400">✓</span> University of Lagos
                built
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
            <p className="mt-2 text-sm font-medium text-slate-400">
              lost to fraud annually (FITC 2023)
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-black text-blue-400">120M+</p>
            <p className="mt-2 text-sm font-medium text-slate-400">
              mobile money users at risk
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-black text-blue-400">10</p>
            <p className="mt-2 text-sm font-medium text-slate-400">
              scam categories detected
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black sm:text-4xl">
              How ScamShield NG Protects You
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Five powerful ways to stay safe from financial fraud
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="card-hover rounded-xl border border-slate-800 bg-slate-900 p-8 flex flex-col"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                    <Icon
                      className="h-6 w-6 text-blue-400"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="mt-4 text-xl font-bold">{feature.title}</h3>
                  <p className="mt-3 text-slate-400 leading-relaxed flex-1">
                    {feature.description}
                  </p>
                  {feature.link && (
                    <Link
                      to={feature.link}
                      className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      {feature.linkText} →
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Institutional alignment section */}
      <section className="py-12 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-slate-500 text-sm uppercase tracking-widest mb-8 font-medium">
            Built for Nigeria's financial ecosystem
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-2xl">
                🏛️
              </div>
              <span className="text-slate-400 text-xs font-medium text-center">
                CBN Guidelines
                <br />
                Aligned
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-2xl">
                ⚖️
              </div>
              <span className="text-slate-400 text-xs font-medium text-center">
                EFCC Anti-Fraud
                <br />
                Standards
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-2xl">
                💻
              </div>
              <span className="text-slate-400 text-xs font-medium text-center">
                NITDA Digital
                <br />
                Framework
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-2xl">
                🎓
              </div>
              <span className="text-slate-400 text-xs font-medium text-center">
                University of Lagos
                <br />
                Innovation
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-2xl">
                🔒
              </div>
              <span className="text-slate-400 text-xs font-medium text-center">
                NDPR Data
                <br />
                Protection
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-slate-400">
              Get protected in four simple steps
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
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
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link
                to="/ussd"
                className="text-slate-400 hover:text-white transition-colors"
              >
                USSD Simulator
              </Link>
              <Link
                to="/extension"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Browser Extension
              </Link>
              <Link
                to="/feed"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Live Feed
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-400">
              Protecting Nigerians from financial fraud
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Built for the AI Guardrails Hackathon
            </p>
          </div>
          <div className="mt-4 text-center text-sm text-slate-500">
            © 2025 ScamShield NG. Free to use.
          </div>
        </div>
      </footer>
    </main>
  );
}

export default LandingPage;
