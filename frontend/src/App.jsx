import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import HomeLayout from "./components/HomeLayout";
import Dashboard from "./components/Dashboard.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import CaseList from "./pages/CaseList.jsx";
import AddUserForm from "./pages/AddUserForm.jsx";
import Profile from "./pages/Profile.jsx";
import CreateCaseForm from "./pages/CreateCaseForm.jsx";
import CreateCaseReportForm from "./pages/CreateCaseReportForm.jsx";
import UpdateCase from "./pages/UpdateCase.jsx";
// import TaskReminderForm from "./components/TaskReminderForm.jsx";
import CaseDetails from "./pages/CaseDetails.jsx";
import Error from "./components/Error.jsx";
import { Result, Button } from "antd";
import { Link } from "react-router-dom";
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
import MainCaseReportList from "./pages/MainCaseReportList.jsx";
import PaymentMadeOnCase from "./pages/PaymentMadeOnCase.jsx";
import VerifyAccount from "./components/VerifyAccount.jsx";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLoginStatus, getUser } from "./redux/features/auth/authSlice.js";
import { setLoading } from "./redux/features/loader/loadingSlice.js";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ForgotPasswordReset from "./pages/ForgotPasswordReset.jsx";
import LoginWithCode from "./components/LoginWithCode.jsx";
import LeaveBalanceList from "./pages/leaveBalanceList.jsx";
import DocumentForm from "./pages/DocumentsForm.jsx";
import ContactForm from "./components/ContactForm.jsx";
import EventDetail from "./pages/EventDetail.jsx";
import {
  BillingAndPaymentsRoute,
  ShowOnlyVerifiedUser,
  ShowStaff,
} from "./components/protect/Protect.jsx";
import Login from "./pages/Login.jsx";
import HomePage from "./components/HomePage.jsx";
import NoteForm from "./pages/NoteForm.jsx";
import UpdateNote from "./pages/UpdateNote.jsx";
import NoteList from "./pages/NoteList.jsx";
import DocumentRecord from "./pages/DocumentRecord.jsx";
import DocumentRecordList from "./pages/DocumentRecordList.jsx";
import DocumentRecordDetails from "./pages/DocumentRecordDetails.jsx";
// import EditTaskForm from "./pages/EditTaskForm.jsx";

// enable axios to get credentials everywhere in the app
axios.defaults.withCredentials = true;

function App() {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.loading);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

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
  }, [dispatch, isLoggedIn]);

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<HomeLayout />} errorElement={<Error />}>
        <Route index element={<HomePage />} />

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
        {/* <Route element={<AppLayout />}> */}

        <Route path="/users/login" element={<Login />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/resetPassword/:token" element={<ForgotPasswordReset />} />

        <Route path="/loginWithCode/:email" element={<LoginWithCode />} />
        <Route
          path="dashboard/verify-account/:token"
          element={<VerifyAccount />}
        />
        {/* <Route element={<ShowOnLoginAndRedirect />}> */}
        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="staff/add-user" element={<AddUserForm />} />
          <Route path="add-notes" element={<NoteForm />} />
          <Route path="note-list" element={<NoteList />} />
          <Route path="update-note/:id" element={<UpdateNote />} />

          <Route
            path="staff"
            element={
              <ShowOnlyVerifiedUser>
                <ProtectedRoute isStaffRoute={true}>
                  <StaffList />
                </ProtectedRoute>
              </ShowOnlyVerifiedUser>
            }
          />
          <Route path="staff/:id/details" element={<StaffDetails />} />
          <Route
            path="cases"
            element={
              <ShowOnlyVerifiedUser>
                <CaseList />
              </ShowOnlyVerifiedUser>
            }
          />

          <Route path="cases/:id/update" element={<UpdateCase />} />
          <Route path="cases/add-case" element={<CreateCaseForm />} />
          <Route path="cases/:id/casedetails" element={<CaseDetails />} />

          <Route
            path="case-reports"
            element={
              <ShowOnlyVerifiedUser>
                <MainCaseReportList />
              </ShowOnlyVerifiedUser>
            }
          />

          <Route path="leave-application" element={<LeaveAppForm />} />
          <Route
            path="staff/leave-application"
            element={
              <ShowOnlyVerifiedUser>
                <LeaveApplicationList />
              </ShowOnlyVerifiedUser>
            }
          />
          <Route
            path="staff/leave-balance"
            element={
              <ShowOnlyVerifiedUser>
                <LeaveBalanceList />
              </ShowOnlyVerifiedUser>
            }
          />

          <Route
            path="staff/leave-application/:id/details"
            element={<LeaveApplicationDetails />}
          />
          <Route
            path="documents"
            element={
              <ShowOnlyVerifiedUser>
                <ShowStaff>
                  <DocumentForm />
                </ShowStaff>
              </ShowOnlyVerifiedUser>
            }
          />
          <Route
            path="case-reports/add-report"
            element={<CreateCaseReportForm />}
          />
          <Route path="profile" element={<Profile />} />
          <Route
            path="tasks"
            element={
              <ShowOnlyVerifiedUser>
                <TaskList />
              </ShowOnlyVerifiedUser>
            }
          />

          {/* <Route path="tasks/reminder/:id" element={<TaskReminderForm />} /> */}
          <Route path="tasks/:id/details" element={<TaskDetails />} />
          {/* <Route path="tasks/:id/update" element={<EditTaskForm />} /> */}

          <Route
            path="clients"
            element={
              <ShowOnlyVerifiedUser>
                <ClientLists />
              </ShowOnlyVerifiedUser>
            }
          />
          <Route path="clients/:id/details" element={<ClientDetails />} />

          {/* billing/payment/invoice */}
          {/* <Route path="billings/invoices/:id/update" element={<BillingAndPaymentsRoute element={<UpdateInvoice />} />} /> */}
          <Route
            path="billings"
            element={
              <ShowOnlyVerifiedUser>
                <BillingAndPaymentsRoute element={<InvoicePaymentHandler />} />
              </ShowOnlyVerifiedUser>
            }
          />

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
          {/* /////////////////////////////////// */}
          <Route
            path="cause-list"
            element={
              <ShowOnlyVerifiedUser>
                <CauseList />
              </ShowOnlyVerifiedUser>
            }
          />
          <Route path="contact-dev" element={<ContactForm />} />
          <Route path="events/:id/details" element={<EventDetail />} />
          <Route path="record-document-list" element={<DocumentRecordList />} />
          <Route path="record-documents" element={<DocumentRecord />} />
          <Route
            path="record-document-list/:id/details"
            element={<DocumentRecordDetails />}
          />
        </Route>
      </Route>
      // </Route>
      // </Route>
    )
  );

  return (
    <>
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <RouterProvider router={router} />
          <ToastContainer />
        </>
      )}
    </>
  );
}

export default App;
