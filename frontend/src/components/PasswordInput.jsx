import PropTypes from "prop-types";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const PasswordInput = ({
  error,
  name,
  value,
  label,
  placeholder,
  handleChange,
  showPassword,
  togglePassword,
  onPaste,
  ...props
}) => {
  const baseInputClass = `
    block w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-md
    focus:border-blue-400 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40
    transition duration-150 ease-in-out pr-10
  `;

  const inputClass = `
    ${baseInputClass}
    ${error ? "border-red-500" : "border-gray-300"}
    ${props.disabled ? "bg-gray-100 cursor-not-allowed" : ""}
  `;

  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          className={inputClass}
          type={showPassword ? "text" : "password"}
          required
          placeholder={placeholder}
          value={value}
          name={name}
          onChange={handleChange}
          onPaste={onPaste}
          {...props}
        />
        <div
          className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
          onClick={togglePassword}>
          {showPassword ? (
            <AiOutlineEyeInvisible className="text-gray-500 hover:text-gray-700" />
          ) : (
            <AiOutlineEye className="text-gray-500 hover:text-gray-700" />
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

PasswordInput.propTypes = {
  error: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  handleChange: PropTypes.func.isRequired,
  showPassword: PropTypes.bool.isRequired,
  togglePassword: PropTypes.func.isRequired,
  onPaste: PropTypes.func,
  disabled: PropTypes.bool,
};

export default PasswordInput;
