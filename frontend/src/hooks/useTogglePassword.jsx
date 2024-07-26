import { useState } from "react";

const useTogglePassword = () => {
  const [showPassword, setShowPassword] = useState(false);

  // toggle password's visibility
  const togglePassword = () => {
    setShowPassword(!showPassword);
  };
  return { togglePassword, showPassword };
};

export default useTogglePassword;
