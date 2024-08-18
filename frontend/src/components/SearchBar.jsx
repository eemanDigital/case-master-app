import PropTypes from "prop-types"; // Import PropTypes
import { FaSearch } from "react-icons/fa";

const SearchBar = ({ onSearch, style }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
  };

  // Default styles
  const defaultStyles = {
    form: "flex  md:flex-row items-center border bg-gray-400 hover:bg-gray-500 rounded-lg overflow-hidden",
    input: "px-2 py-2 w-full md:w-auto focus:outline-none",
    button: "p-3 text-white  md:w-auto focus:outline-none",
  };

  return (
    <div className="max-w-xl ">
      <form
        onSubmit={handleSubmit}
        className={`${defaultStyles.form} ${style?.form || ""}`}>
        <input
          type="text"
          id="search"
          onChange={onSearch}
          className={`${defaultStyles.input} ${style?.input || ""}`}
          placeholder="Search..."
        />
        <button
          type="submit"
          className={`${defaultStyles.button} ${style?.button || ""}`}>
          <FaSearch />
        </button>
      </form>
    </div>
  );
};

// Prop validation
SearchBar.propTypes = {
  style: PropTypes.shape({
    form: PropTypes.string,
    input: PropTypes.string,
    button: PropTypes.string,
  }),
  onSearch: PropTypes.func,
};

// Default props
SearchBar.defaultProps = {
  style: {},
};

export default SearchBar;
