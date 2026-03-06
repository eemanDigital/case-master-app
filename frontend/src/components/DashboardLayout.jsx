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
  AutoComplete,
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
  FileTextOutlined,
  TeamOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  FileOutlined,
  DollarOutlined,
  AuditOutlined,
  ReconciliationOutlined,
  HomeOutlined,
  FileDoneOutlined,
  RiseOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  BankOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import SideBar from "./SideBar.jsx";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser.jsx";
import { useTheme } from "../providers/ThemeProvider";
import { useAdminHook } from "../hooks/useAdminHook";
import BreadcrumbNavigation from "../components/navigation/BreadcrumbNavigation";
import { useSelector, useDispatch } from "react-redux";
import { fetchTasks } from "../redux/features/task/taskSlice";
import { getMatters } from "../redux/features/matter/matterSlice";
import { getAllEvents } from "../redux/features/calender/calenderSlice";

const { Header, Content } = Layout;
const { Text } = Typography;
const { Option } = AutoComplete;

const DashboardLayout = () => {
  useRedirectLogoutUser("/users/login");
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDarkMode, toggleTheme } = useTheme();
  const { userData } = useAdminHook();

  const taskState = useSelector((state) => state.task);
  const matterState = useSelector((state) => state.matter);
  const calendarState = useSelector((state) => state.calender);

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    const tasks = taskState?.entities ? Object.values(taskState.entities) : [];
    const matters = matterState?.matters || [];
    const events = calendarState?.events?.data || [];

    if (!tasks.length) {
      dispatch(fetchTasks({ limit: 5, sort: "-createdAt" }));
    }
    if (!matters.length) {
      dispatch(getMatters({ limit: 5, sort: "-createdAt" }));
    }
    if (!events.length) {
      dispatch(getAllEvents({ limit: 5 }));
    }
  }, [dispatch, taskState, matterState, calendarState]);

  useEffect(() => {
    const tasks = taskState?.entities ? Object.values(taskState.entities) : [];
    const matters = matterState?.matters || [];
    const events = calendarState?.events?.data || [];

    if (tasks.length || matters.length || events.length) {
      const notificationItems = [];

      matters.slice(0, 2).forEach((matter) => {
        notificationItems.push({
          key: `matter-${matter._id}`,
          type: "matter",
          icon: "file",
          title: `New Matter Created`,
          description: matter.title || matter.caseNumber || "New case",
          meta: matter.category || "General",
          path: `/dashboard/matters`,
          time: new Date(matter.createdAt).toLocaleDateString(),
        });
      });

      tasks.slice(0, 2).forEach((task) => {
        notificationItems.push({
          key: `task-${task._id}`,
          type: "task",
          title: `Task ${task.status === "completed" ? "Completed" : "Assigned"}`,
          description: task.title || task.name || "New task",
          meta: `Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}`,
          path: `/dashboard/tasks`,
          time: new Date(task.createdAt).toLocaleDateString(),
        });
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      events
        ?.filter((event) => {
          const eventDate = new Date(event.date);
          return eventDate >= today && eventDate <= tomorrow;
        })
        .slice(0, 2)
        .forEach((event) => {
          notificationItems.push({
            key: `calendar-${event._id}`,
            type: "calendar",
            icon: "calendar",
            title: `Court Hearing Today`,
            description: event.title || event.eventType || "Court appearance",
            meta: event.court || "Court",
            path: `/dashboard/calendar`,
            time: event.time || "All day",
          });
        });

      setNotifications(notificationItems.slice(0, 6));
      setLoadingNotifications(false);
    }
  }, [taskState, matterState, calendarState]);

  const menuItemsForSearch = [
    {
      key: "all-matters",
      label: "All Matters",
      path: "/dashboard/matters",
      icon: "FileText",
    },
    {
      key: "matters-with-officers",
      label: "Matters & Officers",
      path: "/dashboard/matters-with-officers",
      icon: "Team",
    },
    {
      key: "litigation",
      label: "Litigation",
      path: "/dashboard/matters/litigation",
      icon: "Audit",
    },
    {
      key: "corporate",
      label: "Corporate Practice",
      path: "/dashboard/matters/corporate",
      icon: "FileText",
    },
    {
      key: "retainership",
      label: "Retainership",
      path: "/dashboard/matters/retainers",
      icon: "FileText",
    },
    {
      key: "property",
      label: "Property Practice",
      path: "/dashboard/matters/property",
      icon: "FileText",
    },
    {
      key: "advisory",
      label: "Advisory",
      path: "/dashboard/matters/advisory",
      icon: "FileText",
    },
    {
      key: "general",
      label: "General Practice",
      path: "/dashboard/matters/general",
      icon: "FileText",
    },
    {
      key: "staff-directory",
      label: "Staff Directory",
      path: "/dashboard/staff",
      icon: "Team",
    },
    {
      key: "staff-status",
      label: "Staff Status",
      path: "/dashboard/staff-status",
      icon: "Team",
    },
    {
      key: "leave-applications",
      label: "Leave Applications",
      path: "/dashboard/staff/leave-application",
      icon: "Team",
    },
    {
      key: "leave-balance",
      label: "Leave Balance",
      path: "/dashboard/staff/leave-balance",
      icon: "Team",
    },
    {
      key: "tasks",
      label: "Tasks",
      path: "/dashboard/tasks",
      icon: "CheckSquare",
    },
    {
      key: "calendar-main",
      label: "Calendar",
      path: "/dashboard/calendar",
      icon: "Calendar",
    },
    {
      key: "calendar-dashboard",
      label: "Calendar Dashboard",
      path: "/dashboard/calendar/dashboard",
      icon: "Calendar",
    },
    {
      key: "blocked-dates",
      label: "Blocked Dates",
      path: "/dashboard/calendar/blocked-dates",
      icon: "Calendar",
    },
    {
      key: "deleted-events",
      label: "Deleted Events",
      path: "/dashboard/calendar/deleted",
      icon: "Calendar",
    },
    {
      key: "clients",
      label: "Clients",
      path: "/dashboard/clients",
      icon: "User",
    },
    {
      key: "documents",
      label: "Documents",
      path: "/dashboard/documents",
      icon: "File",
    },
    {
      key: "billings",
      label: "Billing",
      path: "/dashboard/billings",
      icon: "Dollar",
    },
    {
      key: "audit-logs",
      label: "Audit Logs",
      path: "/dashboard/settings/audit-logs",
      icon: "Audit",
    },
    {
      key: "webhooks",
      label: "Webhooks",
      path: "/dashboard/settings/webhooks",
      icon: "Setting",
    },
    {
      key: "invitations",
      label: "Invitations",
      path: "/dashboard/settings/invitations",
      icon: "Team",
    },
    {
      key: "support",
      label: "Support",
      path: "/dashboard/contact-dev",
      icon: "QuestionCircle",
    },
    {
      key: "profile",
      label: "My Profile",
      path: "/dashboard/profile",
      icon: "User",
    },
  ];

  const handleSearch = (value) => {
    setSearchValue(value);
    if (!value) {
      setSearchOptions([]);
      return;
    }
    const filtered = menuItemsForSearch
      .filter((item) => item.label.toLowerCase().includes(value.toLowerCase()))
      .map((item) => ({
        value: item.label,
        label: (
          <div
            onClick={() => {
              navigate(item.path);
              setSearchValue("");
              setSearchOptions([]);
            }}
            className="flex items-center gap-3 py-2 px-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer">
            <span>{item.label}</span>
          </div>
        ),
        path: item.path,
      }));
    setSearchOptions(filtered);
  };

  const handleSearchSelect = (value, option) => {
    navigate(option.path);
    setSearchValue("");
    setSearchOptions([]);
  };

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

  const getNotificationIcon = (type) => {
    const iconClass = "text-sm";
    switch (type) {
      case "matter":
        return (
          <FileTextOutlined
            className={`${iconClass} text-blue-600 dark:text-blue-400`}
          />
        );
      case "task":
        return (
          <CheckSquareOutlined
            className={`${iconClass} text-purple-600 dark:text-purple-400`}
          />
        );
      case "calendar":
        return (
          <CalendarOutlined
            className={`${iconClass} text-orange-600 dark:text-orange-400`}
          />
        );
      case "client":
        return (
          <UserOutlined
            className={`${iconClass} text-green-600 dark:text-green-400`}
          />
        );
      default:
        return (
          <BellOutlined
            className={`${iconClass} text-gray-600 dark:text-gray-400`}
          />
        );
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case "matter":
        return "bg-blue-100 dark:bg-blue-900";
      case "task":
        return "bg-purple-100 dark:bg-purple-900";
      case "calendar":
        return "bg-orange-100 dark:bg-orange-900";
      case "client":
        return "bg-green-100 dark:bg-green-900";
      default:
        return "bg-gray-100 dark:bg-gray-900";
    }
  };

  const notificationDropdownItems = [
    {
      key: "header",
      label: (
        <div className="px-3 py-2 border-b dark:border-gray-700">
          <div className="flex justify-between items-center">
            <Text strong className="text-sm">
              Notifications
            </Text>
            <Badge count={notifications.length} size="small" />
          </div>
        </div>
      ),
      disabled: true,
    },
    ...notifications.map((notification) => ({
      key: notification.key,
      label: (
        <div
          className="flex items-start gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          onClick={() => navigate(notification.path)}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBg(notification.type)}`}>
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs text-gray-900 dark:text-gray-100">
              {notification.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {notification.description}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {notification.meta} • {notification.time}
            </p>
          </div>
        </div>
      ),
    })),
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

  const notificationItems = loadingNotifications
    ? [
        {
          key: "loading",
          label: (
            <div className="px-3 py-4 flex justify-center">
              <Text className="text-xs text-gray-500">
                Loading notifications...
              </Text>
            </div>
          ),
          disabled: true,
        },
      ]
    : notifications.length === 0
      ? [
          {
            key: "empty",
            label: (
              <div className="px-3 py-4 flex flex-col items-center">
                <BellOutlined className="text-2xl text-gray-400 mb-2" />
                <Text className="text-xs text-gray-500">
                  No new notifications
                </Text>
              </div>
            ),
            disabled: true,
          },
        ]
      : notificationDropdownItems;

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
            <AutoComplete
              value={searchValue}
              options={searchOptions}
              onSearch={handleSearch}
              onSelect={handleSearchSelect}
              placeholder="Search menu, cases, clients..."
              className="w-full"
              allowClear>
              <Input
                prefix={<SearchOutlined className="text-gray-400" />}
                size="middle"
              />
            </AutoComplete>
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
