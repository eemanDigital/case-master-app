import { useState } from "react";
import Input from "../components/Inputs";
import Button from "../components/Button";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RESET, resetPassword } from "../redux/features/auth/authSlice";
import PasswordCheckCard from "../components/PasswordCheckCard";
import { toast } from "react-toastify";

const ForgotPasswordReset = () => {
  const { token } = useParams(); // Get the token from URL params
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth); // Loading state from Redux
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState({
    password: "",
    passwordConfirm: "",
  });

  // Handle input change
  function handleChange(e) {
    const inputText = e.target.value;
    const inputName = e.target.name;

    setInputValue((prevValue) => ({
      ...prevValue,
      [inputName]: inputText,
    }));
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();

    // Show error if passwords do not match
    if (inputValue.password !== inputValue.passwordConfirm) {
      return toast.error("Passwords do not match.");
    }

    // Dispatch reset password action
    await dispatch(resetPassword({ resetToken: token, userData: inputValue }));
    await dispatch(RESET());
    navigate("/users/login"); // Redirect to login page
  }

  // Input styling
  const inputStyle =
    "appearance-none block w-full bg-gray-100 text-gray-700 border border-gray-300 rounded py-2 px-4 mb-4 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white";

  return (
    <section className="flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-300 min-h-screen p-6">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          Reset Your Password
        </h1>
        <p className="text-sm text-center text-gray-500 mb-6">
          Enter your new password below to reset your account password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            inputStyle={inputStyle}
            type="password"
            label="New Password"
            placeholder="Enter new password"
            htmlFor="password"
            name="password"
            value={inputValue.password}
            onChange={handleChange}
          />

          {/* Password strength checker */}
          <PasswordCheckCard password={inputValue.password} />

          <Input
            inputStyle={inputStyle}
            type="password"
            label="Confirm New Password"
            placeholder="Confirm your new password"
            htmlFor="passwordConfirm"
            name="passwordConfirm"
            value={inputValue.passwordConfirm}
            onChange={handleChange}
          />

          <Button
            type="submit"
            buttonStyle="bg-blue-500 hover:bg-blue-600 transition duration-200 text-white font-semibold py-2 rounded w-full text-center flex items-center justify-center">
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default ForgotPasswordReset;
