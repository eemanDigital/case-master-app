import { Link } from "react-router-dom";
import { RiCustomerService2Line } from "react-icons/ri";
import { Button, Layout, Menu, theme } from "antd";
import avatar from "../assets/avatar.png";
import { useRemovePhoto } from "../hooks/useRemovePhoto";
import { RxDashboard } from "react-icons/rx";
import { IoBriefcaseSharp, IoHelpCircleOutline } from "react-icons/io5";
import { TbLogout2 } from "react-icons/tb";
import { TbReport } from "react-icons/tb";
import { FaMoneyBill, FaTasks } from "react-icons/fa";
import { FaUsers, FaListUl } from "react-icons/fa6";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useAdminHook } from "../hooks/useAdminHook";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, RESET } from "../redux/features/auth/authSlice";
import { shortenText } from "../utils/shortenText";

const { Header, Sider, Content } = Layout;
const { SubMenu } = Menu;

const SideBar = () => {
  const { remove } = useRemovePhoto();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isError, isSuccess, isLoading, message, isLoggedIn, user } =
    useSelector((state) => state.auth);
  const { isClient, isUser } = useAdminHook();
  const [collapsed, setCollapsed] = useState(false);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  async function handleLogout() {
    // reset all state
    dispatch(RESET());
    await dispatch(logout());
    remove();
    navigate("/login");
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
      label: <Link to="tasks">{isClient ? "Message" : "Tasks"}</Link>,
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

      children: [
        {
          key: "6-1",
          label: <Link to="staff/leave-application">Leave Application</Link>,
        },
        // {
        //   key: "6-2",
        //   label: <Link to="staff/leave-balance">Leave Balance</Link>,
        // },
      ],
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
          Logout
        </Link>
      ),
    },
  ];

  {
    /* // Filter navItems based on the user's role */
  }

  const filteredNavItems = navItems.filter((item) => {
    if (isClient && (item.key === "6" || item.key === "7")) {
      return false; // Filter out keys for clients
    }
    if (isUser && item.key === "5") {
      return false; // Filter out billing for ordinary users
    }
    return true;
  });

  // function to shorten text

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
          {!isClient ? (
            <div className="mt-4 p-4 flex justify-center items-center tooltip">
              <Link to="profile">
                <img
                  src={user?.data?.photo ? user.data.photo : avatar}
                  alt={`${user?.data?.firstName}'s profile image`}
                  className="object-cover object-right-top h-14 w-14 rounded-full border-2 border-blue-500"
                />
              </Link>
            </div>
          ) : (
            <Link to="profile">
              <h1 className="py-6 text-gray-300 hover:text-gray-500 font-bold text-center">
                {shortenText(user?.data?.firstName, 10)}
              </h1>
            </Link>
          )}
          <Menu theme="dark" mode="inline" defaultSelectedKeys={["1"]}>
            {filteredNavItems.map((item) =>
              item.children ? (
                <SubMenu key={item.key} icon={item.icon} title={item.label}>
                  {item.children.map((child) => (
                    <Menu.Item key={child.key}>{child.label}</Menu.Item>
                  ))}
                </SubMenu>
              ) : (
                <Menu.Item key={item.key} icon={item.icon}>
                  {item.label}
                </Menu.Item>
              )
            )}
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
            }}
          >
            Content
          </Content> */}
        </Layout>
      </Layout>
    </>
  );
};

export default SideBar;
