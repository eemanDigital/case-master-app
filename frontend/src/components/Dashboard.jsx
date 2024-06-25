import { Link } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import { useDataFetch } from "../hooks/useDataFetch";
import { useEffect } from "react";
import { Button, Spin, Row, Col, Typography, Card, Divider } from "antd";
import LeaveBalanceDisplay from "./LeaveBalanceDisplay";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { GoLaw } from "react-icons/go";
import { FaBriefcase, FaUser, FaTasks } from "react-icons/fa";
import CreateTaskForm from "../pages/CreateTaskForm";
import Todo from "./Todo";

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

  return (
    <>
      {/* <Title level={1}>Dashboard</Title> */}
      <Todo />
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

        <Col>
          <Link to="leave-application">
            <Button className={btnStyle}>Apply for leave</Button>
          </Link>
        </Col>
        <Col>
          <LeaveBalanceDisplay userId={userId} />
        </Col>

        <Col>
          <CreateTaskForm />
        </Col>
      </Row>

      <Row gutter={16}>{/* <Col span={24}>{userTask}</Col> */}</Row>
    </>
  );
};

export default Dashboard;
