import DashboardNav from "./DashboardNav.jsx";

import SideBar from "./SideBar.jsx";
import { Outlet } from "react-router-dom";
// import { useState } from "react";

const DashboardLayout = ({ isOpen, handleOpen }) => {
  return (
    <>
      <DashboardNav />
      <div className="flex gap-4 justify-start md:mt-20 mt-28  p-6">
        <SideBar isOpen={isOpen} handleOpen={handleOpen} />
        <div className=" bg-gray-100 rounded-md  w-screen  shadow-inner p-8 md:h-[948px] h-[700px] overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;
