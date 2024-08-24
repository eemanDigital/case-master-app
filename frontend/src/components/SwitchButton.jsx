import PropTypes from "prop-types";

const SwitchButton = ({
  currentState,
  updatedState,
  text,
  stateText,
  onClick,
}) => {
  return (
    <button
      className={`px-4 py-2 m-2 w-full md:w-auto ${
        currentState === stateText
          ? "bg-blue-500 text-white"
          : "bg-white text-black font-medium font-poppins"
      }`}
      onClick={() => {
        updatedState(stateText);
        onClick();
      }}>
      {text}
    </button>
  );
};

SwitchButton.propTypes = {
  currentState: PropTypes.string.isRequired,
  updatedState: PropTypes.func.isRequired,
  text: PropTypes.string.isRequired,
  stateText: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default SwitchButton;
