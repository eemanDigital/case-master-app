import { Link, useParams } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import { useDataFetch } from "../hooks/useDataFetch";
import { useEffect } from "react";
import Button from "./Button";
import { Spin } from "antd";

const Dashboard = () => {
  const { user } = useAuthContext();
  const userId = user?.data?.user?._id;
  const { data, loading, error, dataFetcher } = useDataFetch();

  useEffect(() => {
    if (userId) {
      // Use userId for conditional check
      dataFetcher(`users/${userId}`, "GET"); // Fetch user data using id
    }
  }, [userId]);

  const userTask = data?.data?.task ? (
    data?.data?.task.length > 0 ? ( // Check if task array exists and has elements
      data?.data?.task.map((t) => (
        <div key={t._id} className="mt-2">
          {/* <h1 className="text-3xl">Your Tasks</h1> */}
          <div>
            <h1>{t.title}</h1>
            <Link to={`tasks/${t._id}`}>
              <Button className="">Get Detail</Button>
            </Link>
          </div>
        </div>
      ))
    ) : (
      // Display message if no tasks
      <h2 className="text text-blue-200">
        You currently do not have any tasks
      </h2>
    )
  ) : (
    <div className="mt-5 ">
      <Spin tip="Loading task" size="small">
        <div className="content" />
      </Spin>
    </div> // Display loading message while data is fetched
  );

  return (
    <div className="flex justify-between">
      <h1 className="text-4xl">Welcome, {user?.data?.user?.firstName}</h1>

      <div className="bg-red-500 p-3 rounded-md text-white">
        <h3 className="text-2xl  font-semibold">Your Tasks</h3>
        {userTask}
      </div>
    </div>
  );
};

export default Dashboard;
