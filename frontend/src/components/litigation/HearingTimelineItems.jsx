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
  Progress,
} from "antd";
import {
  CheckCircleOutlined,
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  BellOutlined,
  LockOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { formatDate, formatName } from "../../utils/formatters";

// ═══════════════════════════════════════════════════════════════════════════
// PHASE STATUS CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
  today: {
    color: "green",
    badge: { status: "processing", text: "Today" },
    card: "border-emerald-300 shadow-md shadow-emerald-100 bg-gradient-to-br from-emerald-50 to-white",
    stripe: "bg-gradient-to-b from-emerald-500 to-emerald-600",
    icon: <CalendarOutlined className="text-emerald-600 animate-pulse" />,
    dot: "bg-emerald-100 border-2 border-emerald-500",
  },
  upcoming: {
    color: "blue",
    badge: { status: "default", text: "Upcoming" },
    card: "border-blue-200 bg-gradient-to-br from-blue-50 to-white",
    stripe: "bg-gradient-to-b from-blue-500 to-blue-600",
    icon: <CalendarOutlined className="text-blue-600" />,
    dot: "bg-blue-100 border-2 border-blue-500",
  },
  pending: {
    color: "orange",
    badge: { status: "warning", text: "Report Pending" },
    card: "border-amber-300 shadow-md shadow-amber-100 bg-gradient-to-br from-amber-50 to-white",
    stripe: "bg-gradient-to-b from-amber-500 to-amber-600",
    icon: (
      <ExclamationCircleOutlined className="text-amber-600 animate-bounce" />
    ),
    dot: "bg-amber-100 border-2 border-amber-500",
  },
  overdue: {
    color: "red",
    badge: { status: "error", text: "Overdue" },
    card: "border-red-300 shadow-md shadow-red-100 bg-gradient-to-br from-red-50 to-white",
    stripe: "bg-gradient-to-b from-red-500 to-red-600",
    icon: <WarningOutlined className="text-red-600 animate-pulse" />,
    dot: "bg-red-100 border-2 border-red-500",
  },
  completed: {
    color: "default",
    badge: { status: "success", text: "Completed" },
    card: "border-slate-200 bg-white",
    stripe: "bg-gradient-to-b from-slate-400 to-slate-500",
    icon: <CheckCircleOutlined className="text-emerald-600" />,
    dot: "bg-slate-100 border-2 border-slate-400",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// GRACE PERIOD INDICATOR
// ═══════════════════════════════════════════════════════════════════════════

const GracePeriodIndicator = ({ phaseInfo }) => {
  const { isWithinGracePeriod, hoursRemaining, isCritical, isUrgent, phase } =
    phaseInfo;

  if (!isWithinGracePeriod || phase === "schedule") return null;

  const progressPercent = Math.max(
    0,
    Math.min(100, (hoursRemaining / 48) * 100),
  );

  return (
    <div
      className={`p-3 rounded-lg border-2 mt-3 ${
        isCritical
          ? "bg-red-50 border-red-300"
          : isUrgent
            ? "bg-amber-50 border-amber-300"
            : "bg-blue-50 border-blue-300"
      }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isCritical ? (
            <ThunderboltOutlined className="text-red-600 animate-pulse" />
          ) : (
            <ClockCircleOutlined
              className={`${isUrgent ? "text-amber-600" : "text-blue-600"}`}
            />
          )}
          <span
            className={`text-xs font-bold ${
              isCritical
                ? "text-red-700"
                : isUrgent
                  ? "text-amber-700"
                  : "text-blue-700"
            }`}>
            {phase === "report" ? "Report Filing Window" : "Report Edit Window"}
          </span>
        </div>
        <span
          className={`font-mono text-xs font-black ${
            isCritical
              ? "text-red-700"
              : isUrgent
                ? "text-amber-700"
                : "text-blue-700"
          }`}>
          {hoursRemaining}h remaining
        </span>
      </div>
      <Progress
        percent={progressPercent}
        strokeColor={isCritical ? "#dc2626" : isUrgent ? "#f59e0b" : "#2563eb"}
        trailColor="#e5e7eb"
        showInfo={false}
        size="small"
        strokeWidth={8}
        className="mb-1"
      />
      <p
        className={`text-[10px] font-medium ${
          isCritical
            ? "text-red-600"
            : isUrgent
              ? "text-amber-600"
              : "text-blue-600"
        }`}>
        {isCritical
          ? "⚠️ Critical: File immediately to avoid escalation"
          : isUrgent
            ? "⏰ Urgent: File report within the next few hours"
            : `Ends: ${phaseInfo.gracePeriodEnd.format("DD MMM, HH:mm")}`}
      </p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const HearingTimelineItem = React.memo(({ hearing, onEdit, onDelete }) => {
  const { phaseInfo } = hearing;
  const { displayStatus, phase, isAfterGracePeriod } = phaseInfo;
  const config = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.upcoming;

  const isLocked = phase === "locked";
  const canEdit = phase !== "locked";

  return (
    <Timeline.Item
      color={config.color}
      dot={
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${config.dot}`}>
          {config.icon}
        </div>
      }
      label={
        <div className="text-right pr-4 min-w-[140px]">
          <div className="text-sm font-bold text-slate-900 leading-tight">
            {formatDate(hearing.date, "DD MMM YYYY")}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">
            {dayjs(hearing.date).format("HH:mm")}
          </div>
          <div className="mt-2">
            <Badge {...config.badge} className="text-[10px] font-semibold" />
          </div>
          {isAfterGracePeriod && !hearing.outcome && (
            <div className="mt-1">
              <Tag color="red" className="!text-[9px] !px-1 !py-0">
                EXPIRED
              </Tag>
            </div>
          )}
        </div>
      }>
      <div
        className={`relative rounded-2xl border-2 transition-all duration-300 ${config.card}`}>
        {/* Vertical stripe */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${config.stripe}`}
        />

        <div className="p-5 ml-2">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              {hearing.purpose && (
                <h5 className="text-base font-bold text-slate-900 mb-2 leading-tight">
                  {hearing.purpose}
                </h5>
              )}

              <div className="flex flex-wrap gap-2">
                {hearing.outcome && (
                  <Tag
                    color="green"
                    className="!m-0 !rounded-full font-semibold">
                    {hearing.outcome.replace(/_/g, " ")}
                  </Tag>
                )}
                {hearing.lawyerPresent?.length > 0 && (
                  <Tag
                    icon={<TeamOutlined />}
                    color="blue"
                    className="!m-0 !rounded-full">
                    {hearing.lawyerPresent.length} Lawyer
                    {hearing.lawyerPresent.length > 1 ? "s" : ""}
                  </Tag>
                )}
                {hearing.hearingNoticeRequired && (
                  <Tag
                    icon={<BellOutlined />}
                    color="orange"
                    className="!m-0 !rounded-full animate-pulse">
                    Ensure Hearing Notice is Served
                  </Tag>
                )}
                {isLocked && !hearing.outcome && (
                  <Tag
                    icon={<LockOutlined />}
                    color="red"
                    className="!m-0 !rounded-full">
                    Report Locked
                  </Tag>
                )}
              </div>
            </div>

            <Space size={4} className="flex-shrink-0">
              <Tooltip
                title={
                  isLocked
                    ? "Viewing only - grace period expired"
                    : "Edit hearing"
                }>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(hearing)}
                  size="small"
                  className={`hover:bg-blue-50 ${isLocked ? "opacity-50" : ""}`}
                />
              </Tooltip>
              <Tooltip title={isLocked ? "Viewing only" : "Assign lawyers"}>
                <Button
                  type="text"
                  icon={<TeamOutlined />}
                  onClick={() => onEdit(hearing)}
                  size="small"
                  className={`hover:bg-blue-50 text-blue-600 ${isLocked ? "opacity-50" : ""}`}
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

          {/* Outcome Section */}
          {hearing.outcome && (
            <div className="mb-3 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircleOutlined className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-1.5">
                    Outcome
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mb-2">
                    {hearing.outcome.replace(/_/g, " ")}
                  </p>
                  {hearing.notes && (
                    <>
                      <Divider className="!my-2 !border-emerald-200" />
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {hearing.notes}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Grace Period Indicator */}
          <GracePeriodIndicator phaseInfo={phaseInfo} />

          {/* Next Hearing Section */}
          {hearing.nextHearingDate && (
            <div className="mt-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CalendarOutlined className="text-blue-600 text-base" />
                  <div>
                    <span className="text-sm font-bold text-blue-900 block leading-tight">
                      Next Hearing
                    </span>
                    <span className="text-xs text-blue-600 font-medium">
                      {formatDate(hearing.nextHearingDate, "DD MMM YYYY")} at{" "}
                      {dayjs(hearing.nextHearingDate).format("HH:mm")}
                    </span>
                  </div>
                </div>
                <Badge
                  count={hearing.lawyerPresent?.length || 0}
                  style={{ backgroundColor: "#2563eb" }}
                  showZero
                  overflowCount={10}
                />
              </div>

              {hearing.lawyerPresent?.length > 0 && (
                <>
                  <Divider className="!my-2 !border-blue-200" />
                  <div className="flex flex-wrap items-center gap-2">
                    <TeamOutlined className="text-blue-500 text-xs" />
                    <Avatar.Group maxCount={4} size="small">
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
                              fontWeight: 700,
                            }}>
                            {lawyer.firstName?.[0]}
                            {lawyer.lastName?.[0]}
                          </Avatar>
                        </Tooltip>
                      ))}
                    </Avatar.Group>
                    <span className="text-xs text-blue-600 font-medium">
                      {hearing.lawyerPresent.length === 1
                        ? formatName(
                            hearing.lawyerPresent[0].firstName,
                            hearing.lawyerPresent[0].lastName,
                          )
                        : `${hearing.lawyerPresent.length} lawyers assigned`}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* No Report Warning */}
          {!hearing.outcome &&
            displayStatus !== "upcoming" &&
            displayStatus !== "today" && (
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border-2 border-amber-300 flex items-start gap-2">
                <WarningOutlined className="text-amber-600 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-800 mb-1">
                    {isAfterGracePeriod
                      ? "Report Not Filed - Grace Period Expired"
                      : "Report Pending"}
                  </p>
                  <p className="text-xs text-amber-700">
                    {isAfterGracePeriod
                      ? "Contact administrator to file late report"
                      : "File report before grace period expires"}
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>
    </Timeline.Item>
  );
});

HearingTimelineItem.displayName = "HearingTimelineItem";

export default HearingTimelineItem;
