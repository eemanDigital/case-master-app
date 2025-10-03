import PropTypes from "prop-types";
import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, Modal, Statistic, Tag, Space } from "antd";
import {
  CurrencyDollarIcon,
  ChartPieIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

import PageErrorAlert from "./PageErrorAlert";
import Text from "antd/es/typography/Text";

const TotalOutstandingBalanceCharts = ({
  paymentData,
  balanceData,
  error,
  loading,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Memoized data calculations
  const { value, year, totalBalance } = useMemo(
    () => ({
      value: paymentData?.totalAmount || 0,
      year: paymentData?.year || new Date().getFullYear(),
      totalBalance: balanceData?.data?.[0]?.totalBalance || 0,
    }),
    [paymentData, balanceData]
  );

  const chartData = useMemo(
    () => [
      {
        name: "Total Income",
        value: value,
        color: "#10B981",
        description: "Total payments received",
      },
      {
        name: "Outstanding Balance",
        value: totalBalance,
        color: "#EF4444",
        description: "Pending payments",
      },
    ],
    [value, totalBalance]
  );

  const totalAmount = useMemo(
    () => value + totalBalance,
    [value, totalBalance]
  );
  const incomePercentage = useMemo(
    () => (totalAmount > 0 ? Math.round((value / totalAmount) * 100) : 0),
    [value, totalAmount]
  );

  const COLORS = chartData.map((item) => item.color);

  const handleCardClick = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage =
        totalAmount > 0 ? Math.round((data.value / totalAmount) * 100) : 0;

      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-2xl min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-semibold text-gray-900">{data.name}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Amount:</span>
              <span className="font-bold text-gray-900">
                ₦{data.value?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Percentage:</span>
              <Tag color={data.name === "Total Income" ? "success" : "error"}>
                {percentage}%
              </Tag>
            </div>
            <div className="text-xs text-gray-500 mt-2">{data.description}</div>
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
            <ChartPieIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="text-gray-400">Loading financial data...</div>
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
            <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-900">
              Income vs Balance {year}
            </span>
          </div>
        }
        className="bg-gradient-to-br from-white to-green-50/50 border border-gray-200 rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
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
          <div className="flex-1 relative">
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={chartData}
                  startAngle={180}
                  endAngle={0}
                  innerRadius="70%"
                  outerRadius="90%"
                  dataKey="value"
                  paddingAngle={2}
                  animationBegin={0}
                  animationDuration={800}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Display */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                <span className="text-sm font-bold text-gray-900">
                  {incomePercentage}%
                </span>
              </div>
              <div className="text-xs text-gray-500">Collected</div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="flex-1 space-y-3 pl-4">
            <Statistic
              title={
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-gray-600">Income</span>
                </div>
              }
              value={value}
              formatter={(value) => `₦${value.toLocaleString()}`}
              valueStyle={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#10B981",
              }}
            />
            <Statistic
              title={
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs text-gray-600">Outstanding</span>
                </div>
              }
              value={totalBalance}
              formatter={(value) => `₦${value.toLocaleString()}`}
              valueStyle={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#EF4444",
              }}
            />
          </div>
        </div>
      </Card>

      {/* Detailed Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <ChartPieIcon className="w-6 h-6 text-green-600" />
            <div>
              <div className="text-xl font-bold text-gray-900">
                Financial Overview {year}
              </div>
              <div className="text-sm text-gray-500">
                Income vs Outstanding Balance Analysis
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
              <Text className="text-gray-600">Total Income</Text>
              <div className="text-2xl font-bold text-gray-900">
                ₦{value.toLocaleString()}
              </div>
              <Tag color="success" className="mt-2">
                {incomePercentage}% of total
              </Tag>
            </Card>

            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-red-50 to-pink-50">
              <Text className="text-gray-600">Outstanding Balance</Text>
              <div className="text-2xl font-bold text-gray-900">
                ₦{totalBalance.toLocaleString()}
              </div>
              <Tag color="error" className="mt-2">
                {100 - incomePercentage}% of total
              </Tag>
            </Card>

            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-blue-50 to-cyan-50">
              <Text className="text-gray-600">Total Amount</Text>
              <div className="text-2xl font-bold text-gray-900">
                ₦{totalAmount.toLocaleString()}
              </div>
              <Tag color="processing" className="mt-2">
                Combined Total
              </Tag>
            </Card>
          </div>

          {/* Main Chart */}
          <Card className="border-0 shadow-sm">
            <div className="h-[400px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    startAngle={180}
                    endAngle={0}
                    innerRadius="60%"
                    outerRadius="80%"
                    dataKey="value"
                    paddingAngle={2}
                    animationBegin={0}
                    animationDuration={1000}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="white"
                        strokeWidth={3}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Display */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {incomePercentage}%
                </div>
                <div className="text-sm text-gray-500">Collection Rate</div>
                <div className="text-xs text-gray-400 mt-1">
                  ₦{totalAmount.toLocaleString()} Total
                </div>
              </div>
            </div>
          </Card>

          {/* Legend */}
          <div className="flex justify-center gap-6">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {item.name}
                </span>
                <Tag color={index === 0 ? "success" : "error"} className="ml-2">
                  {Math.round((item.value / totalAmount) * 100)}%
                </Tag>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
};

// PropTypes
TotalOutstandingBalanceCharts.propTypes = {
  paymentData: PropTypes.shape({
    totalAmount: PropTypes.number,
    year: PropTypes.number,
  }),
  balanceData: PropTypes.shape({
    message: PropTypes.string,
    data: PropTypes.arrayOf(
      PropTypes.shape({
        totalBalance: PropTypes.number,
        _id: PropTypes.any,
      })
    ),
  }),
  error: PropTypes.string,
  loading: PropTypes.bool.isRequired,
};

export default TotalOutstandingBalanceCharts;
