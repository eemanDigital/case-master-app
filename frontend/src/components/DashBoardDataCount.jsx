import React, { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  FaBriefcase,
  FaUsers,
  FaChartLine,
  FaUserTie,
  FaCheckCircle,
  FaClock,
  FaFire,
  FaHandshake,
  FaExclamationTriangle,
  FaBalanceScale,
  FaBuilding,
  FaFileContract,
  FaShieldAlt,
  FaGavel,
  FaLandmark,
} from "react-icons/fa";
import { GoLaw, GoOrganization } from "react-icons/go";
import { Statistic, Card, Tag, Tooltip, Progress, Table, List, Typography } from "antd";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  getUserStatistics,
  selectUserStatistics,
  selectStatisticsLoading,
  selectStatisticsError,
} from "../redux/features/auth/authSlice";
import { getMatterStats } from "../redux/features/matter/matterSlice";

const { Text } = Typography;

// ============================================
// DASHBOARD CARD
// ============================================
const DashboardCard = ({
  icon: Icon,
  count,
  label,
  gradient,
  trend,
  description,
  loading,
}) => {
  const getTrendIcon = () => {
    if (trend > 0)
      return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
    if (trend < 0)
      return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
    return null;
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-100 to-gray-200 border-0 rounded-2xl h-32 animate-pulse">
        <div className="flex items-center gap-4 h-full">
          <div className="w-12 h-12 bg-gray-300 rounded-full" />
          <div className="space-y-2">
            <div className="h-6 w-16 bg-gray-300 rounded" />
            <div className="h-4 w-20 bg-gray-300 rounded" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`bg-gradient-to-br ${gradient} border-0 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] h-32`}>
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-white/20">
            <Icon className="text-2xl text-white" />
          </div>
          <div className="text-white">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {(count ?? 0).toLocaleString()}
              </div>
              {trend != null && trend !== 0 && (
                <Tag
                  color={trend > 0 ? "success" : "error"}
                  className="m-0 border-0 bg-white/20">
                  <div className="flex items-center gap-1 text-xs">
                    {getTrendIcon()}
                    {Math.abs(trend)}%
                  </div>
                </Tag>
              )}
            </div>
            <div className="text-sm font-medium opacity-90 mt-1">{label}</div>
          </div>
        </div>
        {description && (
          <Tooltip title={description}>
            <InformationCircleIcon className="w-5 h-5 text-white/70 cursor-help" />
          </Tooltip>
        )}
      </div>
    </Card>
  );
};

DashboardCard.displayName = "DashboardCard";

// ============================================
// MINI STAT CARD
// ============================================
const MiniStatCard = ({ title, value, icon: Icon, color, suffix = "" }) => (
  <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm">
    <div className={`p-2 rounded-lg bg-${color}/10`}>
      <Icon className={`text-${color}`} />
    </div>
    <div>
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-lg font-bold" style={{ color }}>
        {value?.toLocaleString()}{suffix}
      </div>
    </div>
  </div>
);

// ============================================
// MATTER TYPE CHART
// ============================================
const MatterTypeChart = ({ data, loading }) => {
  const typeConfig = {
    litigation: { color: "#3B82F6", icon: FaGavel, label: "Litigation" },
    advisory: { color: "#8B5CF6", icon: FaShieldAlt, label: "Advisory" },
    retainer: { color: "#10B981", icon: FaFileContract, label: "Retainer" },
    corporate: { color: "#F59E0B", icon: FaBuilding, label: "Corporate" },
    property: { color: "#EF4444", icon: FaLandmark, label: "Property" },
    general: { color: "#6B7280", icon: FaBriefcase, label: "General" },
  };

  const total = useMemo(() => data?.reduce((sum, item) => sum + item.count, 0) || 0, [data]);

  if (loading) {
    return <Card className="border-0 rounded-2xl shadow-sm h-64 animate-pulse" />;
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <FaChartLine className="text-blue-600" />
          <span>Matters by Type</span>
        </div>
      }
      className="border-0 rounded-2xl shadow-sm">
      <div className="space-y-3">
        {data?.map((item) => {
          const config = typeConfig[item._id] || { color: "#6B7280", label: item._id };
          const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const IconComponent = config.icon || FaBriefcase;
          
          return (
            <div key={item._id} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <Text className="text-sm font-medium">{config.label}</Text>
                  <Text className="text-sm text-gray-500">
                    {item.count} ({percentage}%)
                  </Text>
                </div>
                <Progress
                  percent={percentage}
                  showInfo={false}
                  strokeColor={config.color}
                  trailColor="#E5E7EB"
                  size="small"
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between items-center">
          <Text type="secondary">Total Matters</Text>
          <Text strong className="text-lg">{total}</Text>
        </div>
      </div>
    </Card>
  );
};

// ============================================
// MATTER STATUS CHART
// ============================================
const MatterStatusChart = ({ data, loading }) => {
  const statusConfig = {
    active: { color: "#10B981", label: "Active", status: "success" },
    pending: { color: "#F59E0B", label: "Pending", status: "warning" },
    "on-hold": { color: "#6B7280", label: "On Hold", status: "default" },
    completed: { color: "#3B82F6", label: "Completed", status: "processing" },
    settled: { color: "#8B5CF6", label: "Settled", status: "purple" },
    terminated: { color: "#EF4444", label: "Terminated", status: "error" },
  };

  const total = useMemo(() => data?.reduce((sum, item) => sum + item.count, 0) || 0, [data]);

  if (loading) {
    return <Card className="border-0 rounded-2xl shadow-sm h-64 animate-pulse" />;
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <FaCheckCircle className="text-green-600" />
          <span>Matters by Status</span>
        </div>
      }
      className="border-0 rounded-2xl shadow-sm">
      <div className="flex flex-wrap gap-2 mb-4">
        {data?.map((item) => {
          const config = statusConfig[item._id] || { color: "#6B7280", label: item._id };
          const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
          
          return (
            <Tag
              key={item._id}
              color={config.status}
              className="px-3 py-1 rounded-full">
              {config.label}: {item.count}
            </Tag>
          );
        })}
      </div>
      <div className="space-y-2">
        {data?.map((item) => {
          const config = statusConfig[item._id] || { color: "#6B7280", label: item._id };
          const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
          
          return (
            <div key={item._id} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <Text className="text-sm font-medium">{config.label}</Text>
                  <Text className="text-sm text-gray-500">{item.count}</Text>
                </div>
                <Progress
                  percent={percentage}
                  showInfo={false}
                  strokeColor={config.color}
                  trailColor="#E5E7EB"
                  size="small"
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ============================================
// PRIORITY OVERVIEW
// ============================================
const PriorityOverview = ({ data, loading }) => {
  const priorityConfig = {
    high: { color: "#EF4444", label: "High Priority", icon: FaFire },
    medium: { color: "#F59E0B", label: "Medium Priority", icon: FaClock },
    low: { color: "#10B981", label: "Low Priority", icon: FaCheckCircle },
  };

  const total = useMemo(() => data?.reduce((sum, item) => sum + item.count, 0) || 0, [data]);

  if (loading) {
    return <Card className="border-0 rounded-2xl shadow-sm h-48 animate-pulse" />;
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <FaExclamationTriangle className="text-amber-600" />
          <span>Priority Overview</span>
        </div>
      }
      className="border-0 rounded-2xl shadow-sm">
      <div className="grid grid-cols-3 gap-3">
        {data?.map((item) => {
          const config = priorityConfig[item._id] || { color: "#6B7280", label: item._id };
          const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const IconComponent = config.icon || FaChartLine;
          
          return (
            <div
              key={item._id}
              className="p-4 rounded-xl text-center"
              style={{ backgroundColor: `${config.color}10` }}>
              <IconComponent
                className="mx-auto mb-2"
                style={{ color: config.color, fontSize: "1.5rem" }}
              />
              <div className="text-2xl font-bold" style={{ color: config.color }}>
                {item.count}
              </div>
              <div className="text-xs text-gray-500 mt-1">{config.label}</div>
              <div className="text-xs text-gray-400 mt-1">{percentage}%</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ============================================
// RECENT ACTIVITY
// ============================================
const RecentActivity = ({ data, loading }) => {
  if (loading) {
    return <Card className="border-0 rounded-2xl shadow-sm h-64 animate-pulse" />;
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <FaClock className="text-purple-600" />
          <span>Recent Activity</span>
        </div>
      }
      className="border-0 rounded-2xl shadow-sm">
      <List
        dataSource={data?.slice(0, 7) || []}
        renderItem={(item) => (
          <List.Item>
            <div className="flex items-center gap-3 w-full">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <div className="flex-1">
                <Text>{item.count} matter(s) updated</Text>
              </div>
              <Text type="secondary" className="text-xs">
                {formatDate(item._id)}
              </Text>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};

// ============================================
// USER STATS OVERVIEW
// ============================================
const UserStatsOverview = ({ userStats, loading }) => {
  const statistics = userStats?.statistics || {};
  const breakdown = typeof statistics?.breakdown === 'object' ? statistics.breakdown : {};
  const roles = typeof statistics?.roles === 'object' ? statistics.roles : {};

  const userStatsData = [
    { label: "Total Users", value: statistics.total || 0, color: "#3B82F6", icon: FaUsers },
    { label: "Lawyers", value: breakdown.lawyers || roles.lawyer || 0, color: "#8B5CF6", icon: GoLaw },
    { label: "Staff", value: breakdown.staff || roles.staff || 0, color: "#10B981", icon: FaUserTie },
    { label: "Clients", value: breakdown.clients || roles.client || 0, color: "#F59E0B", icon: FaHandshake },
    { label: "Admins", value: breakdown.admins || roles.admin || 0, color: "#EF4444", icon: FaShieldAlt },
    { label: "Verified", value: breakdown.verifiedUsers || statistics.verified || 0, color: "#06B6D4", icon: FaCheckCircle },
  ];

  if (loading) {
    return <Card className="border-0 rounded-2xl shadow-sm h-64 animate-pulse" />;
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <GoOrganization className="text-indigo-600" />
          <span>User Overview</span>
        </div>
      }
      className="border-0 rounded-2xl shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {userStatsData.map((stat, index) => (
          <div
            key={index}
            className="p-3 rounded-xl text-center"
            style={{ backgroundColor: `${stat.color}10` }}>
            <stat.icon
              className="mx-auto mb-1"
              style={{ color: stat.color, fontSize: "1.25rem" }}
            />
            <div className="text-xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ============================================
// QUICK METRICS ROW
// ============================================
const QuickMetricsRow = ({ overview, myMatters, lawyerCount, loading }) => {
  const metrics = [
    {
      title: "Active",
      value: overview?.activeMatters || 0,
      color: "#10B981",
      bgColor: "from-green-50 to-emerald-50",
    },
    {
      title: "Pending",
      value: overview?.pendingMatters || 0,
      color: "#F59E0B",
      bgColor: "from-amber-50 to-yellow-50",
    },
    {
      title: "Completed",
      value: overview?.completedMatters || 0,
      color: "#3B82F6",
      bgColor: "from-blue-50 to-cyan-50",
    },
    {
      title: "High Priority",
      value: (overview?.highPriorityMatters || 0) + (overview?.urgentPriorityMatters || 0),
      color: "#EF4444",
      bgColor: "from-red-50 to-rose-50",
    },
    {
      title: "Avg Age",
      value: Math.round(overview?.averageAgeDays || 0),
      color: "#8B5CF6",
      bgColor: "from-purple-50 to-violet-50",
      suffix: " days",
    },
    {
      title: "My Matters",
      value: myMatters || 0,
      color: "#06B6D4",
      bgColor: "from-cyan-50 to-sky-50",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border-0 rounded-2xl h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {metrics.map((metric, index) => (
        <Card
          key={index}
          className={`border-0 rounded-2xl shadow-sm bg-gradient-to-br ${metric.bgColor}`}>
          <Statistic
            title={<span className="text-xs text-gray-500">{metric.title}</span>}
            value={metric.value}
            valueStyle={{ color: metric.color, fontSize: "1.25rem" }}
            suffix={metric.suffix}
          />
        </Card>
      ))}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const DashBoardDataCount = ({ trends = {} }) => {
  const dispatch = useDispatch();

  // Selectors
  const userStatistics = useSelector(selectUserStatistics);
  const statsLoading = useSelector(selectStatisticsLoading);
  const statsError = useSelector(selectStatisticsError);

  const matterStats = useSelector((state) => state.matter.stats);
  const matterLoading = useSelector((state) => state.matter.isLoading);
  const matterError = useSelector((state) => state.matter.isError);

  // Fetch on mount if not in store
  useEffect(() => {
    if (!userStatistics) dispatch(getUserStatistics());
    if (!matterStats) dispatch(getMatterStats());
  }, [dispatch, userStatistics, matterStats]);

  // ── Matter data ───────────────────────────────
  const overview = typeof matterStats?.overview === 'object' ? matterStats.overview : {};
  const byType = Array.isArray(matterStats?.byType) ? matterStats.byType : [];
  const byStatus = Array.isArray(matterStats?.byStatus) ? matterStats.byStatus : [];
  const byPriority = Array.isArray(matterStats?.byPriority) ? matterStats.byPriority : [];
  const recentActivity = Array.isArray(matterStats?.recentActivity) ? matterStats.recentActivity : [];
  
  const totalMatters = Number(overview?.totalMatters ?? 0) || 0;
  const myMatters = Number(matterStats?.myMatters ?? 0) || 0;

  // ── User data ───────────────────────────────
  const statistics = userStatistics?.statistics || {};
  const breakdown = typeof statistics?.breakdown === 'object' ? statistics.breakdown : {};
  const roles = typeof statistics?.roles === 'object' ? statistics.roles : {};

  const lawyerCount = Number(breakdown?.lawyers ?? roles?.lawyer ?? 0) || 0;
  const clientCount = Number(breakdown?.clients ?? roles?.client ?? 0) || 0;
  const staffCount = Number(breakdown?.staff ?? roles?.staff ?? 0) || 0;
  const totalUsers = Number(statistics?.total ?? 0) || 0;

  // ── Derived ──────────────────────────────────────
  const isLoading = statsLoading || matterLoading;

  // ── Hero cards config ───────────────────────────
  const cardData = [
    {
      icon: FaBriefcase,
      count: totalMatters,
      label: "Total Matters",
      gradient: "from-blue-500 via-blue-600 to-blue-700",
      description: "All matters in the system",
      trend: trends.matters,
    },
    {
      icon: FaUsers,
      count: staffCount,
      label: "Staff Members",
      gradient: "from-green-500 via-green-600 to-green-700",
      description: "Total staff including administrative",
      trend: trends.staff,
    },
    {
      icon: GoLaw,
      count: lawyerCount,
      label: "Legal Team",
      gradient: "from-purple-500 via-purple-600 to-purple-700",
      description: "Qualified lawyers and legal professionals",
      trend: trends.lawyers,
    },
    {
      icon: FaHandshake,
      count: clientCount,
      label: "Active Clients",
      gradient: "from-orange-500 via-orange-600 to-orange-700",
      description: "Active client relationships",
      trend: trends.clients,
    },
  ];

  return (
    <div className="w-full py-4 space-y-6">
      {/* ── Hero cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardData.map((card, i) => (
          <DashboardCard key={i} {...card} loading={isLoading} />
        ))}
      </div>

      {/* ── Quick metrics row ── */}
      <QuickMetricsRow
        overview={overview}
        myMatters={myMatters}
        lawyerCount={lawyerCount}
        loading={isLoading}
      />

      {/* ── Charts section ── */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MatterTypeChart data={byType} loading={isLoading} />
          <MatterStatusChart data={byStatus} loading={isLoading} />
          <div className="space-y-4">
            <PriorityOverview data={byPriority} loading={isLoading} />
            <RecentActivity data={recentActivity} loading={isLoading} />
          </div>
        </div>
      )}

      {/* ── User stats section ── */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <UserStatsOverview userStats={userStatistics} loading={isLoading} />
          
          {/* Efficiency Metrics */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <FaChartLine className="text-teal-600" />
                <span>Efficiency Metrics</span>
              </div>
            }
            className="border-0 rounded-2xl shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50">
                <div className="text-sm text-gray-500 mb-1">Cases per Lawyer</div>
                <div className="text-2xl font-bold text-teal-600">
                  {lawyerCount > 0 ? Math.round(totalMatters / lawyerCount) : 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">average caseload</div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50">
                <div className="text-sm text-gray-500 mb-1">Completion Rate</div>
                <div className="text-2xl font-bold text-indigo-600">
                  {totalMatters > 0 
                    ? Math.round((overview.completedMatters / totalMatters) * 100)
                    : 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">of all matters</div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50">
                <div className="text-sm text-gray-500 mb-1">Pending Rate</div>
                <div className="text-2xl font-bold text-amber-600">
                  {totalMatters > 0 
                    ? Math.round((overview.pendingMatters / totalMatters) * 100)
                    : 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">awaiting action</div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50">
                <div className="text-sm text-gray-500 mb-1">Active Rate</div>
                <div className="text-2xl font-bold text-rose-600">
                  {totalMatters > 0 
                    ? Math.round((overview.activeMatters / totalMatters) * 100)
                    : 0}%
                </div>
                <div className="text-xs text-gray-400 mt-1">in progress</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Loading skeleton for charts ── */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Error banners ── */}
      {(statsError || matterError) && !isLoading && (
        <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {statsError && <p>Failed to load user statistics.</p>}
          {matterError && <p>Failed to load matter statistics.</p>}
          <p className="mt-1">Please refresh the page.</p>
        </div>
      )}
    </div>
  );
};

DashBoardDataCount.displayName = "DashBoardDataCount";

DashBoardDataCount.propTypes = {
  trends: PropTypes.shape({
    matters: PropTypes.number,
    staff: PropTypes.number,
    lawyers: PropTypes.number,
    clients: PropTypes.number,
  }),
};

DashBoardDataCount.defaultProps = {
  trends: {},
};

export default DashBoardDataCount;
