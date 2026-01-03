// components/dashboard/PaymentDashboard.jsx - ENHANCED VERSION
import React from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Progress,
  Tag,
  Space,
  Button,
  Tooltip,
  Select,
  DatePicker,
  Alert,
  Skeleton,
  Empty,
  Badge,
  Tabs,
  Divider,
} from "antd";
import {
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  TeamOutlined,
  CalendarOutlined,
  DownloadOutlined,
  RiseOutlined,
  FallOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { usePaymentStats } from "../hooks/usePaymentStats";
import moment from "moment";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Enhanced color schemes with gradients
const COLORS = {
  primary: ["#1890ff", "#096dd9"],
  success: ["#52c41a", "#389e0d"],
  warning: ["#faad14", "#d48806"],
  danger: ["#f5222d", "#cf1322"],
  info: ["#13c2c2", "#08979c"],
  purple: ["#722ed1", "#531dab"],
};

const CHART_COLORS = [
  "#1890ff",
  "#52c41a",
  "#faad14",
  "#f5222d",
  "#722ed1",
  "#13c2c2",
  "#eb2f96",
  "#fa8c16",
];

const STATUS_COLORS = {
  paid: "#52c41a",
  sent: "#1890ff",
  overdue: "#f5222d",
  draft: "#d9d9d9",
  partially_paid: "#faad14",
  cancelled: "#bfbfbf",
};

const PaymentDashboard = () => {
  const [range, setRange] = React.useState("month");
  const [dateRange, setDateRange] = React.useState(null);

  const {
    stats,
    loading,
    error,
    refresh,
    summary,
    analytics,
    topPerformers,
    recentActivity,
    collectionRate,
    totalOutstanding,
    totalPaid,
    overdueAmount,
    todayPayments,
    thisMonthPayments,
    paymentMethods,
    monthlyTrends,
    invoiceStatus,
    collectionEfficiency,
    outstandingPercentage,
    paidPercentage,
    overduePercentage,
  } = usePaymentStats({ range });

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Alert
          message="Error Loading Payment Statistics"
          description={error}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={refresh}>
              Retry
            </Button>
          }
          className="shadow-lg"
        />
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="p-4 md:p-6">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format percentage
  const formatPercent = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  // Get trend indicator
  const getTrendIndicator = (value, threshold = 0) => {
    if (value > threshold) {
      return {
        icon: <RiseOutlined className="text-green-500" />,
        color: "success",
      };
    } else if (value < threshold) {
      return {
        icon: <FallOutlined className="text-red-500" />,
        color: "error",
      };
    }
    return { icon: null, color: "default" };
  };

  // Enhanced Summary Cards with better responsiveness
  const renderSummaryCards = () => (
    <Row gutter={[16, 16]} className="mb-6">
      {/* Total Outstanding */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          bordered={false}
          className="shadow-md hover:shadow-xl transition-all duration-300 rounded-lg bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Space direction="vertical" size={0}>
                <Text
                  type="secondary"
                  className="text-xs uppercase font-medium">
                  Total Outstanding
                </Text>
                <Title level={3} className="mb-0 mt-2">
                  {formatCurrency(totalOutstanding)}
                </Title>
              </Space>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-full">
              <DollarOutlined className="text-2xl text-red-600" />
            </div>
          </div>
          <div className="mt-3">
            <Progress
              percent={outstandingPercentage}
              strokeColor={{
                "0%": "#ff4d4f",
                "100%": "#cf1322",
              }}
              size="small"
              showInfo={false}
            />
            <div className="flex justify-between items-center mt-2">
              <Text className="text-xs text-gray-500">
                {formatPercent(outstandingPercentage)} of total
              </Text>
              <Tag color="red" className="text-xs">
                {summary?.outstanding?.count || 0} invoices
              </Tag>
            </div>
          </div>
        </Card>
      </Col>

      {/* Total Paid */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          bordered={false}
          className="shadow-md hover:shadow-xl transition-all duration-300 rounded-lg bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Space direction="vertical" size={0}>
                <Text
                  type="secondary"
                  className="text-xs uppercase font-medium">
                  Total Collected
                </Text>
                <Title level={3} className="mb-0 mt-2">
                  {formatCurrency(totalPaid)}
                </Title>
              </Space>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full">
              <CheckCircleOutlined className="text-2xl text-green-600" />
            </div>
          </div>
          <div className="mt-3">
            <Progress
              percent={paidPercentage}
              strokeColor={{
                "0%": "#52c41a",
                "100%": "#389e0d",
              }}
              size="small"
              showInfo={false}
            />
            <div className="flex justify-between items-center mt-2">
              <Text className="text-xs text-gray-500">
                {formatPercent(paidPercentage)} of total
              </Text>
              <Tag color="green" className="text-xs">
                {summary?.paid?.count || 0} invoices
              </Tag>
            </div>
          </div>
        </Card>
      </Col>

      {/* Overdue Amount */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          bordered={false}
          className="shadow-md hover:shadow-xl transition-all duration-300 rounded-lg bg-gradient-to-br from-orange-50 to-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Space direction="vertical" size={0}>
                <Text
                  type="secondary"
                  className="text-xs uppercase font-medium">
                  Overdue Balance
                </Text>
                <Title level={3} className="mb-0 mt-2">
                  {formatCurrency(overdueAmount)}
                </Title>
              </Space>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-orange-100 rounded-full">
              <WarningOutlined className="text-2xl text-orange-600" />
            </div>
          </div>
          <div className="mt-3">
            <Progress
              percent={overduePercentage}
              strokeColor={{
                "0%": "#fa8c16",
                "100%": "#d48806",
              }}
              size="small"
              showInfo={false}
            />
            <div className="flex justify-between items-center mt-2">
              <Text className="text-xs text-gray-500">
                {formatPercent(overduePercentage)} of outstanding
              </Text>
              <Badge
                count={summary?.overdue?.count || 0}
                style={{ backgroundColor: "#fa8c16" }}
              />
            </div>
          </div>
        </Card>
      </Col>

      {/* Collection Efficiency */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          bordered={false}
          className="shadow-md hover:shadow-xl transition-all duration-300 rounded-lg bg-gradient-to-br from-blue-50 to-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Space direction="vertical" size={0}>
                <Text
                  type="secondary"
                  className="text-xs uppercase font-medium">
                  Collection Rate
                </Text>
                <Title level={3} className="mb-0 mt-2">
                  {formatPercent(collectionEfficiency)}
                </Title>
              </Space>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full">
              <BarChartOutlined className="text-2xl text-blue-600" />
            </div>
          </div>
          <div className="mt-3">
            <Progress
              percent={collectionEfficiency}
              strokeColor={{
                "0%": "#1890ff",
                "100%": "#096dd9",
              }}
              size="small"
              status={
                collectionEfficiency >= 80
                  ? "success"
                  : collectionEfficiency >= 50
                  ? "active"
                  : "exception"
              }
            />
            <div className="flex justify-between items-center mt-2">
              <Text className="text-xs text-gray-500">
                {collectionEfficiency >= 80
                  ? "Excellent"
                  : collectionEfficiency >= 50
                  ? "Good"
                  : "Needs Attention"}
              </Text>
              {getTrendIndicator(collectionEfficiency - 70).icon}
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );

  // Enhanced Payment Trends Chart
  const renderPaymentTrends = () => (
    <Card
      bordered={false}
      className="shadow-md rounded-lg"
      title={
        <div className="flex items-center justify-between">
          <Space>
            <LineChartOutlined className="text-xl text-blue-600" />
            <div>
              <div className="font-semibold text-base">Payment Trends</div>
              <Text type="secondary" className="text-xs">
                Last 12 months performance
              </Text>
            </div>
          </Space>
          <Button
            type="text"
            icon={<ReloadOutlined spin={loading} />}
            onClick={refresh}
            disabled={loading}
            size="small"
          />
        </div>
      }>
      <div className="h-80 md:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={monthlyTrends}
            margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis
              tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}K`}
              tick={{ fontSize: 11 }}
            />
            <RechartsTooltip
              formatter={(value) => [formatCurrency(value), "Amount"]}
              labelFormatter={(label) => `Month: ${label}`}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e8e8e8",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Area
              type="monotone"
              dataKey="totalAmount"
              name="Total Payments"
              stroke="#1890ff"
              fill="url(#colorAmount)"
              strokeWidth={3}
            />
            <Line
              type="monotone"
              dataKey="avgAmount"
              name="Average Payment"
              stroke="#52c41a"
              strokeWidth={2}
              dot={{ r: 3, fill: "#52c41a" }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );

  // Enhanced Invoice Status Distribution
  const renderInvoiceStatus = () => (
    <Card
      bordered={false}
      className="shadow-md rounded-lg h-full"
      title={
        <Space>
          <PieChartOutlined className="text-xl text-purple-600" />
          <div>
            <div className="font-semibold text-base">Invoice Status</div>
            <Text type="secondary" className="text-xs">
              Current distribution
            </Text>
          </div>
        </Space>
      }>
      <div className="h-80 md:h-96">
        <ResponsiveContainer width="100%" height="60%">
          <PieChart>
            <Pie
              data={invoiceStatus}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ payload, percent }) => {
                const statusName = payload?._id || payload?.name || "unknown";
                const formattedName = String(statusName).replace("_", " ");
                return `${
                  formattedName.charAt(0).toUpperCase() + formattedName.slice(1)
                }: ${(percent * 100).toFixed(0)}%`;
              }}
              outerRadius="80%"
              innerRadius="50%"
              fill="#8884d8"
              dataKey="count"
              paddingAngle={2}>
              {invoiceStatus.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    STATUS_COLORS[entry._id] ||
                    CHART_COLORS[index % CHART_COLORS.length]
                  }
                />
              ))}
            </Pie>
            <RechartsTooltip
              formatter={(value, name) => [value, "Invoices"]}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e8e8e8",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2 mt-4">
          {invoiceStatus.slice(0, 5).map((status, index) => (
            <div
              key={status._id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors">
              <div className="flex items-center flex-1 min-w-0">
                <div
                  className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                  style={{
                    backgroundColor:
                      STATUS_COLORS[status._id] ||
                      CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <Text className="capitalize text-sm truncate">
                  {status._id.replace("_", " ")}
                </Text>
              </div>
              <Space size="small" className="flex-shrink-0 ml-2">
                <Tag color="default" className="text-xs m-0">
                  {status.count}
                </Tag>
                <Text className="text-xs text-gray-500 hidden sm:inline">
                  {formatCurrency(status.totalAmount)}
                </Text>
              </Space>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  // Enhanced Payment Methods Chart
  const renderPaymentMethods = () => (
    <Card
      bordered={false}
      className="shadow-md rounded-lg"
      title={
        <Space>
          <BarChartOutlined className="text-xl text-green-600" />
          <div>
            <div className="font-semibold text-base">Payment Methods</div>
            <Text type="secondary" className="text-xs">
              Transaction breakdown
            </Text>
          </div>
        </Space>
      }>
      <div className="h-80 md:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={paymentMethods}
            margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="method"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={70}
              tickFormatter={(value) =>
                value.charAt(0).toUpperCase() + value.slice(1)
              }
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}K`}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
            />
            <RechartsTooltip
              formatter={(value, name) => [
                name === "totalAmount" ? formatCurrency(value) : value,
                name === "totalAmount" ? "Amount" : "Count",
              ]}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e8e8e8",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Bar
              yAxisId="left"
              dataKey="totalAmount"
              name="Total Amount"
              fill="#0088FE"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            />
            <Bar
              yAxisId="right"
              dataKey="count"
              name="Transaction Count"
              fill="#00C49F"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );

  // Enhanced Top Performers
  const renderTopPerformers = () => (
    <Card
      bordered={false}
      className="shadow-md rounded-lg"
      title={
        <Space>
          <TeamOutlined className="text-xl text-blue-600" />
          <div>
            <div className="font-semibold text-base">Top Performers</div>
            <Text type="secondary" className="text-xs">
              Leading invoices and clients
            </Text>
          </div>
        </Space>
      }>
      <Tabs
        defaultActiveKey="invoices"
        items={[
          {
            key: "invoices",
            label: "Top Invoices",
            children: (
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {topPerformers?.topInvoices?.length > 0 ? (
                  topPerformers.topInvoices.map((invoice, index) => (
                    <Card
                      key={invoice._id}
                      size="small"
                      hoverable
                      className="border border-gray-200 hover:border-blue-400 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              count={`#${index + 1}`}
                              style={{
                                backgroundColor:
                                  CHART_COLORS[index % CHART_COLORS.length],
                              }}
                            />
                            <Text strong className="text-sm">
                              {invoice.invoiceNumber}
                            </Text>
                          </div>
                          <Text
                            type="secondary"
                            ellipsis
                            className="text-xs block mb-2">
                            {invoice.title}
                          </Text>
                        </div>
                        <Tag
                          color={STATUS_COLORS[invoice.status]}
                          className="ml-2">
                          {invoice.status}
                        </Tag>
                      </div>
                      <div className="flex justify-between text-xs">
                        <div>
                          <Text type="secondary">Total</Text>
                          <div className="font-semibold">
                            {formatCurrency(invoice.total)}
                          </div>
                        </div>
                        <div className="text-right">
                          <Text type="secondary">Balance</Text>
                          <div className="font-semibold text-orange-600">
                            {formatCurrency(invoice.balance)}
                          </div>
                        </div>
                      </div>
                      {invoice.client && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <Text type="secondary" className="text-xs">
                            {invoice.client.firstName} {invoice.client.lastName}
                          </Text>
                        </div>
                      )}
                    </Card>
                  ))
                ) : (
                  <Empty
                    description="No top invoices found"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </div>
            ),
          },
          {
            key: "clients",
            label: "Top Clients",
            children: (
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {topPerformers?.topClients?.length > 0 ? (
                  topPerformers.topClients.map((client, index) => (
                    <Card
                      key={client.clientId}
                      size="small"
                      hoverable
                      className="border border-gray-200 hover:border-green-400 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge
                            count={`#${index + 1}`}
                            style={{
                              backgroundColor:
                                CHART_COLORS[index % CHART_COLORS.length],
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <Text strong className="text-sm block truncate">
                              {client.clientName}
                            </Text>
                            <Text
                              type="secondary"
                              className="text-xs block truncate">
                              {client.email}
                            </Text>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <Text type="secondary" className="text-xs block">
                            Total Paid
                          </Text>
                          <Text strong className="text-sm block text-green-600">
                            {formatCurrency(client.totalPaid)}
                          </Text>
                        </div>
                        <div>
                          <Text type="secondary" className="text-xs block">
                            Invoices
                          </Text>
                          <Text strong className="text-sm block">
                            {client.invoiceCount}
                          </Text>
                        </div>
                        <div>
                          <Text type="secondary" className="text-xs block">
                            Last Payment
                          </Text>
                          <Text strong className="text-sm block">
                            {moment(client.lastPayment).format("MMM DD")}
                          </Text>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Empty
                    description="No client data available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </div>
            ),
          },
        ]}
      />
    </Card>
  );

  // Enhanced Recent Activity
  const renderRecentActivity = () => (
    <Card
      bordered={false}
      className="shadow-md rounded-lg"
      title={
        <Space>
          <CalendarOutlined className="text-xl text-purple-600" />
          <div>
            <div className="font-semibold text-base">Recent Activity</div>
            <Text type="secondary" className="text-xs">
              Latest transactions
            </Text>
          </div>
        </Space>
      }>
      <Tabs
        defaultActiveKey="payments"
        items={[
          {
            key: "payments",
            label: (
              <span>
                Recent Payments{" "}
                <Badge
                  count={recentActivity?.payments?.length || 0}
                  style={{ backgroundColor: "#52c41a" }}
                />
              </span>
            ),
            children: (
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {recentActivity?.payments?.length > 0 ? (
                  recentActivity.payments.map((payment) => (
                    <div
                      key={payment._id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                      <div className="flex-1 min-w-0 mr-4">
                        <Text strong className="text-sm block truncate">
                          {payment.invoice?.invoiceNumber}
                        </Text>
                        <Text
                          type="secondary"
                          className="text-xs block truncate">
                          {payment.invoice?.title}
                        </Text>
                        <Text className="text-xs text-gray-400 block mt-1">
                          {moment(payment.paymentDate).format(
                            "MMM DD, YYYY HH:mm"
                          )}
                        </Text>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Text strong className="text-green-600 block">
                          {formatCurrency(payment.amount)}
                        </Text>
                        <Tag color="green" className="mt-1 text-xs">
                          {payment.method}
                        </Tag>
                      </div>
                    </div>
                  ))
                ) : (
                  <Empty
                    description="No recent payments"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </div>
            ),
          },
          {
            key: "invoices",
            label: (
              <span>
                Recent Invoices{" "}
                <Badge
                  count={recentActivity?.invoices?.length || 0}
                  style={{ backgroundColor: "#1890ff" }}
                />
              </span>
            ),
            children: (
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {recentActivity?.invoices?.length > 0 ? (
                  recentActivity.invoices.map((invoice) => (
                    <div
                      key={invoice._id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                      <div className="flex-1 min-w-0 mr-4">
                        <Text strong className="text-sm block truncate">
                          {invoice.invoiceNumber}
                        </Text>
                        <Text
                          type="secondary"
                          className="text-xs block truncate">
                          {invoice.title}
                        </Text>
                        <Text className="text-xs text-gray-400 block mt-1">
                          Due: {moment(invoice.dueDate).format("MMM DD, YYYY")}
                        </Text>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Text
                          strong
                          className={`block ${
                            invoice.balance > 0
                              ? "text-orange-600"
                              : "text-green-600"
                          }`}>
                          {formatCurrency(invoice.total)}
                        </Text>
                        <Tag
                          color={STATUS_COLORS[invoice.status]}
                          className="mt-1 text-xs">
                          {invoice.status}
                        </Tag>
                      </div>
                    </div>
                  ))
                ) : (
                  <Empty
                    description="No recent invoices"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </div>
            ),
          },
        ]}
      />
    </Card>
  );

  // Enhanced Controls Panel
  const renderControls = () => (
    <Card bordered={false} className="mb-6 shadow-md rounded-lg">
      <Row gutter={[12, 12]} align="middle">
        <Col xs={24} sm={12} md={8} lg={6}>
          <div className="space-y-1">
            <Text type="secondary" className="text-xs block">
              Time Range
            </Text>
            <Select
              value={range}
              onChange={setRange}
              className="w-full"
              size="large">
              <Option value="today">Today</Option>
              <Option value="week">This Week</Option>
              <Option value="month">This Month</Option>
              <Option value="quarter">This Quarter</Option>
              <Option value="year">This Year</Option>
              <Option value="last30">Last 30 Days</Option>
              <Option value="last90">Last 90 Days</Option>
            </Select>
          </div>
        </Col>
        <Col xs={24} sm={12} md={10} lg={12}>
          <div className="space-y-1">
            <Text type="secondary" className="text-xs block">
              Custom Date Range
            </Text>
            <RangePicker
              className="w-full"
              size="large"
              onChange={setDateRange}
              format="YYYY-MM-DD"
            />
          </div>
        </Col>
        <Col xs={24} md={6} lg={6}>
          <div className="space-y-1 hidden md:block">
            <Text type="secondary" className="text-xs block opacity-0">
              Actions
            </Text>
          </div>
          <Space className="w-full justify-end flex-wrap">
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={refresh}
              loading={loading}
              size="large"
              disabled={loading}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              size="large"
              className="bg-blue-600 hover:bg-blue-700">
              Export
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );

  return (
    <div className="payment-dashboard p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <Title level={2} className="mb-2 flex items-center gap-2">
              <DollarOutlined className="text-blue-600" />
              Financial Dashboard
            </Title>
            <Paragraph type="secondary" className="mb-0">
              Comprehensive overview of your financial performance and payment
              metrics
            </Paragraph>
          </div>
          <div className="text-right">
            <Text type="secondary" className="text-xs block">
              Last Updated
            </Text>
            <Text strong className="text-sm">
              {stats?.metadata?.generatedAt
                ? moment(stats.metadata.generatedAt).format("MMM DD, h:mm A")
                : "Loading..."}
            </Text>
          </div>
        </div>
      </div>

      {/* Controls */}
      {renderControls()}

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Charts Grid */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} xl={16}>
          {renderPaymentTrends()}
        </Col>
        <Col xs={24} xl={8}>
          {renderInvoiceStatus()}
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          {renderPaymentMethods()}
        </Col>
        <Col xs={24} lg={12}>
          {renderTopPerformers()}
        </Col>
      </Row>

      {/* Recent Activity */}
      <div className="mb-6">{renderRecentActivity()}</div>

      {/* Stats Footer */}
      <Card bordered={false} className="shadow-md rounded-lg">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic
              title={
                <Text type="secondary" className="text-xs">
                  Today's Payments
                </Text>
              }
              value={formatCurrency(todayPayments)}
              prefix={<ArrowUpOutlined className="text-xs" />}
              valueStyle={{ color: "#52c41a", fontSize: "18px" }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title={
                <Text type="secondary" className="text-xs">
                  This Month
                </Text>
              }
              value={formatCurrency(thisMonthPayments)}
              prefix={<ArrowUpOutlined className="text-xs" />}
              valueStyle={{ color: "#1890ff", fontSize: "18px" }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title={
                <Text type="secondary" className="text-xs">
                  Avg Payment Days
                </Text>
              }
              value={summary?.financial?.avgPaymentTime?.toFixed(1) || 0}
              suffix="days"
              valueStyle={{ color: "#722ed1", fontSize: "18px" }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title={
                <Text type="secondary" className="text-xs">
                  Success Rate
                </Text>
              }
              value={formatPercent(stats?.kpis?.paymentSuccessRate || 0)}
              valueStyle={{ color: "#13c2c2", fontSize: "18px" }}
            />
          </Col>
        </Row>
      </Card>

      {/* Custom CSS for scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default PaymentDashboard;
