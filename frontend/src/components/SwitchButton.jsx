import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";

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
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
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
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 bg-blue-600 rounded-lg -z-10"
            layoutId="activeBackground"
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      {Icon && (
        <motion.div
          animate={{
            scale: isActive ? 1.1 : 1,
            color: isActive ? "currentColor" : "currentColor",
          }}
          transition={{ duration: 0.2 }}>
          <Icon
            className={`w-4 h-4 ${
              size === "small" ? "w-3 h-3" : size === "large" ? "w-5 h-5" : ""
            }`}
          />
        </motion.div>
      )}

      {/* Text */}
      <span className="relative z-10 whitespace-nowrap">{text}</span>

      {/* Active indicator dot */}
      {isActive && variant === "minimalist" && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-1.5 h-1.5 bg-blue-600 rounded-full"
        />
      )}
    </motion.button>
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
