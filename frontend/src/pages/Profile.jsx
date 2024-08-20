import avatar from "../assets/avatar.png";
import { formatYear } from "../utils/formatDate";
import { FaAddressBook, FaPhone } from "react-icons/fa";
import { MdMail } from "react-icons/md";
import "react-toastify/dist/ReactToastify.css";
import ProfilePictureUpload from "../components/ProfilePictureUpload";
import EditUserProfile from "./EditUserProfile";
import ChangePassword from "./ChangePassword";
import { useSelector } from "react-redux";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";

const Profile = () => {
  useRedirectLogoutUser("/login"); // redirect to login if not logged in
  const { user, isError, isLoading, message } = useSelector(
    (state) => state.auth
  );

  // Handle position field
  if (user?.data?.position === "Other") {
    user.data.position = null;
  }

  if (isLoading) return <LoadingSpinner />; //loading state
  if (isError)
    //error state
    return <PageErrorAlert errorCondition={isError} errorMessage={message} />;

  return (
    <section className="flex flex-col justify-center items-center ">
      <div className="flex flex-col md:flex-row md:gap-12 bg-white shadow-md rounded-lg p-6 md:p-10 w-full max-w-5xl">
        {/* CHANGE PASSWORD FORM */}
        <ChangePassword endpoint="/changepassword" />
        {/* Profile Image */}
        <div className="flex flex-col items-center mb-8 md:mb-0">
          <img
            src={user?.data?.photo ? user.data.photo : avatar}
            alt={`${user?.data?.firstName}'s profile image`}
            className="object-cover object-right-top h-36 w-36 sm:h-48 sm:w-48 rounded-full border-4 border-blue-500"
          />
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <EditUserProfile />
            <ProfilePictureUpload />
          </div>
        </div>

        {/* Profile Details */}
        <div className="flex-1">
          <h1 className="xl:text-2xl sm:text-1xl font-bold text-rose-700 text-center md:text-left">
            {user?.data?.firstName} {user?.data?.lastName}{" "}
            {user?.data?.middleName}
          </h1>
          <hr className="my-4" />
          <div className="space-y-2 text-center md:text-left">
            <small className="block text-gray-600">
              {user?.data?.position ?? user?.data?.otherPosition}
            </small>
            <small className="block">
              <strong>Practice Area:</strong> {user?.data?.practiceArea}
            </small>
            <small className="block">
              <strong>Year of Call:</strong>{" "}
              {formatYear(user?.data?.yearOfCall)}
            </small>
            <small className="block">
              <strong>University Attended:</strong>{" "}
              {user?.data?.universityAttended}
            </small>
            <small className="block">
              <strong>Law School Attended:</strong>{" "}
              {user?.data?.lawSchoolAttended}
            </small>
          </div>
          <hr className="my-4" />

          {/* Contact Details */}
          <div className="space-y-2">
            <small className="flex items-center gap-2">
              <MdMail className="text-rose-700" /> {user?.data?.email}
            </small>
            <small className="flex items-center gap-2">
              <FaPhone className="text-rose-700" /> {user?.data?.phone}
            </small>
            <small className="flex items-center gap-2">
              <FaAddressBook className="text-rose-700" /> {user?.data?.address}
            </small>
            <hr />
            <small className="mt-4">
              <strong>Bio:</strong> <i>{user?.data?.bio}</i>
            </small>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;
