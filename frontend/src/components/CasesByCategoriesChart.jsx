import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { Modal, Card, Tag, Statistic, Space } from "antd";
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
import {
  ChartBarIcon,
  EyeIcon,
  DocumentTextIcon,
  HashtagIcon,
} from "@heroicons/react/24/outline";

const CasesByCategoriesChart = ({ data, title, loading }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeBar, setActiveBar] = useState(null);

  // Color palettes for different chart types
  const COLOR_PALETTES = {
    status: ["#3B82F6", "#60A5FA", "#93C5FD", "#1D4ED8", "#2563EB", "#1E40AF"],
    nature: ["#10B981", "#34D399", "#059669", "#047857", "#065F46", "#064E3B"],
    court: ["#8B5CF6", "#A855F7", "#C084FC", "#7C3AED", "#6D28D9", "#5B21B6"],
    priority: [
      "#EF4444",
      "#F87171",
      "#DC2626",
      "#B91C1C",
      "#991B1B",
      "#7F1D1D",
    ],
    mode: ["#F59E0B", "#FBBF24", "#D97706", "#B45309", "#92400E", "#78350F"],
    category: [
      "#06B6D4",
      "#22D3EE",
      "#0891B2",
      "#0E7490",
      "#155E75",
      "#164E63",
    ],
  };

  // Get color palette based on title
  const getColorPalette = (title) => {
    if (title.toLowerCase().includes("status")) return COLOR_PALETTES.status;
    if (title.toLowerCase().includes("nature")) return COLOR_PALETTES.nature;
    if (title.toLowerCase().includes("court")) return COLOR_PALETTES.court;
    if (title.toLowerCase().includes("priority"))
      return COLOR_PALETTES.priority;
    if (title.toLowerCase().includes("mode")) return COLOR_PALETTES.mode;
    if (title.toLowerCase().includes("category"))
      return COLOR_PALETTES.category;
    return COLOR_PALETTES.status;
  };

  // Transform data with enhanced properties
  const transformedData = useMemo(() => {
    if (!data || !data.length) return [];

    const palette = getColorPalette(title);
    const totalCases = data.reduce((sum, item) => sum + item.count, 0);

    return data
      .filter((item) => item?.groupName !== null)
      .sort((a, b) => b.count - a.count)
      .map((item, index) => ({
        id: `${item.groupName}-${index}`,
        name: item.groupName,
        Cases: item.count,
        color: palette[index % palette.length],
        percentage: Math.round((item.count / totalCases) * 100),
        shortName:
          item?.groupName?.length > 12
            ? item.groupName.substring(0, 12) + "..."
            : item.groupName,
      }));
  }, [data, title]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!transformedData.length) return {};

    const totalCases = transformedData.reduce(
      (sum, item) => sum + item.Cases,
      0
    );
    const averageCases = totalCases / transformedData.length;
    const topCategory = transformedData[0];
    const categoriesWithCases = transformedData.filter(
      (item) => item.Cases > 0
    ).length;

    return {
      totalCases,
      averageCases: Math.round(averageCases),
      topCategory,
      totalCategories: transformedData.length,
      categoriesWithCases,
      coveragePercentage: Math.round(
        (categoriesWithCases / transformedData.length) * 100
      ),
    };
  }, [transformedData]);

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActiveBar(null);
  };

  const handleBarEnter = (data, index) => {
    setActiveBar(index);
  };

  const handleBarLeave = () => {
    setActiveBar(null);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-2xl min-w-[200px]">
          <div className="flex items-center gap-2 mb-3">
            <DocumentTextIcon className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-gray-900">{data.name}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cases:</span>
              <span className="font-bold text-gray-900">{data.Cases}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Percentage:</span>
              <Tag color="blue" className="m-0">
                {data.percentage}%
              </Tag>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getIcon = (title) => {
    if (title.toLowerCase().includes("status")) return "🔄";
    if (title.toLowerCase().includes("nature")) return "⚖️";
    if (title.toLowerCase().includes("court")) return "🏛️";
    if (title.toLowerCase().includes("priority")) return "🚨";
    if (title.toLowerCase().includes("mode")) return "📋";
    if (title.toLowerCase().includes("category")) return "📁";
    return "📊";
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-0 rounded-2xl h-[200px] animate-pulse">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <ChartBarIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="text-gray-400">Loading {title}...</div>
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
            <span className="text-lg">{getIcon(title)}</span>
            <span className="font-semibold text-gray-900 text-sm">{title}</span>
          </div>
        }
        className="bg-gradient-to-br from-white to-blue-50/50 border border-gray-200 rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
        onClick={handleCardClick}
        hoverable
        extra={
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <EyeIcon className="w-4 h-4" />
            View
          </div>
        }>
        <div className="flex items-center justify-between h-32">
          {/* Chart Section */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart
                data={transformedData.slice(0, 6)} // Show top 6 in preview
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
                  angle={-45}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: "#6B7280" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="Cases"
                  radius={[3, 3, 0, 0]}
                  barSize={12}
                  onMouseEnter={handleBarEnter}
                  onMouseLeave={handleBarLeave}>
                  {transformedData.slice(0, 6).map((entry, index) => (
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
          <div className="flex-1 space-y-2 pl-3 border-l border-gray-200">
            <Statistic
              title="Total"
              value={stats.totalCases || 0}
              valueStyle={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#10B981",
              }}
            />
            <Statistic
              title="Categories"
              value={stats.totalCategories || 0}
              valueStyle={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#6366F1",
              }}
            />
          </div>
        </div>
      </Card>

      {/* Detailed Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <ChartBarIcon className="w-6 h-6 text-blue-600" />
            <div>
              <div className="text-xl font-bold text-gray-900">{title}</div>
              <div className="text-sm text-gray-500">
                Distribution analysis and insights
              </div>
            </div>
          </div>
        }
        open={isModalOpen}
        footer={null}
        onCancel={handleCloseModal}
        width={1000}
        className="rounded-2xl [&_.ant-modal-content]:rounded-2xl [&_.ant-modal-header]:rounded-t-2xl">
        <div className="p-6 space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="text-gray-600 text-sm">Total Cases</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.totalCases}
              </div>
            </Card>
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="text-gray-600 text-sm">Categories</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.totalCategories}
              </div>
            </Card>
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="text-gray-600 text-sm">Top Category</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.topCategory?.Cases}
              </div>
            </Card>
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="text-gray-600 text-sm">Coverage</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.coveragePercentage}%
              </div>
            </Card>
          </div>

          {/* Main Chart */}
          <Card className="border-0 shadow-sm">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={transformedData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f3f4f6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="Cases"
                    name="Case Count"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
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

          {/* Category Breakdown */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <HashtagIcon className="w-5 h-5 text-gray-600" />
                <span className="font-semibold">Category Breakdown</span>
              </div>
            }
            className="border-0 shadow-sm"
            extra={<Tag color="blue">{transformedData.length} categories</Tag>}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
              {transformedData.map((category, index) => (
                <Card
                  key={category.id}
                  className="border-0 shadow-sm hover:shadow-md transition-shadow"
                  styles={{ body: { padding: "16px" } }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {category.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {category.Cases} case{category.Cases !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <Tag color={index === 0 ? "gold" : "default"}>
                      {category.percentage}%
                    </Tag>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(category.Cases / stats.totalCases) * 100}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      </Modal>
    </>
  );
};

CasesByCategoriesChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      groupName: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ),
  title: PropTypes.string.isRequired,
  loading: PropTypes.bool,
};

CasesByCategoriesChart.defaultProps = {
  loading: false,
};

export default CasesByCategoriesChart;
