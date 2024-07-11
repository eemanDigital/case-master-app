import ForgotPasswordReset from "./ForgotPasswordReset";

const ForgotPasswordResetClient = () => {
  return (
    <div>
      <ForgotPasswordReset endpoint="clients/resetpassword" />
    </div>
  );
};

export default ForgotPasswordResetClient;
