import DashboardNav from "./DashboardNav.jsx";

import SideBar from "./SideBar.jsx";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <>
      <DashboardNav />
      <div className="flex gap-5 justify-start md:mt-20 mt-24">
        <SideBar />
        <div className=" bg-gray-200 rounded-md  w-screen  shadow-inner p-5 md:h-screen h-[700px] overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;
