import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useSelector } from "react-redux";
import {
  Card,
  Row,
  Col,
  Tabs,
  Badge,
  Statistic,
  Space,
  Button,
  Alert,
  Tooltip,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  BellOutlined,
  TrophyOutlined,
  RocketOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useDataGetterHook } from "../../hooks/useDataGetterHook";
import LoadingSpinner from "../LoadingSpinner";
import PageErrorAlert from "../PageErrorAlert";
import UpcomingCasesComponent from "./UpcomingCasesComponent";
import CaseReportsFeed from "./CaseReportsFeed";
import CaseScheduleTimeline from "./CaseScheduleTimeline";

// Memoized stat card component
const StatCard = memo(({ title, value, icon, color, subtitle }) => (
  <Card className="stat-card hover-lift h-full transition-all duration-300">
    <Statistic
      title={title}
      value={value}
      prefix={icon}
      valueStyle={{ color, fontSize: "32px", fontWeight: 600 }}
    />
    <p className="text-xs text-gray-500 mt-2 mb-0">{subtitle}</p>
  </Card>
));

StatCard.displayName = "StatCard";

// Memoized notification banner
const NotificationBanner = memo(({ count, onViewSchedule }) => (
  <Alert
    message={
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BellOutlined className="text-2xl" />
          <div>
            <h3 className="font-bold m-0 text-base">Today's Cases Reminder</h3>
            <p className="m-0 opacity-90 text-sm">
              You have {count} case{count > 1 ? "s" : ""} scheduled for today
            </p>
          </div>
        </div>
        <Button type="primary" ghost onClick={onViewSchedule} className="ml-4">
          View Schedule
        </Button>
      </div>
    }
    type="warning"
    banner
    closable
    className="mb-6 rounded-lg"
  />
));

NotificationBanner.displayName = "NotificationBanner";

// Memoized quick action item
const QuickActionItem = memo(({ icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 rounded-lg transition-all duration-200 hover:bg-gray-50 border border-transparent hover:border-blue-200 cursor-pointer group">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
        {icon}
      </div>
      <div className="text-left">
        <p className="font-semibold text-gray-900 m-0 text-sm">{title}</p>
        <p className="text-xs text-gray-500 m-0">{description}</p>
      </div>
    </div>
    <RocketOutlined className="text-gray-400 group-hover:text-blue-500 transition-colors" />
  </button>
));

QuickActionItem.displayName = "QuickActionItem";

// Utility function to normalize date to start of day (local time)
const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Utility function to normalize date to end of day (local time)
const getEndOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

// Check if two dates are the same day
const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const ClientCaseDashboard = () => {
  const { causeList, reports, loading, error, fetchData } = useDataGetterHook();
  const { user } = useSelector((state) => state.auth);
  const clientId = user?.data?._id;
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch data with error handling
  useEffect(() => {
    const controller = new AbortController();

    const fetchAllData = async () => {
      try {
        await Promise.allSettled([
          fetchData("reports/upcoming", "causeList"),
          fetchData("reports", "reports"),
        ]);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    fetchAllData();

    return () => controller.abort();
  }, [fetchData]);

  // Optimized data processing with proper memoization
  const processedData = useMemo(() => {
    const causeListData = causeList?.data || {};
    const allReports = reports?.data || [];

    // Debug logging
    console.log("=== DASHBOARD DATA PROCESSING ===");
    console.log("Client ID:", clientId);
    console.log("All reports count:", allReports.length);
    console.log("Cause list data:", causeListData);

    // Get all client reports (not filtered by date)
    const clientReports = allReports.filter((report) => {
      const isClientReport = report?.caseReported?.client === clientId;
      if (report && !isClientReport) {
        console.log("Filtered out report - client mismatch:", {
          reportId: report._id,
          reportClient: report?.caseReported?.client,
          expectedClient: clientId,
        });
      }
      return isClientReport;
    });

    console.log("Client reports count:", clientReports.length);

    // Get unique cases (by caseReported._id)
    const uniqueCaseIds = new Set();
    const uniqueCases = [];

    clientReports.forEach((report) => {
      const caseId = report?.caseReported?._id;
      if (caseId && !uniqueCaseIds.has(caseId)) {
        uniqueCaseIds.add(caseId);
        uniqueCases.push(report);
      }
    });

    console.log("Unique cases count:", uniqueCases.length);
    console.log(
      "Duplicate reports count:",
      clientReports.length - uniqueCases.length
    );

    // Get current date (local time)
    const now = new Date();
    const todayStart = getStartOfDay(now);
    const todayEnd = getEndOfDay(now);

    console.log("Current time:", now);
    console.log("Today range:", { start: todayStart, end: todayEnd });

    // Get all upcoming hearings for client cases (from reportsThisYear)
    const allYearlyReports = causeListData.reportsThisYear || [];
    const clientUpcomingReports = allYearlyReports.filter(
      (item) => item?.caseReported?.client === clientId
    );

    console.log("Upcoming reports (this year):", clientUpcomingReports.length);

    // Group reports by case ID and keep the earliest upcoming hearing for each case
    const upcomingByCaseId = new Map();

    clientUpcomingReports.forEach((report) => {
      const caseId = report?.caseReported?._id;
      const adjournedDate = report?.adjournedDate;

      if (!caseId || !adjournedDate) return;

      const hearingDate = new Date(adjournedDate);

      // Only include future or today's hearings
      if (hearingDate >= todayStart) {
        if (!upcomingByCaseId.has(caseId)) {
          upcomingByCaseId.set(caseId, report);
        } else {
          // Keep the earliest upcoming hearing
          const existing = upcomingByCaseId.get(caseId);
          const existingDate = new Date(existing.adjournedDate);
          if (hearingDate < existingDate) {
            upcomingByCaseId.set(caseId, report);
          }
        }
      }
    });

    const allUpcomingCases = Array.from(upcomingByCaseId.values());
    console.log("Unique upcoming cases:", allUpcomingCases.length);

    // Today's cases
    const todaysCases = allUpcomingCases.filter((caseItem) => {
      const hearingDate = new Date(caseItem.adjournedDate);
      const isToday = isSameDay(hearingDate, now);
      if (isToday) {
        console.log("Today's case found:", {
          suitNo: caseItem.caseReported?.suitNo,
          date: hearingDate,
        });
      }
      return isToday;
    });

    console.log("Today's cases:", todaysCases.length);

    // Upcoming cases (next 7 days, excluding today)
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const nextWeekEnd = new Date(todayStart);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
    nextWeekEnd.setHours(23, 59, 59, 999);

    const upcomingCases = allUpcomingCases
      .filter((caseItem) => {
        const hearingDate = new Date(caseItem.adjournedDate);
        const isInRange =
          hearingDate >= tomorrowStart && hearingDate <= nextWeekEnd;

        if (isInRange) {
          console.log("Upcoming case found:", {
            suitNo: caseItem.caseReported?.suitNo,
            date: hearingDate,
          });
        }

        return isInRange;
      })
      .sort((a, b) => new Date(a.adjournedDate) - new Date(b.adjournedDate));

    console.log("Upcoming cases (next 7 days):", upcomingCases.length);

    // This week's cases (including today)
    const thisWeekEnd = new Date(todayStart);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 6); // Today + 6 more days = 7 days total
    thisWeekEnd.setHours(23, 59, 59, 999);

    const thisWeekCases = allUpcomingCases.filter((caseItem) => {
      const hearingDate = new Date(caseItem.adjournedDate);
      return hearingDate >= todayStart && hearingDate <= thisWeekEnd;
    });

    console.log("This week's cases:", thisWeekCases.length);

    // This month's cases
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    thisMonthEnd.setHours(23, 59, 59, 999);

    const thisMonthCases = allUpcomingCases.filter((caseItem) => {
      const hearingDate = new Date(caseItem.adjournedDate);
      return hearingDate >= thisMonthStart && hearingDate <= thisMonthEnd;
    });

    console.log("This month's cases:", thisMonthCases.length);

    // Stats calculation
    const stats = {
      totalCases: uniqueCases.length,
      todayCases: todaysCases.length,
      upcomingCases: upcomingCases.length,
      thisWeekCases: thisWeekCases.length,
      thisMonthCases: thisMonthCases.length,
      duplicateCount: clientReports.length - uniqueCases.length,
      totalReports: clientReports.length,
    };

    console.log("Final stats:", stats);
    console.log("=== END DATA PROCESSING ===");

    return {
      clientCases: uniqueCases,
      clientReports: clientReports,
      stats,
      todaysCases: todaysCases,
      upcomingCases: upcomingCases,
      allUpcomingCases: allUpcomingCases, // All future cases, not just next 7 days
    };
  }, [causeList, reports, clientId]);

  // Recent reports with memoization (use all reports, not deduplicated)
  const recentReports = useMemo(() => {
    return processedData.clientReports
      .slice()
      .sort(
        (a, b) =>
          new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
      )
      .slice(0, 5);
  }, [processedData.clientReports]);

  // Memoized handlers
  const handleViewSchedule = useCallback(() => {
    setActiveTab("schedule");
  }, []);

  const handleRetry = useCallback(() => {
    fetchData("reports/upcoming", "causeList");
    fetchData("reports", "reports");
  }, [fetchData]);

  // Loading state
  if (loading.reports || loading.causeList) {
    return (
      <LoadingSpinner message="Loading your cases..." fullScreen={false} />
    );
  }

  // Error state
  if (error.reports || error.causeList) {
    return (
      <div className="p-4">
        <PageErrorAlert
          error={error.reports || error.causeList}
          retry={handleRetry}
        />
      </div>
    );
  }

  const {
    stats,
    todaysCases,
    upcomingCases,
    clientCases,
    clientReports,
    allUpcomingCases,
  } = processedData;

  return (
    <div className="client-dashboard min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4">
      {/* Notifications Banner */}
      {todaysCases.length > 0 && (
        <NotificationBanner
          count={todaysCases.length}
          onViewSchedule={handleViewSchedule}
        />
      )}

      {/* Dashboard Header */}
      <div className="dashboard-header mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Client Dashboard
              </h1>
              {stats.duplicateCount > 0 && (
                <Tooltip
                  title={`You have ${stats.totalReports} total reports for ${stats.totalCases} unique cases. ${stats.duplicateCount} duplicate reports merged.`}>
                  <InfoCircleOutlined className="text-blue-500 cursor-help" />
                </Tooltip>
              )}
            </div>
            <p className="text-gray-600 m-0 text-lg">
              Welcome back,{" "}
              <span className="font-semibold">
                {user?.data?.firstName || "Client"}
              </span>
            </p>
          </div>
          <Space size="large" className="flex-wrap">
            <Badge
              count={stats.todayCases}
              showZero
              color="#ef4444"
              title="Cases scheduled for today">
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                <span className="text-sm text-gray-700 font-medium">Today</span>
              </div>
            </Badge>
            <Badge
              count={stats.upcomingCases}
              showZero
              color="#3b82f6"
              title="Upcoming cases in next 7 days (excluding today)">
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                <span className="text-sm text-gray-700 font-medium">
                  Next 7 Days
                </span>
              </div>
            </Badge>
            <Badge
              count={stats.thisWeekCases}
              showZero
              color="#10b981"
              title="Total cases this week (including today)">
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                <span className="text-sm text-gray-700 font-medium">
                  This Week
                </span>
              </div>
            </Badge>
          </Space>
        </div>
      </div>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title={
              <div className="flex items-center gap-1">
                <span>Total Cases</span>
                <Tooltip
                  title={`${stats.totalCases} unique cases from ${stats.totalReports} reports`}>
                  <InfoCircleOutlined className="text-xs text-gray-400 cursor-help" />
                </Tooltip>
              </div>
            }
            value={stats.totalCases}
            icon={<FileTextOutlined className="text-blue-500" />}
            color="#3b82f6"
            subtitle="Unique legal matters"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Today's Hearings"
            value={stats.todayCases}
            icon={<CalendarOutlined className="text-green-500" />}
            color="#10b981"
            subtitle="Scheduled for today"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="This Week"
            value={stats.thisWeekCases}
            icon={<ClockCircleOutlined className="text-orange-500" />}
            color="#f59e0b"
            subtitle="Next 7 days (incl. today)"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="This Month"
            value={stats.thisMonthCases}
            icon={<TeamOutlined className="text-purple-500" />}
            color="#8b5cf6"
            subtitle="Monthly hearings"
          />
        </Col>
      </Row>

      {/* Debug info in development */}
      {/* {process.env.NODE_ENV === "development" && (
        <Card size="small" className="mb-4 bg-yellow-50 border-yellow-200">
          <div className="text-xs space-y-1">
            <p className="font-semibold text-yellow-800">Debug Info:</p>
            <p>Total Reports: {stats.totalReports}</p>
            <p>Unique Cases: {stats.totalCases}</p>
            <p>Duplicates: {stats.duplicateCount}</p>
            <p>All Upcoming: {allUpcomingCases.length}</p>
            <p>Today: {stats.todayCases}</p>
            <p>Next 7 Days: {stats.upcomingCases}</p>
            <p>This Week: {stats.thisWeekCases}</p>
            <p>This Month: {stats.thisMonthCases}</p>
          </div>
        </Card>
      )} */}

      {/* Main Content Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="dashboard-tabs"
        size="large"
        items={[
          {
            key: "overview",
            label: (
              <span className="flex items-center gap-2">
                <TrophyOutlined />
                <span className="hidden sm:inline">Overview</span>
              </span>
            ),
            children: (
              <Row gutter={[16, 16]}>
                {/* Left Column - Cases */}
                <Col xs={24} lg={12}>
                  <div className="space-y-4">
                    {/* Upcoming Cases Card */}
                    <Card
                      title={
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-lg">
                            Upcoming Cases (Next 7 Days)
                          </span>
                          <Badge
                            count={upcomingCases.length}
                            color="blue"
                            showZero
                          />
                        </div>
                      }
                      className="shadow-md hover:shadow-lg transition-shadow"
                      extra={
                        upcomingCases.length > 3 && (
                          <Button
                            type="link"
                            size="small"
                            onClick={handleViewSchedule}
                            className="font-medium">
                            View All →
                          </Button>
                        )
                      }>
                      {upcomingCases.length > 0 ? (
                        <UpcomingCasesComponent
                          cases={upcomingCases.slice(0, 3)}
                          compact={true}
                        />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <CalendarOutlined className="text-4xl mb-2 text-gray-300" />
                          <p>No upcoming cases in the next 7 days</p>
                        </div>
                      )}
                    </Card>

                    {/* Today's Cases */}
                    {todaysCases.length > 0 && (
                      <Card
                        className="shadow-md border-l-4 border-l-red-500"
                        title={
                          <div className="flex items-center gap-2">
                            <BellOutlined className="text-red-500" />
                            <span className="font-semibold text-red-600">
                              Today's Cases
                            </span>
                            <Badge count={todaysCases.length} color="red" />
                          </div>
                        }>
                        <UpcomingCasesComponent
                          cases={todaysCases}
                          highlightToday={true}
                          showTime={true}
                        />
                      </Card>
                    )}
                  </div>
                </Col>

                {/* Right Column - Reports & Actions */}
                <Col xs={24} lg={12}>
                  <div className="space-y-4">
                    {/* Recent Reports */}
                    <Card
                      title={
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-lg">
                            Recent Case Reports
                          </span>
                          <Badge
                            count={recentReports.length}
                            color="green"
                            showZero
                          />
                        </div>
                      }
                      className="shadow-md hover:shadow-lg transition-shadow"
                      extra={
                        clientReports.length > recentReports.length && (
                          <Button
                            type="link"
                            size="small"
                            onClick={() => setActiveTab("reports")}
                            className="font-medium">
                            View All ({clientReports.length}) →
                          </Button>
                        )
                      }>
                      {recentReports.length > 0 ? (
                        <CaseReportsFeed
                          reports={recentReports}
                          maxItems={4}
                          compact={true}
                          showFilters={false}
                          pagination={false}
                        />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FileTextOutlined className="text-4xl mb-2 text-gray-300" />
                          <p>No recent reports</p>
                        </div>
                      )}
                    </Card>

                    {/* Quick Actions */}
                    <Card title="Quick Actions" className="shadow-md">
                      <div className="space-y-2">
                        <QuickActionItem
                          icon={<FileTextOutlined className="text-blue-500" />}
                          title="Download Documents"
                          description="Access all case files and reports"
                          onClick={() => console.log("Download")}
                        />
                        <QuickActionItem
                          icon={<TeamOutlined className="text-green-500" />}
                          title="Contact Legal Team"
                          description="Message your assigned lawyers"
                          onClick={() => console.log("Contact")}
                        />
                        <QuickActionItem
                          icon={
                            <CalendarOutlined className="text-purple-500" />
                          }
                          title="Schedule Consultation"
                          description="Book a meeting with your lawyer"
                          onClick={() => console.log("Schedule")}
                        />
                      </div>
                    </Card>
                  </div>
                </Col>
              </Row>
            ),
          },
          {
            key: "schedule",
            label: (
              <span className="flex items-center gap-2">
                <CalendarOutlined />
                <span className="hidden sm:inline">Schedule</span>
              </span>
            ),
            children: (
              <Card className="shadow-md">
                {allUpcomingCases.length > 0 ? (
                  <CaseScheduleTimeline
                    cases={allUpcomingCases}
                    showFilters={true}
                    clientId={clientId}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CalendarOutlined className="text-4xl mb-4 text-gray-300" />
                    <p className="text-lg">No case schedule available</p>
                    <p className="text-sm">
                      You don't have any cases scheduled yet.
                    </p>
                  </div>
                )}
              </Card>
            ),
          },
          {
            key: "reports",
            label: (
              <span className="flex items-center gap-2">
                <FileTextOutlined />
                <span className="hidden sm:inline">Reports</span>
              </span>
            ),
            children: (
              <Card className="shadow-md">
                {clientReports.length > 0 ? (
                  <CaseReportsFeed
                    reports={clientReports}
                    showFilters={true}
                    pagination={true}
                    pageSize={10}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileTextOutlined className="text-4xl mb-4 text-gray-300" />
                    <p className="text-lg">No case reports available</p>
                    <p className="text-sm">
                      You don't have any case reports yet.
                    </p>
                  </div>
                )}
              </Card>
            ),
          },
        ]}
      />

      {/* Support Footer */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center shadow-sm">
              <TeamOutlined className="text-blue-600 text-2xl" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 m-0 text-lg">
                Need Assistance?
              </h3>
              <p className="text-gray-600 m-0 text-sm">
                Your legal team is available to answer any questions
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="primary" size="large" className="shadow-md">
              Contact Support
            </Button>
            <Button size="large">Schedule Call</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ClientCaseDashboard;
