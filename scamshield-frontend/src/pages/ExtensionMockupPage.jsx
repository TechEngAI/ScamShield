import { Link } from "react-router-dom";

function ExtensionMockupPage() {
  return (
    <main className="min-h-screen bg-slate-900 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-blue-900/50 border border-blue-700 text-blue-300 text-xs px-3 py-1 rounded-full mb-3">
            Concept mockup — extension in development
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            🔌 ScamShield NG Browser Extension
          </h1>
          <p className="text-slate-400">
            Protect yourself from scams while browsing — coming soon
          </p>
        </div>

        {/* Browser Mockup */}
        <div className="max-w-3xl mx-auto">
          {/* Browser frame */}
          <div className="bg-gray-200 rounded-t-xl border border-gray-300">
            {/* Browser chrome */}
            <div className="px-4 py-2 flex items-center gap-3">
              {/* Traffic light buttons */}
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              {/* URL bar */}
              <div className="flex-1 bg-white rounded-full px-4 py-1 text-xs text-gray-500 border border-gray-300 flex items-center gap-2">
                <span>🔒</span>
                <span>whatsapp.com/messages</span>
              </div>
              {/* Extension icon in toolbar */}
              <div className="relative">
                <div
                  className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center cursor-pointer text-white text-xs font-bold"
                  title="ScamShield NG"
                >
                  SS
                </div>
                {/* Red notification dot */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-gray-200"></div>
              </div>
            </div>
          </div>

          {/* Browser content area */}
          <div className="bg-white max-w-3xl border border-gray-300 border-t-0 relative min-h-64 p-6">
            {/* Fake webpage content */}
            <div className="text-gray-800 text-sm mb-4">
              <p className="font-medium mb-2">Messages (3)</p>
              <div className="border rounded-lg p-3 mb-2 bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">From: +234 801 234 5678</p>
                {/* Highlighted scam message */}
                <p className="text-sm relative">
                  <span className="bg-red-100 border border-red-300 rounded px-1 text-red-800 relative">
                    Dear GTBank customer, your BVN is flagged. Click here to verify now.
                    {/* Scam indicator tooltip */}
                    <span className="absolute -top-6 left-0 bg-red-600 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
                      ⚠ ScamShield: SCAM DETECTED
                    </span>
                  </span>
                </p>
              </div>
              <div className="border rounded-lg p-3 bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">From: Kuda Bank</p>
                <p className="text-sm text-gray-700">
                  Your savings interest of ₦1,250 has been credited for July.
                </p>
              </div>
            </div>

            {/* Extension popup — positioned top right */}
            <div className="absolute top-4 right-4 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
              {/* Popup header */}
              <div className="bg-slate-900 px-3 py-2 flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                  SS
                </div>
                <span className="text-white text-xs font-medium">ScamShield NG</span>
                <span className="ml-auto text-gray-500 text-xs cursor-pointer">✕</span>
              </div>

              {/* Scam alert in popup */}
              <div className="p-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-red-600 text-xs">🚨</span>
                    <span className="text-red-700 text-xs font-semibold">Scam Detected</span>
                    <span className="ml-auto text-red-600 text-xs font-bold">98%</span>
                  </div>
                  <p className="text-red-600 text-xs">
                    GTBank BVN phishing message detected on this page
                  </p>
                </div>

                <div className="text-xs text-gray-600 mb-2">Red flags:</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {["BVN request", "External link", "Urgency"].map((flag) => (
                    <span
                      key={flag}
                      className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-xs border border-red-200"
                    >
                      {flag}
                    </span>
                  ))}
                </div>

                <button className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 rounded-lg transition-colors">
                  View Full Report
                </button>
                <button className="w-full mt-1 border border-gray-200 text-gray-600 text-xs py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                  Check Another Message
                </button>
              </div>

              {/* Popup footer */}
              <div className="bg-gray-50 border-t border-gray-100 px-3 py-1.5 flex items-center justify-between">
                <span className="text-gray-400 text-xs">Powered by ScamShield NG</span>
                <span className="text-green-500 text-xs">● Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature list */}
        <div className="max-w-3xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* How it would work */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-white font-medium mb-4">How the extension works</h3>
            <div className="space-y-3">
              {[
                { step: "1", text: "Install ScamShield NG from Chrome Web Store" },
                { step: "2", text: "Browse normally — extension monitors text automatically" },
                { step: "3", text: "Suspicious text is highlighted in red instantly" },
                { step: "4", text: "Click the extension icon for full analysis details" },
                { step: "5", text: "Share warnings with contacts in one click" },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {step}
                  </span>
                  <p className="text-slate-400 text-sm">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Platforms supported */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-white font-medium mb-4">Platforms it would cover</h3>
            <div className="space-y-2">
              {[
                { platform: "WhatsApp Web", status: "Priority", color: "green" },
                { platform: "Gmail", status: "Priority", color: "green" },
                { platform: "Facebook Messenger", status: "Planned", color: "blue" },
                { platform: "Twitter/X DMs", status: "Planned", color: "blue" },
                { platform: "Any webpage text", status: "Planned", color: "blue" },
              ].map(({ platform, status, color }) => (
                <div
                  key={platform}
                  className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0"
                >
                  <span className="text-slate-300 text-sm">{platform}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      color === "green"
                        ? "bg-green-950 text-green-400 border border-green-800"
                        : "bg-blue-950 text-blue-400 border border-blue-800"
                    }`}
                  >
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coming soon CTA */}
        <div className="max-w-3xl mx-auto mt-6 bg-blue-950 border border-blue-800 rounded-xl p-6 text-center">
          <h3 className="text-white font-medium mb-2">
            🚀 Extension coming after the hackathon
          </h3>
          <p className="text-blue-300 text-sm mb-4">
            Meanwhile, use our web app or WhatsApp bot to check suspicious messages right now
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/check"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Use Web App
            </Link>
            <Link
              to="/feed"
              className="border border-blue-700 text-blue-300 px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors"
            >
              View Live Feed
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ExtensionMockupPage;