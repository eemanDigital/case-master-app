import { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Progress, Tag, Spin, Alert } from "antd";
import {
  CalendarOutlined,
  MedicineBoxOutlined,
  HeartOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import { useSelector } from "react-redux";

const LeaveSummaryCard = () => {
  const { user } = useSelector((state) => state.auth);
  const { dataFetcher } = useDataFetch();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      // Route: GET /leaves/summary/:employeeId?
      const response = await dataFetcher(
        `leaves/summary/${user?.data?._id}`,
        "GET"
      );
      if (response?.data?.summary) {
        setSummary(response.data.summary);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-8">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert
        message="Failed to load leave summary"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  if (!summary) {
    return (
      <Alert
        message="No leave balance found"
        description="Please contact HR to set up your leave entitlements."
        type="warning"
        showIcon
      />
    );
  }

  const getProgressColor = (value, total) => {
    const percentage = (value / total) * 100;
    if (percentage > 60) return "#52c41a";
    if (percentage > 30) return "#faad14";
    return "#f5222d";
  };

  return (
    <Card title="My Leave Summary" className="shadow-sm">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="text-center bg-blue-50 border-blue-200">
            <Statistic
              title="Annual Leave"
              value={summary.annual}
              suffix="days"
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
            <Progress
              percent={Math.round((summary.annual / 30) * 100)}
              strokeColor={getProgressColor(summary.annual, 30)}
              showInfo={false}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="text-center bg-red-50 border-red-200">
            <Statistic
              title="Sick Leave"
              value={summary.sick}
              suffix="days"
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: "#f5222d" }}
            />
            <Progress
              percent={Math.round((summary.sick / 14) * 100)}
              strokeColor={getProgressColor(summary.sick, 14)}
              showInfo={false}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="text-center bg-purple-50 border-purple-200">
            <Statistic
              title="Special Leave"
              value={
                summary.maternity + summary.paternity + summary.compassionate
              }
              suffix="days"
              prefix={<HeartOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card className="text-center bg-green-50 border-green-200">
            <Statistic
              title="Total Available"
              value={summary.totalAvailable}
              suffix="days"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
            {summary.carryOver > 0 && (
              <Tag color="gold" className="mt-2">
                +{summary.carryOver} carry over
              </Tag>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Pending Applications"
              value={summary.pendingApplications}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Approved Applications"
              value={summary.approvedApplications}
              valueStyle={{ fontSize: 20, color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Upcoming Leaves"
              value={summary.upcomingLeaves?.length || 0}
              valueStyle={{ fontSize: 20, color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default LeaveSummaryCard;
