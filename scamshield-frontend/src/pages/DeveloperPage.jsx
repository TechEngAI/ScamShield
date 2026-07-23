import { useEffect, useMemo, useState } from "react";
import { Copy, KeyRound, LineChart, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import {
  generateApiKey,
  getDeveloperUsage,
  listApiKeys,
  revokeApiKey,
} from "../services/api";

const formatDate = (value) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

function DeveloperPage() {
  const [activeTab, setActiveTab] = useState("keys");
  const [keys, setKeys] = useState([]);
  const [stats, setStats] = useState({
    total_calls: 0,
    active_keys: 0,
    keys: [],
    recent_logs: [],
  });
  const [keyName, setKeyName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "Developer API | ScamShield NG";
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [keyData, usageData] = await Promise.all([
        listApiKeys(),
        getDeveloperUsage(),
      ]);
      setKeys(Array.isArray(keyData) ? keyData : []);
      setStats(
        usageData || {
          total_calls: 0,
          active_keys: 0,
          keys: [],
          recent_logs: [],
        },
      );
    } catch (error) {
      console.error("Failed to load developer portal data", error);
      toast.error("Could not load API portal data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!keyName.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateApiKey(keyName.trim());
      setNewKey(result.key);
      setKeyName("");
      await loadData();
      toast.success("API key generated");
    } catch (error) {
      toast.error(error?.message || "Could not generate API key");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async (id) => {
    try {
      await revokeApiKey(id);
      await loadData();
      toast.success("API key revoked");
    } catch (error) {
      toast.error(error?.message || "Could not revoke API key");
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const tabs = useMemo(
    () => [
      { id: "keys", label: "API Keys", icon: KeyRound },
      { id: "usage", label: "Usage Stats", icon: LineChart },
      { id: "docs", label: "Documentation", icon: BookOpen },
    ],
    [],
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🔑 Developer API
          </h1>
          <p className="text-slate-400">
            Integrate ScamShield NG into your app with a REST API designed for
            Nigerian fintech teams, banks, and digital platforms.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {newKey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-yellow-700 bg-slate-800 p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <h3 className="text-lg font-bold text-yellow-400">
                  Save your API key now
                </h3>
              </div>
              <p className="mb-4 text-sm text-slate-400">
                This key will only be shown once. Copy and store it securely.
                You cannot retrieve it again.
              </p>
              <div className="mb-4 rounded-lg border border-slate-600 bg-slate-900 p-3">
                <p className="break-all font-mono text-sm text-green-400">
                  {newKey}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newKey);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {copied ? "✓ Copied!" : "Copy Key"}
                </button>
                <button
                  onClick={() => setNewKey(null)}
                  className="flex-1 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-slate-400"
                >
                  I have saved it
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "keys" && (
          <>
            <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-6">
              <h3 className="mb-4 font-medium text-white">
                Generate New API Key
              </h3>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={keyName}
                  onChange={(event) => setKeyName(event.target.value)}
                  placeholder="Key name e.g. Production App, Test Environment"
                  className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleGenerateKey}
                  disabled={isGenerating || !keyName.trim()}
                  className="whitespace-nowrap rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-slate-700"
                >
                  {isGenerating ? "Generating..." : "+ Generate Key"}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Maximum 5 active keys per account
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-white">Your API Keys</h3>
                <span className="text-sm text-slate-400">
                  {keys.length} total
                </span>
              </div>

              {isLoading ? (
                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-400">
                  Loading your keys...
                </div>
              ) : keys.length === 0 ? (
                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-400">
                  No API keys yet. Generate your first key to start integrating.
                </div>
              ) : (
                keys.map((key) => (
                  <div
                    key={key.id}
                    className="mb-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-medium text-white">
                          {key.name}
                        </span>
                        <span
                          className={`ml-2 rounded-full border px-2 py-0.5 text-xs font-medium ${
                            key.is_active
                              ? "border-green-800 bg-green-950 text-green-400"
                              : "border-slate-700 bg-slate-700 text-slate-400"
                          }`}
                        >
                          {key.is_active ? "Active" : "Revoked"}
                        </span>
                      </div>
                      {key.is_active && (
                        <button
                          onClick={() => handleRevoke(key.id)}
                          className="text-sm text-red-400 transition-colors hover:text-red-300"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="rounded bg-slate-800 px-2 py-1 font-mono">
                        {key.key_prefix}...
                      </span>
                      <span>{key.total_calls} calls</span>
                      <span>Created {formatDate(key.created_at)}</span>
                      {key.last_used_at && (
                        <span>Last used {formatDate(key.last_used_at)}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === "usage" && (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                <p className="text-3xl font-bold text-white">
                  {stats.total_calls}
                </p>
                <p className="mt-1 text-sm text-slate-400">Total API calls</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                <p className="text-3xl font-bold text-green-400">
                  {stats.active_keys}
                </p>
                <p className="mt-1 text-sm text-slate-400">Active keys</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                <p className="text-3xl font-bold text-blue-400">
                  {stats.keys?.reduce(
                    (sum, key) => sum + (key.total_calls || 0),
                    0,
                  ) || 0}
                </p>
                <p className="mt-1 text-sm text-slate-400">Calls this month</p>
              </div>
            </div>

            <div className="space-y-3">
              {stats.keys?.length ? (
                stats.keys.map((key) => (
                  <div
                    key={key.id}
                    className="rounded-xl border border-slate-700 bg-slate-900/70 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-white">{key.name}</span>
                      <span className="font-bold text-blue-400">
                        {key.total_calls} calls
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-700">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{
                          width: `${Math.min((key.total_calls / 1000) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {key.total_calls} / 1000 monthly limit
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-400">
                  No usage activity yet. Your API activity will appear here.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "docs" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <h3 className="mb-3 font-medium text-white">Authentication</h3>
              <p className="mb-4 text-sm text-slate-400">
                Include your API key in the X-API-Key header on every request.
              </p>
              <div className="rounded-lg bg-slate-900 p-4 font-mono text-sm text-green-400">
                <p className="mb-1 text-slate-500">
                  // Add this header to every request
                </p>
                <p>X-API-Key: ss_live_your_api_key_here</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <h3 className="mb-3 font-medium text-white">
                Check a message for scams
              </h3>
              <div className="mb-3 flex gap-2">
                <span className="rounded border border-blue-800 bg-blue-950 px-2 py-1 text-xs font-mono font-bold text-blue-400">
                  POST
                </span>
                <span className="font-mono text-sm text-slate-300">
                  /api/scam/check
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                    cURL
                  </p>
                  <div className="overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-xs text-green-400">
                    <pre>{`curl -X POST \\
  https://scamshield-production-165a.up.railway.app/api/scam/check \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ss_live_your_key_here" \\
  -d '{"message_text": "Dear GTBank customer your BVN don dey flagged...", "source": "api"}'`}</pre>
                  </div>
                  <button
                    onClick={() =>
                      copyCode(`curl -X POST \\
  https://scamshield-production-165a.up.railway.app/api/scam/check \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ss_live_your_key_here" \\
  -d '{"message_text": "Dear GTBank customer your BVN don dey flagged...", "source": "api"}'`)
                    }
                    className="mt-2 text-xs text-slate-500 transition-colors hover:text-slate-300"
                  >
                    Copy cURL
                  </button>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                    JavaScript / Node.js
                  </p>
                  <div className="overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-xs text-green-400">
                    <pre>{`const response = await fetch(
  'https://scamshield-production-165a.up.railway.app/api/scam/check',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'ss_live_your_key_here'
    },
    body: JSON.stringify({
      message_text: 'Dear GTBank customer your BVN don dey flagged...',
      source: 'api'
    })
  }
);
const data = await response.json();
console.log(data.data.verdict);`}</pre>
                  </div>
                  <button
                    onClick={() =>
                      copyCode(
                        `const response = await fetch('https://scamshield-production-165a.up.railway.app/api/scam/check',{method:'POST',headers:{'Content-Type':'application/json','X-API-Key':'ss_live_your_key_here'},body:JSON.stringify({message_text:'Dear GTBank customer your BVN don dey flagged...',source:'api'})});const data = await response.json();console.log(data.data.verdict);`,
                      )
                    }
                    className="mt-2 text-xs text-slate-500 transition-colors hover:text-slate-300"
                  >
                    Copy JavaScript
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <h3 className="mb-3 font-medium text-white">Response format</h3>
              <div className="overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-xs text-green-400">
                <pre>{`{
  "success": true,
  "message": "scam check completed",
  "data": {
    "verdict": "scam",
    "confidence_score": 98,
    "scam_category": "bvn_phishing",
    "impersonated_bank": "GTBank",
    "explanation": "This na scam...",
    "language_detected": "pidgin",
    "red_flags": ["urgency language", "bvn verification request"],
    "safe_to_click": false,
    "recommended_action": "Do not click any link..."
  }
}`}</pre>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <h3 className="mb-4 font-medium text-white">
                Rate limits & pricing
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="pb-3 pr-4 text-left text-slate-400">
                        Plan
                      </th>
                      <th className="pb-3 pr-4 text-left text-slate-400">
                        Monthly calls
                      </th>
                      <th className="pb-3 pr-4 text-left text-slate-400">
                        Price
                      </th>
                      <th className="pb-3 text-left text-slate-400">
                        Features
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-800">
                      <td className="py-3 pr-4 font-medium text-white">Free</td>
                      <td className="py-3 pr-4 text-slate-300">100 calls</td>
                      <td className="py-3 pr-4 text-green-400">₦0</td>
                      <td className="py-3 text-xs text-slate-400">
                        Basic detection
                      </td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="py-3 pr-4 font-medium text-white">Pro</td>
                      <td className="py-3 pr-4 text-slate-300">10,000 calls</td>
                      <td className="py-3 pr-4 text-blue-400">₦15,000/mo</td>
                      <td className="py-3 text-xs text-slate-400">
                        Full detection + Pidgin + Image
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-medium text-white">
                        Enterprise
                      </td>
                      <td className="py-3 pr-4 text-slate-300">Unlimited</td>
                      <td className="py-3 pr-4 text-purple-400">Custom</td>
                      <td className="py-3 text-xs text-slate-400">
                        Custom patterns + SLA
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Contact us to upgrade: hello@scamshield.ng
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default DeveloperPage;
