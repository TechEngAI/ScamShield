import { useEffect, useState } from "react";
import { Plus, Trash2, MessageSquareText, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import { checkBulkScam, getErrorMessage } from "../services/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import VerdictBadge from "../components/ui/VerdictBadge";
import ConfidenceBar from "../components/ui/ConfidenceBar";

const MAX_MESSAGES = 5;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 2000;

function BulkCheckPage() {
  const [messages, setMessages] = useState([""]);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [expandedResults, setExpandedResults] = useState({});

  useEffect(() => {
    document.title = "Bulk Check | ScamShield NG";
  }, []);

  const handleMessageChange = (index, value) => {
    const newMessages = [...messages];
    newMessages[index] = value.slice(0, MAX_MESSAGE_LENGTH);
    setMessages(newMessages);
    setError("");
  };

  const addMessage = () => {
    if (messages.length < MAX_MESSAGES) {
      setMessages([...messages, ""]);
    }
  };

  const removeMessage = (index) => {
    if (messages.length > 1) {
      const newMessages = messages.filter((_, i) => i !== index);
      setMessages(newMessages);
    }
  };

  const canSubmit = messages.some((msg) => msg.trim().length >= MIN_MESSAGE_LENGTH) && !isAnalysing;

  const handleAnalyze = async () => {
    const validMessages = messages.filter((msg) => msg.trim().length >= MIN_MESSAGE_LENGTH);

    if (validMessages.length === 0) {
      setError("Please provide at least one message with at least 10 characters.");
      return;
    }

    setError("");
    setResults(null);
    setIsAnalysing(true);

    try {
      const data = await checkBulkScam(validMessages);
      setResults(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not analyse messages. Please try again."));
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleReset = () => {
    setMessages([""]);
    setResults(null);
    setError("");
    setExpandedResults({});
  };

  const toggleExpand = (index) => {
    setExpandedResults((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-white">
          <p className="text-sm font-black uppercase tracking-widest text-blue-400">Bulk Message Checker</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Check multiple messages at once</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Paste up to 5 suspicious messages and get instant verdicts for all of them. Perfect for analysing multiple suspicious texts, emails, or WhatsApp messages.
          </p>
        </div>

        {!results ? (
          <>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-blue-950/20 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Messages to analyse</h2>
                <button
                  type="button"
                  onClick={addMessage}
                  disabled={messages.length >= MAX_MESSAGES}
                  className="btn-base inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-blue-500 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add Message
                </button>
              </div>

              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold text-slate-300">
                        Message {index + 1} of {messages.length}
                      </label>
                      {messages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMessage(index)}
                          className="text-red-400 text-sm font-medium hover:text-red-300 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      value={message}
                      onChange={(e) => handleMessageChange(index, e.target.value)}
                      placeholder={`Paste suspicious message #${index + 1} here...`}
                      className="w-full min-h-24 resize-y rounded-lg border border-slate-700 bg-slate-950 p-4 text-base leading-7 text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="mt-2 text-right">
                      <span className={`text-sm font-semibold ${message.length > MAX_MESSAGE_LENGTH ? "text-red-400" : "text-slate-500"}`}>
                        {message.length} / {MAX_MESSAGE_LENGTH}
                      </span>
                    </div>
                    {index < messages.length - 1 && (
                      <div className="mt-6 border-t border-slate-800 pt-6">
                        <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Message {index + 1} of {messages.length}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {error ? (
                <div className="mt-6 rounded-lg border border-red-900/50 bg-red-950/50 px-4 py-3 text-sm font-semibold text-red-400 flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!canSubmit}
                className="btn-base mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:shadow-none"
              >
                {isAnalysing ? (
                  <>
                    <LoadingSpinner label="" size="sm" />
                    Analysing {messages.filter((m) => m.trim().length >= MIN_MESSAGE_LENGTH).length} message{messages.filter((m) => m.trim().length >= MIN_MESSAGE_LENGTH).length !== 1 ? "s" : ""}...
                  </>
                ) : (
                  <>
                    <MessageSquareText className="h-5 w-5" aria-hidden="true" />
                    Analyse All Messages
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Summary */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-blue-950/20 sm:p-8 mb-6">
              <h2 className="text-lg font-bold text-white mb-4">Analysis Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 rounded-lg p-4 text-center">
                  <p className="text-3xl font-black text-white">{results.summary.total}</p>
                  <p className="text-sm font-semibold text-slate-400 mt-1">Total Checked</p>
                </div>
                <div className="bg-red-950/50 rounded-lg p-4 text-center border border-red-900/50">
                  <p className="text-3xl font-black text-red-400">{results.summary.scams}</p>
                  <p className="text-sm font-semibold text-red-400 mt-1">Scams Found</p>
                </div>
                <div className="bg-green-950/50 rounded-lg p-4 text-center border border-green-900/50">
                  <p className="text-3xl font-black text-green-400">{results.summary.safe}</p>
                  <p className="text-sm font-semibold text-green-400 mt-1">Safe</p>
                </div>
                <div className="bg-amber-950/50 rounded-lg p-4 text-center border border-amber-900/50">
                  <p className="text-3xl font-black text-amber-400">{results.summary.suspicious}</p>
                  <p className="text-sm font-semibold text-amber-400 mt-1">Suspicious</p>
                </div>
              </div>
            </div>

            {/* Individual Results */}
            <div className="space-y-4">
              {results.results.map((result, index) => (
                <div
                  key={index}
                  className={`rounded-xl border border-slate-800 bg-slate-900 p-6 transition-all ${
                    result.verdict === 'scam' ? 'border-red-900/50' : result.verdict === 'safe' ? 'border-green-900/50' : 'border-amber-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-semibold text-slate-400">Message {index + 1}</span>
                        <VerdictBadge verdict={result.verdict} size="sm" />
                      </div>
                      <p className="text-slate-300 text-sm mb-3 italic">"{result.message_preview}"</p>
                      <ConfidenceBar score={result.confidence_score || 0} />
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleExpand(index)}
                      className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
                    >
                      {expandedResults[index] ? 'Show less' : 'Show details'}
                    </button>
                  </div>

                  {expandedResults[index] && (
                    <div className="mt-4 pt-4 border-t border-slate-800">
                      <p className="text-slate-400 text-sm mb-2"><strong>Explanation:</strong> {result.explanation}</p>
                      {result.red_flags && result.red_flags.length > 0 && (
                        <div className="mt-3">
                          <p className="text-slate-400 text-xs uppercase tracking-wide mb-2 font-medium">
                            🚩 Red Flags ({result.red_flags.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {result.red_flags.map((flag, flagIndex) => (
                              <span
                                key={flagIndex}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-950 text-red-400 border border-red-800 text-xs font-medium"
                              >
                                ⚠ {flag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {result.impersonated_bank && (
                        <p className="text-slate-400 text-sm mt-2">
                          <strong>Impersonated Bank:</strong> {result.impersonated_bank}
                        </p>
                      )}
                      {result.recommended_action && (
                        <p className="text-slate-400 text-sm mt-2">
                          <strong>Recommended Action:</strong> {result.recommended_action}
                        </p>
                      )}
                    </div>
                  )}

                  {result.verdict === 'error' && (
                    <div className="mt-3 rounded-lg bg-red-950/50 border border-red-900/50 p-3 text-sm text-red-400">
                      {result.error || 'Failed to analyse this message'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="btn-base mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-5 py-3 text-base font-bold text-slate-300 transition-all hover:border-blue-500 hover:text-white hover:bg-slate-800"
            >
              <RefreshCcw className="h-5 w-5" aria-hidden="true" />
              Check Another Batch
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default BulkCheckPage;