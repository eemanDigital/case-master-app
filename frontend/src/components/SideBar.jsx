import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Menu, Typography, Badge } from "antd";
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

const { Text } = Typography;

const SideBar = ({ isMobile, closeDrawer, collapsed }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();

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
    // Matter-related paths
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
    } else if (path.includes("/dashboard/matters-with-officers")) {
      setSelectedKeys(["matters-with-officers"]);
      setOpenKeys(["matters"]);
    }
    // Calendar paths
    else if (path.includes("/dashboard/calendar/dashboard")) {
      setSelectedKeys(["calendar-dashboard"]);
      setOpenKeys(["calendar"]);
    } else if (path.includes("/dashboard/calendar/blocked-dates")) {
      setSelectedKeys(["blocked-dates"]);
      setOpenKeys(["calendar"]);
    } else if (path.includes("/dashboard/calendar/deleted")) {
      setSelectedKeys(["deleted-events"]);
      setOpenKeys(["calendar"]);
    } else if (path.includes("/dashboard/calendar")) {
      setSelectedKeys(["calendar-main"]);
      setOpenKeys(["calendar"]);
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
          key: "matters-with-officers",
          icon: <TeamOutlined />,
          label: "Matters & Officers",
          path: "/dashboard/matters-with-officers",
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
          path: "/dashboard/matters/retainers",
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
    // {
    //   key: "cases",
    //   icon: <BankOutlined />,
    //   label: "Cases",
    //   path: "/dashboard/cases",
    // },
    // {
    //   key: "reports",
    //   icon: <FileTextOutlined />,
    //   label: "Reports",
    //   path: "/dashboard/case-reports",
    // },
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
    // {
    //   key: "cause-list",
    //   icon: <CalendarOutlined />,
    //   label: "Cause List",
    //   path: "/dashboard/cause-list",
    // },
    {
      key: "tasks",
      icon: <CheckSquareOutlined />,
      label: "Tasks",
      path: "/dashboard/tasks",
    },
    {
      key: "calendar",
      icon: <CalendarOutlined />,
      label: "Calendar",
      children: [
        {
          key: "calendar-main",
          label: "View Calendar",
          path: "/dashboard/calendar",
        },
        {
          key: "calendar-dashboard",
          label: "Dashboard",
          path: "/dashboard/calendar/dashboard",
        },
        {
          key: "blocked-dates",
          label: "Blocked Dates",
          path: "/dashboard/calendar/blocked-dates",
        },
        {
          key: "deleted-events",
          label: "Deleted Events",
          path: "/dashboard/calendar/deleted",
        },
      ],
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
        isDarkMode
          ? "bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800"
          : "bg-gradient-to-b from-white via-white to-gray-50"
      }`}
      style={{
        boxShadow: isDarkMode
          ? "4px 0 24px rgba(0, 0, 0, 0.5)"
          : "4px 0 24px rgba(0, 0, 0, 0.08)",
      }}>
      {/* Logo Section */}
      <div
        className={`flex items-center px-6 border-b ${
          isDarkMode
            ? "border-gray-800 bg-gray-900/50"
            : "border-gray-200 bg-white"
        }`}
        style={{ height: 64, minHeight: 64 }}>
        {!collapsed ? (
          <div className="flex items-center gap-3 w-full">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                isDarkMode
                  ? "bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700"
                  : "bg-gradient-to-br from-primary-500 via-primary-600 to-deepBlue-700"
              }`}
              style={{
                boxShadow: isDarkMode
                  ? "0 4px 14px rgba(59, 130, 246, 0.4)"
                  : "0 4px 14px rgba(59, 130, 246, 0.3)",
              }}>
              <HomeOutlined className="text-white text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <Text
                strong
                className={`block text-lg leading-tight font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                LawMaster
              </Text>
              <Text
                className={`block text-xs ${
                  isDarkMode ? "text-primary-400" : "text-primary-600"
                }`}>
                Legal Suite Pro
              </Text>
            </div>
          </div>
        ) : (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center mx-auto shadow-lg ${
              isDarkMode
                ? "bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700"
                : "bg-gradient-to-br from-primary-500 via-primary-600 to-deepBlue-700"
            }`}
            style={{
              boxShadow: isDarkMode
                ? "0 4px 14px rgba(59, 130, 246, 0.4)"
                : "0 4px 14px rgba(59, 130, 246, 0.3)",
            }}>
            <HomeOutlined className="text-white text-xl" />
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          items={formatMenuItems(navItems)}
          onClick={handleMenuClick}
          onOpenChange={handleOpenChange}
          inlineCollapsed={collapsed}
          className={`border-0 ${
            isDarkMode ? "bg-transparent" : "bg-transparent"
          }`}
          style={{
            borderRight: "none",
          }}
          theme={isDarkMode ? "dark" : "light"}
          // Custom styles for menu items
          getPopupContainer={(node) => node.parentNode}
        />

        <style jsx global>{`
          /* Light Mode Menu Styles */
          .ant-menu-light .ant-menu-item {
            border-radius: 8px;
            margin: 4px 0;
            padding: 0 12px !important;
            height: 40px;
            line-height: 40px;
            color: ${isDarkMode ? "#d1d5db" : "#4b5563"};
            transition: all 0.2s ease;
          }

          .ant-menu-light .ant-menu-item:hover {
            background: ${isDarkMode
              ? "rgba(59, 130, 246, 0.1)"
              : "rgba(59, 130, 246, 0.08)"};
            color: ${isDarkMode ? "#93c5fd" : "#2563eb"};
          }

          .ant-menu-light .ant-menu-item-selected {
            background: ${isDarkMode
              ? "linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)"
              : "linear-gradient(90deg, rgba(59, 130, 246, 0.12) 0%, rgba(219, 234, 254, 0.8) 100%)"};
            color: ${isDarkMode ? "#60a5fa" : "#1d4ed8"};
            font-weight: 600;
            border-left: 3px solid ${isDarkMode ? "#3b82f6" : "#2563eb"};
            padding-left: 9px !important;
          }

          .ant-menu-light .ant-menu-item-selected::before {
            content: "";
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: ${isDarkMode ? "#60a5fa" : "#2563eb"};
          }

          /* Dark Mode Menu Styles */
          .ant-menu-dark .ant-menu-item {
            border-radius: 8px;
            margin: 4px 0;
            padding: 0 12px !important;
            height: 40px;
            line-height: 40px;
            color: #d1d5db;
            transition: all 0.2s ease;
          }

          .ant-menu-dark .ant-menu-item:hover {
            background: rgba(59, 130, 246, 0.12);
            color: #93c5fd;
          }

          .ant-menu-dark .ant-menu-item-selected {
            background: linear-gradient(
              90deg,
              rgba(59, 130, 246, 0.2) 0%,
              rgba(37, 99, 235, 0.15) 100%
            );
            color: #60a5fa;
            font-weight: 600;
            border-left: 3px solid #3b82f6;
            padding-left: 9px !important;
          }

          .ant-menu-dark .ant-menu-item-selected::before {
            content: "";
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #60a5fa;
          }

          /* Submenu Styles */
          .ant-menu-light .ant-menu-submenu-title {
            border-radius: 8px;
            margin: 4px 0;
            padding: 0 12px !important;
            height: 40px;
            line-height: 40px;
            color: ${isDarkMode ? "#d1d5db" : "#4b5563"};
            transition: all 0.2s ease;
          }

          .ant-menu-light .ant-menu-submenu-title:hover {
            background: ${isDarkMode
              ? "rgba(59, 130, 246, 0.1)"
              : "rgba(59, 130, 246, 0.08)"};
            color: ${isDarkMode ? "#93c5fd" : "#2563eb"};
          }

          .ant-menu-dark .ant-menu-submenu-title {
            border-radius: 8px;
            margin: 4px 0;
            padding: 0 12px !important;
            height: 40px;
            line-height: 40px;
            color: #d1d5db;
          }

          .ant-menu-dark .ant-menu-submenu-title:hover {
            background: rgba(59, 130, 246, 0.12);
            color: #93c5fd;
          }

          /* Menu Icons */
          .ant-menu-item .anticon,
          .ant-menu-submenu-title .anticon {
            font-size: 16px;
            transition: all 0.2s ease;
          }

          .ant-menu-item-selected .anticon {
            color: ${isDarkMode ? "#60a5fa" : "#2563eb"};
          }

          /* Submenu Arrow */
          .ant-menu-submenu-arrow {
            color: ${isDarkMode ? "#9ca3af" : "#6b7280"};
          }

          .ant-menu-submenu-open
            > .ant-menu-submenu-title
            .ant-menu-submenu-arrow {
            color: ${isDarkMode ? "#60a5fa" : "#2563eb"};
          }
        `}</style>
      </div>

      {/* Logout Section */}
      <div
        className={`px-3 py-3 border-t ${
          isDarkMode
            ? "border-gray-800 bg-gray-900/30"
            : "border-gray-200 bg-gray-50"
        }`}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
            isDarkMode
              ? "hover:bg-red-900/20 text-red-400 hover:text-red-300 border border-red-900/30 hover:border-red-800/50"
              : "hover:bg-red-50 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300"
          }`}
          style={{
            boxShadow: isDarkMode
              ? "0 2px 8px rgba(239, 68, 68, 0.1)"
              : "0 2px 8px rgba(239, 68, 68, 0.08)",
          }}>
          <LogoutOutlined className="text-base group-hover:scale-110 transition-transform" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>

        {!collapsed && (
          <div className="mt-3 text-center">
            <div
              className={`flex items-center justify-center gap-2 ${
                isDarkMode ? "text-gray-600" : "text-gray-400"
              }`}>
              <div
                className={`w-2 h-2 rounded-full ${
                  isDarkMode ? "bg-green-500" : "bg-green-500"
                }`}
                style={{
                  boxShadow: "0 0 8px rgba(34, 197, 94, 0.5)",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              />
              <Text
                className={`text-xs font-medium ${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                }`}>
                v2.1.0 • Active
              </Text>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

SideBar.propTypes = {
  isMobile: PropTypes.bool.isRequired,
  closeDrawer: PropTypes.func,
  collapsed: PropTypes.bool,
};

export default SideBar;
