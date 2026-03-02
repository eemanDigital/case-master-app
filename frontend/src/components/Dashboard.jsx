import { useEffect, createContext, useRef } from "react";
import { Row, Col, Card, Skeleton, Statistic } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAdminHook } from "../hooks/useAdminHook";

import LeaveNotification from "./LeaveNotification";

import { useSelector, useDispatch } from "react-redux";
import DashBoardDataCount from "./DashBoardDataCount";
import ScrollingEvents from "./ScrollingEvents";
import TaskDashboardCard from "./TaskDashboardCard";

import {
  ShowAdminComponent,
  ShowOnlyVerifiedUser,
  ShowStaff,
} from "./protect/Protect";
import { Alert } from "antd";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import VerifyAccountNotice from "./VerifyAccountNotice";
import QuickActionsPanel from "./QuickActionsPanel";
import ClientMatterDashboard from "./clientDashboard/ClientMatterDashboard";
import PaymentDashboard from "./PaymentDashboard";
import CourtHearingsWidget from "./calender/CourtHearingsWidget";
import { getMatterStats } from "../redux/features/matter/matterSlice";
import { getUserStatistics } from "../redux/features/auth/authSlice";
import MyMattersDashboard from "./MyMattersDashboard";

export const PaymentFiltersContext = createContext();

const Dashboard = () => {
  useRedirectLogoutUser("/users/login");
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { stats: matterStats, isLoading: matterLoading } = useSelector(
    (state) => state.matter,
  );

  const authState = useSelector((state) => state.auth);
  const userStatistics = authState.userStatistics;
  const statisticsLoading = authState.statisticsLoading;

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

  useEffect(() => {
    if (!isClient) {
      dispatch(getMatterStats());
      dispatch(getUserStatistics());
    }
  }, [dispatch, isClient]);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeDashboard = async () => {
      try {
        if (!isClient) {
          await Promise.all([
            fetchData("matters/stats", "matterStats"),
            fetchBatch([
              { endpoint: "users", key: "users" },
              { endpoint: "tasks", key: "tasks" },
              { endpoint: "matters", key: "matters" },
            ]),
          ]);
        }
      } catch (error) {
        console.error("Dashboard initialization error:", error);
      }
    };

    initializeDashboard();
  }, [isClient]);

  if (userError) return <Alert message={userError} type="error" showIcon />;

  const isLoading = isClient ? false : matterLoading || statisticsLoading;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <>
      {!isVerified && <VerifyAccountNotice />}

      <ShowOnlyVerifiedUser>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <ShowStaff>
              <ScrollingEvents />
            </ShowStaff>

            {isClient && (
              <ClientMatterDashboard />
            )}

            {isStaff && (
              <>
                <header className="mb-8 animate-fade-in">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="hidden sm:block w-1 h-14 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-600 rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          {getGreeting()}, {user?.data?.firstName}
                        </p>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                          <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
                            Welcome to your Dashboard
                          </span>
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-100 dark:border-blue-800">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                              {lawFirmName}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {isAdminOrHr && <LeaveNotification />}
                    </div>
                  </div>
                </header>

                <QuickActionsPanel />

                <section className="mb-8">
                  <DashBoardDataCount
                    matterStats={matterStats}
                    userStats={userStatistics}
                    loading={isLoading}
                  />
                </section>

                <section className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
                      Your Matters
                    </h2>
                  </div>
                  <MyMattersDashboard />
                </section>

                <Row gutter={[24, 24]} className="mb-8">
                  <Col xs={24} xl={16}>
                    <Card 
                      className="h-full shadow-lg dark:shadow-gray-900/30"
                      bordered={false}
                      styles={{ body: { height: '100%' } }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Upcoming Court Hearings
                        </h2>
                      </div>
                      <CourtHearingsWidget limit={10} showStatistics={true} />
                    </Card>
                  </Col>
                  
                  <Col xs={24} xl={8}>
                    <Card 
                      className="h-full shadow-lg dark:shadow-gray-900/30"
                      bordered={false}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          Quick Stats
                        </h2>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Active Matters</p>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {matterStats?.activeMatters || 0}
                          </p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Pending Tasks</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {userStatistics?.pendingTasks || 0}
                          </p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Completed This Month</p>
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {userStatistics?.completedTasks || 0}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>

                <section className="mb-8">
                  <Card 
                    className="shadow-lg dark:shadow-gray-900/30"
                    bordered={false}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Your Tasks
                      </h2>
                    </div>
                    {dataLoading.tasks ? (
                      <Skeleton active paragraph={{ rows: 6 }} />
                    ) : (
                      <TaskDashboardCard
                        tasks={tasks?.data || []}
                        userId={userId}
                      />
                    )}
                  </Card>
                </section>

                <ShowAdminComponent>
                  <section className="mb-8">
                    <Card 
                      className="shadow-lg dark:shadow-gray-900/30"
                      bordered={false}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Payment Overview
                        </h2>
                      </div>
                      <PaymentDashboard />
                    </Card>
                  </section>
                </ShowAdminComponent>
              </>
            )}
          </div>
        </div>
      </ShowOnlyVerifiedUser>
    </>
  );
};

export default Dashboard;
