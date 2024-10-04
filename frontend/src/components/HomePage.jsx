import React, { Suspense, lazy } from "react";
import PropTypes from "prop-types";

// Lazy load the Header component
const Header = lazy(() => import("./Header"));

const Button = ({ children, primary, onClick }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-full font-semibold transition duration-300 ${
      primary
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
    }`}>
    {children}
  </button>
);

const HomePage = () => {
  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen text-white">
      <Suspense fallback={<div>Loading...</div>}>
        <Header />
      </Suspense>

      <main className="container mx-auto px-4">
        <section className="py-20 md:py-36">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Case Management <span className="text-blue-400">Made Simple</span>
              <br className="hidden md:inline" /> for Law Firms
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-gray-300">
              Streamline your day-to-day office activities with our intuitive
              case management software.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p>
            &copy; {new Date().getFullYear()} Case Management Software. All
            rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Add prop types for Button component
Button.propTypes = {
  children: PropTypes.node.isRequired,
  primary: PropTypes.bool,
  onClick: PropTypes.func,
};

export default HomePage;
