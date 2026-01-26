import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Menu,
  Avatar,
  Typography,
  Space,
  Badge,
  Divider,
  Tooltip,
} from "antd";
import {
  DashboardOutlined,
  FileTextOutlined,
  BankOutlined,
  TeamOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  UserOutlined,
  FileOutlined,
  DollarOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
  AppstoreOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { logout, RESET } from "../redux/features/auth/authSlice";
import { useTheme } from "../providers/ThemeProvider";
import { useAdminHook } from "../hooks/useAdminHook";

const { Text } = Typography;

const SideBar = ({
  isMobile,
  closeDrawer,
  collapsed,
  isDarkMode: propDarkMode,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { isDarkMode, toggleTheme } = useTheme();
  const { isAdminOrHr, isSuperOrAdmin, userData } = useAdminHook();

  const [selectedKeys, setSelectedKeys] = useState(["dashboard"]);
  const [openKeys, setOpenKeys] = useState([]);

  // Sync selectedKeys with current URL path
  useEffect(() => {
    const path = location.pathname;

    if (path === "/dashboard" || path === "/") {
      setSelectedKeys(["dashboard"]);
      setOpenKeys([]);
    } else if (path.includes("/dashboard/matters")) {
      setSelectedKeys(["matters"]);
      setOpenKeys([]);
    } else if (path.includes("/dashboard/cases")) {
      setSelectedKeys(["cases"]);
      setOpenKeys([]);
    } else if (path.includes("/dashboard/case-reports")) {
      setSelectedKeys(["reports"]);
      setOpenKeys([]);
    } else if (path.includes("/dashboard/staff")) {
      if (path.includes("/leave")) {
        setSelectedKeys(["leave"]);
        setOpenKeys(["staff"]);
      } else {
        setSelectedKeys(["staff"]);
        setOpenKeys([]);
      }
    } else if (path.includes("/dashboard/cause-list")) {
      setSelectedKeys(["cause-list"]);
      setOpenKeys([]);
    } else if (path.includes("/dashboard/tasks")) {
      setSelectedKeys(["tasks"]);
      setOpenKeys([]);
    } else if (path.includes("/dashboard/clients")) {
      setSelectedKeys(["clients"]);
      setOpenKeys([]);
    } else if (path.includes("/dashboard/documents")) {
      setSelectedKeys(["documents"]);
      setOpenKeys([]);
    } else if (path.includes("/dashboard/billings")) {
      setSelectedKeys(["billings"]);
      setOpenKeys([]);
    } else if (path.includes("/dashboard/contact-dev")) {
      setSelectedKeys(["support"]);
      setOpenKeys([]);
    } else if (path.includes("/dashboard/profile")) {
      setSelectedKeys(["profile"]);
      setOpenKeys([]);
    } else {
      setSelectedKeys(["dashboard"]);
      setOpenKeys([]);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    dispatch(RESET());
    await dispatch(logout());
    navigate("/users/login");
  };

  // Navigation items with improved icons and structure
  const navItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined className="text-lg" />,
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      key: "matters",
      icon: <FileTextOutlined className="text-lg" />,
      label: "Matters",
      path: "/dashboard/matters",
    },
    {
      key: "cases",
      icon: <BankOutlined className="text-lg" />,
      label: "Cases",
      path: "/dashboard/cases",
    },
    {
      key: "reports",
      icon: <FileTextOutlined className="text-lg" />,
      label: "Reports",
      path: "/dashboard/case-reports",
    },
    {
      key: "staff",
      icon: <TeamOutlined className="text-lg" />,
      label: "Staff",
      children: [
        {
          key: "staff-directory",
          label: "Staff Directory",
          path: "/dashboard/staff",
        },
        {
          key: "staff-status",
          label: "Staff Status",
          path: "/dashboard/staff-status",
        },
        {
          key: "leave",
          label: "Leave Management",
          children: [
            {
              key: "leave-applications",
              label: "Applications",
              path: "/dashboard/staff/leave-application",
            },
            {
              key: "leave-balance",
              label: "Leave Balance",
              path: "/dashboard/staff/leave-balance",
            },
          ],
        },
      ],
    },
    {
      key: "cause-list",
      icon: <CalendarOutlined className="text-lg" />,
      label: "Cause List",
      path: "/dashboard/cause-list",
    },
    {
      key: "tasks",
      icon: <CheckSquareOutlined className="text-lg" />,
      label: "Tasks",
      path: "/dashboard/tasks",
    },
    {
      key: "clients",
      icon: <UserOutlined className="text-lg" />,
      label: "Clients",
      path: "/dashboard/clients",
    },
    {
      key: "documents",
      icon: <FileOutlined className="text-lg" />,
      label: "Documents",
      path: "/dashboard/documents",
    },
    {
      key: "billings",
      icon: <DollarOutlined className="text-lg" />,
      label: "Billing",
      path: "/dashboard/billings",
    },
    {
      key: "support",
      icon: <QuestionCircleOutlined className="text-lg" />,
      label: "Support",
      path: "/dashboard/contact-dev",
    },
  ];

  const formatMenuItems = (items) => {
    return items.map((item) => {
      if (item.children) {
        return {
          key: item.key,
          icon: item.icon,
          label: item.label,
          children: formatMenuItems(item.children),
        };
      }

      return {
        key: item.key,
        icon: item.icon,
        label: collapsed && !isMobile ? (
          <Tooltip title={item.label} placement="right">
            <Link to={item.path} onClick={closeDrawer}>
              {item.label}
            </Link>
          </Tooltip>
        ) : (
          <Link to={item.path} onClick={isMobile && closeDrawer ? closeDrawer : undefined}>
            {item.label}
          </Link>
        ),
      };
    });
  };

  const handleMenuClick = (e) => {
    if (isMobile && closeDrawer) {
      closeDrawer();
    }
  };

  const handleOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  // User info section
  const renderUserInfo = () => (
    <div
      className={`p-4 border-b transition-colors duration-300 ${
        isDarkMode ? "border-gray-700" : "border-gray-200"
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar
            size={collapsed ? 40 : 64}
            src={userData?.photo}
            icon={<UserOutlined />}
            className={`border-2 shadow-lg ${
              isDarkMode ? "border-blue-500" : "border-blue-400"
            }`}
          />
          {userData?.isActive && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>

        {!collapsed && (
          <>
            <div className="text-center">
              <Text
                strong
                className={`block text-sm ${
                  isDarkMode ? "text-gray-100" : "text-gray-800"
                }`}
              >
                {userData?.firstName} {userData?.lastName}
              </Text>
              <Text
                type="secondary"
                className={`text-xs ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {userData?.position || userData?.role}
              </Text>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-3 w-full">
              <div className="text-center">
                <Badge count={3} size="small" offset={[-5, 0]}>
                  <Avatar
                    size="small"
                    icon={<BellOutlined />}
                    className={`cursor-pointer ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                    onClick={() => navigate("/dashboard/notifications")}
                  />
                </Badge>
              </div>
              <div className="text-center">
                <Avatar
                  size="small"
                  icon={<SettingOutlined />}
                  className={`cursor-pointer ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                  onClick={() => {
                    navigate("/dashboard/settings");
                    if (isMobile && closeDrawer) closeDrawer();
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // App Logo Section
  const renderLogo = () => (
    <div
      className={`p-4 border-b transition-colors duration-300 ${
        isDarkMode ? "border-gray-700" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${
            isDarkMode ? "bg-blue-600" : "bg-blue-500"
          }`}
        >
          <HomeOutlined className="text-white" />
        </div>

        {!collapsed && (
          <div>
            <Text strong className="text-white text-base font-bold">
              LawFlow
            </Text>
            <Text type="secondary" className="text-gray-400 text-xs block">
              Legal Suite
            </Text>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`h-full flex flex-col transition-colors duration-300 ${
        isDarkMode ? "bg-gray-900" : "bg-gray-800"
      }`}
      style={{
        background: isDarkMode
          ? "linear-gradient(180deg, #1a2236 0%, #111827 100%)"
          : "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
      }}
    >
      {/* Logo */}
      {renderLogo()}

      {/* User Info */}
      {renderUserInfo()}

      {/* Navigation Menu */}
      <div className="flex-grow overflow-auto py-4">
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          items={formatMenuItems(navItems)}
          onClick={handleMenuClick}
          onOpenChange={handleOpenChange}
          className="border-0 px-2"
          inlineCollapsed={collapsed}
          style={{
            backgroundColor: "transparent",
            borderRight: "none",
          }}
        />
      </div>

      {/* Logout Section */}
      <div
        className={`p-4 border-t transition-colors duration-300 ${
          isDarkMode ? "border-gray-700" : "border-gray-700"
        }`}
      >
        <Menu
          theme="dark"
          mode="inline"
          className="border-0"
          style={{ backgroundColor: "transparent" }}
        >
          <Menu.Item
            key="logout"
            icon={<LogoutOutlined className="text-lg" />}
            danger
            onClick={handleLogout}
            className={collapsed ? "text-center" : ""}
          >
            {!collapsed && "Logout"}
          </Menu.Item>
        </Menu>

        {/* App Info */}
        {!collapsed && (
          <div className="mt-4 text-center">
            <Text
              type="secondary"
              className="text-gray-400 text-xs block"
            >
              v2.1.0 • Professional
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

SideBar.propTypes = {
  isMobile: PropTypes.bool.isRequired,
  closeDrawer: PropTypes.func,
  collapsed: PropTypes.bool,
  isDarkMode: PropTypes.bool,
};

export default SideBar;