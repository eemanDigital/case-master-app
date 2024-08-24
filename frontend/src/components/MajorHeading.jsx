import PropTypes from "prop-types";

const MajorHeading = ({ title, midTitle, subtitle }) => {
  return (
    <>
      <div className="relative  shadow-sm text-center bg-gray-100 text-gray-700 font-poppins  tracking-widest rounded-md  mb-2 p-1">
        <h1 className="text-2xl sm:text-3xl md:text-3xl  font-bold p-2 text-secondary">
          {title}
        </h1>

        {midTitle && (
          <h1 className="text-2xl sm:text-2xl md:text-2xl  font-bold mb-2">
            {midTitle}
          </h1>
        )}

        {subtitle && (
          <p className="text-sm sm:text-base md:text-lg opacity-75">
            {subtitle}
          </p>
        )}
      </div>
    </>
  );
};

MajorHeading.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  midTitle: PropTypes.string,
};

export default MajorHeading;
