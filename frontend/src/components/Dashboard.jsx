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

// Context for year for search filter
export const PaymentFiltersContext = createContext();

const Dashboard = () => {
  useRedirectLogoutUser("/users/login");

  const { user } = useSelector((state) => state.auth);
  const userId = user?.data?._id;
  const year = new Date().getFullYear();
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
    fetchBatch,
    refreshData,
    cases,
    users,
    tasks,
    reports,
    totalBalanceOnPayments,
    accountOfficerAggregates,
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
    dashboardStats, // ✅ Add this from the new endpoint
    error: dataError,
    loading: dataLoading,
  } = useDataGetterHook();

  const { isAdminOrHr, isStaff, isClient, isVerified } = useAdminHook();
  const { lawyerCount, clientCount, staff } = useUsersCount(users);
  // ✅ SINGLE API CALL for all dashboard stats
  // useEffect(() => {
  //   const fetchDashboardData = async () => {
  //     try {
  //       // Fetch dashboard stats in one call
  //       await fetchData("cases/dashboard-stats", "dashboardStats");

  //       // Fetch other essential data in parallel
  //       await fetchBatch([
  //         { endpoint: "cases", key: "cases" },
  //         { endpoint: "users", key: "users" },
  //         { endpoint: "reports", key: "reports" },
  //         { endpoint: "tasks", key: "tasks" },
  //         { endpoint: "reports/upcoming", key: "causeList" },
  //         { endpoint: "payments/totalBalance", key: "totalBalanceOnPayments" },
  //       ]);
  //     } catch (error) {
  //       console.error("Error fetching dashboard data:", error);
  //     }
  //   };

  //   fetchDashboardData();
  // }, [fetchData, fetchBatch]);
  // In your Dashboard component, replace the current useEffect with this:
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // ✅ SINGLE CALL for all case statistics
        await fetchData("cases/dashboard-stats", "dashboardStats");

        // ✅ Essential data in parallel
        await fetchBatch([
          { endpoint: "users", key: "users" },
          { endpoint: "reports", key: "reports" },
          { endpoint: "tasks", key: "tasks" },
          { endpoint: "reports/upcoming", key: "causeList" },
          { endpoint: "payments/totalBalance", key: "totalBalanceOnPayments" },
          {
            endpoint: "cases/account-officers/aggregate",
            key: "accountOfficerAggregates",
          },
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, [fetchData, fetchBatch]);

  // ✅ Separate effect for user-specific data
  useEffect(() => {
    if (userId) {
      dataFetcherUser(`users/${userId}`, "GET");
    }
  }, [userId, dataFetcherUser]);

  // ✅ Separate effects for payment data (only when params change)
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

  useEffect(() => {
    if (yearEachMonth) {
      dataFetcherEachMonth(
        `payments/totalPaymentsByMonthInYear/${yearEachMonth}`,
        "GET"
      );
    }
  }, [yearEachMonth, dataFetcherEachMonth]);

  // ✅ Extract data from dashboardStats response
  const dashboardData = dashboardStats?.data || {};

  // Use dashboard data if available, fallback to individual endpoints for backward compatibility
  const effectiveCasesByStatus =
    dashboardData.casesByStatus || casesByStatus?.data || [];
  const effectiveCasesByCourt =
    dashboardData.casesByCourt || casesByCourt?.data || [];
  const effectiveCasesByNature =
    dashboardData.casesByNature || casesByNature?.data || [];
  const effectiveCasesByRating =
    dashboardData.casesByRating || casesByRating?.data || [];
  const effectiveCasesByMode =
    dashboardData.casesByMode || casesByMode?.data || [];
  const effectiveCasesByCategory =
    dashboardData.casesByCategory || casesByCategory?.data || [];
  const effectiveCasesByClient =
    dashboardData.casesByClient || casesByClient?.data || [];
  const effectiveCasesByAccountOfficer =
    dashboardData.casesByAccountOfficer || casesByAccountOfficer?.data || [];
  const effectiveMonthlyNewCases =
    dashboardData.monthlyNewCases || monthlyNewCases?.data || [];
  const effectiveYearlyNewCases =
    dashboardData.yearlyNewCases || yearlyNewCases?.data || [];
  const totalCases = dashboardData.totalCases || cases?.pagination?.total || 0;
  const activeCases = dashboardData.activeCases || 0;

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
          {/* Events and Quick Actions */}
          <ScrollingEvents />

          <QuickActionsPanel />
        </ShowStaff>

        {/* Client's Dashboard */}
        {isClient && <ClientDashboard />}

        {isStaff && (
          <>
            {/* Data count cards with skeleton loading */}
            {dataLoading.dashboardStats || dataLoading.cases ? (
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
              // In your Dashboard component, update the DashBoardDataCount usage:
              <DashBoardDataCount
                cases={cases}
                staff={staff}
                lawyerCount={lawyerCount}
                clientCount={clientCount}
                // ✅ NEW: Pass optimized data
                totalCases={totalCases}
                activeCases={activeCases}
                dashboardStats={dashboardStats}
                loading={dataLoading.dashboardStats || dataLoading.cases}
                // trends={/* your trend data */}
              />
            )}

            <div className="container mx-auto mt-2">
              <div className="flex flex-wrap -mx-4">
                {/* Latest Reports and Cause List */}
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

                {/* Components Grid */}
                <div className="w-full px-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Tasks and Todo - Show immediately if data available */}
                    {dataLoading.tasks ? (
                      <Skeleton active paragraph={{ rows: 6 }} />
                    ) : (
                      <CurrentTasksTracker
                        tasks={tasks?.data?.tasks || []}
                        userId={userId}
                      />
                    )}

                    <TodoList />

                    {/* Charts with skeleton loading - using dashboard data */}
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

                    {/* Admin components */}
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

            {/* Status Charts with skeleton loading - using dashboard data */}
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
