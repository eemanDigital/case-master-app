import { Link } from "react-router-dom";
import caseMasterLogo from "../assets/case-master-logo.svg";

const DashboardNav = () => {
  return (
    <nav className="md:py-0  md:flex flex-col items-start relative  z-50">
      {/* logo */}
      <div className=" bg-white top-0 fixed pl-2 shadow-md w-full  z-50 ">
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
    </nav>
  );
};

export default DashboardNav;
