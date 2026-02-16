import React from "react";
import { Row, Col, Card, Statistic, Progress, Typography, Tag } from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FireOutlined,
} from "@ant-design/icons";
import UpcomingEventsWidget from "../../components/calender/UpcomingEventsWidget";
import { useCalendarEvents } from "../../hooks/useCalendar";
import { EVENT_STATUS, PRIORITY_LEVELS } from "../../utils/calendarConstants";

const { Title } = Typography;

const CalendarDashboard = ({ onEventClick, onViewAllEvents }) => {
  const { events, statistics, loading } = useCalendarEvents();

  // Calculate additional metrics
  const completedEvents = statistics.byStatus?.[EVENT_STATUS.COMPLETED] || 0;
  const scheduledEvents = statistics.byStatus?.[EVENT_STATUS.SCHEDULED] || 0;
  const urgentEvents = statistics.byPriority?.[PRIORITY_LEVELS.URGENT] || 0;

  const completionRate =
    statistics.total > 0
      ? Math.round((completedEvents / statistics.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Title level={2} className="!mb-2">
          <CalendarOutlined className="mr-2" />
          Calendar Dashboard
        </Title>
        <Typography.Text className="text-gray-600">
          Overview of your scheduled events and activities
        </Typography.Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="shadow-sm hover:shadow-md transition-shadow"
            loading={loading}>
            <Statistic
              title="Total Events"
              value={statistics.total}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="shadow-sm hover:shadow-md transition-shadow"
            loading={loading}>
            <Statistic
              title="Today's Events"
              value={statistics.today}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="shadow-sm hover:shadow-md transition-shadow"
            loading={loading}>
            <Statistic
              title="Upcoming"
              value={statistics.upcoming}
              prefix={<WarningOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            className="shadow-sm hover:shadow-md transition-shadow"
            loading={loading}>
            <Statistic
              title="Urgent Events"
              value={urgentEvents}
              prefix={<FireOutlined />}
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Stats and Widgets */}
      <Row gutter={[16, 16]}>
        {/* Upcoming Events Widget */}
        <Col xs={24} lg={12}>
          <UpcomingEventsWidget
            limit={5}
            onEventClick={onEventClick}
            onViewAll={onViewAllEvents}
          />
        </Col>

        {/* Performance Metrics */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <CheckCircleOutlined />
                <span>Event Metrics</span>
              </div>
            }
            className="shadow-sm">
            <div className="space-y-6">
              {/* Completion Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Typography.Text strong>Completion Rate</Typography.Text>
                  <Typography.Text>{completionRate}%</Typography.Text>
                </div>
                <Progress
                  percent={completionRate}
                  strokeColor={{
                    "0%": "#108ee9",
                    "100%": "#87d068",
                  }}
                  showInfo={false}
                />
              </div>

              {/* Events by Status */}
              <div>
                <Typography.Text strong className="block mb-3">
                  Events by Status
                </Typography.Text>
                <div className="space-y-2">
                  {Object.entries(statistics.byStatus || {}).map(
                    ([status, count]) => (
                      <div
                        key={status}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <Tag className="!m-0 capitalize">
                          {status.replace("_", " ")}
                        </Tag>
                        <Typography.Text strong>{count}</Typography.Text>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Events by Priority */}
              <div>
                <Typography.Text strong className="block mb-3">
                  Events by Priority
                </Typography.Text>
                <div className="space-y-2">
                  {Object.entries(statistics.byPriority || {}).map(
                    ([priority, count]) => {
                      const colors = {
                        [PRIORITY_LEVELS.URGENT]: "#f5222d",
                        [PRIORITY_LEVELS.HIGH]: "#fa8c16",
                        [PRIORITY_LEVELS.MEDIUM]: "#1890ff",
                        [PRIORITY_LEVELS.LOW]: "#52c41a",
                      };

                      return (
                        <div
                          key={priority}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <Tag
                            color={colors[priority]}
                            className="!m-0 capitalize">
                            {priority}
                          </Tag>
                          <Typography.Text strong>{count}</Typography.Text>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Events by Type */}
      <Card title="Events by Type" className="shadow-sm">
        <Row gutter={[16, 16]}>
          {Object.entries(statistics.byType || {}).map(([type, count]) => (
            <Col xs={12} sm={8} md={6} lg={4} key={type}>
              <Card className="text-center bg-gradient-to-br from-blue-50 to-white">
                <Statistic value={count} valueStyle={{ fontSize: "24px" }} />
                <div className="text-xs text-gray-600 mt-2 capitalize">
                  {type.replace(/_/g, " ")}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
};

export default CalendarDashboard;
