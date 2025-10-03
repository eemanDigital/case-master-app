import PropTypes from "prop-types";
import { useContext, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, Modal, Statistic, Tag, Space, Progress } from "antd";
import {
  CalendarIcon,
  EyeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

import PaymentFilterForm from "./PaymentFilterForm";
import { PaymentFiltersContext } from "./Dashboard";
import PageErrorAlert from "./PageErrorAlert";

const CurrentMonthIncomeCharts = ({ data, error, loading }) => {
  const { setYearMonth, setMonth } = useContext(PaymentFiltersContext);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Enhanced data with additional calculations
  const enhancedData = useMemo(() => {
    if (!data) return [];

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return [
      {
        month: data.month,
        monthName:
          monthNames[parseInt(data.month) - 1] || `Month ${data.month}`,
        totalAmount: data.totalAmount || 0,
        year: data.year,
        shortName:
          monthNames[parseInt(data.month) - 1]?.substring(0, 3) ||
          `M${data.month}`,
        progress: 65, // This could be calculated based on target vs actual
        isCurrent: true,
      },
    ];
  }, [data]);

  // Calculate additional statistics
  const stats = useMemo(() => {
    const currentData = enhancedData[0];
    if (!currentData) return {};

    // These could come from props or context in a real app
    const monthlyTarget = currentData.totalAmount * 1.5; // Example target
    const achievement = Math.min(
      (currentData.totalAmount / monthlyTarget) * 100,
      100
    );
    const daysInMonth = new Date(
      currentData.year,
      currentData.month,
      0
    ).getDate();
    const currentDay = new Date().getDate();
    const dailyAverage = currentData.totalAmount / currentDay;
    const projectedMonthly = dailyAverage * daysInMonth;

    return {
      monthlyTarget,
      achievement: Math.round(achievement),
      dailyAverage: Math.round(dailyAverage),
      projectedMonthly: Math.round(projectedMonthly),
      progressPercentage: Math.round((currentDay / daysInMonth) * 100),
      isOnTrack: projectedMonthly >= monthlyTarget,
    };
  }, [enhancedData]);

  const handleCardClick = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-2xl min-w-[200px]">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-gray-900">
              {data.monthName} {data.year}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Income:</span>
              <span className="font-bold text-gray-900">
                ₦{data.totalAmount?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Target Progress:</span>
              <Tag
                color={
                  stats.achievement >= 75
                    ? "success"
                    : stats.achievement >= 50
                    ? "warning"
                    : "error"
                }>
                {stats.achievement}%
              </Tag>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (error) {
    return <PageErrorAlert errorCondition={error} errorMessage={error} />;
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-0 rounded-2xl h-[200px] animate-pulse">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <CurrencyDollarIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="text-gray-400">Loading current month data...</div>
          </div>
        </div>
      </Card>
    );
  }

  if (!data?.totalAmount) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-0 rounded-2xl h-[200px]">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <CurrencyDollarIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="text-gray-600">No data for current month</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Preview Card */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-900">Current Month</span>
          </div>
        }
        className="bg-gradient-to-br from-white to-green-50/50 border border-gray-200 rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
        onClick={handleCardClick}
        hoverable
        extra={
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <EyeIcon className="w-4 h-4" />
            Details
          </div>
        }>
        <div className="flex items-center justify-between h-32">
          {/* Chart Section */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart
                data={enhancedData}
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  vertical={false}
                />
                <XAxis
                  dataKey="shortName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6B7280", fontWeight: "bold" }}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalAmount" radius={[6, 6, 0, 0]} barSize={40}>
                  <Cell
                    fill={
                      stats.achievement >= 75
                        ? "#10B981"
                        : stats.achievement >= 50
                        ? "#F59E0B"
                        : "#EF4444"
                    }
                    opacity={0.9}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Section */}
          <div className="flex-1 space-y-3 pl-4 border-l border-gray-200">
            <div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                ₦{data.totalAmount?.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Current Income</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Target</span>
                <Tag
                  color={
                    stats.achievement >= 75
                      ? "success"
                      : stats.achievement >= 50
                      ? "warning"
                      : "error"
                  }
                  className="m-0">
                  {stats.achievement}%
                </Tag>
              </div>
              <Progress
                percent={stats.achievement}
                size="small"
                strokeColor={
                  stats.achievement >= 75
                    ? "#10B981"
                    : stats.achievement >= 50
                    ? "#F59E0B"
                    : "#EF4444"
                }
                showInfo={false}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <ChartBarIcon className="w-6 h-6 text-green-600" />
            <div>
              <div className="text-xl font-bold text-gray-900">
                Current Month Performance
              </div>
              <div className="text-sm text-gray-500">
                {enhancedData[0]?.monthName} {enhancedData[0]?.year} • Real-time
                Analysis
              </div>
            </div>
          </div>
        }
        open={isModalVisible}
        footer={null}
        onCancel={handleCloseModal}
        width={900}
        className="rounded-2xl [&_.ant-modal-content]:rounded-2xl [&_.ant-modal-header]:rounded-t-2xl">
        <div className="p-6 space-y-6">
          {/* Header with Filters */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="text-gray-600 text-sm">Current Income</div>
                <div className="text-xl font-bold text-gray-900">
                  ₦{data.totalAmount?.toLocaleString()}
                </div>
                <Tag color="success" className="mt-2">
                  Actual
                </Tag>
              </Card>
              <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="text-gray-600 text-sm">Daily Average</div>
                <div className="text-xl font-bold text-gray-900">
                  ₦{stats.dailyAverage?.toLocaleString()}
                </div>
                <Tag color="processing" className="mt-2">
                  Per Day
                </Tag>
              </Card>
              <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-purple-50 to-violet-50">
                <div className="text-gray-600 text-sm">Projected</div>
                <div className="text-xl font-bold text-gray-900">
                  ₦{stats.projectedMonthly?.toLocaleString()}
                </div>
                <Tag
                  color={stats.isOnTrack ? "success" : "warning"}
                  className="mt-2">
                  {stats.isOnTrack ? "On Track" : "Below Target"}
                </Tag>
              </Card>
              <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="flex items-center justify-center gap-1 text-gray-600 text-sm">
                  <ClockIcon className="w-4 h-4" />
                  <span>Progress</span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {stats.progressPercentage}%
                </div>
                <Progress
                  percent={stats.progressPercentage}
                  size="small"
                  showInfo={false}
                />
              </Card>
            </div>
            <div className="flex-shrink-0">
              <PaymentFilterForm setYear={setYearMonth} setMonth={setMonth} />
            </div>
          </div>

          {/* Main Chart */}
          <Card className="border-0 shadow-sm">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={enhancedData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="monthName"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 14, fill: "#6B7280", fontWeight: "bold" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="totalAmount"
                    name="Monthly Income"
                    radius={[6, 6, 0, 0]}
                    barSize={80}>
                    <Cell
                      fill={
                        stats.achievement >= 75
                          ? "#10B981"
                          : stats.achievement >= 50
                          ? "#F59E0B"
                          : "#EF4444"
                      }
                      opacity={0.9}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Performance Insights */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-gray-600" />
                <span className="font-semibold">Performance Insights</span>
              </div>
            }
            className="border-0 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="font-medium text-gray-900 mb-2">
                    Target Achievement
                  </div>
                  <Progress
                    percent={stats.achievement}
                    strokeColor={
                      stats.achievement >= 75
                        ? "#10B981"
                        : stats.achievement >= 50
                        ? "#F59E0B"
                        : "#EF4444"
                    }
                    format={(percent) => `${percent}% of monthly target`}
                  />
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-2">
                    Monthly Progress
                  </div>
                  <Progress
                    percent={stats.progressPercentage}
                    strokeColor="#3B82F6"
                    format={(percent) => `${percent}% of month elapsed`}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Projected Month End</span>
                  <span className="font-semibold text-gray-900">
                    ₦{stats.projectedMonthly?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Performance Status</span>
                  <Tag color={stats.isOnTrack ? "success" : "warning"}>
                    {stats.isOnTrack ? "On Track" : "Needs Improvement"}
                  </Tag>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Daily Average</span>
                  <span className="font-semibold text-gray-900">
                    ₦{stats.dailyAverage?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Modal>
    </>
  );
};

CurrentMonthIncomeCharts.propTypes = {
  data: PropTypes.shape({
    month: PropTypes.string,
    totalAmount: PropTypes.number,
    year: PropTypes.number,
  }),
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
};

export default CurrentMonthIncomeCharts;
