import { useAuthContext } from "../hooks/useAuthContext";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
const Dashboard = () => {
  const { user } = useAuthContext();
  // const { users, loadingCases, errorCases } = useDataGetterHook();

  console.log(user);
  return (
    <>
      <div>
        <h1 className="text-4xl">Welcome, {user?.data?.user?.firstName}</h1>
      </div>

      <div>Your Task:</div>
    </>
  );
};

export default Dashboard;
