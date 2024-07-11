import ForgotPasswordReset from "./ForgotPasswordReset";

const ForgotPasswordResetStaff = () => {
  return (
    <div>
      <ForgotPasswordReset endpoint="users/resetpassword" />
    </div>
  );
};

export default ForgotPasswordResetStaff;
