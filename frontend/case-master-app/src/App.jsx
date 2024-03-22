import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import Layout from "./components/Layout";
import Hero from "./components/Hero";
import SideBar from "./components/SideBar";

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Layout />}>
        <Route path="/" element={<Hero />} />
        <Route path="admin/" element={<SideBar />} />
      </Route>
    )
  );
  return (
    <>
      {/* <Header /> */}
      {/* <Hero /> */}

      <RouterProvider router={router} />
    </>
  );
}

export default App;
