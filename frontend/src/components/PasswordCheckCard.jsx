import { Card } from "antd";
import { useState, useEffect } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";

const PasswordCheckCard = ({ password }) => {
  const [isUpperLower, setIsUpperLower] = useState(false);
  const [isNumber, setIsNumber] = useState(false);
  const [isChar, setIsChar] = useState(false);
  const [isLength, setIsLength] = useState(false);

  const checkIcon = <FaCheck className="text-green-500" />;
  const timesIcon = <FaTimes className="text-red-500" />;

  // switch condition handler
  function switchIcon(condition) {
    return condition ? checkIcon : timesIcon;
  }

  useEffect(() => {
    // Check for lowercase and uppercase
    setIsUpperLower(password.match(/(?=.*[a-z])(?=.*[A-Z])/) !== null);

    // Check for number
    setIsNumber(password.match(/(?=.*\d)/) !== null);

    // Check for special character
    setIsChar(password.match(/(?=.*[!@#$%^&*])/) !== null);

    // Check for length
    setIsLength(password.length >= 8);
  }, [password]);

  return (
    <div className="text-xs">
      <ul className="flex flex-col space-y-2">
        <li className="flex items-center space-x-3">
          {switchIcon(isUpperLower)}
          <span className="text-sm">Lowercase and Uppercase</span>
        </li>
        <li className="flex items-center space-x-3">
          {switchIcon(isNumber)}
          <span className="text-sm">Number (0-9)</span>
        </li>
        <li className="flex items-center space-x-3">
          {switchIcon(isChar)}
          <span className="text-sm">Special character (!@#$%^&*)</span>
        </li>
        <li className="flex items-center space-x-3">
          {switchIcon(isLength)}
          <span className="text-sm">At least 8 characters</span>
        </li>
      </ul>
    </div>
  );
};

export default PasswordCheckCard;
