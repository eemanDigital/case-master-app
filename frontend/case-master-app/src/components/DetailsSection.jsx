import screenshot1 from "../assets/casemastershot.png";

const DetailsSection = () => {
  let card = {
    div: "bg-gradient-to-r from-slate-600 to-slate-800 bg-blend-lighten md:w-[50%] w-full p-10  rounded-md",
    h1: " text-xl text-slate-200  font-bold tracking-wider",
    p: " text-slate-200 mt-2",
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center  p-10  mt-10 ">
        <h1 className="text-5xl text-gray-600 font-bold md:w-[70%]  w-full text-center leading-[1.2]  ">
          Everything you need to run your law office.
        </h1>
        <p className="text-gray-600">
          Well everything you need if you are not that picky about minor details
          like case update
        </p>
      </div>

      <div className="flex justify-center items-center relative ">
        <div className="flex flex-col gap-5 p-4  z-2">
          <div className={card.div}>
            <h1 className={card.h1}>Case Analyses </h1>
            <p className={card.p}>
              Well everything you need if you are not that picky about minor
              details like case update
            </p>
          </div>
          <div className={card.div}>
            <h1 className={card.h1}>Efficiency</h1>
            <p className={card.p}>
              Well everything you need if you are not that picky about minor
              details like case update. Lorem ipsum dolor sit consectetur under.
            </p>
          </div>
          <div className={card.div}>
            <h1 className={card.h1}>One stop place for case management</h1>
            <p className={card.p}>
              Well everything you need if you are not that picky about minor
              details like case update
            </p>
          </div>
          <div className={card.div}>
            <h1 className={card.h1}>Easy to use</h1>
            <p className={card.p}>
              Well everything you need if you are not that picky about minor
              details like case update. Lorem ipsum dolor sit emmet.
            </p>
          </div>
        </div>
        <div className=" w-[900px]  h-[500px]   md:block   hidden   bg-cover absolute top-10  -z-10 -right-60">
          <img
            className=""
            src={screenshot1}
            alt="case master app screenshot"
          />
        </div>
      </div>
    </>
  );
};

export default DetailsSection;
