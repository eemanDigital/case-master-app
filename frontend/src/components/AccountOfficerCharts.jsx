import { useState, useMemo, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Modal,
  Card,
  Typography,
  Tag,
  Space,
  Grid,
  Tabs,
  Button,
  List,
} from "antd";
import {
  ChartBarIcon,
  UserGroupIcon,
  EyeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { TabPane } = Tabs;

// Modern color palette
const COLOR_PALETTES = {
  primary: ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"],
  cool: ["#0EA5E9", "#6366F1", "#8B5CF6", "#A855F7", "#D946EF"],
  warm: ["#F97316", "#EF4444", "#EC4899", "#F59E0B", "#EAB308"],
};

const AccountOfficerCharts = ({ data, title, colorScheme = "primary" }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [activeTab, setActiveTab] = useState("1");
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  // const screens = useBreakpoint();
  const navigate = useNavigate();

  const COLORS = COLOR_PALETTES[colorScheme] || COLOR_PALETTES.primary;

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Transform the aggregation data for the chart
  const transformedData = useMemo(() => {
    if (!data) return [];

    return data?.map((item, index) => ({
      name: item.accountOfficer,
      value: item.count,
      accountOfficerId: item.accountOfficerId,
      parties: item.parties,
      caseSummary: item.caseSummary,
      statusBreakdown: item.statusBreakdown,
      priorityBreakdown: item.priorityBreakdown,
      activeCases: item.activeCases,
      highPriorityCases: item.highPriorityCases,
      percentage: Math.round(
        (item.count / data.reduce((sum, d) => d.count + sum, 0)) * 100
      ),
      color: COLORS[index % COLORS.length],
    }));
  }, [data, COLORS]);

  const totalCases = useMemo(
    () => data?.reduce((sum, item) => sum + item.count, 0) || 0,
    [data]
  );

  // Responsive calculations
  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
  // const isDesktop = windowSize.width >= 1024;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className={`bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 sm:p-4 shadow-2xl ${
            isMobile ? "min-w-[180px]" : "min-w-[240px]"
          }`}>
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <Text strong className="text-gray-900 text-sm sm:text-base">
              {data.name}
            </Text>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Text className="text-gray-600 text-xs sm:text-sm">
                Total Cases:
              </Text>
              <Tag color="blue" className="m-0 text-xs">
                {data.value}
              </Tag>
            </div>
            <div className="flex justify-between items-center">
              <Text className="text-gray-600 text-xs sm:text-sm">
                Active Cases:
              </Text>
              <Tag color="green" className="m-0 text-xs">
                {data.activeCases}
              </Tag>
            </div>
            <div className="flex justify-between items-center">
              <Text className="text-gray-600 text-xs sm:text-sm">
                High Priority:
              </Text>
              <Tag color="red" className="m-0 text-xs">
                {data.highPriorityCases}
              </Tag>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Event handlers
  const showModal = useCallback(() => setIsModalVisible(true), []);
  const hideModal = useCallback(() => {
    setIsModalVisible(false);
    setActiveTab("1");
  }, []);

  const onPieEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  // Navigate to account officer cases
  const viewAccountOfficerCases = useCallback(
    (accountOfficerId, accountOfficerName) => {
      navigate(`/cases/account-officer/${accountOfficerId}`, {
        state: { accountOfficerName },
      });
    },
    [navigate]
  );

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: "#faad14",
      active: "#52c41a",
      closed: "#f5222d",
      decided: "#1890ff",
      settled: "#722ed1",
      won: "#52c41a",
      lost: "#f5222d",
    };
    return colors[status] || "#d9d9d9";
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      high: "#f5222d",
      medium: "#faad14",
      low: "#52c41a",
    };
    return colors[priority] || "#d9d9d9";
  };

  if (!data || data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 rounded-2xl">
        <div className="text-center py-8">
          <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <Title level={4} className="text-gray-500">
            No Case Data Available
          </Title>
          <Text className="text-gray-400">
            There are no cases assigned to account officers yet.
          </Text>
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
            <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            <span className="font-semibold text-gray-900 text-sm sm:text-base">
              {title}
            </span>
          </div>
        }
        className="bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 rounded-xl sm:rounded-2xl cursor-pointer shadow-sm hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
        onClick={showModal}
        hoverable
        bodyStyle={{ padding: isMobile ? "12px" : "16px" }}
        extra={
          <div className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm">
            <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">View Details</span>
          </div>
        }>
        <div
          className={`flex ${
            isMobile ? "flex-col gap-3" : "items-center justify-between gap-4"
          } h-auto sm:h-32`}>
          <div
            className={`${isMobile ? "w-full flex justify-center" : "flex-1"}`}>
            <PieChart
              width={isMobile ? 120 : isTablet ? 130 : 140}
              height={isMobile ? 120 : isTablet ? 130 : 140}>
              <Pie
                data={transformedData}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 25 : isTablet ? 35 : 40}
                outerRadius={isMobile ? 50 : isTablet ? 55 : 60}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}>
                {transformedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="white"
                    strokeWidth={isMobile ? 1 : 2}
                    opacity={activeIndex === index ? 0.8 : 1}
                  />
                ))}
              </Pie>
            </PieChart>
          </div>

          <div className={`${isMobile ? "w-full" : "flex-1"} space-y-2`}>
            <div className="flex items-center gap-2 text-gray-600 justify-center sm:justify-start">
              <UserGroupIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <Text strong className="text-xs sm:text-sm">
                {totalCases} Total Cases
              </Text>
            </div>
            <div className="flex gap-2 justify-center sm:justify-start">
              <Tag color="green" className="text-xs">
                {data.reduce((sum, item) => sum + item.activeCases, 0)} Active
              </Tag>
              <Tag color="red" className="text-xs">
                {data.reduce((sum, item) => sum + item.highPriorityCases, 0)}{" "}
                High Priority
              </Tag>
            </div>
            <div
              className={`space-y-1 max-h-20 overflow-y-auto ${
                isMobile ? "text-center" : ""
              }`}>
              {transformedData.slice(0, isMobile ? 2 : 3).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 justify-center sm:justify-start">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <Text className="text-xs text-gray-600 truncate">
                    {item.name} ({item.count})
                  </Text>
                </div>
              ))}
              {transformedData.length > (isMobile ? 2 : 3) && (
                <Text className="text-xs text-gray-500">
                  +{transformedData.length - (isMobile ? 2 : 3)} more
                </Text>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 sm:gap-3">
            <ChartBarIcon className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-600" />
            <span className="text-lg sm:text-xl font-bold text-gray-900">
              {title}
            </span>
          </div>
        }
        open={isModalVisible}
        onCancel={hideModal}
        width={isMobile ? "95%" : isTablet ? "90%" : 1000}
        footer={null}
        className="rounded-xl sm:rounded-2xl"
        styles={{
          body: { padding: 0 },
        }}>
        <div className="p-4 sm:p-6">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="responsive-tabs">
            <TabPane tab="Overview" key="1">
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4">
                    <Text className="text-gray-600 text-xs sm:text-sm">
                      Total Officers
                    </Text>
                    <Title
                      level={isMobile ? 4 : 3}
                      className="m-0 text-gray-900">
                      {data.length}
                    </Title>
                  </Card>
                  <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4">
                    <Text className="text-gray-600 text-xs sm:text-sm">
                      Total Cases
                    </Text>
                    <Title
                      level={isMobile ? 4 : 3}
                      className="m-0 text-gray-900">
                      {totalCases}
                    </Title>
                  </Card>
                  <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-orange-50 to-amber-50 p-3 sm:p-4">
                    <Text className="text-gray-600 text-xs sm:text-sm">
                      Active Cases
                    </Text>
                    <Title
                      level={isMobile ? 4 : 3}
                      className="m-0 text-gray-900">
                      {data.reduce((sum, item) => sum + item.activeCases, 0)}
                    </Title>
                  </Card>
                  <Card className="text-center border-0 shadow-sm bg-gradient-to-r from-red-50 to-pink-50 p-3 sm:p-4">
                    <Text className="text-gray-600 text-xs sm:text-sm">
                      High Priority
                    </Text>
                    <Title
                      level={isMobile ? 4 : 3}
                      className="m-0 text-gray-900">
                      {data.reduce(
                        (sum, item) => sum + item.highPriorityCases,
                        0
                      )}
                    </Title>
                  </Card>
                </div>

                {/* Chart */}
                <div
                  className={`${
                    isMobile
                      ? "h-[300px]"
                      : isTablet
                      ? "h-[400px]"
                      : "h-[500px]"
                  }`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={transformedData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={isMobile ? 100 : isTablet ? 120 : 140}
                        innerRadius={isMobile ? 40 : isTablet ? 60 : 80}
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
                            strokeWidth={isMobile ? 2 : 3}
                            opacity={activeIndex === index ? 0.9 : 1}
                            className="transition-all duration-200"
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabPane>

            <TabPane tab="Account Officers" key="2">
              <div className="space-y-4">
                {transformedData.map((officer, index) => (
                  <Card
                    key={index}
                    className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: officer.color }}
                        />
                        <div className="flex-1">
                          <Text strong className="text-gray-900 text-base">
                            {officer.name}
                          </Text>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Tag color="blue">{officer.count} total cases</Tag>
                            {officer.activeCases > 0 && (
                              <Tag color="green">
                                {officer.activeCases} active
                              </Tag>
                            )}
                            {officer.highPriorityCases > 0 && (
                              <Tag color="red">
                                {officer.highPriorityCases} high priority
                              </Tag>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* <Button
                        type="primary"
                        size={isMobile ? "small" : "middle"}
                        onClick={() =>
                          viewAccountOfficerCases(
                            officer.accountOfficerId,
                            officer.name
                          )
                        }
                        icon={<ArrowRightIcon className="w-3 h-3" />}>
                        View Cases
                      </Button> */}
                    </div>

                    {/* Quick case preview */}

                    {officer.caseSummary.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <Text className="text-gray-600 text-sm font-medium mb-3 block">
                          Cases Handled ({officer.caseSummary.length}):
                        </Text>

                        {/* Desktop/Tablet Table View */}
                        <div className="hidden sm:block overflow-hidden rounded-lg border border-gray-200">
                          <div className="bg-gray-50 px-3 py-2 grid grid-cols-12 gap-2 text-xs font-medium text-gray-700">
                            <div className="lg:col-span-5 md:col-span-6 sm:col-span-7">
                              Case Name
                            </div>
                            <div className="lg:col-span-3 md:col-span-3 sm:col-span-3">
                              Suit No
                            </div>
                            <div className="lg:col-span-2 md:col-span-2 sm:col-span-1">
                              Status
                            </div>
                            <div className="lg:col-span-2 md:col-span-1 sm:col-span-1">
                              Priority
                            </div>
                          </div>

                          <div className="divide-y divide-gray-100">
                            {officer.caseSummary
                              .slice(0, 3)
                              .map((caseItem, caseIndex) => (
                                <div
                                  key={caseIndex}
                                  className="px-3 py-2 grid grid-cols-12 gap-2 text-sm hover:bg-gray-50">
                                  <div className="lg:col-span-5 md:col-span-6 sm:col-span-7">
                                    <Text
                                      className="text-gray-900 text-xs truncate"
                                      title={
                                        officer.parties[caseIndex] || "N/A"
                                      }>
                                      {officer.parties[caseIndex] || "N/A"}
                                    </Text>
                                  </div>
                                  <div className="lg:col-span-3 md:col-span-3 sm:col-span-3">
                                    <Text className="text-gray-600 text-xs font-mono truncate">
                                      {caseItem.suitNo}
                                    </Text>
                                  </div>
                                  <div className="lg:col-span-2 md:col-span-2 sm:col-span-1">
                                    <Tag
                                      color={getStatusColor(caseItem.status)}
                                      className="m-0 text-xs capitalize truncate">
                                      {caseItem.status}
                                    </Tag>
                                  </div>
                                  <div className="lg:col-span-2 md:col-span-1 sm:col-span-1">
                                    <Tag
                                      color={getPriorityColor(
                                        caseItem.priority
                                      )}
                                      className="m-0 text-xs capitalize truncate">
                                      {caseItem.priority}
                                    </Tag>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="sm:hidden space-y-2">
                          {officer.caseSummary
                            .slice(0, 3)
                            .map((caseItem, caseIndex) => (
                              <div
                                key={caseIndex}
                                className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                                {/* Case Name - Full width on mobile */}
                                <div className="mb-2">
                                  <Text
                                    strong
                                    className="text-gray-900 text-sm block truncate">
                                    {officer.parties[caseIndex] || "N/A"}
                                  </Text>
                                </div>

                                {/* Details in two columns for mobile */}
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <Text className="text-gray-500 block">
                                      Suit No:
                                    </Text>
                                    <Text className="text-gray-700 font-mono truncate">
                                      {caseItem.suitNo}
                                    </Text>
                                  </div>
                                  <div>
                                    <Text className="text-gray-500 block">
                                      Status:
                                    </Text>
                                    <Tag
                                      color={getStatusColor(caseItem.status)}
                                      className="m-0 text-xs capitalize w-full justify-center">
                                      {caseItem.status}
                                    </Tag>
                                  </div>
                                </div>

                                {/* Priority - Full width on mobile */}
                                <div className="mt-2">
                                  <Text className="text-gray-500 block text-xs">
                                    Priority:
                                  </Text>
                                  <Tag
                                    color={getPriorityColor(caseItem.priority)}
                                    className="m-0 text-xs capitalize w-full justify-center">
                                    {caseItem.priority}
                                  </Tag>
                                </div>
                              </div>
                            ))}
                        </div>

                        {officer.caseSummary.length > 3 && (
                          <div className="text-center mt-3">
                            <Text className="text-gray-500 text-xs">
                              +{officer.caseSummary.length - 3} more cases
                            </Text>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </TabPane>
          </Tabs>
        </div>
      </Modal>
    </>
  );
};

AccountOfficerCharts.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      accountOfficer: PropTypes.string.isRequired,
      accountOfficerId: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
      parties: PropTypes.arrayOf(PropTypes.string).isRequired,
      caseSummary: PropTypes.arrayOf(
        PropTypes.shape({
          suitNo: PropTypes.string.isRequired,
          status: PropTypes.string.isRequired,
          priority: PropTypes.string.isRequired,
        })
      ).isRequired,
      activeCases: PropTypes.number.isRequired,
      highPriorityCases: PropTypes.number.isRequired,
    })
  ).isRequired,
  title: PropTypes.string.isRequired,
  colorScheme: PropTypes.oneOf(["primary", "cool", "warm"]),
};

export default AccountOfficerCharts;
