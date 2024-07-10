import Login from "../components/Login";

const ClientLogin = () => {
  return (
    <div>
      <Login endpoint="clients/login" title="Client Login Page" />
    </div>
  );
};

export default ClientLogin;
