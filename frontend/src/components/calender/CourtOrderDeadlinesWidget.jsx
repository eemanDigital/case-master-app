import React from "react";
import { useSelector } from "react-redux";
import {
  Card,
  List,
  Tag,
  Empty,
  Typography,
  Progress,
  Space,
  Button,
  Alert,
} from "antd";
import {
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  selectPendingCourtOrderDeadlines,
  selectOverdueCourtOrderDeadlines,
  selectCourtOrderDeadlineStatistics,
} from "../../redux/features/calender/calenderSelector";
import { formatDateTime } from "../../utils/calendarUtils";
import { getDaysUntil } from "../../utils/hearingSyncUtils";
import { Link } from "react-router-dom";

const { Text } = Typography;

const CourtOrderDeadlinesWidget = ({ limit = 5, showStatistics = true }) => {
  const pendingDeadlines = useSelector(selectPendingCourtOrderDeadlines);
  const overdueDeadlines = useSelector(selectOverdueCourtOrderDeadlines);
  const statistics = useSelector(selectCourtOrderDeadlineStatistics);

  // Sort by urgency (closest deadlines first)
  const sortedDeadlines = [...pendingDeadlines].sort(
    (a, b) => new Date(a.endDateTime) - new Date(b.endDateTime),
  );

  const displayDeadlines = sortedDeadlines.slice(0, limit);

  const getUrgencyColor = (deadline) => {
    const daysUntil = getDaysUntil(deadline.endDateTime);
    if (daysUntil < 0) return "red";
    if (daysUntil <= 2) return "red";
    if (daysUntil <= 7) return "orange";
    return "blue";
  };

  const getUrgencyLevel = (deadline) => {
    const daysUntil = getDaysUntil(deadline.endDateTime);
    if (daysUntil < 0) return "Overdue";
    if (daysUntil === 0) return "Due Today";
    if (daysUntil === 1) return "Due Tomorrow";
    if (daysUntil <= 2) return "Critical";
    if (daysUntil <= 7) return "Urgent";
    return "Upcoming";
  };

  const calculateProgress = (deadline) => {
    const now = new Date();
    const end = new Date(deadline.endDateTime);
    const daysUntil = getDaysUntil(deadline.endDateTime);

    if (daysUntil < 0) return 100; // Overdue
    if (daysUntil <= 2) return 80;
    if (daysUntil <= 7) return 60;
    if (daysUntil <= 14) return 40;
    return 20;
  };

  const completionRate =
    statistics.total > 0
      ? Math.round((statistics.completed / statistics.total) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      {showStatistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-orange-50 to-white">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {statistics.pending}
              </div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-white">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {statistics.overdue}
              </div>
              <div className="text-xs text-gray-600">Overdue</div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.dueThisWeek}
              </div>
              <div className="text-xs text-gray-600">Due This Week</div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {completionRate}%
              </div>
              <div className="text-xs text-gray-600">Completion Rate</div>
            </div>
          </Card>
        </div>
      )}

      {/* Overdue Alert */}
      {overdueDeadlines.length > 0 && (
        <Alert
          message={
            <div className="flex items-center gap-2">
              <WarningOutlined />
              <span className="font-semibold">
                {overdueDeadlines.length} Overdue Court Order
                {overdueDeadlines.length !== 1 ? "s" : ""}
              </span>
            </div>
          }
          description="Immediate action required to avoid contempt of court"
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
        />
      )}

      {/* Deadlines List */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockCircleOutlined />
              <span>Court Order Deadlines</span>
              {statistics.pending > 0 && (
                <Tag color="orange">{statistics.pending} Pending</Tag>
              )}
            </div>
            <Link to="/dashboard/calendar?filter=deadlines">
              <Button type="link" size="small">
                View All
              </Button>
            </Link>
          </div>
        }
        className="shadow-sm">
        {displayDeadlines.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text className="text-gray-500">
                No pending court order deadlines
              </Text>
            }
          />
        ) : (
          <List
            dataSource={displayDeadlines}
            renderItem={(deadline) => {
              const urgencyColor = getUrgencyColor(deadline);
              const urgencyLevel = getUrgencyLevel(deadline);
              const progress = calculateProgress(deadline);
              const daysUntil = getDaysUntil(deadline.endDateTime);

              return (
                <List.Item className="hover:bg-gray-50 transition-colors rounded-lg px-3 py-3">
                  <div className="w-full">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ExclamationCircleOutlined
                            className={`text-${urgencyColor}-600`}
                          />
                          <Text strong className="text-base">
                            {deadline.title}
                          </Text>
                        </div>

                        <Text className="text-sm text-gray-600 block mb-2">
                          {deadline.description}
                        </Text>

                        <Space wrap>
                          <Tag color={urgencyColor} className="!text-xs">
                            {urgencyLevel}
                          </Tag>

                          <Tag color="purple" className="!text-xs">
                            Court Order
                          </Tag>

                          {deadline.deadlineMetadata?.penaltyForMissing && (
                            <Tag
                              color="red"
                              className="!text-xs"
                              icon={<WarningOutlined />}>
                              Penalty
                            </Tag>
                          )}
                        </Space>
                      </div>

                      <div className="text-right ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDateTime(deadline.endDateTime, "MMM DD, YYYY")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {daysUntil < 0 ? (
                            <span className="text-red-600 font-medium">
                              {Math.abs(daysUntil)} days overdue
                            </span>
                          ) : daysUntil === 0 ? (
                            <span className="text-red-600 font-medium">
                              Due today
                            </span>
                          ) : daysUntil === 1 ? (
                            <span className="text-orange-600 font-medium">
                              Due tomorrow
                            </span>
                          ) : (
                            <span>{daysUntil} days remaining</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <Progress
                        percent={progress}
                        size="small"
                        strokeColor={
                          urgencyColor === "red"
                            ? "#f5222d"
                            : urgencyColor === "orange"
                              ? "#fa8c16"
                              : "#1890ff"
                        }
                        showInfo={false}
                      />
                    </div>

                    {/* Penalty Warning */}
                    {deadline.deadlineMetadata?.penaltyForMissing && (
                      <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                        <div className="flex items-start gap-2">
                          <WarningOutlined className="text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <Text className="text-xs text-red-900 font-medium block">
                              Penalty for Non-Compliance:
                            </Text>
                            <Text className="text-xs text-red-800">
                              {deadline.deadlineMetadata.penaltyForMissing}
                            </Text>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        )}

        {displayDeadlines.length > 0 && pendingDeadlines.length > limit && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <Link to="/dashboard/calendar?filter=court-order-deadlines">
              <Button type="link">
                View all {pendingDeadlines.length} court order deadlines →
              </Button>
            </Link>
          </div>
        )}

        {/* Completion Summary */}
        {statistics.total > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Overall Progress:</span>
              <div className="flex items-center gap-2">
                <Progress
                  type="circle"
                  percent={completionRate}
                  width={50}
                  strokeColor="#52c41a"
                />
                <div>
                  <div className="font-medium">
                    {statistics.completed} Completed
                  </div>
                  <div className="text-xs text-gray-500">
                    of {statistics.total} total
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CourtOrderDeadlinesWidget;
