import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import caseMasterLogo from "../assets/case-master-logo.svg";
import { RiMenu3Fill } from "react-icons/ri";
import { AiOutlineClose } from "react-icons/ai";
import { ShowOnLogin, ShowOnLogout } from "./protect/Protect";

const navItems = [
  { name: "Features", path: "#feature" },
  { name: "Testimonials", path: "#testimonials" },
  { name: "Pricing", path: "#pricing" },
];

const NavItem = ({ item, mobile, scrolled }) => (
  <li className={`my-2 list-none ${mobile ? "text-lg" : "md:my-0"}`}>
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `transition duration-300 block font-medium ${
          mobile
            ? "text-gray-800 hover:text-gray-600"
            : scrolled
            ? "text-gray-700 hover:text-gray-900"
            : "text-gray-300 hover:text-white"
        } ${isActive ? "font-bold" : ""}`
      }>
      {item.name}
    </NavLink>
  </li>
);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // scroll side effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener("scroll", handleScroll);
    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md text-gray-800" : "bg-transparent"
      }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={caseMasterLogo}
              alt="case master logo"
              className="w-10 h-10"
            />
            <span
              className={`text-2xl font-bold tracking-wider ${
                scrolled ? "text-gray-800" : "text-white"
              }`}>
              case<span className="text-blue-400">m</span>aster
            </span>
          </Link>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item, index) => (
                <NavItem key={index} item={item} scrolled={scrolled} />
              ))}
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <ShowOnLogout>
                <NavLink
                  to="/users/login"
                  className="btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium mr-2 transition duration-300">
                  Login
                </NavLink>
              </ShowOnLogout>
              <ShowOnLogin>
                <NavLink
                  to="/dashboard"
                  className="btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium mr-2 transition duration-300">
                  Dashboard
                </NavLink>
              </ShowOnLogin>
              <NavLink
                to="/get-started"
                className="btn bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-300">
                Get Started
              </NavLink>
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md ${
                scrolled
                  ? "text-gray-800 hover:text-gray-600"
                  : "text-white hover:text-gray-300"
              } focus:outline-none transition duration-300`}>
              {isOpen ? (
                <AiOutlineClose size={24} />
              ) : (
                <RiMenu3Fill size={24} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-screen" : "max-h-0"
        } overflow-hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
          {navItems.map((item, index) => (
            <NavItem
              key={index}
              item={item}
              mobile={true}
              scrolled={scrolled}
            />
          ))}
          <div className="mt-4 space-y-2">
            <ShowOnLogout>
              <NavLink
                to="/users/login"
                className="btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium block text-center transition duration-300">
                Login
              </NavLink>
            </ShowOnLogout>
            <ShowOnLogin>
              <NavLink
                to="/dashboard"
                className="btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium block text-center transition duration-300">
                Dashboard
              </NavLink>
            </ShowOnLogin>
            <NavLink
              to="#get-started"
              className="btn bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium block text-center transition duration-300">
              Get Started
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

NavItem.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
  }).isRequired,
  mobile: PropTypes.bool,
  scrolled: PropTypes.bool,
};
export default Navbar;
