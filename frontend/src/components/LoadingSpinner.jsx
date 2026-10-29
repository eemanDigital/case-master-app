import PropTypes from "prop-types";
import { FaBalanceScale } from "react-icons/fa";

const LoadingSpinner = ({
  size = "large",
  tip,
  color = "var(--color-primary, #2563eb)",
  fullScreen = true,
  spinning = true,
  className = "",
  children,
}) => {
  const message =
    tip === undefined ? (fullScreen ? "Loading data..." : null) : tip;
  const dimensions =
    size === "small"
      ? { frame: "h-5 w-5", icon: "text-[10px]", border: "border-2" }
      : size === "default"
        ? { frame: "h-9 w-9", icon: "text-sm", border: "border-2" }
        : { frame: "h-12 w-12", icon: "text-lg", border: "border-[3px]" };

  const indicator = (
    <span
      className={`relative inline-flex ${dimensions.frame} items-center justify-center`}
      style={{ color }}
      aria-hidden="true">
      <span
        className={`absolute inset-0 rounded-full ${dimensions.border} border-current/20 border-t-current motion-reduce:animate-none animate-spin`}
      />
      <FaBalanceScale className={`relative ${dimensions.icon}`} />
    </span>
  );

  const status = (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col items-center justify-center gap-3 text-center">
      {indicator}
      {message ? (
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {message}
        </p>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );

  if (children !== undefined) {
    return (
      <div className={`relative ${className}`}>
        {children}
        {spinning && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/75 p-4 backdrop-blur-[1px] dark:bg-gray-950/65">
            {status}
          </div>
        )}
      </div>
    );
  }

  if (!spinning) return null;

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-white/90 p-6 dark:bg-gray-950/90 ${className}`}>
        {status}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${
        size === "small"
          ? "p-1"
          : size === "default"
            ? "min-h-20 p-3"
            : "min-h-24 p-4"
      } ${className}`}>
      {status}
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(["small", "default", "large"]),
  tip: PropTypes.string,
  color: PropTypes.string,
  fullScreen: PropTypes.bool,
  spinning: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default LoadingSpinner;
