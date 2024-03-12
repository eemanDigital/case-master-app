import Header from "./components/Header";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(<Route path="/" element={<Layout />}></Route>)
  );
  return (
    <>
      {/* <Header /> */}
      <RouterProvider router={router} />
    </>
  );
}

export default App;
