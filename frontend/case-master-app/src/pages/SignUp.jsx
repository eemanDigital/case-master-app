import Input from "../components/Inputs";
import lawyer1 from "../assets/lawyer1.svg";
import Select from "../components/Select";
import { Link } from "react-router-dom";
import Button from "../components/Button";

const SignUp = () => {
  const positions = ["counsel", "principal", "intern"];

  // const selectOptions =(position) positions.map((element) => {
  //   // return element;
  //   console.log(element);
  // });
  return (
    <section className=" bg-gray-200 ">
      <h1 className="text-5xl bold text-center p-5">Register</h1>

      <div className="flex flex-col md:flex-row  justify-center  ">
        <div className="flex flex-col  flex-none basis-2/5 text-center  items-center  rounded-md p-4 ">
          <img
            src={lawyer1}
            alt="lawyer's image"
            className="w-[300px] h-[300px] object-cover"
          />

          <h1 className="text-4xl bold ">
            Lorem, ipsum dolor sit amet consectetur adipisicing elit.
          </h1>
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatem,
            at dolorem delectus optio est deserunt autem? In enim sequi illum.
          </p>
        </div>

        <form className="  bg-white   basis-3/5 shadow-md  rounded-md px-8 pt-6 pb-8 m-4">
          <div className="flex flex-col sm:flex-row -mx-3 mb-6 gap-2">
            <div>
              <Input
                type="text"
                label="First Name"
                placeholder="First Name"
                htmlFor="First Name"
                text="Please enter your first name"
              />
            </div>
            <div>
              <Input
                type="text"
                label="Last Name"
                placeholder="Last Name"
                htmlFor="Last Name"
              />
            </div>
            <div>
              <Input
                type="text"
                label="Middle Name"
                placeholder="Middle Name"
                htmlFor="Middle Name"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row -mx-3 mb-6 gap-2">
            <div>
              <Input
                type="email"
                label="Email"
                placeholder="Email"
                htmlFor="Email"
              />
            </div>
            <div>
              <Input
                type="password"
                label="Password"
                placeholder="*******"
                htmlFor="Password"
              />
            </div>
            <div>
              <Input
                type="password"
                label="Confirm Password"
                placeholder="*******"
                htmlFor="confirm password"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row -mx-3 mb-6 gap-2 justify-between  md:items-center">
            <div>
              <Input
                type="Date"
                label="Year of call"
                placeholder="Year of call"
                htmlFor="Year of call"
              />
            </div>
            <div>
              <Input
                type="text"
                label="Phone Contact"
                placeholder="Phone Contact"
                htmlFor="Phone Contact"
              />
            </div>
            <div>
              <Input
                type="text"
                label="address"
                placeholder="No.2, Maitama Close, Abuja"
                htmlFor="address"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row -mx-3 mb-6 gap-2 justify-between  sm:items-center">
            <div>
              <Input type="file" label="upload photo" htmlFor="photo" />
            </div>
            <div className="w-[300px]">
              <Select label="Position" options={positions} />
            </div>
          </div>

          <div className="  flex-1">
            <Input
              type="text"
              textarea
              label="bio"
              placeholder="bio"
              htmlFor="bio"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p>
              <span>
                Already have an account?{" "}
                <Link to="/login" className=" text-gray-800  font-bold">
                  Login here
                </Link>
              </span>
            </p>

            <Button>Sign Up</Button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default SignUp;
