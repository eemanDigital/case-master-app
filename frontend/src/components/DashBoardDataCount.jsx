import React from "react";
import PropTypes from "prop-types";
import {
  FaBriefcase,
  FaUsers,
  FaHandshake,
  FaChartLine,
  FaUserTie,
} from "react-icons/fa";
import { GoLaw } from "react-icons/go";
import { Statistic, Card, Tag, Tooltip } from "antd";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const DashboardCard = ({
  icon: Icon,
  count,
  label,
  color,
  gradient,
  trend,
  description,
  loading,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;

    if (trend > 0) {
      return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
    } else if (trend < 0) {
      return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  const getTrendColor = () => {
    if (!trend) return "text-gray-500";
    return trend > 0 ? "text-green-500" : "text-red-500";
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-100 to-gray-200 border-0 rounded-2xl h-32 animate-pulse">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-6 w-16 bg-gray-300 rounded"></div>
              <div className="h-4 w-20 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`bg-gradient-to-br ${gradient} border-0 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm h-32`}>
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl bg-white/20 backdrop-blur-sm`}>
            <Icon className="text-2xl text-white" />
          </div>
          <div className="text-white">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {count?.toLocaleString()}
              </div>
              {trend && (
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

const DashBoardDataCount = ({
  cases,
  staff,
  lawyerCount,
  clientCount,
  // ✅ NEW PROPS for optimized backend
  totalCases = null,
  activeCases = null,
  dashboardStats = null,
  loading = false,
  trends = {},
}) => {
  console.log("DashboardDataCount Props:", {
    cases,
    staff,
    lawyerCount,
    clientCount,
    totalCases,
    activeCases,
  });

  // ✅ Calculate effective values with new props as priority
  const effectiveTotalCases =
    totalCases !== null ? totalCases : cases?.pagination?.count || 0;
  const effectiveActiveCases =
    activeCases !== null ? activeCases : cases?.pagination?.count || 0;

  // ✅ Get counts from dashboardStats if available
  const statsData = dashboardStats?.data || {};
  const finalTotalCases = statsData.totalCases || effectiveTotalCases;
  const finalActiveCases = statsData.activeCases || effectiveActiveCases;

  const cardData = [
    {
      icon: FaBriefcase,
      count: finalTotalCases,
      label: "Total Cases",
      gradient: "from-blue-500 via-blue-600 to-blue-700",
      description: "All cases in the system",
      trend: trends.cases,
      color: "blue",
    },
    {
      icon: FaUsers,
      count: staff || 0,
      label: "Staff Members",
      gradient: "from-green-500 via-green-600 to-green-700",
      description: "Total staff including administrative",
      trend: trends.staff,
      color: "green",
    },
    {
      icon: GoLaw,
      count: lawyerCount || 0,
      label: "Legal Team",
      gradient: "from-purple-500 via-purple-600 to-purple-700",
      description: "Qualified lawyers and legal professionals",
      trend: trends.lawyers,
      color: "purple",
    },
    {
      icon: FaHandshake,
      count: clientCount || 0,
      label: "Active Clients",
      gradient: "from-orange-500 via-orange-600 to-orange-700",
      description: "Active client relationships",
      trend: trends.clients,
      color: "orange",
    },
  ];

  // ✅ Calculate additional metrics using optimized data
  const metrics = {
    casePerLawyer:
      lawyerCount > 0 ? Math.round(finalTotalCases / lawyerCount) : 0,
    clientSatisfaction: 95, // This could come from props or dashboardStats in future
    activeCases: finalActiveCases,
  };

  return (
    <div className="w-full py-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cardData.map((card, index) => (
          <DashboardCard key={index} {...card} loading={loading} />
        ))}
      </div>

      {/* Additional Metrics */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 rounded-2xl shadow-sm bg-gradient-to-r from-cyan-50 to-blue-50">
            <Statistic
              title="Cases per Lawyer"
              value={metrics.casePerLawyer}
              prefix={<FaUserTie className="text-cyan-600 mr-2" />}
              valueStyle={{ color: "#0891B2" }}
              suffix={
                <Tag color="cyan" className="ml-2">
                  Avg
                </Tag>
              }
            />
          </Card>

          <Card className="border-0 rounded-2xl shadow-sm bg-gradient-to-r from-emerald-50 to-green-50">
            <Statistic
              title="Client Satisfaction"
              value={metrics.clientSatisfaction}
              prefix={<FaChartLine className="text-emerald-600 mr-2" />}
              valueStyle={{ color: "#059669" }}
              suffix="%"
            />
          </Card>

          <Card className="border-0 rounded-2xl shadow-sm bg-gradient-to-r from-violet-50 to-purple-50">
            <Statistic
              title="Active Cases"
              value={metrics.activeCases}
              prefix={<FaBriefcase className="text-violet-600 mr-2" />}
              valueStyle={{ color: "#7C3AED" }}
            />
          </Card>
        </div>
      )}

      {/* Loading state for metrics */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <Card
              key={item}
              className="border-0 rounded-2xl shadow-sm bg-gray-50 h-24 animate-pulse">
              <div className="flex items-center justify-between h-full">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-300 rounded"></div>
                  <div className="h-6 w-12 bg-gray-300 rounded"></div>
                </div>
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

DashBoardDataCount.propTypes = {
  // Original props
  cases: PropTypes.shape({
    pagination: PropTypes.shape({
      count: PropTypes.number,
    }),
  }),
  staff: PropTypes.number,
  lawyerCount: PropTypes.number,
  clientCount: PropTypes.number,
  loading: PropTypes.bool,
  trends: PropTypes.shape({
    cases: PropTypes.number,
    staff: PropTypes.number,
    lawyers: PropTypes.number,
    clients: PropTypes.number,
  }),
  // ✅ NEW PROPS for optimized backend integration
  totalCases: PropTypes.number,
  activeCases: PropTypes.number,
  dashboardStats: PropTypes.shape({
    data: PropTypes.shape({
      totalCases: PropTypes.number,
      activeCases: PropTypes.number,
    }),
  }),
};

DashBoardDataCount.defaultProps = {
  staff: 0,
  lawyerCount: 0,
  clientCount: 0,
  loading: false,
  trends: {},
  totalCases: null,
  activeCases: null,
  dashboardStats: null,
};

export default DashBoardDataCount;
