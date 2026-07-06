import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, History, Search, ShieldX, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useAuth from "../hooks/useAuth";
import { getDashboardCategories, getDashboardRecent, getDashboardStats, getErrorMessage } from "../services/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
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
  return Object.entries(source).map(([category, count]) => ({ category, count }));
};

function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Dashboard | ScamShield NG";
  }, []);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError("");
      try {
        const [statsData, recentData, categoryData] = await Promise.all([
          getDashboardStats(),
          getDashboardRecent(),
          getDashboardCategories(),
        ]);

        if (!isMounted) return;
        setStats(statsData);
        setRecent(normalizeList(recentData).slice(0, 10));
        setCategories(normalizeCategories(categoryData));
      } catch (requestError) {
        if (isMounted) {
          setError(getErrorMessage(requestError, "Could not load dashboard data."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
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
        <div className="mb-8 flex flex-col gap-4 text-white sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-blue-400">Dashboard</p>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {user?.username || user?.first_name || user?.email} 👋
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

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton rounded-xl border border-slate-800 bg-slate-900 p-6">
                <div className="h-4 bg-slate-800 rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-slate-800 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-900/50 bg-red-950/50 p-5 text-sm font-semibold text-red-400">
            {error}
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.label}
                    className="card-hover rounded-xl border border-slate-800 bg-slate-900 p-6"
                  >
                    <Icon className={`h-7 w-7 ${card.className}`} aria-hidden="true" />
                    <p className={`mt-5 text-3xl font-black ${card.valueClass}`}>
                      {Number(card.value).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-400">{card.label}</p>
                  </article>
                );
              })}
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                  <h2 className="text-lg font-bold text-white">Scams by category</h2>
                </div>
                <div className="mt-5 h-80">
                  {categories.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categories}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                          dataKey="category"
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
                        <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
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
                    <h2 className="text-lg font-bold text-white">Recent activity</h2>
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto">
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
                          key={item.id || `${item.created_at}-${item.message_text}`}
                          className="text-slate-300 hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="max-w-64 py-3 pr-4 font-semibold">{truncate(item.message_text || item.message)}</td>
                          <td className="py-3 pr-4">
                            <VerdictBadge verdict={item.verdict || "suspicious"} />
                          </td>
                          <td className="py-3 pr-4 font-black">{Math.round(Number(item.confidence_score) || 0)}%</td>
                          <td className="whitespace-nowrap py-3 pr-4">{formatDate(item.created_at)}</td>
                          <td className="py-3 font-bold capitalize">{item.source || "web"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!recent.length ? (
                    <div className="rounded-lg bg-slate-950 p-6 text-center text-sm font-semibold text-slate-500">
                      No recent checks yet.
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default DashboardPage;
