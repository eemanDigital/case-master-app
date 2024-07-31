import { Button, Card } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { RESET, verifyUser } from "../redux/features/auth/authSlice";
import LoadingSpinner from "./LoadingSpinner";

const VerifyAccount = () => {
  const dispatch = useDispatch();
  const { token } = useParams();
  const { isLoading } = useSelector((state) => state.auth);

  // verify user handler
  const verifyUserAccount = async () => {
    await dispatch(verifyUser(token));
    await dispatch(RESET());
  };

  return (
    <div>
      {isLoading && <LoadingSpinner />}
      <section>
        <div>
          <Card>
            <h1 className="text-2xl font-bold text-center">
              Verify Your Account
            </h1>
            <p className="text-center mb-6">
              Click the button below to verify your account.
            </p>

            <div className=" text-center space-y-4">
              <Button
                onClick={verifyUserAccount}
                className="bg-blue-500 text-white">
                Verify Account
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default VerifyAccount;
