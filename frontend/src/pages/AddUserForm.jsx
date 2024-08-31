import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
  const [inputValue, setInputValue] = useState(addUserInitValue);
  const { isLoading, isSuccess } = useSelector((state) => state.auth);
  const { togglePassword: togglePassword1, showPassword: showPassword1 } =
    useTogglePassword();
  const { togglePassword: togglePassword2, showPassword: showPassword2 } =
    useTogglePassword();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInputValue((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

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
    await dispatch(register(inputValue));
    await dispatch(sendVerificationMail(inputValue.email));
    navigate("/dashboard/staff");
  };

  const getOtherFieldSelected = inputValue.position === "Other";

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 px-4 sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-10 md:p-20">
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-gray-800">
            Add Staff
          </h1>
          <form onSubmit={registerUser} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
              <div className="sm:col-span-2">
                <PasswordInput
                  label="Password"
                  placeholder="*******"
                  value={inputValue.password}
                  name="password"
                  handleChange={handleChange}
                  showPassword={showPassword1}
                  togglePassword={togglePassword1}
                />
              </div>
              <div className="sm:col-span-2">
                <PasswordInput
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
              </div>
              <div className="sm:col-span-2">
                <PasswordCheckCard password={inputValue.password} />
              </div>
              <div className="sm:col-span-2 flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="isLawyer"
                  checked={inputValue.isLawyer || false}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <label className="text-gray-700 font-medium">
                  Is User A Lawyer
                </label>
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
              <div className="sm:col-span-2">
                <Input
                  type="text"
                  label="Address"
                  placeholder="No.2, Maitama Close, Abuja"
                  value={inputValue.address}
                  name="address"
                  onChange={handleChange}
                />
              </div>
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
              <div className="sm:col-span-2">
                <Input
                  textarea
                  label="Bio"
                  placeholder="Short bio about the staff"
                  value={inputValue.bio}
                  name="bio"
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-4 sm:space-y-0">
              <p className="text-center sm:text-left">
                {/* Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-blue-600 font-semibold hover:underline">
                  Login here
                </Link> */}
              </p>
              <Button
                type="submit"
                buttonStyle="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out">
                {isLoading ? "saving..." : "Add Staff"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
