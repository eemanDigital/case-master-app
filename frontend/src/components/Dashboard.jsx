import React, { useState, useEffect, createContext } from "react";
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
import CasesCharts from "./Charts";
import AccountOfficerCharts from "./AccountOfficerCharts";
import CaseCountsByPeriodChart from "./CaseCountsByPeriodChart";
import TotalPaymentCharts from "./TotalPaymentCharts";
import MonthlyPaymentsChart from "./MonthlyPaymentsChart";
import PaymentsEachMonthChart from "./PaymentsEachMonthChart";

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
      <div className="mt-0">
        <h1 className="text-2xl font-bold text-gray-600 tracking-wider">
          {user?.data?.user?.firstName}'s Dashboard,
        </h1>
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

      <div className="flex justify-between gap-2 w-full">
        <MonthlyPaymentsChart data={fetchedMonthData?.data} />
        <TotalPaymentCharts data={fetchedYearData?.data} />
      </div>
      <PaymentsEachMonthChart data={fetchedEachMonthDataInYear?.data} />

      <CaseCountsByPeriodChart data={monthlyNewCases?.data || []} />

      <div className="flex justify-between flex-wrap w-full py-12 px-6 my-8 shadow-md rounded-md gap-2 bg-white">
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
    </PaymentFiltersContext.Provider>
  );
};

export default Dashboard;
