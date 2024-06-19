import { Link } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import { useDataFetch } from "../hooks/useDataFetch";
import { useEffect } from "react";
import { Button, Spin, Row, Col, Typography, Card, Divider } from "antd";
import { MdNotificationsActive, MdNotificationsOff } from "react-icons/md";
import { IoMdTime } from "react-icons/io";
import moment from "moment"; // time formatter
import TaskResponse from "./TaskResponse";
import LeaveBalanceDisplay from "./LeaveBalanceDisplay";
import CreateLeaveBalanceForm from "./CreateLeaveBalanceForm";
import TaskResponseForm from "./TaskResponseForm";
import AddClientForm from "./AddClientForm";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { GoLaw } from "react-icons/go";
import { FaBriefcase, FaUser, FaTasks } from "react-icons/fa";
import CreateTaskForm from "../pages/CreateTaskForm";
import LeaveBalanceList from "../pages/leaveBalanceList";

const { Title, Text } = Typography;

const Dashboard = () => {
  const { user } = useAuthContext();
  const userId = user?.data?.user?._id;
  const { data, loading, error, dataFetcher } = useDataFetch();
  const { cases, users, tasks } = useDataGetterHook();

  const isAdmin = user?.data?.user?.role === "admin";
  const isAdminOrHr =
    user?.data?.user?.role === "admin" || user?.data?.user?.role === "hr";

  useEffect(() => {
    if (userId) {
      dataFetcher(`users/${userId}`, "GET");
    }
  }, [userId]);

  const btnStyle = "bg-blue-500 text-white rounded-md";

  const userTask = data?.data?.task ? (
    data?.data?.task.length > 0 ? (
      data?.data?.task.map((t) => (
        <Card key={t._id} className="mb-4">
          <TaskResponseForm taskId={t._id} />
          <div className="flex items-center justify-between bg-red-800 text-white rounded-md p-2 mb-2">
            {t.reminder?.message ? (
              <div className="flex justify-between gap-3 w-full">
                <span>
                  <MdNotificationsActive className="text-2xl text-white" />{" "}
                  Reminder:{" "}
                </span>
                <span>
                  <IoMdTime className="text-2xl text-white" />{" "}
                  {moment(t.reminder?.timestamp).startOf().fromNow()}
                </span>
                {t.reminder?.message}
              </div>
            ) : (
              <MdNotificationsOff />
            )}
          </div>
          <div className="mt-1">
            <Title level={5}>Task Title</Title>
            <Text className="block mb-2">{t.title}</Text>
            <Link to={`tasks/${t._id}`}>
              <Button className={btnStyle}>Get Detail</Button>
            </Link>
            <TaskResponse task={t} />
          </div>
        </Card>
      ))
    ) : (
      <Text>You currently do not have any tasks</Text>
    )
  ) : (
    <Spin tip="Loading task" size="small" className="mt-5">
      <div className="content" />
    </Spin>
  );

  return (
    <>
      {/* <Title level={1}>Dashboard</Title> */}
      <Row>
        <Col>
          <Title level={8}>
            Welcome to your Dashboard, {user?.data?.user?.firstName}
          </Title>
        </Col>
      </Row>
      {/* <Divider /> */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <FaBriefcase className="text-3xl text-blue-500 mb-2" />
            <Title level={4}>{cases?.results}</Title>
            <Text>Number of Cases</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <FaUser className="text-3xl text-blue-500 mb-2" />
            <Title level={4}>{users?.results}</Title>
            <Text>Number of Staff</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <GoLaw className="text-3xl text-blue-500 mb-2" />
            <Title level={4}>6</Title>
            <Text>Number of Lawyers</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <FaTasks className="text-3xl text-blue-500 mb-2" />
            <Title level={4}>{tasks?.results}</Title>
            <Text>Number of Assigned Tasks</Text>
          </Card>
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
        {/* <Col>
          <AddClientForm />
        </Col> */}
        {isAdminOrHr && (
          <Col>
            <LeaveBalanceList />
          </Col>
        )}
        <Col>
          <Link to="leave-application">
            <Button className={btnStyle}>Apply for leave</Button>
          </Link>
        </Col>
        <Col>
          <LeaveBalanceDisplay userId={userId} />
        </Col>
        <Col>
          <Link to="leave-application-list">
            <Button className={btnStyle}>
              {isAdminOrHr
                ? "Manage Leave Applications"
                : "Your Leave Applications"}
            </Button>
          </Link>
        </Col>
        <Col>
          <CreateTaskForm />
        </Col>
      </Row>
      {isAdmin && <CreateLeaveBalanceForm />}
      <Row gutter={16}>
        <Col>
          <Link to="add-invoices">
            <Button className={btnStyle}>Create Invoice</Button>
          </Link>
        </Col>
        <Col span={24}>{userTask}</Col>
      </Row>
    </>
  );
};

export default Dashboard;
