import { Link } from "react-router-dom";
import caseMasterLogo from "../assets/case-master-logo.svg";

const DashboardNav = () => {
  return (
    <nav className="fixed w-full bg-white shadow-md z-50 p-2">
      <Link to="/" className="flex items-center gap-2">
        <img
          src={caseMasterLogo}
          alt="case master logo"
          className="w-10 h-10"
        />
        <span className="text-2xl text-gray-600 font-bold tracking-wide">
          case<span className="text-slate-400 font-bold">m</span>aster
        </span>
      </Link>
    </nav>
  );
};

export default DashboardNav;
