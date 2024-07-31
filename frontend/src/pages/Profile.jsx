import avatar from "../assets/avatar.png";
import { formatYear } from "../utils/formatDate";
import { FaAddressBook, FaPhone } from "react-icons/fa";
import { MdMail } from "react-icons/md";
import "react-toastify/dist/ReactToastify.css";
import UpdateProfilePicture from "../components/UpdateProfilePicture";
import EditUserProfile from "./EditUserProfile";
import ChangePassword from "./ChangePassword";
import { useAdminHook } from "../hooks/useAdminHook";
import { useSelector } from "react-redux";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const Profile = () => {
  useRedirectLogoutUser("/login"); //redirect to login if not logged in

  const { isError, isSuccess, isLoading, message, isLoggedIn, user } =
    useSelector((state) => state.auth);
  const { isClient } = useAdminHook();

  // make position falsy when "Other" is selected to avoid having both "position" and "otherPosition" fields truthy
  if (user?.data?.position === "Other") {
    user.data.position = null;
  }

  return (
    <section className="flex flex-col justify-center items-center ">
      {/* PROFILE CARD */}

      <div className="flex justify-center md:flex-row flex-col  flex-wrap items-center shadow-md bg-white gap-10 p-8 rounded-md">
        <div className="flex flex-col items-center md:items-start  justify-start">
          <h1 className="text-2xl font-bold text-center text-rose-700">
            {user?.data?.firstName} {user?.data?.lastName}{" "}
            {user?.data?.middleName}
          </h1>
          <hr className=" w-72 " />
          <small className="text-center mb-4 block">
            {user?.data?.position ?? user?.data?.otherPosition}
          </small>
          <small className="block">
            <strong>Practice Area:</strong> {user?.data?.practiceArea}
          </small>
          <small className="block">
            {" "}
            <strong>Year of Call: </strong>
            {formatYear(user?.data?.yearOfCall)}
          </small>
          <small className="block">
            {" "}
            <strong>University Attended: </strong>
            {user?.data?.universityAttended}
          </small>
          <small className="block">
            {" "}
            <strong>Law School Attended: </strong>
            {user?.data?.lawSchoolAttended}
          </small>
          <hr className=" w-72 " />

          <small className="mt-6 flex flex-col  ">
            <p className="flex  items-center  gap-2">
              <MdMail className=" text-rose-700" /> {user?.data?.email}
            </p>
            <p className="flex  items-center gap-2">
              <FaPhone className=" text-rose-700" />
              {user?.data?.phone}
            </p>
            <p className="flex  items-center gap-2">
              <FaAddressBook className=" text-rose-700" /> {user?.data?.address}
            </p>
            <hr />
            <p className=" mt-4 w-96">
              {" "}
              <strong>Bio:</strong> <i>{user?.data?.bio}</i>
            </p>
          </small>

          {/* edit user component */}
          <div className="flex justify-center items-center gap-3 mt-4">
            <EditUserProfile />
            <UpdateProfilePicture />
          </div>
        </div>

        <div className="w-max-[300px]">
          <img
            src={
              user?.data?.photo
                ? user.data.photo // Use the Cloudinary URL directly
                : avatar // Fallback avatar if photo is not available
            }
            alt={`${user?.data?.firstName}'s profile image`} // Make sure this uses the correct path
            className="object-cover object-right-top h-36 w-36 sm:h-48 sm:w-48 rounded-full border-4 border-blue-500"
          />

          {/* CHANGE PASSWORD FORM */}
          <ChangePassword
            endpoint={`${
              isClient ? "clients/changepassword" : "users/changepassword"
            }`}
          />
        </div>
      </div>
    </section>
  );
};

export default Profile;
