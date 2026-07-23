import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  History,
  Search,
  ShieldX,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import useAuth from "../hooks/useAuth";
import {
  completeOnboarding,
  getBankLeaderboard,
  getDashboardCategories,
  getDashboardRecent,
  getDashboardStats,
  getErrorMessage,
  getProtectionScore,
} from "../services/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import OnboardingModal from "../components/OnboardingModal";
import VerdictBadge from "../components/ui/VerdictBadge";

const formatDate = (value) =>
  value
    ? `${new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))} · ${new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value))}`
    : "Unknown";

const truncate = (value, limit = 60) => {
  const text = String(value || "");
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
};

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.recent)) return payload.recent;
  if (Array.isArray(payload?.checks)) return payload.checks;
  return [];
};

const normalizeCategories = (payload) => {
  if (Array.isArray(payload)) return payload;
  const source = payload?.categories || payload || {};
  return Object.entries(source).map(([category, count]) => ({
    category,
    count,
  }));
};

const categoryLabels = {
  bvn_phishing: "BVN Phishing",
  fake_bank_alert: "Fake Bank Alert",
  otp_theft: "OTP Theft",
  prize_scam: "Prize Scam",
  cbn_impersonation: "CBN Impersonation",
  loan_scam: "Loan Scam",
  job_scam: "Job Scam",
  investment_scam: "Investment Scam",
  sim_swap: "SIM Swap",
  whatsapp_bot_impersonation: "WhatsApp Impersonation",
  fake_job_offer: "Fake Job Offer",
  fake_investment: "Fake Investment",
  government_impersonation: "Government Impersonation",
  telecom_scam: "Telecom Scam",
  romance_scam: "Romance Scam",
  crypto_scam: "Crypto Scam",
};

function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bankLeaderboard, setBankLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [protectionScore, setProtectionScore] = useState(0);
  const [scoreData, setScoreData] = useState(null);

  // Per-section loading states for progressive rendering
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [banksLoading, setBanksLoading] = useState(true);

  useEffect(() => {
    document.title = "Dashboard | ScamShield NG";
  }, []);

  useEffect(() => {
    if (!user) return;

    getProtectionScore()
      .then((data) => {
        setProtectionScore(data.score || 0);
        setScoreData(data);
        if (!data.onboarding_completed) {
          setShowOnboarding(true);
        }
      })
      .catch(() => {
        // ignore onboarding fetch failures
      });

    let isMounted = true;
    setError("");
    setIsLoading(true);

    // Load each section independently so UI appears progressively.
    getDashboardStats()
      .then((data) => {
        if (!isMounted) return;
        if (data) setStats(data);
      })
      .catch(() => {
        if (!isMounted) return;
        setError(
          (e) => e || "Dashboard is taking longer than usual. Please retry.",
        );
      })
      .finally(() => {
        if (!isMounted) return;
        setStatsLoading(false);
      });

    getDashboardRecent()
      .then((data) => {
        if (!isMounted) return;
        setRecent(normalizeList(data).slice(0, 10));
      })
      .catch(() => {
        if (!isMounted) return;
        setError(
          (e) => e || "Dashboard is taking longer than usual. Please retry.",
        );
      })
      .finally(() => {
        if (!isMounted) return;
        setRecentLoading(false);
      });

    getDashboardCategories()
      .then((data) => {
        if (!isMounted) return;
        setCategories(normalizeCategories(data));
      })
      .catch(() => {
        if (!isMounted) return;
        setError(
          (e) => e || "Dashboard is taking longer than usual. Please retry.",
        );
      })
      .finally(() => {
        if (!isMounted) return;
        setCategoriesLoading(false);
      });

    getBankLeaderboard()
      .then((data) => {
        if (!isMounted) return;
        setBankLeaderboard(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!isMounted) return;
        setError(
          (e) => e || "Dashboard is taking longer than usual. Please retry.",
        );
      })
      .finally(() => {
        if (!isMounted) return;
        setBanksLoading(false);
      });

    // When all sections finish, clear overall loading
    const finishChecker = setInterval(() => {
      if (!isMounted) return;
      if (
        !statsLoading &&
        !recentLoading &&
        !categoriesLoading &&
        !banksLoading
      ) {
        setIsLoading(false);
        clearInterval(finishChecker);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearInterval(finishChecker);
    };
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total messages checked",
      value: stats?.total_messages_checked ?? stats?.total_checks ?? 0,
      icon: Search,
      className: "text-white",
      valueClass: "text-white",
    },
    {
      label: "Total scams blocked",
      value: stats?.total_scams_blocked ?? stats?.scam_count ?? 0,
      icon: ShieldX,
      className: "text-red-400",
      valueClass: "text-red-400",
    },
    {
      label: "Total safe",
      value: stats?.total_safe ?? stats?.safe_count ?? 0,
      icon: CheckCircle2,
      className: "text-green-400",
      valueClass: "text-green-400",
    },
    {
      label: "Total suspicious",
      value: stats?.total_suspicious ?? stats?.suspicious_count ?? 0,
      icon: AlertTriangle,
      className: "text-amber-400",
      valueClass: "text-amber-400",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {showOnboarding && (
          <OnboardingModal
            onComplete={async () => {
              setShowOnboarding(false);
              try {
                const data = await getProtectionScore();
                setProtectionScore(data.score || 0);
                setScoreData(data);
              } catch (err) {
                console.error(
                  "Failed to refresh protection score after onboarding",
                  err,
                );
              }
            }}
          />
        )}

        <div className="mb-8 flex flex-col gap-4 text-white sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-blue-400">
              Dashboard
            </p>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {user?.username || user?.first_name || user?.email}{" "}
              👋
            </h1>
            <p className="text-slate-400 mt-1">
              {user?.first_name} {user?.last_name} • {user?.email}
            </p>
          </div>
          <Link
            to="/check"
            className="btn-base inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700"
          >
            Check a Message
          </Link>
        </div>

        <div className="mb-6 rounded-3xl border border-blue-700/40 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-6 shadow-lg shadow-blue-500/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-slate-400 text-sm">Your Protection Score</p>
              <div className="mt-2 flex items-end gap-3">
                <span className="text-5xl font-black text-white">
                  {protectionScore}
                </span>
                <span className="text-slate-400">/ 100</span>
              </div>
              <p className="mt-3 max-w-2xl text-sm text-slate-400">
                {protectionScore < 40
                  ? "Keep checking messages to increase your score."
                  : protectionScore < 70
                    ? "Good progress — you are building protection."
                    : protectionScore < 90
                      ? "Strong protection — keep it up."
                      : "🏆 Maximum protection achieved"}
              </p>
            </div>
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - protectionScore / 100)}`}
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">
                  {protectionScore}
                </span>
              </div>
            </div>
          </div>
          {scoreData && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 border-t border-slate-800 pt-5 text-sm text-slate-400">
              <div className="rounded-2xl bg-slate-950/80 p-4">
                <p className="text-2xl font-bold text-white">
                  {scoreData.total_checks || 0}
                </p>
                <p className="text-slate-400 text-xs mt-1">Messages checked</p>
              </div>
              <div className="rounded-2xl bg-slate-950/80 p-4">
                <p className="text-2xl font-bold text-red-400">
                  {scoreData.scams_caught || 0}
                </p>
                <p className="text-slate-400 text-xs mt-1">Scams caught</p>
              </div>
            </div>
          )}
        </div>

        {statsLoading && recentLoading && categoriesLoading && banksLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-white font-medium mb-1">
                Loading your dashboard...
              </p>
              <p className="text-slate-400 text-sm">
                First load may take up to 30 seconds after inactivity
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-950 border border-red-800 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-red-400 text-xl flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="text-red-400 font-medium mb-1">
                  Dashboard taking longer than usual
                </p>
                <p className="text-red-300 text-sm mb-4">
                  This happens when the server restarts after inactivity. Your
                  data is safe — click retry to load it.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  🔄 Retry
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statsLoading
                ? [1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="skeleton rounded-xl border border-slate-800 bg-slate-900 p-6 animate-pulse"
                    >
                      <div className="h-4 bg-slate-800 rounded w-1/2 mb-4"></div>
                      <div className="h-10 bg-slate-800 rounded w-1/3"></div>
                    </div>
                  ))
                : statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <article
                        key={card.label}
                        className="card-hover rounded-xl border border-slate-800 bg-slate-900 p-6"
                      >
                        <Icon
                          className={`h-7 w-7 ${card.className}`}
                          aria-hidden="true"
                        />
                        <p
                          className={`mt-5 text-3xl font-black ${card.valueClass}`}
                        >
                          {Number(card.value).toLocaleString()}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-400">
                          {card.label}
                        </p>
                      </article>
                    );
                  })}
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <h2 className="text-lg font-bold text-white">
                    Scams by category
                  </h2>
                </div>
                <div className="mt-5 h-80">
                  {categoriesLoading ? (
                    <div className="h-full rounded-lg bg-slate-900 p-4 animate-pulse" />
                  ) : categories.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categories.map((item) => ({
                          ...item,
                          display_category:
                            categoryLabels[item.category] || item.category,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                          dataKey="display_category"
                          tick={{ fontSize: 11, fill: "#94A3B8" }}
                          stroke="#475569"
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: "#94A3B8" }}
                          stroke="#475569"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1E293B",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                            color: "#F8FAFC",
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="#3B82F6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-slate-500">
                      No category data yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-blue-400" />
                    <h2 className="text-lg font-bold text-white">
                      Recent activity
                    </h2>
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto">
                  {recentLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-12 bg-slate-800 rounded animate-pulse"
                        />
                      ))}
                    </div>
                  ) : !recent.length ? (
                    <div className="rounded-lg bg-slate-950 p-6 text-center text-sm font-semibold text-slate-500">
                      No recent checks yet.
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-slate-800 text-sm">
                      <thead>
                        <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
                          <th className="py-3 pr-4">Message</th>
                          <th className="py-3 pr-4">Verdict</th>
                          <th className="py-3 pr-4">Confidence</th>
                          <th className="py-3 pr-4">Date/time</th>
                          <th className="py-3">Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {recent.map((item) => (
                          <tr
                            key={
                              item.id ||
                              `${item.created_at}-${item.message_text}`
                            }
                            className="text-slate-300 hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="max-w-64 py-3 pr-4 font-semibold">
                              {truncate(item.message_text || item.message)}
                            </td>
                            <td className="py-3 pr-4">
                              <VerdictBadge
                                verdict={item.verdict || "suspicious"}
                              />
                            </td>
                            <td className="py-3 pr-4 font-black">
                              {Math.round(Number(item.confidence_score) || 0)}%
                            </td>
                            <td className="whitespace-nowrap py-3 pr-4">
                              {formatDate(item.created_at)}
                            </td>
                            <td className="py-3 font-bold capitalize">
                              {item.source || "web"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </section>

            {/* Bank Impersonation Leaderboard */}
            {banksLoading ? (
              <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-white">
                    🏦 Most Impersonated Banks
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Banks most frequently targeted by scammers
                  </p>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="skeleton h-4 w-24 bg-slate-800 rounded"></div>
                      <div className="flex-1 bg-slate-800 rounded-full h-3"></div>
                      <div className="skeleton h-4 w-12 bg-slate-800 rounded"></div>
                    </div>
                  ))}
                </div>
              </section>
            ) : bankLeaderboard.length > 0 ? (
              <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-white">
                    🏦 Most Impersonated Banks
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Banks most frequently targeted by scammers
                  </p>
                </div>
                <div className="space-y-3">
                  {bankLeaderboard.map((bank) => (
                    <div
                      key={bank.bank_name}
                      className="flex items-center gap-3"
                    >
                      <span className="text-slate-300 text-sm w-24 flex-shrink-0">
                        {bank.bank_name}
                      </span>
                      <div className="flex-1 bg-slate-700 rounded-full h-3">
                        <div
                          className="bg-red-500 h-3 rounded-full transition-all duration-700"
                          style={{ width: `${bank.percentage}%` }}
                        />
                      </div>
                      <span className="text-red-400 text-sm font-medium w-12 text-right">
                        {bank.count}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-white">
                    🏦 Most Impersonated Banks
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Banks most frequently targeted by scammers
                  </p>
                </div>
                <div className="flex items-center justify-center rounded-lg bg-slate-950 p-6 text-sm font-semibold text-slate-500">
                  No bank impersonation data yet. Check more messages to see
                  patterns.
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default DashboardPage;
