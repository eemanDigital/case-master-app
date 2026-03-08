import { lazy, Suspense, useEffect, useRef, useMemo, useState } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { ConfigProvider, Spin, Result, Button } from "antd";
import { Link } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { getLoginStatus, getUser } from "./redux/features/auth/authSlice.js";
import { ThemeProvider } from "./providers/ThemeProvider";

// ============================================
// EAGER LOADED COMPONENTS (Critical Path)
// ============================================
import HomeLayout from "./components/HomeLayout";
import DashboardLayout from "./components/DashboardLayout.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Error from "./components/Error.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import {
  ShowOnlyVerifiedUser,
  ShowStaff,
} from "./components/protect/Protect.jsx";

// ============================================
// LAZY LOADED COMPONENTS (Code Splitting)
// ============================================

// Auth Pages
const HomePage = lazy(() => import("./components/HomePage.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ForgotPasswordReset = lazy(
  () => import("./pages/ForgotPasswordReset.jsx"),
);
const LoginWithCode = lazy(() => import("./components/LoginWithCode.jsx"));
const VerifyAccount = lazy(() => import("./components/VerifyAccount.jsx"));

// Profile & Settings
const Profile = lazy(() => import("./pages/Profile.jsx"));

// Staff Management
const StaffList = lazy(() => import("./pages/StaffList.jsx"));
const StaffDetails = lazy(() => import("./pages/StaffDetails.jsx"));
const AddUserForm = lazy(() => import("./pages/AddUserForm.jsx"));
const StatusUserList = lazy(() => import("./pages/StatusUserList.jsx"));

// Calendar Management
const CalendarPage = lazy(() => import("./pages/calender/CalendarPage.jsx"));
const CalendarDashboard = lazy(
  () => import("./pages/calender/CalendarDashboard.jsx"),
);
const BlockedDatesPage = lazy(
  () => import("./pages/calender/BlockedDatesPage.jsx"),
);

// Leave Management
const LeaveAppForm = lazy(() => import("./pages/LeaveAppForm.jsx"));
const LeaveApplicationList = lazy(
  () => import("./pages/LeaveApplicationList.jsx"),
);
const LeaveApplicationDetails = lazy(
  () => import("./pages/LeaveApplicationDetails.jsx"),
);
const LeaveBalanceList = lazy(() => import("./pages/leaveBalanceList.jsx"));

// Matters Management
const MatterListView = lazy(
  () => import("./components/matters/MatterListView.jsx"),
);
const MatterDetails = lazy(() => import("./pages/matters/MatterDetails.jsx"));
const MatterFormContainer = lazy(
  () => import("./components/matters/MatterForm/MatterFormContainer.jsx"),
);
const AllMattersWithOfficers = lazy(
  () => import("./pages/AllMattersWithOfficers.jsx"),
);

// Litigation Management
const LitigationDashboardPage = lazy(
  () => import("./pages/dashboard/litigation/LitigationDashboardPage"),
);
const CreateLitigation = lazy(
  () => import("./pages/litigation/CreateLitigation.jsx"),
);
const LitigationDetails = lazy(
  () => import("./pages/litigation/LitigationDetails.jsx"),
);
const EditLitigation = lazy(
  () => import("./pages/litigation/EditLitigation.jsx"),
);

// Corporate Matters Management
const CorporateMatterList = lazy(
  () => import("./pages/corporate/CorporateList.jsx"),
);
const CreateCorporateMatter = lazy(
  () => import("./pages/corporate/CreateCorporate.jsx"),
);
const CorporateMatterDetails = lazy(
  () => import("./pages/corporate/CorporateDetails.jsx"),
);

// Property Management
const PropertyList = lazy(() => import("./pages/property/PropertyList.jsx"));
const CreateProperty = lazy(
  () => import("./pages/property/CreateProperty.jsx"),
);
const EditProperty = lazy(() => import("./pages/property/EditProperty.jsx"));
const PropertyDetails = lazy(
  () => import("./pages/property/PropertyDetails.jsx"),
);

// Retainer Management
const RetainerList = lazy(() => import("./pages/retainer/RetainerList.jsx"));
const CreateRetainerPage = lazy(() =>
  import("./pages/retainer/RetainerPageWrappers.jsx").then((module) => ({
    default: module.CreateRetainerPage,
  })),
);
const RetainerDetailsPage = lazy(() =>
  import("./pages/retainer/RetainerPageWrappers.jsx").then((module) => ({
    default: module.RetainerDetailsPage,
  })),
);

// General Matter Management
const GeneralList = lazy(() => import("./pages/general/GeneralList.jsx"));
const CreateGeneral = lazy(() => import("./pages/general/CreateGeneral.jsx"));
const GeneralDetails = lazy(() => import("./pages/general/GeneralDetails.jsx"));

// Advisory Matter Management
const AdvisoryDashboardPage = lazy(
  () => import("./components/advisory/AdvisoryDashboardPage.jsx"),
);
const AdvisoryCreatePage = lazy(
  () => import("./pages/advisory/AdvisoryCreatePage.jsx"),
);
const AdvisoryDetailPage = lazy(
  () => import("./pages/advisory/AdvisoryDetailPage.jsx"),
);
const AdvisoryEditPage = lazy(
  () => import("./pages/advisory/AdvisoryEditPage.jsx"),
);

// Tasks Management
const TaskList = lazy(() => import("./components/TaskList.jsx"));
const CreateTaskForm = lazy(() => import("./pages/CreateTaskForm.jsx"));
const TaskDetails = lazy(() => import("./pages/TaskDetails.jsx"));
const EditTaskForm = lazy(() => import("./pages/EditTaskForm.jsx"));

// Clients Management
const ClientLists = lazy(() => import("./pages/ClientLists.jsx"));
const AddClientForm = lazy(() => import("./components/AddClientForm.jsx"));
const ClientDetails = lazy(() => import("./pages/ClientDetails.jsx"));

// Billing Management
const InvoiceList = lazy(() => import("./pages/InvoiceList.jsx"));
const CreateInvoiceForm = lazy(
  () => import("./components/CreateInvoiceForm.jsx"),
);
const InvoiceDetails = lazy(() => import("./pages/InvoiceDetails.jsx"));
const UpdateInvoice = lazy(() => import("./pages/UpdateInvoice.jsx"));
const PaymentMadeOnMatter = lazy(
  () => import("./pages/PaymentMadeOnMatter.jsx"),
);

// Documents Management
const DocumentsList = lazy(() => import("./components/DocumentsList.jsx"));
const DocumentRecordForm = lazy(() => import("./pages/DocumentRecordForm.jsx"));
const DocumentRecordList = lazy(() => import("./pages/DocumentRecordList.jsx"));
const DocumentRecordDetails = lazy(
  () => import("./pages/DocumentRecordDetails.jsx"),
);

// Notes Management
const NoteForm = lazy(() => import("./pages/NoteForm.jsx"));
const NoteList = lazy(() => import("./pages/NoteList.jsx"));
const UpdateNote = lazy(() => import("./pages/UpdateNote.jsx"));
const NoteDetail = lazy(() => import("./pages/NoteDetail.jsx"));

// Calendar & Events
const EventDetail = lazy(() => import("./pages/EventDetail.jsx"));

// Settings & Integrations
const AuditLogList = lazy(() => import("./pages/AuditLogList.jsx"));
const WebhookList = lazy(() => import("./pages/WebhookList.jsx"));
const InvitationList = lazy(() => import("./pages/InvitationList.jsx"));

// Platform Admin
const PlatformAdminPanel = lazy(() => import("./components/PlatformAdminPanel.jsx"));

// Upgrade Accept Page
const UpgradeAccept = lazy(() => import("./pages/UpgradeAccept.jsx"));

// Support
const ContactForm = lazy(() => import("./components/ContactForm.jsx"));

// Legal Pages
const TermsOfService = lazy(() => import("./pages/TermsOfService.jsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.jsx"));

// Cookie Consent
import CookieConsent from "./components/CookieConsent";

// ============================================
// AXIOS CONFIGURATION
// ============================================
axios.defaults.withCredentials = true;

// ============================================
// ANTD THEME CONFIGURATION
// ============================================
const getAntdTheme = (isDarkMode) => ({
  token: {
    colorPrimary: isDarkMode ? "#3b82f6" : "#2563eb",
    colorInfo: isDarkMode ? "#3b82f6" : "#2563eb",
    colorSuccess: isDarkMode ? "#10b981" : "#059669",
    colorWarning: isDarkMode ? "#f59e0b" : "#d97706",
    colorError: isDarkMode ? "#ef4444" : "#dc2626",
    fontFamily: "'Poppins', sans-serif",
    borderRadius: 8,
    colorBgContainer: isDarkMode ? "#1f2937" : "#ffffff",
    colorBgElevated: isDarkMode ? "#1f2937" : "#ffffff",
    colorBgLayout: isDarkMode ? "#111827" : "#f3f4f6",
    colorText: isDarkMode ? "#f9fafb" : "#111827",
    colorTextSecondary: isDarkMode ? "#d1d5db" : "#6b7280",
    colorBorder: isDarkMode ? "#4b5563" : "#d1d5db",
    colorBorderSecondary: isDarkMode ? "#374151" : "#e5e7eb",
  },
  components: {
    Layout: {
      colorBgHeader: isDarkMode ? "#1f2937" : "#ffffff",
      colorBgBody: isDarkMode ? "#111827" : "#f3f4f6",
    },
    Card: {
      colorBgContainer: isDarkMode ? "#1f2937" : "#ffffff",
      borderRadius: 12,
      boxShadow: isDarkMode
        ? "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)"
        : "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    },
    Button: { borderRadius: 8 },
    Input: {
      colorBgContainer: isDarkMode ? "#1f2937" : "#ffffff",
      borderRadius: 8,
    },
    Select: {
      colorBgContainer: isDarkMode ? "#1f2937" : "#ffffff",
      borderRadius: 8,
    },
    Table: {
      colorBgContainer: isDarkMode ? "#1f2937" : "#ffffff",
      colorText: isDarkMode ? "#d1d5db" : "#111827",
      headerColor: isDarkMode ? "#9ca3af" : "#6b7280",
      headerBg: isDarkMode ? "#111827" : "#f9fafb",
      rowHoverBg: isDarkMode ? "#374151" : "#f3f4f6",
      borderColor: isDarkMode ? "#374151" : "#e5e7eb",
    },
    Menu: {
      colorBgContainer: isDarkMode ? "#1f2937" : "#001529",
      colorItemBg: isDarkMode ? "#1f2937" : "#001529",
      colorItemBgSelected: isDarkMode ? "#1e40af" : "#1890ff",
      colorItemText: isDarkMode ? "#d1d5db" : "#ffffff",
      colorItemTextSelected: isDarkMode ? "#ffffff" : "#ffffff",
    },
    Modal: {
      colorBgMask: isDarkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.45)",
      colorBgElevated: isDarkMode ? "#1f2937" : "#ffffff",
    },
    Drawer: { colorBgElevated: isDarkMode ? "#1f2937" : "#ffffff" },
    Form: { labelColor: isDarkMode ? "#d1d5db" : "#374151" },
    DatePicker: { colorBgContainer: isDarkMode ? "#1f2937" : "#ffffff" },
    TimePicker: { colorBgContainer: isDarkMode ? "#1f2937" : "#ffffff" },
    Upload: { colorBgContainer: isDarkMode ? "#1f2937" : "#ffffff" },
    Tag: { colorBgContainer: isDarkMode ? "#374151" : "#f3f4f6" },
  },
});

// ============================================
// LOADING COMPONENTS
// ============================================
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spin size="large" tip="Loading page..." />
  </div>
);

// Full-screen initial boot loader — only shown ONCE on first load
const AppBootLoader = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-50 gap-4">
    <Spin size="large" />
    <p
      className="text-gray-500 text-sm font-medium"
      style={{ fontFamily: "'Poppins', sans-serif" }}>
      Loading CaseMaster...
    </p>
  </div>
);

// ============================================
// 404 NOT FOUND COMPONENT
// ============================================
const NotFound = () => (
  <Result
    status="404"
    title="404"
    subTitle="Sorry, the page you visited does not exist."
    extra={
      <Link to="/dashboard">
        <Button type="primary">Back to Dashboard</Button>
      </Link>
    }
  />
);

// ============================================
// PROTECTED ROUTE WRAPPER
// ============================================
const ProtectedStaffRoute = ({ children }) => (
  <ShowOnlyVerifiedUser>
    <ProtectedRoute isStaffRoute={true}>{children}</ProtectedRoute>
  </ShowOnlyVerifiedUser>
);

// ============================================
// AUTH ROUTE HANDLER
// Handles post-login redirect only.
// ✅ FIX: No loading spinner here — that was causing the full-page flash
//    every time auth state changed (e.g. during login dispatch).
// ============================================
const AuthRouteHandler = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useSelector((state) => state.auth);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (isLoggedIn) {
      const redirectPath = sessionStorage.getItem("redirectAfterLogin");
      if (redirectPath) {
        sessionStorage.removeItem("redirectAfterLogin");
        navigate(redirectPath, { replace: true });
      }
    }
  }, [isLoggedIn, navigate]);

  // ✅ Just render children — no spinner, no conditional blocking
  return <Outlet />;
};

// ============================================
// ROUTER (stable — created once, never recreated)
// ============================================
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AuthRouteHandler />}>
      <Route path="/" element={<HomeLayout />} errorElement={<Error />}>
        {/* Home Page */}
        <Route
          index
          element={
            <Suspense fallback={<PageLoader />}>
              <HomePage />
            </Suspense>
          }
        />

        {/* Legal Pages */}
        <Route
          path="terms-of-service"
          element={
            <Suspense fallback={<PageLoader />}>
              <TermsOfService />
            </Suspense>
          }
        />
        <Route
          path="privacy-policy"
          element={
            <Suspense fallback={<PageLoader />}>
              <PrivacyPolicy />
            </Suspense>
          }
        />

        <Route
          path="cookie-policy"
          element={
            <Suspense fallback={<PageLoader />}>
              <CookieConsent />
            </Suspense>
          }
        />

        {/* Auth Routes */}
        <Route
          path="users/login"
          element={
            <Suspense fallback={<PageLoader />}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="register"
          element={
            <Suspense fallback={<PageLoader />}>
              <Register />
            </Suspense>
          }
        />
        <Route
          path="forgotpassword"
          element={
            <Suspense fallback={<PageLoader />}>
              <ForgotPassword />
            </Suspense>
          }
        />
        <Route
          path="resetPassword/:token"
          element={
            <Suspense fallback={<PageLoader />}>
              <ForgotPasswordReset />
            </Suspense>
          }
        />
        <Route
          path="loginWithCode/:email"
          element={
            <Suspense fallback={<PageLoader />}>
              <LoginWithCode />
            </Suspense>
          }
        />
        <Route
          path="dashboard/verify-account/:token"
          element={
            <Suspense fallback={<PageLoader />}>
              <VerifyAccount />
            </Suspense>
          }
        />

        {/* Platform Admin - Public route, no auth required */}
        <Route
          path="platform-admin"
          element={
            <Suspense fallback={<PageLoader />}>
              <PlatformAdminPanel />
            </Suspense>
          }
        />

        {/* Upgrade Accept - Public route for upgrade invitation */}
        <Route
          path="upgrade"
          element={
            <Suspense fallback={<PageLoader />}>
              <UpgradeAccept />
            </Suspense>
          }
        />

        {/* Dashboard Routes */}
        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />

          {/* Profile */}
          <Route
            path="profile"
            element={
              <Suspense fallback={<PageLoader />}>
                <Profile />
              </Suspense>
            }
          />

          {/* Staff Management */}
          <Route
            path="staff"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProtectedStaffRoute>
                  <StaffList />
                </ProtectedStaffRoute>
              </Suspense>
            }
          />
          <Route
            path="staff/add-user"
            element={
              <Suspense fallback={<PageLoader />}>
                <AddUserForm />
              </Suspense>
            }
          />
          <Route
            path="staff/:id/details"
            element={
              <Suspense fallback={<PageLoader />}>
                <StaffDetails />
              </Suspense>
            }
          />
          <Route
            path="staff-status"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProtectedStaffRoute>
                  <StatusUserList />
                </ProtectedStaffRoute>
              </Suspense>
            }
          />

          {/* Leave Management */}
          <Route
            path="leave-application"
            element={
              <Suspense fallback={<PageLoader />}>
                <LeaveAppForm />
              </Suspense>
            }
          />
          <Route
            path="staff/leave-application"
            element={
              <Suspense fallback={<PageLoader />}>
                <ShowOnlyVerifiedUser>
                  <LeaveApplicationList />
                </ShowOnlyVerifiedUser>
              </Suspense>
            }
          />
          <Route
            path="staff/leave-application/:id/details"
            element={
              <Suspense fallback={<PageLoader />}>
                <LeaveApplicationDetails />
              </Suspense>
            }
          />
          <Route
            path="staff/leave-balance"
            element={
              <Suspense fallback={<PageLoader />}>
                <ShowOnlyVerifiedUser>
                  <LeaveBalanceList />
                </ShowOnlyVerifiedUser>
              </Suspense>
            }
          />

          {/* Matters Management */}
          <Route
            path="matters"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProtectedStaffRoute>
                  <MatterListView />
                </ProtectedStaffRoute>
              </Suspense>
            }
          />
          <Route
            path="matters/create"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProtectedStaffRoute>
                  <MatterFormContainer />
                </ProtectedStaffRoute>
              </Suspense>
            }
          />
          <Route
            path="matters/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <MatterDetails />
              </Suspense>
            }
          />
          <Route
            path="matters/:id/edit"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProtectedStaffRoute>
                  <MatterFormContainer isEditMode={true} />
                </ProtectedStaffRoute>
              </Suspense>
            }
          />
          <Route
            path="matters-with-officers"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProtectedStaffRoute>
                  <AllMattersWithOfficers />
                </ProtectedStaffRoute>
              </Suspense>
            }
          />
          <Route path="matters/litigation">
            <Route
              index
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <LitigationDashboardPage />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
            <Route
              path=":matterId/create"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <CreateLitigation />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
            <Route
              path=":matterId"
              element={
                <Suspense fallback={<PageLoader />}>
                  <LitigationDetails />
                </Suspense>
              }
            />
            <Route
              path=":matterId/edit"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <EditLitigation />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
          </Route>

          {/* Corporate Matters Management */}
          <Route path="matters/corporate">
            <Route
              index
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <CorporateMatterList />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
            <Route
              path=":matterId/create"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <CreateCorporateMatter />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
            <Route
              path=":matterId"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CorporateMatterDetails />
                </Suspense>
              }
            />
          </Route>

          {/* Property Management */}
          <Route path="matters/property">
            <Route
              index
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <PropertyList />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
            <Route
              path=":matterId/create"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <CreateProperty />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
            <Route
              path=":matterId/edit"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <EditProperty />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
            <Route
              path=":matterId/details"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PropertyDetails />
                </Suspense>
              }
            />
          </Route>

          {/* Retainer Management */}
          <Route path="matters/retainers">
            <Route
              index
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <RetainerList />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
            <Route
              path=":matterId/create"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <CreateRetainerPage />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
            <Route
              path=":matterId/details"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <RetainerDetailsPage />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
            <Route
              path=":matterId/edit"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <RetainerDetailsPage editMode />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
          </Route>

          {/* General Matter Management */}
          <Route path="matters/general">
            <Route
              index
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <GeneralList />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
            <Route
              path=":matterId/create"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <CreateGeneral />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
            <Route
              path=":matterId/details"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <GeneralDetails />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
            <Route
              path=":matterId/edit"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <GeneralDetails editMode />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
          </Route>

          {/* Advisory Matter Management */}
          <Route path="matters/advisory">
            <Route
              index
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <AdvisoryDashboardPage />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
            <Route
              path=":matterId/create"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <AdvisoryCreatePage />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
            <Route
              path=":matterId/details"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <AdvisoryDetailPage />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
            <Route
              path=":matterId/edit"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedStaffRoute>
                    <AdvisoryEditPage editMode />
                  </ProtectedStaffRoute>
                </Suspense>
              }
            />
          </Route>

          {/* Calendar Management */}
          <Route
            path="calendar"
            element={
              <Suspense fallback={<PageLoader />}>
                <ShowOnlyVerifiedUser>
                  <CalendarPage />
                </ShowOnlyVerifiedUser>
              </Suspense>
            }
          />
          <Route
            path="calendar/dashboard"
            element={
              <Suspense fallback={<PageLoader />}>
                <ShowOnlyVerifiedUser>
                  <CalendarDashboard />
                </ShowOnlyVerifiedUser>
              </Suspense>
            }
          />
          <Route
            path="calendar/blocked-dates"
            element={
              <Suspense fallback={<PageLoader />}>
                <ShowOnlyVerifiedUser>
                  <BlockedDatesPage />
                </ShowOnlyVerifiedUser>
              </Suspense>
            }
          />

          {/* Tasks Management */}
          <Route
            path="tasks"
            element={
              <Suspense fallback={<PageLoader />}>
                <ShowOnlyVerifiedUser>
                  <TaskList />
                </ShowOnlyVerifiedUser>
              </Suspense>
            }
          />
          <Route
            path="tasks/add-task"
            element={
              <Suspense fallback={<PageLoader />}>
                <CreateTaskForm />
              </Suspense>
            }
          />
          <Route
            path="tasks/:id/details"
            element={
              <Suspense fallback={<PageLoader />}>
                <TaskDetails />
              </Suspense>
            }
          />
          <Route
            path="tasks/:id/edit"
            element={
              <Suspense fallback={<PageLoader />}>
                <EditTaskForm />
              </Suspense>
            }
          />

          {/* Clients Management */}
          <Route
            path="clients"
            element={
              <Suspense fallback={<PageLoader />}>
                <ShowOnlyVerifiedUser>
                  <ClientLists />
                </ShowOnlyVerifiedUser>
              </Suspense>
            }
          />
          <Route
            path="clients/add-client"
            element={
              <Suspense fallback={<PageLoader />}>
                <AddClientForm />
              </Suspense>
            }
          />
          <Route
            path="clients/:id/details"
            element={
              <Suspense fallback={<PageLoader />}>
                <ClientDetails />
              </Suspense>
            }
          />

          {/* Billing Management */}
          <Route
            path="billings"
            element={
              <Suspense fallback={<PageLoader />}>
                <ShowOnlyVerifiedUser>
                  <InvoiceList />
                </ShowOnlyVerifiedUser>
              </Suspense>
            }
          />
          <Route
            path="billings/invoices/add-invoices"
            element={
              <Suspense fallback={<PageLoader />}>
                <CreateInvoiceForm />
              </Suspense>
            }
          />
          <Route
            path="billings/invoices/:id/details"
            element={
              <Suspense fallback={<PageLoader />}>
                <InvoiceDetails />
              </Suspense>
            }
          />
          <Route
            path="billings/invoices/:id/update"
            element={
              <Suspense fallback={<PageLoader />}>
                <UpdateInvoice />
              </Suspense>
            }
          />
          <Route
            path="billings/payments/client/:clientId/matter/:matterId"
            element={
              <Suspense fallback={<PageLoader />}>
                <PaymentMadeOnMatter />
              </Suspense>
            }
          />

          {/* Documents Management */}
          <Route
            path="documents"
            element={
              <Suspense fallback={<PageLoader />}>
                <ShowOnlyVerifiedUser>
                  <ShowStaff>
                    <DocumentsList />
                  </ShowStaff>
                </ShowOnlyVerifiedUser>
              </Suspense>
            }
          />
          <Route
            path="record-documents/:id?"
            element={
              <Suspense fallback={<PageLoader />}>
                <DocumentRecordForm />
              </Suspense>
            }
          />
          <Route
            path="record-document-list"
            element={
              <Suspense fallback={<PageLoader />}>
                <DocumentRecordList />
              </Suspense>
            }
          />
          <Route
            path="record-document-list/:id/details"
            element={
              <Suspense fallback={<PageLoader />}>
                <DocumentRecordDetails />
              </Suspense>
            }
          />

          {/* Notes Management */}
          <Route
            path="add-notes"
            element={
              <Suspense fallback={<PageLoader />}>
                <NoteForm />
              </Suspense>
            }
          />
          <Route
            path="notes"
            element={
              <Suspense fallback={<PageLoader />}>
                <NoteList />
              </Suspense>
            }
          />
          <Route
            path="note/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <NoteDetail />
              </Suspense>
            }
          />
          <Route
            path="update-note/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <UpdateNote />
              </Suspense>
            }
          />

          {/* Cause List & Events */}
          <Route
            path="events/:id/details"
            element={
              <Suspense fallback={<PageLoader />}>
                <EventDetail />
              </Suspense>
            }
          />

          {/* Settings & Integrations */}
          <Route
            path="settings/audit-logs"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProtectedStaffRoute>
                  <AuditLogList />
                </ProtectedStaffRoute>
              </Suspense>
            }
          />
          <Route
            path="settings/webhooks"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProtectedStaffRoute>
                  <WebhookList />
                </ProtectedStaffRoute>
              </Suspense>
            }
          />
          <Route
            path="settings/invitations"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProtectedStaffRoute>
                  <InvitationList />
                </ProtectedStaffRoute>
              </Suspense>
            }
          />

          {/* Support */}
          <Route
            path="contact-dev"
            element={
              <Suspense fallback={<PageLoader />}>
                <ContactForm />
              </Suspense>
            }
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Route>,
  ),
);

// ============================================
// MAIN APP COMPONENT
// ============================================
function App() {
  const dispatch = useDispatch();
  const isDarkMode = useSelector((state) => state.theme?.isDarkMode) || false;
  const hasInitialized = useRef(false);

  // ✅ FIX: Track ONLY the initial boot check with local state.
  //    Never use global isLoading (loader slice) to gate the whole app —
  //    that caused the full-screen flash on every login button click.
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    async function initialAuthCheck() {
      try {
        const loginStatus = await dispatch(getLoginStatus()).unwrap();
        if (loginStatus) {
          await dispatch(getUser()).unwrap();
        }
      } catch (error) {
        console.error("Initial auth check failed:", error);
      } finally {
        // ✅ Only set this once — never set it back to false
        setIsAuthReady(true);
      }
    }

    initialAuthCheck();
  }, [dispatch]);

  const toastContainerProps = useMemo(
    () => ({
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      newestOnTop: false,
      closeOnClick: true,
      rtl: false,
      pauseOnFocusLoss: true,
      draggable: true,
      pauseOnHover: true,
      theme: isDarkMode ? "dark" : "light",
      toastStyle: {
        fontSize: "14px",
        fontFamily: "'Poppins', sans-serif",
        borderRadius: "8px",
      },
    }),
    [isDarkMode],
  );

  const antdTheme = useMemo(() => getAntdTheme(isDarkMode), [isDarkMode]);

  // ✅ FIX: Only show the boot loader during the very first auth check.
  //    After isAuthReady = true, this NEVER shows again — not during
  //    login, logout, or any other Redux state changes.
  if (!isAuthReady) {
    return <AppBootLoader />;
  }

  return (
    <ThemeProvider>
      <ConfigProvider theme={antdTheme}>
        {/* ✅ Router is defined OUTSIDE the component (module level)
            so it's never recreated on re-renders */}
        <RouterProvider router={router} />
        <ToastContainer {...toastContainerProps} />
      </ConfigProvider>
    </ThemeProvider>
  );
}

export default App;
