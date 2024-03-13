import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import Layout from "./components/Layout";
import Hero from "./components/Hero";

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Layout />}>
        <Route path="/" element={<Hero />} />
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
