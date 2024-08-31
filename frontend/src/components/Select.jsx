import PropTypes from "prop-types";

const Select = ({ label, options, error, ...props }) => {
  const baseSelectClass = `
    block w-full px-4 py-2 mt-2 text-gray-700 bg-white border rounded-md
    focus:border-blue-400 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40
    transition duration-150 ease-in-out appearance-none
  `;

  const selectClass = `
    ${baseSelectClass}
    ${error ? "border-red-500" : "border-gray-300"}
    ${props.disabled ? "bg-gray-100 cursor-not-allowed" : ""}
  `;

  return (
    <div className="mb-4">
      <label
        htmlFor={props.id || props.name}
        className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <select {...props} className={selectClass}>
          {options.map((option, index) => (
            <option key={index} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg
            className="fill-current h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

Select.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ])
  ).isRequired,
  error: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
  disabled: PropTypes.bool,
};

export default Select;
