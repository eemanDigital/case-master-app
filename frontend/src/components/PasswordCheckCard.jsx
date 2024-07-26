import { Card } from "antd";
import { useState, useEffect } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";

const PasswordCheckCard = ({ password }) => {
  const [isUpperLower, setIsUpperLower] = useState(false);
  const [isNumber, setIsNumber] = useState(false);
  const [isChar, setIsChar] = useState(false);
  const [isLength, setIsLength] = useState(false);

  const checkIcon = <FaCheck className="text-green-500 " size={15} />;
  const timesIcon = <FaTimes className="text-red-500" size={20} />;

  // switch condition handler
  function switchIcon(condition) {
    if (condition) {
      return checkIcon;
    }
    return timesIcon;
  }

  useEffect(() => {
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])/)) {
      setIsUpperLower(true);
    }
    if (password.match(/^(?=.*\d)/)) {
      setIsNumber(true);
    }
    if (password.match(/^(?=.*[!@#$%^&*])/)) {
      setIsChar(true);
    }
    if (password.length >= 8) {
      setIsLength(true);
    }
  }, [password]);

  return (
    <Card className="p-4 shadow-lg w-[300px] h-[220px]">
      <ul className="list-none space-y-2">
        <li className="flex items-center">
          <span className="flex items-center">
            {switchIcon(isUpperLower)}
            <span className="ml-2">LowerCase and Uppercase</span>
          </span>
        </li>
        <li className="flex items-center">
          <span className="flex items-center">
            {switchIcon(isNumber)}
            <span className="ml-2">(0-12)</span>
          </span>
        </li>
        <li className="flex items-center">
          <span className="flex items-center">
            {switchIcon(isChar)}
            <span className="ml-2">special character ($%^&@)</span>
          </span>
        </li>
        <li className="flex items-center">
          <span className="flex items-center">
            {switchIcon(isLength)}
            <span className="ml-2">At least 8 characters</span>
          </span>
        </li>
      </ul>
    </Card>
  );
};

export default PasswordCheckCard;
