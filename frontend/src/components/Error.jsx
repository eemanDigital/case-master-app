import { useRouteError } from "react-router-dom";

const Error = () => {
  const error = useRouteError();

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="max-w-lg w-full text-center p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong.</h2>
        <p className="text-gray-700">
          {error?.message ||
            "An unexpected error occurred. Please try again later."}
        </p>
      </div>
    </div>
  );
};

export default Error;
