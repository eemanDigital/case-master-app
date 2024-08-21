import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "antd";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PasswordCheckCard from "../components/PasswordCheckCard";
import useTogglePassword from "../hooks/useTogglePassword";
import PasswordInput from "../components/PasswordInput";
import useModal from "../hooks/useModal";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  changePassword,
  logout,
  RESET,
} from "../redux/features/auth/authSlice";
import { sendAutomatedEmail } from "../redux/features/emails/emailSlice";

const ChangePassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, user } = useSelector((state) => state.auth);
  const { open, showModal, handleCancel } = useModal();

  // State to hold input values
  const [inputValue, setInputValue] = useState({
    passwordCurrent: "",
    password: "",
    passwordConfirm: "",
  });

  // Custom hook to toggle password visibility
  const { togglePassword: togglePassword1, showPassword: showPassword1 } =
    useTogglePassword();
  const { togglePassword: togglePassword2, showPassword: showPassword2 } =
    useTogglePassword();
  const { togglePassword: togglePassword3, showPassword: showPassword3 } =
    useTogglePassword();

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputValue((prevValue) => ({
      ...prevValue,
      [name]: value,
    }));
  };

  // Validate form fields
  const validateForm = () => {
    const { passwordCurrent, password, passwordConfirm } = inputValue;
    if (!passwordCurrent || !password || !passwordConfirm) {
      toast.error("Please fill in all fields.");
      return false;
    }
    if (password !== passwordConfirm) {
      toast.error("Passwords do not match.");
      return false;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const emailData = {
      subject: "Password Changed - CaseMaster",
      send_to: user?.data?.email,
      reply_to: "noreply@gmail.com",
      template: "changePassword",
      url: "/dashboard/profile",
    };

    // Try to change password
    try {
      // Perform the password change
      await dispatch(changePassword(inputValue)).unwrap();
      // Send email notification
      await dispatch(sendAutomatedEmail(emailData));
      // Perform logout
      await dispatch(logout()).unwrap();
      // Reset state
      await dispatch(RESET());
      // Redirect to login
      toast.success("Password changed successfully! Please log in again.");
      setTimeout(() => {
        navigate("/login");
      }, 1000); // Add a delay to ensure state is reset
    } catch (error) {
      toast.error("Failed to change password. Please try again.");
    }
  };

  // Style for input fields

  let inputStyle = `appearance-none block sm:w-[344px] bg-gray-200 text-red border ${
    isLoading ? "border-red-500" : ""
  } rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white`;

  return (
    <>
      <Button
        onClick={showModal}
        className="bg-blue-500 hover:bg-blue-600 text-white mb-6">
        Change Password
      </Button>
      <Modal open={open} onCancel={handleCancel} footer={null}>
        <section className="flex flex-col justify-center items-center">
          <div>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col justify-center items-center bg-white sm:basis-2/5 shadow-md rounded-md px-8 pt-6 pb-8 m-4">
              <div className="flex flex-col items-center -mx-3 mb-6 gap-2">
                <h1 className="text-4xl font-bold mb-5 capitalize">
                  Change Password
                </h1>

                <PasswordInput
                  style={inputStyle}
                  type="password"
                  label="New Password"
                  placeholder="*******"
                  htmlFor="Password"
                  value={inputValue.passwordCurrent}
                  name="passwordCurrent"
                  handleChange={handleChange}
                  showPassword={showPassword1}
                  togglePassword={togglePassword1}
                  onPaste={() => {}}
                />
                <PasswordInput
                  style={inputStyle}
                  type="password"
                  label="New Password"
                  placeholder="*******"
                  htmlFor="Password"
                  value={inputValue.password}
                  name="password"
                  handleChange={handleChange}
                  showPassword={showPassword2}
                  togglePassword={togglePassword2}
                  onPaste={() => {}}
                />

                <PasswordInput
                  style={inputStyle}
                  type="password"
                  label="Confirm Password"
                  placeholder="*******"
                  htmlFor="confirm password"
                  value={inputValue.passwordConfirm}
                  name="passwordConfirm"
                  handleChange={handleChange}
                  showPassword={showPassword3}
                  togglePassword={togglePassword3}
                  onPaste={() => {}}
                />

                <PasswordCheckCard password={inputValue.password} />
              </div>

              {isLoading && <LoadingSpinner />}
              <button
                type="submit"
                className="bg-blue-500 px-5 py-2 rounded w-full text-slate-200 hover:bg-blue-400">
                Submit
              </button>
            </form>
          </div>
        </section>
      </Modal>
    </>
  );
};

export default ChangePassword;
