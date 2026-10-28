import { Card, Button, Avatar, Tooltip, Tag, Alert } from "antd";
import {
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
      className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      bodyStyle={{ padding: 0 }}>
      <div className="p-4 sm:p-5">
        {/* ── HEADER ROW ───────────────────────────────────────────── */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <CalendarOutlined />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Next hearing</h4>
              {/* fromNow relative to the upcoming session, not the past hearing date */}
              <p className="text-xs text-slate-500">
                {nextSessionDay.fromNow()}
              </p>
            </div>
          </div>

          {canAssignLawyers ? (
            <Button
              type="primary"
              icon={<TeamOutlined />}
              onClick={handleAssign}
              className="w-full bg-blue-700 font-medium hover:bg-blue-800 sm:w-auto">
              Assign lawyers
            </Button>
          ) : (
            <Tag color="default" icon={<LockOutlined />} className="!m-0 !w-fit !rounded-full !px-3 !py-1">
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
            className="mb-4 rounded-lg text-xs"
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Next session date — uses nextHearingDate */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm">
              <CalendarOutlined />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Next court date</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 sm:text-base">
                {formatDate(nextSessionDate, "DD MMM YYYY")}
                <span className="ml-2 text-sm font-normal text-slate-500">
                  at {nextSessionDay.format("HH:mm")}
                </span>
              </p>
              {/* Context: show when the last hearing was held */}
              <p className="mt-1 text-xs text-slate-500">
                Last heard: {formatDate(nextHearing.date, "DD MMM YYYY")}
              </p>
            </div>
          </div>

          {/* Assigned lawyers */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-600">
                Assigned lawyers
              </p>
              {nextHearing.lawyerPresent?.length > 0 ? (
                <Tag
                  color="green"
                  icon={<CheckCircleOutlined />}
                  className="!m-0 !rounded-full !text-[10px]">
                  {nextHearing.lawyerPresent.length} assigned
                </Tag>
              ) : (
                <Tag color="orange" className="!m-0 !rounded-full !text-[10px]">
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
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                  canAssignLawyers
                    ? "cursor-pointer border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "cursor-default border-slate-200 bg-white text-slate-400"
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
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="mb-1 text-xs font-medium text-slate-500">Purpose</p>
            <p className="text-sm font-medium capitalize text-slate-800">
              {nextHearing.purpose.replace(/_/g, " ")}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default HearingHeader;
