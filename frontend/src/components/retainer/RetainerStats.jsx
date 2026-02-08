import React, { useEffect } from "react";
import { Card, Row, Col, Statistic, Spin, Typography } from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  WarningOutlined,
  CalendarOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchRetainerStats } from "../../redux/features/retainer/retainerSlice";

const { Text } = Typography;

const RetainerStats = () => {
  const dispatch = useDispatch();
  const stats = useSelector((state) => state.retainer.stats);
  const loading = useSelector((state) => state.retainer.statsLoading);

  useEffect(() => {
    dispatch(fetchRetainerStats());
  }, [dispatch]);

  if (loading) {
    return (
      <Card className="shadow-sm">
        <div
          className="flex justify-center items-center"
          style={{ minHeight: 150 }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  // Extract data from API response structure
  const overview = stats?.overview || {};
  const revenue = stats?.revenue || {};
  const serviceUtilization = stats?.serviceUtilization || {};

  const statData = [
    {
      title: "Total Retainers",
      value: overview.totalRetainerMatters || 0,
      icon: <FileTextOutlined />,
      color: "#1890ff",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active",
      value: overview.activeRetainerMatters || 0,
      icon: <CheckCircleOutlined />,
      color: "#52c41a",
      bgColor: "bg-green-50",
    },
    {
      title: "Pending",
      value: overview.pendingRetainerMatters || 0,
      icon: <ClockCircleOutlined />,
      color: "#faad14",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Expiring Soon",
      value: stats?.expiringSoon || 0,
      icon: <WarningOutlined />,
      color: "#ff4d4f",
      bgColor: "bg-red-50",
    },
    {
      title: "Terminated",
      value: overview.terminatedRetainerMatters || 0,
      icon: <StopOutlined />,
      color: "#8c8c8c",
      bgColor: "bg-gray-50",
    },
    {
      title: "Expired",
      value: overview.expiredRetainerMatters || 0,
      icon: <CalendarOutlined />,
      color: "#cf1322",
      bgColor: "bg-red-50",
    },
  ];

  const revenueData = [
    {
      title: "Monthly Revenue",
      value: revenue.totalMonthlyRevenue || 0,
      prefix: "₦",
      color: "#389e0d",
      bgColor: "bg-green-50",
      icon: <CalendarOutlined />,
    },
    {
      title: "Annual Revenue",
      value: revenue.totalAnnualRevenue || 0,
      prefix: "₦",
      color: "#1890ff",
      bgColor: "bg-blue-50",
      icon: <DollarOutlined />,
    },
    {
      title: "Avg Retainer Value",
      value: revenue.avgRetainerValue || 0,
      prefix: "₦",
      color: "#13c2c2",
      bgColor: "bg-cyan-50",
      icon: <DollarOutlined />,
    },
    {
      title: "Service Utilization",
      value: serviceUtilization.avgUtilization || 0,
      suffix: "%",
      color: "#722ed1",
      bgColor: "bg-purple-50",
      icon: <CheckCircleOutlined />,
    },
  ];

  return (
    <div className="retainer-stats">
      {/* Overview Statistics */}
      <Row gutter={[16, 16]} className="mb-4">
        {statData.map((stat, index) => (
          <Col xs={24} sm={12} md={8} lg={4} key={index}>
            <Card
              className={`shadow-sm hover:shadow-md transition-shadow ${stat.bgColor}`}
              size="small"
              bordered={false}>
              <Statistic
                title={
                  <Text className="text-xs font-medium text-gray-600">
                    {stat.title}
                  </Text>
                }
                value={stat.value}
                prefix={
                  <span style={{ color: stat.color, fontSize: 18 }}>
                    {stat.icon}
                  </span>
                }
                valueStyle={{
                  color: stat.color,
                  fontSize: window.innerWidth < 768 ? 20 : 24,
                  fontWeight: 600,
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Revenue & Utilization Statistics */}
      <Row gutter={[16, 16]}>
        {revenueData.map((stat, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card
              className={`shadow-sm hover:shadow-md transition-shadow ${stat.bgColor}`}
              size="small"
              bordered={false}>
              <Statistic
                title={
                  <Text className="text-xs font-medium text-gray-600">
                    {stat.title}
                  </Text>
                }
                value={stat.value}
                prefix={
                  stat.prefix || (
                    <span style={{ color: stat.color, fontSize: 18 }}>
                      {stat.icon}
                    </span>
                  )
                }
                suffix={stat.suffix}
                valueStyle={{
                  color: stat.color,
                  fontSize: window.innerWidth < 768 ? 18 : 22,
                  fontWeight: 600,
                }}
                formatter={(value) => {
                  if (stat.prefix === "₦") {
                    return Number(value).toLocaleString();
                  }
                  return value;
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default RetainerStats;
