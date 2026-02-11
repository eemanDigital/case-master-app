// components/advisory/dashboard/AdvisoryStatsGrid.jsx
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Card, Skeleton, Tooltip, Progress, Row, Col } from "antd";
import {
  FolderOpenOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { selectAdvisoryStats } from "../../../redux/features/advisory/advisorySlice";

const StatCard = ({
  icon,
  label,
  value,
  subValue,
  color,
  trend,
  tooltip,
  progress,
  loading,
}) => {
  if (loading) {
    return (
      <Card
        className="rounded-xl border-slate-200"
        bodyStyle={{ padding: "20px" }}>
        <Skeleton active paragraph={{ rows: 1 }} title={false} />
      </Card>
    );
  }

  return (
    <Tooltip title={tooltip} placement="topLeft">
      <Card
        className="rounded-xl border-slate-200 hover:shadow-md transition-all duration-200 cursor-help"
        bodyStyle={{ padding: "20px" }}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${color}15` }}>
                <span style={{ color }}>{icon}</span>
              </span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {label}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">
                {value.toLocaleString()}
              </span>
              {subValue && (
                <span className="text-xs text-slate-500">{subValue}</span>
              )}
            </div>

            {progress !== undefined && (
              <div className="w-32">
                <Progress
                  percent={progress}
                  size="small"
                  showInfo={false}
                  strokeColor={color}
                  trailColor="#f1f5f9"
                />
              </div>
            )}

            {trend && (
              <div className="flex items-center gap-1 text-xs">
                <span
                  className={
                    trend.isPositive ? "text-emerald-600" : "text-red-600"
                  }>
                  {trend.isPositive ? "↑" : "↓"} {trend.value}%
                </span>
                <span className="text-slate-400">vs last month</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Tooltip>
  );
};

const AdvisoryStatsGrid = ({ loading = false }) => {
  const stats = useSelector(selectAdvisoryStats);

  const formattedStats = useMemo(() => {
    if (!stats) return null;

    const {
      overview = {},
      byType = [],
      researchQuestions = {},
      deliverables = {},
      recentAdvisories = [],
    } = stats;

    // Calculate setup completion rate
    const totalWithSetup = byType.reduce((sum, item) => sum + item.count, 0);
    const setupRate = overview.totalAdvisoryMatters
      ? Math.round((totalWithSetup / overview.totalAdvisoryMatters) * 100)
      : 0;

    // Calculate deliverables completion rate
    const deliverablesCompletionRate = deliverables.total
      ? Math.round(((deliverables.delivered || 0) / deliverables.total) * 100)
      : 0;

    // Calculate overdue percentage
    const overduePercentage = deliverables.total
      ? Math.round(((deliverables.overdue || 0) / deliverables.total) * 100)
      : 0;

    // Weekly trend (mock calculation - replace with real data)
    const weeklyTrend =
      recentAdvisories.length > 1
        ? {
            isPositive: recentAdvisories[0]?.count > recentAdvisories[1]?.count,
            value: recentAdvisories[0]?.count || 0,
          }
        : null;

    return {
      totalMatters: {
        value: overview.totalAdvisoryMatters || 0,
        subValue: `${overview.totalAdvisoryMatters || 0} total`,
        color: "#4f46e5",
        icon: <FolderOpenOutlined />,
        tooltip: "Total advisory matters across all statuses",
        trend: weeklyTrend
          ? {
              isPositive: weeklyTrend.isPositive,
              value: Math.abs(weeklyTrend.value),
            }
          : null,
      },
      activeMatters: {
        value: overview.activeAdvisoryMatters || 0,
        subValue: `${overview.inProgressAdvisoryMatters || 0} in progress`,
        color: "#3b82f6",
        icon: <SyncOutlined spin />,
        tooltip: "Currently active advisory matters",
        progress: overview.totalAdvisoryMatters
          ? Math.round(
              (overview.activeAdvisoryMatters / overview.totalAdvisoryMatters) *
                100,
            )
          : 0,
      },
      pendingMatters: {
        value: overview.pendingAdvisoryMatters || 0,
        subValue: `${overview.pendingAdvisoryMatters || 0} pending`,
        color: "#f59e0b",
        icon: <ClockCircleOutlined />,
        tooltip: "Awaiting action or review",
        progress: overview.totalAdvisoryMatters
          ? Math.round(
              (overview.pendingAdvisoryMatters /
                overview.totalAdvisoryMatters) *
                100,
            )
          : 0,
      },
      completedMatters: {
        value: overview.completedAdvisoryMatters || 0,
        subValue: `${overview.completedAdvisoryMatters || 0} completed`,
        color: "#10b981",
        icon: <CheckCircleOutlined />,
        tooltip: "Successfully completed matters",
        progress: overview.totalAdvisoryMatters
          ? Math.round(
              (overview.completedAdvisoryMatters /
                overview.totalAdvisoryMatters) *
                100,
            )
          : 0,
      },
      setupStatus: {
        value: totalWithSetup,
        subValue: `${setupRate}% completion`,
        color: "#8b5cf6",
        icon: <FileTextOutlined />,
        tooltip: "Matters with complete advisory setup",
        progress: setupRate,
      },
      deliverables: {
        value: deliverables.total || 0,
        subValue: `${deliverables.delivered || 0} delivered`,
        color: "#14b8a6",
        icon: <CheckCircleOutlined />,
        tooltip: "Total deliverables across all matters",
        progress: deliverablesCompletionRate,
      },
      overdue: {
        value: deliverables.overdue || 0,
        subValue: `${overduePercentage}% of total`,
        color: "#ef4444",
        icon: <WarningOutlined />,
        tooltip: "Overdue deliverables requiring immediate attention",
      },
      researchQuestions: {
        value: researchQuestions.total || 0,
        subValue: `${researchQuestions.byStatus?.find((s) => s._id === "answered")?.count || 0} answered`,
        color: "#ec4899",
        icon: <FileTextOutlined />,
        tooltip: "Research questions across all matters",
      },
    };
  }, [stats]);

  if (!formattedStats && !loading) {
    return (
      <Card className="rounded-xl border-slate-200 bg-slate-50">
        <div className="text-center py-8">
          <FolderOpenOutlined className="text-3xl text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">No statistics available</p>
          <p className="text-xs text-slate-400 mt-1">
            Create your first advisory matter to see statistics
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Stats Row */}
      <Row gutter={[16, 16]}>
        {[
          "totalMatters",
          "activeMatters",
          "pendingMatters",
          "completedMatters",
        ].map((key) => (
          <Col xs={24} sm={12} lg={6} key={key}>
            <StatCard {...formattedStats?.[key]} loading={loading} />
          </Col>
        ))}
      </Row>

      {/* Secondary Stats Row */}
      <Row gutter={[16, 16]}>
        {["setupStatus", "deliverables", "overdue", "researchQuestions"].map(
          (key) => (
            <Col xs={24} sm={12} lg={6} key={key}>
              <StatCard {...formattedStats?.[key]} loading={loading} />
            </Col>
          ),
        )}
      </Row>

      {/* Advisory Type Distribution - Optional */}
      {stats?.byType?.length > 0 && (
        <Card
          className="rounded-xl border-slate-200"
          bodyStyle={{ padding: "20px" }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-slate-700">
              Advisory Types
            </h4>
            <span className="text-xs text-slate-400">
              {stats.byType.length} types active
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.byType.slice(0, 5).map((type) => (
              <div
                key={type._id}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
                <span className="text-xs font-medium text-slate-700 capitalize">
                  {type._id.replace(/_/g, " ")}
                </span>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                  {type.count}
                </span>
              </div>
            ))}
            {stats.byType.length > 5 && (
              <span className="text-xs text-slate-500 px-2 py-1.5">
                +{stats.byType.length - 5} more
              </span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdvisoryStatsGrid;
