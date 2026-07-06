import PropTypes from "prop-types";
import { AlertTriangle, ShieldCheck, ShieldX } from "lucide-react";

const variants = {
  scam: {
    Icon: ShieldX,
    text: "SCAM DETECTED",
    className: "bg-red-950 text-red-400 border-red-800 glow-red",
    icon: "🚨",
  },
  safe: {
    Icon: ShieldCheck,
    text: "SAFE",
    className: "bg-green-950 text-green-400 border-green-800 glow-green",
    icon: "✅",
  },
  suspicious: {
    Icon: AlertTriangle,
    text: "SUSPICIOUS",
    className: "bg-amber-950 text-amber-400 border-amber-800 glow-amber",
    icon: "⚠️",
  },
};

function VerdictBadge({ verdict, size = "md" }) {
  const config = variants[verdict] || variants.suspicious;
  const Icon = config.Icon;
  const sizeClass = size === "lg" ? "px-6 py-3 text-base" : "px-4 py-2 text-sm";
  const iconClass = size === "lg" ? "h-6 w-6" : "h-4 w-4";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border font-semibold tracking-wide transition-all duration-200 ${sizeClass} ${config.className}`}
    >
      <span className="text-lg">{config.icon}</span>
      {config.text}
    </span>
  );
}

VerdictBadge.propTypes = {
  verdict: PropTypes.oneOf(["scam", "safe", "suspicious"]).isRequired,
  size: PropTypes.oneOf(["md", "lg"]),
};

export default VerdictBadge;
