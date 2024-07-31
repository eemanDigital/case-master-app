import { useDispatch, useSelector } from "react-redux";
import { useAdminHook } from "../hooks/useAdminHook";
import { RESET, sendVerificationMail } from "../redux/features/auth/authSlice";

const Notification = () => {
  const { isError, isSuccess, isLoading, message, user } = useSelector(
    (state) => state.auth
  );
  const { isStaff } = useAdminHook();
  const dispatch = useDispatch();
  const username = user?.data?.firstName;
  const userRole = user?.data?.role;
  const userPosition = user?.data?.position;

  //   send verifcation email handler
  const sendVeriEmail = async () => {
    await dispatch(sendVerificationMail());
    await dispatch(RESET());
  };

  return (
    <div className="border border-gray-300 rounded-lg bg-red-200 p-2 text-center">
      <h2 className="text-xl font-semibold mb-4">Account Verification</h2>
      <p className="mb-4">
        Hi, <span className="font-semibold">{username}</span>. You have just
        been {isStaff ? "appointed" : "registered"} as
        <span className="font-semibold px-1">
          {userRole === "client" ? userRole : userPosition}
        </span>
        at A.T. Lukman & Co. Please check your email to verify your account.
      </p>
      <p>
        If you did not receive the email, please check your spam folder or{" "}
        <a
          onClick={sendVeriEmail}
          className="text-blue-500 hover:underline cursor-pointer">
          click here
        </a>{" "}
        to resend the verification email.
      </p>
    </div>
  );
};

export default Notification;
