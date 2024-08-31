import { useState, useEffect, createContext } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAdminHook } from "../hooks/useAdminHook";
import CasesByCategoriesChart from "./CasesByCategoriesChart";
import AccountOfficerCharts from "./AccountOfficerCharts";
import CaseCountsByPeriodChart from "./CaseCountsByPeriodChart";
import CaseCountsByClientChart from "./CaseCountsByClientChart";
import CaseCountsByYearChart from "./CaseCountsByYearChart ";
import ClientDashboard from "./ClientDashboard";
import LeaveNotification from "./LeaveNotification";
import { useSelector } from "react-redux";
import useUsersCount from "../hooks/useUsersCount";
import DashBoardDataCount from "./DashBoardDataCount";
import LatestCaseReports from "./LatestCaseReports";
import LeaveAppForm from "../pages/LeaveAppForm";
import TodoList from "./TodoList";
import EventForm from "./EventForm";
import ScrollingEvents from "./ScrollingEvents";
import CurrentTasksTracker from "./CurrentTasksTracker";
import CurrentMonthIncomeCharts from "./CurrentMonthIncomeChart";
import MonthlyIncomeChart from "./MonthlyIncomeChart";
import TotalOutstandingBalanceCharts from "./TotalOutstandingBalanceCharts";
import { ShowAdminComponent, ShowOnlyVerifiedUser } from "./protect/Protect";
import { Alert, Button } from "antd";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import CurrentDayCauseList from "./CurrentDayCauseList";
import VerifyAccountNotice from "./VerifyAccountNotice";
import ButtonWithIcon from "./ButtonWithIcon";
import { Link } from "react-router-dom";
import NoteList from "../pages/NoteList";
import { PlusOutlined } from "@ant-design/icons";

// context for year for search filter
export const PaymentFiltersContext = createContext();

const Dashboard = () => {
  useRedirectLogoutUser("/users/login"); // redirect to login if not logged in

  const { user } = useSelector((state) => state.auth);
  const userId = user?.data?._id;
  const year = new Date().getFullYear();
  // const [year, setYear] = useState(new Date().getFullYear());
  const [yearMonth, setYearMonth] = useState(new Date().getFullYear());
  const [yearEachMonth, setYearEachMonth] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const { error: userError, dataFetcher: dataFetcherUser } = useDataFetch();
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
    fetchData,
    cases,
    users,
    tasks,
    reports,
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
    error: dataError,
    loading: dataLoading,
  } = useDataGetterHook();

  // end
  const { isAdminOrHr, isStaff, isClient, isVerified } = useAdminHook();
  // user count
  const { lawyerCount, clientCount, staff } = useUsersCount(users);

  // fetch data
  useEffect(() => {
    fetchData("cases", "cases");
    fetchData("users", "users");
    fetchData("reports", "reports");
    fetchData("tasks", "tasks");
    fetchData("cases/case-status", "casesByStatus");
    fetchData("cases/cases-by-court", "casesByCourt");
    fetchData("cases/cases-by-natureOfCase", "casesByNature");
    fetchData("cases/cases-by-rating", "casesByRating");
    fetchData("cases/cases-by-mode", "casesByMode");
    fetchData("cases/cases-by-category", "casesByCategory");
    fetchData("cases/cases-by-client", "casesByClient");
    fetchData("cases/cases-by-client", "casesByClient");
    fetchData("cases/cases-by-accountOfficer", "casesByAccountOfficer");
    fetchData("cases/monthly-new-cases", "monthlyNewCases");
    fetchData("cases/yearly-new-cases", "yearlyNewCases");
    fetchData("reports/upcoming", "causeList");
    fetchData("payments/paymentEachClient", "clientPayments");
    fetchData("payments/totalBalance", "totalBalanceOnPayments");
  }, []);

  useEffect(() => {
    if (userId) {
      dataFetcherUser(`users/${userId}`, "GET");
    }
  }, [userId, dataFetcherUser]);

  useEffect(() => {
    if (year) {
      dataFetcherYear(`payments/totalPayments/${year}`, "GET");
    }
  }, [year, dataFetcherYear]);

  useEffect(() => {
    if (month && yearMonth) {
      dataFetcherMonth(`payments/totalPayments/${yearMonth}/${month}`, "GET");
    }
  }, [month, yearMonth, dataFetcherMonth]);

  // get data each month in a year
  useEffect(() => {
    if (yearEachMonth) {
      dataFetcherEachMonth(
        `payments/totalPaymentsByMonthInYear/${yearEachMonth}`,
        "GET"
      );
    }
  }, [yearEachMonth, dataFetcherEachMonth]);

  // if error from fetch user
  if (userError) return <Alert message={userError} />;

  return (
    <PaymentFiltersContext.Provider
      value={{ setYearEachMonth, setYearMonth, setMonth }}>
      {!isVerified && <VerifyAccountNotice />}
      <ShowOnlyVerifiedUser>
        <ScrollingEvents />
        <div className="flex flex-wrap items-center justify-between px-3 rounded-lg md:flex-nowrap md:justify-start md:space-x-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800 tracking-wide">
              Dashboard
            </h1>
          </div>

          {isAdminOrHr && <LeaveNotification />}

          <div className="w-full md:w-auto my-3">
            <EventForm />
          </div>

          {/* <div className="w-full md:w-auto"> */}
          <LeaveAppForm />

          <Link to="note-list">
            <Button type="primary" className="bg-green-500 hover:bg-green-600">
              Show Notes
            </Button>
          </Link>

          {/* </div> */}
        </div>

        {/* client's Dashboard */}
        {isClient && <ClientDashboard />}
        {isStaff && (
          <>
            {/* data count cards */}
            <DashBoardDataCount
              cases={cases}
              staff={staff}
              lawyerCount={lawyerCount}
              clientCount={clientCount}
            />
            <div className="container mx-auto mt-2">
              <div className="flex flex-wrap -mx-4">
                {/* LatestCaseReports - 50% width on large screens, full width on smaller screens */}
                <div className="w-full lg:w-1/2 px-4 mb-8">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <h2 className="bg-gradient-to-r from-gray-600 to-gray-800 text-white text-lg sm:text-xl md:text-2xl font-semibold py-3 px-4 text-center">
                      Today's Case Report
                    </h2>
                    <div className="p-4">
                      <LatestCaseReports
                        reports={reports?.data}
                        error={dataError.reports}
                        loading={dataLoading.reports}
                        fetchData={fetchData}
                      />
                    </div>
                  </div>
                </div>

                {/* Right side components */}
                {/* <div className="w-full lg:w-1/2 px-4"> */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"> */}
                <CurrentDayCauseList />
                {/* </div> */}
                {/* </div> */}

                {/* Components below LatestCaseReports */}
                <div className="w-full px-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <CaseCountsByClientChart data={casesByClient?.data || []} />
                    <AccountOfficerCharts
                      title="Cases By Account Officer"
                      data={casesByAccountOfficer?.data || []}
                    />
                    <CurrentTasksTracker
                      tasks={tasks?.data || []}
                      userId={userId}
                    />
                    <CaseCountsByPeriodChart
                      data={monthlyNewCases?.data || []}
                    />
                    <CaseCountsByYearChart data={yearlyNewCases?.data || []} />
                    <TodoList title="Your Todo List" />

                    {/* Admin components */}
                    <ShowAdminComponent>
                      <CurrentMonthIncomeCharts
                        data={{
                          ...fetchedMonthData?.data,
                          month: String(fetchedMonthData?.data?.month),
                        }}
                        loading={fetchLoadingMonth}
                        error={fetchErrorMonth}
                      />
                      <TotalOutstandingBalanceCharts
                        paymentData={fetchedYearData?.data}
                        balanceData={totalBalanceOnPayments}
                        loading={fetchLoadingYear}
                        error={fetchErrorYear}
                      />
                      <MonthlyIncomeChart
                        data={fetchedEachMonthDataInYear?.data}
                        loading={fetchLoadingEachMonth}
                        error={fetchErrorEachMonth}
                      />
                    </ShowAdminComponent>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 mt-8">
              <CasesByCategoriesChart
                title="Case By Status"
                data={
                  casesByStatus?.data?.filter(
                    (item) => item?.groupName !== null
                  ) || []
                }
              />

              <CasesByCategoriesChart
                title="Nature of Case"
                data={
                  casesByNature?.data?.filter(
                    (item) => item?.groupName !== null
                  ) || []
                }
              />
              <CasesByCategoriesChart
                title="Cases By Court"
                data={
                  casesByCourt?.data?.filter(
                    (item) => item?.groupName !== null
                  ) || []
                }
              />
              <CasesByCategoriesChart
                title="Cases By Rating"
                data={
                  casesByRating?.data?.filter(
                    (item) => item?.groupName !== null
                  ) || []
                }
              />
              <CasesByCategoriesChart
                title="Cases By Mode"
                data={
                  casesByMode?.data?.filter(
                    (item) => item?.groupName !== null
                  ) || []
                }
              />
              <CasesByCategoriesChart
                title="Cases By Category"
                data={
                  casesByCategory?.data?.filter(
                    (item) => item?.groupName !== null
                  ) || []
                }
              />
            </div>
          </>
        )}
      </ShowOnlyVerifiedUser>
    </PaymentFiltersContext.Provider>
  );
};

export default Dashboard;
