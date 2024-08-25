import PropTypes from "prop-types";
import { Spin } from "antd";
import { FaBalanceScale } from "react-icons/fa";

const LoadingSpinner = ({
  size = "large",
  tip = "Loading case data...",
  color = "#1a365d", // Dark blue color
}) => {
  const customIndicator = (
    <div className="flex flex-col items-center">
      <FaBalanceScale
        className="text-5xl mb-4 animate-bounce"
        style={{ color }}
      />
      <div
        className="w-12 h-12 border-t-4 border-b-4 rounded-full animate-spin"
        style={{ borderColor: color }}></div>
    </div>
  );

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100">
      <Spin size={size} indicator={customIndicator} />
      <p className="mt-4 text-lg font-semibold text-gray-700">{tip}</p>
      <p className="mt-2 text-sm text-gray-500">
        Please wait while we retrieve your case information.
      </p>
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(["small", "default", "large"]),
  tip: PropTypes.string,
  color: PropTypes.string,
};

export default LoadingSpinner;
