import { Link } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import { useDataFetch } from "../hooks/useDataFetch";
import { useEffect } from "react";
import { Button, Spin, Row, Col, Typography, Card, Divider } from "antd";
import LeaveBalanceDisplay from "./LeaveBalanceDisplay";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAdminHook } from "../hooks/useAdminHook";
import { GoLaw } from "react-icons/go";
import { FaBriefcase, FaUser, FaTasks } from "react-icons/fa";
import CreateTaskForm from "../pages/CreateTaskForm";
import Todo from "./Todo";
import SingleCauseList from "./SingleCauseList";
import CasesCharts from "./Charts";
import AccountOfficerCharts from "./AccountOfficerCharts";
import CaseCountsByPeriodChart from "./CaseCountsByPeriodChart";

const { Title, Text } = Typography;

const Dashboard = () => {
  const { user } = useAuthContext();
  const userId = user?.data?.user?._id;
  const {
    data: fetchedData,
    loading: fetchLoading,
    error: fetchError,
    dataFetcher,
  } = useDataFetch();
  const {
    cases,
    users,
    tasks,
    totalPaymentWeekToYear,
    totalBalanceOnPayments,
    casesByStatus,
    casesByCourt,
    casesByNature,
    casesByRating,
    casesByMode,
    casesByCategory,
    casesByClient,
    casesByAccountOfficer,
    monthlyNewCases,
    yearlyNewCases,
    loading: getterLoading,
    error: getterError,
    causeList,
  } = useDataGetterHook();
  const { isAdmin } = useAdminHook();

  // console.log(
  //   "total",
  //   totalPaymentWeekToYear,
  //   totalBalanceOnPayments,
  //   casesByStatus,
  //   casesByCourt,
  //   casesByNature,
  //   casesByRating,
  //   casesByMode,
  //   casesByCategory,
  //   casesByClient,
  //   casesByAccountOfficer,
  //   monthlyNewCases,
  //   yearlyNewCases
  // );
  // const h1Style =
  //   " font-bold text-center text-blue-500 leading-tight  tracking-wide";

  useEffect(() => {
    if (userId) {
      dataFetcher(`users/${userId}`, "GET");
    }
  }, [userId]);

  const btnStyle = "bg-blue-500 text-white rounded-md";

  // causeList title
  const causeListTitle = (
    <div className="flex justify-between items-center">
      <h1 className="text-gray-700   text-[20px] font-bold">
        {" "}
        {`Your Cases for today: ${causeList.data?.todayResult}`}{" "}
      </h1>
      <Link to="cause-list">
        <Button className="bg-blue-500 text-white">See all List</Button>
      </Link>
    </div>
  );

  return (
    <>
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
        <Col>
          <Todo />
        </Col>
      </Row>
      <Row>
        <Col>
          <Title level={8}>
            Welcome to your Dashboard, {user?.data?.user?.firstName}
          </Title>
        </Col>
      </Row>
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

      {/* todays cause list */}
      <div className="flex justify-between items-center w-full">
        <div className=" h-[240px] inner-shadow overflow-y-auto hide-scrollbar bg-white text-gray-600 ">
          {causeList.data?.todayResult === 0 ? (
            <h1 className="text-left text-2xl  m-2 font-bold ">
              You have no matter today
            </h1>
          ) : (
            <SingleCauseList
              causeListData={causeList.data?.reportsToday}
              loadingCauseList={getterLoading.causeList}
              errorCauseList={getterError.causeList}
              // result={causeList.data?.todayResult}
              title={causeListTitle}
              h1Style="text-center text-2xl text-gray-600 font-bold"
            />
          )}
        </div>
      </div>
      <div className="flex flex-between flex-wrap w-full p-5 my-8 shadow-md rounded-md gap-2 bg-white">
        <div className="flex w-full">
          <AccountOfficerCharts
            title="Cases By Account Officer"
            data={casesByAccountOfficer?.data || []}
          />
        </div>
        <div>
          <CaseCountsByPeriodChart data={monthlyNewCases?.data || []} />
        </div>
      </div>

      <div className="flex  justify-between flex-wrap w-full py-12 px-6 my-8 shadow-md rounded-md gap-2 bg-white">
        <CasesCharts title="Case By Status" data={casesByStatus?.data || []} />
        <CasesCharts title="Nature of Case" data={casesByNature?.data || []} />
        <CasesCharts title="Cases By Court" data={casesByCourt?.data || []} />
        <CasesCharts title="Cases By Rating" data={casesByRating?.data || []} />
        <CasesCharts title="Cases By Mode" data={casesByMode?.data || []} />
        <CasesCharts
          title="Cases By Category"
          data={casesByCategory?.data || []}
        />
      </div>
    </>
  );
};

export default Dashboard;
