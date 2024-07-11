import Login from "../components/Login";

const ClientLogin = () => {
  return (
    <div>
      <Login
        endpoint="clients/login"
        title="Client Login Page"
        forgotPasswordLink="/forgotpassword/clients"
      />
    </div>
  );
};

export default ClientLogin;
