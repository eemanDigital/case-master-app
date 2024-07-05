import { Link } from "react-router-dom";
import { RiCustomerService2Line } from "react-icons/ri";
import { Button, Layout, Menu, theme } from "antd";
import avatar from "../assets/avatar.png";
import { useLogout } from "../hooks/useLogout";
import { useRemovePhoto } from "../hooks/useRemovePhoto";
import femaleAvatar from "../assets/female-avatar.png";
import { RxDashboard } from "react-icons/rx";
import { IoBriefcaseSharp, IoHelpCircleOutline } from "react-icons/io5";
import { TbLogout2 } from "react-icons/tb";
import { TbReport } from "react-icons/tb";
import { FaMoneyBill, FaTasks } from "react-icons/fa";
import { FaUsers, FaListUl } from "react-icons/fa6";
import { ToastContainer, toast, Bounce } from "react-toastify";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import "react-toastify/dist/ReactToastify.css";
import { useAuthContext } from "../hooks/useAuthContext";
import { useNavigate } from "react-router-dom";

import { useState } from "react";

const SideBar = ({ isOpen, handleOpen }) => {
  const { logout } = useLogout();
  const { remove } = useRemovePhoto();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { Header, Sider, Content } = Layout;
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

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
    remove();
    navigate("/");
  }

  const navItems = [
    {
      key: "1",
      icon: <RxDashboard />,
      label: <Link to="/dashboard">Dashboard</Link>,
    },
    {
      key: "2",
      icon: <IoBriefcaseSharp />,
      label: <Link to="cases">Cases</Link>,
    },
    {
      key: "3",
      icon: <TbReport />,
      label: <Link to="case-reports">Case Reports</Link>,
    },
    {
      key: "4",
      icon: <FaTasks />,
      label: <Link to="tasks">Tasks</Link>,
    },
    {
      key: "5",
      icon: <FaMoneyBill />,
      label: <Link to="billings">Billings</Link>,
    },
    {
      key: "6",
      icon: <FaUsers />,
      label: <Link to="staff">Staff</Link>,
    },
    {
      key: "7",
      icon: <FaListUl />,
      label: <Link to="cause-list">Cause List</Link>,
    },
    {
      key: "8",
      icon: <RiCustomerService2Line />,
      label: <Link to="clients">Clients</Link>,
    },
    {
      key: "9",
      icon: <IoHelpCircleOutline />,
      label: <Link to="help-center">Help Center</Link>,
    },
    {
      key: "10",
      icon: <TbLogout2 />,
      label: (
        <Link className="text-gray-200" onClick={handleLogout}>
          logout
        </Link>
      ),
    },
  ];

  return (
    <>
      <Layout>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          className="fixed h-full"
          style={{ overflow: "auto", height: "100vh" }}>
          {/* user's profile */}
          <div className="mt-4 p-4 flex justify-center items-center  tooltip">
            <Link to="profile">
              <img
                src={
                  user?.data?.user?.photo
                    ? `http://localhost:3000/images/users/${user?.data?.user?.photo}`
                    : user?.data?.user?.gender === "male"
                    ? avatar
                    : femaleAvatar
                }
                alt={`${user?.data?.user?.firstName}'s profile image`}
                className="w-12 h-12 object-cover object-right-top rounded-full"
              />
            </Link>
          </div>

          <Menu theme="dark" mode="inline" defaultSelectedKeys={["1"]}>
            {navItems.map((item) => (
              <Menu.Item key={item.key} icon={item.icon}>
                {item.label}
              </Menu.Item>
            ))}
          </Menu>
        </Sider>

        <Layout>
          <Header
            style={{
              padding: 0,
              background: colorBgContainer,
            }}>
            <Button
              type="text"
              icon={collapsed ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: "16px",
                width: 74,
                height: 74,
              }}
            />
          </Header>
          {/* <Content
            style={{
              margin: "24px 16px",
              padding: 24,
              minHeight: 280,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}>
            Content
          </Content> */}
        </Layout>
        <ToastContainer />
      </Layout>
    </>
  );
};

export default SideBar;
