import React, { useCallback } from "react";
import {
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

// ─── STATUS CONFIG ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  today: {
    color: "green",
    badgeProps: { status: "processing", text: "Today" },
    cardClass:
      "border-emerald-300 shadow-md shadow-emerald-100 bg-gradient-to-br from-emerald-50 to-white",
    stripeClass: "bg-gradient-to-b from-emerald-400 to-emerald-600",
    icon: <CalendarOutlined className="text-emerald-600 animate-pulse" />,
    dotClass: "bg-emerald-50 border-2 border-emerald-500",
  },
  upcoming: {
    color: "blue",
    badgeProps: { status: "default", text: "Upcoming" },
    cardClass: "border-blue-200 bg-gradient-to-br from-blue-50 to-white",
    stripeClass: "bg-gradient-to-b from-blue-400 to-blue-600",
    icon: <CalendarOutlined className="text-blue-600" />,
    dotClass: "bg-blue-50 border-2 border-blue-500",
  },
  pending: {
    color: "orange",
    badgeProps: { status: "warning", text: "Report Pending" },
    cardClass:
      "border-amber-300 shadow-md shadow-amber-100 bg-gradient-to-br from-amber-50 to-white",
    stripeClass: "bg-gradient-to-b from-amber-400 to-amber-600",
    icon: (
      <ExclamationCircleOutlined className="text-amber-600 animate-bounce" />
    ),
    dotClass: "bg-amber-50 border-2 border-amber-500",
  },
  overdue: {
    color: "red",
    badgeProps: { status: "error", text: "Overdue" },
    cardClass:
      "border-red-300 shadow-md shadow-red-100 bg-gradient-to-br from-red-50 to-white",
    stripeClass: "bg-gradient-to-b from-red-400 to-red-600",
    icon: <WarningOutlined className="text-red-600 animate-pulse" />,
    dotClass: "bg-red-50 border-2 border-red-500",
  },
  completed: {
    color: "default",
    badgeProps: { status: "success", text: "Completed" },
    cardClass: "border-slate-200 bg-white",
    stripeClass: "bg-gradient-to-b from-slate-300 to-slate-500",
    icon: <CheckCircleOutlined className="text-emerald-500" />,
    dotClass: "bg-slate-100 border-2 border-slate-400",
  },
};

// ─── GRACE PERIOD INDICATOR ─────────────────────────────────────────────────

const GracePeriodIndicator = React.memo(({ phaseInfo }) => {
  const { isWithinGracePeriod, hoursRemaining, isCritical, isUrgent, phase } =
    phaseInfo;

  if (!isWithinGracePeriod || phase === "schedule") return null;

  // Progress = how much of the grace period has been CONSUMED (so bar fills as deadline approaches)
  const GRACE_PERIOD_HOURS = 48;
  const hoursConsumed = GRACE_PERIOD_HOURS - hoursRemaining;
  const progressPercent = Math.max(
    0,
    Math.min(100, (hoursConsumed / GRACE_PERIOD_HOURS) * 100),
  );

  const colorClass = isCritical
    ? "bg-red-50 border-red-300"
    : isUrgent
      ? "bg-amber-50 border-amber-300"
      : "bg-blue-50 border-blue-300";

  const textColorClass = isCritical
    ? "text-red-700"
    : isUrgent
      ? "text-amber-700"
      : "text-blue-700";

  const strokeColor = isCritical ? "#dc2626" : isUrgent ? "#f59e0b" : "#2563eb";

  return (
    <div className={`p-3 rounded-lg border-2 mt-3 ${colorClass}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {isCritical ? (
            <ThunderboltOutlined
              className="text-red-600 animate-pulse"
              style={{ fontSize: 12 }}
            />
          ) : (
            <ClockCircleOutlined
              className={`${isUrgent ? "text-amber-600" : "text-blue-600"}`}
              style={{ fontSize: 12 }}
            />
          )}
          <span className={`text-xs font-bold ${textColorClass}`}>
            {phase === "report" ? "Report Filing Window" : "Report Edit Window"}
          </span>
        </div>
        <span className={`font-mono text-xs font-black ${textColorClass}`}>
          {hoursRemaining}h remaining
        </span>
      </div>
      <Progress
        percent={progressPercent}
        strokeColor={strokeColor}
        trailColor="#e5e7eb"
        showInfo={false}
        size="small"
        strokeWidth={6}
      />
      <p
        className={`text-[10px] font-medium mt-1 ${textColorClass} opacity-80`}>
        {isCritical
          ? "⚠️ Critical: File immediately to avoid escalation"
          : isUrgent
            ? "⏰ Urgent: File report within the next few hours"
            : `Deadline: ${phaseInfo.gracePeriodEnd.format("DD MMM, HH:mm")}`}
      </p>
    </div>
  );
});

GracePeriodIndicator.displayName = "GracePeriodIndicator";

// ─── LAWYER AVATARS ─────────────────────────────────────────────────────────

const LawyerAvatars = React.memo(({ lawyers }) => {
  if (!lawyers?.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <TeamOutlined className="text-blue-500" style={{ fontSize: 11 }} />
      <Avatar.Group maxCount={4} size="small">
        {lawyers.map((lawyer, idx) => {
          const firstName =
            typeof lawyer === "object" ? lawyer.firstName : null;
          const lastName = typeof lawyer === "object" ? lawyer.lastName : null;
          const photo = typeof lawyer === "object" ? lawyer.photo : null;
          const fullName = formatName(firstName, lastName) || "?";

          return (
            <Tooltip key={idx} title={fullName}>
              <Avatar
                size="small"
                src={photo || undefined}
                style={{
                  backgroundColor: "#7c3aed",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 10,
                }}>
                {firstName?.[0]}
                {lastName?.[0]}
              </Avatar>
            </Tooltip>
          );
        })}
      </Avatar.Group>
      <span className="text-xs text-blue-600 font-medium">
        {lawyers.length === 1
          ? formatName(lawyers[0]?.firstName, lawyers[0]?.lastName) ||
            "1 lawyer"
          : `${lawyers.length} lawyers assigned`}
      </span>
    </div>
  );
});

LawyerAvatars.displayName = "LawyerAvatars";

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const HearingTimelineItem = React.memo(({ hearing, onEdit, onDelete }) => {
  const { phaseInfo } = hearing;
  const { displayStatus, phase, isAfterGracePeriod, isBeforeHearing } =
    phaseInfo;
  const config = STATUS_CONFIG[displayStatus] ?? STATUS_CONFIG.upcoming;

  const isLocked = phase === "locked";
  const isUpcoming = phase === "schedule";
  const needsReport = phase === "report";
  const canEditReport = phase === "report" || phase === "edit";

  // Phase-based tooltip for Edit button
  const getEditTooltip = () => {
    if (isLocked) return "View only — grace period expired";
    if (needsReport) return "File hearing report";
    if (canEditReport) return "Edit hearing report";
    if (isUpcoming) return "Edit hearing — assign lawyers, set next hearing date";
    return "Edit hearing";
  };

  // Phase-based tooltip for Delete button
  const getDeleteTooltip = () => {
    if (isUpcoming) return "Delete hearing";
    if (isLocked) return "Cannot delete — grace period expired";
    if (needsReport || canEditReport) return "Cannot delete — hearing report pending";
    return "Delete hearing";
  };

  const canDelete = isUpcoming;

  // FIX: Use stable callbacks to avoid prop-drilling re-renders
  const handleEdit = useCallback(() => onEdit(hearing), [onEdit, hearing]);
  const handleDelete = useCallback(
    () => onDelete(hearing._id),
    [onDelete, hearing._id],
  );

  return (
    <div className="flex gap-4 py-4 px-1">
      {/* ── LEFT: Date + Status ──────────────────────────── */}
      <div className="flex flex-col items-end min-w-[130px] pt-1 shrink-0">
        <p className="text-sm font-bold text-slate-800 leading-tight">
          {formatDate(hearing.date, "DD MMM YYYY")}
        </p>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          {dayjs(hearing.date).format("HH:mm")}
        </p>
        <div className="mt-2">
          <Badge {...config.badgeProps} className="text-[10px] font-semibold" />
        </div>
        {isAfterGracePeriod && !hearing.outcome && (
          <Tag color="error" className="!text-[9px] !px-1.5 !py-0 !mt-1">
            EXPIRED
          </Tag>
        )}
      </div>

      {/* ── DOT ─────────────────────────────────────────── */}
      <div className="flex flex-col items-center pt-1.5 shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${config.dotClass}`}
          style={{ fontSize: 14 }}>
          {config.icon}
        </div>
        <div className="w-px flex-1 bg-slate-200 mt-2" />
      </div>

      {/* ── RIGHT: Card ─────────────────────────────────── */}
      <div
        className={`relative flex-1 rounded-2xl border-2 transition-all duration-200 mb-4 ${config.cardClass}`}>
        {/* Accent stripe */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${config.stripeClass}`}
        />

        <div className="p-4 ml-2">
          {/* ── HEADER ──────────────────────────────────── */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              {hearing.purpose && (
                <h5 className="text-sm font-bold text-slate-800 mb-2 leading-tight capitalize">
                  {hearing.purpose.replace(/_/g, " ")}
                </h5>
              )}
              <div className="flex flex-wrap gap-1.5">
                {hearing.outcome && (
                  <Tag
                    color="green"
                    className="!m-0 !rounded-full font-medium text-xs">
                    {hearing.outcome.replace(/_/g, " ")}
                  </Tag>
                )}
                {hearing.lawyerPresent?.length > 0 && (
                  <Tag
                    icon={<TeamOutlined />}
                    color="blue"
                    className="!m-0 !rounded-full text-xs">
                    {hearing.lawyerPresent.length} Lawyer
                    {hearing.lawyerPresent.length > 1 ? "s" : ""}
                  </Tag>
                )}
                {hearing.hearingNoticeRequired && (
                  <Tag
                    icon={<BellOutlined />}
                    color="orange"
                    className="!m-0 !rounded-full text-xs">
                    Hearing Notice Required
                  </Tag>
                )}
                {isLocked && !hearing.outcome && (
                  <Tag
                    icon={<LockOutlined />}
                    color="red"
                    className="!m-0 !rounded-full text-xs">
                    Report Locked
                  </Tag>
                )}
              </div>
            </div>

            {/* ── ACTION BUTTONS ─────────────────────────── */}
            <Space size={2} className="shrink-0 ml-2">
              <Tooltip title={getEditTooltip()}>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                  size="small"
                  className={`hover:bg-blue-50 ${
                    isLocked
                      ? "text-slate-300 cursor-default"
                      : "text-slate-500 hover:text-blue-600"
                  }`}
                />
              </Tooltip>
              <Tooltip title={getDeleteTooltip()}>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                  size="small"
                  disabled={!canDelete}
                  className={`hover:bg-red-50 ${!canDelete ? "opacity-40" : ""}`}
                />
              </Tooltip>
            </Space>
          </div>

          {/* ── OUTCOME SECTION ─────────────────────────── */}
          {hearing.outcome && (
            <div className="mb-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircleOutlined
                    className="text-emerald-600"
                    style={{ fontSize: 13 }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">
                    Outcome
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mb-1 capitalize">
                    {hearing.outcome.replace(/_/g, " ")}
                  </p>
                  {hearing.notes && (
                    <>
                      <Divider className="!my-2 !border-emerald-200" />
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-4">
                        {hearing.notes}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── GRACE PERIOD BAR ────────────────────────── */}
          <GracePeriodIndicator phaseInfo={phaseInfo} />

          {/* ── NEXT HEARING ────────────────────────────── */}
          {hearing.nextHearingDate && (
            <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CalendarOutlined
                    className="text-blue-600"
                    style={{ fontSize: 13 }}
                  />
                  <div>
                    <p className="text-xs font-bold text-blue-800 leading-none mb-0.5">
                      Next Hearing
                    </p>
                    <p className="text-[11px] text-blue-500 font-medium">
                      {formatDate(hearing.nextHearingDate, "DD MMM YYYY")} at{" "}
                      {dayjs(hearing.nextHearingDate).format("HH:mm")}
                    </p>
                  </div>
                </div>
              </div>

              {hearing.lawyerPresent?.length > 0 && (
                <>
                  <Divider className="!my-2 !border-blue-200" />
                  <LawyerAvatars lawyers={hearing.lawyerPresent} />
                </>
              )}
            </div>
          )}

          {/* ── NO REPORT WARNING ───────────────────────── */}
          {!hearing.outcome &&
            displayStatus !== "upcoming" &&
            displayStatus !== "today" && (
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border-2 border-amber-300 flex items-start gap-2">
                <WarningOutlined
                  className="text-amber-600 mt-0.5 shrink-0"
                  style={{ fontSize: 12 }}
                />
                <div>
                  <p className="text-xs font-bold text-amber-800 mb-0.5">
                    {isAfterGracePeriod
                      ? "Report Not Filed — Grace Period Expired"
                      : "Report Pending"}
                  </p>
                  <p className="text-[11px] text-amber-700">
                    {isAfterGracePeriod
                      ? "Contact administrator to file a late report"
                      : "Open hearing to file report before grace period expires"}
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
});

HearingTimelineItem.displayName = "HearingTimelineItem";

export default HearingTimelineItem;
