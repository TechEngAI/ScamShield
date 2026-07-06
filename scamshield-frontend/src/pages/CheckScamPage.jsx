import { useEffect, useMemo, useState } from "react";
import { Clipboard, MessageSquareText, RefreshCcw, Share2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { checkScam, checkImageScam, getErrorMessage } from "../services/api";
import ConfidenceBar from "../components/ui/ConfidenceBar";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import VerdictBadge from "../components/ui/VerdictBadge";

const MAX_LENGTH = 2000;

const sources = [
  { value: "web", label: "Web" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
];

const examples = [
  "Dear GTBank customer, your account has been restricted due to BVN mismatch. Click https://gtb-verify-secure.com now to avoid ₦50,000 debit.",
  "Oga congratulations! You qualify for FG ₦150,000 grant. Send your Opay number, BVN and OTP to claim before midnight.",
  "Abeg I mistakenly sent ₦85,000 to your account. Forward the debit code from your SMS so my bank can reverse it now.",
];

const actionClasses = {
  scam: "border-red-900/50 bg-red-950/50 text-red-400",
  suspicious: "border-amber-900/50 bg-amber-950/50 text-amber-400",
  safe: "border-green-900/50 bg-green-950/50 text-green-400",
};

const languageLabels = {
  english: "English",
  pidgin: "Pidgin",
  mixed: "Mixed",
};

const getConfidenceExplanation = (score, verdict, redFlags) => {
  const flagCount = redFlags?.length || 0;

  if (verdict === 'scam') {
    if (score >= 90) {
      return `Our AI is ${score}% confident this is a scam because it matches ${flagCount} high-severity Nigerian fraud patterns in our database. Do not engage with this message under any circumstances.`;
    } else if (score >= 70) {
      return `Our AI is ${score}% confident this is a scam. It matches ${flagCount} known fraud patterns. Treat with extreme caution.`;
    } else {
      return `Our AI suspects this may be a scam (${score}% confidence). Some patterns match known Nigerian fraud templates but the message is ambiguous. Verify through official channels.`;
    }
  }

  if (verdict === 'suspicious') {
    return `This message has ${flagCount} suspicious element${flagCount !== 1 ? 's' : ''} that match partial fraud patterns (${score}% risk score). We cannot confirm it is a scam but recommend caution.`;
  }

  if (verdict === 'safe') {
    if (score >= 80) {
      return `Our AI found no scam patterns in this message (${score}% confidence it is safe). It does not match any of our 100+ Nigerian fraud templates.`;
    } else {
      return `This message appears safe (${score}% confidence) but our certainty is moderate. When in doubt, contact your bank through official channels.`;
    }
  }

  return `Confidence score: ${score}%`;
};

function CheckScamPage() {
  const [activeTab, setActiveTab] = useState("text");
  const [messageText, setMessageText] = useState("");
  const [source, setSource] = useState("web");
  const [result, setResult] = useState(null);
  const [resultVisible, setResultVisible] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extractedText, setExtractedText] = useState(null);
  const [copied, setCopied] = useState(false);

  const canSubmit =
    activeTab === "text" ? messageText.trim().length > 0 && !isAnalysing : selectedImage && !isAnalysing;
  const remaining = MAX_LENGTH - messageText.length;

  const shareText = useMemo(() => {
    if (!result) return "";
    const flags = result.red_flags?.length ? result.red_flags.join(", ") : "None";
    return `ScamShield NG Result\nVerdict: ${result.verdict?.toUpperCase()}\nConfidence: ${result.confidence_score}%\nRed flags: ${flags}\nAction: ${result.recommended_action}`;
  }, [result]);

  useEffect(() => {
    document.title = "Check Scam | ScamShield NG";
  }, []);

  useEffect(() => {
    if (!result) {
      setResultVisible(false);
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => setResultVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [result]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setError("");
    setResult(null);
    setResultVisible(false);
    setIsAnalysing(true);

    try {
      const data = await checkScam(messageText.trim(), source);
      setResult(data.result ?? data.check ?? data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not analyse this message. Please try again."));
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleReset = () => {
    setMessageText("");
    setResult(null);
    setResultVisible(false);
    setError("");
    setSelectedImage(null);
    setImagePreview(null);
    setExtractedText(null);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImage(file);
    setResult(null);
    setExtractedText(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleImageSubmit = async () => {
    if (!selectedImage) return;
    setIsAnalysing(true);
    setResult(null);
    setExtractedText(null);
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      const response = await checkImageScam(formData);
      setResult(response);
      setExtractedText(response.extractedText);
    } catch (err) {
      setError(err.message || "Failed to analyse image");
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleShare = async () => {
    if (!shareText) return;
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Result copied to clipboard");
    } catch (clipboardError) {
      toast.error("Could not copy result");
    }
  };

  const useExample = (example) => {
    setMessageText(example.slice(0, MAX_LENGTH));
    setResult(null);
    setResultVisible(false);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-white">
          <p className="text-sm font-black uppercase tracking-widest text-blue-400">Live scam checker</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Analyse a suspicious message</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Paste bank alerts, WhatsApp offers, SMS links, investment promises, or OTP requests before you respond.
          </p>
        </div>

        <form
          onSubmit={activeTab === "text" ? handleSubmit : (e) => { e.preventDefault(); handleImageSubmit(); }}
          className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-blue-950/20 sm:p-8"
        >
          {/* Tab switcher */}
          <div className="flex border border-slate-700 rounded-lg p-1 mb-6 bg-slate-950">
            <button
              type="button"
              onClick={() => setActiveTab("text")}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${
                activeTab === "text"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              📝 Text Message
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("image")}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${
                activeTab === "image"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              🖼️ Screenshot
            </button>
          </div>

          {activeTab === "text" ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label htmlFor="message" className="text-base font-bold text-white">
                  Suspicious message
                </label>
                <span className={`text-sm font-semibold ${remaining < 0 ? "text-red-400" : "text-slate-500"}`}>
                  {messageText.length} / {MAX_LENGTH}
                </span>
              </div>

              <textarea
                id="message"
                value={messageText}
                onChange={(event) => setMessageText(event.target.value.slice(0, MAX_LENGTH))}
                placeholder="Paste the suspicious message here... e.g. Your Access Bank account will be blocked unless you verify your BVN now."
                className="mt-3 min-h-52 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 p-4 text-base leading-7 text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />

              <div className="mt-5">
                <p className="text-sm font-bold text-slate-300">Source</p>
                <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-slate-950 p-1">
                  {sources.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setSource(item.value)}
                      className={`rounded-md px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                        source === item.value
                          ? "bg-blue-600/20 border border-blue-500 text-blue-400"
                          : "border border-transparent text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Image upload area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  imagePreview
                    ? "border-slate-700 bg-slate-950"
                    : "border-slate-700 hover:border-blue-500 hover:bg-blue-500/5"
                }`}
              >
                {imagePreview ? (
                  <div>
                    <img
                      src={imagePreview}
                      alt="uploaded screenshot"
                      className="max-h-64 mx-auto rounded-lg mb-4 object-contain border border-slate-700"
                    />
                    <p className="text-slate-400 text-sm mb-4">{selectedImage?.name}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                      }}
                      className="text-red-400 text-sm font-medium hover:text-red-300 transition-colors"
                    >
                      Remove image
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-5xl mb-4">📸</div>
                    <p className="text-white font-semibold mb-2">Upload a screenshot</p>
                    <p className="text-slate-400 text-sm mb-4">
                      JPG, PNG or WebP • Max 5MB • Screenshots of suspicious messages
                    </p>
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 transition-colors text-white px-6 py-3 rounded-lg text-sm font-semibold">
                      Choose Image
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                    </label>
                  </div>
                )}
              </div>
            </>
          )}

          {error ? (
            <div className="mt-5 rounded-lg border border-red-900/50 bg-red-950/50 px-4 py-3 text-sm font-semibold text-red-400 flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-base mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:shadow-none"
          >
            {isAnalysing ? (
              <>
                <LoadingSpinner label="" size="sm" />
                {activeTab === "image" ? "Analysing screenshot..." : "Analysing message..."}
              </>
            ) : (
              <>
                {activeTab === "image" ? (
                  <>
                    <Upload className="h-5 w-5" aria-hidden="true" />
                    Analyse Screenshot
                  </>
                ) : (
                  <>
                    <MessageSquareText className="h-5 w-5" aria-hidden="true" />
                    Analyse Message
                  </>
                )}
              </>
            )}
          </button>
        </form>

        {isAnalysing ? (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
            <LoadingSpinner
              label={activeTab === "image" ? "Analysing screenshot..." : "Analysing message..."}
              size="lg"
            />
          </div>
        ) : null}

        {result ? (
          <section
            className={`mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-blue-950/20 transition-all duration-500 ease-out sm:p-8 ${
              resultVisible ? "translate-y-0 opacity-100 animate-slide-up" : "translate-y-4 opacity-0"
            } ${result.verdict === "scam" ? "glow-red" : result.verdict === "safe" ? "glow-green" : "glow-amber"}`}
          >
            {/* Show extracted text if from image analysis */}
            {extractedText ? (
              <div className="bg-slate-950 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2 font-semibold">
                  📄 Text extracted from your image
                </p>
                <p className="text-slate-300 text-sm leading-relaxed italic">"{extractedText}"</p>
              </div>
            ) : null}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <VerdictBadge verdict={result.verdict} size="lg" />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-base inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition-all hover:border-blue-500 hover:text-white hover:bg-slate-800"
                >
                  <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                  Check Another Message
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="btn-base inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-700"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  Share Result
                </button>
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-2 text-sm font-bold text-slate-300">Confidence score</p>
              <ConfidenceBar score={Number(result.confidence_score) || 0} />
              <p className="text-slate-400 text-sm mt-2 leading-relaxed italic">
                {getConfidenceExplanation(
                  result.confidence_score,
                  result.verdict,
                  result.red_flags
                )}
              </p>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
              <div>
                <h2 className="text-lg font-bold text-white">Explanation</h2>
                <p className="mt-2 leading-7 text-slate-400">{result.explanation}</p>

                {result.red_flags && result.red_flags.length > 0 && (
                  <div className="mt-4">
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-2 font-medium">
                      🚩 Red Flags Detected ({result.red_flags.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.red_flags.map((flag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-950 text-red-400 border border-red-800 text-xs font-medium"
                        >
                          ⚠ {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(!result.red_flags || result.red_flags.length === 0) && (
                  <div className="mt-4">
                    <p className="text-slate-400 text-xs uppercase tracking-wide mb-2 font-medium">
                      ✅ No Red Flags Detected
                    </p>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-950 text-green-400 border border-green-800 text-xs font-medium">
                      No major red flags detected
                    </span>
                  </div>
                )}
              </div>

              <aside className={`rounded-lg border p-5 ${actionClasses[result.verdict] || actionClasses.suspicious}`}>
                <h2 className="text-lg font-bold">Recommended action</h2>
                <p className="mt-2 leading-7">{result.recommended_action}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {result.impersonated_bank ? (
                    <span className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300">
                      Impersonated: {result.impersonated_bank}
                    </span>
                  ) : null}
                  <span className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300">
                    Analysed in: {languageLabels[result.language_detected] || "English"}
                  </span>
                  {result.scam_category ? (
                    <span className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300">
                      Category: {result.scam_category}
                    </span>
                  ) : null}
                </div>
              </aside>
            </div>

            {/* Share Report Section */}
            {result && result.id && (
              <div className="mt-4 bg-slate-800 border border-slate-700 rounded-xl p-4">
                <p className="text-white font-medium mb-2">📤 Share this report</p>
                <p className="text-slate-400 text-sm mb-3">
                  Warn your contacts by sharing a link to this analysis
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={`${window.location.origin}/report/${result.id}`}
                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/report/${result.id}`
                      );
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors"
                  >
                    {copied ? "✓ Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>
            )}
          </section>
        ) : null}

        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2 text-white">
            <Clipboard className="h-5 w-5 text-blue-400" aria-hidden="true" />
            <h2 className="text-lg font-bold">Demo examples</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => useExample(example)}
                className="btn-base rounded-lg border border-slate-800 bg-slate-900 p-4 text-left text-sm font-semibold leading-6 text-slate-300 shadow-lg transition-all hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-xl"
              >
                {example}
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default CheckScamPage;
