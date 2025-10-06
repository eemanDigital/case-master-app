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
import CustomTooltip from "./CustomToolTip";
import { Modal, Card, Statistic, Tag, Space, Divider } from "antd";
import {
  CalendarIcon,
  EyeIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

const CaseCountsByYearChart = ({ data, loading }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeBar, setActiveBar] = useState(null);

  // Color palette with gradient for years
  const COLORS = [
    "#3B82F6",
    "#1D4ED8",
    "#60A5FA",
    "#2563EB",
    "#1E40AF",
    "#6366F1",
    "#4F46E5",
    "#7C3AED",
    "#8B5CF6",
    "#A855F7",
  ];

  // Transform and enhance data with growth calculations
  const transformedData = useMemo(() => {
    if (!data) return [];

    const sortedData = [...data].sort((a, b) => a.year - b.year);

    return sortedData.map((item, index, array) => {
      const previousYear = array[index - 1];
      const growth = previousYear
        ? ((item.count - previousYear.count) / previousYear.count) * 100
        : 0;

      return {
        year: item.year,
        count: item.count,
        parties: item.parties,
        color: COLORS[index % COLORS.length],
        growth: Math.round(growth * 10) / 10,
        isPositive: growth >= 0,
        isLatest: index === array.length - 1,
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
    const peakYear = transformedData.reduce(
      (max, item) => (item.count > max.count ? item : max),
      transformedData[0]
    );
    const latestYear = transformedData[transformedData.length - 1];
    const growthYears = transformedData.filter(
      (item) => item.isPositive && !isNaN(item.growth)
    ).length;

    return {
      totalCases,
      averageCases: Math.round(averageCases),
      peakYear,
      latestYear,
      totalYears: transformedData.length,
      growthYears,
      growthRate: Math.round(
        (growthYears / (transformedData.length - 1)) * 100
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

  const CustomYearTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-2xl min-w-[200px]">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-gray-900">
              Year {data.year}
            </span>
            {data.isLatest && (
              <Tag color="blue" className="m-0">
                Latest
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
            <div className="text-gray-400">Loading yearly data...</div>
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
            <CalendarIcon className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-900">Briefs by Year</span>
          </div>
        }
        className="bg-gradient-to-br from-white to-purple-50/50 border border-gray-200 rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
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
                  dataKey="year"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                />
                <Tooltip content={<CustomYearTooltip />} />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  onMouseEnter={handleBarEnter}
                  onMouseLeave={handleBarLeave}>
                  {transformedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={activeBar === index ? 0.8 : 1}
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
              title="Total Years"
              value={stats.totalYears || 0}
              valueStyle={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#6366F1",
              }}
            />
            <Statistic
              title="Total Briefs"
              value={stats.totalCases || 0}
              valueStyle={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#10B981",
              }}
            />
            {stats.latestYear && (
              <div className="flex items-center gap-2">
                {stats.latestYear.isPositive ? (
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />
                )}
                <span className="text-xs text-gray-600">
                  {stats.latestYear.isPositive ? "+" : ""}
                  {stats.latestYear.growth}% latest
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
            <ChartBarIcon className="w-6 h-6 text-purple-600" />
            <div>
              <div className="text-xl font-bold text-gray-900">
                New Briefs Yearly Trends
              </div>
              <div className="text-sm text-gray-500">
                Annual case volume analysis and growth patterns
              </div>
            </div>
          </div>
        }
        open={isModalVisible}
        footer={null}
        onCancel={hideModal}
        width={1000}
        className="rounded-2xl [&_.ant-modal-content]:rounded-2xl [&_.ant-modal-header]:rounded-t-2xl">
        <div className="p-6 space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="text-gray-600 text-sm">Total Years</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.totalYears}
              </div>
              <Tag color="purple" className="mt-2">
                {stats.totalCases} total briefs
              </Tag>
            </Card>
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="text-gray-600 text-sm">Yearly Average</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.averageCases}
              </div>
              <Tag color="success" className="mt-2">
                per year
              </Tag>
            </Card>
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="text-gray-600 text-sm">Peak Year</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.peakYear?.year}
              </div>
              <Tag color="blue" className="mt-2">
                {stats.peakYear?.count} briefs
              </Tag>
            </Card>
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="text-gray-600 text-sm">Growth Rate</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.growthRate}%
              </div>
              <Tag
                color={stats.growthRate >= 50 ? "success" : "warning"}
                className="mt-2">
                positive years
              </Tag>
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
                    dataKey="year"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6B7280", fontWeight: "600" }}
                    label={{
                      value: "Year",
                      position: "insideBottom",
                      offset: -5,
                      style: { fill: "#6B7280", fontSize: 12 },
                    }}
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
                  <Tooltip content={<CustomYearTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="count"
                    name="New Briefs"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                    onMouseEnter={handleBarEnter}
                    onMouseLeave={handleBarLeave}>
                    {transformedData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={activeBar === index ? 0.8 : 1}
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

          {/* Yearly Breakdown */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                <span className="font-semibold">Yearly Performance</span>
              </div>
            }
            className="border-0 shadow-sm"
            extra={
              <Tag color="blue">{transformedData.length} year period</Tag>
            }>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
              {transformedData.map((yearData, index) => (
                <Card
                  key={yearData.year}
                  className={`border-0 shadow-sm hover:shadow-md transition-shadow ${
                    yearData.isLatest ? "ring-2 ring-blue-500" : ""
                  }`}
                  styles={{ body: { padding: "16px" } }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: yearData.color }}
                      />
                      <div>
                        <div className="font-semibold text-gray-900">
                          {yearData.year}
                        </div>
                        <div className="text-sm text-gray-500">
                          {yearData.count} new brief
                          {yearData.count !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Tag color={yearData.isLatest ? "blue" : "default"}>
                        {yearData.percentage}%
                      </Tag>
                      {!isNaN(yearData.growth) && yearData.growth !== 0 && (
                        <Tag
                          color={yearData.isPositive ? "success" : "error"}
                          className="m-0 text-xs">
                          {yearData.isPositive ? "↑" : "↓"}{" "}
                          {Math.abs(yearData.growth)}%
                        </Tag>
                      )}
                    </div>
                  </div>

                  {yearData.parties.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-medium text-gray-500 mb-2">
                        SAMPLE PARTIES:
                      </div>
                      <div className="space-y-1 max-h-[80px] overflow-y-auto">
                        {yearData.parties.slice(0, 2).map((party, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-gray-600 py-1 px-2 bg-gray-50 rounded line-clamp-1">
                            • {party}
                          </div>
                        ))}
                        {yearData.parties.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{yearData.parties.length - 2} more
                          </div>
                        )}
                      </div>
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

CaseCountsByYearChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      year: PropTypes.number.isRequired,
      count: PropTypes.number.isRequired,
      parties: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ),
  loading: PropTypes.bool,
};

CaseCountsByYearChart.defaultProps = {
  loading: false,
};

export default CaseCountsByYearChart;
