// components/litigation/dashboard/LitigationStatsGrid.jsx
import { Card, Row, Col, Skeleton, Tooltip, Progress } from "antd";
import {
  FileTextOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  FallOutlined,
  WarningOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

const StatCard = ({ icon, label, value, subValue, color, trend, tooltip }) => {
  return (
    <Tooltip title={tooltip} placement="topLeft">
      <Card
        className="h-full rounded-xl border-gray-200 hover:shadow-md transition-all duration-200 cursor-help"
        bodyStyle={{ padding: "20px" }}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${color}15` }}>
                <span style={{ color }} className="text-base">
                  {icon}
                </span>
              </span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {label}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {value?.toLocaleString() ?? 0}
              </span>
              {subValue && (
                <span className="text-xs text-gray-500">{subValue}</span>
              )}
            </div>

            {trend && (
              <div className="flex items-center gap-1 text-xs">
                <span
                  className={
                    trend.isPositive ? "text-emerald-600" : "text-red-600"
                  }>
                  {trend.isPositive ? <RiseOutlined /> : <FallOutlined />}
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-gray-400">vs last month</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Tooltip>
  );
};

const LitigationStatsGrid = ({ stats, loading }) => {
  if (loading) {
    return (
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map((i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card className="rounded-xl border-gray-200">
              <Skeleton active paragraph={{ rows: 1 }} title={false} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  // Extract data from your exact stats structure
  const totalCases = stats?.totalCases ?? 0;
  const pendingJudgments = stats?.pendingJudgments ?? 0;
  const upcomingHearings = stats?.upcomingHearings ?? 0;

  // Calculate active cases (total - settled)
  const settledCases =
    stats?.byStage?.find((s) => s._id === "settled")?.count ?? 0;
  const activeCases = totalCases - settledCases;

  // Calculate outcome rate
  const dismissedCases =
    stats?.outcomes?.find((o) => o._id === "dismissed")?.count ?? 0;
  const successfulCases =
    stats?.outcomes?.find((o) => o._id === "successful")?.count ?? 0;
  const settlementRate =
    totalCases > 0 ? Math.round((settledCases / totalCases) * 100) : 0;

  // Calculate hearing activity
  const hearingsThisMonth =
    stats?.hearingsByMonth?.find(
      (h) =>
        h._id.month === new Date().getMonth() + 1 &&
        h._id.year === new Date().getFullYear(),
    )?.count ?? 0;

  const statsConfig = [
    {
      icon: <FileTextOutlined />,
      label: "Total Cases",
      value: totalCases,
      subValue: `${activeCases} active`,
      color: "#4f46e5",
      tooltip: "Total litigation matters across all stages",
    },
    {
      icon: <ClockCircleOutlined />,
      label: "Upcoming Hearings",
      value: upcomingHearings,
      subValue: "next 7 days",
      color: "#0ea5e9",
      tooltip: "Scheduled hearings in the next 7 days",
    },
    {
      icon: <WarningOutlined />,
      label: "Pending Judgments",
      value: pendingJudgments,
      subValue: "awaiting decision",
      color: "#f59e0b",
      tooltip: "Cases awaiting judgment delivery",
    },
    {
      icon: <CalendarOutlined />,
      label: "Hearings This Month",
      value: hearingsThisMonth,
      subValue: `${hearingsThisMonth} scheduled`,
      color: "#8b5cf6",
      tooltip: "Total hearings scheduled this month",
    },
  ];

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        {statsConfig.map((stat) => (
          <Col xs={24} sm={12} lg={6} key={stat.label}>
            <StatCard {...stat} />
          </Col>
        ))}
      </Row>

      {/* Secondary Stats Row - Case Outcomes */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card
            className="rounded-xl border-gray-200"
            bodyStyle={{ padding: "20px" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">
                Case Outcomes
              </span>
              <span className="text-xs text-gray-400">
                {dismissedCases + successfulCases + settledCases} resolved
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-gray-600">Settled</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {settledCases}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs text-gray-600">Dismissed</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {dismissedCases}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs text-gray-600">Successful</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {successfulCases}
                </span>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card
            className="rounded-xl border-gray-200"
            bodyStyle={{ padding: "20px" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">
                Settlement Rate
              </span>
              <span className="text-xs text-gray-400">
                {settlementRate}% of total cases
              </span>
            </div>
            <Progress
              percent={settlementRate}
              strokeColor="#10b981"
              trailColor="#f3f4f6"
              size="small"
              format={(percent) => (
                <span className="text-xs font-medium text-gray-700">
                  {percent}%
                </span>
              )}
            />
            <div className="mt-3 text-xs text-gray-500">
              {settlementRate >= 30
                ? "Good settlement rate"
                : "Opportunity for more settlements"}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card
            className="rounded-xl border-gray-200"
            bodyStyle={{ padding: "20px" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">
                Court Distribution
              </span>
              <span className="text-xs text-gray-400">
                {stats?.byCourt?.length || 0} courts
              </span>
            </div>
            <div className="space-y-2">
              {stats?.byCourt?.slice(0, 3).map((court) => (
                <div
                  key={court._id}
                  className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 capitalize">
                    {court._id}
                  </span>
                  <span className="text-xs font-medium text-gray-900">
                    {court.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LitigationStatsGrid;
