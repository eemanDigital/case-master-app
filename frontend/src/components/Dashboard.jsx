import { useState, useEffect, createContext, useRef, useMemo } from "react";
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
import TodoList from "./TodoList";
import ScrollingEvents from "./ScrollingEvents";
import CurrentTasksTracker from "./CurrentTasksTracker";
import CurrentMonthIncomeCharts from "./CurrentMonthIncomeChart";
import MonthlyIncomeChart from "./MonthlyIncomeChart";
import TotalOutstandingBalanceCharts from "./TotalOutstandingBalanceCharts";
import {
  ShowAdminComponent,
  ShowOnlyVerifiedUser,
  ShowStaff,
} from "./protect/Protect";
import { Alert, Skeleton } from "antd";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import CurrentDayCauseList from "./CurrentDayCauseList";
import VerifyAccountNotice from "./VerifyAccountNotice";
import QuickActionsPanel from "./QuickActionsPanel";

export const PaymentFiltersContext = createContext();

const Dashboard = () => {
  useRedirectLogoutUser("/users/login");

  const { user } = useSelector((state) => state.auth);
  const userId = user?.data?._id;
  const year = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [yearMonth, setYearMonth] = useState(year);
  const [yearEachMonth, setYearEachMonth] = useState(year);
  const [month, setMonth] = useState(currentMonth);

  const hasInitialized = useRef(false);

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
    fetchBatch,
    users,
    tasks,
    reports,
    totalBalanceOnPayments,
    accountOfficerAggregates,
    dashboardStats,
    error: dataError,
    loading: dataLoading,
  } = useDataGetterHook();

  const { isAdminOrHr, isStaff, isClient, isVerified } = useAdminHook();
  const { lawyerCount, clientCount, staff } = useUsersCount(users);

  // ✅ SINGLE initialization effect
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeDashboard = async () => {
      try {
        // Fetch all essential data in parallel
        await Promise.all([
          fetchData("cases/dashboard-stats", "dashboardStats"),
          fetchBatch([
            { endpoint: "users", key: "users" },
            { endpoint: "reports", key: "reports" },
            { endpoint: "tasks", key: "tasks" },
            { endpoint: "reports/upcoming", key: "causeList" },
            {
              endpoint: "payments/totalBalance",
              key: "totalBalanceOnPayments",
            },
            {
              endpoint: "cases/account-officers/aggregate",
              key: "accountOfficerAggregates",
            },
          ]),
        ]);

        // Fetch payment data for admin users only
        if (isAdminOrHr) {
          await Promise.all([
            dataFetcherYear(`payments/totalPayments/${year}`, "GET"),
            dataFetcherMonth(
              `payments/totalPayments/${yearMonth}/${month}`,
              "GET"
            ),
            dataFetcherEachMonth(
              `payments/totalPaymentsByMonthInYear/${yearEachMonth}`,
              "GET"
            ),
          ]);
        }
      } catch (error) {
        console.error("Dashboard initialization error:", error);
      }
    };

    initializeDashboard();
  }, []); // ✅ Only run once on mount

  // ✅ Memoize expensive computations
  const dashboardData = useMemo(
    () => dashboardStats?.data || {},
    [dashboardStats]
  );

  const effectiveCasesByStatus = useMemo(
    () => dashboardData.casesByStatus || [],
    [dashboardData.casesByStatus]
  );

  const effectiveCasesByCourt = useMemo(
    () => dashboardData.casesByCourt || [],
    [dashboardData.casesByCourt]
  );

  const effectiveCasesByNature = useMemo(
    () => dashboardData.casesByNature || [],
    [dashboardData.casesByNature]
  );

  const effectiveCasesByRating = useMemo(
    () => dashboardData.casesByRating || [],
    [dashboardData.casesByRating]
  );

  const effectiveCasesByMode = useMemo(
    () => dashboardData.casesByMode || [],
    [dashboardData.casesByMode]
  );

  const effectiveCasesByCategory = useMemo(
    () => dashboardData.casesByCategory || [],
    [dashboardData.casesByCategory]
  );

  const effectiveCasesByClient = useMemo(
    () => dashboardData.casesByClient || [],
    [dashboardData.casesByClient]
  );

  const effectiveCasesByAccountOfficer = useMemo(
    () => dashboardData.casesByAccountOfficer || [],
    [dashboardData.casesByAccountOfficer]
  );

  const effectiveMonthlyNewCases = useMemo(
    () => dashboardData.monthlyNewCases || [],
    [dashboardData.monthlyNewCases]
  );

  const effectiveYearlyNewCases = useMemo(
    () => dashboardData.yearlyNewCases || [],
    [dashboardData.yearlyNewCases]
  );

  const totalCases = useMemo(
    () => dashboardData.totalCases || 0,
    [dashboardData.totalCases]
  );

  const activeCases = useMemo(
    () => dashboardData.activeCases || 0,
    [dashboardData.activeCases]
  );

  if (userError) return <Alert message={userError} type="error" showIcon />;

  return (
    <PaymentFiltersContext.Provider
      value={{ setYearEachMonth, setYearMonth, setMonth }}>
      {!isVerified && <VerifyAccountNotice />}

      <ShowOnlyVerifiedUser>
        <div className="flex items-center justify-between space-x-4 mb-2">
          <h1 className="text-2xl font-bold text-gray-800 tracking-wide">
            {user?.data?.firstName}'s Dashboard
          </h1>
          {isAdminOrHr && <LeaveNotification />}
        </div>

        <ShowStaff>
          <ScrollingEvents />
          <QuickActionsPanel />
        </ShowStaff>

        {isClient && <ClientDashboard />}

        {isStaff && (
          <>
            {dataLoading.dashboardStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton.Button
                    key={i}
                    active
                    block
                    style={{ height: 120 }}
                  />
                ))}
              </div>
            ) : (
              <DashBoardDataCount
                staff={staff}
                lawyerCount={lawyerCount}
                clientCount={clientCount}
                totalCases={totalCases}
                activeCases={activeCases}
                dashboardStats={dashboardStats}
                loading={dataLoading.dashboardStats}
              />
            )}

            <div className="container mx-auto mt-2">
              <div className="flex flex-wrap -mx-4">
                <div className="flex-none gap-4 w-full px-4 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg shadow-md w-full items-start">
                    <div className="bg-gradient-to-br from-white to-blue-50/50 border border-gray-200 rounded-2xl shadow-sm h-[400px] w-full flex flex-col">
                      {dataLoading.reports ? (
                        <div className="p-4">
                          <Skeleton active paragraph={{ rows: 8 }} />
                        </div>
                      ) : (
                        <LatestCaseReports
                          reports={reports?.data}
                          error={dataError.reports}
                          loading={dataLoading.reports}
                          fetchData={fetchData}
                        />
                      )}
                    </div>

                    <div className="bg-gradient-to-br from-white to-purple-50/50 border border-gray-200 rounded-2xl shadow-sm h-[400px] w-full flex flex-col">
                      {dataLoading.causeList ? (
                        <div className="p-4">
                          <Skeleton active paragraph={{ rows: 8 }} />
                        </div>
                      ) : (
                        <CurrentDayCauseList />
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full px-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dataLoading.tasks ? (
                      <Skeleton active paragraph={{ rows: 6 }} />
                    ) : (
                      <CurrentTasksTracker
                        tasks={tasks?.data?.tasks || []}
                        userId={userId}
                      />
                    )}

                    <TodoList />

                    {dataLoading.dashboardStats ? (
                      <Skeleton.Node
                        active
                        style={{ width: "100%", height: 300 }}
                      />
                    ) : (
                      <CaseCountsByClientChart data={effectiveCasesByClient} />
                    )}

                    {dataLoading.dashboardStats ? (
                      <Skeleton.Node
                        active
                        style={{ width: "100%", height: 300 }}
                      />
                    ) : (
                      <AccountOfficerCharts
                        title="Cases By Account Officer"
                        data={accountOfficerAggregates?.data}
                      />
                    )}

                    {dataLoading.dashboardStats ? (
                      <Skeleton.Node
                        active
                        style={{ width: "100%", height: 300 }}
                      />
                    ) : (
                      <CaseCountsByPeriodChart
                        data={effectiveMonthlyNewCases}
                      />
                    )}

                    {dataLoading.dashboardStats ? (
                      <Skeleton.Node
                        active
                        style={{ width: "100%", height: 300 }}
                      />
                    ) : (
                      <CaseCountsByYearChart data={effectiveYearlyNewCases} />
                    )}

                    <ShowAdminComponent>
                      {fetchLoadingMonth ? (
                        <Skeleton.Node
                          active
                          style={{ width: "100%", height: 300 }}
                        />
                      ) : (
                        <CurrentMonthIncomeCharts
                          data={{
                            ...fetchedMonthData?.data,
                            month: String(fetchedMonthData?.data?.month),
                          }}
                          loading={fetchLoadingMonth}
                          error={fetchErrorMonth}
                        />
                      )}

                      {fetchLoadingYear ? (
                        <Skeleton.Node
                          active
                          style={{ width: "100%", height: 300 }}
                        />
                      ) : (
                        <TotalOutstandingBalanceCharts
                          paymentData={fetchedYearData?.data}
                          balanceData={totalBalanceOnPayments}
                          loading={fetchLoadingYear}
                          error={fetchErrorYear}
                        />
                      )}

                      {fetchLoadingEachMonth ? (
                        <Skeleton.Node
                          active
                          style={{ width: "100%", height: 300 }}
                        />
                      ) : (
                        <MonthlyIncomeChart
                          data={fetchedEachMonthDataInYear?.data}
                          loading={fetchLoadingEachMonth}
                          error={fetchErrorEachMonth}
                        />
                      )}
                    </ShowAdminComponent>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              {dataLoading.dashboardStats ? (
                <Skeleton.Node active style={{ width: "100%", height: 300 }} />
              ) : (
                <CasesByCategoriesChart
                  title="Case By Status"
                  data={effectiveCasesByStatus}
                />
              )}

              {dataLoading.dashboardStats ? (
                <Skeleton.Node active style={{ width: "100%", height: 300 }} />
              ) : (
                <CasesByCategoriesChart
                  title="Nature of Case"
                  data={effectiveCasesByNature}
                />
              )}

              {dataLoading.dashboardStats ? (
                <Skeleton.Node active style={{ width: "100%", height: 300 }} />
              ) : (
                <CasesByCategoriesChart
                  title="Cases By Court"
                  data={effectiveCasesByCourt}
                />
              )}

              {dataLoading.dashboardStats ? (
                <Skeleton.Node active style={{ width: "100%", height: 300 }} />
              ) : (
                <CasesByCategoriesChart
                  title="Cases By Priority"
                  data={effectiveCasesByRating}
                />
              )}

              {dataLoading.dashboardStats ? (
                <Skeleton.Node active style={{ width: "100%", height: 300 }} />
              ) : (
                <CasesByCategoriesChart
                  title="Cases By Mode of Commencement"
                  data={effectiveCasesByMode}
                />
              )}

              {dataLoading.dashboardStats ? (
                <Skeleton.Node active style={{ width: "100%", height: 300 }} />
              ) : (
                <CasesByCategoriesChart
                  title="Cases By Category"
                  data={effectiveCasesByCategory}
                />
              )}
            </div>
          </>
        )}
      </ShowOnlyVerifiedUser>
    </PaymentFiltersContext.Provider>
  );
};

export default Dashboard;
