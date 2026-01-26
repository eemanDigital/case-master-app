import { useState, useEffect, useRef } from "react";
import {
  Layout,
  Button,
  Drawer,
  Switch,
  Space,
  Badge,
  Avatar,
  Dropdown,
  theme,
  Tooltip,
  Typography,
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
  AppstoreOutlined,
  DashboardOutlined,
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
  const [searchVisible, setSearchVisible] = useState(false);
  const [notifications] = useState(3);

  const fullscreenRef = useRef(null);

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

  // User menu items
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

  // Notification items
  const notificationItems = [
    {
      key: "header",
      label: (
        <div className="px-4 py-2 border-b">
          <div className="flex justify-between items-center">
            <Text strong>Notifications</Text>
            <Badge count={notifications} size="small" />
          </div>
        </div>
      ),
      disabled: true,
    },
    {
      key: "1",
      label: (
        <div className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
            <BellOutlined className="text-blue-600 dark:text-blue-400 text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
              New case assigned
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Jones v. State Corporation
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              2 minutes ago
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <div className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
            <BellOutlined className="text-green-600 dark:text-green-400 text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
              Document review completed
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Contract #C-2024-015
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              1 hour ago
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "view-all",
      label: (
        <div className="p-3 border-t">
          <Button
            type="primary"
            block
            ghost
            onClick={() => navigate("/dashboard/notifications")}
          >
            View All Notifications
          </Button>
        </div>
      ),
    },
  ];

  const {
    token: { colorBgContainer, colorPrimary },
  } = theme.useToken();

  return (
    <Layout
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "dark bg-gray-900" : "bg-gray-50"
      }`}
      style={{
        maxWidth: "100vw",
        overflow: "hidden",
      }}
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div
          className={`fixed left-0 top-0 h-screen z-40 transition-all duration-300 ease-out ${
            collapsed ? "w-20" : "w-64"
          }`}
          style={{
            background: isDarkMode ? "#1a2236" : "#ffffff",
            boxShadow: "0 0 20px rgba(0, 0, 0, 0.08)",
          }}
        >
          <SideBar
            isMobile={isMobile}
            collapsed={collapsed}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {/* Main Layout */}
      <Layout
        className={`transition-all duration-300 ease-out min-h-screen ${
          isMobile ? "ml-0" : collapsed ? "ml-20" : "ml-64"
        }`}
        ref={fullscreenRef}
      >
        {/* Modern Header */}
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            backdropFilter: "blur(8px)",
            backgroundColor: isDarkMode 
              ? "rgba(17, 24, 39, 0.95)" 
              : "rgba(255, 255, 255, 0.95)",
            borderBottom: `1px solid ${
              isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)"
            }`,
            height: 64,
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
          className="flex items-center justify-between"
        >
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Menu Toggle */}
            <Button
              type="text"
              icon={
                isMobile || collapsed ? (
                  <MenuUnfoldOutlined className="text-lg" />
                ) : (
                  <MenuFoldOutlined className="text-lg" />
                )
              }
              onClick={toggleSidebar}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              style={{ color: isDarkMode ? "#d1d5db" : "#4b5563" }}
            />

            {/* Breadcrumb Navigation */}
            <div className="hidden md:block">
              <BreadcrumbNavigation />
            </div>

            {/* Page Title for Mobile */}
            <div className="md:hidden">
              <Text
                strong
                className={`text-base ${
                  isDarkMode ? "text-gray-100" : "text-gray-800"
                }`}
              >
                {getPageTitle(location.pathname)}
              </Text>
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-2xl mx-4 hidden lg:block">
            <div className="relative">
              <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search cases, clients, documents..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ color: isDarkMode ? "#d1d5db" : "#4b5563" }}
              />
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button (Mobile) */}
            <Tooltip title="Search">
              <Button
                type="text"
                icon={<SearchOutlined />}
                onClick={() => setSearchVisible(true)}
                className="hidden md:flex lg:hidden w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              />
            </Tooltip>

            {/* Fullscreen Toggle */}
            <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <Button
                type="text"
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={toggleFullscreen}
                className="w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              />
            </Tooltip>

            {/* Quick Apps */}
            <Tooltip title="Quick Apps">
              <Button
                type="text"
                icon={<AppstoreOutlined />}
                className="w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              />
            </Tooltip>

            {/* Dark Mode Toggle */}
            <Tooltip title={isDarkMode ? "Light Mode" : "Dark Mode"}>
              <Switch
                checked={isDarkMode}
                onChange={toggleTheme}
                checkedChildren={<MoonOutlined className="text-xs" />}
                unCheckedChildren={<SunOutlined className="text-xs" />}
                className={`${
                  isDarkMode ? "bg-gray-700" : "bg-gray-300"
                } hover:opacity-80`}
                style={{ background: isDarkMode ? "#374151" : "#d1d5db" }}
              />
            </Tooltip>

            {/* Notifications */}
            <Dropdown
              menu={{ items: notificationItems }}
              trigger={["click"]}
              placement="bottomRight"
              overlayClassName="w-80 sm:w-96 shadow-xl rounded-lg overflow-hidden"
            >
              <Badge
                count={notifications}
                size="small"
                offset={[-5, 5]}
                className="cursor-pointer"
              >
                <Button
                  type="text"
                  icon={<BellOutlined className="text-lg" />}
                  className="w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative"
                />
              </Badge>
            </Dropdown>

            {/* User Menu */}
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={["click"]}
              placement="bottomRight"
              overlayClassName="w-56 shadow-xl rounded-lg overflow-hidden"
            >
              <div className="flex items-center gap-3 cursor-pointer pl-2">
                <div className="text-right hidden sm:block">
                  <Text
                    strong
                    className={`block text-sm ${
                      isDarkMode ? "text-gray-100" : "text-gray-800"
                    }`}
                  >
                    {userData?.firstName || "User"}
                  </Text>
                  <Text
                    className={`text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {userData?.position || userData?.role || "Staff"}
                  </Text>
                </div>
                <Avatar
                  size={40}
                  src={userData?.photo}
                  icon={<UserOutlined />}
                  className={`border-2 ${
                    isDarkMode
                      ? "border-blue-600 bg-blue-900"
                      : "border-blue-500 bg-blue-100"
                  }`}
                  style={{ color: isDarkMode ? "#93c5fd" : "#1e40af" }}
                >
                  {userData?.firstName?.[0]}
                  {userData?.lastName?.[0]}
                </Avatar>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Main Content Area */}
        <Content
          className={`m-4 sm:m-6 transition-all duration-300 ${
            isDarkMode ? "text-gray-100" : ""
          }`}
          style={{
            minHeight: "calc(100vh - 96px)",
          }}
        >
          {/* Content Container */}
          <div
            className={`rounded-xl shadow-sm border transition-all duration-300 ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
            style={{
              minHeight: "calc(100vh - 120px)",
            }}
          >
            {/* Page Header */}
            <div
              className={`p-6 border-b rounded-t-xl ${
                isDarkMode
                  ? "border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900"
                  : "border-gray-200 bg-gradient-to-r from-white to-gray-50"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <Text
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {getPageTitle(location.pathname)}
                  </Text>
                  <Text
                    className={`text-sm mt-1 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {getPageSubtitle(location.pathname)}
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  {/* Quick Actions can be added here */}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-4 sm:p-6">
              <Outlet />
            </div>
          </div>
        </Content>

        {/* Footer */}
        <footer
          className={`py-3 px-6 text-center border-t ${
            isDarkMode
              ? "border-gray-800 text-gray-500"
              : "border-gray-200 text-gray-600"
          }`}
        >
          <Text className="text-xs">
            © {new Date().getFullYear()} LawFlow • Legal Practice Management System
            • v2.1.0
          </Text>
        </footer>
      </Layout>

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          closable={true}
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          bodyStyle={{
            padding: 0,
            background: isDarkMode ? "#1a2236" : "#ffffff",
          }}
          width={280}
          headerStyle={{ display: "none" }}
          className="drawer-sidebar"
        >
          <SideBar
            isMobile={isMobile}
            closeDrawer={() => setDrawerVisible(false)}
            isDarkMode={isDarkMode}
          />
        </Drawer>
      )}
    </Layout>
  );
};

// Helper function to get page title from route
const getPageTitle = (pathname) => {
  const pathMap = {
    "/dashboard": "Dashboard",
    "/dashboard/matters": "Matters",
    "/dashboard/matters/create": "Create Matter",
    "/dashboard/cases": "Cases",
    "/dashboard/case-reports": "Case Reports",
    "/dashboard/staff": "Staff Management",
    "/dashboard/staff-status": "Staff Status",
    "/dashboard/cause-list": "Cause List",
    "/dashboard/tasks": "Tasks",
    "/dashboard/clients": "Client Management",
    "/dashboard/documents": "Documents",
    "/dashboard/billings": "Billing",
    "/dashboard/contact-dev": "Contact Support",
    "/dashboard/profile": "My Profile",
  };

  for (const [path, title] of Object.entries(pathMap)) {
    if (pathname.startsWith(path)) {
      return title;
    }
  }

  return "Dashboard";
};

// Helper function to get page subtitle
const getPageSubtitle = (pathname) => {
  const subtitleMap = {
    "/dashboard": "Overview of your legal practice",
    "/dashboard/matters": "Manage all legal matters",
    "/dashboard/cases": "Track ongoing cases",
    "/dashboard/case-reports": "Generate and view reports",
    "/dashboard/staff": "Manage team members and roles",
    "/dashboard/tasks": "Track assignments and deadlines",
    "/dashboard/clients": "View and manage client relationships",
    "/dashboard/documents": "Organize and access legal documents",
    "/dashboard/billings": "Manage invoices and payments",
  };

  for (const [path, subtitle] of Object.entries(subtitleMap)) {
    if (pathname.startsWith(path)) {
      return subtitle;
    }
  }

  return "Manage your legal practice efficiently";
};

export default DashboardLayout;