import PropTypes from "prop-types";
import { useContext, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
} from "recharts";
import { Card, Modal, Statistic, Tag, Space } from "antd";
import {
  ChartBarIcon,
  EyeIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

import PaymentFilterForm from "./PaymentFilterForm";
import { PaymentFiltersContext } from "./Dashboard";
import PageErrorAlert from "./PageErrorAlert";

const months = [
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

const MonthlyIncomeChart = ({ data, error, loading }) => {
  const { setYearEachMonth } = useContext(PaymentFiltersContext);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Transform and enhance data
  const transformedData = useMemo(() => {
    if (!data) return [];

    return data.map((item, index, array) => {
      const previousMonth = array[index - 1];
      const growth = previousMonth
        ? ((item.totalAmount - previousMonth.totalAmount) /
            previousMonth.totalAmount) *
          100
        : 0;

      return {
        ...item,
        monthName: months[item.month - 1],
        growth: Math.round(growth * 10) / 10,
        isPositive: growth >= 0,
        fullMonth: [
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
        ][item.month - 1],
      };
    });
  }, [data]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!transformedData.length) return {};

    const total = transformedData.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const average = total / transformedData.length;
    const peak = Math.max(...transformedData.map((item) => item.totalAmount));
    const peakMonth = transformedData.find(
      (item) => item.totalAmount === peak
    )?.fullMonth;
    const growthMonths = transformedData.filter(
      (item) => item.isPositive
    ).length;

    return {
      total,
      average: Math.round(average),
      peak,
      peakMonth,
      growthMonths,
      growthRate: Math.round((growthMonths / transformedData.length) * 100),
    };
  }, [transformedData]);

  const handleCardClick = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-2xl min-w-[200px]">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-gray-900">
              {data.fullMonth}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Income:</span>
              <span className="font-bold text-gray-900">
                ₦{data.totalAmount?.toLocaleString()}
              </span>
            </div>
            {data.growth !== 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Growth:</span>
                <Tag color={data.isPositive ? "success" : "error"}>
                  {data.isPositive ? "+" : ""}
                  {data.growth}%
                </Tag>
              </div>
            )}
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
            <ChartBarIcon className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Monthly Income</span>
          </div>
        }
        className="bg-gradient-to-br from-white to-blue-50/50 border border-gray-200 rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
        onClick={handleCardClick}
        hoverable
        extra={
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <EyeIcon className="w-4 h-4" />
            View Details
          </div>
        }>
        <div className="flex items-center justify-between h-32">
          {/* Chart Section */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={transformedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="monthName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="totalAmount"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: "#3B82F6", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 6, fill: "#1D4ED8" }}
                  animationBegin={0}
                  animationDuration={800}
                />
                <Area
                  type="monotone"
                  dataKey="totalAmount"
                  stroke="none"
                  fill="url(#colorGradient)"
                  fillOpacity={0.1}
                />
                <defs>
                  <linearGradient
                    id="colorGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Section */}
          <div className="flex-1 space-y-3 pl-4 border-l border-gray-200">
            <Statistic
              title="Total YTD"
              value={stats.total || 0}
              formatter={(value) => `₦${value.toLocaleString()}`}
              valueStyle={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#059669",
              }}
            />
            <div className="flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-600">
                {stats.growthRate}% growth months
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <ChartBarIcon className="w-6 h-6 text-blue-600" />
            <div>
              <div className="text-xl font-bold text-gray-900">
                Monthly Income Analysis
              </div>
              <div className="text-sm text-gray-500">
                Year-over-year revenue trends and insights
              </div>
            </div>
          </div>
        }
        open={isModalVisible}
        footer={null}
        onCancel={handleCloseModal}
        width={1000}
        className="rounded-2xl [&_.ant-modal-content]:rounded-2xl [&_.ant-modal-header]:rounded-t-2xl">
        <div className="p-6 space-y-6">
          {/* Header with Filters */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="text-gray-600 text-sm">Total Income</div>
                <div className="text-lg font-bold text-gray-900">
                  ₦{stats.total?.toLocaleString()}
                </div>
              </Card>
              <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="text-gray-600 text-sm">Monthly Avg</div>
                <div className="text-lg font-bold text-gray-900">
                  ₦{stats.average?.toLocaleString()}
                </div>
              </Card>
              <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-purple-50 to-violet-50">
                <div className="text-gray-600 text-sm">Peak Month</div>
                <div className="text-lg font-bold text-gray-900">
                  {stats.peakMonth?.substring(0, 3)}
                </div>
              </Card>
              <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="text-gray-600 text-sm">Growth Rate</div>
                <div className="text-lg font-bold text-gray-900">
                  {stats.growthRate}%
                </div>
              </Card>
            </div>
            <div className="flex-shrink-0">
              <PaymentFilterForm
                setYear={setYearEachMonth}
                removeMonthInput={true}
              />
            </div>
          </div>

          {/* Main Chart */}
          <Card className="border-0 shadow-sm">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={transformedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="monthName"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalAmount"
                    name="Monthly Income"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 8, fill: "#1D4ED8" }}
                    animationBegin={0}
                    animationDuration={1000}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalAmount"
                    stroke="none"
                    fill="url(#modalGradient)"
                    fillOpacity={0.2}
                  />
                  <defs>
                    <linearGradient
                      id="modalGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Monthly Breakdown */}
          {transformedData.length > 0 && (
            <Card
              title="Monthly Breakdown"
              className="border-0 shadow-sm"
              extra={<Tag color="blue">{transformedData.length} months</Tag>}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {transformedData.map((month, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        {month.monthName}
                      </div>
                      <div className="text-sm text-gray-600">
                        ₦{month.totalAmount.toLocaleString()}
                      </div>
                    </div>
                    {month.growth !== 0 && (
                      <Tag
                        color={month.isPositive ? "success" : "error"}
                        className="m-0">
                        {month.isPositive ? "+" : ""}
                        {month.growth}%
                      </Tag>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </Modal>
    </>
  );
};

// PropTypes
MonthlyIncomeChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.number.isRequired,
      totalAmount: PropTypes.number.isRequired,
    })
  ),
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
};

export default MonthlyIncomeChart;
