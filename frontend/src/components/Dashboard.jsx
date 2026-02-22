// Dashboard.jsx (updated section)
import { useEffect, createContext, useRef, useMemo } from "react";
import { Col } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAdminHook } from "../hooks/useAdminHook";
import { useStatsData } from "../hooks/useStatsData"; // Import new hook
import CasesByCategoriesChart from "./CasesByCategoriesChart";
import AccountOfficerCharts from "./AccountOfficerCharts";
import CaseCountsByPeriodChart from "./CaseCountsByPeriodChart";
import CaseCountsByClientChart from "./CaseCountsByClientChart";
import CaseCountsByYearChart from "./CaseCountsByYearChart ";
import LeaveNotification from "./LeaveNotification";
import { useSelector } from "react-redux";
import DashBoardDataCount from "./DashBoardDataCount";
import ScrollingEvents from "./ScrollingEvents";
import TaskDashboardCard from "./TaskDashboardCard";

import {
  ShowAdminComponent,
  ShowOnlyVerifiedUser,
  ShowStaff,
} from "./protect/Protect";
import { Alert, Skeleton } from "antd";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import VerifyAccountNotice from "./VerifyAccountNotice";
import QuickActionsPanel from "./QuickActionsPanel";
import ClientCaseDashboard from "./clientDashboard/ClientCaseDashboard";
import PaymentDashboard from "./PaymentDashboard";
import CourtHearingsWidget from "./calender/CourtHearingsWidget";

export const PaymentFiltersContext = createContext();

const Dashboard = () => {
  useRedirectLogoutUser("/users/login");

  const { user } = useSelector((state) => state.auth);
  const userId = user?.data?._id;
  const lawFirmName = user?.data?.firmId?.name;

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
    () => accountOfficerAggregates?.data || [],
    [accountOfficerAggregates?.data],
  );

  const effectiveMonthlyNewCases = useMemo(
    () => dashboardData.monthlyNewCases || [],
    [dashboardData.monthlyNewCases],
  );

  const effectiveYearlyNewCases = useMemo(
    () => dashboardData.yearlyNewCases || [],
    [dashboardData.yearlyNewCases],
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
            {/* DashBoardDataCount is self-fetching via Redux (matterSlice + authSlice) */}
            <DashBoardDataCount />

            <div className="container mx-auto mt-2">
              <div className="flex flex-wrap -mx-4">
                <Col xs={24} xl={16}>
                  <CourtHearingsWidget limit={10} showStatistics={true} />
                </Col>

                <div className="w-full px-4">
                  <div className="border-t border-gray-300 my-8">
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
                        data={effectiveCasesByAccountOfficer}
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
