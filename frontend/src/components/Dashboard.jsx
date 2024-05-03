import { useAuthContext } from "../hooks/useAuthContext";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { Link } from "react-router-dom";
const Dashboard = () => {
  const { user } = useAuthContext();
  const { singleUser, loadingCases, errorCases } = useDataGetterHook();

  console.log(user);
  return (
    <>

    
      <div>
        <h1 className="text-4xl">Welcome, {user?.data?.user?.firstName}</h1>
      </div>
<Link to={``}  ></Link>
      <div>Your Task:</div>
    </>
  );
};

export default Dashboard;
