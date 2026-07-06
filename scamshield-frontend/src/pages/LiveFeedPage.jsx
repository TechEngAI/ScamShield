import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getPublicFeed, getErrorMessage } from "../services/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import VerdictBadge from "../components/ui/VerdictBadge";

const formatTime = (value) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

function LiveFeedPage() {
  const [feed, setFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [previousFeedLength, setPreviousFeedLength] = useState(0);
  const [newItemsCount, setNewItemsCount] = useState(0);

  const fetchFeed = async () => {
    try {
      const data = await getPublicFeed();
      const currentLength = Array.isArray(data) ? data.length : 0;
      
      // Check for new items
      if (previousFeedLength > 0 && currentLength > previousFeedLength) {
        const newCount = currentLength - previousFeedLength;
        setNewItemsCount(newCount);
        toast.success(`${newCount} new scam${newCount > 1 ? 's' : ''} detected`);
        
        // Clear the notification after 5 seconds
        setTimeout(() => setNewItemsCount(0), 5000);
      }
      
      setFeed(Array.isArray(data) ? data : []);
      setPreviousFeedLength(currentLength);
      setLastUpdated(new Date().toLocaleTimeString());
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not load feed. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Live Scam Feed | ScamShield NG";
    fetchFeed();

    const interval = setInterval(() => {
      fetchFeed();
    }, 10000); // refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const uniqueBanks = [...new Set(feed.map(f => f.impersonated_bank).filter(Boolean))];
  const pidginCount = feed.filter(f => f.language_detected === 'pidgin' || f.language_detected === 'mixed').length;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-red-400 text-sm font-medium uppercase tracking-wider">
              Live Feed
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            🛡️ ScamShield NG — Live Scam Alerts
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Real-time scam detections across Nigeria. Every entry below was flagged 
            by our AI in the last 24 hours.
          </p>
          <div className="flex items-center justify-center gap-6 mt-4">
            <span className="text-slate-400 text-sm">
              Total shown: <span className="text-white font-medium">{feed.length}</span>
            </span>
            <span className="text-slate-400 text-sm">
              Auto-refreshes every 10 seconds
            </span>
            <span className="text-slate-400 text-sm">
              Last updated: <span className="text-white font-medium">{lastUpdated}</span>
            </span>
          </div>
        </div>

        {/* New Items Notification */}
        {newItemsCount > 0 && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 mb-4 text-center text-red-300 text-sm animate-pulse">
            🚨 {newItemsCount} new scam{newItemsCount > 1 ? 's' : ''} detected — feed updated
          </div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{feed.length}</div>
            <div className="text-slate-400 text-xs mt-1">Scams in feed</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{uniqueBanks.length}</div>
            <div className="text-slate-400 text-xs mt-1">Banks targeted</div>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{pidginCount}</div>
            <div className="text-slate-400 text-xs mt-1">In Pidgin/Mixed</div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="h-4 bg-slate-700 rounded w-1/4 mb-3"></div>
                <div className="h-3 bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-900/50 bg-red-950/50 p-5 text-sm font-semibold text-red-400 text-center">
            {error}
          </div>
        ) : feed.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛡️</div>
            <h3 className="text-white text-xl font-medium mb-2">No scams detected yet</h3>
            <p className="text-slate-400 mb-6">
              Be the first to check a suspicious message
            </p>
            <Link
              to="/check"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Check a Message
            </Link>
          </div>
        ) : (
          /* Live Feed Cards */
          <div className="space-y-3">
            {feed.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-red-800 transition-colors duration-200 animate-slide-up"
              >
                {/* Top row: verdict badge + time */}
                <div className="flex items-center justify-between mb-3">
                  <VerdictBadge verdict={item.verdict} />
                  <span className="text-slate-500 text-xs">{formatTime(item.created_at)}</span>
                </div>

                {/* Message preview */}
                <p className="text-slate-300 text-sm mb-3 italic leading-relaxed">
                  "{item.message_text}"
                </p>

                {/* Bottom row: metadata pills */}
                <div className="flex flex-wrap gap-2">
                  {item.scam_category && (
                    <span className="px-2 py-1 bg-slate-900 border border-slate-600 rounded-full text-slate-400 text-xs">
                      📁 {item.scam_category.replace(/_/g, ' ')}
                    </span>
                  )}
                  {item.impersonated_bank && (
                    <span className="px-2 py-1 bg-red-950 border border-red-800 rounded-full text-red-400 text-xs">
                      🏦 {item.impersonated_bank}
                    </span>
                  )}
                  <span className="px-2 py-1 bg-slate-900 border border-slate-600 rounded-full text-slate-400 text-xs">
                    {item.confidence_score}% confidence
                  </span>
                  <span className="px-2 py-1 bg-slate-900 border border-slate-600 rounded-full text-slate-400 text-xs capitalize">
                    📱 {item.source}
                  </span>
                  <span className="px-2 py-1 bg-slate-900 border border-slate-600 rounded-full text-slate-400 text-xs capitalize">
                    🔤 {item.language_detected}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-8 text-center bg-slate-800 border border-slate-700 rounded-xl p-6">
          <p className="text-white font-medium mb-2">
            Received a suspicious message?
          </p>
          <p className="text-slate-400 text-sm mb-4">
            Check it now and protect yourself from Nigerian financial fraud
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/check"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Check on Web
            </Link>
            <Link
              to="/register"
              className="border border-slate-600 hover:border-slate-400 text-slate-300 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default LiveFeedPage;