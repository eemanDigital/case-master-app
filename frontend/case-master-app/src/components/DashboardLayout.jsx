import SideBar from "./SideBar.jsx";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <div>
      <SideBar />
      <Outlet />
    </div>
  );
};

export default DashboardLayout;
