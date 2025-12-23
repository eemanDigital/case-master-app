import { useSelector } from "react-redux";
import {
  FaAddressBook,
  FaPhone,
  FaUniversity,
  FaGavel,
  FaBriefcase,
} from "react-icons/fa";
import { MdMail, MdSchool } from "react-icons/md";
import avatar from "../assets/avatar.png";
import { formatYear } from "../utils/formatDate";
import ProfilePictureUpload from "../components/ProfilePictureUpload";
import EditUserProfile from "./EditUserProfile";
import ChangePassword from "./ChangePassword";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";
import LeaveSummaryCard from "../components/LeaveSummaryCard";

const Profile = () => {
  useRedirectLogoutUser("/users/login");

  const { user, isError, isLoading, message } = useSelector(
    (state) => state.auth
  );
  const isClient = user?.data?.role === "client";
  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return <PageErrorAlert errorCondition={isError} errorMessage={message} />;

  const position =
    user?.data?.position === "Other"
      ? user?.data?.otherPosition
      : user?.data?.position;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-100 py-12 px-4 sm:px-6 lg:px-8 ">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden">
          <div className="md:flex">
            {/* Left column - Profile Image and Actions */}
            <div className="md:w-1/3 bg-gradient  p-8 text-white">
              <div className="text-center">
                <img
                  src={user?.data?.photo || avatar}
                  alt={`${user?.data?.firstName}'s profile`}
                  className="w-48 h-48 rounded-full mx-auto border-4 border-white shadow-lg"
                />
                <h1 className="mt-4 text-3xl font-bold">
                  {user?.data?.firstName} {user?.data?.lastName}
                </h1>
                <p className="mt-2 text-xl">{position}</p>
              </div>
              <div className="mt-8 space-y-4">
                <EditUserProfile />
                <ProfilePictureUpload />
              </div>
            </div>

            {/* Right column - User Details */}
            <div className="md:w-2/3 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard
                  icon={<FaBriefcase />}
                  title="Practice Area"
                  content={user?.data?.practiceArea}
                />
                <InfoCard
                  icon={<FaGavel />}
                  title="Year of Call"
                  content={formatYear(user?.data?.yearOfCall)}
                />
                <InfoCard
                  icon={<FaUniversity />}
                  title="University"
                  content={user?.data?.universityAttended}
                />
                <InfoCard
                  icon={<MdSchool />}
                  title="Law School"
                  content={user?.data?.lawSchoolAttended}
                />
                <InfoCard
                  icon={<MdMail />}
                  title="Email"
                  content={user?.data?.email}
                />
                <InfoCard
                  icon={<FaPhone />}
                  title="Phone"
                  content={user?.data?.phone}
                />
                <InfoCard
                  icon={<FaAddressBook />}
                  title="Address"
                  content={user?.data?.address}
                  className="md:col-span-2"
                />
              </div>
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">Bio</h2>
                <p className="text-gray-700 italic">{user?.data?.bio}</p>
              </div>
              <div className="mt-8">
                <ChangePassword />
              </div>
            </div>
          </div>
        </div>

        {!isClient && <LeaveSummaryCard id={user?.data?._id} />}
      </div>
    </div>
  );
};

const InfoCard = ({ icon, title, content, className = "" }) => (
  <div className={`bg-white rounded-lg shadow p-4 ${className} `}>
    <div className="flex items-center text-blue-600 mb-2">
      {icon}
      <h3 className="ml-2 font-semibold">{title}</h3>
    </div>
    <p className="text-gray-700">{content}</p>
  </div>
);

export default Profile;
