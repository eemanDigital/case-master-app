import { useState } from "react";
import Input from "../components/Inputs";
import Button from "../components/Button";
import { useAuth } from "../hooks/useAuth";
import { useParams } from "react-router-dom";

const ForgotPasswordReset = ({ endpoint }) => {
  const { token } = useParams();
  //getting data from our custom hooks for auth
  const { data, loading, error, authenticate } = useAuth();

  const [click, setClick] = useState(false);
  // const [photo, setPhoto] = useState("");

  const [inputValue, setInputValue] = useState({
    password: "",
    passwordConfirm: "",
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

    try {
      // Call fetchData with your endpoint, method, payload, and any additional arguments
      await authenticate(`${endpoint}/${token}`, "patch", inputValue);
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
    <section className=" bg-gray-200 h-screen ">
      <h1 className="text-5xl bold text-center p-5">Reset your Password</h1>

      <div className="flex flex-col md:flex-row  justify-center  ">
        <form
          onSubmit={handleSubmit}
          className=" flex  flex-col justify-center items-center bg-white  basis-2/5  shadow-md rounded-md px-8 pt-6 pb-8 m-4">
          <div className="flex  flex-col items-center -mx-3  mb-6 gap-2">
            <div>
              <Input
                inputStyle={inputStyle}
                type="password"
                label=" new Password"
                placeholder="*******"
                htmlFor="password"
                name="password"
                value={inputValue.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <Input
                inputStyle={inputStyle}
                type="password"
                label=" Confirm new Password"
                placeholder="*******"
                htmlFor="confirm password"
                value={inputValue.passwordConfirm}
                name="passwordConfirm"
                onChange={handleChange}
              />
            </div>
            <Button
              onClick={handleClick}
              buttonStyle="bg-slate-500 m-2 px-5 py-2 rounded w-full text-slate-200 hover:bg-slate-400">
              Submit{" "}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ForgotPasswordReset;
