// import { useContext } from "react";
import Input from "../components/Inputs";
import lawyer1 from "../assets/lawyer1.svg";
import Select from "../components/Select";

import { Link } from "react-router-dom";
import Button from "../components/Button";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PasswordInput from "../components/PasswordInput";
import useTogglePassword from "../hooks/useTogglePassword";
import { addUserInitValue } from "../utils/initialValues";
import { gender, positions, roles } from "../data/options";
import PasswordCheckCard from "../components/PasswordCheckCard";
// import { useAuthContext } from "../hooks/useAuthContext";

// import useFetch from "../hooks/useFetch";

// const URL = "http://localhost:3000/api/v1/users/signup";

const SignUp = () => {
  const { data, loading, error, authenticate } = useAuth();
  const [click, setClick] = useState(false);

  // console.log(fileData.data?.file);
  // console.log(data);
  const [inputValue, setInputValue] = useState(addUserInitValue);
  const { password } = inputValue;
  //password check state
  // const [isUpper, setIsUpper] = useState(false)
  // const [isNumber, setIsNumber] = useState(false)
  // const [isChar, setIsChar] = useState(false)
  // const [isLength, setIsLength] = useState(false)
  ///////////////////////////////////////

  // handle password token hook
  const { togglePassword: togglePassword1, showPassword: showPassword1 } =
    useTogglePassword();
  const { togglePassword: togglePassword2, showPassword: showPassword2 } =
    useTogglePassword();

  // const { dispatch } = useAuthContext();
  // derived state to check if user select "Other"
  const getOtherFieldSelected = inputValue.position === "Other";

  // handleChange function
  function handleChange(e) {
    const { name, value } = e.target;

    setInputValue((prevData) => ({
      ...prevData,
      [name]: value, // Handle file or text input
    }));
  }

  // dispatch({ type: "LOGIN", filPayload: fileValue });
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      // Call fetchData with endpoint, method, payload, and any additional arguments
      await authenticate("users/signup", "post", inputValue);
    } catch (err) {
      console.log(err);
    }
  }

  function handleClick() {
    setClick(() => !click);
  }

  console.log(inputValue);

  return (
    <>
      <h1 className="text-5xl bold text-center p-5">Add Staff</h1>
      <section className="flex bg-gray-200 ">
        <div className="flex flex-col md:flex-row  w-full justify-center  ">
          {/* <div className="flex flex-col  flex-none basis-2/5 text-center  items-center  rounded-md p-4 ">
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
        </div> */}

          <form
            onSubmit={handleSubmit}
            className="  bg-white w-full   basis-3/5 shadow-md  rounded-md px-8 pt-6 pb-8 m-4">
            <div className="sm:flex-row -mx-3 mb-6 gap-2">
              <div>
                <Input
                  type="text"
                  label="First Name"
                  placeholder="First Name"
                  htmlFor="First Name"
                  text="Please enter your first name"
                  value={inputValue.firstName}
                  name="firstName"
                  onChange={handleChange}
                />
              </div>
              <div>
                <Input
                  type="text"
                  label="Last Name"
                  placeholder="Last Name"
                  htmlFor="Last Name"
                  value={inputValue.lastName}
                  name="lastName"
                  onChange={handleChange}
                />
              </div>
              <div>
                <Input
                  type="text"
                  label="Middle Name"
                  placeholder="Middle Name"
                  htmlFor="Middle Name"
                  value={inputValue.middleName}
                  name="middleName"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className=" mb-6 gap-2">
              <div>
                <Input
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
                <PasswordInput
                  type="password"
                  label="Password"
                  placeholder="*******"
                  htmlFor="Password"
                  value={inputValue.password}
                  name="password"
                  handleChange={handleChange}
                  showPassword={showPassword1}
                  togglePassword={togglePassword1}
                  onPaste={() => {}}
                />
              </div>
              <PasswordCheckCard password={password} />

              <div>
                <PasswordInput
                  type="password"
                  label="Confirm Password"
                  placeholder="*******"
                  htmlFor="confirm password"
                  value={inputValue.passwordConfirm}
                  name="passwordConfirm"
                  handleChange={handleChange}
                  showPassword={showPassword2}
                  togglePassword={togglePassword2}
                  onPaste={() => {}}
                />
              </div>
            </div>

            {/* <div className="flex flex-col sm:flex-row -mx-3 mb-6 gap-2 justify-between  md:items-center"> */}
            <div>
              <Input
                type="Date"
                label="Year of call"
                placeholder="Year of call"
                htmlFor="Year of call"
                value={inputValue.yearOfCall}
                name="yearOfCall"
                onChange={handleChange}
              />
            </div>
            <div>
              <Input
                type="text"
                label="Phone Contact"
                placeholder="Phone Contact"
                htmlFor="Phone Contact"
                value={inputValue.phone}
                name="phone"
                onChange={handleChange}
              />
            </div>
            <div>
              <Input
                type="text"
                label="address"
                placeholder="No.2, Maitama Close, Abuja"
                htmlFor="address"
                value={inputValue.address}
                name="address"
                onChange={handleChange}
              />
            </div>
            {/* </div> */}
            {/* <div className="flex flex-col sm:flex-row -mx-3 mb-6 flex-wrap gap-2 justify-between  sm:items-center"> */}
            {/* <div>
              <Input
                type="file"
                name="photo" // Use 'file' to match Multer configuration
                id=""
                accept=".jpg,.jpeg, .png"
                onChange={handlePhotoChange}
                label="upload photo"
                htmlFor="photo"
              />
            </div> */}
            <div>
              <Select
                label="Position"
                options={positions}
                value={inputValue.position}
                name="position"
                onChange={handleChange}
              />
            </div>
            <div>
              <Select
                label="gender"
                options={gender}
                value={inputValue.gender}
                name="gender"
                onChange={handleChange}
              />
            </div>
            <div>
              <Select
                label="role"
                options={roles}
                value={inputValue.role}
                name="role"
                onChange={handleChange}
              />
            </div>
            {/* conditionally render select position field */}
            {getOtherFieldSelected && (
              <div>
                <Input
                  required
                  type="text"
                  label="other"
                  placeholder="specify position"
                  htmlFor="otherPosition"
                  value={inputValue.otherPosition}
                  name="otherPosition"
                  onChange={handleChange}
                />
              </div>
            )}

            <div>
              <Input
                type="text"
                label="practice area"
                placeholder="e.g. Intellectual Property law"
                htmlFor="practice area"
                value={inputValue.practiceArea}
                name="practiceArea"
                onChange={handleChange}
              />
            </div>
            <div>
              <Input
                type="number"
                label="Leave Entitled"
                placeholder="Enter leave entitled to"
                htmlFor="annualLeaveEntitled"
                value={inputValue.annualLeaveEntitled}
                name="annualLeaveEntitled"
                onChange={handleChange}
              />
            </div>

            <div>
              <Input
                type="text"
                label="university attended"
                placeholder="e.g. University of Ilorin"
                htmlFor="university attended"
                value={inputValue.universityAttended}
                name="universityAttended"
                onChange={handleChange}
              />
            </div>
            <div>
              <Input
                type="text"
                label="law school attended"
                placeholder="e.g. Kano Law school"
                htmlFor="law school attended"
                value={inputValue.lawSchoolAttended}
                name="lawSchoolAttended"
                onChange={handleChange}
              />
            </div>
            {/* </div> */}

            <div>
              <Input
                type="text"
                textarea
                label="bio"
                placeholder="bio"
                htmlFor="bio"
                value={inputValue.bio}
                name="bio"
                onChange={handleChange}
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

              <Button onClick={handleClick}>Add User</Button>
            </div>
          </form>
        </div>
        <ToastContainer />
      </section>
    </>
  );
};

export default SignUp;
