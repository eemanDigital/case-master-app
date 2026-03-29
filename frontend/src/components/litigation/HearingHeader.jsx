import React from "react";
import { Card, Button, Avatar, Tooltip, Tag, Alert } from "antd";
import {
  ThunderboltOutlined,
  CalendarOutlined,
  TeamOutlined,
  WarningOutlined,
  LockOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { formatDate, formatName } from "../../utils/formatters";
import { getPhaseInfo } from "./HearingTimeline"; // re-uses the exported utility

// ─── HEARING HEADER ─────────────────────────────────────────────────────────
//
// Shows the next upcoming session prominently.
//
// KEY DATA FIELDS:
//   nextHearing.date            = When the hearing WAS HELD (past court date)
//   nextHearing.nextHearingDate = When the matter comes up NEXT (future session)
//
// The banner headline, date display, and "from now" label all use nextHearingDate.
// The phase/grace period calculation uses hearing.date (when it was held).
// The "Assign Lawyers" button uses canAssignLawyers from phaseInfo, which is
// true whenever nextHearingDate is in the future.

const HearingHeader = ({ nextHearing, onAssignLawyers }) => {
  if (!nextHearing) return null;

  // Phase is based on hearing.date (when held), but canAssignLawyers also
  // checks nextHearingDate — so even a past hearing with a future next session
  // correctly shows the Assign Lawyers button.
  const phaseInfo = getPhaseInfo(
    nextHearing.date,
    !!nextHearing.outcome,
    nextHearing.nextHearingDate,
  );

  const {
    canAssignLawyers,
    phase,
    isAfterGracePeriod,
    hoursRemaining,
    minutesRemaining,
    gracePeriodEnd,
  } = phaseInfo;

  const handleAssign = () => {
    if (typeof onAssignLawyers === "function" && canAssignLawyers) {
      onAssignLawyers(nextHearing);
    }
  };

  // All display dates use nextHearingDate (the upcoming session)
  const nextSessionDate = nextHearing.nextHearingDate;
  const nextSessionDay = dayjs(nextSessionDate);

  return (
    <Card
      className="mb-6 overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200"
      bodyStyle={{ padding: 0 }}>
      <div className="p-5">
        {/* ── HEADER ROW ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <ThunderboltOutlined className="text-white text-sm" />
            </div>
            <div>
              <h4 className="text-sm font-black text-blue-900">Next Hearing</h4>
              {/* fromNow relative to the upcoming session, not the past hearing date */}
              <p className="text-xs text-blue-600">
                {nextSessionDay.fromNow()}
              </p>
            </div>
          </div>

          {canAssignLawyers ? (
            <Button
              type="primary"
              icon={<TeamOutlined />}
              onClick={handleAssign}
              size="small"
              className="bg-blue-600 hover:bg-blue-700 border-blue-600">
              Assign Lawyers
            </Button>
          ) : (
            <Tag color="red" icon={<LockOutlined />} className="!text-xs">
              Lawyer assignment locked
            </Tag>
          )}
        </div>

        {/* ── PENDING REPORT ALERT ─────────────────────────────────── */}
        {/* Only shown if the last hearing's report hasn't been filed yet */}
        {!nextHearing.outcome && (
          <Alert
            type={isAfterGracePeriod ? "error" : "warning"}
            showIcon
            icon={
              isAfterGracePeriod ? <LockOutlined /> : <ClockCircleOutlined />
            }
            className="mb-4 text-xs"
            message={
              isAfterGracePeriod
                ? `Report not filed — grace period expired (${gracePeriodEnd.format("DD MMM, HH:mm")})`
                : phase === "report"
                  ? `Report pending for ${formatDate(nextHearing.date, "DD MMM")} hearing — ${hoursRemaining}h ${minutesRemaining}m left`
                  : null
            }
            action={
              !isAfterGracePeriod &&
              phase === "report" && (
                <Button
                  size="small"
                  type="link"
                  onClick={() => onAssignLawyers?.(nextHearing)}>
                  File Now
                </Button>
              )
            }
          />
        )}

        {/* ── DATE + LAWYERS ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Next session date — uses nextHearingDate */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <CalendarOutlined className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Next Session</p>
              <p className="text-base font-bold text-gray-900">
                {formatDate(nextSessionDate, "DD MMM YYYY")}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  at {nextSessionDay.format("HH:mm")}
                </span>
              </p>
              {/* Context: show when the last hearing was held */}
              <p className="text-[11px] text-gray-400 mt-0.5">
                Last heard: {formatDate(nextHearing.date, "DD MMM YYYY")}
              </p>
            </div>
          </div>

          {/* Assigned lawyers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">
                Assigned Lawyers ({nextHearing.lawyerPresent?.length || 0})
              </p>
              {nextHearing.lawyerPresent?.length > 0 ? (
                <Tag
                  color="green"
                  icon={<CheckCircleOutlined />}
                  className="!text-[10px]">
                  Assigned
                </Tag>
              ) : (
                <Tag color="orange" className="!text-[10px]">
                  No lawyers
                </Tag>
              )}
            </div>

            {nextHearing.lawyerPresent?.length > 0 ? (
              <Avatar.Group
                maxCount={4}
                size="small"
                maxStyle={{ backgroundColor: "#bfdbfe", color: "#1e40af" }}>
                {nextHearing.lawyerPresent.map((lawyer, index) => (
                  <Tooltip
                    key={index}
                    title={formatName(lawyer.firstName, lawyer.lastName)}>
                    <Avatar
                      src={lawyer.photo}
                      style={{ backgroundColor: "#3b82f6", color: "white" }}>
                      {lawyer.firstName?.[0]}
                      {lawyer.lastName?.[0]}
                    </Avatar>
                  </Tooltip>
                ))}
              </Avatar.Group>
            ) : (
              <div
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  canAssignLawyers
                    ? "text-amber-600 bg-amber-50 hover:bg-amber-100 cursor-pointer"
                    : "text-gray-400 bg-gray-50 cursor-default"
                }`}
                onClick={canAssignLawyers ? handleAssign : undefined}>
                <WarningOutlined style={{ fontSize: 12 }} />
                <span className="text-xs font-medium">
                  {canAssignLawyers
                    ? "No lawyers assigned — click to assign"
                    : "Lawyer assignment locked"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── PURPOSE ──────────────────────────────────────────────── */}
        {nextHearing.purpose && (
          <div className="mt-4 p-3 bg-white/60 rounded-lg border border-blue-100">
            <p className="text-xs text-gray-500 mb-1">Purpose</p>
            <p className="text-sm font-medium text-gray-900 capitalize">
              {nextHearing.purpose.replace(/_/g, " ")}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default HearingHeader;
