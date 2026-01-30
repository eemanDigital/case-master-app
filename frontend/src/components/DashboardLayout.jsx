import { useState, useEffect } from "react";
import {
  Layout,
  Button,
  Drawer,
  Switch,
  Badge,
  Avatar,
  Dropdown,
  theme,
  Tooltip,
  Typography,
  Input,
} from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SunOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  SearchOutlined,
  QuestionCircleOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from "@ant-design/icons";
import SideBar from "./SideBar.jsx";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser.jsx";
import { useTheme } from "../providers/ThemeProvider";
import { useAdminHook } from "../hooks/useAdminHook";
import BreadcrumbNavigation from "../components/navigation/BreadcrumbNavigation";

const { Header, Content } = Layout;
const { Text } = Typography;
const { Search } = Input;

const DashboardLayout = () => {
  useRedirectLogoutUser("/users/login");
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { userData } = useAdminHook();

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notifications] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      setIsMobile(newIsMobile);
      if (!newIsMobile) {
        setDrawerVisible(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setDrawerVisible(false);
    }
  }, [location, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setDrawerVisible(!drawerVisible);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "My Profile",
      onClick: () => navigate("/dashboard/profile"),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: () => navigate("/dashboard/settings"),
    },
    {
      key: "help",
      icon: <QuestionCircleOutlined />,
      label: "Help & Support",
      onClick: () => navigate("/dashboard/help"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      danger: true,
      onClick: () => {
        localStorage.removeItem("token");
        navigate("/users/login");
      },
    },
  ];

  const notificationItems = [
    {
      key: "header",
      label: (
        <div className="px-3 py-2 border-b dark:border-gray-700">
          <div className="flex justify-between items-center">
            <Text strong className="text-sm">
              Notifications
            </Text>
            <Badge count={notifications} size="small" />
          </div>
        </div>
      ),
      disabled: true,
    },
    {
      key: "1",
      label: (
        <div className="flex items-start gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
            <BellOutlined className="text-blue-600 dark:text-blue-400 text-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs text-gray-900 dark:text-gray-100">
              New case assigned
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Jones v. State Corp
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              2 min ago
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <div className="flex items-start gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
            <BellOutlined className="text-green-600 dark:text-green-400 text-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs text-gray-900 dark:text-gray-100">
              Document reviewed
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Contract #C-2024-015
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              1 hour ago
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "view-all",
      label: (
        <div className="px-3 py-2 border-t dark:border-gray-700">
          <Button
            type="link"
            block
            size="small"
            onClick={() => navigate("/dashboard/notifications")}
            className="text-xs">
            View All Notifications
          </Button>
        </div>
      ),
    },
  ];

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const sidebarWidth = collapsed ? 80 : 256;

  return (
    <Layout
      className={`min-h-screen ${isDarkMode ? "dark bg-gray-950" : "bg-gray-50"}`}
      style={{ maxWidth: "100vw", overflow: "hidden" }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div
          className="fixed left-0 top-0 h-screen z-50 transition-all duration-300 ease-in-out"
          style={{ width: sidebarWidth }}>
          <SideBar isMobile={false} collapsed={collapsed} />
        </div>
      )}

      {/* Main Layout */}
      <Layout
        className="transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isMobile ? 0 : sidebarWidth,
          minHeight: "100vh",
        }}>
        {/* Fixed Header */}
        <Header
          className={`fixed top-0 right-0 z-40 border-b transition-all duration-300 ${
            isDarkMode
              ? "bg-gray-900/95 border-gray-800"
              : "bg-white/95 border-gray-200"
          }`}
          style={{
            left: isMobile ? 0 : sidebarWidth,
            padding: "0 24px",
            height: 64,
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          {/* Left Section */}
          <div className="flex items-center gap-4 flex-1">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleSidebar}
              className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
              }`}
            />

            <div className="hidden md:block">
              <BreadcrumbNavigation />
            </div>
          </div>

          {/* Center Search */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-4">
            <Search
              placeholder="Search cases, clients, documents..."
              allowClear
              size="middle"
              className="w-full"
              prefix={<SearchOutlined className="text-gray-400" />}
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Tooltip title="Search">
              <Button
                type="text"
                icon={<SearchOutlined />}
                className="lg:hidden w-10 h-10 rounded-lg"
              />
            </Tooltip>

            <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <Button
                type="text"
                icon={
                  isFullscreen ? (
                    <FullscreenExitOutlined />
                  ) : (
                    <FullscreenOutlined />
                  )
                }
                onClick={toggleFullscreen}
                className="hidden md:flex w-10 h-10 rounded-lg"
              />
            </Tooltip>

            <Tooltip title={isDarkMode ? "Light Mode" : "Dark Mode"}>
              <Switch
                checked={isDarkMode}
                onChange={toggleTheme}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
                className="ml-1"
              />
            </Tooltip>

            <Dropdown
              menu={{ items: notificationItems }}
              trigger={["click"]}
              placement="bottomRight"
              overlayStyle={{ width: 320 }}>
              <Badge count={notifications} size="small" offset={[-5, 5]}>
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  className="w-10 h-10 rounded-lg"
                />
              </Badge>
            </Dropdown>

            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={["click"]}
              placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer pl-2">
                <div className="hidden sm:block text-right">
                  <Text
                    strong
                    className={`block text-sm leading-tight ${
                      isDarkMode ? "text-gray-100" : "text-gray-800"
                    }`}>
                    {userData?.firstName || "User"}
                  </Text>
                  <Text
                    className={`block text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                    {userData?.position || userData?.role || "Staff"}
                  </Text>
                </div>
                <Avatar
                  size={40}
                  src={userData?.photo}
                  icon={<UserOutlined />}
                  className={`border-2 ${
                    isDarkMode ? "border-blue-600" : "border-blue-500"
                  }`}
                />
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Main Content */}
        <Content
          className="px-4 sm:px-6"
          style={{
            marginTop: 64,
            minHeight: "calc(100vh - 64px)",
            paddingTop: 24,
            paddingBottom: 24,
          }}>
          <Outlet />
        </Content>
      </Layout>

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          closable={false}
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={256}
          styles={{
            body: { padding: 0 },
          }}
          className={isDarkMode ? "dark" : ""}>
          <SideBar
            isMobile={true}
            closeDrawer={() => setDrawerVisible(false)}
            collapsed={false}
          />
        </Drawer>
      )}
    </Layout>
  );
};

export default DashboardLayout;
