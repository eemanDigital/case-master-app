import { useState, useEffect, createContext } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAdminHook } from "../hooks/useAdminHook";
import CasesByCategoriesChart from "./CasesByCategoriesChart";
import AccountOfficerCharts from "./AccountOfficerCharts";
import CaseCountsByPeriodChart from "./CaseCountsByPeriodChart";
import TotalPaymentCharts from "./TotalOutstandingBalanceCharts";
import CaseCountsByClientChart from "./CaseCountsByClientChart";
import CaseCountsByYearChart from "./CaseCountsByYearChart ";
import googleCalender from "../assets/calender.svg";
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
import CurrentDayCaseList from "./CurrentDayCauseList";
import CurrentTasksTracker from "./CurrentTasksTracker";
import CurrentMonthIncomeCharts from "./CurrentMonthIncomeChart";
import MonthlyIncomeChart from "./MonthlyIncomeChart";
import TotalOutstandingBalanceCharts from "./TotalOutstandingBalanceCharts";

// context for year for search filter
export const PaymentFiltersContext = createContext();

const Dashboard = () => {
  const { isError, isSuccess, isLoading, message, user } = useSelector(
    (state) => state.auth
  );
  const userId = user?.data?._id;
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
    fetchData,
    cases,
    users,
    tasks,
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
  } = useDataGetterHook();

  // end
  const { isAdminOrHr, isStaff, isClient, isVerified } = useAdminHook();
  // user count
  const { lawyerCount, clientCount, staff } = useUsersCount(users);

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
  }, [userId]);

  useEffect(() => {
    if (year) {
      dataFetcherYear(`payments/totalPayments/${year}`, "GET");
    }
  }, [year]);

  useEffect(() => {
    if (month && yearMonth) {
      dataFetcherMonth(`payments/totalPayments/${yearMonth}/${month}`, "GET");
    }
  }, [month, yearMonth]);

  // get data each month in a year
  useEffect(() => {
    if (yearEachMonth) {
      dataFetcherEachMonth(
        `payments/totalPaymentsByMonthInYear/${yearEachMonth}`,
        "GET"
      );
    }
  }, [yearEachMonth]);

  // console.log(reports, events, "AD");
  // const causeListTitle = (
  //   <div className="flex justify-between items-center">
  //     <h1 className="text-gray-700 text-[20px] font-bold">
  //       {`Your Cases for today: ${causeList.data?.todayResult}`}
  //     </h1>
  //     <Link to="cause-list">
  //       <Button className="bg-blue-500 text-white">See all List</Button>
  //     </Link>
  //   </div>
  // );

  // console.log(fetchedMonthData, "AO");

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
          <EventForm />
          <EventList />
          <LeaveAppForm />
        </div>

        <div className="flex items-center space-x-4">
          <div className="w-12 h-12">
            <a
              href="https://calendar.google.com/calendar"
              target="_blank"
              rel="noopener noreferrer">
              <img
                className="h-12 w-12"
                src={googleCalender}
                alt="google calendar logo"
              />
            </a>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
            <CurrentDayCaseList />

            <CurrentMonthIncomeCharts data={fetchedMonthData?.data} />
            <TotalOutstandingBalanceCharts
              paymentData={fetchedYearData?.data}
              balanceData={totalBalanceOnPayments}
            />
            <MonthlyIncomeChart data={fetchedEachMonthDataInYear?.data} />
            <CaseCountsByClientChart data={casesByClient?.data} />
            <AccountOfficerCharts
              title="Cases By Account Officer"
              data={casesByAccountOfficer?.data || []}
            />
            <CaseCountsByPeriodChart data={monthlyNewCases?.data || []} />
            <CaseCountsByYearChart data={yearlyNewCases?.data || []} />
          </div>

          <div className="flex flex-col gap-4 m-4 md:flex-row items-start">
            {/* <div className=" flex flex-col gap-4 items-end"> */}
            {/* <div className="latest-case-reports-container"> */}
            <CurrentTasksTracker tasks={tasks?.data} userId={userId} />

            {/* </div> */}
          </div>

          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:space-x-4">
            <div className="flex flex-col space-y-4 w-full lg:w-1/3">
              <TodoList />
            </div>

            <div className="w-full  lg:w-2/3">
              <LatestCaseReports />
            </div>
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
        </>
      )}
    </PaymentFiltersContext.Provider>
  );
};

export default Dashboard;
