import { useState, useEffect, createContext } from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import { useDataFetch } from "../hooks/useDataFetch";
import { Button, Empty, Row, Col, Typography, Card, Divider } from "antd";
import LeaveBalanceDisplay from "./LeaveBalanceDisplay";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAdminHook } from "../hooks/useAdminHook";
import { GoLaw } from "react-icons/go";
import { FaBriefcase, FaUser, FaTasks } from "react-icons/fa";
import CreateTaskForm from "../pages/CreateTaskForm";
import Todo from "./Todo";
import SingleCauseList from "./SingleCauseList";
import CasesByCategoriesChart from "./CasesByCategoriesChart";
import AccountOfficerCharts from "./AccountOfficerCharts";
import CaseCountsByPeriodChart from "./CaseCountsByPeriodChart";
import TotalPaymentCharts from "./TotalPaymentCharts";
import MonthlyPaymentsChart from "./MonthlyPaymentsChart";
import PaymentsEachMonthChart from "./PaymentsEachMonthChart";
import CaseCountsByClientChart from "./CaseCountsByClientChart";
import CaseCountsByYearChart from "./CaseCountsByYearChart ";
import EventCalender from "./EventCalender";
import googleCalender from "../assets/calender.svg";

// import { calender } from "../assets/calendar.svg";
// import moment from "moment";

const { Title, Text } = Typography;

// context for year for search filter
export const PaymentFiltersContext = createContext();

const Dashboard = () => {
  const { user } = useAuthContext();
  const userId = user?.data?.user?._id;
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearMonth, setYearMonth] = useState(new Date().getFullYear());
  const [yearEachMonth, setYearEachMonth] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  // const [events, setEvents] = useState([]); //calender event

  const {
    data: getUserData,
    loading: loadUserData,
    error: getError,
    dataFetcher: dataFetcherUser,
  } = useDataFetch();
  const {
    data: fetchedYearData,
    loading: fetchLoadingYear,
    error: fetchErrorYear,
    dataFetcher: dataFetcherYear,
  } = useDataFetch();

  const {
    data: fetchedMonthData,
    loading: fetchLoadingMonth,
    error: fetchErrorMonth,
    dataFetcher: dataFetcherMonth,
  } = useDataFetch();
  const {
    data: fetchedEachMonthDataInYear,
    loading: fetchLoadingEachMonth,
    error: fetchErrorEachMonth,
    dataFetcher: dataFetcherEachMonth,
  } = useDataFetch();

  const {
    cases,
    users,
    tasks,
    // totalPaymentWeekToYear,
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
    reports,
    events,
  } = useDataGetterHook();

  // console.log(events.data.events, "EVENTS");

  // end
  const { isAdmin } = useAdminHook();

  useEffect(() => {
    if (userId) {
      dataFetcherUser(`users/${userId}`, "GET");
    }
  }, [userId]);

  useEffect(() => {
    if (year) {
      dataFetcherYear(`payments/totalPayments/${year}`, "GET");
    }
  }, [year]);

  useEffect(() => {
    if (month && year) {
      dataFetcherMonth(`payments/totalPayments/${yearMonth}/${month}`, "GET");
    }
  }, [year, month]);

  // get data each month in a year
  useEffect(() => {
    if (yearEachMonth) {
      dataFetcherEachMonth(
        `payments/totalPaymentsByMonthInYear/${yearEachMonth}`,
        "GET"
      );
    }
  }, [yearEachMonth]);

  const btnStyle = "bg-blue-500 text-white rounded-md";

  // console.log(reports, events, "AD");

  const causeListTitle = (
    <div className="flex justify-between items-center">
      <h1 className="text-gray-700 text-[20px] font-bold">
        {`Your Cases for today: ${causeList.data?.todayResult}`}
      </h1>
      <Link to="cause-list">
        <Button className="bg-blue-500 text-white">See all List</Button>
      </Link>
    </div>
  );

  return (
    <PaymentFiltersContext.Provider
      value={{ setYearEachMonth, setYearMonth, setMonth }}>
      <div className="flex justify-between items-center mt-0">
        <h1 className="text-2xl font-bold text-gray-600 tracking-wider">
          {user?.data?.user?.firstName}&apos;s Dashboard(
          {user?.data?.user?.role}),
        </h1>
        <div className="w-12 h-12">
          <a
            href="https://calendar.google.com/calendar"
            target="_blank"
            rel="noopener noreferrer">
            {/* Google Calendar */}
            <img
              className="h-12 w-12"
              src={googleCalender}
              alt="google calendar logo"
            />
          </a>
        </div>
      </div>

      <Row gutter={16} className="m-4 flex justify-between items-center">
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
        <Col>
          <EventCalender
            events={events?.data?.events}
            causeListCalenderData={reports?.data}
          />
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

      <div
        className={`inner-shadow overflow-y-auto hide-scrollbar bg-white text-gray-600 ${
          causeList.data?.todayResult === 0
            ? "h-[180] w-[440px] display-shadow-none"
            : "h-[240px]"
        }`}>
        {causeList.data?.todayResult === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <h3 className="text-blue-500 font-bold">
                You have no matter today in Court
              </h3>
            }
          />
        ) : (
          <SingleCauseList
            causeListData={causeList.data?.reportsToday}
            loadingCauseList={getterLoading.causeList}
            errorCauseList={getterError.causeList}
            title={causeListTitle}
            h1Style="text-center text-2xl text-gray-600 font-bold"
          />
        )}
      </div>

      <div className="flex justify-between shadow-md rounded-md my-6 gap-2 bg-white">
        <div className="flex w-full">
          <AccountOfficerCharts
            title="Cases By Account Officer"
            data={casesByAccountOfficer?.data || []}
          />
        </div>
      </div>

      <div className="flex  md:flex-col  justify-between gap-2 w-full">
        <MonthlyPaymentsChart data={fetchedMonthData?.data} />
        <TotalPaymentCharts
          paymentData={fetchedYearData?.data}
          balanceData={totalBalanceOnPayments}
        />
        <PaymentsEachMonthChart data={fetchedEachMonthDataInYear?.data} />
      </div>
      <CaseCountsByClientChart data={casesByClient?.data} />

      <div className=" bg-white flex  md:flex-row   justify-between  items-center p-4">
        <CaseCountsByPeriodChart data={monthlyNewCases?.data || []} />

        <CaseCountsByYearChart data={yearlyNewCases?.data || []} />
      </div>

      <div className="flex justify-between flex-wrap w-full py-12 px-6 my-8 shadow-md rounded-md gap-2 bg-white">
        <CasesByCategoriesChart
          title="Case By Status"
          data={casesByStatus?.data || []}
        />
        <CasesByCategoriesChart
          title="Nature of Case"
          data={casesByNature?.data || []}
        />
        <CasesByCategoriesChart
          title="Cases By Court"
          data={casesByCourt?.data || []}
        />
        <CasesByCategoriesChart
          title="Cases By Rating"
          data={casesByRating?.data || []}
        />
        <CasesByCategoriesChart
          title="Cases By Mode"
          data={casesByMode?.data || []}
        />
        {/* <CasesByCategoriesChart title="Cases By Client" data={casesByClient?.data || []} /> */}
        <CasesByCategoriesChart
          title="Cases By Category"
          data={casesByCategory?.data || []}
        />
      </div>
    </PaymentFiltersContext.Provider>
  );
};

export default Dashboard;
