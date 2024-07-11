import ForgotPassword from "./ForgotPassword";

const ForgotPasswordStaff = () => {
  return (
    <div>
      <ForgotPassword endpoint="users/forgotpassword" />
    </div>
  );
};

export default ForgotPasswordStaff;
