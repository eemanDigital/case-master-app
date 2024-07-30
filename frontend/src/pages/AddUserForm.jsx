// import { useContext } from "react";
import Input from "../components/Inputs";
import lawyer1 from "../assets/lawyer1.svg";
import Select from "../components/Select";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import { useState } from "react";
import PasswordInput from "../components/PasswordInput";
import useTogglePassword from "../hooks/useTogglePassword";
import { addUserInitValue } from "../utils/initialValues";
import { gender, positions, roles } from "../data/options";
import PasswordCheckCard from "../components/PasswordCheckCard";
import { validateRegister } from "../utils/addUserValidation";
import { useDispatch, useSelector } from "react-redux";
import { register } from "../redux/features/auth/authSlice";
import { toast } from "react-toastify";

const SignUp = () => {
  const [click, setClick] = useState(false);

  // destructure init value
  const [inputValue, setInputValue] = useState(addUserInitValue);
  const {
    firstName,
    lastName,
    password,
    email,
    passwordConfirm,
    address,
    yearOfCall,
    lawSchoolAttended,
    phone,
    universityAttended,
  } = inputValue;
  const dispatch = useDispatch();
  // const navigate = useNavigate();
  // const { isError, isSuccess, isLoading, message } = useSelector(
  //   (state) => state.auth
  // );

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
    const { name, value, type, checked } = e.target;

    setInputValue((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value, // Handle checkbox or text input
    }));
  }

  // dispatch({ type: "LOGIN", filPayload: fileValue });
  async function registerUser(e) {
    e.preventDefault();

    // validate registeration inputs
    validateRegister(
      firstName,
      lastName,
      password,
      email,
      passwordConfirm,
      address,
      yearOfCall,
      lawSchoolAttended,
      phone,
      gender,
      universityAttended
    );

    // dispatch
    await dispatch(register(inputValue));

    // Reset state after submission
    setInputValue(addUserInitValue);
  }

  function handleClick() {
    setClick(() => !click);
  }
  // console.log(inputValue);

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
            onSubmit={registerUser}
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
                  label="Second Name"
                  placeholder="Client Second Name"
                  htmlFor="secondName"
                  value={inputValue.secondName}
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
                />
              </div>
              <PasswordCheckCard password={password} />

              <div className="mt-4">
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
                  onPaste={(e) => {
                    e.preventDefault();
                    // disable pasting by user
                    toast.error("You cannot past into input field");
                    return false;
                  }}
                />
              </div>
              <div className="py-3">
                <label className="flex items-center space-x-2 uppercase text-gray-700 font-bold text-[14px]">
                  <span>Is User A Lawyer:</span>
                  <input
                    type="checkbox"
                    name="isLawyer"
                    checked={inputValue.isLawyer || false}
                    onChange={handleChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                </label>
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
            {/* <div>
              <Input
                type="number"
                label="Leave Entitled"
                placeholder="Enter leave entitled to"
                htmlFor="annualLeaveEntitled"
                value={inputValue.annualLeaveEntitled}
                name="annualLeaveEntitled"
                onChange={handleChange}
              />
            </div> */}

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
      </section>
    </>
  );
};

export default SignUp;
