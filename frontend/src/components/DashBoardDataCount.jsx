import React, { useMemo } from "react";
import PropTypes from "prop-types";
import {
  FaBriefcase,
  FaUsers,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaGavel,
  FaUserCheck,
  FaUserTie,
  FaChartPie,
  FaShieldAlt,
  FaHandshake,
} from "react-icons/fa";
import { Card, Progress } from "antd";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

const DashboardCard = ({
  icon: Icon,
  count,
  label,
  gradient,
  trend,
  loading,
}) => {
  if (loading) {
    return (
      <Card className="bg-gray-100 border-0 rounded-2xl h-28 animate-pulse">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-300 rounded-2xl"></div>
            <div className="space-y-2">
              <div className="h-7 w-20 bg-gray-300 rounded"></div>
              <div className="h-4 w-24 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`bg-gradient-to-br ${gradient} border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] overflow-hidden relative`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
      <div className="flex items-center justify-between h-full relative z-10">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="p-2 sm:p-4 rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
            <Icon className="text-xl sm:text-3xl text-white" />
          </div>
          <div className="text-white">
            <div className="flex items-center gap-1 sm:gap-3">
              <div className="text-xl sm:text-3xl font-bold tracking-tight">
                {count ?? 0}
              </div>
              {trend !== undefined && trend !== null && (
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    trend >= 0
                      ? "bg-white/20 text-white"
                      : "bg-red-400/30 text-white"
                  }`}>
                  {trend >= 0 ? (
                    <ArrowTrendingUpIcon className="w-3 h-3" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-3 h-3" />
                  )}
                  {Math.abs(trend)}%
                </div>
              )}
            </div>
            <div className="text-sm font-medium opacity-90 mt-1 tracking-wide">
              {label}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

DashboardCard.displayName = "DashboardCard";

const MiniStatCard = ({ icon: Icon, value, label, color, bgColor }) => (
  <Card
    className={`border-0 rounded-xl shadow-md ${bgColor} hover:shadow-lg transition-shadow`}>
    <div className="flex items-center gap-2 sm:gap-3">
      <div className={`p-2 rounded-xl bg-white shadow-sm`}>
        <Icon className="text-base sm:text-lg" style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="text-lg sm:text-2xl font-bold truncate" style={{ color }}>
          {value ?? 0}
        </div>
        <div className="text-xs text-gray-500 font-medium truncate">{label}</div>
      </div>
    </div>
  </Card>
);

const CircularProgress = ({ percentage, color, label, size = 80 }) => (
  <div className="flex flex-col items-center">
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 6}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 6}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={2 * Math.PI * (size / 2 - 6)}
          strokeDashoffset={
            2 * Math.PI * (size / 2 - 6) * (1 - percentage / 100)
          }
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold" style={{ color }}>
          {percentage}%
        </span>
      </div>
    </div>
    <span className="text-xs text-gray-500 mt-2 font-medium">{label}</span>
  </div>
);

const StatBar = ({ label, value, total, color }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

const DashBoardDataCount = ({ matterStats, userStats, loading = false }) => {
  const matterData = matterStats || {};
  const userData = userStats || {};

  const userStatistics = userData.statistics || {};
  const userRoles = userStatistics.breakdown || {};

  const cardData = useMemo(
    () => [
      {
        icon: FaBriefcase,
        count: matterData.totalMatters || 0,
        label: "Total Matters",
        gradient: "from-slate-600 via-slate-700 to-slate-800",
      },
      {
        icon: FaUsers,
        count: userStatistics.total || 0,
        label: "Total Users",
        gradient: "from-emerald-500 via-emerald-600 to-emerald-700",
      },
      {
        icon: FaGavel,
        count: userStatistics.lawyers || 0,
        label: "Lawyers",
        gradient: "from-violet-500 via-violet-600 to-violet-700",
      },
      {
        icon: FaUserCheck,
        count: userStatistics.verified || 0,
        label: "Verified Users",
        gradient: "from-cyan-500 via-cyan-600 to-cyan-700",
      },
    ],
    [matterData, userStatistics],
  );

  const matterMetrics = useMemo(
    () => [
      {
        title: "Active",
        value: matterData.activeMatters || 0,
        icon: FaBriefcase,
        color: "#10B981",
        bgColor: "from-emerald-50 to-teal-50",
      },
      {
        title: "Pending",
        value: matterData.pendingMatters || 0,
        icon: FaClock,
        color: "#F59E0B",
        bgColor: "from-amber-50 to-orange-50",
      },
      {
        title: "Completed",
        value: matterData.completedMatters || 0,
        icon: FaCheckCircle,
        color: "#3B82F6",
        bgColor: "from-blue-50 to-indigo-50",
      },
      {
        title: "High Priority",
        value: matterData.highPriorityMatters || 0,
        icon: FaExclamationTriangle,
        color: "#EF4444",
        bgColor: "from-red-50 to-rose-50",
      },
    ],
    [matterData],
  );

  const userMetrics = useMemo(
    () => [
      {
        title: "Active",
        value: userRoles.activeUsers || 0,
        icon: FaUserCheck,
        color: "#10B981",
        bgColor: "from-emerald-50 to-green-50",
      },
      {
        title: "Clients",
        value: userRoles.clients || 0,
        icon: FaHandshake,
        color: "#8B5CF6",
        bgColor: "from-violet-50 to-purple-50",
      },
      {
        title: "Staff",
        value: userRoles.staff || 0,
        icon: FaUserTie,
        color: "#0EA5E9",
        bgColor: "from-sky-50 to-blue-50",
      },
      {
        title: "Admins",
        value: userRoles.admins || 0,
        icon: FaShieldAlt,
        color: "#F59E0B",
        bgColor: "from-amber-50 to-yellow-50",
      },
    ],
    [userRoles],
  );

  const matterTypes = useMemo(() => matterData.byType || [], [matterData]);
  const matterStatuses = useMemo(() => matterData.byStatus || [], [matterData]);
  const matterPriorities = useMemo(
    () => matterData.byPriority || [],
    [matterData],
  );

  const typeColors = {
    litigation: "#EF4444",
    advisory: "#8B5CF6",
    property: "#10B981",
    corporate: "#3B82F6",
    retainer: "#F59E0B",
    general: "#6B7280",
  };

  const statusColors = {
    active: "#10B981",
    pending: "#F59E0B",
    terminated: "#EF4444",
    completed: "#3B82F6",
    "on-hold": "#6B7280",
    settled: "#8B5CF6",
  };

  const priorityColors = {
    high: "#EF4444",
    medium: "#F59E0B",
    low: "#10B981",
  };

  const totalTypeCount = matterTypes.reduce((acc, t) => acc + t.count, 0);
  const totalStatusCount = matterStatuses.reduce((acc, s) => acc + s.count, 0);

  console.log("Matter Stats:", matterData);
  console.log("User Stats:", userStatistics);

  return (
    <div className="w-full py-4 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {cardData.map((card, index) => (
          <DashboardCard key={index} {...card} loading={loading} />
        ))}
      </div>

      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <Card className="border-0 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-100">
                  <FaChartPie className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Matters by Status
                </h3>
              </div>
              <div className="space-y-3">
                {matterStatuses.map((status) => (
                  <StatBar
                    key={status._id}
                    label={
                      status._id?.replace("-", " ")?.toUpperCase() || "Unknown"
                    }
                    value={status.count}
                    total={totalStatusCount}
                    color={statusColors[status._id] || "#6B7280"}
                  />
                ))}
              </div>
            </Card>

            <Card className="border-0 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-violet-100">
                  <FaGavel className="text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Matters by Type
                </h3>
              </div>
              <div className="space-y-3">
                {matterTypes.map((type) => (
                  <StatBar
                    key={type._id}
                    label={type._id?.toUpperCase() || "Unknown"}
                    value={type.count}
                    total={totalTypeCount}
                    color={typeColors[type._id] || "#6B7280"}
                  />
                ))}
              </div>
            </Card>

            <Card className="border-0 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-amber-100">
                  <FaExclamationTriangle className="text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Priority Overview
                </h3>
              </div>
              <div className="space-y-3">
                {matterPriorities.map((priority) => (
                  <StatBar
                    key={priority._id}
                    label={priority._id?.toUpperCase() || "Unknown"}
                    value={priority.count}
                    total={matterData.totalMatters || 1}
                    color={priorityColors[priority._id] || "#6B7280"}
                  />
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Avg. Age</span>
                  <span className="font-semibold text-gray-800">
                    {Math.round(matterData.averageAgeDays || 0)} days
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">My Matters</span>
                  <span className="font-semibold text-blue-600">
                    {matterData.myMatters || 0}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {matterMetrics.map((metric, index) => (
              <MiniStatCard key={`matter-${index}`} {...metric} />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Card className="border-0 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-indigo-100">
                  <FaUsers className="text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  User Role Distribution
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex justify-center">
                  <CircularProgress
                    percentage={
                      userStatistics.total
                        ? Math.round(
                            ((userRoles.lawyers || 0) / userStatistics.total) *
                              100,
                          )
                        : 0
                    }
                    color="#8B5CF6"
                    label="Lawyers"
                  />
                </div>
                <div className="flex flex-col justify-center space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <FaUserTie className="text-violet-500" /> Lawyers
                    </span>
                    <span className="font-bold text-violet-600">
                      {userRoles.lawyers || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <FaUsers className="text-blue-500" /> Staff
                    </span>
                    <span className="font-bold text-blue-600">
                      {userRoles.staff || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <FaHandshake className="text-purple-500" /> Clients
                    </span>
                    <span className="font-bold text-purple-600">
                      {userRoles.clients || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <FaShieldAlt className="text-amber-500" /> Admins
                    </span>
                    <span className="font-bold text-amber-600">
                      {userRoles.admins || 0}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-0 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <FaUserCheck className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  User Status Overview
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {userMetrics.map((metric, index) => (
                  <MiniStatCard key={`user-${index}`} {...metric} />
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-600">
                    Verification Rate
                  </span>
                  <span className="text-sm font-bold text-green-600">
                    {userStatistics.total
                      ? Math.round(
                          (userStatistics.verified / userStatistics.total) *
                            100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <Progress
                  percent={
                    userStatistics.total
                      ? Math.round(
                          (userStatistics.verified / userStatistics.total) *
                            100,
                        )
                      : 0
                  }
                  strokeColor="#10B981"
                  trailColor="#E5E7EB"
                  showInfo={false}
                />
              </div>
            </Card>
          </div>
        </>
      )}

      {loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <Card
                key={item}
                className="border-0 rounded-xl shadow-sm bg-gray-50 h-20 animate-pulse">
                <div className="flex items-center justify-between h-full">
                  <div className="space-y-2">
                    <div className="h-4 w-16 bg-gray-300 rounded"></div>
                    <div className="h-6 w-10 bg-gray-300 rounded"></div>
                  </div>
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                </div>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <Card
                key={item}
                className="border-0 rounded-2xl h-64 animate-pulse bg-gray-50"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

DashBoardDataCount.displayName = "DashBoardDataCount";

DashBoardDataCount.propTypes = {
  matterStats: PropTypes.shape({
    totalMatters: PropTypes.number,
    activeMatters: PropTypes.number,
    pendingMatters: PropTypes.number,
    completedMatters: PropTypes.number,
    closedMatters: PropTypes.number,
    highPriorityMatters: PropTypes.number,
    urgentPriorityMatters: PropTypes.number,
    averageAgeDays: PropTypes.number,
    myMatters: PropTypes.number,
    byType: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        count: PropTypes.number,
        active: PropTypes.number,
      }),
    ),
    byStatus: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        count: PropTypes.number,
      }),
    ),
    byPriority: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        count: PropTypes.number,
      }),
    ),
    recentActivity: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        count: PropTypes.number,
      }),
    ),
  }),
  userStats: PropTypes.shape({
    success: PropTypes.bool,
    statistics: PropTypes.shape({
      total: PropTypes.number,
      lawyers: PropTypes.number,
      verified: PropTypes.number,
      breakdown: PropTypes.shape({
        clients: PropTypes.number,
        staff: PropTypes.number,
        admins: PropTypes.number,
        activeUsers: PropTypes.number,
        lawyers: PropTypes.number,
        verifiedUsers: PropTypes.number,
      }),
    }),
  }),
  loading: PropTypes.bool,
};

DashBoardDataCount.defaultProps = {
  matterStats: {},
  userStats: {},
  loading: false,
};

export default DashBoardDataCount;
