import PropTypes from "prop-types";

const Label = ({ text, htmlFor }) => {
  return (
    <label
      htmlFor={htmlFor}
      className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2 ">
      {text}
    </label>
  );
};

Label.propTypes = {
  text: PropTypes.string.isRequired,
  htmlFor: PropTypes.string.isRequired,
};

export default Label;
