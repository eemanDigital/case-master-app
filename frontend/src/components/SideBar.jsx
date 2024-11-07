import PropTypes from "prop-types";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Menu } from "antd";
import { RxDashboard } from "react-icons/rx";
import { IoBriefcaseSharp, IoHelpCircleOutline } from "react-icons/io5";
import { TbLogout2, TbReport } from "react-icons/tb";
import { FaFile, FaMoneyBill, FaTasks, FaUsers } from "react-icons/fa";
import { AiOutlineSchedule } from "react-icons/ai";
import avatar from "../assets/avatar.png";
import { useRemovePhoto } from "../hooks/useRemovePhoto";
import { useAdminHook } from "../hooks/useAdminHook";
import { logout, RESET } from "../redux/features/auth/authSlice";
import { shortenText } from "../utils/shortenText";
import { FaHandshake } from "react-icons/fa6";

const SideBar = ({ isMobile, closeDrawer }) => {
  const { remove } = useRemovePhoto();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { isClient, isUser } = useAdminHook();
  const [selectedKeys, setSelectedKeys] = useState(["dashboard"]);

  // useEffect(() => {
  //   const pathArray = location.pathname.split("/");
  //   const key = pathArray.length > 1 ? pathArray[1] : "dashboard";
  //   setSelectedKeys([key]);
  // }, [location]);

  const handleLogout = async () => {
    dispatch(RESET());
    await dispatch(logout());
    remove();
    navigate("/users/login");
  };

  const navItems = [
    {
      key: "dashboard",
      icon: <RxDashboard />,
      label: <Link to="/dashboard">Dashboard</Link>,
    },
    {
      key: "cases",
      icon: <IoBriefcaseSharp />,
      label: <Link to="cases">Cases</Link>,
    },
    {
      key: "case-reports",
      icon: <TbReport />,
      label: <Link to="case-reports">Case Reports</Link>,
    },

    {
      key: "staff-management",
      icon: <FaUsers />,
      label: <p>Staff Management</p>,
      children: [
        {
          key: "staff-list",
          label: <Link to="staff">Staff List</Link>,
        },
        {
          key: "leave-application",
          label: <Link to="staff/leave-application">Leave Applications</Link>,
        },
        {
          key: "leave-balance",
          label: <Link to="staff/leave-balance">Leave Balance</Link>,
        },
      ],
    },
    {
      key: "cause-list",
      icon: <AiOutlineSchedule />,
      label: <Link to="cause-list">Cause List</Link>,
    },
    {
      key: "tasks",
      icon: <FaTasks />,
      label: <Link to="tasks">{isClient ? "Message" : "Tasks"}</Link>,
    },
    {
      key: "clients",
      icon: <FaHandshake />,
      label: <Link to="clients">Clients</Link>,
    },

    {
      key: "documents",
      icon: <FaFile />,
      label: <Link to="documents">Documents</Link>,
    },
    {
      key: "billings",
      icon: <FaMoneyBill />,
      label: <Link to="billings">Billings</Link>,
    },
    {
      key: "contact-dev",
      icon: <IoHelpCircleOutline />,
      label: <Link to="contact-dev">Contact</Link>,
    },
    {
      key: "logout",
      icon: <TbLogout2 />,
      label: <Link onClick={handleLogout}>Logout</Link>,
    },
  ];

  // Filter out nav items based on user type
  const filteredNavItems = navItems.filter((item) => {
    if (
      isClient &&
      (item.key === "staff-management" ||
        item.key === "cause-list" ||
        item.key === "billings" ||
        item.key === "documents")
    )
      return false;
    if (isUser && item.key === "billings") return false;
    return true;
  });

  // Handle menu click
  const handleMenuClick = (e) => {
    setSelectedKeys([e.key]);
    if (isMobile && closeDrawer) {
      closeDrawer();
    }
  };

  return (
    <div className="h-full flex flex-col ">
      <div className="logo-vertical py-4 ">
        {!isClient ? (
          <div className="flex justify-center items-center">
            <Link to="profile" onClick={isMobile ? closeDrawer : undefined}>
              <img
                src={user?.data?.photo ? user.data.photo : avatar}
                alt={`${user?.data?.firstName}'s profile image`}
                className="object-cover object-right-top h-14 w-14 rounded-full border-2 border-blue-500"
              />
            </Link>
          </div>
        ) : (
          <Link to="/profile" onClick={isMobile ? closeDrawer : undefined}>
            <h1 className="text-gray-300 hover:text-gray-500 font-bold text-center">
              {shortenText(user?.data?.firstName, 10)}
            </h1>
          </Link>
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={selectedKeys}
        items={filteredNavItems}
        onClick={handleMenuClick}
        className="flex-grow"
      />
    </div>
  );
};

SideBar.propTypes = {
  isMobile: PropTypes.bool.isRequired,
  closeDrawer: PropTypes.func,
};

export default SideBar;
