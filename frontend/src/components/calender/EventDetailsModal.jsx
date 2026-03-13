import React from "react";
import {
  Modal,
  Descriptions,
  Tag,
  Button,
  Space,
  Divider,
  Typography,
  Avatar,
  Timeline,
  Alert,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  FileTextOutlined,
  TagOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltFilled,
  BankOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  formatDateTime,
  formatDuration,
  getDuration,
  getEventColor,
  getStatusColor,
  getPriorityColor,
  isEventNow,
  isEventUpcoming,
  isPast,
} from "../../utils/calendarUtils";
import {
  EVENT_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  PRIORITY_LABELS,
  LOCATION_TYPES,
  VISIBILITY_LEVELS,
  RESPONSE_STATUS,
} from "../../utils/calendarConstants";

const { Text, Title, Paragraph } = Typography;

const EventDetailsModal = ({
  visible,
  event,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
  onRespond,
  currentUserId,
}) => {
  if (!event) return null;

  const eventColor = getEventColor(event);
  const duration = getDuration(event.startDateTime, event.endDateTime);
  const isNow = isEventNow(event);
  const isUpcoming = isEventUpcoming(event);
  const hasPassed = isPast(event.endDateTime);

  // Check if event is auto-synced
  const isAutoSynced = event.tags?.includes("auto-synced");
  const isCurrentHearing = event.customFields?.isCurrentHearing;
  const isNextHearing = event.customFields?.isNextHearing;
  const hearingId = event.customFields?.hearingId;
  const litigationId = event.customFields?.litigationDetailId;

  const canEdit =
    event.organizer?._id === currentUserId || event.createdBy === currentUserId;
  const isParticipant = event.participants?.some(
    (p) => p.user?._id === currentUserId,
  );

  const myParticipation = event.participants?.find(
    (p) => p.user?._id === currentUserId,
  );

  // Handle edit for auto-synced events
  const handleEdit = () => {
    if (isAutoSynced) {
      Modal.confirm({
        title: "Cannot Edit Auto-Synced Event",
        icon: <ExclamationCircleOutlined />,
        content: (
          <div className="space-y-3">
            <Alert
              message="This event is automatically synced from litigation"
              type="warning"
              showIcon
              icon={<ThunderboltFilled />}
            />
            <p>To modify this hearing, please go to:</p>
            <p className="font-semibold text-blue-600">
              Litigation → Matter Details → Hearings
            </p>
            <p className="text-sm text-gray-500">
              Any changes made in the litigation module will automatically
              update this calendar event.
            </p>
            {event.matter && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <Text className="text-xs text-gray-600">
                  Matter: {event.matter.matterNumber || event.matter.title}
                </Text>
              </div>
            )}
          </div>
        ),
        okText: "Go to Litigation",
        cancelText: "Close",
        onOk: () => {
          // Navigate to litigation matter page
          const matterId = event.matter?._id || event.matter;
          if (matterId) {
            window.location.href = `/dashboard/matters/litigation/${matterId}`;
          }
        },
      });
    } else {
      onEdit && onEdit(event);
    }
  };

  // Handle delete for auto-synced events
  const handleDelete = () => {
    if (isAutoSynced) {
      Modal.confirm({
        title: "Cannot Delete Auto-Synced Event",
        icon: <ExclamationCircleOutlined />,
        content: (
          <div className="space-y-3">
            <Alert
              message="This event is automatically synced from litigation"
              type="warning"
              showIcon
              icon={<ThunderboltFilled />}
            />
            <p>To delete this hearing, please go to:</p>
            <p className="font-semibold text-blue-600">
              Litigation → Matter Details → Hearings
            </p>
            <p className="text-sm text-gray-500">
              Deleting the hearing in litigation will automatically remove this
              calendar event.
            </p>
            {event.matter && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <Text className="text-xs text-gray-600">
                  Matter: {event.matter.matterNumber || event.matter.title}
                </Text>
              </div>
            )}
          </div>
        ),
        okText: "Go to Litigation",
        cancelText: "Close",
        onOk: () => {
          const matterId = event.matter?._id || event.matter;
          if (matterId) {
            window.location.href = `/dashboard/matters/litigation/${matterId}`;
          }
        },
      });
    } else {
      onDelete && onDelete(event._id);
    }
  };

  const renderLocationInfo = () => {
    if (!event.location) return "-";

    switch (event.location.type) {
      case "online":
        return (
          <div>
            <div>Online Meeting</div>
            {event.location.virtualMeetingLink && (
              <a
                href={event.location.virtualMeetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700">
                Join Meeting
              </a>
            )}
          </div>
        );

      case "court":
        return (
          <div>
            <div className="font-medium flex items-center gap-2">
              <BankOutlined className="text-purple-600" />
              {event.location.courtName}
            </div>
            {event.location.courtRoom && (
              <div className="text-sm text-gray-500">
                Court Room: {event.location.courtRoom}
              </div>
            )}
            {event.location.address && (
              <div className="text-sm text-gray-500">
                {event.location.address}
              </div>
            )}
          </div>
        );

      default:
        return event.location.address || event.location.type;
    }
  };

  const renderParticipants = () => {
    if (!event.participants || event.participants.length === 0) {
      return <Text className="text-gray-400">No participants</Text>;
    }

    return (
      <Space direction="vertical" className="w-full">
        {event.participants.map((participant, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <Avatar size="small" icon={<UserOutlined />}>
                {participant.user?.firstName?.charAt(0) ||
                  participant.user?.name?.charAt(0) ||
                  "U"}
              </Avatar>
              <div>
                <div className="text-sm font-medium">
                  {participant.user?.firstName && participant.user?.lastName
                    ? `${participant.user.firstName} ${participant.user.lastName}`
                    : participant.user?.name || "Unknown"}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {participant.role}
                </div>
              </div>
            </div>
            <Tag
              color={
                participant.responseStatus === "accepted"
                  ? "success"
                  : participant.responseStatus === "declined"
                    ? "error"
                    : "default"
              }
              className="!text-xs capitalize">
              {participant.responseStatus}
            </Tag>
          </div>
        ))}
      </Space>
    );
  };

  const renderReminders = () => {
    if (!event.reminders || event.reminders.length === 0) {
      return <Text className="text-gray-400">No reminders set</Text>;
    }

    return (
      <Timeline
        items={event.reminders.map((reminder, index) => ({
          color: reminder.isSent ? "green" : "blue",
          children: (
            <div key={index}>
              <Text className="text-sm">
                {reminder.reminderTime} minutes before - {reminder.reminderType}
              </Text>
              {reminder.isSent && (
                <Tag color="success" className="ml-2 !text-xs">
                  Sent
                </Tag>
              )}
            </div>
          ),
        }))}
      />
    );
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-6 rounded"
            style={{ backgroundColor: eventColor }}
          />
          <div className="flex-1">
            <div className="text-lg font-semibold">{event.title}</div>
            <div className="text-sm font-normal text-gray-500">
              {EVENT_TYPE_LABELS[event.eventType]}
            </div>
          </div>
          {isAutoSynced && (
            <Tooltip title="Auto-synced from litigation">
              <ThunderboltFilled className="text-purple-600 text-xl animate-pulse" />
            </Tooltip>
          )}
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={
        <div className="flex items-center justify-between">
          <Space>
            {isParticipant && myParticipation?.responseStatus === "pending" && (
              <>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() =>
                    onRespond &&
                    onRespond(event._id, {
                      responseStatus: "accepted",
                    })
                  }
                  className="bg-green-600 hover:bg-green-700">
                  Accept
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() =>
                    onRespond &&
                    onRespond(event._id, {
                      responseStatus: "declined",
                    })
                  }>
                  Decline
                </Button>
              </>
            )}
          </Space>

          <Space>
            {canEdit && (
              <>
                <Button icon={<EditOutlined />} onClick={handleEdit}>
                  Edit
                </Button>
                <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                  Delete
                </Button>
              </>
            )}
            <Button onClick={onClose}>Close</Button>
          </Space>
        </div>
      }>
      <div className="space-y-4">
        {/* Auto-sync Alert */}
        {isAutoSynced && (
          <Alert
            message={
              <div className="flex items-center gap-2">
                <ThunderboltFilled />
                <span>Auto-Synced Event</span>
                {isNextHearing && <Tag color="orange">Next Hearing</Tag>}
                {isCurrentHearing && event.hearingMetadata?.outcome && (
                  <Tag color="green">Completed</Tag>
                )}
              </div>
            }
            description={
              <div>
                <p className="mb-2">
                  This event is automatically synchronized from litigation.
                  {isNextHearing && " This is a scheduled next hearing date."}
                </p>
                <Button
                  size="small"
                  type="link"
                  className="p-0"
                  onClick={() => {
                    const matterId = event.matter?._id || event.matter;
                    if (matterId) {
                      window.location.href = `/dashboard/matters/litigation/${matterId}`;
                    }
                  }}>
                  Go to Litigation to Edit →
                </Button>
              </div>
            }
            type="info"
            showIcon
            icon={<ThunderboltFilled className="text-purple-600" />}
            className="border-purple-300 bg-purple-50"
          />
        )}

        {/* Status Alerts */}
        {isNow && (
          <Alert
            message="This event is happening now"
            type="info"
            showIcon
            icon={<ClockCircleOutlined />}
            className="animate-pulse"
          />
        )}

        {isUpcoming && !isNow && (
          <Alert
            message="Upcoming event within 24 hours"
            type="warning"
            showIcon
          />
        )}

        {hasPassed && !event.hearingMetadata?.outcome && (
          <Alert message="This event has passed" type="info" showIcon />
        )}

        {/* Status and Priority */}
        <div className="flex items-center gap-2 flex-wrap">
          <Tag color={getStatusColor(event.status)}>
            {EVENT_STATUS_LABELS[event.status]}
          </Tag>
          <Tag color={getPriorityColor(event.priority)}>
            Priority: {PRIORITY_LABELS[event.priority]}
          </Tag>
          <Tag>{VISIBILITY_LEVELS[event.visibility] || event.visibility}</Tag>
          {event.isAllDay && <Tag color="purple">All Day</Tag>}
          {event.isRecurring && <Tag color="cyan">Recurring</Tag>}
          {isAutoSynced && (
            <Tag icon={<ThunderboltFilled />} color="purple">
              Auto-Synced
            </Tag>
          )}
        </div>

        <Divider className="!my-4" />

        {/* Hearing Metadata */}
        {event.hearingMetadata && (
          <>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Title level={5} className="!mb-3 flex items-center gap-2">
                <BankOutlined className="text-purple-600" />
                Court Hearing Details
              </Title>
              <div className="grid grid-cols-2 gap-3">
                {event.hearingMetadata.suitNumber && (
                  <div>
                    <Text className="text-xs text-gray-500">Suit Number</Text>
                    <div className="font-medium text-gray-900">
                      {event.hearingMetadata.suitNumber}
                    </div>
                  </div>
                )}
                {event.hearingMetadata.judge && (
                  <div>
                    <Text className="text-xs text-gray-500">Judge</Text>
                    <div className="font-medium text-gray-900">
                      {event.hearingMetadata.judge}
                    </div>
                  </div>
                )}
                {event.hearingMetadata.courtRoom && (
                  <div>
                    <Text className="text-xs text-gray-500">Court Room</Text>
                    <div className="font-medium text-gray-900">
                      {event.hearingMetadata.courtRoom}
                    </div>
                  </div>
                )}
                {event.hearingMetadata.hearingType && (
                  <div>
                    <Text className="text-xs text-gray-500">Hearing Type</Text>
                    <div className="font-medium text-gray-900 capitalize">
                      {event.hearingMetadata.hearingType}
                    </div>
                  </div>
                )}
                {event.hearingMetadata.outcome && (
                  <div className="col-span-2">
                    <Text className="text-xs text-gray-500">Outcome</Text>
                    <div className="font-medium text-green-700">
                      {event.hearingMetadata.outcome}
                    </div>
                  </div>
                )}
                {event.hearingMetadata.isAdjourned && (
                  <div className="col-span-2">
                    <Alert
                      message="Adjourned Hearing"
                      description={`This is the next hearing date, adjourned from ${
                        event.hearingMetadata.previousHearingDate
                          ? new Date(
                              event.hearingMetadata.previousHearingDate,
                            ).toLocaleDateString()
                          : "previous date"
                      }`}
                      type="warning"
                      showIcon
                      className="!p-2"
                    />
                  </div>
                )}
              </div>
            </div>
            <Divider className="!my-4" />
          </>
        )}

        {/* Description */}
        {event.description && (
          <div className="mb-4">
            <Title level={5}>Description</Title>
            <Paragraph className="text-gray-600">{event.description}</Paragraph>
          </div>
        )}

        {/* Basic Details */}
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item
            label={
              <span className="flex items-center gap-2">
                <CalendarOutlined /> Date & Time
              </span>
            }>
            <div>
              <div className="font-medium">
                {formatDateTime(event.startDateTime)}
              </div>
              <div className="text-sm text-gray-500">
                to {formatDateTime(event.endDateTime)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Duration: {formatDuration(duration)}
              </div>
            </div>
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <span className="flex items-center gap-2">
                <EnvironmentOutlined /> Location
              </span>
            }>
            {renderLocationInfo()}
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <span className="flex items-center gap-2">
                <UserOutlined /> Organizer
              </span>
            }>
            <div className="flex items-center gap-2">
              <Avatar size="small" icon={<UserOutlined />}>
                {event.organizer?.firstName?.charAt(0) ||
                  event.organizer?.name?.charAt(0) ||
                  "U"}
              </Avatar>
              <span>
                {event.organizer?.firstName && event.organizer?.lastName
                  ? `${event.organizer.firstName} ${event.organizer.lastName}`
                  : event.organizer?.name || "Unknown"}
              </span>
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="Event ID">
            <Text code>{event.eventId}</Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider className="!my-4" />

        {/* Participants */}
        <div>
          <Title level={5} className="!mb-3">
            Participants ({event.participants?.length || 0})
          </Title>
          {renderParticipants()}
        </div>

        {/* Matter */}
        {event.matter && (
          <>
            <Divider className="!my-4" />
            <div>
              <Title level={5} className="!mb-2">
                <FileTextOutlined className="mr-2" />
                Related Matter
              </Title>
              <Tag color="geekblue" className="!text-sm">
                {event.matter.matterNumber || event.matter.title}
              </Tag>
            </div>
          </>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <>
            <Divider className="!my-4" />
            <div>
              <Title level={5} className="!mb-2">
                <TagOutlined className="mr-2" />
                Tags
              </Title>
              <Space wrap>
                {event.tags.map((tag, index) => (
                  <Tag
                    key={index}
                    color={
                      tag === "auto-synced"
                        ? "purple"
                        : tag === "adjourned"
                          ? "orange"
                          : undefined
                    }>
                    {tag}
                  </Tag>
                ))}
              </Space>
            </div>
          </>
        )}

        {/* Reminders */}
        {event.reminders && event.reminders.length > 0 && (
          <>
            <Divider className="!my-4" />
            <div>
              <Title level={5} className="!mb-3">
                <ClockCircleOutlined className="mr-2" />
                Reminders
              </Title>
              {renderReminders()}
            </div>
          </>
        )}

        {/* Notes */}
        {event.notes && (
          <>
            <Divider className="!my-4" />
            <div>
              <Title level={5} className="!mb-2">
                Notes
              </Title>
              <Paragraph className="text-gray-600 bg-gray-50 p-3 rounded">
                {event.notes}
              </Paragraph>
            </div>
          </>
        )}

        {/* Metadata */}
        <Divider className="!my-4" />
        <div className="text-xs text-gray-400 space-y-1">
          <div>
            Created: {formatDateTime(event.createdAt)}
            {event.createdBy?.firstName && event.createdBy?.lastName
              ? ` by ${event.createdBy.firstName} ${event.createdBy.lastName}`
              : event.createdBy?.name
                ? ` by ${event.createdBy.name}`
                : ""}
          </div>
          {event.updatedAt && event.updatedAt !== event.createdAt && (
            <div>
              Last updated: {formatDateTime(event.updatedAt)}
              {event.lastModifiedBy?.firstName && event.lastModifiedBy?.lastName
                ? ` by ${event.lastModifiedBy.firstName} ${event.lastModifiedBy.lastName}`
                : event.lastModifiedBy?.name
                  ? ` by ${event.lastModifiedBy.name}`
                  : ""}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EventDetailsModal;
