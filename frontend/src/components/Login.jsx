import Input from "./Inputs";
import lawyer1 from "../assets/lawyer1.svg";
import Button from "./Button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useTogglePassword from "../hooks/useTogglePassword";
import { toast } from "react-toastify";
import { FaGoogle } from "react-icons/fa6";
import PasswordInput from "./PasswordInput";
import { login, RESET, sendLoginCode } from "../redux/features/auth/authSlice";
import { useDispatch, useSelector } from "react-redux";

const Login = () => {
  const { showPassword, togglePassword } = useTogglePassword();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isError, isSuccess, isLoading, message, isLoggedIn, twoFactor } =
    useSelector((state) => state.auth);
  const [inputValue, setInputValue] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputValue((prevValue) => ({
      ...prevValue,
      [name]: value,
    }));
  };

  const loginUser = async (e) => {
    e.preventDefault();
    if (!inputValue.email || !inputValue.password) {
      toast.error("Enter both your email and password");
      return;
    }
    await dispatch(login(inputValue));
  };

  useEffect(() => {
    if (isSuccess && isLoggedIn) {
      navigate("/dashboard");
    }
    // if two factor(new browser) is spotted trigger send login code
    if (isError && twoFactor) {
      dispatch(sendLoginCode(inputValue.email));
      navigate(`/loginWithCode/${inputValue.email}`);
    }
    if (isSuccess && !isLoggedIn) {
      toast.success(message);
    }
    dispatch(RESET());
  }, [
    isSuccess,
    isLoggedIn,
    isError,
    message,
    dispatch,
    navigate,
    twoFactor,
    inputValue.email,
  ]);

  const inputStyle = `appearance-none block sm:w-[344px] bg-gray-200 text-red border ${
    isError && "border-red-500"
  } rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white`;

  return (
    <section className="bg-gray-200 h-[100%]">
      <h1 className="text-5xl bold text-center p-5">Login</h1>
      <div className="flex flex-col md:flex-row justify-center">
        <div className="flex flex-col flex-none basis-2/5 text-center items-center rounded-md p-4">
          <img
            src={lawyer1}
            alt="lawyer's image"
            className="w-[300px] h-[300px] object-cover"
          />
          <h1 className="text-4xl bold">
            Lorem, ipsum dolor sit amet consectetur
          </h1>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatem.
          </p>
        </div>
        <div className="flex flex-col justify-center items-center bg-white basis-2/5 shadow-md rounded-md px-8 pt-6 pb-8 m-4">
          <button className="flex items-center gap-1">
            <FaGoogle />
            <span> Sign in with Google</span>
          </button>
          <h1 className="font-bold"> Or</h1>
          <form onSubmit={loginUser}>
            <div className="flex flex-col items-center -mx-3 mb-6 gap-2">
              <div>
                <Input
                  inputStyle={inputStyle}
                  type="email"
                  label="Email"
                  placeholder="Email"
                  htmlFor="Email"
                  value={inputValue.email}
                  name="email"
                  onChange={handleChange}
                />
              </div>
              <div className="relative">
                <PasswordInput
                  error={false}
                  name="password"
                  value={inputValue.password}
                  placeholder="*******"
                  handleChange={handleChange}
                  showPassword={showPassword}
                  togglePassword={togglePassword}
                  onPaste={() => {}}
                  style={inputStyle}
                />
              </div>
              <Button
                type="submit"
                buttonStyle="bg-slate-500 m-2 px-5 py-2 rounded w-full text-slate-200 hover:bg-slate-400">
                {isLoading ? "Loading..." : "Login"}
              </Button>
            </div>
            <div className="flex flex-col gap-4 justify-start items-start">
              <p>
                <Link to="/forgotpassword" className="text-gray-800 font-bold">
                  Forgot password
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Login;
