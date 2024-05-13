import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import { useState } from "react";
import Hero from "./components/Hero";
import HomeLayout from "./components/HomeLayout";
import Dashboard from "./components/Dashboard.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import Cases from "./pages/Cases.jsx";
// import Task from "./pages/Task.jsx";
import Billing from "./pages/Billing.jsx";
import Login from "./pages/Login.jsx";
import SignUp from "./pages/SignUp.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Profile from "./pages/Profile.jsx";
import TasksForm from "./pages/CreateTaskForm.jsx";
import CaseReports from "./pages/CaseReports.jsx";
import CreateCaseForm from "./pages/CreateCaseForm.jsx";
import CreateCaseReportForm from "./pages/CreateCaseReportForm.jsx";
import AuthContextProvider from "./context/authContext.jsx";
import { DataFetcherContext } from "./context/dataFetcherContext.jsx";
import PhotoContextProvider from "./context/photoContext.jsx";

import EditUserProfile from "./pages/EditUserProfile.jsx";
import UpdateCase from "./pages/UpdateCase.jsx";
import UserTask from "./components/UserTask.jsx";
import CaseDetails from "./pages/CaseDetails.jsx";
import Error from "./components/Error.jsx";
import { Result, Button } from "antd";
import { Link } from "react-router-dom";
import Document from "./pages/Documents.jsx";
import CaseDocument from "./pages/CaseDocument.jsx";

// import UpdateProfilePicture from "./components/UpdateProfilePicture.jsx";
// import CreateCase from "./pages/CreateCase.jsx";
// import CaseForm from "./pages/CaseForm.jsx";

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
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/resetpassword" element={<ResetPassword />} />

        <Route
          path="dashboard"
          element={<DashboardLayout isOpen={isOpen} handleOpen={handleOpen} />}>
          <Route index element={<Dashboard />} />
          <Route path="cases" element={<Cases open={isOpen} />} />
          <Route path="cases/:id/update" element={<UpdateCase />} />
          <Route path="cases/:id/document" element={<CaseDocument />} />
          {/* <Route path="create-case" element={<CreateCase />} /> */}
          <Route path="cases/add-case" element={<CreateCaseForm />} />
          <Route path="cases/:id/casedetails" element={<CaseDetails />} />
          <Route path="case-reports" element={<CaseReports />} />
          <Route
            path="case-reports/add-report"
            element={<CreateCaseReportForm />}
          />
          {/* <Route path="tasks" element={<Task />} /> */}
          <Route path="tasks/add-task" element={<TasksForm />} />
          <Route path="billing" element={<Billing />} />
          <Route path="documents" element={<Document />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/edit" element={<EditUserProfile />} />
          {/* <Route path="profile/edit-image" element={<UpdateProfilePicture />} /> */}
          <Route path="tasks/:id" element={<UserTask />} />

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
