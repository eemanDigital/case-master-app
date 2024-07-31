import { useState } from "react";
import Input from "../components/Inputs";
import lawyer1 from "../assets/lawyer1.svg";
import Button from "../components/Button";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { forgotUserPassword, RESET } from "../redux/features/auth/authSlice";
import LoadingSpinner from "../components/LoadingSpinner";

const ForgotPassword = () => {
  //getting data from our custom hooks for auth
  // const { data, loading, error, authenticate } = useAuth();
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);

  const [click, setClick] = useState(false);

  const [inputValue, setInputValue] = useState({
    email: "",
  });

  // handleChange function
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

    // Call fetchData with your endpoint, method, payload, and any additional arguments
    console.log(inputValue);

    await dispatch(forgotUserPassword(inputValue));
    await dispatch(RESET(inputValue));
    // Handle successful response
  }

  function handleClick() {
    setClick(() => !click);
  }
  let inputStyle =
    " appearance-none block  sm:w-[344px] bg-gray-200 text-red border border-red-500 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white";

  return (
    <section className=" bg-gray-200 h-[100%] ">
      <h1 className="text-5xl bold text-center p-5">Login to your account</h1>

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

        <form
          onSubmit={handleSubmit}
          className=" flex justify-center items-center bg-white  basis-2/5  shadow-md rounded-md px-8 pt-6 pb-8 m-4">
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
            {isLoading && <LoadingSpinner />}
            <Button
              onClick={handleClick}
              buttonStyle="bg-slate-500 m-2 px-5 py-2 rounded w-full text-slate-200 hover:bg-slate-400">
              Submit
            </Button>
            <div className=" text-center">
              <h2 className="text-2xl  italic font-bold">Or</h2>

              <p>
                <span>
                  <Link to="/login" className=" text-gray-800  font-bold">
                    Login here
                  </Link>
                </span>
              </p>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ForgotPassword;
