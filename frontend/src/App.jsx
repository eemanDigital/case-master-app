import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  useLocation,
  Route,
  RouterProvider,
} from "react-router-dom";
import { useState } from "react";
import Hero from "./components/Hero";
import HomeLayout from "./components/HomeLayout";
import Dashboard from "./components/Dashboard.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import CaseList from "./pages/CaseList.jsx";
// import Task from "./pages/Task.jsx";
import Billing from "./pages/Billing.jsx";
import Login from "./pages/Login.jsx";
import AddUserForm from "./pages/AddUserForm.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Profile from "./pages/Profile.jsx";
import CaseReportList from "./pages/CaseReportList.jsx";
import CreateCaseForm from "./pages/CreateCaseForm.jsx";
import CreateCaseReportForm from "./pages/CreateCaseReportForm.jsx";
import AuthContextProvider from "./context/authContext.jsx";
import { DataFetcherContext } from "./context/dataFetcherContext.jsx";
import PhotoContextProvider from "./context/photoContext.jsx";
// import EditUserProfile from "./pages/EditUserProfile.jsx";
import UpdateCase from "./pages/UpdateCase.jsx";
// import UserTask from "./components/UserTask.jsx";
import TaskReminderForm from "./components/TaskReminderForm.jsx";
import CaseDetails from "./pages/CaseDetails.jsx";
import Error from "./components/Error.jsx";
import { Result, Button } from "antd";
import { Link } from "react-router-dom";
// import CaseDocument from "./pages/CaseDocuments.jsx";
import TaskAttachment from "./pages/TaskAttachment.jsx";
import LeaveAppForm from "./pages/LeaveAppForm.jsx";
import LeaveApplicationDisplay from "./pages/LeaveApplicationDisplay.jsx";
import LeaveApplicationDetails from "./pages/LeaveApplicationDetails.jsx";
import TaskList from "./components/TaskList.jsx";
import TaskDetails from "./pages/TaskDetails.jsx";
import ClientLists from "./pages/ClientLists.jsx";
import ClientDetails from "./pages/ClientDetails.jsx";
import InvoicePaymentHandler from "./components/InvoicePaymentHandler.jsx";
import ProtectedRoute from "./components/ProtectRoutes.jsx";
import ForgotPasswordReset from "./pages/ForgotPasswordReset.jsx";
import CreateInvoiceForm from "./components/CreateInvoiceForm.jsx";
// import InvoiceList from "./pages/InvoiceList.jsx";
import InvoiceDetails from "./pages/InvoiceDetails.jsx";
import UpdateInvoice from "./pages/UpdateInvoice.jsx";
import { CauseList } from "./components/CauseList.jsx";
import PaymentDetails from "./pages/PaymentDetails.jsx";
import StaffList from "./pages/StaffList.jsx";
import StaffDetails from "./pages/StaffDetails.jsx";

function App() {
  const [isOpen, setIsOpen] = useState(false);

  //handle hamburger toggling
  function handleOpen() {
    setIsOpen((prev) => !prev);
  }

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<HomeLayout />} errorElement={<Error />}>
        <Route path="/" element={<Hero />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/restPassword/:token" element={<ForgotPasswordReset />} />
        <Route path="/resetpassword" element={<ResetPassword />} />
        {/* 
        <Route
          path="dashboard"
          element={
            user ? (
              <DashboardLayout isOpen={isOpen} handleOpen={handleOpen} />
            ) : (
              <Navigate to="/login" />
            )
          }> */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute
              element={
                <DashboardLayout isOpen={isOpen} handleOpen={handleOpen} />
              }
            />
          }>
          <Route index element={<Dashboard />} />
          <Route path="add-user" element={<AddUserForm />} />
          <Route path="staff" element={<StaffList />} />
          <Route path="staff/:id/details" element={<StaffDetails />} />
          <Route path="cases" element={<CaseList open={isOpen} />} />
          <Route path="cases/:id/update" element={<UpdateCase />} />
          {/* <Route path="cases/:id/document" element={<CaseDocument />} /> */}
          {/* <Route path="create-case" element={<CreateCase />} /> */}
          <Route path="cases/add-case" element={<CreateCaseForm />} />
          <Route path="cases/:id/casedetails" element={<CaseDetails />} />
          <Route path="case-reports" element={<CaseReportList />} />
          <Route path="leave-application" element={<LeaveAppForm />} />
          <Route
            path="leave-application/:id/details"
            element={<LeaveApplicationDetails />}
          />
          <Route
            path="staff/leave-application-list"
            element={<LeaveApplicationDisplay />}
          />

          <Route
            path="case-reports/add-report"
            element={<CreateCaseReportForm />}
          />
          <Route path="billing" element={<Billing />} />
          {/* <Route path="documents" element={<CaseDocument />} /> */}
          <Route path="profile" element={<Profile />} />
          {/* <Route path="profile/edit" element={<EditUserProfile />} /> */}
          {/* <Route path="profile/edit-image" element={<UpdateProfilePicture />} /> */}
          <Route path="tasks" element={<TaskList />} />
          <Route path="tasks/reminder/:id" element={<TaskReminderForm />} />
          <Route path="tasks/upload" element={<TaskAttachment />} />
          {/* <Route path="tasks/:id" element={<UserTask />} /> */}
          <Route path="tasks/:id/details" element={<TaskDetails />} />
          <Route path="clients" element={<ClientLists />} />
          <Route path="clients/:id/details" element={<ClientDetails />} />
          <Route path="billings" element={<InvoicePaymentHandler />} />
          {/* <Route path="billings/invoice" element={<Invoi />} /> */}

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
          <Route path="cause-list" element={<CauseList />} />

          {/* errorElement= {<ErrorPage />} */}
        </Route>
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
      </Route>
    )
  );

  return (
    <PhotoContextProvider>
      <DataFetcherContext>
        <AuthContextProvider>
          <RouterProvider router={router} />
        </AuthContextProvider>
      </DataFetcherContext>
    </PhotoContextProvider>
  );
}

export default App;
