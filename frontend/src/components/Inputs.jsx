import PropTypes from "prop-types";

const Input = ({
  label,
  text,
  textarea,
  type,
  disable,
  inputStyle,
  error,
  ...props
}) => {
  const baseInputClass = `
    block w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-md
    focus:border-blue-400 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40
    transition duration-150 ease-in-out
  `;

  const inputClass = `
    ${baseInputClass}
    ${error ? "border-red-500" : "border-gray-300"}
    ${disable ? "bg-gray-100 cursor-not-allowed" : ""}
    ${inputStyle || ""}
  `;

  return (
    <div className="mb-4">
      <label
        htmlFor={props.id}
        className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {textarea ? (
        <textarea
          {...props}
          disabled={disable}
          className={inputClass}
          rows={4}
        />
      ) : (
        <input
          type={type}
          disabled={disable}
          className={inputClass}
          {...props}
        />
      )}
      {text && <p className="mt-1 text-sm text-gray-500">{text}</p>}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

Input.propTypes = {
  label: PropTypes.string.isRequired,
  text: PropTypes.string,
  textarea: PropTypes.bool,
  type: PropTypes.string,
  disable: PropTypes.bool,
  inputStyle: PropTypes.string,
  error: PropTypes.string,
  id: PropTypes.string,
};

export default Input;
