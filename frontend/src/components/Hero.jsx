import Button from "./Button";
import { FaPlay } from "react-icons/fa6";
import SummaryFeatures from "./SummaryFeatures";
import DetailsSection from "./DetailsSection";
import GetStarted from "./GetStarted";
import Header from "./Header";

const Hero = () => {
  return (
    <>
      <Header />
      <section className=" bg-gray-700">
        <div className="flex md:flex-col items-center  w-full gap-5 p-20   ">
          <div className="flex w-full flex-col md:pt-20  pt-14 mt-7 gap-5 items-center justify-center ">
            <h1 className="md:text-5xl text-5xl font-bold md:text-center text-left text-gray-100 w-full ">
              Case management{" "}
              <span className="text-slate-300">made simple</span> for law firms
            </h1>

            <p className=" w-full text-gray-300 mt-3 text-center">
              Software that manages your day to day office activities. A case
              management made easy.
            </p>
            <div>
              {" "}
              <Button>Register</Button>
              <Button>
                Watch Demo <FaPlay className="inline text-[12px]" />
              </Button>
            </div>
          </div>
        </div>
        <SummaryFeatures />
      </section>
      <DetailsSection />
      <GetStarted />
    </>
  );
};

export default Hero;
