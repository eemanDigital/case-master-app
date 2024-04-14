import { Link } from "react-router-dom";
import { RiCustomerService2Line } from "react-icons/ri";
import avatar from "../assets/avatar.png";
import { useLogout } from "../hooks/useLogout";
import { RxDashboard } from "react-icons/rx";
import {
  IoBriefcaseSharp,
  IoHelpCircleOutline,
  IoMenuOutline,
} from "react-icons/io5";
import { FaMoneyBill, FaTasks } from "react-icons/fa";
import { FaListUl } from "react-icons/fa6";
import { GrDocument } from "react-icons/gr";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthContext } from "../hooks/useAuthContext";
import { useNavigate } from "react-router-dom";

const navItems = [
  {
    name: "Dashboard",

    icon: <RxDashboard />,
  },
  {
    name: "Cases",
    path: "cases",
    icon: <IoBriefcaseSharp />,
  },
  {
    name: "Tasks",
    path: "tasks",
    icon: <FaTasks />,
  },

  {
    name: "Billings",
    path: "billing",
    icon: <FaMoneyBill />,
  },
  {
    name: "Cause List",
    path: "cause-list",
    icon: <FaListUl />,
  },

  {
    name: "Documents",
    path: "documents",
    icon: <GrDocument />,
  },
  {
    name: "Clients",
    path: "client",
    icon: <RiCustomerService2Line />,
  },
  {
    name: "Help Center",
    path: "help-center",
    icon: <IoHelpCircleOutline />,
  },
];

const SideBar = ({ isOpen, handleOpen }) => {
  const { logout } = useLogout();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  // const { data } = user;
  // console.log("TESTING", user?.data.user.photo);
  // console.log("DATA", data);

  function handleLogout() {
    toast.success("Logout successful", {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      id: "logoutId",
      progress: undefined,
      theme: "light",
      transition: Bounce,
    });
    logout();
    navigate("/");
  }

  // nav item mapping
  let mainNav = navItems.map((item, index) => {
    return (
      <>
        {/* menu items mapping */}
        <li className="my-3 hover:bg-gray-500  rounded-md">
          <Link
            to={item.path}
            className="flex  tracking-wider items-center gap-2 text-gray-200 hover:bg-gray-600 px-4 py-3 rounded-md"
            key={index}>
            <div className="text-2xl hover:text-gray-400  tooltip">
              {item.icon}
              {/* tooltip show */}
              {isOpen && (
                <span className="tooltiptext  shadow-md  ">{item.name}</span>
              )}
            </div>
            {/* sidebar toggle*/}
            <p
              className={`  transition-all  duration-700 ease-out   ${
                isOpen ? "hidden" : "flex"
              }`}>
              {item.name}
            </p>
          </Link>
        </li>
      </>
    );
  });
  return (
    <>
      <aside
        className={` justify-between gap-4 bg-gradient-to-r from-slate-600 to-slate-800 bg-blend-lighten  shadow-inner items-center rounded-md   `}>
        <ul
          className={`md:flex flex-col  gap-4 md:p-5 p-2   ${
            isOpen ? "md:w-auto   " : " w-auto "
          } `}>
          {/* Hamburger icon*/}
          <div
            onClick={handleOpen}
            className=" text-4xl  text-gray-300 flex items-center justify-center cursor-pointer hover:text-gray-500 ">
            {isOpen ? <IoMenuOutline /> : <IoMenuOutline />}
          </div>
          {/* profile */}
          <div className="flex flex-col gap-5 items-start  tooltip">
            <Link to="profile">
              <img
                // use avatar as default image if user does not upload image
                src={
                  user?.data?.user?.photo
                    ? `http://localhost:3000/images/${user?.data?.user?.photo}`
                    : avatar
                }
                alt={`${user?.data?.user}'s profile image`}
                className="w-12 h-12  mt-6  object-cover object-right-top rounded-full"
              />
              <span className="tooltiptext">Profile</span>
            </Link>
            <h3 className={`text-gray-200 ${isOpen ? "hidden" : "flex"} `}>
              {user?.data?.user?.firstName} {user?.data?.user?.lastName}
            </h3>
          </div>
          {mainNav}
          <Link className="text-gray-200" onClick={handleLogout}>
            logout
          </Link>
        </ul>

        <ToastContainer />
      </aside>
    </>
  );
};

export default SideBar;
