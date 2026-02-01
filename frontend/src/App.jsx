import { lazy, Suspense, useEffect, useRef, useMemo } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import { ConfigProvider, Spin, Result, Button } from "antd";
import { Link } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { getLoginStatus, getUser } from "./redux/features/auth/authSlice.js";
import { setLoading } from "./redux/features/loader/loadingSlice.js";
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

// Leave Management
const LeaveAppForm = lazy(() => import("./pages/LeaveAppForm.jsx"));
const LeaveApplicationList = lazy(
  () => import("./pages/LeaveApplicationList.jsx"),
);
const LeaveApplicationDetails = lazy(
  () => import("./pages/LeaveApplicationDetails.jsx"),
);
const LeaveBalanceList = lazy(() => import("./pages/leaveBalanceList.jsx"));

// Cases Management
const CaseList = lazy(() => import("./pages/CaseList.jsx"));
const CreateCaseForm = lazy(() => import("./pages/CreateCaseForm.jsx"));
const UpdateCase = lazy(() => import("./pages/UpdateCase.jsx"));
const CaseDetails = lazy(() => import("./pages/CaseDetails.jsx"));
const SoftDeletedCasesArchive = lazy(
  () => import("./components/SoftDeletedCasesArchive.jsx"),
);

// Case Reports
const MainCaseReportList = lazy(() => import("./pages/MainCaseReportList.jsx"));
const CreateCaseReportForm = lazy(
  () => import("./pages/CreateCaseReportForm.jsx"),
);
const SoftDeletedReportsArchive = lazy(
  () => import("./pages/SoftDeletedReportsArchive.jsx"),
);

// Matters Management
const MatterListView = lazy(
  () => import("./components/matters/MatterListView.jsx"),
);
const MatterDetails = lazy(() => import("./pages/matters/MatterDetails.jsx"));
const MatterFormContainer = lazy(
  () => import("./components/matters/MatterForm/MatterFormContainer.jsx"),
);

// Litigation Management (New)
const LitigationList = lazy(
  () => import("./pages/litigation/LitigationList.jsx"),
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
const PaymentMadeOnCase = lazy(() => import("./pages/PaymentMadeOnCase.jsx"));

// Documents Management
const DocumentsList = lazy(() => import("./components/DocumentsList.jsx"));
const DocumentRecord = lazy(() => import("./pages/DocumentRecord.jsx"));
const DocumentRecordList = lazy(() => import("./pages/DocumentRecordList.jsx"));
const DocumentRecordDetails = lazy(
  () => import("./pages/DocumentRecordDetails.jsx"),
);

// Notes Management
const NoteForm = lazy(() => import("./pages/NoteForm.jsx"));
const NoteList = lazy(() => import("./pages/NoteList.jsx"));
const UpdateNote = lazy(() => import("./pages/UpdateNote.jsx"));

// Calendar & Events
const CauseList = lazy(() =>
  import("./components/CauseList.jsx").then((module) => ({
    default: module.CauseList,
  })),
);
const EventDetail = lazy(() => import("./pages/EventDetail.jsx"));

// Support
const ContactForm = lazy(() => import("./components/ContactForm.jsx"));

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
    Button: {
      borderRadius: 8,
    },
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
    Drawer: {
      colorBgElevated: isDarkMode ? "#1f2937" : "#ffffff",
    },
    Form: {
      labelColor: isDarkMode ? "#d1d5db" : "#374151",
    },
    DatePicker: {
      colorBgContainer: isDarkMode ? "#1f2937" : "#ffffff",
    },
    TimePicker: {
      colorBgContainer: isDarkMode ? "#1f2937" : "#ffffff",
    },
    Upload: {
      colorBgContainer: isDarkMode ? "#1f2937" : "#ffffff",
    },
    Tag: {
      colorBgContainer: isDarkMode ? "#374151" : "#f3f4f6",
    },
  },
});

// ============================================
// LOADING COMPONENTS
// ============================================
const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
    <Spin size="large" tip="Loading..." />
  </div>
);

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spin size="large" tip="Loading page..." />
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
// MAIN APP COMPONENT
// ============================================
function App() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loading);
  const isDarkMode = useSelector((state) => state.theme?.isDarkMode) || false;
  const hasInitialized = useRef(false);

  // ============================================
  // INITIAL AUTH CHECK (Run Once)
  // ============================================
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    async function initialAuthCheck() {
      dispatch(setLoading(true));
      try {
        const loginStatus = await dispatch(getLoginStatus()).unwrap();
        if (loginStatus) {
          await dispatch(getUser()).unwrap();
        }
      } catch (error) {
        console.error("Initial auth check failed:", error);
      } finally {
        dispatch(setLoading(false));
      }
    }

    initialAuthCheck();
  }, [dispatch]);

  // ============================================
  // ROUTER CONFIGURATION
  // ============================================
  const router = useMemo(
    () =>
      createBrowserRouter(
        createRoutesFromElements(
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

              {/* Litigation Management (Nested under /dashboard/matters/) */}
              <Route path="matters/litigation">
                <Route
                  index
                  element={
                    <Suspense fallback={<PageLoader />}>
                      <ProtectedStaffRoute>
                        <LitigationList />
                      </ProtectedStaffRoute>
                    </Suspense>
                  }
                />
                <Route
                  path="create"
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

              {/* Cases Management */}
              <Route
                path="cases"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ShowOnlyVerifiedUser>
                      <CaseList />
                    </ShowOnlyVerifiedUser>
                  </Suspense>
                }
              />
              <Route
                path="cases/add-case"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <CreateCaseForm />
                  </Suspense>
                }
              />
              <Route
                path="cases/:id/update"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <UpdateCase />
                  </Suspense>
                }
              />
              <Route
                path="cases/:id/casedetails"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <CaseDetails />
                  </Suspense>
                }
              />
              <Route
                path="cases/soft-deleted-cases"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ShowOnlyVerifiedUser>
                      <SoftDeletedCasesArchive />
                    </ShowOnlyVerifiedUser>
                  </Suspense>
                }
              />

              {/* Case Reports */}
              <Route
                path="case-reports"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ShowOnlyVerifiedUser>
                      <MainCaseReportList />
                    </ShowOnlyVerifiedUser>
                  </Suspense>
                }
              />
              <Route
                path="case-reports/add-report"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <CreateCaseReportForm />
                  </Suspense>
                }
              />
              <Route
                path="case-reports/soft-deleted-items"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ShowOnlyVerifiedUser>
                      <SoftDeletedReportsArchive />
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
                path="tasks/:id/update"
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
                path="billings/payments/client/:clientId/case/:caseId"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <PaymentMadeOnCase />
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
                path="record-documents"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <DocumentRecord />
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
                path="note-list"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <NoteList />
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

              {/* Calendar & Events */}
              <Route
                path="cause-list"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ShowOnlyVerifiedUser>
                      <CauseList />
                    </ShowOnlyVerifiedUser>
                  </Suspense>
                }
              />
              <Route
                path="events/:id/details"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <EventDetail />
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

            {/* 404 - Not Found (catch all) */}
            <Route path="*" element={<NotFound />} />
          </Route>,
        ),
      ),
    [],
  );

  // ============================================
  // THEME-AWARE TOAST CONTAINER
  // ============================================
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

  // ============================================
  // ANTD THEME (Memoized)
  // ============================================
  const antdTheme = useMemo(() => getAntdTheme(isDarkMode), [isDarkMode]);

  return (
    <ThemeProvider>
      <ConfigProvider theme={antdTheme}>
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <>
            <RouterProvider router={router} />
            <ToastContainer {...toastContainerProps} />
          </>
        )}
      </ConfigProvider>
    </ThemeProvider>
  );
}

export default App;
