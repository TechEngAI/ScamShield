import { Link } from "react-router-dom";

function PublicApiDocsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 shadow-2xl shadow-blue-950/20">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-400">
              ScamShield NG API
            </p>
            <h1 className="text-4xl font-black sm:text-5xl">
              Protect your users from Nigerian fraud with a simple REST API
            </h1>
            <p className="mt-5 text-lg text-slate-400">
              Use ScamShield NG to classify suspicious SMS, WhatsApp, and web
              messages in Pidgin or English.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700"
              >
                Get your free API key
              </Link>
              <Link
                to="/developer"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 transition-all hover:border-blue-500 hover:text-white"
              >
                View full developer portal
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold text-white">
              Simple REST API
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Send a message and receive scam verdicts with confidence scores in
              seconds.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold text-white">
              Nigerian Pidgin support
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Built for local fraud patterns, bank impersonation, and urgency
              language.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold text-white">Image analysis</h3>
            <p className="mt-2 text-sm text-slate-400">
              Analyse screenshots and images as part of the same workflow.
            </p>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-2xl font-bold text-white">Quick start</h2>
          <div className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 font-mono text-sm text-green-400">
            <pre>{`curl -X POST \\
  https://scamshield-production-165a.up.railway.app/api/scam/check \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ss_live_your_key_here" \\
  -d '{"message_text": "Dear GTBank customer your BVN don dey flagged...", "source": "api"}'`}</pre>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-2xl font-bold text-white">Pricing</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-3 pr-4 text-left text-slate-400">Plan</th>
                  <th className="pb-3 pr-4 text-left text-slate-400">
                    Monthly calls
                  </th>
                  <th className="pb-3 pr-4 text-left text-slate-400">Price</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800">
                  <td className="py-3 pr-4 font-medium text-white">Free</td>
                  <td className="py-3 pr-4 text-slate-300">100 calls</td>
                  <td className="py-3 pr-4 text-green-400">₦0</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-3 pr-4 font-medium text-white">Pro</td>
                  <td className="py-3 pr-4 text-slate-300">10,000 calls</td>
                  <td className="py-3 pr-4 text-blue-400">₦15,000/mo</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium text-white">
                    Enterprise
                  </td>
                  <td className="py-3 pr-4 text-slate-300">Unlimited</td>
                  <td className="py-3 pr-4 text-purple-400">Custom</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

export default PublicApiDocsPage;
