import { useState } from "react";
import Input from "../components/Inputs";
import Button from "../components/Button";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const TwoFactorAuth = () => {
  //getting data from our custom hooks for auth
  const { data, loading, error, authenticate } = useAuth();

  const [click, setClick] = useState(false);

  const [loginCode, setloginCode] = useState();

  // function to handle for submission
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      // Call fetchData with your endpoint, method, payload, and any additional arguments
      await authenticate(endpoint, "post", loginCode);
      // Handle successful response
    } catch (err) {
      // Handle error
    }
  }

  function handleClick() {
    setClick(() => !click);
  }
  let inputStyle =
    " appearance-none block  sm:w-[344px] bg-gray-200 text-red border border-red-500 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white";

  return (
    <section className=" flex flex-col items-center justify-center ">
      <h1 className="text-5xl bold text-center p-5">Enter Your Access Code</h1>

      <form
        onSubmit={handleSubmit}
        className=" flex justify-center items-center bg-white  basis-2/5  rounded-md px-8 pt-6 pb-8 m-4">
        <div className="flex  flex-col items-center -mx-3  mb-6 gap-2">
          <div>
            <Input
              inputStyle={inputStyle}
              type="text"
              label="Access Code"
              placeholder="Access Code"
              htmlFor="loginCode"
              value={loginCode}
              name="loginCode"
              onChange={(e) => setloginCode(e.target.value)}
            />
          </div>

          <Button
            onClick={handleClick}
            buttonStyle="bg-blue-500 hover:bg-blue-600  px-5 py-2 rounded w-full text-slate-200 ">
            Submit
          </Button>
          {/* <small className="text-blue-600 block text-left mt-0 font-medium tracking-wider">
            Check your email for access code
          </small> */}
          <p className="text-center mb-6">
            We've sent a verification code to your email. Enter the code below
            to confirm your account.
          </p>
          <div className=" text-center">
            <h2 className="text-2xl  italic font-bold">Or</h2>

            <div className="flex justify-between  w-full gap-4">
              <Link to="/login" className="font-bold">
                Login here
              </Link>
              <button className="text-gray-700 font-bold">Resend Code</button>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};

export default TwoFactorAuth;
