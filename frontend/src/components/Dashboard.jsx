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
import Notification from "./Notification";
import useUsersCount from "../hooks/useUsersCount";
import DashBoardDataCount from "./DashBoardDataCount";
import LatestCaseReports from "./LatestCaseReports";
import LeaveAppForm from "../pages/LeaveAppForm";
import TodoList from "./TodoList";
import EventForm from "./EventForm";
import EventList from "../pages/EventList";
import ScrollingEvents from "./ScrollingEvents";
import CurrentTasksTracker from "./CurrentTasksTracker";
import CurrentMonthIncomeCharts from "./CurrentMonthIncomeChart";
import MonthlyIncomeChart from "./MonthlyIncomeChart";
import TotalOutstandingBalanceCharts from "./TotalOutstandingBalanceCharts";
import { ShowAdminComponent } from "./protect/Protect";
import { Alert } from "antd";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import CurrentDayCauseList from "./CurrentDayCauseList";

// context for year for search filter
export const PaymentFiltersContext = createContext();

const Dashboard = () => {
  useRedirectLogoutUser("users/login"); // redirect to login if not logged in

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
      <ScrollingEvents />
      <div className="flex justify-between items-center">
        {!isVerified && <Notification />}
      </div>

      <div className="flex flex-wrap items-center justify-between px-3 rounded-lg">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800 tracking-wide">
            {" "}
            Dashboard
          </h1>
          {isAdminOrHr && <LeaveNotification />}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4">
            <EventForm />
          </div>
          <div className="p-4">
            <EventList />
          </div>
          <div className="p-4">
            <LeaveAppForm />
          </div>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1">
            <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
              <CurrentDayCauseList />

              <CurrentTasksTracker tasks={tasks?.data} userId={userId} />
              {/* only admin component` */}
              <ShowAdminComponent>
                {/* <CurrentMonthIncomeCharts
                  data={fetchedMonthData?.data}
                  loading={fetchLoadingMonth}
                  error={fetchErrorMonth}
                /> */}
                <CurrentMonthIncomeCharts
                  data={{
                    ...fetchedMonthData?.data,
                    month: String(fetchedMonthData?.data?.month), // Ensure month is a string
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
              <CaseCountsByClientChart data={casesByClient?.data} />
              <AccountOfficerCharts
                title="Cases By Account Officer"
                data={casesByAccountOfficer?.data || []}
              />
              <CaseCountsByPeriodChart data={monthlyNewCases?.data || []} />
              <CaseCountsByYearChart data={yearlyNewCases?.data || []} />
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-1 grid grid-cols-1 gap-1">
              <LatestCaseReports
                reports={reports?.data}
                error={dataError.reports}
                loading={dataLoading.reports}
                fetchData={fetchData}
              />
              <TodoList title="Your Todo List" />
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
                casesByMode?.data?.filter((item) => item?.groupName !== null) ||
                []
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
    </PaymentFiltersContext.Provider>
  );
};

export default Dashboard;
