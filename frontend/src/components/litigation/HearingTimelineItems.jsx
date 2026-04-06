import React, { useCallback, useState, useEffect, useMemo } from "react";
import {
  Tag,
  Button,
  Tooltip,
  Space,
  Divider,
  Avatar,
  Badge,
  Progress,
  Modal,
  DatePicker,
  Select,
  message,
  Spin,
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
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { formatDate, formatName } from "../../utils/formatters";
import useTextShorten from "../../hooks/useTextShorten";

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

// ─── NEXT HEARING EDIT MODAL ─────────────────────────────────────────────────

const NextHearingEditModal = React.memo(({
  visible,
  hearing,
  onClose,
  onUpdate,
  lawyersOptions,
  usersLoading,
}) => {
  const [date, setDate] = useState(null);
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (visible && hearing) {
      setDate(hearing.nextHearingDate ? dayjs(hearing.nextHearingDate) : null);
      setLawyers((hearing.lawyerPresent || []).map((l) =>
        typeof l === "object" ? l._id || l.id : l
      ));
    }
  }, [visible, hearing]);

  const handleSave = async () => {
    if (!date) {
      message.error("Please select a date");
      return;
    }
    setLoading(true);
    try {
      await onUpdate(hearing._id, {
        nextHearingDate: date.toISOString(),
        lawyerPresent: lawyers,
      });
      onClose();
    } catch (err) {
      message.error(err?.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <CalendarOutlined className="text-blue-600" />
          <span className={isMobile ? "text-sm" : ""}>Update Adjourned Date</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={
        <div className={`flex justify-end gap-2 ${isMobile ? "flex-col" : ""}`}>
          <Button onClick={onClose} size={isMobile ? "middle" : "large"}>
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            loading={loading}
            size={isMobile ? "middle" : "large"}
            className="bg-blue-600 hover:bg-blue-700">
            Save Changes
          </Button>
        </div>
      }
      width={isMobile ? "95vw" : 450}
      className="next-hearing-edit-modal">
      <div className="py-3 sm:py-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            <CalendarOutlined className="mr-1" />
            Next Hearing Date
          </label>
          <DatePicker
            showTime
            value={date}
            onChange={setDate}
            format="DD/MM/YYYY HH:mm"
            style={{ width: "100%" }}
            size={isMobile ? "middle" : "large"}
            disabledDate={(current) => current && current < dayjs().startOf("day")}
            placeholder="Select new hearing date"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            <TeamOutlined className="mr-1" />
            Assigned Lawyers
          </label>
          <Select
            mode="multiple"
            value={lawyers}
            onChange={setLawyers}
            options={lawyersOptions}
            loading={usersLoading}
            placeholder="Select lawyers for next hearing"
            style={{ width: "100%" }}
            size={isMobile ? "middle" : "large"}
            maxTagCount="responsive"
            allowClear
            showSearch
            optionFilterProp="label"
            notFoundContent={
              usersLoading ? (
                <div className="flex justify-center py-2">
                  <Spin size="small" />
                </div>
              ) : (
                <span className="text-xs text-slate-400 px-2">No lawyers available</span>
              )
            }
          />
        </div>
      </div>
    </Modal>
  );
});

NextHearingEditModal.displayName = "NextHearingEditModal";

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const HearingTimelineItem = React.memo(({
  hearing,
  onEdit,
  onDelete,
  onUpdateNextHearing,
  lawyersOptions = [],
  usersLoading = false,
}) => {
  const { phaseInfo } = hearing;
  const { displayStatus, phase, isAfterGracePeriod } = phaseInfo;
  const config = STATUS_CONFIG[displayStatus] ?? STATUS_CONFIG.upcoming;
  const [isMobile, setIsMobile] = useState(false);
  const [showNextHearingModal, setShowNextHearingModal] = useState(false);
  const { shortenText } = useTextShorten();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isLocked = phase === "locked";
  const isUpcoming = phase === "schedule";
  const needsReport = phase === "report";
  const canEditReport = phase === "report" || phase === "edit";
  const canDelete = !hearing.outcome;
  const canEditNextHearing = !isLocked;

  const handleEdit = useCallback(() => onEdit(hearing), [onEdit, hearing]);
  const handleDelete = useCallback(
    () => onDelete(hearing._id),
    [onDelete, hearing._id],
  );

  // Mobile card view
  if (isMobile) {
    return (
      <>
        <div className="p-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.dotClass}`}>
                {config.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {formatDate(hearing.date, "DD MMM YYYY")}
                </p>
                <p className="text-[10px] text-slate-400">
                  {dayjs(hearing.date).format("HH:mm")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge {...config.badgeProps} className="text-[10px]" />
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={handleEdit}
                className="text-slate-500"
              />
              {canDelete && (
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                />
              )}
            </div>
          </div>
          
          {hearing.purpose && (
            <p className="text-xs font-medium text-slate-600 capitalize mb-2">
              {hearing.purpose.replace(/_/g, " ")}
            </p>
          )}
          
          <div className="flex flex-wrap gap-1 mb-2">
            {hearing.outcome && (
              <Tag color="green" className="!text-[9px]">{hearing.outcome.replace(/_/g, " ")}</Tag>
            )}
            {hearing.lawyerPresent?.length > 0 && (
              <Tag color="blue" icon={<TeamOutlined />} className="!text-[9px]">
                {hearing.lawyerPresent.length} Lwyr{hearing.lawyerPresent.length > 1 ? "s" : ""}
              </Tag>
            )}
          </div>
          
          {hearing.notes && (
            <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                {shortenText(hearing.notes, 100, `mobile-notes-${hearing._id}`)}
              </p>
            </div>
          )}
          
          {(hearing.nextHearingDate || hearing.dateToBeCommunicated) && (
            <div className="flex items-center justify-between bg-blue-50 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <CalendarOutlined className="text-blue-600 text-xs" />
                <div>
                  <p className="text-[10px] font-bold text-blue-800">Next</p>
                  {hearing.dateToBeCommunicated ? (
                    <Tag color="orange" className="!text-[9px]">TBC</Tag>
                  ) : (
                    <p className="text-[9px] text-blue-500">
                      {formatDate(hearing.nextHearingDate, "DD MMM, HH:mm")}
                    </p>
                  )}
                </div>
              </div>
              {canEditNextHearing && (
                <Button
                  type="primary"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => setShowNextHearingModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 border-blue-600"
                />
              )}
            </div>
          )}
          
          {!hearing.outcome && displayStatus === "pending" && (
            <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-[10px] text-amber-700 font-medium">
                Report pending — file within {phaseInfo.hoursRemaining}h
              </p>
            </div>
          )}
        </div>

        <NextHearingEditModal
          visible={showNextHearingModal}
          hearing={hearing}
          onClose={() => setShowNextHearingModal(false)}
          onUpdate={onUpdateNextHearing}
          lawyersOptions={lawyersOptions}
          usersLoading={usersLoading}
        />
      </>
    );
  }

  // Desktop timeline view
  return (
    <>
      <div className="flex gap-4 py-4 px-1">
        {/* LEFT: Date + Status */}
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

        {/* DOT */}
        <div className="flex flex-col items-center pt-1.5 shrink-0">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${config.dotClass}`}
            style={{ fontSize: 14 }}>
            {config.icon}
          </div>
          <div className="w-px flex-1 bg-slate-200 mt-2" />
        </div>

        {/* RIGHT: Card */}
        <div className={`relative flex-1 rounded-2xl border-2 transition-all duration-200 mb-4 ${config.cardClass}`}>
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${config.stripeClass}`} />

          <div className="p-4 ml-2">
            {/* HEADER */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                {hearing.purpose && (
                  <h5 className="text-sm font-bold text-slate-800 mb-2 leading-tight capitalize">
                    {hearing.purpose.replace(/_/g, " ")}
                  </h5>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {hearing.outcome && (
                    <Tag color="green" className="!m-0 !rounded-full font-medium text-xs">
                      {hearing.outcome.replace(/_/g, " ")}
                    </Tag>
                  )}
                  {hearing.lawyerPresent?.length > 0 && (
                    <Tag icon={<TeamOutlined />} color="blue" className="!m-0 !rounded-full text-xs">
                      {hearing.lawyerPresent.length} Lawyer{hearing.lawyerPresent.length > 1 ? "s" : ""}
                    </Tag>
                  )}
                  {hearing.hearingNoticeRequired && (
                    <Tag icon={<BellOutlined />} color="orange" className="!m-0 !rounded-full text-xs">
                      Hearing Notice Required
                    </Tag>
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <Space size={2} className="shrink-0 ml-2">
                <Tooltip title={isLocked ? "View only" : "Edit hearing"}>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={handleEdit}
                    size="small"
                    className={`hover:bg-blue-50 ${isLocked ? "text-slate-300" : "text-slate-500 hover:text-blue-600"}`}
                  />
                </Tooltip>
                {canDelete && (
                  <Tooltip title="Delete hearing">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleDelete}
                      size="small"
                      className="hover:bg-red-50"
                    />
                  </Tooltip>
                )}
              </Space>
            </div>

            {/* OUTCOME SECTION */}
            {hearing.outcome && (
              <div className="mb-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircleOutlined className="text-emerald-600" style={{ fontSize: 13 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">Outcome</p>
                    <p className="text-sm font-semibold text-slate-800 mb-1 capitalize">
                      {hearing.outcome.replace(/_/g, " ")}
                    </p>
                    {hearing.notes && (
                      <>
                        <Divider className="!my-2 !border-emerald-200" />
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {shortenText(hearing.notes, 200, `desktop-notes-${hearing._id}`)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* GRACE PERIOD BAR */}
            <GracePeriodIndicator phaseInfo={phaseInfo} />

            {/* NEXT HEARING */}
            {(hearing.nextHearingDate || hearing.dateToBeCommunicated) && (
              <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarOutlined className="text-blue-600" style={{ fontSize: 13 }} />
                    <div>
                      <p className="text-xs font-bold text-blue-800 leading-none mb-0.5">Next Hearing</p>
                      {hearing.dateToBeCommunicated ? (
                        <Tag color="orange" className="!text-[10px]">Date to be communicated</Tag>
                      ) : (
                        <p className="text-[11px] text-blue-500 font-medium">
                          {formatDate(hearing.nextHearingDate, "DD MMM YYYY [at] HH:mm")}
                        </p>
                      )}
                    </div>
                  </div>
                  {canEditNextHearing && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => setShowNextHearingModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 border-blue-600"
                    >
                      Edit
                    </Button>
                  )}
                </div>

                {hearing.lawyerPresent?.length > 0 && (
                  <>
                    <Divider className="!my-2 !border-blue-200" />
                    <LawyerAvatars lawyers={hearing.lawyerPresent} />
                  </>
                )}
              </div>
            )}

            {/* NO REPORT WARNING */}
            {!hearing.outcome && displayStatus !== "upcoming" && displayStatus !== "today" && (
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border-2 border-amber-300 flex items-start gap-2">
                <WarningOutlined className="text-amber-600 mt-0.5 shrink-0" style={{ fontSize: 12 }} />
                <div>
                  <p className="text-xs font-bold text-amber-800 mb-0.5">
                    {isAfterGracePeriod ? "Report Not Filed" : "Report Pending"}
                  </p>
                  <p className="text-[11px] text-amber-700">
                    {isAfterGracePeriod ? "Contact administrator" : "File before deadline"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <NextHearingEditModal
        visible={showNextHearingModal}
        hearing={hearing}
        onClose={() => setShowNextHearingModal(false)}
        onUpdate={onUpdateNextHearing}
        lawyersOptions={lawyersOptions}
        usersLoading={usersLoading}
      />
    </>
  );
});

HearingTimelineItem.displayName = "HearingTimelineItem";

export default HearingTimelineItem;
