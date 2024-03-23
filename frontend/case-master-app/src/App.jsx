import { createBrowserRouter, RouterProvider } from "react-router-dom";
// import Layout from "./components/Layout";
// import Hero from "./components/Hero";
import SideBar from "./components/SideBar";
import ErrorPage from "./components/error-page";

import Root from "./components/Root";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Root />,
      errorElement: <ErrorPage />,
    },

    {
      path: "/admin",
      element: <SideBar />,
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
