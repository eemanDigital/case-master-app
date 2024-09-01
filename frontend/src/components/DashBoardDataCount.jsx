import PropTypes from "prop-types";
import { FaBriefcase, FaUsers, FaHandshake } from "react-icons/fa";
import { GoLaw } from "react-icons/go";

const DashBoardDataCount = ({ cases, staff, lawyerCount, clientCount }) => {
  return (
    <div className="container mx-auto py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-4 rounded-lg shadow-md flex items-center">
          <FaBriefcase className="text-3xl text-blue-100 mr-2" />
          <div>
            <h4 className="text-xl font-bold text-white">
              {cases?.results || 0}
            </h4>
            <p className="text-sm text-white">Number of Cases</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-400 to-green-600 p-4 rounded-lg shadow-md flex items-center">
          <FaUsers className="text-3xl text-green-100 mr-2" />
          <div>
            <h4 className="text-xl font-bold text-white">{staff}</h4>
            <p className="text-sm text-white">Number of Staff</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-4 rounded-lg shadow-md flex items-center">
          <GoLaw className="text-3xl text-yellow-100 mr-2" />
          <div>
            <h4 className="text-xl font-bold text-white">{lawyerCount}</h4>
            <p className="text-sm text-white">Number of Lawyers</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-400 to-red-600 p-4 rounded-lg shadow-md flex items-center">
          <FaHandshake className="text-3xl text-red-100 mr-2" />
          <div>
            <h4 className="text-xl font-bold text-white">{clientCount}</h4>
            <p className="text-sm text-white">Number of Clients</p>
          </div>
        </div>
      </div>
    </div>
  );
};

DashBoardDataCount.propTypes = {
  cases: PropTypes.shape({
    results: PropTypes.number,
  }),
  staff: PropTypes.number.isRequired,
  lawyerCount: PropTypes.number.isRequired,
  clientCount: PropTypes.number.isRequired,
};

export default DashBoardDataCount;
