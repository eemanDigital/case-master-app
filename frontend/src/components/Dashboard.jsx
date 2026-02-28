import { useEffect, createContext, useRef, useMemo } from "react";
import { Col } from "antd";
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
import { Alert, Skeleton } from "antd";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import VerifyAccountNotice from "./VerifyAccountNotice";
import QuickActionsPanel from "./QuickActionsPanel";
import ClientCaseDashboard from "./clientDashboard/ClientCaseDashboard";
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

  // Fetch matter and user stats on mount
  useEffect(() => {
    dispatch(getMatterStats());
    dispatch(getUserStatistics());
  }, [dispatch]);

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

  if (userError) return <Alert message={userError} type="error" showIcon />;

  const isLoading = matterLoading || statisticsLoading;

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
            <DashBoardDataCount
              matterStats={matterStats}
              userStats={userStatistics}
              loading={isLoading}
            />

            <MyMattersDashboard />

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
                </div>
              </div>
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
