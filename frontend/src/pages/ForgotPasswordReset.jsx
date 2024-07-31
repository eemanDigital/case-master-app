import { useState } from "react";
import Input from "../components/Inputs";
import Button from "../components/Button";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import LoadingSpinner from "../components/LoadingSpinner";
import { RESET, resetPassword } from "../redux/features/auth/authSlice";
import PasswordCheckCard from "../components/PasswordCheckCard";
import { toast } from "react-toastify";

const ForgotPasswordReset = () => {
  const { token } = useParams(); // Get the token from URL params
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);
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

    if (inputValue.password !== inputValue.passwordConfirm) {
      // Show error if passwords do not match
      return toast.error("Passwords do not match.");
    }

    await dispatch(resetPassword({ resetToken: token, userData: inputValue }));
    await dispatch(RESET());
    navigate("/login");
  }

  let inputStyle =
    "appearance-none block sm:w-[344px] bg-gray-200 text-red border border-red-500 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white";

  return (
    <section className="bg-gray-200 h-screen">
      <h1 className="text-5xl font-bold text-center p-5">
        Reset your Password
      </h1>

      <div className="flex flex-col md:flex-row justify-center">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-center items-center bg-white basis-2/5 shadow-md rounded-md px-8 pt-6 pb-8 m-4">
          <div className="flex flex-col items-center -mx-3 mb-6 gap-2">
            <div>
              <Input
                inputStyle={inputStyle}
                type="password"
                label="New Password"
                placeholder="*******"
                htmlFor="password"
                name="password"
                value={inputValue.password}
                onChange={handleChange}
              />
            </div>

            <PasswordCheckCard password={inputValue.password} />

            <div>
              <Input
                inputStyle={inputStyle}
                type="password"
                label="Confirm New Password"
                placeholder="*******"
                htmlFor="passwordConfirm"
                name="passwordConfirm"
                value={inputValue.passwordConfirm}
                onChange={handleChange}
              />
            </div>
            <Button
              type="submit"
              buttonStyle="bg-slate-500 m-2 px-5 py-2 rounded w-full text-slate-200 hover:bg-slate-400">
              {isLoading ? <LoadingSpinner /> : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ForgotPasswordReset;
