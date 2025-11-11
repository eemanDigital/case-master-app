import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa6";

const GoBackButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="group flex items-center gap-2 px-3 py-2 mb-4 text-sm font-medium text-gray-600 
                 hover:text-gray-900 transition-all duration-200 ease-in-out
                 focus:outline-none focus:text-gray-900">
      <FaArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
      <span>Back</span>
    </button>
  );
};

export default GoBackButton;
