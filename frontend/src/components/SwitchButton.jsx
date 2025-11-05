import PropTypes from "prop-types";

const SwitchButton = ({
  currentState,
  updatedState,
  text,
  stateText,
  onClick,
  icon: Icon,
  size = "medium",
  variant = "default",
  disabled = false,
  className = "",
}) => {
  const isActive = currentState === stateText;

  const sizeClasses = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg",
  };

  const variantClasses = {
    default: {
      active: "bg-blue-600 text-white shadow-md",
      inactive:
        "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
      disabled: "bg-gray-100 text-gray-400 cursor-not-allowed",
    },
    minimalist: {
      active: "bg-blue-50 text-blue-700 border border-blue-200",
      inactive: "bg-transparent text-gray-600 hover:bg-gray-100",
      disabled: "bg-transparent text-gray-400 cursor-not-allowed",
    },
    filled: {
      active: "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg",
      inactive: "bg-gray-100 text-gray-700 hover:bg-gray-200",
      disabled: "bg-gray-200 text-gray-500 cursor-not-allowed",
    },
  };

  const handleClick = () => {
    if (disabled) return;
    updatedState(stateText);
    onClick();
  };

  return (
    <button
      className={`
        relative
        ${sizeClasses[size]}
        ${
          disabled
            ? variantClasses[variant].disabled
            : isActive
            ? variantClasses[variant].active
            : variantClasses[variant].inactive
        }
        rounded-lg
        font-medium
        transition-all
        duration-200
        ease-in-out
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        focus:ring-offset-2
        disabled:cursor-not-allowed
        disabled:opacity-60
        flex
        items-center
        justify-center
        gap-2
        ${className}
      `}
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={isActive}
      aria-label={`Switch to ${text}`}>
      {/* Active background */}
      {isActive && (
        <div className="absolute inset-0 bg-blue-600 rounded-lg -z-10" />
      )}

      {/* Icon */}
      {Icon && (
        <div
          className={`
          ${isActive ? "scale-110" : "scale-100"}
          transition-transform duration-200
          ${
            size === "small"
              ? "w-3 h-3"
              : size === "large"
              ? "w-5 h-5"
              : "w-4 h-4"
          }
        `}>
          <Icon />
        </div>
      )}

      {/* Text */}
      <span className="relative z-10 whitespace-nowrap">{text}</span>

      {/* Active indicator dot */}
      {isActive && variant === "minimalist" && (
        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full transition-all duration-200" />
      )}
    </button>
  );
};

// Enhanced prop types with more options
SwitchButton.propTypes = {
  currentState: PropTypes.string.isRequired,
  updatedState: PropTypes.func.isRequired,
  text: PropTypes.string.isRequired,
  stateText: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.elementType,
  size: PropTypes.oneOf(["small", "medium", "large"]),
  variant: PropTypes.oneOf(["default", "minimalist", "filled"]),
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default SwitchButton;
