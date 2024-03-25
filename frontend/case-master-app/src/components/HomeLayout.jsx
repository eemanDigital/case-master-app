// import Header from "./Header";
import { Outlet } from "react-router-dom";

const HomeLayout = () => {
  return (
    <>
      {/* <Header /> */}
      <Outlet />
    </>
  );
};

export default HomeLayout;
