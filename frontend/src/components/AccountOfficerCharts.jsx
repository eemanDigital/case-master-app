import { useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Modal, Card, Typography, Tag, Space } from "antd";
import {
  ChartBarIcon,
  UserGroupIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

const { Title, Text } = Typography;

// Modern color palette with better accessibility
const COLOR_PALETTES = {
  primary: ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"],
  cool: ["#0EA5E9", "#6366F1", "#8B5CF6", "#A855F7", "#D946EF"],
  warm: ["#F97316", "#EF4444", "#EC4899", "#F59E0B", "#EAB308"],
};

const AccountOfficerCharts = ({ data, title, colorScheme = "primary" }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);

  const COLORS = COLOR_PALETTES[colorScheme] || COLOR_PALETTES.primary;

  // Memoized data transformation
  const transformedData = useMemo(
    () =>
      data?.map((item, index) => ({
        name: item.accountOfficer,
        value: item.count,
        cases: item.parties,
        percentage: Math.round(
          (item.count / data.reduce((sum, d) => sum + d.count, 0)) * 100
        ),
        color: COLORS[index % COLORS.length],
      })) || [],
    [data, COLORS]
  );

  const totalCases = useMemo(
    () => transformedData.reduce((sum, item) => sum + item.value, 0),
    [transformedData]
  );

  // Custom tooltip with modern design
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-2xl min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <Text strong className="text-gray-900">
              {data.name}
            </Text>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Text className="text-gray-600">Cases:</Text>
              <Tag color="blue" className="m-0">
                {data.value}
              </Tag>
            </div>
            <div className="flex justify-between items-center">
              <Text className="text-gray-600">Percentage:</Text>
              <Text strong>{data.percentage}%</Text>
            </div>
          </div>
          {data.cases.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <Text className="text-gray-600 text-xs font-medium">
                PARTIES:
              </Text>
              <div className="mt-1 max-h-[100px] overflow-y-auto">
                {data.cases.map((caseItem, idx) => (
                  <Text key={idx} className="block text-xs text-gray-700 py-1">
                    • {caseItem}
                  </Text>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Event handlers
  const showModal = useCallback(() => setIsModalVisible(true), []);
  const hideModal = useCallback(() => setIsModalVisible(false), []);

  const onPieEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  // Responsive radius calculation
  const getOuterRadius = useCallback(() => {
    const width = window.innerWidth;
    if (width < 640) return 80;
    if (width < 1024) return 120;
    return 150;
  }, []);

  // Custom label renderer
  const renderCustomizedLabel = useCallback(
    ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
      const RADIAN = Math.PI / 180;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      if (percent < 0.1) return null; // Hide labels for very small segments

      return (
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor={x > cx ? "start" : "end"}
          dominantBaseline="central"
          className="text-xs font-semibold drop-shadow-sm">
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      );
    },
    []
  );

  return (
    <>
      {/* Preview Card */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">{title}</span>
          </div>
        }
        className="bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
        onClick={showModal}
        hoverable
        extra={
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <EyeIcon className="w-4 h-4" />
            View
          </div>
        }>
        <div className="flex items-center justify-between h-32">
          <div className="flex-1">
            <PieChart width={140} height={140}>
              <Pie
                data={transformedData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={55}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}>
                {transformedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="white"
                    strokeWidth={2}
                    opacity={activeIndex === index ? 0.8 : 1}
                  />
                ))}
              </Pie>
            </PieChart>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <UserGroupIcon className="w-4 h-4" />
              <Text strong>Total: {totalCases} cases</Text>
            </div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {transformedData.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <Text className="text-xs text-gray-600 truncate">
                    {item.name}
                  </Text>
                </div>
              ))}
              {transformedData.length > 3 && (
                <Text className="text-xs text-gray-500">
                  +{transformedData.length - 3} more
                </Text>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <ChartBarIcon className="w-6 h-6 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">{title}</span>
          </div>
        }
        open={isModalVisible}
        onCancel={hideModal}
        width={900}
        footer={null}
        className="rounded-2xl [&_.ant-modal-content]:rounded-2xl [&_.ant-modal-header]:rounded-t-2xl"
        styles={{
          body: { padding: 0 },
        }}>
        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
              <Text className="text-gray-600">Total Officers</Text>
              <Title level={3} className="m-0 text-gray-900">
                {transformedData.length}
              </Title>
            </Card>
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
              <Text className="text-gray-600">Total Cases</Text>
              <Title level={3} className="m-0 text-gray-900">
                {totalCases}
              </Title>
            </Card>
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-purple-50 to-violet-50">
              <Text className="text-gray-600">Avg. Cases/Officer</Text>
              <Title level={3} className="m-0 text-gray-900">
                {Math.round(totalCases / transformedData.length)}
              </Title>
            </Card>
          </div>

          {/* Chart */}
          <div className="h-[400px] lg:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={transformedData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={getOuterRadius()}
                  innerRadius={getOuterRadius() * 0.6}
                  paddingAngle={1}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  animationBegin={0}
                  animationDuration={800}>
                  {transformedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="white"
                      strokeWidth={3}
                      opacity={activeIndex === index ? 0.9 : 1}
                      className="transition-all duration-200"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 20 }}
                  formatter={(value, entry) => (
                    <span className="text-gray-700 font-medium">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Data Table Alternative */}
          <Card
            title="Case Distribution"
            className="border-0 shadow-sm"
            extra={<Text className="text-gray-500">Detailed breakdown</Text>}>
            <Space direction="vertical" className="w-full" size="middle">
              {transformedData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <Text strong className="text-gray-900 min-w-[120px]">
                      {item.name}
                    </Text>
                    <Tag color="blue" className="m-0">
                      {item.value} cases
                    </Tag>
                    <Text className="text-gray-500 text-sm">
                      {item.percentage}% of total
                    </Text>
                  </div>
                  <Text className="text-gray-500 text-sm flex-1 text-right truncate">
                    {item?.cases?.slice(0, 2).join(", ")}
                    {item?.cases?.length > 2 &&
                      ` +${item?.cases?.length - 2} more`}
                  </Text>
                </div>
              ))}
            </Space>
          </Card>
        </div>
      </Modal>
    </>
  );
};

// PropTypes
AccountOfficerCharts.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      count: PropTypes.number.isRequired,
      parties: PropTypes.arrayOf(PropTypes.string).isRequired,
      accountOfficer: PropTypes.string.isRequired,
    })
  ).isRequired,
  title: PropTypes.string.isRequired,
  colorScheme: PropTypes.oneOf(["primary", "cool", "warm"]),
};

export default AccountOfficerCharts;
