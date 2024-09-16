import React from "react";
import Header from "./Header";
import PropTypes from "prop-types";

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
      <Header />

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
            {/* <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Button
                primary
                onClick={() => console.log("Get Started clicked")}>
                Get Started
              </Button>
              <Button onClick={() => console.log("Learn More clicked")}>
                Learn More
              </Button>
            </div> */}
          </div>
        </section>

        {/* <section className="py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {["Intuitive Interface", "Advanced Analytics", "Secure Data"].map(
              (feature, index) => (
                <div
                  key={index}
                  className="bg-gray-700 p-6 rounded-lg shadow-lg text-center">
                  <h3 className="text-xl font-semibold mb-2">{feature}</h3>
                  <p className="text-gray-300">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                </div>
              )
            )}
          </div>
        </section> */}
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

Button.propTypes = {
  children: PropTypes.node.isRequired,
  primary: PropTypes.bool,
  onClick: PropTypes.func,
};

export default HomePage;
