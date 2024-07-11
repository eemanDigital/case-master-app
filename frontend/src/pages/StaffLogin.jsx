import Login from "../components/Login";

const StaffLogin = () => {
  return (
    <div>
      <Login
        endpoint="users/login"
        title="Staff LogIn Page"
        forgotPasswordLink="/forgotpassword/staff"
      />
    </div>
  );
};

export default StaffLogin;
