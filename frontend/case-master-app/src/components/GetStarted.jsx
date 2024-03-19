import Button from "../components/Button";
const GetStarted = () => {
  return (
    <>
      <div className=" py-44 px-6  my-44 bg-gradient-to-r from-slate-600 to-slate-800 bg-blend-lighten text-center ">
        <h1 className="text-6xl font-extrabold  mb-3 text-gray-300 ">
          Get started today
        </h1>
        <p className=" text-slate-300">
          It is time to take control of your law firm. Buy our software ease
          your law practice and be productive.
        </p>
        <Button className="text-slate-300">Get 3 months trial</Button>
      </div>
    </>
  );
};

export default GetStarted;
