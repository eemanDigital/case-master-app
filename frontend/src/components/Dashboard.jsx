import { Link } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import { useDataFetch } from "../hooks/useDataFetch";
import { useEffect } from "react";
import { Button, Spin, Row, Col, Typography, Card, Badge, Divider } from "antd";
import { MdNotificationsActive, MdNotificationsOff } from "react-icons/md";
import { IoMdTime } from "react-icons/io";
import moment from "moment"; //time formatter
import TaskResponse from "./TaskResponse";
import LeaveBalanceDisplay from "./LeaveBalanceDisplay";
import CreateLeaveBalanceForm from "./CreateLeaveBalanceForm";
import TaskResponseForm from "./TaskResponseForm";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { GoLaw } from "react-icons/go";
import { FaBriefcase, FaUser } from "react-icons/fa6";
import { FaTasks } from "react-icons/fa";
import CreateTaskForm from "../pages/CreateTaskForm";
// import LeaveResponseForm from "./LeaveResponseForm";
// import LeaveApplicationDetails from "../pages/LeaveApplicationDetails";

const { Title, Text } = Typography;
const Dashboard = () => {
  const { user } = useAuthContext();
  const userId = user?.data?.user?._id;
  const { data, loading, error, dataFetcher } = useDataFetch();
  const { cases, users, tasks, reports } = useDataGetterHook();

  // console.log(userId);
  // get admin
  const isAdmin = user?.data?.user?.role === "admin";
  const isAdminOrHr =
    user?.data?.user?.role === "admin" || user?.data?.user?.role === "hr";

  useEffect(() => {
    if (userId) {
      // Use userId for conditional check
      dataFetcher(`users/${userId}`, "GET"); // Fetch user data using id
    }
  }, [userId]);

  const btnStyle = "bg-blue-500 text-white  rounded-md";

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
              <Button className={btnStyle}>Get Detail</Button>
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

  // const numberStyle = "text-5xl font-bold text-red-600";
  return (
    <>
      <Title level={1}>Dashboard</Title>

      <Row>
        <Col>
          <Title level={4}>Welcome, {user?.data?.user?.firstName}</Title>
        </Col>
      </Row>
      <Divider />
      <Row gutter={16}>
        <Col>
          <Badge count={cases?.results}>
            <FaBriefcase className="text-3xl text-blue-600" />
          </Badge>
          <Text>Number of Cases</Text>
        </Col>
        <Col>
          <Badge count={users?.results}>
            <FaUser className="text-3xl text-blue-600" />
          </Badge>
          <Text>Number of Staff</Text>
        </Col>
        <Col>
          <Badge count={6}>
            <GoLaw className="text-3xl text-blue-600" />
          </Badge>
          <Text>Number of lawyers</Text>
        </Col>
        <Col>
          <Badge count={tasks?.results}>
            <FaTasks className="text-3xl text-blue-600" />
          </Badge>
          <Text>Number of Assigned Tasks</Text>
        </Col>
      </Row>
      <Divider />
      <Row gutter={16}>
        {isAdmin && (
          <Col>
            <Link to="add-user">
              <Button className={btnStyle}>Add User</Button>
            </Link>
          </Col>
        )}
        <Col>
          <Link to="leave-application">
            <Button className={btnStyle}>Apply for leave</Button>
          </Link>
        </Col>
        {<LeaveBalanceDisplay userId={userId} /> ? (
          <Col>
            <LeaveBalanceDisplay userId={userId} />
          </Col>
        ) : (
          <Col>You are not entitled to leave yet</Col>
        )}

        <Col>
          <Link to="leave-application-list">
            {isAdminOrHr ? (
              <Button className={btnStyle}>Manage Leave Applications</Button>
            ) : (
              <Button className={btnStyle}>Your Leave Applications</Button>
            )}
          </Link>
        </Col>

        <Col>
        <CreateTaskForm/>
        </Col>
      </Row>
      {isAdmin && <CreateLeaveBalanceForm />}
      <Row gutter={16}>
        <Col>
          <Card title="Your Tasks" bordered={false}>
            {userTask}
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Dashboard;
