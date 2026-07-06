import PropTypes from "prop-types";

function LoadingSpinner({ label = "Loading...", size = "md", fullScreen = false }) {
  const sizeClasses = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-4",
    lg: "h-12 w-12 border-4",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-slate-700 border-t-blue-500`}
        role="status"
        aria-label={label}
      />
      {label ? <p className="text-sm font-medium">{label}</p> : null}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        {spinner}
      </div>
    );
  }

  return spinner;
}

LoadingSpinner.propTypes = {
  label: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  fullScreen: PropTypes.bool,
};

export default LoadingSpinner;
