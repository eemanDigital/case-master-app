import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Layout, Menu, theme } from "antd";
import { RxDashboard } from "react-icons/rx";
import { IoBriefcaseSharp, IoHelpCircleOutline } from "react-icons/io5";
import { TbLogout2, TbReport } from "react-icons/tb";
import {
  FaFile,
  FaMoneyBill,
  FaTasks,
  FaUsers,
  FaListUl,
} from "react-icons/fa";
import { RiCustomerService2Line } from "react-icons/ri";
import avatar from "../assets/avatar.png";
import { useRemovePhoto } from "../hooks/useRemovePhoto";
import { useAdminHook } from "../hooks/useAdminHook";
import { logout, RESET } from "../redux/features/auth/authSlice";
import { shortenText } from "../utils/shortenText";

const { Sider } = Layout;

const SideBar = ({ collapsed, setCollapsed }) => {
  const { remove } = useRemovePhoto();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { isClient, isUser } = useAdminHook();
  const [selectedKeys, setSelectedKeys] = useState(["dashboard"]);

  // const {
  //   token: { colorBgContainer, borderRadiusLG },
  // } = theme.useToken();

  useEffect(() => {
    const pathArray = location.pathname.split("/");
    const key = pathArray.length > 1 ? pathArray[1] : "dashboard";
    setSelectedKeys([key]);
  }, [location]);

  const handleLogout = async () => {
    dispatch(RESET());
    await dispatch(logout());
    remove();
    navigate("/login");
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
      key: "tasks",
      icon: <FaTasks />,
      label: <Link to="tasks">{isClient ? "Message" : "Tasks"}</Link>,
    },
    {
      key: "billings",
      icon: <FaMoneyBill />,
      label: <Link to="billings">Billings</Link>,
    },
    {
      key: "staff",
      icon: <FaUsers />,
      label: <Link to="staff">Staff</Link>,
      children: [
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
      icon: <FaListUl />,
      label: <Link to="cause-list">Cause List</Link>,
    },
    {
      key: "clients",
      icon: <RiCustomerService2Line />,
      label: <Link to="clients">Clients</Link>,
    },
    {
      key: "documents",
      icon: <FaFile />,
      label: <Link to="documents">Documents</Link>,
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

  const filteredNavItems = navItems.filter((item) => {
    if (isClient && (item.key === "staff" || item.key === "cause-list"))
      return false;
    if (isUser && item.key === "billings") return false;
    return true;
  });

  const handleMenuClick = (e) => {
    setSelectedKeys([e.key]);
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      breakpoint="lg"
      collapsedWidth="80"
      onBreakpoint={(broken) => {
        setCollapsed(broken);
      }}
      className="min-h-screen fixed left-0 top-0 bottom-0"
      style={{
        overflow: "auto",
        height: "100vh",
        position: "fixed",
        left: 0,
        zIndex: 1,
      }}>
      <div className="logo-vertical py-4 px-2">
        {!isClient ? (
          <div className="flex justify-center items-center">
            <Link to="profile">
              <img
                src={user?.data?.photo ? user.data.photo : avatar}
                alt={`${user?.data?.firstName}'s profile image`}
                className="object-cover object-right-top h-14 w-14 rounded-full border-2 border-blue-500"
              />
            </Link>
          </div>
        ) : (
          <Link to="/profile">
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
        // defaultSelectedKeys={["dashboard"]}
      />
    </Sider>
  );
};

// Typechecking for props
SideBar.propTypes = {
  collapsed: PropTypes.bool.isRequired,
  setCollapsed: PropTypes.func.isRequired,
};
export default SideBar;
