import { Button, Card } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { RESET, verifyUser } from "../redux/features/auth/authSlice";
import { useEffect } from "react";

const VerifyAccount = () => {
  const dispatch = useDispatch();
  const { token } = useParams();
  const { isLoading } = useSelector((state) => state.auth);

  // Reset success state on component mount
  useEffect(() => {
    dispatch(RESET());
  }, [dispatch]);

  // verify user handler
  const verifyUserAccount = async () => {
    await dispatch(verifyUser(token));
  };

  // Redirect to dashboard if verification is successful - this is not working as expected due to the way the success state is being handled, will fix this later
  // useEffect(() => {
  //   if (isSuccess) {
  //     navigate("/dashboard");
  //     dispatch(RESET()); // Reset the success state after navigation
  //   }
  // }, [isSuccess, navigate, dispatch]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <section className="w-full max-w-md p-4">
        <Card className="shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-4">
            Verify Your Account
          </h1>
          <p className="text-center mb-6">
            Click the button below to verify your account.
          </p>

          <div className="flex flex-col items-center text-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <Button
              loading={isLoading}
              onClick={verifyUserAccount}
              className="bg-blue-500 text-white w-full sm:w-auto">
              Verify Account
            </Button>
            <Button className="w-full sm:w-auto">
              <Link to="/dashboard" className="text-blue-500">
                Go Back To Dashboard
              </Link>
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default VerifyAccount;
