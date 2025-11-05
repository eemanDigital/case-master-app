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
import { Card, Modal, Tag, Statistic, Space, Divider } from "antd";
import {
  UserGroupIcon,
  EyeIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

import CustomTooltip from "./CustomToolTip";

const CaseCountsByClient = ({ data, loading }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeBar, setActiveBar] = useState(null);

  // Color palette for bars
  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
    "#F97316",
    "#6366F1",
  ];

  // Transform and enhance data
  const transformedData = useMemo(() => {
    if (!data) return [];

    console.log("Raw data for CaseCountsByClientChart:", data);

    const sortedData = [...data].sort((a, b) => b.count - a.count).slice(0, 10); // Limit to top 10 clients

    return sortedData.map((item, index) => ({
      key: index,
      client: item?.client || "Unknown Client",
      count: item?.count,
      parties: item.parties,
      color: COLORS[index % COLORS.length],
      percentage: Math.round(
        (item.count / data.reduce((sum, d) => sum + d.count, 0)) * 100
      ),
    }));
  }, [data]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!transformedData.length) return {};

    const totalCases = transformedData.reduce(
      (sum, item) => sum + item.count,
      0
    );
    const averageCases = totalCases / transformedData.length;
    const topClient = transformedData[0];
    const clientsWithMultipleCases = transformedData.filter(
      (item) => item.count > 1
    ).length;

    return {
      totalCases,
      averageCases: Math.round(averageCases),
      topClient,
      totalClients: transformedData.length,
      clientsWithMultipleCases,
      multipleCasePercentage: Math.round(
        (clientsWithMultipleCases / transformedData.length) * 100
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

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-0 rounded-2xl h-[200px] animate-pulse">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <ChartBarIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="text-gray-400">Loading client data...</div>
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
            <UserGroupIcon className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">Cases by Client</span>
          </div>
        }
        className="bg-gradient-to-br from-white to-indigo-50/50 border border-gray-200 rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
        onClick={showModal}
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
              <BarChart
                data={transformedData.slice(0, 5)} // Show top 5 in preview
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  vertical={false}
                />
                <XAxis
                  dataKey="client"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  onMouseEnter={handleBarEnter}
                  onMouseLeave={handleBarLeave}>
                  {transformedData.slice(0, 5).map((entry, index) => (
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
              title="Total Clients"
              value={stats.totalClients || 0}
              valueStyle={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#6366F1",
              }}
            />
            <Statistic
              title="Total Cases"
              value={stats.totalCases || 0}
              valueStyle={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#10B981",
              }}
            />
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
                Case Distribution by Client
              </div>
              <div className="text-sm text-gray-500">
                Client case load analysis and insights
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
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="text-gray-600 text-sm">Total Clients</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.totalClients}
              </div>
            </Card>
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="text-gray-600 text-sm">Total Cases</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.totalCases}
              </div>
            </Card>
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="text-gray-600 text-sm">Avg. Cases/Client</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.averageCases}
              </div>
            </Card>
            <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="text-gray-600 text-sm">Top Client Cases</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.topClient?.count}
              </div>
            </Card>
          </div>

          {/* Main Chart */}
          <Card className="border-0 shadow-sm">
            <div className="h-[500px]">
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
                    dataKey="client"
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
                    label={{
                      value: "Number of Cases",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle", fill: "#6B7280" },
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="count"
                    name="Case Count"
                    radius={[4, 4, 0, 0]}
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

          {/* Client Breakdown */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                <span className="font-semibold">Client Case Details</span>
              </div>
            }
            className="border-0 shadow-sm"
            extra={
              <Tag color="blue">Showing {transformedData.length} clients</Tag>
            }>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
              {transformedData.map((client, index) => (
                <Card
                  key={client.key}
                  className="border-0 shadow-sm hover:shadow-md transition-shadow"
                  styles={{ body: { padding: "16px" } }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: client.color }}
                      />
                      <div>
                        <div className="font-semibold text-gray-900 line-clamp-1">
                          {client.client}
                        </div>
                        <div className="text-sm text-gray-500">
                          {client.count} case{client.count !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <Tag color={index === 0 ? "gold" : "default"}>
                      {client.percentage}%
                    </Tag>
                  </div>

                  {client?.parties?.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-medium text-gray-500 mb-2">
                        INVOLVED PARTIES:
                      </div>
                      <div className="space-y-1 max-h-[100px] overflow-y-auto">
                        {client?.parties?.slice(0, 3).map((party, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-gray-600 py-1 px-2 bg-gray-50 rounded">
                            • {party}
                          </div>
                        ))}
                        {client.parties.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{client.parties.length - 3} more
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

// PropTypes
CaseCountsByClient.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      count: PropTypes.number.isRequired,
      parties: PropTypes.arrayOf(PropTypes.string).isRequired,
      client: PropTypes.string.isRequired,
    })
  ),
  loading: PropTypes.bool,
};

CaseCountsByClient.defaultProps = {
  loading: false,
};

export default CaseCountsByClient;
