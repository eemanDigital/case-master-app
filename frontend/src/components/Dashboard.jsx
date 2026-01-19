import { useEffect, createContext, useRef, useMemo } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAdminHook } from "../hooks/useAdminHook";
import CasesByCategoriesChart from "./CasesByCategoriesChart";
import AccountOfficerCharts from "./AccountOfficerCharts";
import CaseCountsByPeriodChart from "./CaseCountsByPeriodChart";
import CaseCountsByClientChart from "./CaseCountsByClientChart";
import CaseCountsByYearChart from "./CaseCountsByYearChart ";
// import ClientDashboard from "./ClientDashboard";
import LeaveNotification from "./LeaveNotification";
import { useSelector } from "react-redux";
import useUsersCount from "../hooks/useUsersCount";
import DashBoardDataCount from "./DashBoardDataCount";
import LatestCaseReports from "./LatestCaseReports";
import TodoList from "./TodoList";
import ScrollingEvents from "./ScrollingEvents";
import TaskDashboardCard from "./TaskDashboardCard";

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
import ClientCaseDashboard from "./clientDashboard/ClientCaseDashboard";

import PaymentDashboard from "./PaymentDashboard";

export const PaymentFiltersContext = createContext();

const Dashboard = () => {
  useRedirectLogoutUser("/users/login");

  const { user } = useSelector((state) => state.auth);
  const userId = user?.data?._id;
  const lawFirmName = user?.data?.firmId.name;

  const hasInitialized = useRef(false);

  const { error: userError, dataFetcher: dataFetcherUser } = useDataFetch();

  const {
    fetchData,
    fetchBatch,
    users,
    tasks,
    reports,

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
              endpoint: "cases/account-officers/aggregate",
              key: "accountOfficerAggregates",
            },
          ]),
        ]);
      } catch (error) {
        console.error("Dashboard initialization error:", error);
      }
    };

    initializeDashboard();
  }, []); // ✅ Only run once on mount

  // ✅ Memoize expensive computations
  const dashboardData = useMemo(
    () => dashboardStats?.data || {},
    [dashboardStats],
  );

  const effectiveCasesByStatus = useMemo(
    () => dashboardData.casesByStatus || [],
    [dashboardData.casesByStatus],
  );

  const effectiveCasesByCourt = useMemo(
    () => dashboardData.casesByCourt || [],
    [dashboardData.casesByCourt],
  );

  const effectiveCasesByNature = useMemo(
    () => dashboardData.casesByNature || [],
    [dashboardData.casesByNature],
  );

  const effectiveCasesByRating = useMemo(
    () => dashboardData.casesByRating || [],
    [dashboardData.casesByRating],
  );

  const effectiveCasesByMode = useMemo(
    () => dashboardData.casesByMode || [],
    [dashboardData.casesByMode],
  );

  const effectiveCasesByCategory = useMemo(
    () => dashboardData.casesByCategory || [],
    [dashboardData.casesByCategory],
  );

  const effectiveCasesByClient = useMemo(
    () => dashboardData.casesByClient || [],
    [dashboardData.casesByClient],
  );

  const effectiveCasesByAccountOfficer = useMemo(
    () => dashboardData.casesByAccountOfficer || [],
    [dashboardData.casesByAccountOfficer],
  );

  const effectiveMonthlyNewCases = useMemo(
    () => dashboardData.monthlyNewCases || [],
    [dashboardData.monthlyNewCases],
  );

  const effectiveYearlyNewCases = useMemo(
    () => dashboardData.yearlyNewCases || [],
    [dashboardData.yearlyNewCases],
  );

  const totalCases = useMemo(
    () => dashboardData.totalCases || 0,
    [dashboardData.totalCases],
  );

  const activeCases = useMemo(
    () => dashboardData.activeCases || 0,
    [dashboardData.activeCases],
  );

  if (userError) return <Alert message={userError} type="error" showIcon />;

  return (
    <>
      {!isVerified && <VerifyAccountNotice />}

      <ShowOnlyVerifiedUser>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 mb-6">
          {!isClient && (
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <div className="flex items-center gap-3">
                <div className="hidden md:block w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {user?.data?.firstName}'s Dashboard
                  </span>
                </h1>
              </div>

              <div className="flex items-center gap-2 ml-0 md:ml-4">
                <div className="text-gray-500 hidden md:block">•</div>
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium text-blue-700">
                    {lawFirmName}
                  </p>
                </div>
              </div>
            </div>
          )}
          {isAdminOrHr && <LeaveNotification />}
        </div>
        <QuickActionsPanel />

        <ShowStaff>
          <ScrollingEvents />
        </ShowStaff>

        {isClient && <ClientCaseDashboard />}

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
                  <div className="border-t border-gray-300 my-8">
                    {" "}
                    {dataLoading.tasks ? (
                      <Skeleton active paragraph={{ rows: 6 }} />
                    ) : (
                      <TaskDashboardCard
                        tasks={tasks?.data || []}
                        userId={userId}
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* <TodoList /> */}

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
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              {dataLoading.dashboardStats ? (
                <Skeleton.Node active style={{ width: "100%", height: 300 }} />
              ) : (
                <CaseCountsByYearChart data={effectiveYearlyNewCases} />
              )}
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

            <ShowAdminComponent>
              <div className="col-span-1 mt-4 md:col-span-2 lg:col-span-3">
                <PaymentDashboard />
              </div>
            </ShowAdminComponent>
          </>
        )}
      </ShowOnlyVerifiedUser>
    </>
  );
};

export default Dashboard;
