import { FaPlay } from "react-icons/fa6";
import Header from "./Header";
import SummaryFeatures from "./SummaryFeatures";
import PropTypes from "prop-types";

const Button = ({ children, primary }) => (
  <button
    className={`px-6 py-2 rounded-full font-semibold ${
      primary ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
    } hover:opacity-90 transition duration-300`}>
    {children}
  </button>
);

const HomePage = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />

      <main>
        <section className="bg-gray-800 text-white py-36  ">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Case Management{" "}
                <span className="text-blue-400">Made Simple</span> for Law Firms
              </h1>
              <p className="text-xl mb-8">
                Streamline your day-to-day office activities with our intuitive
                case management software.
              </p>
              <div className="space-x-4">
                <Button primary>Get Started</Button>
                <Button>
                  Watch Demo <FaPlay className="inline ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        <SummaryFeatures />

        <section className="bg-blue-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Simplify Your Case Management?
            </h2>
            <p className="text-xl mb-8">
              Join thousands of law firms already using casemaster
            </p>
            <Button>Start Your Free Trial</Button>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 casemaster. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  primary: PropTypes.bool,
};
export default HomePage;
