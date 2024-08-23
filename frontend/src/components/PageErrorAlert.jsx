import PropTypes from "prop-types";
import { Alert, Button } from "antd";
import { Link } from "react-router-dom";

const PageErrorAlert = ({ errorCondition, errorMessage }) => {
  const reloadFunction = () => {
    window.location.reload();
  };

  // Error handling with toast and graceful reload option
  if (errorCondition) {
    return (
      <div className="error-container">
        <Alert
          message="Oops! Something went wrong. Please try reloading the page."
          description={errorMessage}
          type="error"
          showIcon
        />
        <Button className="mt-3 blue-btn" onClick={reloadFunction}>
          Reload
        </Button>
        <p style={{ marginTop: "10px" }}>
          If the issue persists, please contact support.{" "}
          <Link className="text-blue-700 underline" to="/dashboard/contact-dev">
            Support
          </Link>
        </p>
      </div>
    );
  }
  return null;
};
// Typechecking for props
PageErrorAlert.propTypes = {
  errorCondition: PropTypes.string.isRequired,
  errorMessage: PropTypes.string.isRequired,
};
export default PageErrorAlert;
