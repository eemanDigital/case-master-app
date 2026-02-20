import React from "react";
import {
  Timeline,
  Tag,
  Button,
  Tooltip,
  Space,
  Divider,
  Avatar,
  Badge,
} from "antd";
import {
  CheckCircleOutlined,
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { formatDate, formatName } from "../../utils/formatters";

const getDisplayStatus = (hearingDate, hasOutcome) => {
  const today = dayjs().startOf("day");
  const hearing = dayjs(hearingDate).startOf("day");

  if (hasOutcome) return "completed";
  if (hearing.isSame(today)) return "today";
  if (hearing.isAfter(today)) return "upcoming";
  return "past";
};

const getStatusColor = (status) => {
  switch (status) {
    case "today":
      return "green";
    case "upcoming":
      return "blue";
    case "completed":
      return "default";
    case "past":
      return "gray";
    default:
      return "default";
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case "today":
      return (
        <Badge status="processing" text="Today" className="text-green-600" />
      );
    case "upcoming":
      return (
        <Badge status="warning" text="Upcoming" className="text-blue-600" />
      );
    case "completed":
      return (
        <Badge status="success" text="Completed" className="text-green-600" />
      );
    case "past":
      return (
        <Badge status="default" text="Past Due" className="text-gray-500" />
      );
    default:
      return null;
  }
};

const HearingTimelineItem = React.memo(
  ({ hearing, onEdit, onDelete, onAssignLawyers }) => {
    const displayStatus = getDisplayStatus(hearing.date, hearing.outcome);
    const statusColor = getStatusColor(displayStatus);
    const statusBadge = getStatusBadge(displayStatus);

    console.log(hearing, "HEARING");

    return (
      <Timeline.Item
        color={statusColor}
        dot={
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              displayStatus === "today"
                ? "bg-green-100"
                : displayStatus === "upcoming"
                  ? "bg-blue-100"
                  : displayStatus === "completed"
                    ? "bg-gray-100"
                    : "bg-gray-50"
            }`}>
            {displayStatus === "completed" ? (
              <CheckCircleOutlined className="text-green-600 text-xs" />
            ) : (
              <CalendarOutlined
                className={`text-xs ${
                  displayStatus === "today"
                    ? "text-green-600"
                    : displayStatus === "upcoming"
                      ? "text-blue-600"
                      : "text-gray-400"
                }`}
              />
            )}
          </div>
        }
        label={
          <div className="text-right pr-4">
            <div className="text-sm font-semibold text-gray-900">
              {formatDate(hearing.date, "DD MMM YYYY")}
            </div>
            <div className="text-xs text-gray-500">
              {dayjs(hearing.date).format("HH:mm")}
            </div>
            <div className="mt-1">{statusBadge}</div>
          </div>
        }>
        <div
          className={`relative bg-white rounded-xl border transition-all duration-200 ${
            displayStatus === "today"
              ? "border-green-200 shadow-sm shadow-green-100"
              : displayStatus === "upcoming"
                ? "border-blue-200"
                : displayStatus === "completed"
                  ? "border-gray-200"
                  : "border-gray-100 bg-gray-50"
          }`}>
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
              displayStatus === "today"
                ? "bg-green-500"
                : displayStatus === "upcoming"
                  ? "bg-blue-500"
                  : displayStatus === "completed"
                    ? "bg-gray-400"
                    : "bg-gray-300"
            }`}
          />

          <div className="p-4 ml-1">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                {hearing.purpose && (
                  <h5 className="text-base font-semibold text-gray-900 mb-1">
                    {hearing.purpose}
                  </h5>
                )}

                <div className="flex flex-wrap gap-2">
                  {hearing.outcome && (
                    <Tag color="green" className="!m-0">
                      {hearing.outcome.replace(/_/g, " ")}
                    </Tag>
                  )}
                  {hearing.lawyerPresent?.length > 0 && (
                    <Tag icon={<TeamOutlined />} color="blue" className="!m-0">
                      {hearing.lawyerPresent.length} Lawyer
                      {hearing.lawyerPresent.length > 1 ? "s" : ""}
                    </Tag>
                  )}
                </div>
              </div>

              <Space size={2}>
                <Tooltip title="Edit hearing">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => onEdit(hearing)}
                    size="small"
                    className="hover:bg-blue-50"
                  />
                </Tooltip>
                <Tooltip title="Delete hearing">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onDelete(hearing._id)}
                    size="small"
                    className="hover:bg-red-50"
                  />
                </Tooltip>
              </Space>
            </div>

            {hearing.outcome && (
              <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-start gap-2">
                  <CheckCircleOutlined className="text-green-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-green-800 mb-1">
                      Outcome
                    </p>
                    <p className="text-sm text-gray-700">{hearing.outcome}</p>
                    {hearing.notes && (
                      <>
                        <Divider className="my-2 border-green-200" />
                        <p className="text-xs text-gray-600">{hearing.notes}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {hearing.nextHearingDate && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ClockCircleOutlined className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Next Hearing:{" "}
                      {formatDate(hearing.nextHearingDate, "DD MMM YYYY")}
                      <span className="text-xs text-blue-600 ml-2">
                        at {dayjs(hearing.nextHearingDate).format("HH:mm")}
                      </span>
                    </span>
                  </div>
                  <Badge
                    count={hearing.lawyerPresent?.length || 0}
                    style={{ backgroundColor: "#3b82f6" }}
                    showZero
                    overflowCount={10}
                  />
                </div>

                {hearing.lawyerPresent?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <TeamOutlined className="text-blue-400 text-xs" />
                    <Avatar.Group maxCount={3} size="small">
                      {hearing.lawyerPresent.map((lawyer, idx) => (
                        <Tooltip
                          key={idx}
                          title={formatName(lawyer.firstName, lawyer.lastName)}>
                          <Avatar
                            size="small"
                            src={lawyer.photo}
                            style={{
                              backgroundColor: "#3b82f6",
                              color: "white",
                            }}>
                            {lawyer.firstName?.[0]}
                            {lawyer.lastName?.[0]}
                          </Avatar>
                        </Tooltip>
                      ))}
                    </Avatar.Group>
                  </div>
                )}

                {/* <Button
                  type="link"
                  size="small"
                  icon={<TeamOutlined />}
                  onClick={() => onAssignLawyers(hearing)}
                  className="!p-0 mt-2 text-blue-600 hover:text-blue-800">
                  {hearing.lawyerPresent?.length > 0
                    ? "Update Assignment"
                    : "Assign Lawyers"}
                </Button> */}
              </div>
            )}
          </div>
        </div>
      </Timeline.Item>
    );
  },
);

HearingTimelineItem.displayName = "HearingTimelineItem";

export default HearingTimelineItem;
