import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { login, RESET, sendLoginCode } from "../redux/features/auth/authSlice";
import useTogglePassword from "../hooks/useTogglePassword";
import GoogleUserLogin from "./GoogleUserLogin";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const { showPassword, togglePassword } = useTogglePassword();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isError, isSuccess, isLoading, message, isLoggedIn, twoFactor } =
    useSelector((state) => state.auth);
  const [inputValue, setInputValue] = useState({ email: "", password: "" });

  //remove space from password to field
  useEffect(() => {
    const password = inputValue.password;
    if (password.includes(" ")) {
      setInputValue((prevValue) => ({
        ...prevValue,
        password: password.replace(/\s/g, ""),
      }));
    }
  }, [inputValue.password]);

  // handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputValue((prevValue) => ({ ...prevValue, [name]: value }));
  };

  // login user handler
  // const loginUser = async (e) => {
  //   e.preventDefault();
  //   if (!inputValue.email || !inputValue.password) {
  //     toast.error("Enter both your email and password");
  //     return;
  //   }
  //   await dispatch(login(inputValue));
  // };

  // handle success and error toast
  // useEffect(() => {
  //   if (isSuccess && isLoggedIn) {
  //     navigate("/dashboard");
  //   }
  //   if (isError && twoFactor) {
  //     dispatch(sendLoginCode(inputValue.email));
  //     navigate(`/loginWithCode/${inputValue.email}`);
  //   }

  //   dispatch(RESET());
  // }, [
  //   isSuccess,
  //   isLoggedIn,
  //   isError,
  //   message,
  //   dispatch,
  //   navigate,
  //   twoFactor,
  //   inputValue.email,
  // ]);

  // login user handler
  const loginUser = async (e) => {
    e.preventDefault();
    if (!inputValue.email || !inputValue.password) {
      toast.error("Enter both your email and password");
      return;
    }
    await dispatch(login(inputValue));
  };

  // handle success and error toast
  useEffect(() => {
    if (isSuccess && isLoggedIn) {
      navigate("/dashboard");
    }

    // ✅ FIXED: Check for twoFactor flag in the error message or action payload
    if (isError && message?.includes("New device detected")) {
      // Extract email from the action payload or use the input value
      const emailToUse = inputValue.email;
      dispatch(sendLoginCode(emailToUse));
      navigate(`/loginWithCode/${emailToUse}`);
    }

    dispatch(RESET());
  }, [
    isSuccess,
    isLoggedIn,
    isError,
    message,
    dispatch,
    navigate,
    inputValue.email,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white sm:p-10 p-3 lg:p-10 rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={loginUser}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={inputValue.email}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Password"
                  value={inputValue.password}
                  onChange={handleChange}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center z-20">
                  <button
                    type="button"
                    onClick={togglePassword}
                    className="focus:outline-none">
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FaEye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/forgotpassword"
                className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6">
            <GoogleUserLogin />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
