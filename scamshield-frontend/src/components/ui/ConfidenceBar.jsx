import { useEffect, useState } from "react";
import PropTypes from "prop-types";

function ConfidenceBar({ score }) {
  const [width, setWidth] = useState(0);
  const normalizedScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const roundedWidth = Math.round(width / 5) * 5;
  const colorClass =
    normalizedScore <= 40 ? "bg-green-500" : normalizedScore <= 70 ? "bg-amber-500" : "bg-red-500";
  const textColorClass =
    normalizedScore <= 40 ? "text-green-400" : normalizedScore <= 70 ? "text-amber-400" : "text-red-400";
  const widthClasses = {
    0: "w-0",
    5: "w-[5%]",
    10: "w-[10%]",
    15: "w-[15%]",
    20: "w-[20%]",
    25: "w-[25%]",
    30: "w-[30%]",
    35: "w-[35%]",
    40: "w-[40%]",
    45: "w-[45%]",
    50: "w-1/2",
    55: "w-[55%]",
    60: "w-[60%]",
    65: "w-[65%]",
    70: "w-[70%]",
    75: "w-3/4",
    80: "w-4/5",
    85: "w-[85%]",
    90: "w-[90%]",
    95: "w-[95%]",
    100: "w-full",
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setWidth(normalizedScore));
    return () => window.cancelAnimationFrame(frame);
  }, [normalizedScore]);

  return (
    <div className="flex items-center gap-4">
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass} ${widthClasses[roundedWidth]}`}
        />
      </div>
      <span className={`w-12 text-right text-sm font-semibold ${textColorClass}`}>
        {normalizedScore}%
      </span>
    </div>
  );
}

ConfidenceBar.propTypes = {
  score: PropTypes.number.isRequired,
};

export default ConfidenceBar;
