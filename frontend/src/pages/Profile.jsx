import Input from "../components/Inputs";
import Button from "../components/Button";
import { Link } from "react-router-dom";
import avatar from "../assets/avatar.png";
import { formatYear } from "../utils/formatDate";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { FaAddressBook, FaVoicemail, FaPhone } from "react-icons/fa";
import { MdEmail, MdMail } from "react-icons/md";
import { useAuthContext } from "../hooks/useAuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Profile = () => {
  // const { inputValue, handleChange } = useContext(FormContext);
  const [click, setClick] = useState(false);

  const { user } = useAuthContext();

  const [inputValue, setInputValue] = useState({
    passwordCurrent: "",
    password: "",
    passwordConfirm: "",
  });

  // getting data from out custom hook
  const { loading, error, authenticate } = useAuth();

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
    if (
      !inputValue.passwordCurrent ||
      !inputValue.password ||
      !inputValue.passwordConfirm
    ) {
      toast.error("Please, fill all the password fields", {});
      return;
    }

    try {
      // Call fetchData with your endpoint, method, payload, and any additional arguments
      await authenticate("users/changepassword", "patch", inputValue);
      // Handle successful response

      //
    } catch (err) {
      console.log(err);
    }
  }

  function handleClick() {
    setClick(() => !click);
  }

  //form input styling
  let inputStyle = ` appearance-none block  sm:w-[344px] bg-gray-200 text-red border ${
    error && "border-red-500"
  } rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white`;

  return (
    <section className="flex flex-col justify-between items-center">
      {/* PROFILE CARD */}
      <div className="flex justify-center md:flex-row flex-col  flex-wrap items-center shadow-md bg-white gap-10 p-8 rounded-md">
        <div className="">
          <h1 className="text-2xl font-bold text-center text-rose-700">
            {user?.data.user.firstName} {user?.data.user.lastName}{" "}
            {user?.data.user.middleName}
          </h1>
          <hr className=" w-72 " />
          <small className=" text-center mb-4 block">
            {user?.data.user.position}
          </small>
          <small className="block">
            <strong>Practice Area:</strong> {user?.data.user.practiceArea}
          </small>
          <small className="block">
            {" "}
            <strong>Year of Call: </strong>
            {formatYear(user?.data.user.yearOfCall)}
          </small>
          <small className="block">
            {" "}
            <strong>University Attended: </strong>
            {user?.data.user.universityAttended}
          </small>
          <small className="block">
            {" "}
            <strong>Law School Attended: </strong>
            {user?.data.user.lawSchoolAttended}
          </small>
          <hr className=" w-72 " />

          <small className="mt-6 flex flex-col  ">
            <p className="flex  items-center  gap-2">
              <MdMail className=" text-rose-700" /> {user?.data.user.email}
            </p>
            <p className="flex  items-center gap-2">
              <FaPhone className=" text-rose-700" />
              {user?.data.user.phone}
            </p>
            <p className="flex  items-center gap-2">
              <FaAddressBook className=" text-rose-700" />{" "}
              {user?.data.user.address}
            </p>
            <p>{user?.data.user.otherPosition}</p>
            <hr />
            <p className=" mt-4 w-96">
              {" "}
              <strong>Bio:</strong> <i>{user?.data.user.bio}</i>
            </p>
          </small>

          <Link to="edit" className="mt-5 block">
            <Button>Edit Profile</Button>
          </Link>
        </div>

        <img
          // use avatar as default image if user does not upload image
          src={
            user
              ? `http://localhost:3000/images/${user?.data.user.photo}`
              : avatar
          }
          alt={`${user?.data.user}'s profile image`}
          className="object-cover object-right-top h-48 w-48   rounded-full border-4 border-slate-500"
        />
      </div>

      {/* RESET PASSWORD FORM */}
      <div>
        <form
          onSubmit={handleSubmit}
          className=" flex  flex-col justify-center items-center bg-white  basis-2/5  shadow-md rounded-md px-8 pt-6 pb-8 m-4">
          <div className="flex  flex-col items-center -mx-3  mb-6 gap-2">
            <h1 className="text-4xl font-bold mb-5  capitalize">
              reset password
            </h1>

            <div>
              <Input
                inputStyle={inputStyle}
                type="password"
                label=" current password"
                placeholder="********"
                htmlFor="current password"
                value={inputValue.passwordCurrent}
                name="passwordCurrent"
                onChange={handleChange}
              />
            </div>
            <div>
              <Input
                inputStyle={inputStyle}
                type="password"
                label=" current password"
                placeholder="********"
                htmlFor=" password"
                value={inputValue.password}
                name="password"
                onChange={handleChange}
              />
            </div>
            <div>
              <Input
                inputStyle={inputStyle}
                type="password"
                label="confirm Password"
                placeholder="********"
                htmlFor="passwordConfirm"
                value={inputValue.passwordConfirm}
                name="passwordConfirm"
                onChange={handleChange}
              />
            </div>
            <Button
              onClick={handleClick}
              buttonStyle="bg-slate-500 m-2 px-5 py-2 rounded w-full text-slate-200 hover:bg-slate-400">
              Submit
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
        </form>
      </div>
    </section>
  );
};

export default Profile;
