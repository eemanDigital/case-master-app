import Input from "../components/Inputs";
// import lawyer1 from "../assets/lawyer1.svg";
import Button from "../components/Button";
// import { Link } from "react-router-dom";

const ResetPassword = () => {
  // const selectOptions =(position) positions.map((element) => {
  //   // return element;
  //   console.log(element);
  // });

  let inputStyle =
    " appearance-none block  sm:w-[344px] bg-gray-200 text-red border border-red-500 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white";

  return (
    <section className=" bg-gray-200 h-screen ">
      <h1 className="text-5xl bold text-center p-5">Reset your Password</h1>

      <div className="flex flex-col md:flex-row  justify-center  ">
        {/* <div className="flex flex-col  flex-none basis-2/5 text-center  items-center  rounded-md p-4 ">
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
        </div> */}

        <form className=" flex  flex-col justify-center items-center bg-white  basis-2/5  shadow-md rounded-md px-8 pt-6 pb-8 m-4">
          <div className="flex  flex-col items-center -mx-3  mb-6 gap-2">
            <div>
              <Input
                inputStyle={inputStyle}
                type="password"
                label=" new Password"
                placeholder="*******"
                htmlFor="Password"
              />
            </div>

            <div>
              <Input
                inputStyle={inputStyle}
                type="password"
                label=" Confirm new Password"
                placeholder="*******"
                htmlFor="confirm password"
                // value={inputValue.passwordConfirm}
                name="passwordConfirm"
                // onChange={handleChange}
              />
            </div>
            <Button buttonStyle="bg-slate-500 m-2 px-5 py-2 rounded w-full text-slate-200 hover:bg-slate-400">
              Submit{" "}
            </Button>
          </div>
          {/* 
          <div className="flex flex-col gap-4 justify-start items-start">
            <p>
              <span>
                Don&#39;t have an account?{" "}
                <Link to="/signup" className=" text-gray-800  font-bold">
                  Sign Up here
                </Link>
              </span>
            </p>

            <p>
              <Link to="/forgotpassword" className=" text-gray-800  font-bold">
                Forgot password
              </Link>
            </p>
          </div> */}
        </form>
      </div>
    </section>
  );
};

export default ResetPassword;
