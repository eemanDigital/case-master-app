import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Select,
  Typography,
  Statistic,
  Progress,
  Empty,
  Spin,
} from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useSelector } from "react-redux";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const HoursChart = ({ matterId }) => {
  const [timeRange, setTimeRange] = useState("current");
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);

  const details = useSelector((state) => state.retainer.selectedDetails);
  const hoursSummary = useSelector((state) => state.retainer.hoursSummary);
  const loading = useSelector((state) => state.retainer.hoursSummaryLoading);

  // Colors for charts
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];

  useEffect(() => {
    if (details?.servicesIncluded) {
      // Prepare bar chart data
      const barData = details.servicesIncluded.map((service) => ({
        name:
          service.serviceType.length > 15
            ? service.serviceType.substring(0, 12) + "..."
            : service.serviceType,
        allocated: service.hoursAllocated || 0,
        used: service.hoursUsed || 0,
        remaining: Math.max(
          0,
          (service.hoursAllocated || 0) - (service.hoursUsed || 0),
        ),
      }));

      // Prepare pie chart data
      const pieData = details.servicesIncluded.map((service) => ({
        name: service.serviceType,
        value: service.hoursUsed || 0,
        allocated: service.hoursAllocated || 0,
      }));

      setChartData(barData);
      setPieData(pieData);
    }
  }, [details]);

  // Calculate utilization metrics
  const calculateMetrics = () => {
    if (!details?.servicesIncluded?.length) {
      return {
        totalAllocated: 0,
        totalUsed: 0,
        utilizationRate: 0,
        avgUtilization: 0,
        overutilized: 0,
      };
    }

    const services = details.servicesIncluded;
    const totalAllocated = services.reduce(
      (sum, s) => sum + (s.hoursAllocated || 0),
      0,
    );
    const totalUsed = services.reduce((sum, s) => sum + (s.hoursUsed || 0), 0);
    const utilizationRate =
      totalAllocated > 0 ? (totalUsed / totalAllocated) * 100 : 0;

    const utilizations = services
      .filter((s) => s.hoursAllocated > 0)
      .map((s) => (s.hoursUsed / s.hoursAllocated) * 100);
    const avgUtilization =
      utilizations.length > 0
        ? utilizations.reduce((a, b) => a + b) / utilizations.length
        : 0;

    const overutilized = services.filter(
      (s) => (s.hoursUsed || 0) > (s.hoursAllocated || 0),
    ).length;

    return {
      totalAllocated,
      totalUsed,
      utilizationRate,
      avgUtilization,
      overutilized,
    };
  };

  const metrics = calculateMetrics();
  const hasData = chartData.length > 0;

  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "white",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}>
          <Text strong>{label}</Text>
          {payload.map((entry, index) => (
            <div key={index} style={{ color: entry.color, marginTop: 4 }}>
              {entry.name}: {entry.value} hours
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: "white",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}>
          <Text strong>{data.name}</Text>
          <div style={{ marginTop: 4 }}>
            <div>Used: {data.value} hours</div>
            <div>Allocated: {data.allocated} hours</div>
            <div>
              Utilization:{" "}
              {data.allocated > 0
                ? ((data.value / data.allocated) * 100).toFixed(1)
                : "0"}
              %
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}>
        <Title level={4} style={{ margin: 0 }}>
          Hours Utilization Dashboard
        </Title>
        <Select
          value={timeRange}
          onChange={setTimeRange}
          style={{ width: 150 }}>
          <Option value="current">Current Period</Option>
          <Option value="month">Last Month</Option>
          <Option value="quarter">Last Quarter</Option>
          <Option value="year">Last Year</Option>
        </Select>
      </div>

      {/* Metrics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Allocated"
              value={metrics.totalAllocated}
              suffix="hours"
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Total Used"
              value={metrics.totalUsed}
              suffix="hours"
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Utilization Rate"
              value={metrics.utilizationRate.toFixed(1)}
              suffix="%"
              valueStyle={{
                color:
                  metrics.utilizationRate > 100
                    ? "#cf1322"
                    : metrics.utilizationRate > 80
                      ? "#d46b08"
                      : "#389e0d",
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title="Overutilized Services"
              value={metrics.overutilized}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Overall Progress */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Overall Utilization Progress</Text>
        </div>
        <Progress
          percent={Math.min(metrics.utilizationRate, 100)}
          status={metrics.utilizationRate > 100 ? "exception" : "active"}
          strokeColor={{
            "0%": "#108ee9",
            "100%": "#87d068",
          }}
        />
        <div
          style={{
            marginTop: 8,
            display: "flex",
            justifyContent: "space-between",
          }}>
          <Text type="secondary">{metrics.totalUsed} hours used</Text>
          <Text type="secondary">{metrics.totalAllocated} hours allocated</Text>
        </div>
      </Card>

      {/* Charts Section */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : !hasData ? (
        <Empty description="No service data available" />
      ) : (
        <Row gutter={[24, 24]}>
          {/* Bar Chart */}
          <Col xs={24} lg={16}>
            <Card title="Hours by Service Type">
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      label={{
                        value: "Hours",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="allocated"
                      fill="#8884d8"
                      name="Allocated Hours"
                    />
                    <Bar dataKey="used" fill="#82ca9d" name="Used Hours" />
                    <Bar
                      dataKey="remaining"
                      fill="#ffc658"
                      name="Remaining Hours"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* Pie Chart */}
          <Col xs={24} lg={8}>
            <Card title="Usage Distribution">
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}h`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Service Utilization Details */}
      {hasData && (
        <Card title="Service Utilization Details" style={{ marginTop: 24 }}>
          <Row gutter={[16, 16]}>
            {details.servicesIncluded.map((service, index) => {
              const allocated = service.hoursAllocated || 0;
              const used = service.hoursUsed || 0;
              const rate = allocated > 0 ? (used / allocated) * 100 : 0;

              return (
                <Col xs={24} sm={12} md={8} lg={6} key={service._id || index}>
                  <Card size="small">
                    <Text strong style={{ display: "block", marginBottom: 8 }}>
                      {service.serviceType}
                    </Text>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {used}/{allocated} hours
                      </Text>
                    </div>
                    <Progress
                      percent={Math.min(rate, 100)}
                      size="small"
                      status={
                        rate > 100
                          ? "exception"
                          : rate > 80
                            ? "active"
                            : "normal"
                      }
                    />
                    <div style={{ marginTop: 8, fontSize: 12 }}>
                      <Text type={rate > 100 ? "danger" : "success"}>
                        {rate.toFixed(1)}% utilized
                      </Text>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>
      )}
    </div>
  );
};

export default HoursChart;
