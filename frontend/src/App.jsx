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
import Task from "./pages/Task.jsx";
import Billing from "./pages/Billing.jsx";
import Login from "./pages/Login.jsx";
import SignUp from "./pages/SignUp.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Profile from "./pages/Profile.jsx";
import CaseReport from "./pages/CaseReport.jsx";
import AuthContextProvider from "./context/authContext.jsx";
import { DataFetcherContext } from "./context/dataFetcherContext.jsx";
import EditUserProfile from "./pages/EditUserProfile.jsx";
// import CreateCase from "./pages/CreateCase.jsx";
import CaseForm from "./pages/CaseForm.jsx";

function App() {
  const [isOpen, setIsOpen] = useState(false);

  //handle hamburger toggling
  function handleOpen() {
    setIsOpen((prev) => !prev);
  }

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<HomeLayout />}>
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
          {/* <Route path="create-case" element={<CreateCase />} /> */}
          <Route path="add-case" element={<CaseForm />} />
          <Route path="add-report" element={<CaseReport />} />
          <Route path="tasks" element={<Task />} />
          <Route path="billing" element={<Billing />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/edit" element={<EditUserProfile />} />

          {/* errorElement= {<ErrorPage />} */}
        </Route>
      </Route>
    )
  );

  return (
    <DataFetcherContext>
      <AuthContextProvider>
        <RouterProvider router={router} />
      </AuthContextProvider>
    </DataFetcherContext>
  );
}

export default App;
