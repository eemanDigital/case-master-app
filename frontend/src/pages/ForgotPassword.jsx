import { useState } from "react";
import Input from "../components/Inputs";
import Button from "../components/Button";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { forgotUserPassword, RESET } from "../redux/features/auth/authSlice";

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);

  const [inputValue, setInputValue] = useState({
    email: "",
  });

  // handleChange function
  function handleChange(e) {
    const inputText = e.target.value;
    const inputName = e.target.name;

    setInputValue((prevValue) => ({
      ...prevValue,
      [inputName]: inputText,
    }));
  }

  // function to handle form submission
  async function handleSubmit(e) {
    e.preventDefault();

    await dispatch(forgotUserPassword(inputValue));
    await dispatch(RESET());
  }

  const inputStyle =
    "appearance-none block w-full bg-gray-100 text-gray-800 border border-gray-300 rounded py-2 px-4 mb-4 leading-tight focus:outline-none focus:ring focus:border-blue-500";

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-200 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white shadow-lg rounded-lg p-8 space-y-6">
        <h1 className="text-2xl font-semibold text-center text-gray-800">
          Forgot Password
        </h1>
        <p className="text-sm text-center text-gray-500">
          Enter your email address to reset your password
        </p>
        <Input
          inputStyle={inputStyle}
          type="email"
          label="Email"
          placeholder="Enter your email"
          htmlFor="Email"
          value={inputValue.email}
          name="email"
          onChange={handleChange}
        />
        <Button
          type="submit"
          buttonStyle="bg-blue-500 hover:bg-blue-600 transition-colors duration-200 text-white font-medium py-2 rounded w-full text-center flex items-center justify-center">
          {isLoading ? "submitting..." : "Submit"}
        </Button>
        <div className="text-center">
          <h2 className="text-sm italic font-medium text-gray-600">Or</h2>
          <Link
            to="/users/login"
            className="text-blue-500 hover:text-blue-600 font-semibold">
            Login here
          </Link>
        </div>
      </form>
    </section>
  );
};

export default ForgotPassword;
