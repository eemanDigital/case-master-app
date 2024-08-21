import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import Input from "../components/Inputs";
import Select from "../components/Select";
import Button from "../components/Button";
import PasswordInput from "../components/PasswordInput";
import useTogglePassword from "../hooks/useTogglePassword";
import PasswordCheckCard from "../components/PasswordCheckCard";
import { addUserInitValue } from "../utils/initialValues";
import { validateRegister } from "../utils/addUserValidation";
import {
  register,
  sendVerificationMail,
} from "../redux/features/auth/authSlice";
import { toast } from "react-toastify";
import { gender, positions, roles } from "../data/options";

const SignUp = () => {
  const [click, setClick] = useState(false);
  const [inputValue, setInputValue] = useState(addUserInitValue);
  const { togglePassword: togglePassword1, showPassword: showPassword1 } =
    useTogglePassword();
  const { togglePassword: togglePassword2, showPassword: showPassword2 } =
    useTogglePassword();
  const dispatch = useDispatch();

  // handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInputValue((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // handle register user
  const registerUser = async (e) => {
    e.preventDefault();
    validateRegister(
      inputValue.firstName,
      inputValue.lastName,
      inputValue.password,
      inputValue.email,
      inputValue.passwordConfirm,
      inputValue.address,
      inputValue.yearOfCall,
      inputValue.lawSchoolAttended,
      inputValue.phone,
      inputValue.gender,
      inputValue.universityAttended
    );
    await dispatch(register(inputValue)); // register user
    await dispatch(sendVerificationMail()); // send verification mail
  };

  const getOtherFieldSelected = inputValue.position === "Other"; // check if other field is selected

  const handleClick = () => setClick(!click);

  return (
    <>
      <h1 className="text-3xl md:text-4xl font-bold text-center py-5">
        Add Staff
      </h1>
      <section className="flex flex-wrap justify-center py-10 px-4 sm:px-6 md:px-8 lg:px-10 bg-gray-200">
        <form
          onSubmit={registerUser}
          className="bg-white w-full max-w-3xl shadow-md rounded-lg px-4 py-6 sm:px-6 md:px-8 lg:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <Input
              type="text"
              label="First Name"
              placeholder="First Name"
              value={inputValue.firstName}
              name="firstName"
              onChange={handleChange}
            />
            <Input
              type="text"
              label="Last Name"
              placeholder="Last Name"
              value={inputValue.lastName}
              name="lastName"
              onChange={handleChange}
            />
            <Input
              type="text"
              label="Middle Name"
              placeholder="Middle Name"
              value={inputValue.middleName}
              name="middleName"
              onChange={handleChange}
            />
            <Input
              type="email"
              label="Email"
              placeholder="Email"
              value={inputValue.email}
              name="email"
              onChange={handleChange}
            />
            <PasswordInput
              type="password"
              label="Password"
              placeholder="*******"
              value={inputValue.password}
              name="password"
              handleChange={handleChange}
              showPassword={showPassword1}
              togglePassword={togglePassword1}
            />
            <PasswordCheckCard password={inputValue.password} />
            <PasswordInput
              type="password"
              label="Confirm Password"
              placeholder="*******"
              value={inputValue.passwordConfirm}
              name="passwordConfirm"
              handleChange={handleChange}
              showPassword={showPassword2}
              togglePassword={togglePassword2}
              onPaste={(e) => {
                e.preventDefault();
                toast.error("You cannot paste into the input field");
                return false;
              }}
            />
            <div className="col-span-2 flex items-center space-x-3">
              <label className="text-gray-700 font-semibold">
                Is User A Lawyer:
              </label>
              <input
                type="checkbox"
                name="isLawyer"
                checked={inputValue.isLawyer || false}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
            </div>
            <Input
              type="date"
              label="Year of Call"
              value={inputValue.yearOfCall}
              name="yearOfCall"
              onChange={handleChange}
            />
            <Input
              type="text"
              label="Phone Contact"
              placeholder="Phone Contact"
              value={inputValue.phone}
              name="phone"
              onChange={handleChange}
            />
            <Input
              type="text"
              label="Address"
              placeholder="No.2, Maitama Close, Abuja"
              value={inputValue.address}
              name="address"
              onChange={handleChange}
            />
            <Select
              label="Position"
              options={positions}
              value={inputValue.position}
              name="position"
              onChange={handleChange}
            />
            <Select
              label="Gender"
              options={gender}
              value={inputValue.gender}
              name="gender"
              onChange={handleChange}
            />
            <Select
              label="Role"
              options={roles}
              value={inputValue.role}
              name="role"
              onChange={handleChange}
            />
            {getOtherFieldSelected && (
              <Input
                type="text"
                label="Specify Other Position"
                placeholder="Specify Position"
                value={inputValue.otherPosition}
                name="otherPosition"
                onChange={handleChange}
              />
            )}
            <Input
              type="text"
              label="Practice Area"
              placeholder="e.g. Intellectual Property Law"
              value={inputValue.practiceArea}
              name="practiceArea"
              onChange={handleChange}
            />
            <Input
              type="text"
              label="University Attended"
              placeholder="e.g. University of Ilorin"
              value={inputValue.universityAttended}
              name="universityAttended"
              onChange={handleChange}
            />
            <Input
              type="text"
              label="Law School Attended"
              placeholder="e.g. Kano Law School"
              value={inputValue.lawSchoolAttended}
              name="lawSchoolAttended"
              onChange={handleChange}
            />
            <Input
              type="textarea"
              label="Bio"
              placeholder="Short bio about the staff"
              value={inputValue.bio}
              name="bio"
              onChange={handleChange}
            />
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center mt-6 space-y-4 md:space-y-0">
            <p className="text-center md:text-left">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 font-semibold">
                Login here
              </Link>
            </p>
            <Button onClick={handleClick} className="w-full md:w-auto">
              Add User
            </Button>
          </div>
        </form>
      </section>
    </>
  );
};

export default SignUp;
