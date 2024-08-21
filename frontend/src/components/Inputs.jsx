import PropTypes from "prop-types";

const Input = ({
  label,
  text,
  textarea,
  type,
  disable,
  inputStyle,
  ...props
}) => {
  return (
    <p>
      <label
        htmlFor={props.id}
        className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2 ">
        {label}
      </label>
      {textarea ? (
        <textarea
          {...props}
          placeholder={props.placeholder}
          className="appearance-none block w-full bg-gray-200 text-gray-700 border  rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
        />
      ) : (
        <input
          placeholder={props.placeholder}
          type={type}
          {...props}
          disabled={disable}
          className={
            inputStyle ||
            `appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-900 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white`
          }
        />
      )}
      <p className="text-gray-600 text-xs italic">{text}</p>
    </p>
  );
};

// Typechecking for props
Input.propTypes = {
  label: PropTypes.string.isRequired,
  text: PropTypes.string,
  textarea: PropTypes.bool,
  type: PropTypes.string,
  disable: PropTypes.bool,
  inputStyle: PropTypes.string,
  placeholder: PropTypes.string,
  id: PropTypes.string,
};

export default Input;
