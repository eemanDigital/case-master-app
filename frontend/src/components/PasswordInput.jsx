import { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const PasswordInput = ({
  error,
  name,
  value,
  label,
  placeholder,
  htmlFor,
  handleChange,
  showPassword,
  togglePassword,
  onPaste,
  input,
  style,
}) => {
  const defaultStyle = `appearance-none block w-full bg-gray-200 text-red border ${
    error ? "border-red-500" : ""
  } rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white`;
  return (
    <div className="relative">
      <label
        htmlFor={htmlFor}
        className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2 ">
        {label}
      </label>
      <input
        className={style || defaultStyle}
        type={showPassword ? "text" : "password"}
        required
        placeholder={placeholder}
        value={value}
        name={name}
        onChange={handleChange}
        onPaste={onPaste}
      />
      <div
        className="absolute inset-y-0 right-0 pt-5  pr-3 flex items-center cursor-pointer"
        onClick={togglePassword}>
        {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
      </div>
    </div>
  );
};

export default PasswordInput;
