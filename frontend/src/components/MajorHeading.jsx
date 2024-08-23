import PropTypes from "prop-types";

const MajorHeading = ({ title, midTitle, subtitle }) => {
  return (
    <div className="relative bg-gradient-to-r from-rose-500 to-rose-700  opacity-95 mb-2 shadow-md text-center font-poppins  tracking-widest">
      <h1 className="text-2xl sm:text-3xl md:text-3xl text-white font-bold mb-2">
        {title}
      </h1>

      {midTitle && (
        <h1 className="text-2xl sm:text-2xl md:text-2xl text-white font-bold mb-2">
          {midTitle}
        </h1>
      )}

      {subtitle && (
        <p className="text-sm sm:text-base md:text-lg text-white opacity-75">
          {subtitle}
        </p>
      )}
    </div>
  );
};

MajorHeading.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  midTitle: PropTypes.string,
};

export default MajorHeading;
