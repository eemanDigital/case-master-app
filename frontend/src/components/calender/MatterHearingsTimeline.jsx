import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Card, Timeline, Tag, Empty, Typography, Space, Button } from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { makeSelectHearingEventsByMatter } from "../../redux/features/calender/calenderSelector";
import { formatDateTime } from "../../utils/calendarUtils";

const { Text } = Typography;

const MatterHearingsTimeline = ({ matterId, showAll = false }) => {
  const selectHearingsByMatter = useMemo(
    () => makeSelectHearingEventsByMatter(),
    [],
  );

  const hearings = useSelector((state) =>
    selectHearingsByMatter(state, matterId),
  );

  // Sort hearings by date (newest first for timeline)
  const sortedHearings = [...hearings].sort(
    (a, b) => new Date(b.startDateTime) - new Date(a.startDateTime),
  );

  const displayHearings = showAll ? sortedHearings : sortedHearings.slice(0, 5);

  const now = new Date();

  const getTimelineColor = (hearing) => {
    const hearingDate = new Date(hearing.startDateTime);

    if (hearing.status === "completed") return "green";
    if (hearing.status === "cancelled") return "red";
    if (hearing.status === "adjourned") return "orange";
    if (hearingDate > now) return "blue";
    return "gray";
  };

  const getTimelineIcon = (hearing) => {
    if (hearing.status === "completed") return <CheckCircleOutlined />;
    if (hearing.status === "adjourned") return <SyncOutlined />;
    if (new Date(hearing.startDateTime) > now) return <ClockCircleOutlined />;
    return <CalendarOutlined />;
  };

  const getStatusLabel = (hearing) => {
    const hearingDate = new Date(hearing.startDateTime);

    if (hearing.status === "completed")
      return { text: "Completed", color: "green" };
    if (hearing.status === "cancelled")
      return { text: "Cancelled", color: "red" };
    if (hearing.status === "adjourned")
      return { text: "Adjourned", color: "orange" };
    if (hearingDate > now) return { text: "Scheduled", color: "blue" };
    return { text: "Past", color: "default" };
  };

  if (hearings.length === 0) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text className="text-gray-500">No hearings for this matter</Text>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarOutlined />
            <span>Hearing Timeline</span>
            <Tag color="purple">{hearings.length} Total</Tag>
          </div>
        </div>
      }
      className="shadow-sm">
      <Timeline mode="left">
        {displayHearings.map((hearing) => {
          const status = getStatusLabel(hearing);

          return (
            <Timeline.Item
              key={hearing._id}
              color={getTimelineColor(hearing)}
              dot={getTimelineIcon(hearing)}
              label={
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {formatDateTime(hearing.startDateTime, "MMM DD, YYYY")}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDateTime(hearing.startDateTime, "hh:mm A")}
                  </div>
                </div>
              }>
              <div className="ml-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <Text strong className="text-base block mb-1">
                      {hearing.title}
                    </Text>

                    <Space wrap className="mb-2">
                      <Tag color={status.color} className="!text-xs">
                        {status.text}
                      </Tag>

                      <Tag
                        color={
                          hearing.eventType === "mention" ? "blue" : "purple"
                        }
                        className="!text-xs">
                        {hearing.eventType === "mention"
                          ? "Mention"
                          : "Hearing"}
                      </Tag>

                      {hearing.priority === "urgent" && (
                        <Tag color="red" className="!text-xs">
                          Urgent
                        </Tag>
                      )}

                      {hearing.tags?.includes("auto-synced") && (
                        <Tag color="green" className="!text-xs">
                          Auto-Synced
                        </Tag>
                      )}
                    </Space>
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  {/* Description */}
                  {hearing.description && (
                    <Text className="text-gray-600 block">
                      {hearing.description}
                    </Text>
                  )}

                  {/* Court Information */}
                  {hearing.location?.courtName && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <EnvironmentOutlined />
                      <span>
                        {hearing.location.courtName}
                        {hearing.location.courtRoom &&
                          ` - Room ${hearing.location.courtRoom}`}
                      </span>
                    </div>
                  )}

                  {/* Hearing Metadata */}
                  {hearing.hearingMetadata && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {hearing.hearingMetadata.suitNumber && (
                          <div>
                            <span className="text-gray-500">Suit No:</span>{" "}
                            <span className="font-medium">
                              {hearing.hearingMetadata.suitNumber}
                            </span>
                          </div>
                        )}

                        {hearing.hearingMetadata.judge && (
                          <div>
                            <span className="text-gray-500">Judge:</span>{" "}
                            <span className="font-medium">
                              {hearing.hearingMetadata.judge}
                            </span>
                          </div>
                        )}

                        {hearing.hearingMetadata.hearingType && (
                          <div>
                            <span className="text-gray-500">Type:</span>{" "}
                            <span className="font-medium capitalize">
                              {hearing.hearingMetadata.hearingType}
                            </span>
                          </div>
                        )}

                        {hearing.hearingMetadata.courtRoom && (
                          <div>
                            <span className="text-gray-500">Court Room:</span>{" "}
                            <span className="font-medium">
                              {hearing.hearingMetadata.courtRoom}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Next Hearing Date */}
                      {hearing.hearingMetadata.nextHearingDate && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-blue-600">
                            <ClockCircleOutlined />
                            <span className="text-xs font-medium">
                              Next Hearing:{" "}
                              {formatDateTime(
                                hearing.hearingMetadata.nextHearingDate,
                                "MMM DD, YYYY hh:mm A",
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {hearing.notes && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                      <Text className="text-xs text-yellow-900">
                        <strong>Notes:</strong> {hearing.notes}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            </Timeline.Item>
          );
        })}
      </Timeline>

      {!showAll && hearings.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <Button type="link">View all {hearings.length} hearings →</Button>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {hearings.filter((h) => h.status === "scheduled").length}
            </div>
            <div className="text-xs text-gray-600">Scheduled</div>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {hearings.filter((h) => h.status === "completed").length}
            </div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {hearings.filter((h) => h.status === "adjourned").length}
            </div>
            <div className="text-xs text-gray-600">Adjourned</div>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {hearings.filter((h) => new Date(h.startDateTime) > now).length}
            </div>
            <div className="text-xs text-gray-600">Upcoming</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MatterHearingsTimeline;
