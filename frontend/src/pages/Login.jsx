import Input from "../components/Inputs";
import lawyer1 from "../assets/lawyer1.svg";
import Button from "../components/Button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAuthContext } from "../hooks/useAuthContext";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GoogleAuth from "./GoogleAuth";
// import CalendarEventForm from "./GoogleCalenderForm";

const Login = () => {
  const [click, setClick] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [inputValue, setInputValue] = useState({
    email: "",
    password: "",
  });

  // getting data from out custom hook
  const { data, loading, error, authenticate } = useAuth();

  function handleChange(e) {
    const inputText = e.target.value;
    const inputName = e.target.name;

    setInputValue((prevValue) => {
      return { ...prevValue, [inputName]: inputText };
    });
  }

  // function to handle for submission
  async function handleSubmit(e) {
    e.preventDefault();
    if (!inputValue.email || !inputValue.password) {
      toast.error("Enter both your email and password", {});
      return;
    }
    if (user) {
      toast.info("You are already logged in", {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }
    try {
      // Call fetchData with your endpoint, method, payload, and any additional arguments
      await authenticate("users/login", "post", inputValue);
      // Handle successful response
      if (data?.status === "success") {
        navigate("/dashboard");
      }
    } catch (err) {
      console.log(err);
    }
  }

  function handleClick() {
    setClick(() => !click);
  }

  // console.log("data", data.status);

  // redirect user upon successful login
  useEffect(() => {
    if (data?.status === "success") {
      navigate("/dashboard");
    }
  }, [data, navigate]);

  let inputStyle = ` appearance-none block  sm:w-[344px] bg-gray-200 text-red border ${
    error && "border-red-500"
  } rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white`;

  return (
    <section className=" bg-gray-200 h-[100%] ">
      <h1 className="text-5xl bold text-center p-5">Login to your account</h1>
      {/* <h2>{error?.response.data.message}</h2> */}
      <div className="flex flex-col md:flex-row  justify-center  ">
        <div className="flex flex-col  flex-none basis-2/5 text-center  items-center  rounded-md p-4 ">
          <img
            src={lawyer1}
            alt="lawyer's image"
            className="w-[300px] h-[300px] object-cover"
          />

          <h1 className="text-4xl bold ">
            Lorem, ipsum dolor sit amet consectetur
          </h1>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatem.
          </p>
        </div>
        <div className=" flex  flex-col justify-center items-center bg-white  basis-2/5  shadow-md rounded-md px-8 pt-6 pb-8 m-4">
          <form onSubmit={handleSubmit}>
            <div className="flex  flex-col items-center -mx-3  mb-6 gap-2">
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
              <div>
                <Input
                  inputStyle={inputStyle}
                  type="password"
                  label="Password"
                  placeholder="*******"
                  htmlFor="Password"
                  value={inputValue.password}
                  name="password"
                  onChange={handleChange}
                />
              </div>
              <Button
                onClick={handleClick}
                buttonStyle="bg-slate-500 m-2 px-5 py-2 rounded w-full text-slate-200 hover:bg-slate-400">
                Login
                <ToastContainer
                  position="top-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="light"
                  // transition: Bounce,
                />
              </Button>
            </div>

            <div className="flex flex-col gap-4 justify-start items-start">
              <p>
                <Link
                  to="/forgotpassword"
                  className=" text-gray-800  font-bold">
                  Forgot password
                </Link>
              </p>
            </div>
          </form>
          <GoogleAuth />
          {/* <CalendarEventForm /> */}
        </div>
      </div>
    </section>
  );
};

export default Login;
