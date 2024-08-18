import PropTypes from "prop-types";
import { Button } from "antd";

const ButtonWithIcon = ({ onClick, icon, text }) => {
  return (
    <Button
      onClick={onClick}
      className="bg-blue-500 text-white mb-4 rounded-lg shadow-md transition duration-300 w-full sm:w-auto p-2 sm:p-4 flex items-center justify-center">
      {icon && <span className="mr-2">{icon}</span>}
      {text}
    </Button>
  );
};

ButtonWithIcon.propTypes = {
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.element,
  text: PropTypes.string.isRequired,
};

export default ButtonWithIcon;
