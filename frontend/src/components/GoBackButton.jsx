import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa6";

const GoBackButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="group flex items-center px-4 py-1 mb-4 sm:mb-6 text-sm font-poppins font-medium transition-all duration-200 ease-in-out
                 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-md hover:shadow-lg
                 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50">
      <FaArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2 transition-transform duration-200 ease-in-out group-hover:-translate-x-1" />
      <span>Go Back</span>
    </button>
  );
};

export default GoBackButton;
