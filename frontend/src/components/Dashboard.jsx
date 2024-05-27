import { Link, useParams } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import { useDataFetch } from "../hooks/useDataFetch";
import { useEffect } from "react";
import Button from "./Button";
import { Spin } from "antd";
import {
  MdDone,
  MdNotificationsActive,
  MdNotificationsOff,
} from "react-icons/md";
import { IoMdTime } from "react-icons/io";
import moment from "moment"; //time formatter
import TaskResponse from "./TaskResponse";
import TaskResponseForm from "./TaskResponseForm";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { GoLaw } from "react-icons/go";
import { FaBriefcase, FaUser } from "react-icons/fa6";
import { FaTasks } from "react-icons/fa";

const Dashboard = () => {
  const { user } = useAuthContext();
  const userId = user?.data?.user?._id;
  const { data, loading, error, dataFetcher } = useDataFetch();
  const { cases, users, tasks, reports } = useDataGetterHook();

  // // number of cases
  // const numberOfCases = cases.results;
  // const numberOfUsers = users.results;
  // const numberOfTasks = tasks.results;
  // const numberOfReports = reports.results;
  // const reminderAvailable = data?.data?.task.map((t) => {
  //   console.log(t);
  // });
  // console.log("REM", reminderAvailable);

  console.log(user.annualLeaveEntitled);

  useEffect(() => {
    if (userId) {
      // Use userId for conditional check
      dataFetcher(`users/${userId}`, "GET"); // Fetch user data using id
    }
  }, [userId]);

  const btnStyle = "bg-gray-700 p-2 text-gray-200 text-[10px] rounded-md";

  // MAPPING TASK DATA
  const userTask = data?.data?.task ? (
    data?.data?.task.length > 0 ? ( // Check if task array exists and has elements
      data?.data?.task.map((t) => (
        <div key={t._id} className=" bg-gray-400 p-3 rounded-md mt-3">
          <TaskResponseForm taskId={t._id} />

          <div className=" inline-flex  items-end bg-red-800  text-white rounded-md p-2 ">
            <small>
              {/* REMINDER */}
              {t.reminder?.message ? (
                <>
                  <div className="flex justify-between gap-3 w-[320px]">
                    <span>
                      <MdNotificationsActive className="text-2xl text-white" />{" "}
                      Reminder:{" "}
                    </span>
                    <span>
                      {" "}
                      <IoMdTime className="text-2xl text-white" />{" "}
                      {/* formatted time */}
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
          <div className="mt-1">
            {/* TASK RENDERING */}
            <h4 className="font-bold ">Task Title</h4>
            <small className="block m-1">{t.title}</small>
            <Link to={`tasks/${t._id}`}>
              <Button buttonStyle={btnStyle}>Get Detail</Button>
            </Link>

            {/* TASK RESPONSE */}
            <TaskResponse task={t} />
          </div>
        </div>
      ))
    ) : (
      // Display message if no tasks
      <h2 className="">You currently do not have any tasks</h2>
    )
  ) : (
    <div className="mt-5 ">
      <Spin tip="Loading task" size="small">
        <div className="content" />
      </Spin>
    </div> // Display loading message while data is fetched
  );

  const numberStyle = "text-5xl font-bold text-red-600";
  return (
    <>
      <Link to="add-user">
        <Button>Add User</Button>
      </Link>
      <div className="flex justify-between">
        <h1 className="text-4xl">Welcome, {user?.data?.user?.firstName}</h1>

        <div className=" shadow-md p-3 rounded-md bg-gray-200 w-[400px]">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl  font-semibold">Your Tasks</h3>
          </div>
          {userTask}
        </div>
      </div>
      <div className="flex justify-between  gap-4 mt-5">
        <div className="text-3xl ">
          <FaBriefcase className="text-3xl text-blue-600" />
          Number of Cases: <p className={numberStyle}> {cases.results}</p>
        </div>
        <div className="text-3xl ">
          <FaUser className="text-3xl text-blue-600" />
          Number of Staff: <p className={numberStyle}> {users.results}</p>
        </div>
        <div className="text-3xl ">
          <GoLaw className="text-3xl text-blue-600" />
          Number of lawyers:
          <p className={numberStyle}> 6 </p>
        </div>
        <div className="text-3xl ">
          <FaTasks className="text-3xl text-blue-600" />
          Number of Assigned Tasks:{" "}
          <p className={numberStyle}>{tasks.results}</p>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
