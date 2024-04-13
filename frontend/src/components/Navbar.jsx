import { Link, NavLink } from "react-router-dom";
import caseMasterLogo from "../assets/case-master-logo.svg";
import { RiMenu3Fill } from "react-icons/ri";
import { AiOutlineClose } from "react-icons/ai";
import {} from "react-icons/ri";
import { useState } from "react";
import { useAuthContext } from "../hooks/useAuthContext";

const navItems = [
  {
    name: "Features",
    path: "feature",
  },
  {
    name: "Testimonials",
    path: "testimonials",
  },
  {
    name: "Pricing",
    path: "pricing",
  },
];

let mainNav = navItems.map((item, index) => {
  return (
    <>
      <li className="my-5">
        <NavLink className="hover:scale-110 tracking-wider" key={index}>
          {item.name}
        </NavLink>
      </li>
    </>
  );
});

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthContext();

  return (
    <nav className="md:px-10 px-8 md:py-0 py-2 md:flex items-center bg-white justify-between  z-50">
      {/* logo */}
      <div className=" gap-2 ">
        <Link className="md:flex items-center gap-1 ">
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

      {/* menu icon */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="   absolute right-6 top-8 cursor-pointer md:hidden">
        {isOpen ? <AiOutlineClose /> : <RiMenu3Fill />}
      </div>

      {/* menu */}
      <div
        className={`md:flex justify-between gap-4 shadow-md md:shadow-none items-center  text-gray-600 absolute md:static  md:p-0 pt-20 pl-7  md:z-auto z-[-1] w-full left-0 md:transition-all md:w-auto bg-white duration-700 md:ease-out ${
          isOpen ? "top-12" : "top-[-490px]"
        } `}>
        <ul className=" md:flex gap-4 pr-10 items-center justify-between ">
          {mainNav.slice(0, 3)}

          {!user ? (
            <li className="md:ml-10 btn bg-gray-600 px-3 py-2 text-slate-100  rounded-md block">
              <NavLink to="signup">Sign in</NavLink>
            </li>
          ) : (
            <li className="btn bg-gray-600 px-3 py-2 text-slate-100  rounded-md block ">
              <NavLink to="dashboard">Dashboard</NavLink>
            </li>
          )}
          <li className="my-4">
            <NavLink className=" btn bg-gray-600 px-3 py-2 text-slate-100  rounded-md block w-32 hover:bg-gray-500 md:static">
              Get Started
            </NavLink>
          </li>
        </ul>
      </div>
      {/* <ul className=" ">{mainNav.slice(3, 4)}</ul> */}
    </nav>
  );
};

export default Navbar;
