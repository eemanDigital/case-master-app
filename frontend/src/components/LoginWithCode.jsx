import { useEffect, useState } from "react";
import Input from "./Inputs";
import Button from "./Button";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import {
  loginWithCode,
  RESET,
  sendLoginCode,
} from "../redux/features/auth/authSlice";

const LoginWithCode = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isSuccess, isLoading, isLoggedIn } = useSelector(
    (state) => state.auth
  );
  const [click, setClick] = useState(false);
  const [userLoginCode, setUserLoginCode] = useState({ loginCode: "" });
  const { email } = useParams();

  const { loginCode } = userLoginCode;

  const reSendUserLoginCode = async () => {
    await dispatch(sendLoginCode(email));
    // await dispatch(RESET());
  };

  const loginUserWithCode = async (e) => {
    e.preventDefault();
    if (!loginCode || loginCode === "") {
      toast.error("Enter your access code");
      return;
    }
    if (loginCode.length !== 6) {
      toast.error("Access code must be 6 digits");
      return;
    }

    const code = { loginCode };
    await dispatch(loginWithCode({ code, email }));
    await dispatch(RESET());
  };

  useEffect(() => {
    if (isSuccess && isLoggedIn) {
      navigate("/dashboard");
    }
  }, [isSuccess, isLoggedIn, navigate]);

  function handleClick() {
    setClick(() => !click);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserLoginCode((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  let inputStyle =
    "appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500";

  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-gray-300 shadow-md ">
      <h1 className="text-5xl font-bold text-center p-5">
        Enter Your Access Code
      </h1>

      <form
        onSubmit={loginUserWithCode}
        className="flex flex-col justify-center items-center bg-white rounded-md px-8 pt-6 pb-8  w-full max-w-md">
        <div className="flex flex-col items-center mb-6 gap-4 w-full">
          <Input
            inputStyle={inputStyle}
            type="text"
            label="Access Code"
            placeholder="Access Code"
            htmlFor="loginCode"
            value={loginCode}
            name="loginCode"
            onChange={handleChange}
          />

          <Button
            onClick={handleClick}
            buttonStyle="bg-blue-500 hover:bg-blue-600 px-5 py-2 rounded w-full text-white">
            Proceed To Login
          </Button>
          <p className="text-center mb-6 text-gray-700">
            We've sent a verification code to your email. Enter the code below
            to confirm your account.
          </p>
          <div className="text-center w-full">
            <h2 className="text-2xl italic font-bold mb-4">Or</h2>
          </div>
        </div>
      </form>
      <div className="flex justify-between w-full max-w-md gap-4 mt-4">
        <Link to="/login" className="font-bold text-blue-500">
          Login here
        </Link>
        <button
          onClick={reSendUserLoginCode}
          className="text-gray-700 font-bold">
          Resend Code
        </button>
      </div>
    </section>
  );
};

export default LoginWithCode;
