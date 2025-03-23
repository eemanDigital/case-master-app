import PropTypes from "prop-types";
import { Spin } from "antd";
import { FaBalanceScale } from "react-icons/fa";

const LoadingSpinner = ({
  size = "large",
  tip = "Loading data...",
  color = "#1a365d", // Dark blue color
}) => {
  const customIndicator = (
    <div className="flex flex-col items-center">
      <FaBalanceScale
        className="text-5xl mb-4 animate-bounce"
        style={{ color }}
      />
    </div>
  );

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12">
      <Spin size={size} indicator={customIndicator} />
      <p className="mt-4 text-lg font-semibold">{tip}</p>
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(["small", "default", "large"]),
  tip: PropTypes.string,
  color: PropTypes.string,
};

export default LoadingSpinner;
