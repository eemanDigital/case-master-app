import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import Hero from "./components/Hero";
import HomeLayout from "./components/HomeLayout";
import Dashboard from "./components/Dashboard.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import CaseList from "./pages/CaseList.jsx";
import ClientLogin from "./pages/ClientLogin.jsx";
import AddUserForm from "./pages/AddUserForm.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Profile from "./pages/Profile.jsx";
import CreateCaseForm from "./pages/CreateCaseForm.jsx";
import CreateCaseReportForm from "./pages/CreateCaseReportForm.jsx";
import UpdateCase from "./pages/UpdateCase.jsx";
import TaskReminderForm from "./components/TaskReminderForm.jsx";
import CaseDetails from "./pages/CaseDetails.jsx";
import Error from "./components/Error.jsx";
import { Result, Button } from "antd";
import { Link } from "react-router-dom";
import TaskAttachment from "./pages/TaskAttachment.jsx";
import LeaveAppForm from "./pages/LeaveAppForm.jsx";
import LeaveApplicationList from "./pages/LeaveApplicationList.jsx";
import LeaveApplicationDetails from "./pages/LeaveApplicationDetails.jsx";
import TaskList from "./components/TaskList.jsx";
import TaskDetails from "./pages/TaskDetails.jsx";
import ClientLists from "./pages/ClientLists.jsx";
import ClientDetails from "./pages/ClientDetails.jsx";
import InvoicePaymentHandler from "./components/InvoicePaymentHandler.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import CreateInvoiceForm from "./components/CreateInvoiceForm.jsx";
import InvoiceDetails from "./pages/InvoiceDetails.jsx";
import UpdateInvoice from "./pages/UpdateInvoice.jsx";
import { CauseList } from "./components/CauseList.jsx";
import PaymentDetails from "./pages/PaymentDetails.jsx";
import StaffList from "./pages/StaffList.jsx";
import StaffDetails from "./pages/StaffDetails.jsx";
import StaffLogin from "./pages/StaffLogin.jsx";
import ForgotPasswordClient from "./pages/ForgotPasswordClient.jsx";
import ForgotPasswordStaff from "./pages/ForgotPasswordStaff.jsx";
import ForgotPasswordResetStaff from "./pages/ForgotPasswordResetStaff.jsx";
import ForgotPasswordResetClient from "./pages/ForgotPasswordResetClient.jsx";
import MainCaseReportList from "./pages/MainCaseReportList.jsx";
import PaymentMadeOnCase from "./pages/PaymentMadeOnCase.jsx";
import TwoFactorAuth from "./components/TwoFactorAuth.jsx";
import VerifyAccount from "./components/VerifyAccount.jsx";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getLoginStatus,
  getUser,
  selectIsLoggedIn,
  selectUser,
} from "./redux/features/auth/authSlice.js";
import { ShowOnLoginAndRedirect } from "./components/protect/Protect.jsx";
import { setLoading } from "./redux/features/loader/loadingSlice.js";
import LoadingSpinner from "./components/LoadingSpinner.jsx";

// enable axios to get credentials everywhere in the app
axios.defaults.withCredentials = true;

function App() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user = useSelector(selectUser);
  const isLoading = useSelector((state) => state.loading);

  useEffect(() => {
    async function checkAuthStatus() {
      dispatch(setLoading(true));
      const loginStatus = await dispatch(getLoginStatus()).unwrap();
      if (loginStatus) {
        await dispatch(getUser());
      }
      dispatch(setLoading(false));
    }
    checkAuthStatus();
  }, [dispatch]);

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<HomeLayout />} errorElement={<Error />}>
        <Route index element={<Hero />} />
        <Route path="/login" element={<StaffLogin />} />
        <Route path="/clients/login" element={<ClientLogin />} />
        <Route
          path="/forgotpassword/clients"
          element={<ForgotPasswordClient />}
        />
        <Route path="/forgotpassword" element={<ForgotPasswordStaff />} />
        <Route
          path="/resetPassword/:token"
          element={<ForgotPasswordResetStaff />}
        />
        <Route
          path="/resetPassword/clients/:token"
          element={<ForgotPasswordResetClient />}
        />
        <Route
          path="/two-factor-auth/users/:email"
          element={<TwoFactorAuth />}
        />
        <Route path="/resetpassword" element={<ResetPassword />} />
        <Route
          path="*"
          element={
            <Result
              status="404"
              title="404"
              subTitle="Sorry, the page you visited does not exist."
              extra={
                <Link to="/">
                  <Button type="primary">Back Home</Button>
                </Link>
              }
            />
          }
        />
        <Route element={<ShowOnLoginAndRedirect />}>
          <Route path="dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="verify-account/:token" element={<VerifyAccount />} />
            <Route path="add-user" element={<AddUserForm />} />
            <Route
              path="staff"
              element={
                <ProtectedRoute isStaffRoute={true}>
                  <StaffList />
                </ProtectedRoute>
              }
            />
            <Route path="staff/:id/details" element={<StaffDetails />} />
            <Route path="cases" element={<CaseList />} />
            <Route path="cases/:id/update" element={<UpdateCase />} />
            <Route path="cases/add-case" element={<CreateCaseForm />} />
            <Route path="cases/:id/casedetails" element={<CaseDetails />} />
            <Route path="case-reports" element={<MainCaseReportList />} />
            <Route path="leave-application" element={<LeaveAppForm />} />
            <Route
              path="staff/leave-application"
              element={<LeaveApplicationList />}
            />
            <Route
              path="staff/leave-application/:id/details"
              element={<LeaveApplicationDetails />}
            />
            <Route
              path="case-reports/add-report"
              element={<CreateCaseReportForm />}
            />
            <Route path="billings" element={<InvoicePaymentHandler />} />
            <Route path="profile" element={<Profile />} />
            <Route path="tasks" element={<TaskList />} />
            <Route path="tasks/reminder/:id" element={<TaskReminderForm />} />
            <Route path="tasks/upload" element={<TaskAttachment />} />
            <Route path="tasks/:id/details" element={<TaskDetails />} />
            <Route path="clients" element={<ClientLists />} />
            <Route path="clients/:id/details" element={<ClientDetails />} />
            <Route
              path="billings/invoices/add-invoices"
              element={<CreateInvoiceForm />}
            />
            <Route
              path="billings/invoices/:id/details"
              element={<InvoiceDetails />}
            />
            <Route
              path="billings/invoices/:id/update"
              element={<UpdateInvoice />}
            />
            <Route
              path="billings/payments/:id/details"
              element={<PaymentDetails />}
            />
            <Route
              path="billings/payments/client/:clientId/case/:caseId"
              element={<PaymentMadeOnCase />}
            />
            <Route path="cause-list" element={<CauseList />} />
          </Route>
        </Route>
      </Route>
    )
  );

  return (
    <>
      {isLoading && <LoadingSpinner />}
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
}

export default App;
