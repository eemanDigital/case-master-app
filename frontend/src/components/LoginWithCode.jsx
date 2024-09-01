import { useEffect, useState } from "react";
import Input from "./Inputs";
import { Button, Card } from "antd";
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
  const { isSuccess, isLoggedIn, isLoading } = useSelector(
    (state) => state.auth
  );

  const [userLoginCode, setUserLoginCode] = useState({ loginCode: "" });
  const { email } = useParams();

  // Destructure loginCode from userLoginCode
  const { loginCode } = userLoginCode;

  // Function to resend user login code
  const reSendUserLoginCode = async () => {
    await dispatch(sendLoginCode(email));
    await dispatch(RESET());
  };

  // Function to login user with code
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

  // Redirect user to dashboard if login is successful
  useEffect(() => {
    if (isSuccess && isLoggedIn) {
      navigate("/dashboard");
    }
  }, [isSuccess, isLoggedIn, navigate]);

  // Function to handle input change
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
    <section className="flex flex-col items-center justify-center min-h-screen bg-gray-300 shadow-md p-4">
      <h1 className="text-3xl font-bold text-center text-gray-800 p-5">
        Enter Your Access Code
      </h1>

      <form
        onSubmit={loginUserWithCode}
        className="flex flex-col justify-center items-center bg-white rounded-md px-8 pt-6  w-full max-w-md">
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

          <Button loading={isLoading} type="primary" htmlType="submit">
            Proceed To Login
          </Button>
          <small className="text-center mb-6 text-gray-800">
            We&apos;ve sent a verification code to your email. Enter the code
            below to confirm your account.
          </small>
        </div>
      </form>
      <Card className="w-full max-w-md p-4">
        <div className="flex justify-between gap-4">
          <Link to="/users/login" className="font-bold text-blue-500">
            Login here
          </Link>
          <button
            onClick={reSendUserLoginCode}
            className="text-gray-700 font-bold">
            Resend Code
          </button>
        </div>
      </Card>
    </section>
  );
};

export default LoginWithCode;
