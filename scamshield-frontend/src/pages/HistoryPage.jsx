import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { getErrorMessage, getScamHistory } from "../services/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import VerdictBadge from "../components/ui/VerdictBadge";

const filters = [
  { value: "all", label: "All" },
  { value: "scam", label: "Scam" },
  { value: "safe", label: "Safe" },
  { value: "suspicious", label: "Suspicious" },
];

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

const truncate = (value, limit = 70) => {
  const text = String(value || "");
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
};

const normalizeHistory = (payload) => {
  if (Array.isArray(payload)) {
    return { items: payload, totalPages: payload.length ? 1 : 0 };
  }

  const items = payload?.items || payload?.rows || payload?.checks || payload?.history || [];
  const totalPages = payload?.total_pages || payload?.totalPages || payload?.pagination?.totalPages || 1;
  return { items, totalPages };
};

function HistoryPage() {
  const [checks, setChecks] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "History | ScamShield NG";
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      setIsLoading(true);
      setError("");
      try {
        const payload = await getScamHistory(page, 10, filter);
        if (!isMounted) return;
        const normalized = normalizeHistory(payload);
        setChecks(normalized.items);
        setTotalPages(Math.max(1, Number(normalized.totalPages) || 1));
      } catch (requestError) {
        if (isMounted) {
          setError(getErrorMessage(requestError, "Could not load your history."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [page, filter]);

  const selectFilter = (nextFilter) => {
    setFilter(nextFilter);
    setPage(1);
    setExpandedId(null);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-white">
          <p className="text-sm font-black uppercase tracking-widest text-blue-400">History</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Your past scam checks</h1>
          <p className="mt-2 text-sm text-slate-400">Review messages you have analysed and the advice you received.</p>
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-blue-950/20">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => selectFilter(item.value)}
                className={`btn-base rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  filter === item.value
                    ? "bg-blue-600 text-white shadow-md"
                    : "border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="p-10">
              <LoadingSpinner label="Loading history..." size="lg" />
            </div>
          ) : error ? (
            <div className="mt-5 rounded-lg border border-red-900/50 bg-red-950/50 p-4 text-sm font-semibold text-red-400">
              {error}
            </div>
          ) : checks.length ? (
            <>
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800 text-sm">
                  <thead>
                    <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      <th className="py-3 pr-4">Message</th>
                      <th className="py-3 pr-4">Verdict</th>
                      <th className="py-3 pr-4">Confidence</th>
                      <th className="py-3 pr-4">Category</th>
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3">Open</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {checks.map((item, index) => {
                      const rowId = item.id || `${item.created_at}-${index}`;
                      const isExpanded = expandedId === rowId;
                      return (
                        <tr
                          key={rowId}
                          className="cursor-pointer align-top text-slate-300 hover:bg-slate-800/50 transition-colors"
                          onClick={() => setExpandedId(isExpanded ? null : rowId)}
                        >
                          <td className="max-w-md py-4 pr-4 font-semibold">
                            {truncate(item.message_text || item.message)}
                            {isExpanded ? (
                              <div className="mt-4 rounded-lg bg-slate-950 p-4 border-l-4 border-blue-500">
                                <p className="text-sm font-bold text-white">Full message</p>
                                <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-300">
                                  {item.message_text || item.message}
                                </p>
                                <p className="mt-4 text-sm font-bold text-white">Explanation</p>
                                <p className="mt-2 leading-6 text-slate-400">
                                  {item.explanation || "No explanation was saved for this check."}
                                </p>
                              </div>
                            ) : null}
                          </td>
                          <td className="py-4 pr-4">
                            <VerdictBadge verdict={item.verdict || "suspicious"} />
                          </td>
                          <td className="py-4 pr-4 font-black">{Math.round(Number(item.confidence_score) || 0)}%</td>
                          <td className="py-4 pr-4 font-semibold">{item.scam_category || item.category || "Uncategorised"}</td>
                          <td className="whitespace-nowrap py-4 pr-4">{formatDate(item.created_at)}</td>
                          <td className="py-4">
                            <ChevronDown
                              className={`h-5 w-5 transition-transform duration-200 ${
                                isExpanded ? "rotate-180 text-blue-400" : "text-slate-500"
                              }`}
                              aria-hidden="true"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="btn-base inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-800 transition-all hover:border-blue-500 hover:text-white hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Previous
                </button>
                <p className="text-center text-sm font-semibold text-slate-400">
                  Page {page} of {totalPages}
                </p>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  className="btn-base inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-800 transition-all hover:border-blue-500 hover:text-white hover:bg-slate-800"
                >
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-lg bg-slate-950 p-8 text-center">
              <p className="text-lg font-bold text-white">No checks yet. Try checking a message!</p>
              <Link
                to="/check"
                className="mt-5 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700"
              >
                Check a Message
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default HistoryPage;
