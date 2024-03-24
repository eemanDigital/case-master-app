import { Link } from "react-router-dom";
import caseMasterLogo from "../assets/case-master-logo.svg";
import { RiCustomerService2Line } from "react-icons/ri";
import avatar from "../assets/avatar.png";
import { useState } from "react";
import { RxDashboard } from "react-icons/rx";
import {
  IoBriefcaseSharp,
  IoHelpCircleOutline,
  IoMenuOutline,
} from "react-icons/io5";
import { FaMoneyBill, FaTasks } from "react-icons/fa";
import { FaListUl } from "react-icons/fa6";
import { GrDocument } from "react-icons/gr";

const navItems = [
  {
    name: "Dashboard",
    path: "dashboard",
    icon: <RxDashboard />,
  },
  {
    name: "Cases",
    path: "cases",
    icon: <IoBriefcaseSharp />,
  },
  {
    name: "Tasks",
    path: "tasks",
    icon: <FaTasks />,
  },

  {
    name: "Billings",
    path: "billing",
    icon: <FaMoneyBill />,
  },
  {
    name: "Cause List",
    path: "cause-list",
    icon: <FaListUl />,
  },

  {
    name: "Documents",
    path: "documents",
    icon: <GrDocument />,
  },
  {
    name: "Clients",
    path: "client",
    icon: <RiCustomerService2Line />,
  },
  {
    name: "Help Center",
    path: "help-center",
    icon: <IoHelpCircleOutline />,
  },
];

const SideBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  // const [click, setClick] = useState(false);
  let mainNav = navItems.map((item, index) => {
    return (
      <>
        {/* menu items mapping */}
        <li className="my-3 hover:bg-gray-500  rounded-md">
          <Link
            to={item.path}
            className="flex  tracking-wider items-center gap-2 text-gray-200 hover:bg-gray-600 px-4 py-3 rounded-md"
            key={index}>
            <div className="text-2xl hover:text-gray-400  tooltip">
              {item.icon}
              {/* tooltip show */}
              {isOpen && (
                <span className="tooltiptext  shadow-md  ">{item.name}</span>
              )}
            </div>
            {/* sidebar toggle*/}
            <p
              className={`  transition-all  duration-700 ease-out   ${
                isOpen ? "hidden" : "flex"
              }`}>
              {item.name}
            </p>
          </Link>
        </li>
      </>
    );
  });
  return (
    <>
      <nav className="    md:py-0  md:flex flex-col items-start relative  z-50">
        {/* logo */}
        <div className=" bg-white  fixed pl-2 shadow-md w-full  z-50 ">
          <Link className="md:flex items-center gap-1 m-2 ">
            <img
              src={caseMasterLogo}
              alt="case master logo"
              className="w-12 h-12"
            />

            <span className=" text-2xl text-gray-600 font-bold tracking-wider ">
              case<span className="text-slate-400  font-bold ml-0 p-0">m</span>
              aster
            </span>
          </Link>
        </div>

        {/* menu */}
        <div
          className={`flex-col justify-between gap-4 shadow-md md:shadow-none items-center absolute  md:p-0  pt-10 md:pl-7 pl-2  md:z-auto z-[-1]  top-20   `}>
          <ul
            className={`bg-gradient-to-r from-slate-600 to-slate-800 bg-blend-lighten  md:flex flex-col  gap-4 md:p-5 p-2    rounded-md  justify-start transition-all  duration-400 ease-out ${
              isOpen ? "md:w-auto   " : " w-auto "
            } `}>
            {/* Hamburger icon*/}
            <div
              onClick={() => setIsOpen(!isOpen)}
              className=" text-4xl  text-gray-300 flex items-center justify-center cursor-pointer hover:text-gray-500 ">
              {isOpen ? <IoMenuOutline /> : <IoMenuOutline />}

              {/* <span className="tooltiptext">
              {!isOpen ? "close sidebar" : "open sidebar"}
            </span> */}
            </div>

            {/* profile */}
            <div className="flex flex-col gap-5 items-start  tooltip">
              <img
                src={avatar}
                alt=""
                className="w-12 h-12 mt-6  object-contain rounded-full"
              />
              <span className="tooltiptext">Profile</span>

              <h3 className={`text-gray-200 ${isOpen ? "hidden" : "flex"} `}>
                A.T. Lukman, Esq.
              </h3>
            </div>

            {mainNav}
          </ul>
        </div>
      </nav>
    </>
  );
};

export default SideBar;
