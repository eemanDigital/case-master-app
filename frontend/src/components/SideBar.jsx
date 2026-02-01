import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Menu, Typography } from "antd";
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
  HomeOutlined,
  AuditOutlined,
  SolutionOutlined,
  GlobalOutlined,
  ReconciliationOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import { logout, RESET } from "../redux/features/auth/authSlice";
import { useTheme } from "../providers/ThemeProvider";
// import { useAdminHook } from "../hooks/useAdminHook";

const { Text } = Typography;

const SideBar = ({ isMobile, closeDrawer, collapsed }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  // const { user } = useSelector((state) => state.auth);
  const { isDarkMode } = useTheme();
  // const { isAdminOrHr, isSuperOrAdmin, userData } = useAdminHook();

  const [selectedKeys, setSelectedKeys] = useState(["dashboard"]);
  const [openKeys, setOpenKeys] = useState([]);

  useEffect(() => {
    const path = location.pathname;

    // Staff-related paths - check most specific first
    if (path.includes("/dashboard/staff/leave-application")) {
      setSelectedKeys(["leave-applications"]);
      setOpenKeys(["staff", "leave"]);
    } else if (path.includes("/dashboard/staff/leave-balance")) {
      setSelectedKeys(["leave-balance"]);
      setOpenKeys(["staff", "leave"]);
    } else if (path.includes("/dashboard/staff-status")) {
      setSelectedKeys(["staff-status"]);
      setOpenKeys(["staff"]);
    } else if (path.includes("/dashboard/staff")) {
      setSelectedKeys(["staff-directory"]);
      setOpenKeys(["staff"]);
    }
    // Matter-related paths - check specific practice areas first
    else if (path.includes("/dashboard/matters/litigation")) {
      setSelectedKeys(["litigation"]);
      setOpenKeys(["matters"]);
    } else if (path.includes("/dashboard/matters/corporate")) {
      setSelectedKeys(["corporate"]);
      setOpenKeys(["matters"]);
    } else if (path.includes("/dashboard/matters/retainership")) {
      setSelectedKeys(["retainership"]);
      setOpenKeys(["matters"]);
    } else if (path.includes("/dashboard/matters/property")) {
      setSelectedKeys(["property"]);
      setOpenKeys(["matters"]);
    } else if (path.includes("/dashboard/matters/advisory")) {
      setSelectedKeys(["advisory"]);
      setOpenKeys(["matters"]);
    } else if (path.includes("/dashboard/matters/general")) {
      setSelectedKeys(["general"]);
      setOpenKeys(["matters"]);
    } else if (path.includes("/dashboard/matters")) {
      setSelectedKeys(["all-matters"]);
      setOpenKeys(["matters"]);
    }
    // Other paths
    else if (path.includes("/dashboard/case-reports")) {
      setSelectedKeys(["reports"]);
      setOpenKeys([]);
    } else if (path.includes("/dashboard/cases")) {
      setSelectedKeys(["cases"]);
      setOpenKeys([]);
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
    } else if (path === "/dashboard" || path === "/") {
      setSelectedKeys(["dashboard"]);
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

  const navItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      key: "matters",
      icon: <FileTextOutlined />,
      label: "Matters",
      children: [
        {
          key: "all-matters",
          icon: <ReconciliationOutlined />,
          label: "All Matters",
          path: "/dashboard/matters",
        },
        {
          key: "litigation",
          icon: <AuditOutlined />,
          label: "Litigation",
          path: "/dashboard/matters/litigation",
        },
        {
          key: "corporate",
          icon: <BankOutlined />,
          label: "Corporate Practice",
          path: "/dashboard/matters/corporate",
        },
        {
          key: "retainership",
          icon: <SolutionOutlined />,
          label: "Retainership",
          path: "/dashboard/matters/retainership",
        },
        {
          key: "property",
          icon: <GlobalOutlined />,
          label: "Property Practice",
          path: "/dashboard/matters/property",
        },
        {
          key: "advisory",
          icon: <ProfileOutlined />,
          label: "Advisory",
          path: "/dashboard/matters/advisory",
        },
        {
          key: "general",
          icon: <FileTextOutlined />,
          label: "General Practice",
          path: "/dashboard/matters/general",
        },
      ],
    },
    {
      key: "cases",
      icon: <BankOutlined />,
      label: "Cases",
      path: "/dashboard/cases",
    },
    {
      key: "reports",
      icon: <FileTextOutlined />,
      label: "Reports",
      path: "/dashboard/case-reports",
    },
    {
      key: "staff",
      icon: <TeamOutlined />,
      label: "Staff",
      children: [
        {
          key: "staff-directory",
          label: "Directory",
          path: "/dashboard/staff",
        },
        {
          key: "staff-status",
          label: "Status",
          path: "/dashboard/staff-status",
        },
        {
          key: "leave",
          label: "Leave",
          children: [
            {
              key: "leave-applications",
              label: "Applications",
              path: "/dashboard/staff/leave-application",
            },
            {
              key: "leave-balance",
              label: "Balance",
              path: "/dashboard/staff/leave-balance",
            },
          ],
        },
      ],
    },
    {
      key: "cause-list",
      icon: <CalendarOutlined />,
      label: "Cause List",
      path: "/dashboard/cause-list",
    },
    {
      key: "tasks",
      icon: <CheckSquareOutlined />,
      label: "Tasks",
      path: "/dashboard/tasks",
    },
    {
      key: "clients",
      icon: <UserOutlined />,
      label: "Clients",
      path: "/dashboard/clients",
    },
    {
      key: "documents",
      icon: <FileOutlined />,
      label: "Documents",
      path: "/dashboard/documents",
    },
    {
      key: "billings",
      icon: <DollarOutlined />,
      label: "Billing",
      path: "/dashboard/billings",
    },
    {
      key: "support",
      icon: <QuestionCircleOutlined />,
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
        label: (
          <Link to={item.path} onClick={isMobile ? closeDrawer : undefined}>
            {item.label}
          </Link>
        ),
      };
    });
  };

  const handleMenuClick = () => {
    if (isMobile && closeDrawer) {
      closeDrawer();
    }
  };

  const handleOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  return (
    <div
      className={`h-full flex flex-col ${
        isDarkMode ? "bg-gray-900" : "bg-white"
      }`}
      style={{
        boxShadow: isDarkMode
          ? "2px 0 8px rgba(0, 0, 0, 0.4)"
          : "2px 0 8px rgba(0, 0, 0, 0.06)",
      }}>
      {/* Logo Section */}
      <div
        className={`flex items-center px-6 border-b ${
          isDarkMode ? "border-gray-800" : "border-gray-100"
        }`}
        style={{ height: 64, minHeight: 64 }}>
        {!collapsed ? (
          <div className="flex items-center gap-3 w-full">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isDarkMode
                  ? "bg-gradient-to-br from-blue-600 to-blue-700"
                  : "bg-gradient-to-br from-blue-500 to-blue-600"
              }`}>
              <HomeOutlined className="text-white text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <Text
                strong
                className={`block text-base leading-tight ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}>
                LawMaster
              </Text>
              <Text
                className={`block text-xs ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                Legal Suite
              </Text>
            </div>
          </div>
        ) : (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto ${
              isDarkMode
                ? "bg-gradient-to-br from-blue-600 to-blue-700"
                : "bg-gradient-to-br from-blue-500 to-blue-600"
            }`}>
            <HomeOutlined className="text-white text-lg" />
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          items={formatMenuItems(navItems)}
          onClick={handleMenuClick}
          onOpenChange={handleOpenChange}
          inlineCollapsed={collapsed}
          className={`border-0 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}
          style={{
            borderRight: "none",
            color: "white",
          }}
          theme="dark"
        />
      </div>

      {/* Logout Section */}
      <div
        className={`px-3 py-2 border-t ${
          isDarkMode ? "border-gray-800" : "border-gray-100"
        }`}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
            isDarkMode
              ? "hover:bg-red-900/30 text-red-400 hover:text-red-300"
              : "hover:bg-red-50 text-red-600 hover:text-red-700"
          }`}>
          <LogoutOutlined className="text-sm" />
          {!collapsed && <span className="text-xs font-medium">Logout</span>}
        </button>

        {!collapsed && (
          <div className="mt-2 text-center">
            <Text
              className={`text-xs ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}>
              v2.1.0
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
};

export default SideBar;
