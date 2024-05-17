import { Link, useParams } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import { useDataFetch } from "../hooks/useDataFetch";
import { useEffect } from "react";
import Button from "./Button";
import { Spin } from "antd";
import { MdNotificationsActive, MdNotificationsOff } from "react-icons/md";
import { IoMdTime } from "react-icons/io";
import moment from "moment"; //time formatter

const Dashboard = () => {
  const { user } = useAuthContext();
  const userId = user?.data?.user?._id;
  const { data, loading, error, dataFetcher } = useDataFetch();

  console.log(data);

  useEffect(() => {
    if (userId) {
      // Use userId for conditional check
      dataFetcher(`users/${userId}`, "GET"); // Fetch user data using id
    }
  }, [userId]);

  const btnStyle = "bg-gray-700 p-2 text-gray-200 text-[10px] rounded-md";

  const userTask = data?.data?.task ? (
    data?.data?.task.length > 0 ? ( // Check if task array exists and has elements
      data?.data?.task.map((t) => (
        <div key={t._id} className=" bg-gray-400 p-3 rounded-md mt-3">
          {/* <h1 className="text-3xl">Your Tasks</h1> */}
          <div className=" inline-flex  items-end bg-red-800  text-white rounded-md p-2 ">
            <small>
              {/* REMINDER */}
              {t.reminder?.message ? (
                <>
                  <div className="flex justify-between gap-3 w-[320px]">
                    <span>
                      <MdNotificationsActive className="text-3xl text-white" />{" "}
                      Reminder:{" "}
                    </span>
                    <span>
                      {" "}
                      <IoMdTime className="text-3xl text-white" />{" "}
                      {moment(t.reminder?.timestamp).startOf().fromNow()}
                    </span>
                  </div>
                  {t.reminder?.message}
                </>
              ) : (
                <MdNotificationsOff />
              )}
            </small>
          </div>
          <div>
            <small className="block">{t.title}</small>
            <Link to={`tasks/${t._id}`}>
              <Button buttonStyle={btnStyle}>Get Detail</Button>
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

      <div className=" shadow-md p-3 rounded-md bg-gray-200">
        <h3 className="text-2xl  font-semibold">Your Tasks</h3>
        {userTask}
      </div>
    </div>
  );
};

export default Dashboard;
