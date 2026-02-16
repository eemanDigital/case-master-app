import React from "react";
import { Card, Tag, Badge, Typography, Space, Avatar, Tooltip } from "antd";
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  TagOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  ThunderboltFilled,
  BankOutlined,
} from "@ant-design/icons";
import {
  formatTime,
  formatDuration,
  getDuration,
  isEventNow,
  isEventUpcoming,
  getEventColor,
  getStatusColor,
  getPriorityColor,
} from "../../utils/calendarUtils";
import {
  EVENT_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  PRIORITY_LABELS,
  // LOCATION_TYPES,
} from "../../utils/calendarConstants";

const { Text, Paragraph } = Typography;

const EventCard = ({ event, onClick, compact = false, showDate = false }) => {
  const eventColor = getEventColor(event);
  const isNow = isEventNow(event);
  const isUpcoming = isEventUpcoming(event);
  const duration = getDuration(event.startDateTime, event.endDateTime);

  console.log(event, "EN");

  // Check if event is auto-synced hearing
  const isAutoSyncedHearing =
    (event.eventType === "hearing" || event.eventType === "mention") &&
    event.tags?.includes("auto-synced");

  const getLocationIcon = () => {
    switch (event.location?.type) {
      case "online":
        return <VideoCameraOutlined />;
      case "court":
        return <BankOutlined />;
      default:
        return <EnvironmentOutlined />;
    }
  };

  if (compact) {
    return (
      <div
        className={`
          group cursor-pointer p-3 rounded-lg border border-gray-200 
          hover:border-blue-400 hover:shadow-md transition-all duration-200
          ${isAutoSyncedHearing ? "ring-1 ring-purple-300 bg-purple-50" : ""}
        `}
        style={{ borderLeftColor: eventColor, borderLeftWidth: 4 }}
        onClick={() => onClick && onClick(event)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isNow && <Badge status="processing" className="animate-pulse" />}
              {isAutoSyncedHearing && (
                <Tooltip title="Auto-synced from litigation">
                  <ThunderboltFilled className="text-purple-600 animate-pulse" />
                </Tooltip>
              )}
              <Text strong className="text-sm truncate" title={event.title}>
                {event.title}
              </Text>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <ClockCircleOutlined />
                {formatTime(event.startDateTime)}
              </span>
              {event.location?.type && (
                <span className="flex items-center gap-1 truncate">
                  {getLocationIcon()}
                  <span className="truncate">
                    {event.location.type === "online"
                      ? "Online"
                      : event.location.courtName ||
                        event.location.address ||
                        event.location.type}
                  </span>
                </span>
              )}
            </div>
          </div>

          <Tag
            color={getStatusColor(event.status)}
            className="!text-xs !m-0 shrink-0">
            {EVENT_STATUS_LABELS[event.status]}
          </Tag>
        </div>
      </div>
    );
  }

  return (
    <Card
      hoverable
      className={`
        event-card transition-all duration-300 hover:shadow-lg
        ${isAutoSyncedHearing ? "ring-2 ring-purple-300" : ""}
      `}
      onClick={() => onClick && onClick(event)}
      style={{ borderLeft: `4px solid ${eventColor}` }}
      bodyStyle={{ padding: "16px" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isNow && (
              <Badge
                status="processing"
                text="Happening Now"
                className="text-xs font-medium text-green-600 animate-pulse"
              />
            )}
            {!isNow && isUpcoming && (
              <Badge
                status="warning"
                text="Upcoming"
                className="text-xs font-medium text-orange-600"
              />
            )}
            {isAutoSyncedHearing && (
              <Tooltip title="This event was automatically synced from litigation hearing">
                <Tag
                  icon={<ThunderboltFilled />}
                  color="purple"
                  className="!text-xs animate-pulse">
                  Auto-Synced
                </Tag>
              </Tooltip>
            )}
          </div>

          <Typography.Title level={5} className="!mb-1">
            {event.title}
          </Typography.Title>

          <Space wrap size={4}>
            <Tag color={eventColor} className="!text-xs">
              {EVENT_TYPE_LABELS[event.eventType]}
            </Tag>
            {event.hearingMetadata?.hearingType && (
              <Tag color="cyan" className="!text-xs">
                {event.hearingMetadata.hearingType}
              </Tag>
            )}
          </Space>
        </div>

        <Space direction="vertical" align="end" size={4}>
          <Tag color={getStatusColor(event.status)}>
            {EVENT_STATUS_LABELS[event.status]}
          </Tag>
          <Tag color={getPriorityColor(event.priority)}>
            {PRIORITY_LABELS[event.priority]}
          </Tag>
        </Space>
      </div>

      {/* Time and Duration */}
      <div className="flex items-center gap-4 mb-3 text-gray-600">
        <div className="flex items-center gap-2">
          <ClockCircleOutlined />
          <Text className="text-sm">
            {formatTime(event.startDateTime)} - {formatTime(event.endDateTime)}
          </Text>
        </div>
        <Text className="text-sm text-gray-500">
          ({formatDuration(duration)})
        </Text>
      </div>

      {/* Description */}
      {event.description && (
        <Paragraph
          ellipsis={{ rows: 2 }}
          className="text-sm text-gray-600 mb-3">
          {event.description}
        </Paragraph>
      )}

      {/* Hearing Metadata - Court Information */}
      {event.hearingMetadata && (
        <div className="mb-3 p-3 bg-purple-50 rounded border border-purple-200">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {event.hearingMetadata.suitNumber && (
              <div>
                <Text className="text-gray-500">Suit No:</Text>
                <div className="font-medium text-gray-900">
                  {event.hearingMetadata.suitNumber}
                </div>
              </div>
            )}
            {event.hearingMetadata.judge && (
              <div>
                <Text className="text-gray-500">Judge:</Text>
                <div className="font-medium text-gray-900">
                  {event.hearingMetadata.judge}
                </div>
              </div>
            )}
            {event.hearingMetadata.courtRoom && (
              <div>
                <Text className="text-gray-500">Court Room:</Text>
                <div className="font-medium text-gray-900">
                  {event.hearingMetadata.courtRoom}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location */}
      {event.location && (
        <div className="flex items-start gap-2 mb-3">
          {getLocationIcon()}
          <div className="flex-1">
            {event.location.type === "online" ? (
              <div>
                <Text className="text-sm">Online Meeting</Text>
                {event.location.virtualMeetingLink && (
                  <div>
                    <a
                      href={event.location.virtualMeetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700"
                      onClick={(e) => e.stopPropagation()}>
                      Join Meeting
                    </a>
                  </div>
                )}
              </div>
            ) : event.location.type === "court" ? (
              <div>
                <Text className="text-sm font-medium">
                  {event.location.courtName}
                </Text>
                {event.location.courtRoom && (
                  <div className="text-xs text-gray-500">
                    Court Room: {event.location.courtRoom}
                  </div>
                )}
                {event.location.address && (
                  <div className="text-xs text-gray-500">
                    {event.location.address}
                  </div>
                )}
              </div>
            ) : (
              <Text className="text-sm">{event.location.address}</Text>
            )}
          </div>
        </div>
      )}

      {/* Participants */}
      {event.participants && event.participants.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <UserOutlined className="text-gray-400" />
          <Avatar.Group maxCount={3} size="small">
            {event.participants.map((participant, index) => (
              <Tooltip
                key={index}
                title={
                  participant.user?.firstName ||
                  participant.user?.name ||
                  "Participant"
                }>
                <Avatar size="small" icon={<UserOutlined />}>
                  {(
                    participant.user?.firstName || participant.user?.name
                  )?.charAt(0) || "U"}
                </Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
          <Text className="text-xs text-gray-500">
            {event.participants.length} participant
            {event.participants.length !== 1 ? "s" : ""}
          </Text>
        </div>
      )}

      {/* Matter */}
      {event.matter && (
        <div className="flex items-center gap-2 mb-2">
          <FileTextOutlined className="text-gray-400" />
          <Tag color="geekblue" className="!text-xs">
            {event.matter.matterNumber || event.matter.title || "Matter"}
          </Tag>
        </div>
      )}

      {/* Tags */}
      {event.tags && event.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <TagOutlined className="text-gray-400" />
          {event.tags.slice(0, 3).map((tag, index) => (
            <Tag
              key={index}
              className="!text-xs !m-0"
              color={tag === "auto-synced" ? "purple" : undefined}>
              {tag}
            </Tag>
          ))}
          {event.tags.length > 3 && (
            <Text className="text-xs text-gray-500">
              +{event.tags.length - 3} more
            </Text>
          )}
        </div>
      )}

      {/* Footer with ID */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <Text className="text-xs text-gray-400">ID: {event.eventId}</Text>
      </div>
    </Card>
  );
};

export default EventCard;
