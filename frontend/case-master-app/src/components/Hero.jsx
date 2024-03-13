import Button from "./Button";
import { FaPlay } from "react-icons/fa6";

const Hero = () => {
  return (
    <section>
      <div className="flex md:flex-col items-center  w-full gap-5 p-20  bg-gray-700 ">
        <div className="flex w-full flex-col md:p-20 pt-14 gap-5 items-center justify-center ">
          <h1 className="md:text-6xl text-5xl font-bold md:text-center text-left text-gray-100 w-full">
            Case management <span className="text-slate-300"> made simple</span>{" "}
            for law firms
          </h1>

          <p className=" w-full text-gray-300 mt-3 text-center">
            Software that manages your day to day office activities. A case
            management made easy
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
    </section>
  );
};

export default Hero;
