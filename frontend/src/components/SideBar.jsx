import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Menu } from "antd";
import { RxDashboard } from "react-icons/rx";
import { IoBriefcaseSharp, IoHelpCircleOutline } from "react-icons/io5";
import { TbLogout2, TbReport } from "react-icons/tb";
import { FaFile, FaMoneyBill, FaTasks, FaUsers } from "react-icons/fa";
import { AiOutlineSchedule } from "react-icons/ai";
import { FaHandshake } from "react-icons/fa6";
import avatar from "../assets/avatar.png";
import { useRemovePhoto } from "../hooks/useRemovePhoto";

import { logout, RESET } from "../redux/features/auth/authSlice";
import { shortenText } from "../utils/shortenText";

const SideBar = ({ isMobile, closeDrawer }) => {
  const { remove } = useRemovePhoto();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Get current location
  const { user } = useSelector((state) => state.auth);

  const isClient = user?.data?.role === "client";
  const isUser = user?.data?.role === "user";
  const [selectedKeys, setSelectedKeys] = useState(["dashboard"]);
  const [openKeys, setOpenKeys] = useState([]); // ✅ For submenu state

  // ✅ CRITICAL: Sync selectedKeys with current URL path
  useEffect(() => {
    const path = location.pathname;

    // Dashboard
    if (path === "/dashboard" || path === "/") {
      setSelectedKeys(["dashboard"]);
      setOpenKeys([]);
    }
    // Cases (including detail pages like /cases/:id/details)
    else if (path.includes("/dashboard/cases")) {
      setSelectedKeys(["cases"]);
      setOpenKeys([]);
    }
    // Case Reports
    else if (path.includes("/dashboard/case-reports")) {
      setSelectedKeys(["case-reports"]);
      setOpenKeys([]);
    }
    // Staff Management submenu items
    else if (path.includes("/dashboard/staff/leave-application")) {
      setSelectedKeys(["leave-application"]);
      setOpenKeys(["staff-management"]); // ✅ Keep parent open
    } else if (path.includes("/dashboard/staff/leave-balance")) {
      setSelectedKeys(["leave-balance"]);
      setOpenKeys(["staff-management"]);
    } else if (path.includes("/dashboard/staff")) {
      setSelectedKeys(["staff-list"]);
      setOpenKeys(["staff-management"]);
    }
    // Cause List
    else if (path.includes("/dashboard/cause-list")) {
      setSelectedKeys(["cause-list"]);
      setOpenKeys([]);
    }
    // Tasks
    else if (path.includes("/dashboard/tasks")) {
      setSelectedKeys(["tasks"]);
      setOpenKeys([]);
    }
    // Clients
    else if (path.includes("/dashboard/clients")) {
      setSelectedKeys(["clients"]);
      setOpenKeys([]);
    }
    // Documents
    else if (path.includes("/dashboard/documents")) {
      setSelectedKeys(["documents"]);
      setOpenKeys([]);
    }
    // Billings
    else if (path.includes("/dashboard/billings")) {
      setSelectedKeys(["billings"]);
      setOpenKeys([]);
    }
    // Contact
    else if (path.includes("/dashboard/contact-dev")) {
      setSelectedKeys(["contact-dev"]);
      setOpenKeys([]);
    }
    // Profile or other pages
    else if (path.includes("/dashboard/profile")) {
      setSelectedKeys([]); // Don't highlight anything
      setOpenKeys([]);
    }
    // Default
    else {
      setSelectedKeys(["dashboard"]);
      setOpenKeys([]);
    }
  }, [location.pathname]); // ✅ Re-run whenever URL changes

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
      label: "Staff Management", // ✅ Fixed: Not a link, just label
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
      label: (
        <span onClick={handleLogout} className="cursor-pointer">
          Logout
        </span>
      ), // ✅ Fixed: Use span instead of Link for onClick
    },
  ];

  // Filter out nav items based on user type
  const filteredNavItems = navItems.filter((item) => {
    if (
      isClient &&
      (item.key === "staff-management" ||
        item.key === "cause-list" ||
        item.key === "documents")
    )
      return false;
    if (isUser && item.key === "billings") return false;
    return true;
  });

  // Handle menu click
  const handleMenuClick = (e) => {
    // Don't manually set selectedKeys here
    // Let the useEffect handle it based on URL
    if (isMobile && closeDrawer) {
      closeDrawer();
    }
  };

  // ✅ Handle submenu open/close
  const handleOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="logo-vertical py-4">
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
          <Link to="profile" onClick={isMobile ? closeDrawer : undefined}>
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
        openKeys={openKeys} // ✅ Control which submenus are open
        items={filteredNavItems}
        onClick={handleMenuClick}
        onOpenChange={handleOpenChange} // ✅ Handle submenu state
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
