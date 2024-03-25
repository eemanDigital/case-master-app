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

        <Route
          path="dashboard"
          element={<DashboardLayout isOpen={isOpen} handleOpen={handleOpen} />}>
          <Route index element={<Dashboard />} />
          <Route path="cases" element={<Cases open={isOpen} />} />
          <Route path="tasks" element={<Task />} />
          <Route path="billing" element={<Billing />} />

          {/* errorElement= {<ErrorPage />} */}
        </Route>
      </Route>
    )
  );

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
