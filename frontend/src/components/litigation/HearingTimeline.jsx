import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Space,
  Empty,
  Divider,
  message,
  Checkbox,
  Alert,
  Tag,
  Tooltip,
  Progress,
  Spin,
} from "antd";
import {
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EditOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  BellOutlined,
  FileTextOutlined,
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

import {
  addHearing,
  updateHearing,
  deleteHearing,
  selectActionLoading,
  fetchMatterHearings,
  clearMatterHearings,
  selectMatterHearings,
} from "../../redux/features/litigation/litigationSlice";
import { getAllEvents } from "../../redux/features/calender/calenderSlice";
import { getUsers, selectUsers, selectUser } from "../../redux/features/auth/authSlice";
import HearingTimelineItem from "./HearingTimelineItems";
import HearingHeader from "./HearingHeader";
import { SendHearingReportModal } from "../emails";

dayjs.extend(relativeTime);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { TextArea } = Input;
const { confirm } = Modal;

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

export const GRACE_PERIOD_HOURS = 48;

// ─── PHASE UTILITY ──────────────────────────────────────────────────────────
//
// DATA MODEL (from your MongoDB document):
//   hearing.date            = Date the hearing WAS HELD (actual court date, past/present)
//   hearing.nextHearingDate = Date the matter comes up NEXT (future session date)
//   hearing.outcome         = What happened at hearing.date (null = report not filed yet)
//   hearing.lawyerPresent   = Lawyers for this/next session
//
// PHASE RULES:
//   "schedule" → hearing.date is future. Assign lawyers, set nextHearingDate.
//                Cannot file outcome (hearing not held yet).
//   "report"   → hearing.date is past, within 48h grace, no outcome filed yet.
//   "edit"     → hearing.date is past, within 48h grace, outcome already exists.
//   "locked"   → grace period expired. Read-only.
//
// LAWYER ASSIGNMENT (KEY FIX):
//   Old logic: canAssignLawyers = hearing.date is future
//   Problem:   For your data, hearing.date = March 28 (past),
//              nextHearingDate = April 29 (future). Old logic blocked assignment.
//   Fixed:     canAssignLawyers = hearing.date is future
//                                 OR nextHearingDate is future
//              This lets lawyers be assigned for the upcoming April 29 session
//              even though the March 28 hearing date has already passed.
//
// NEXT HEARING DATE EDITABILITY (KEY FIX):
//   Old logic: only editable in "schedule" phase
//   Problem:   "Adjourned" outcome requires setting nextHearingDate AFTER
//              the hearing (during "report" phase). Restricting to schedule-only
//              made it impossible to correctly record adjournments.
//   Fixed:     nextHearingDate editable in all phases except "locked".

export const getPhaseInfo = (
  hearingDate,
  hasOutcome,
  nextHearingDate = null,
) => {
  const now = dayjs();
  const hearing = dayjs(hearingDate);
  const gracePeriodEnd = hearing.add(GRACE_PERIOD_HOURS, "hour");

  const isBeforeHearing = now.isBefore(hearing);
  const isWithinGracePeriod =
    now.isSameOrAfter(hearing) && now.isBefore(gracePeriodEnd);
  const isAfterGracePeriod = now.isSameOrAfter(gracePeriodEnd);

  const hoursRemaining = isWithinGracePeriod
    ? Math.max(0, gracePeriodEnd.diff(now, "hour"))
    : 0;
  const minutesRemaining = isWithinGracePeriod
    ? Math.max(0, gracePeriodEnd.diff(now, "minute") % 60)
    : 0;

  let phase;
  if (isBeforeHearing) {
    phase = "schedule";
  } else if (isWithinGracePeriod) {
    phase = hasOutcome ? "edit" : "report";
  } else {
    phase = "locked";
  }

  let displayStatus;
  if (hasOutcome) {
    displayStatus = "completed";
  } else if (hearing.isSame(now, "day")) {
    displayStatus = "today";
  } else if (isBeforeHearing) {
    displayStatus = "upcoming";
  } else if (isWithinGracePeriod) {
    displayStatus = "pending";
  } else {
    displayStatus = "overdue";
  }

  // KEY FIX: Lawyer assignment allowed if hearing.date is future
  // OR if nextHearingDate is in the future (need lawyers for next session).
  const hasUpcomingNextSession =
    !!nextHearingDate && dayjs(nextHearingDate).isAfter(now);

  const canAssignLawyers = isBeforeHearing || hasUpcomingNextSession;

  return {
    phase,
    displayStatus,
    isBeforeHearing,
    isWithinGracePeriod,
    isAfterGracePeriod,
    hoursRemaining,
    minutesRemaining,
    gracePeriodEnd,
    hearingDate: hearing,
    isUrgent: isWithinGracePeriod && hoursRemaining < 12,
    isCritical: isWithinGracePeriod && hoursRemaining < 4,
    canAssignLawyers,
    hasUpcomingNextSession,
  };
};

// ─── OPTIONS ────────────────────────────────────────────────────────────────

const OUTCOME_OPTIONS = [
  { value: "adjourned", label: "Adjourned", color: "orange" },
  { value: "part_heard", label: "Part Heard", color: "blue" },
  { value: "judgment_reserved", label: "Judgment Reserved", color: "purple" },
  { value: "struck_out", label: "Struck Out", color: "red" },
  { value: "settled", label: "Settled", color: "green" },
  { value: "dismissed", label: "Dismissed", color: "red" },
  { value: "decided", label: "Decided", color: "green" },
  { value: "mention_only", label: "Mention Only", color: "cyan" },
  { value: "hearing_of_witness", label: "Hearing of Witness", color: "blue" },
  { value: "cross_examination", label: "Cross Examination", color: "purple" },
  { value: "no_sitting", label: "No Sitting", color: "default" },
  { value: "other", label: "Other", color: "default" },
];

const PURPOSE_OPTIONS = [
  { value: "mention", label: "Mention" },
  { value: "hearing", label: "Hearing" },
  { value: "trial", label: "Trial" },
  { value: "ruling", label: "Ruling" },
  { value: "judgment", label: "Judgment" },
  { value: "cross_examination", label: "Cross Examination" },
  { value: "address", label: "Address" },
  { value: "settlement", label: "Settlement" },
];

const REQUIRES_ADJOURNED_DATE = "adjourned";

// ─── PHASE BANNER ───────────────────────────────────────────────────────────

const PhaseBanner = React.memo(({ phaseInfo, hasOutcome }) => {
  const {
    phase,
    isUrgent,
    isCritical,
    hoursRemaining,
    minutesRemaining,
    gracePeriodEnd,
    canAssignLawyers,
    hasUpcomingNextSession,
  } = phaseInfo;

  if (phase === "schedule") {
    return (
      <Alert
        type="info"
        showIcon
        icon={<CalendarOutlined />}
        className="mb-4 rounded-lg border-blue-200"
        message={
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Upcoming Hearing</span>
            <Tag color="blue" className="!m-0">
              Pre-Hearing
            </Tag>
          </div>
        }
        description={
          <span className="text-xs">
            Assign lawyers and set hearing notice. Outcome and court notes
            become available after the hearing date.
          </span>
        }
      />
    );
  }

  if (phase === "report" || phase === "edit") {
    const hoursConsumed = GRACE_PERIOD_HOURS - hoursRemaining;
    const progressPercent = Math.max(
      0,
      Math.min(100, (hoursConsumed / GRACE_PERIOD_HOURS) * 100),
    );

    return (
      <Alert
        type={isCritical ? "error" : isUrgent ? "warning" : "success"}
        showIcon
        icon={
          isCritical ? (
            <ThunderboltOutlined className="animate-pulse" />
          ) : (
            <FileTextOutlined />
          )
        }
        className="mb-4 rounded-lg"
        message={
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">
              {phase === "edit" ? "Edit Report Window" : "File Hearing Report"}
            </span>
            <div className="flex items-center gap-1.5">
              <ClockCircleOutlined className="text-xs opacity-70" />
              <span className="font-mono text-xs font-bold">
                {hoursRemaining}h {minutesRemaining}m remaining
              </span>
            </div>
          </div>
        }
        description={
          <div className="space-y-2 mt-1.5">
            <div className="flex items-center justify-between text-xs opacity-80">
              <span>
                {phase === "edit"
                  ? "Report editable until grace period ends"
                  : "File report within 48 hours of the hearing date"}
              </span>
              <span className="font-medium ml-2 shrink-0">
                Deadline: {gracePeriodEnd.format("DD MMM, HH:mm")}
              </span>
            </div>
            <Progress
              percent={progressPercent}
              strokeColor={
                isCritical ? "#ef4444" : isUrgent ? "#f59e0b" : "#10b981"
              }
              trailColor="#e5e7eb"
              showInfo={false}
              size="small"
            />
            {hasUpcomingNextSession && (
              <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded p-2">
                <CalendarOutlined className="shrink-0" />
                <span>
                  Next session is already scheduled. Lawyers can still be
                  assigned below.
                </span>
              </div>
            )}
            {isCritical && (
              <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded p-2">
                <WarningOutlined className="mt-0.5 shrink-0" />
                <span className="font-medium">
                  Critical: Less than 4 hours remaining — file immediately.
                </span>
              </div>
            )}
          </div>
        }
      />
    );
  }

  if (phase === "locked") {
    return (
      <Alert
        type="error"
        showIcon
        icon={<LockOutlined />}
        className="mb-4 rounded-lg border-red-200"
        message={
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Report Window Closed</span>
            <Tag color="red" className="!m-0">
              Grace Period Expired
            </Tag>
          </div>
        }
        description={
          <div className="space-y-1.5">
            <span className="text-xs">
              Grace period ended on{" "}
              <strong>{gracePeriodEnd.format("DD MMM YYYY [at] HH:mm")}</strong>
              .{" "}
              {hasOutcome
                ? "Report is now read-only."
                : "Contact an administrator to file a late report."}
            </span>
            {canAssignLawyers && (
              <div className="text-xs text-blue-600 bg-blue-50 rounded p-2 flex items-center gap-1.5 mt-1">
                <TeamOutlined />
                Lawyer assignment for the next session is still available.
              </div>
            )}
          </div>
        }
      />
    );
  }

  return null;
});

PhaseBanner.displayName = "PhaseBanner";

// ─── FIELD LOCK INDICATOR ───────────────────────────────────────────────────

const FieldLockIndicator = React.memo(({ phase, fieldType }) => {
  const isReportField = ["outcome", "notes"].includes(fieldType);
  const isLocked =
    (isReportField && phase === "schedule") || phase === "locked";
  if (!isLocked) return null;
  return (
    <Tooltip
      title={
        phase === "schedule"
          ? "Available after the hearing date"
          : "Grace period expired — contact admin"
      }>
      <LockOutlined className="text-slate-400 text-xs ml-1.5" />
    </Tooltip>
  );
});

FieldLockIndicator.displayName = "FieldLockIndicator";

// ─── STAT CARD ──────────────────────────────────────────────────────────────

const StatCard = React.memo(({ label, value, icon, colorClass, isMobile }) => (
  <div
    className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-shadow hover:shadow-md ${colorClass}`}>
    <div className={`mb-0.5 sm:mb-1 ${isMobile ? "text-sm" : "text-base"}`}>{icon}</div>
    <div className={`font-black leading-none mb-0.5 sm:mb-1 ${isMobile ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"}`}>{value}</div>
    <div className={`font-bold uppercase tracking-wider opacity-70 ${isMobile ? "text-[8px] sm:text-[10px]" : "text-[10px]"}`}>
      {label}
    </div>
  </div>
));

StatCard.displayName = "StatCard";

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

const HearingTimeline = ({
  matterId,
  hearings: propsHearings = [],
  matterDetails = null,
}) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectActionLoading);
  const matterHearings = useSelector(selectMatterHearings);
  const allUsers = useSelector(selectUsers);
  const usersLoading = useSelector((state) => state.auth?.loading ?? false);
  const currentUser = useSelector(selectUser);
  const isAdmin = currentUser?.userType === "admin" || currentUser?.role === "admin" || currentUser?.isAdmin === true;

  const hearings = matterHearings.length > 0 ? matterHearings : propsHearings;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingHearing, setEditingHearing] = useState(null);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [modalPhase, setModalPhase] = useState("schedule");
  const [showSendReportModal, setShowSendReportModal] = useState(false);
  const [dateToBeCommunicated, setDateToBeCommunicated] = useState(false);
  const [form] = Form.useForm();

  const stableMatterId = useMemo(() => String(matterId || ""), [matterId]);

  useEffect(() => {
    if (isModalVisible && !allUsers?.data?.length) {
      dispatch(getUsers());
    }
  }, [isModalVisible, dispatch, allUsers]);

  const lawyersOptions = useMemo(() => {
    if (!allUsers?.data) return [];
    return allUsers.data
      .filter((u) => u.userType === "lawyer" || u.isLawyer === true)
      .map((u) => ({
        value: u._id,
        label:
          `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
          u.email ||
          "Unknown",
      }));
  }, [allUsers]);

  useEffect(() => {
    if (!stableMatterId) return;
    dispatch(fetchMatterHearings(stableMatterId));
    return () => {
      dispatch(clearMatterHearings());
    };
  }, [dispatch, stableMatterId]);

  // KEY FIX: Pass h.nextHearingDate as third arg to getPhaseInfo so
  // canAssignLawyers is correctly computed for each hearing.
  const sortedHearingsWithPhase = useMemo(
    () =>
      [...hearings]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((h) => ({
          ...h,
          phaseInfo: getPhaseInfo(h.date, !!h.outcome, h.nextHearingDate),
        })),
    [hearings],
  );

  // The hearing record with the soonest upcoming nextHearingDate.
  // We show this in HearingHeader as the "Next Hearing" banner.
  const nextHearing = useMemo(() => {
    const now = Date.now();
    return (
      [...hearings]
        .filter(
          (h) =>
            h.nextHearingDate && new Date(h.nextHearingDate).getTime() > now,
        )
        .sort(
          (a, b) => new Date(a.nextHearingDate) - new Date(b.nextHearingDate),
        )[0] ?? null
    );
  }, [hearings]);

  const stats = useMemo(() => {
    const acc = { today: 0, upcoming: 0, pending: 0, completed: 0, overdue: 0 };
    for (const h of sortedHearingsWithPhase) {
      const s = h.phaseInfo.displayStatus;
      if (s in acc) acc[s]++;
    }
    return { total: hearings.length, ...acc };
  }, [sortedHearingsWithPhase, hearings.length]);

  // ── HANDLERS ──────────────────────────────────────────────────────────────

  const handleAddHearing = useCallback(() => {
    setEditingHearing(null);
    setSelectedOutcome(null);
    setModalPhase("schedule");
    form.resetFields();
    setIsModalVisible(true);
  }, [form]);

  const handleEditHearing = useCallback(
    (hearing) => {
      // KEY FIX: Pass nextHearingDate so canAssignLawyers reflects reality
      const phaseInfo = getPhaseInfo(
        hearing.date,
        !!hearing.outcome,
        hearing.nextHearingDate,
      );

      const formValues = {
        date: dayjs(hearing.date),
        purpose: hearing.purpose,
        hearingNoticeRequired: hearing.hearingNoticeRequired ?? false,
        lawyerPresent: (hearing.lawyerPresent ?? []).map((l) =>
          typeof l === "object" ? l._id || l.id : l,
        ),
        nextHearingDate: hearing.nextHearingDate
          ? dayjs(hearing.nextHearingDate)
          : null,
        dateToBeCommunicated: hearing.dateToBeCommunicated ?? false,
      };

      if (hearing.outcome) {
        formValues.outcome = hearing.outcome;
        formValues.notes = hearing.notes ?? "";
      }

      form.setFieldsValue(formValues);
      setSelectedOutcome(hearing.outcome ?? null);
      setDateToBeCommunicated(hearing.dateToBeCommunicated ?? false);
      setEditingHearing(hearing);
      setModalPhase(phaseInfo.phase);
      setIsModalVisible(true);
    },
    [form],
  );

  const handleDeleteHearing = useCallback(
    (hearingId) => {
      confirm({
        title: "Delete Hearing",
        icon: <WarningOutlined className="text-red-500" />,
        content:
          "This hearing record and its calendar event will be permanently removed. Continue?",
        okText: "Delete",
        okType: "danger",
        onOk: async () => {
          try {
            await dispatch(
              deleteHearing({ matterId: stableMatterId, hearingId }),
            ).unwrap();
            message.success("Hearing deleted");
            dispatch(getAllEvents({}));
          } catch (err) {
            message.error(err?.message ?? "Failed to delete hearing");
          }
        },
      });
    },
    [dispatch, stableMatterId],
  );

  const handleSubmit = useCallback(
    async (values) => {
      if (
        values.outcome === REQUIRES_ADJOURNED_DATE &&
        !values.nextHearingDate &&
        !values.dateToBeCommunicated
      ) {
        return message.error(
          "Please provide an Adjourned Date or mark as TBC",
        );
      }

      const hearingData = {
        ...values,
        date: values.date.toISOString(),
        nextHearingDate:
          values.dateToBeCommunicated
            ? null
            : values.nextHearingDate?.toISOString() ?? null,
        dateToBeCommunicated: values.dateToBeCommunicated ?? false,
      };
      try {
        if (editingHearing) {
          await dispatch(
            updateHearing({
              matterId: stableMatterId,
              hearingId: editingHearing._id,
              hearingData,
            }),
          ).unwrap();
          message.success("Hearing updated");
        } else {
          await dispatch(
            addHearing({ matterId: stableMatterId, hearingData }),
          ).unwrap();
          message.success("Hearing added and synced to calendar");
        }
        dispatch(getAllEvents({}));
        setIsModalVisible(false);
        setEditingHearing(null);
        setSelectedOutcome(null);
        form.resetFields();
      } catch (err) {
        console.error("[HearingTimeline] Submit error:", err);
        message.error(err?.message ?? "Operation failed");
      }
    },
    [dispatch, stableMatterId, editingHearing, form],
  );

  const handleModalClose = useCallback(() => {
    setIsModalVisible(false);
    setEditingHearing(null);
    setSelectedOutcome(null);
    setDateToBeCommunicated(false);
    form.resetFields();
  }, [form]);

  const requiresAdjournedDate = selectedOutcome === REQUIRES_ADJOURNED_DATE;

  // KEY FIX: Pass nextHearingDate as third arg
  const currentPhaseInfo = useMemo(
    () =>
      editingHearing
        ? getPhaseInfo(
            editingHearing.date,
            !!editingHearing.outcome,
            editingHearing.nextHearingDate,
          )
        : null,
    [editingHearing],
  );

  const isModalLocked = modalPhase === "locked";
  const isSchedulePhase = modalPhase === "schedule";

  // KEY FIX: canAssignLawyers from phaseInfo accounts for nextHearingDate.
  // For new hearings, always allow (no editingHearing yet).
  const canAssignLawyers = editingHearing
    ? (currentPhaseInfo?.canAssignLawyers ?? true)
    : true;

  // Report fields: only editable after hearing date, within grace period
  const canEditReportFields = !isSchedulePhase && (!isModalLocked || isAdmin);

  // KEY FIX: nextHearingDate editable in ALL non-locked phases.
  // The "Adjourned" outcome requires setting nextHearingDate during the
  // REPORT phase (after the hearing), not just the schedule phase.
  // Admin override: admins can always edit next hearing date even when locked.
  const canEditNextHearingDate = !isModalLocked || isAdmin;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const statCards = useMemo(
    () => [
      {
        label: "Total",
        value: stats.total,
        icon: <HistoryOutlined />,
        colorClass: "bg-slate-100 text-slate-700 border-slate-200",
      },
      {
        label: "Today",
        value: stats.today,
        icon: <ThunderboltOutlined />,
        colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      {
        label: "Upcoming",
        value: stats.upcoming,
        icon: <CalendarOutlined />,
        colorClass: "bg-blue-50 text-blue-700 border-blue-200",
      },
      {
        label: "Pending",
        value: stats.pending,
        icon: <ExclamationCircleOutlined />,
        colorClass: "bg-amber-50 text-amber-700 border-amber-200",
      },
      {
        label: "Done",
        value: stats.completed,
        icon: <CheckCircleOutlined />,
        colorClass: "bg-purple-50 text-purple-700 border-purple-200",
      },
    ],
    [stats],
  );

  // Handler for updating next hearing date and lawyers from timeline
  const handleUpdateNextHearing = useCallback(
    async (hearingId, updateData) => {
      try {
        await dispatch(
          updateHearing({
            matterId: stableMatterId,
            hearingId,
            hearingData: updateData,
          }),
        ).unwrap();
        message.success("Updated successfully");
        dispatch(getAllEvents({}));
      } catch (err) {
        message.error(err?.message ?? "Failed to update");
        throw err;
      }
    },
    [dispatch, stableMatterId],
  );

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* ── STATS ──────────────────────────────────────────── */}
      <div className={`grid gap-2 sm:gap-3 ${isMobile ? "grid-cols-3" : "grid-cols-5"}`}>
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} isMobile={isMobile} />
        ))}
      </div>

      {/* ── NEXT HEARING HEADER ────────────────────────────── */}
      {nextHearing && (
        <HearingHeader
          nextHearing={nextHearing}
          onAssignLawyers={handleEditHearing}
        />
      )}

      {/* ── TIMELINE ───────────────────────────────────────── */}
        <Card
          title={
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-200">
                  <HistoryOutlined className="text-white text-sm sm:text-base" />
                </div>
                <div>
                  <h4 className={`font-bold text-slate-800 leading-none mb-0.5 ${isMobile ? "text-xs" : "text-sm"}`}>
                    Hearings
                  </h4>
                  <p className="text-slate-400 font-medium text-[10px] sm:text-xs">
                    {hearings.length} recorded
                  </p>
                </div>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddHearing}
                className="bg-violet-600 hover:bg-violet-700 border-violet-600 font-semibold shadow"
                size={isMobile ? "small" : "middle"}>
                {isMobile ? "Add" : "Add Hearing"}
              </Button>
            </div>
          }
          bordered={false}
          className="rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
          {sortedHearingsWithPhase.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="py-6 sm:py-10 text-center">
                  <p className="text-3xl sm:text-4xl mb-2 sm:mb-3">⚖️</p>
                  <p className="text-slate-700 font-semibold text-xs sm:text-sm mb-1">
                    No hearings recorded
                  </p>
                  <p className="text-slate-400 text-[10px] sm:text-xs mb-4 sm:mb-5">
                    Start tracking court hearings
                  </p>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddHearing}
                    className="bg-violet-600 hover:bg-violet-700 border-violet-600"
                    size="small">
                    Add First Hearing
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="divide-y divide-slate-50 -mx-2 sm:mx-0">
              {sortedHearingsWithPhase.map((hearing) => (
                <HearingTimelineItem
                  key={hearing._id}
                  hearing={hearing}
                  onEdit={handleEditHearing}
                  onDelete={handleDeleteHearing}
                  onUpdateNextHearing={handleUpdateNextHearing}
                  lawyersOptions={lawyersOptions}
                  usersLoading={usersLoading}
                />
              ))}
            </div>
          )}
        </Card>

      {/* ── MODAL ──────────────────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center ${editingHearing ? "bg-blue-100 text-blue-600" : "bg-violet-100 text-violet-600"}`}>
              {editingHearing ? <EditOutlined /> : <PlusOutlined />}
            </div>
            <div>
              <p className={`font-bold text-slate-800 leading-none mb-0.5 ${isMobile ? "text-xs" : "text-sm"}`}>
                {editingHearing ? "Edit Hearing" : "Add New Hearing"}
              </p>
              {editingHearing && currentPhaseInfo && !isMobile && (
                <p className="text-[11px] font-medium text-slate-400">
                  {
                    {
                      schedule: "Upcoming — assign lawyers, set next date",
                      report: "Report required — hearing has passed",
                      edit: "Edit report — within grace period",
                      locked: "View only — grace period expired",
                    }[currentPhaseInfo.phase]
                  }
                </p>
              )}
            </div>
          </div>
        }
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={isMobile ? "95vw" : 680}
        destroyOnClose
        className="hearing-modal">
        {editingHearing && currentPhaseInfo && (
          <PhaseBanner
            phaseInfo={currentPhaseInfo}
            hasOutcome={!!editingHearing.outcome}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}>
          {/* ── HEARING DETAILS ──────────────────────────── */}
          <div className="bg-slate-50 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <CalendarOutlined className="text-slate-500 text-xs" />
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">
                Hearing Details
              </span>
            </div>

            <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
              <Form.Item
                name="date"
                label="Hearing Date & Time"
                className={isMobile ? "" : "col-span-2"}
                rules={[
                  { required: true, message: "Please select hearing date" },
                ]}>
                <DatePicker
                  showTime
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY HH:mm"
                  disabled={!!editingHearing}
                  className="rounded-lg"
                  size={isMobile ? "middle" : "large"}
                />
              </Form.Item>

              <Form.Item name="purpose" label="Purpose">
                <Select
                  placeholder="Select purpose"
                  options={PURPOSE_OPTIONS}
                  allowClear
                  size={isMobile ? "middle" : "large"}
                  disabled={isModalLocked && !isAdmin}
                />
              </Form.Item>

              {/* ── LAWYERS ──────────────────────────────────────────────
                  canAssignLawyers = true when:
                  - hearing.date is in future (schedule phase), OR
                  - nextHearingDate is in future (next session exists)
                  This means for your March 28 hearing with April 29 nextHearingDate,
                  lawyers CAN be assigned even though March 28 has passed.
              ── */}
              <Form.Item
                name="lawyerPresent"
                label={
                  <span className="flex items-center gap-1">
                    <UserOutlined className="text-xs text-slate-400" />
                    Assign Lawyers
                    {canAssignLawyers &&
                      currentPhaseInfo?.hasUpcomingNextSession && (
                        <Tag
                          color="blue"
                          className="!text-[10px] !px-1 !py-0 ml-1">
                          Next session
                        </Tag>
                      )}
                    {!canAssignLawyers && (
                      <Tooltip title="No upcoming sessions — locked">
                        <LockOutlined className="text-slate-400 text-xs ml-1" />
                      </Tooltip>
                    )}
                  </span>
                }>
                <Select
                  mode="multiple"
                  placeholder={
                    usersLoading
                      ? "Loading…"
                      : !canAssignLawyers
                        ? "Locked"
                        : lawyersOptions.length === 0
                          ? "No lawyers"
                          : "Select lawyers"
                  }
                  options={lawyersOptions}
                  loading={usersLoading}
                  disabled={!canAssignLawyers}
                  showSearch
                  optionFilterProp="label"
                  size={isMobile ? "middle" : "large"}
                  maxTagCount="responsive"
                  notFoundContent={
                    usersLoading ? (
                      <Spin size="small" />
                    ) : (
                      <span className="text-xs text-slate-400 px-2">
                        No lawyers available
                      </span>
                    )
                  }
                />
              </Form.Item>
            </div>

            <Form.Item
              name="hearingNoticeRequired"
              valuePropName="checked"
              className="!mb-2">
              <Checkbox disabled={isModalLocked && !isAdmin}>
                <span className="flex items-center gap-2 text-xs sm:text-sm">
                  <BellOutlined className="text-amber-500" />
                  <span className="font-medium">
                    Ensure Hearing Notice is Served
                  </span>
                </span>
              </Checkbox>
            </Form.Item>

            {/* ── NEXT HEARING DATE ────────────────────────────────────
                KEY FIX: Available in ALL non-locked phases.
                - In schedule phase: set future session date proactively
                - In report/edit phase: REQUIRED when outcome is "Adjourned",
                  also useful to record next session after any hearing.
                - Hidden when outcome is "Adjourned" (shown in report section
                  as "Adjourned To" with required validation instead).
                - Admin override: admins can always edit even when locked.
            ── */}
            {!requiresAdjournedDate && (
              <Form.Item
                name="nextHearingDate"
                label={
                  <span className="flex items-center gap-1.5 flex-wrap">
                    <CalendarOutlined className="text-blue-400 text-xs" />
                    Next Hearing Date
                    {isAdmin && isModalLocked && (
                      <Tag
                        color="red"
                        className="!text-[10px] !px-1 !py-0 ml-1">
                        Admin Override
                      </Tag>
                    )}
                    {!isSchedulePhase && !isModalLocked && (
                      <Tag
                        color="green"
                        className="!text-[10px] !px-1 !py-0 ml-1">
                        Adjournment
                      </Tag>
                    )}
                  </span>
                }
                tooltip="When this matter comes up next in court">
                <DatePicker
                  showTime
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Select next session date"
                  className="rounded-lg"
                  size={isMobile ? "middle" : "large"}
                  disabled={!canEditNextHearingDate}
                  status={isModalLocked && !isAdmin ? "error" : ""}
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
                />
              </Form.Item>
            )}
          </div>

          {/* ── COURT REPORT ─────────────────────────────── */}
          {(modalPhase === "report" ||
            modalPhase === "edit" ||
            modalPhase === "locked") && (
            <>
              <Divider className="!my-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Court Report
                </span>
              </Divider>

              <div
                className={`rounded-xl p-4 border-2 ${isModalLocked ? "bg-slate-50 border-slate-200" : "bg-blue-50 border-blue-200"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileTextOutlined
                      className={
                        isModalLocked ? "text-slate-400" : "text-blue-600"
                      }
                    />
                    <span
                      className={`text-xs font-bold uppercase tracking-widest ${isModalLocked ? "text-slate-400" : "text-blue-700"}`}>
                      Outcome & Notes
                    </span>
                  </div>
                  {isModalLocked ? (
                    <Tag color="default" icon={<LockOutlined />}>
                      Read Only
                    </Tag>
                  ) : (
                    <Tag color="green" icon={<CheckCircleOutlined />}>
                      Ready to file
                    </Tag>
                  )}
                </div>

                <Form.Item
                  name="outcome"
                  label={
                    <span className="flex items-center gap-1">
                      Outcome{" "}
                      <FieldLockIndicator
                        phase={modalPhase}
                        fieldType="outcome"
                      />
                    </span>
                  }
                  rules={[
                    {
                      required: modalPhase === "report",
                      message: "Outcome is required when filing report",
                    },
                  ]}>
                  <Select
                    placeholder="What was the outcome?"
                    options={OUTCOME_OPTIONS}
                    onChange={setSelectedOutcome}
                    size="large"
                    disabled={!canEditReportFields}
                    allowClear
                  />
                </Form.Item>

                {/* Adjourned-to date: shown here with required validation */}
                {requiresAdjournedDate && (
                  <>
                    <Form.Item
                      name="dateToBeCommunicated"
                      valuePropName="checked"
                      className="!mb-3">
                      <Checkbox 
                        onChange={(e) => {
                          setDateToBeCommunicated(e.target.checked);
                          if (e.target.checked) {
                            form.setFieldValue("nextHearingDate", null);
                          }
                        }} 
                        disabled={!canEditReportFields}
                      >
                        <span className="text-xs sm:text-sm font-medium text-orange-600">
                          Next date to be communicated later (Adjourned Sine Die)
                        </span>
                      </Checkbox>
                    </Form.Item>
                    
                    <Form.Item
                      noStyle
                      shouldUpdate={(prev, curr) => 
                        prev.dateToBeCommunicated !== curr.dateToBeCommunicated ||
                        prev.outcome !== curr.outcome
                      }
                    >
                      {({ getFieldValue }) => {
                        const isTBC = getFieldValue("dateToBeCommunicated");
                        if (isTBC) return null;
                        
                        return (
                          <Form.Item
                            name="nextHearingDate"
                            label={
                              <span className="flex items-center gap-1.5">
                                <CalendarOutlined className="text-orange-400 text-xs" />
                                Adjourned To
                                {isAdmin && isModalLocked && (
                                  <Tag
                                    color="red"
                                    className="!text-[10px] !px-1 !py-0 ml-1">
                                    Admin Override
                                  </Tag>
                                )}
                              </span>
                            }
                            rules={[
                              {
                                required: !isTBC,
                                message:
                                  "Next hearing date required for adjourned outcome",
                              },
                            ]}>
                            <DatePicker
                              showTime
                              style={{ width: "100%" }}
                              format="DD/MM/YYYY HH:mm"
                              placeholder="Select adjournment date"
                              className="rounded-lg"
                              size="large"
                              disabled={isTBC || (isModalLocked && !isAdmin)}
                              disabledDate={(current) =>
                                current && current < dayjs().startOf("day")
                              }
                            />
                          </Form.Item>
                        );
                      }}
                    </Form.Item>
                  </>
                )}

                <Form.Item
                  name="notes"
                  label={
                    <span className="flex items-center gap-1">
                      Court Notes{" "}
                      <FieldLockIndicator
                        phase={modalPhase}
                        fieldType="notes"
                      />
                    </span>
                  }
                  rules={[
                    {
                      required: modalPhase === "report",
                      message: "Court notes are required",
                    },
                  ]}>
                  <TextArea
                    rows={5}
                    placeholder="Detailed summary of what transpired in court…"
                    className="rounded-lg"
                    disabled={!canEditReportFields}
                    maxLength={10000}
                    showCount
                  />
                </Form.Item>
              </div>
            </>
          )}

          {/* ── FOOTER ───────────────────────────────────── */}
          <div className={`flex items-center justify-between mt-4 sm:mt-6 ${isMobile ? "flex-col gap-2" : ""}`}>
            <div className={isMobile ? "w-full" : ""}>
              {editingHearing?.outcome && (
                <Button
                  type="default"
                  icon={<MailOutlined />}
                  onClick={() => setShowSendReportModal(true)}
                  className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400"
                  size={isMobile ? "small" : "middle"}>
                  {isMobile ? "" : "Send to Client"}
                </Button>
              )}
            </div>
            <Space size={isMobile ? "small" : "small"} className={isMobile ? "w-full justify-end" : ""}>
              <Button onClick={handleModalClose} size={isMobile ? "middle" : "large"}>
                Cancel
              </Button>
              {(isModalLocked ? isAdmin : true) && (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size={isMobile ? "middle" : "large"}
                  icon={
                    modalPhase === "report" ? (
                      <FileTextOutlined />
                    ) : (
                      <CheckCircleOutlined />
                    )
                  }
                  className={`font-semibold ${modalPhase === "report" || modalPhase === "edit" ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-600" : "bg-violet-600 hover:bg-violet-700 border-violet-600"}`}>
                  {editingHearing
                    ? modalPhase === "report"
                      ? "File"
                      : modalPhase === "edit"
                        ? "Update"
                        : "Update"
                    : "Add"}
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </Modal>

      <SendHearingReportModal
        visible={showSendReportModal}
        onClose={() => setShowSendReportModal(false)}
        hearing={editingHearing}
        matter={matterDetails}
      />
    </div>
  );
};

export default React.memo(HearingTimeline);
