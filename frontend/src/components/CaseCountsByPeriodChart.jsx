import PropTypes from "prop-types";
import { useState, useMemo } from "react";
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
  ChartBarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

import CustomTooltip from "./CustomToolTip";

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

const shortMonthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const CaseCountsByPeriodChart = ({ data, loading }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeBar, setActiveBar] = useState(null);

  // Color palette with seasonal colors
  const COLORS = [
    "#3B82F6",
    "#60A5FA",
    "#93C5FD",
    "#1D4ED8",
    "#2563EB",
    "#10B981",
    "#34D399",
    "#059669",
    "#F59E0B",
    "#FBBF24",
    "#EF4444",
    "#DC2626",
  ];

  // Transform and enhance data with growth calculations
  const transformedData = useMemo(() => {
    if (!data || !data.length) return [];

    // Sort by month number to ensure proper order
    const sortedData = [...data].sort((a, b) => a.month - b.month);

    return sortedData.map((item, index, array) => {
      const previousMonth = array[index - 1];
      const growth = previousMonth
        ? ((item.count - previousMonth.count) / previousMonth.count) * 100
        : 0;

      const currentMonth = new Date().getMonth() + 1;
      const isCurrentMonth = item.month === currentMonth;
      const isFutureMonth = item.month > currentMonth;

      return {
        month: item.month,
        monthName: monthNames[item.month - 1],
        shortName: shortMonthNames[item.month - 1],
        count: item.count,
        parties: item.parties,
        color: COLORS[item.month - 1],
        growth: Math.round(growth * 10) / 10,
        isPositive: growth >= 0,
        isCurrentMonth,
        isFutureMonth,
        isEmpty: item.count === 0,
        percentage: Math.round(
          (item.count / array.reduce((sum, d) => sum + d.count, 0)) * 100
        ),
      };
    });
  }, [data]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!transformedData.length) return {};

    const totalCases = transformedData.reduce(
      (sum, item) => sum + item.count,
      0
    );
    const averageCases = totalCases / transformedData.length;
    const peakMonth = transformedData.reduce(
      (max, item) => (item.count > max.count ? item : max),
      transformedData[0]
    );
    const currentMonthData = transformedData.find(
      (item) => item.isCurrentMonth
    );
    const growthMonths = transformedData.filter(
      (item) => item.isPositive && !isNaN(item.growth)
    ).length;
    const activeMonths = transformedData.filter(
      (item) => item.count > 0
    ).length;

    return {
      totalCases,
      averageCases: Math.round(averageCases),
      peakMonth,
      currentMonthData,
      totalMonths: transformedData.length,
      growthMonths,
      activeMonths,
      activePercentage: Math.round(
        (activeMonths / transformedData.length) * 100
      ),
      growthRate: Math.round(
        (growthMonths / (transformedData.length - 1)) * 100
      ),
    };
  }, [transformedData]);

  const showModal = () => setIsModalVisible(true);
  const hideModal = () => {
    setIsModalVisible(false);
    setActiveBar(null);
  };

  const handleBarEnter = (data, index) => {
    setActiveBar(index);
  };

  const handleBarLeave = () => {
    setActiveBar(null);
  };

  const CustomMonthTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-2xl min-w-[200px]">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-gray-900">
              {data.monthName}
            </span>
            {data.isCurrentMonth && (
              <Tag color="blue" className="m-0">
                Current
              </Tag>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Briefs:</span>
              <span className="font-bold text-gray-900">{data.count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Percentage:</span>
              <Tag color="blue" className="m-0">
                {data.percentage}%
              </Tag>
            </div>
            {!isNaN(data.growth) && data.growth !== 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Growth:</span>
                <Tag
                  color={data.isPositive ? "success" : "error"}
                  className="m-0">
                  {data.isPositive ? "+" : ""}
                  {data.growth}%
                </Tag>
              </div>
            )}
            {data.isEmpty && (
              <Tag color="default" className="w-full justify-center mt-2">
                No briefs this month
              </Tag>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-0 rounded-2xl h-[200px] animate-pulse">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <ChartBarIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="text-gray-400">Loading monthly data...</div>
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
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">Briefs by Month</span>
          </div>
        }
        className="bg-gradient-to-br from-white to-indigo-50/50 border border-gray-200 rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
        onClick={showModal}
        hoverable
        extra={
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <EyeIcon className="w-4 h-4" />
            View Trends
          </div>
        }>
        <div className="flex items-center justify-between h-32">
          {/* Chart Section */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart
                data={transformedData}
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
                  tick={{ fontSize: 9, fill: "#6B7280" }}
                  interval={0}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: "#6B7280" }}
                />
                <Tooltip content={<CustomMonthTooltip />} />
                <Bar
                  dataKey="count"
                  radius={[2, 2, 0, 0]}
                  barSize={8}
                  onMouseEnter={handleBarEnter}
                  onMouseLeave={handleBarLeave}>
                  {transformedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={
                        activeBar === index ? 0.8 : entry.isEmpty ? 0.3 : 1
                      }
                      className="transition-all duration-200"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Section */}
          <div className="flex-1 space-y-3 pl-4 border-l border-gray-200">
            <Statistic
              title="Total Briefs"
              value={stats.totalCases || 0}
              valueStyle={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#10B981",
              }}
            />
            <Statistic
              title="Active Months"
              value={stats.activeMonths || 0}
              valueStyle={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#6366F1",
              }}
            />
            {stats.currentMonthData && (
              <div className="flex items-center gap-2">
                {stats.currentMonthData.isPositive ? (
                  <ArrowTrendingUpIcon className="w-3 h-3 text-green-600" />
                ) : (
                  <ArrowTrendingDownIcon className="w-3 h-3 text-red-600" />
                )}
                <span className="text-xs text-gray-600">
                  {stats.currentMonthData.isPositive ? "+" : ""}
                  {stats.currentMonthData.growth}% current
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Detailed Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <ChartBarIcon className="w-6 h-6 text-indigo-600" />
            <div>
              <div className="text-xl font-bold text-gray-900">
                Monthly Briefs Analysis
              </div>
              <div className="text-sm text-gray-500">
                Seasonal patterns and monthly performance trends
              </div>
            </div>
          </div>
        }
        open={isModalVisible}
        footer={null}
        onCancel={hideModal}
        width={1200}
        className="rounded-2xl [&_.ant-modal-content]:rounded-2xl [&_.ant-modal-header]:rounded-t-2xl">
        <div className="p-6 space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="text-gray-600 text-sm">Total Briefs</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.totalCases}
              </div>
              <Tag color="purple" className="mt-2">
                {stats.totalMonths} months
              </Tag>
            </Card>
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="text-gray-600 text-sm">Monthly Average</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.averageCases}
              </div>
              <Tag color="success" className="mt-2">
                per month
              </Tag>
            </Card>
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="text-gray-600 text-sm">Peak Month</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.peakMonth?.shortName}
              </div>
              <Tag color="blue" className="mt-2">
                {stats.peakMonth?.count} briefs
              </Tag>
            </Card>
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="text-gray-600 text-sm">Active Rate</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.activePercentage}%
              </div>
              <Progress
                percent={stats.activePercentage}
                size="small"
                showInfo={false}
                className="mt-2"
              />
            </Card>
          </div>

          {/* Main Chart */}
          <Card className="border-0 shadow-sm">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={transformedData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f3f4f6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="shortName"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6B7280", fontWeight: "600" }}
                    interval={0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    label={{
                      value: "Number of Briefs",
                      angle: -90,
                      position: "insideLeft",
                      style: {
                        textAnchor: "middle",
                        fill: "#6B7280",
                        fontSize: 12,
                      },
                    }}
                  />
                  <Tooltip content={<CustomMonthTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="count"
                    name="New Briefs"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                    onMouseEnter={handleBarEnter}
                    onMouseLeave={handleBarLeave}>
                    {transformedData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={
                          activeBar === index ? 0.8 : entry.isEmpty ? 0.3 : 1
                        }
                        stroke={activeBar === index ? "#1D4ED8" : "none"}
                        strokeWidth={activeBar === index ? 2 : 0}
                        className="transition-all duration-200"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Monthly Breakdown */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                <span className="font-semibold">Monthly Performance</span>
              </div>
            }
            className="border-0 shadow-sm"
            extra={
              <div className="flex items-center gap-2">
                <Tag color="blue">Full Year</Tag>
                <Tag color={stats.growthRate >= 50 ? "success" : "warning"}>
                  {stats.growthRate}% Growth Months
                </Tag>
              </div>
            }>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 max-h-[400px] overflow-y-auto">
              {transformedData.map((monthData, index) => (
                <Card
                  key={monthData.month}
                  className={`border-0 shadow-sm hover:shadow-md transition-shadow ${
                    monthData.isCurrentMonth ? "ring-2 ring-blue-500" : ""
                  } ${monthData.isEmpty ? "opacity-60" : ""}`}
                  styles={{ body: { padding: "12px" } }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: monthData.color }}
                      />
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {monthData.shortName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {monthData.count} brief
                          {monthData.count !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Tag
                        color={monthData.isCurrentMonth ? "blue" : "default"}
                        className="m-0 text-xs">
                        {monthData.percentage}%
                      </Tag>
                      {!isNaN(monthData.growth) && monthData.growth !== 0 && (
                        <Tag
                          color={monthData.isPositive ? "success" : "error"}
                          className="m-0 text-xs">
                          {monthData.isPositive ? "↑" : "↓"}{" "}
                          {Math.abs(monthData.growth)}%
                        </Tag>
                      )}
                    </div>
                  </div>

                  {monthData.parties.length > 0 && !monthData.isEmpty && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        SAMPLE:
                      </div>
                      <div className="space-y-1 max-h-[60px] overflow-y-auto">
                        {monthData.parties.slice(0, 2).map((party, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-gray-600 py-1 px-2 bg-gray-50 rounded line-clamp-1">
                            • {party}
                          </div>
                        ))}
                        {monthData.parties.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{monthData.parties.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {monthData.isEmpty && (
                    <div className="text-center py-2">
                      <div className="text-xs text-gray-400">No briefs</div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </Modal>
    </>
  );
};

CaseCountsByPeriodChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.number.isRequired,
      count: PropTypes.number.isRequired,
      parties: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ),
  loading: PropTypes.bool,
};

CaseCountsByPeriodChart.defaultProps = {
  loading: false,
};

export default CaseCountsByPeriodChart;
