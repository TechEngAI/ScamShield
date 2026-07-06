import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { checkScam, getErrorMessage } from "../services/api";

function UssdSimulatorPage() {
  const [ussdInput, setUssdInput] = useState("");
  const [screenContent, setScreenContent] = useState("");
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  // Initial welcome screen
  useEffect(() => {
    document.title = "USSD Simulator | ScamShield NG";
    setScreenContent(`ScamShield NG
*347*SCAM#

Protect yourself from
Nigerian financial fraud.

Enter the suspicious message
you received:

Reply: Type message below`);
  }, []);

  const handleUssdSubmit = async () => {
    if (!ussdInput.trim()) return;

    if (step === 0) {
      // User submitted a message to check
      setIsLoading(true);
      setScreenContent(`ScamShield NG
Analysing message...

Please wait.`);

      try {
        const result = await checkScam(ussdInput.trim(), "web");
        setLastResult(result);
        
        // Generate verdict screen based on result
        const verdict = result.verdict || "suspicious";
        const confidence = Math.round(result.confidence_score || 0);
        const category = result.scam_category || "Unknown";
        const bank = result.impersonated_bank || "None";

        let verdictScreen = "";
        
        if (verdict === "scam") {
          verdictScreen = `ScamShield NG — ALERT

** SCAM DETECTED **
Confidence: ${confidence}%

This na scam message!
Do NOT reply or click
any link.

Category: ${category}
Bank: ${bank}

Reply 1: Check another
Reply 2: Share warning
Reply 0: Exit`;
        } else if (verdict === "safe") {
          verdictScreen = `ScamShield NG

** MESSAGE LOOKS SAFE **
Confidence: ${confidence}%

We no detect any scam
pattern for this message.
Be careful still sha.

Reply 1: Check another
Reply 0: Exit`;
        } else {
          verdictScreen = `ScamShield NG — CAUTION

** SUSPICIOUS MESSAGE **
Confidence: ${confidence}%

This message get some
red flags. Treat with
caution.

Reply 1: Check another
Reply 0: Exit`;
        }

        setScreenContent(verdictScreen);
        setStep(1);
        setUssdInput("");
      } catch (error) {
        setScreenContent(`ScamShield NG

Error analysing message.
Please try again.

Reply 0: Exit`);
        setStep(1);
        setUssdInput("");
      } finally {
        setIsLoading(false);
      }
    } else if (step === 1) {
      // User is replying to verdict screen
      const reply = ussInput.trim().toLowerCase();
      
      if (reply === "1") {
        // Check another message
        setStep(0);
        setScreenContent(`ScamShield NG
*347*SCAM#

Protect yourself from
Nigerian financial fraud.

Enter the suspicious message
you received:

Reply: Type message below`);
        setUssdInput("");
      } else if (reply === "2" && lastResult && lastResult.id) {
        // Share warning (mockup - just show message)
        toast.success("Report link copied to clipboard");
        navigator.clipboard.writeText(`${window.location.origin}/report/${lastResult.id}`);
        setUssdInput("");
      } else if (reply === "0") {
        // Exit
        setScreenContent(`ScamShield NG

Thank you for using
ScamShield NG.

Stay safe from scammers.
*347*SCAM#`);
        setStep(2);
        setUssdInput("");
      } else {
        // Invalid reply
        toast.error("Invalid reply. Please enter 1, 2, or 0");
        setUssdInput("");
      }
    } else if (step === 2) {
      // Already exited, reset to welcome
      setStep(0);
      setScreenContent(`ScamShield NG
*347*SCAM#

Protect yourself from
Nigerian financial fraud.

Enter the suspicious message
you received:

Reply: Type message below`);
      setUssdInput("");
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 px-4 py-12">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-blue-900/50 border border-blue-700 text-blue-300 text-xs px-3 py-1 rounded-full mb-3">
            Simulation — not a real USSD service
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            📱 ScamShield NG — USSD Simulator
          </h1>
          <p className="text-slate-400">
            See how ScamShield NG would work for feature phone users
          </p>
        </div>

        {/* Phone Mockup */}
        <div className="bg-gray-900 rounded-3xl border-4 border-gray-700 shadow-2xl overflow-hidden mx-auto" style={{ width: "280px" }}>
          {/* Phone top bar */}
          <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
            <span className="text-gray-400 text-xs">MTN Nigeria</span>
            <span className="text-gray-400 text-xs">📶 4G</span>
          </div>

          {/* Screen */}
          <div className="bg-gray-950 min-h-64 p-4">
            {/* USSD header */}
            <div className="text-green-400 text-xs font-mono mb-3">
              *347*SCAM# — ScamShield NG
            </div>

            {/* Screen content */}
            <div className="text-green-300 text-xs font-mono leading-relaxed whitespace-pre-line">
              {screenContent}
            </div>
          </div>

          {/* Input area */}
          {step !== 2 && (
            <div className="bg-gray-800 p-3">
              <input
                value={ussdInput}
                onChange={(e) => setUssdInput(e.target.value)}
                placeholder="Type message or reply..."
                className="w-full bg-gray-900 text-green-300 text-xs font-mono px-3 py-2 rounded border border-gray-600 focus:border-green-500 focus:outline-none placeholder-gray-600"
                maxLength={160}
                disabled={step === 2}
              />
              <button
                onClick={handleUssdSubmit}
                disabled={!ussdInput.trim() || isLoading || step === 2}
                className="w-full mt-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 text-white text-xs font-mono py-2 rounded transition-colors"
              >
                {isLoading ? "Analysing..." : "SEND"}
              </button>
            </div>
          )}

          {/* Phone bottom bar */}
          <div className="bg-gray-800 px-4 py-2 flex justify-center">
            <div className="w-16 h-1 bg-gray-600 rounded-full"></div>
          </div>
        </div>

        {/* Explanation section */}
        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-white font-medium mb-3">Why USSD matters for Nigeria</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            Over 40 million Nigerians use feature phones without internet access.
            USSD works on any phone — no data, no smartphone, no app needed.
            ScamShield NG via USSD would make fraud protection accessible to
            every Nigerian, regardless of their device.
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-900 rounded-lg p-3">
              <div className="text-blue-400 font-bold text-lg">40M+</div>
              <div className="text-slate-500 text-xs mt-1">Feature phone users in Nigeria</div>
            </div>
            <div className="bg-slate-900 rounded-lg p-3">
              <div className="text-blue-400 font-bold text-lg">₦0</div>
              <div className="text-slate-500 text-xs mt-1">Data cost for USSD</div>
            </div>
            <div className="bg-slate-900 rounded-lg p-3">
              <div className="text-blue-400 font-bold text-lg">Any</div>
              <div className="text-slate-500 text-xs mt-1">Phone can use USSD</div>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-4 text-center">
          <Link
            to="/check"
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            ← Back to full web checker
          </Link>
        </div>
      </div>
    </main>
  );
}

export default UssdSimulatorPage;