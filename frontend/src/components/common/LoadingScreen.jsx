import LoadingSpinner from "../LoadingSpinner";

const LoadingScreen = ({ tip = "Loading...", fullScreen = false }) => {
  return <LoadingSpinner tip={tip} fullScreen={fullScreen} />;
};

export default LoadingScreen;
