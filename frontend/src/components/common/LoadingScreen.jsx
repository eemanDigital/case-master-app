import PropTypes from "prop-types";
import LoadingSpinner from "../LoadingSpinner";

const LoadingScreen = ({ tip = "Loading...", fullScreen = false }) => {
  return <LoadingSpinner tip={tip} fullScreen={fullScreen} />;
};

LoadingScreen.propTypes = {
  tip: PropTypes.string,
  fullScreen: PropTypes.bool,
};

export default LoadingScreen;
