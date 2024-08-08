import { useState, useEffect, createContext } from "react";
import { Link } from "react-router-dom";
import { useDataFetch } from "../hooks/useDataFetch";
import { Button, Empty, Row, Col, Typography, Card, Divider } from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAdminHook } from "../hooks/useAdminHook";
import SingleCauseList from "./SingleCauseList";
import CasesByCategoriesChart from "./CasesByCategoriesChart";
import AccountOfficerCharts from "./AccountOfficerCharts";
import CaseCountsByPeriodChart from "./CaseCountsByPeriodChart";
import TotalPaymentCharts from "./TotalPaymentCharts";
import MonthlyPaymentsChart from "./MonthlyPaymentsChart";
import PaymentsEachMonthChart from "./PaymentsEachMonthChart";
import CaseCountsByClientChart from "./CaseCountsByClientChart";
import CaseCountsByYearChart from "./CaseCountsByYearChart ";
// import EventCalender from "./EventCalender";
import googleCalender from "../assets/calender.svg";
import ClientDashboard from "./ClientDashboard";
import LeaveNotification from "./LeaveNotification";
import { useSelector } from "react-redux";
import Notification from "./Notification";
import useUsersCount from "../hooks/useUsersCount";
import CalenderEvent from "../pages/CalenderEvent";
import DashBoardDataCount from "./DashBoardDataCount";
import LatestCaseReports from "./LatestCaseReports";
import LeaveAppForm from "../pages/LeaveAppForm";

// import { calender } from "../assets/calendar.svg";
// import moment from "moment";

const { Title, Text } = Typography;

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
    cases,
    users,
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
    fetchData,
  } = useDataGetterHook();

  // end
  const { isAdminOrHr, isStaff, isClient, isVerified } = useAdminHook();
  // user count
  const { lawyerCount, clientCount, staff } = useUsersCount(users);

  useEffect(() => {
    fetchData("cases", "cases");
    fetchData("users", "users");
    fetchData("reports", "reports");
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

  // console.log(fetchedMonthData, "AO");

  return (
    <PaymentFiltersContext.Provider
      value={{ setYearEachMonth, setYearMonth, setMonth }}>
      <div className="flex justify-between items-center">
        {!isVerified && <Notification />}
      </div>

      <div className="flex flex-wrap items-center justify-between px-6 rounded-lg">
        <div className="flex items-center space-x-4">
          {/* {isClient ? (
            <h1 className="text-2xl font-bold text-gray-800 tracking-wide">
              Welcome back, {user?.data?.firstName} ({user?.data?.role})
            </h1>
          ) : (
            <h1 className="text-2xl font-bold text-gray-800 tracking-wide">
              {user?.data?.firstName || "........"}'s Dashboard (
              {user?.data?.role})
            </h1>
          )} */}
          <h1 className="text-2xl font-bold text-gray-800 tracking-wide">
            {" "}
            Dashboard
          </h1>
          {isAdminOrHr && <LeaveNotification />}

          <LeaveAppForm />
        </div>

        <div className="flex items-center space-x-4">
          <CalenderEvent />
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
          <div className="flex flex-col md:flex-row items-start">
            <CaseCountsByClientChart data={casesByClient?.data} />
            <AccountOfficerCharts
              title="Cases By Account Officer"
              data={casesByAccountOfficer?.data || []}
            />

            <div className=" flex flex-col gap-4 items-end">
              <div
                className={`cause-list-container   ${
                  causeList.data?.todayResult === 0
                    ? "h-[180] w-full display-shadow-none bg-white"
                    : ""
                }`}>
                {!causeList.data?.todayResult > 0 ? (
                  <h3 className="bg-slate-800 text-white  p-5 font-medium text-center">
                    You have no matter today in Court
                  </h3>
                ) : (
                  <div className="w-[370px] bg-slate-800">
                    <h4 className="text-center font-bold">
                      Toady's Cause List
                    </h4>
                    <SingleCauseList
                      causeListData={causeList.data?.reportsToday}
                      loadingCauseList={getterLoading.causeList}
                      errorCauseList={getterError.causeList}
                      title={causeListTitle}
                      h1Style="text-center text-2xl text-gray-600 font-bold"
                      hideButton={true}
                    />
                  </div>
                )}
              </div>

              <div className="latest-case-reports-container">
                <LatestCaseReports />
              </div>
            </div>
          </div>

          {/* <div className="flex justify-between shadow-md rounded-md my-6 gap-2 bg-white"> */}
          {/* <div className="flex w-full"> */}

          {/* </div> */}

          {/* </div> */}
          <div className="flex  md:flex-col  justify-between gap-2 w-full">
            <MonthlyPaymentsChart data={fetchedMonthData?.data} />
            <TotalPaymentCharts
              paymentData={fetchedYearData?.data}
              balanceData={totalBalanceOnPayments}
            />
            <PaymentsEachMonthChart data={fetchedEachMonthDataInYear?.data} />
          </div>
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
        </>
      )}
    </PaymentFiltersContext.Provider>
  );
};

export default Dashboard;
