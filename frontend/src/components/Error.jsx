import { useRouteError } from "react-router-dom";

const Error = () => {
  const error = useRouteError();
  console.log("ERROR", error);
  return <div>{/* <h1>{error}</h1> */}</div>;
};

export default Error;
