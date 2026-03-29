import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
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
  Badge,
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
import useUserSelectOptions from "../../hooks/useUserSelectOptions";
import HearingTimelineItem from "./HearingTimelineItems";
import HearingHeader from "./HearingHeader";
import { SendHearingReportModal } from "../emails";

dayjs.extend(relativeTime);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { TextArea } = Input;
const { confirm } = Modal;

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const GRACE_PERIOD_HOURS = 48;

/**
 * Determines the phase and display metadata for a given hearing.
 * Phase controls what fields are editable in the modal.
 *
 * Phases:
 *   "schedule" — hearing is in the future, only scheduling fields editable
 *   "report"   — hearing has passed, within 48h grace, no outcome yet → must file
 *   "edit"     — hearing has passed, within 48h grace, outcome exists → can edit
 *   "locked"   — grace period expired, read-only
 */
const getPhaseInfo = (hearingDate, hasOutcome) => {
  const now = dayjs();
  const hearing = dayjs(hearingDate).startOf("day");
  const gracePeriodEnd = hearing.add(GRACE_PERIOD_HOURS, "hour");

  const isBeforeHearing = now.isBefore(hearing);
  const isWithinGracePeriod =
    now.isSameOrAfter(hearing) && now.isSameOrBefore(gracePeriodEnd);
  const isAfterGracePeriod = now.isAfter(gracePeriodEnd);

  const hoursRemaining = isWithinGracePeriod
    ? gracePeriodEnd.diff(now, "hour")
    : 0;
  const minutesRemaining = isWithinGracePeriod
    ? gracePeriodEnd.diff(now, "minute") % 60
    : 0;

  let phase = "schedule";
  if (isBeforeHearing) {
    phase = "schedule";
  } else if (isWithinGracePeriod) {
    phase = hasOutcome ? "edit" : "report";
  } else {
    phase = "locked";
  }

  let displayStatus = "upcoming";
  if (hasOutcome) displayStatus = "completed";
  else if (hearing.isSame(now, "day")) displayStatus = "today";
  else if (hearing.isAfter(now)) displayStatus = "upcoming";
  else if (isWithinGracePeriod) displayStatus = "pending";
  else displayStatus = "overdue";

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
    // Urgency flags for UI warnings
    isUrgent: isWithinGracePeriod && hoursRemaining < 12,
    isCritical: isWithinGracePeriod && hoursRemaining < 4,
  };
};

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
            <span className="font-semibold text-sm">Scheduling Mode</span>
            <Tag color="blue" className="!m-0">
              Pre-Hearing
            </Tag>
          </div>
        }
        description={
          <span className="text-xs">
            Assign lawyers and configure hearing notice. Outcome and court notes
            become available after the hearing date.
          </span>
        }
      />
    );
  }

  if (phase === "report" || phase === "edit") {
    // Progress shows time CONSUMED (0% = just started, 100% = almost expired)
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
                  : "Report must be filed within 48 hours of hearing date"}
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
          <span className="text-xs">
            The 48-hour grace period ended on{" "}
            <strong>{gracePeriodEnd.format("DD MMM YYYY [at] HH:mm")}</strong>.{" "}
            {hasOutcome
              ? "Report is now read-only."
              : "Contact an administrator to file a late report."}
          </span>
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
          ? "Available after hearing date"
          : "Grace period expired — contact admin"
      }>
      <LockOutlined className="text-slate-400 text-xs ml-1.5" />
    </Tooltip>
  );
});

FieldLockIndicator.displayName = "FieldLockIndicator";

// ─── STATS CARD ─────────────────────────────────────────────────────────────

const StatCard = React.memo(({ label, value, icon, colorClass }) => (
  <div
    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-shadow hover:shadow-md ${colorClass}`}>
    <div className="text-base mb-1">{icon}</div>
    <div className="text-2xl font-black leading-none mb-1">{value}</div>
    <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">
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

  // Prefer Redux-fetched hearings over prop-passed ones
  const hearings = matterHearings.length > 0 ? matterHearings : propsHearings;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingHearing, setEditingHearing] = useState(null);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [modalPhase, setModalPhase] = useState("schedule");
  const [showSendReportModal, setShowSendReportModal] = useState(false);
  const [form] = Form.useForm();

  // Stable string ID to avoid re-renders
  const stableMatterId = useMemo(() => String(matterId || ""), [matterId]);

  // ── Fetch lawyers for the select ──────────────────────────────────────────
  // FIX: Previously `data` was passed directly to the Select as options.
  // useUserSelectOptions returns normalized { value, label } objects in `data`
  // for non-fetchAll calls, but the API response shape can vary.
  // We use `allUsers` which is guaranteed to be a flat normalized array.
  const {
    allUsers: lawyersOptions,
    loading: lawyersLoading,
    error: lawyersError,
  } = useUserSelectOptions({
    type: "lawyers",
    lawyerOnly: true,
    autoFetch: true,
  });

  // Debug: log if no lawyers loaded (remove in production)
  useEffect(() => {
    if (lawyersError) {
      console.warn("[HearingTimeline] Failed to load lawyers:", lawyersError);
    }
  }, [lawyersError]);

  // ── Fetch hearings on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!stableMatterId) return;
    dispatch(fetchMatterHearings(stableMatterId));
    return () => {
      dispatch(clearMatterHearings());
    };
  }, [dispatch, stableMatterId]);

  // ── Sorted hearings with phase metadata ───────────────────────────────────
  const sortedHearingsWithPhase = useMemo(
    () =>
      [...hearings]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((h) => ({
          ...h,
          phaseInfo: getPhaseInfo(h.date, !!h.outcome),
        })),
    [hearings],
  );

  // ── Next upcoming hearing (from nextHearingDate fields) ───────────────────
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

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const acc = {
      today: 0,
      upcoming: 0,
      pending: 0,
      completed: 0,
      overdue: 0,
    };
    for (const h of sortedHearingsWithPhase) {
      const s = h.phaseInfo.displayStatus;
      if (s in acc) acc[s]++;
    }
    return { total: hearings.length, ...acc };
  }, [sortedHearingsWithPhase, hearings.length]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddHearing = useCallback(() => {
    setEditingHearing(null);
    setSelectedOutcome(null);
    setModalPhase("schedule");
    form.resetFields();
    setIsModalVisible(true);
  }, [form]);

  const handleEditHearing = useCallback(
    (hearing) => {
      const phaseInfo = getPhaseInfo(hearing.date, !!hearing.outcome);

      // Build form values: always include scheduling fields
      const formValues = {
        date: dayjs(hearing.date),
        purpose: hearing.purpose,
        hearingNoticeRequired: hearing.hearingNoticeRequired ?? false,
        // FIX: Normalize lawyerPresent — can be array of objects or plain IDs
        lawyerPresent: (hearing.lawyerPresent ?? []).map((l) =>
          typeof l === "object" ? l._id || l.id : l,
        ),
        nextHearingDate: hearing.nextHearingDate
          ? dayjs(hearing.nextHearingDate)
          : null,
      };

      // Pre-fill report fields if an outcome already exists
      if (hearing.outcome) {
        formValues.outcome = hearing.outcome;
        formValues.notes = hearing.notes ?? "";
      }

      form.setFieldsValue(formValues);
      setSelectedOutcome(hearing.outcome ?? null);
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
          "This hearing and its calendar event will be permanently removed. Continue?",
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
      const hearingData = {
        ...values,
        date: values.date.toISOString(),
        nextHearingDate: values.nextHearingDate?.toISOString() ?? null,
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
    form.resetFields();
  }, [form]);

  const requiresAdjournedDate = selectedOutcome === REQUIRES_ADJOURNED_DATE;

  // Phase info for the hearing currently being edited
  const currentPhaseInfo = useMemo(
    () =>
      editingHearing
        ? getPhaseInfo(editingHearing.date, !!editingHearing.outcome)
        : null,
    [editingHearing],
  );

  const isModalLocked = modalPhase === "locked";

  // ── STAT CARDS CONFIG ─────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── STATS ROW ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-3">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* ── NEXT HEARING ALERT ─────────────────────────────────────── */}
      {nextHearing && (
        <HearingHeader
          nextHearing={nextHearing}
          onAssignLawyers={handleEditHearing}
        />
      )}

      {/* ── TIMELINE CARD ──────────────────────────────────────────── */}
      <Card
        title={
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-200">
                <HistoryOutlined className="text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 leading-none mb-0.5">
                  Hearings Timeline
                </h4>
                <p className="text-xs text-slate-400 font-medium">
                  {hearings.length} hearing{hearings.length !== 1 ? "s" : ""}{" "}
                  recorded
                </p>
              </div>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddHearing}
              className="bg-violet-600 hover:bg-violet-700 border-violet-600 font-semibold shadow"
              size="middle">
              Add Hearing
            </Button>
          </div>
        }
        bordered={false}
        className="rounded-2xl shadow-sm border border-slate-100">
        {sortedHearingsWithPhase.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="py-10 text-center">
                <p className="text-4xl mb-3">⚖️</p>
                <p className="text-slate-700 font-semibold text-sm mb-1">
                  No hearings recorded
                </p>
                <p className="text-slate-400 text-xs mb-5">
                  Start tracking court hearings to manage your litigation
                  workflow
                </p>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddHearing}
                  className="bg-violet-600 hover:bg-violet-700 border-violet-600">
                  Add First Hearing
                </Button>
              </div>
            }
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {sortedHearingsWithPhase.map((hearing) => (
              <HearingTimelineItem
                key={hearing._id}
                hearing={hearing}
                onEdit={handleEditHearing}
                onDelete={handleDeleteHearing}
              />
            ))}
          </div>
        )}
      </Card>

      {/* ── ADD / EDIT MODAL ───────────────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                editingHearing
                  ? "bg-blue-100 text-blue-600"
                  : "bg-violet-100 text-violet-600"
              }`}>
              {editingHearing ? <EditOutlined /> : <PlusOutlined />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-none mb-0.5">
                {editingHearing ? "Edit Hearing" : "Add New Hearing"}
              </p>
              {editingHearing && currentPhaseInfo && (
                <p className="text-[11px] font-medium text-slate-400">
                  {
                    {
                      schedule: "Scheduling Mode",
                      report: "Filing Mode — report required",
                      edit: "Editing Mode",
                      locked: "View Only — grace period expired",
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
        width={680}
        destroyOnClose
        className="hearing-modal">
        {/* Phase Banner (edit mode only) */}
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
          {/* ── SCHEDULING SECTION ─────────────────────────────────── */}
          <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <CalendarOutlined className="text-slate-500 text-xs" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Hearing Details
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Form.Item
                name="date"
                label="Hearing Date & Time"
                className="col-span-2"
                rules={[
                  { required: true, message: "Please select hearing date" },
                ]}>
                <DatePicker
                  showTime
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY HH:mm"
                  // Date is locked when editing — immutable record
                  disabled={!!editingHearing}
                  className="rounded-lg"
                  size="large"
                />
              </Form.Item>

              <Form.Item name="purpose" label="Purpose">
                <Select
                  placeholder="Select purpose"
                  options={PURPOSE_OPTIONS}
                  allowClear
                  size="large"
                  disabled={isModalLocked}
                />
              </Form.Item>

              {/* ── LAWYERS SELECT ─────────────────────────────────────────
                  FIX: Use `allUsers` from hook (guaranteed flat normalized array).
                  The Select `options` prop expects [{ value, label }] which is
                  exactly what `allUsers` contains after normalization.
                  FIX: Added `optionFilterProp="label"` so search works correctly.
                  FIX: Added `notFoundContent` for clear empty/loading states.
              ── */}
              <Form.Item
                name="lawyerPresent"
                label={
                  <span className="flex items-center gap-1.5">
                    <UserOutlined className="text-xs text-slate-400" />
                    Assign Lawyers
                  </span>
                }>
                <Select
                  mode="multiple"
                  placeholder={
                    lawyersLoading
                      ? "Loading lawyers…"
                      : lawyersOptions.length === 0
                        ? "No lawyers found"
                        : "Select lawyers to assign"
                  }
                  options={lawyersOptions}
                  loading={lawyersLoading}
                  disabled={isModalLocked}
                  showSearch
                  // FIX: filter by label (name), not by value (_id)
                  optionFilterProp="label"
                  size="large"
                  maxTagCount="responsive"
                  notFoundContent={
                    lawyersLoading ? (
                      <Spin size="small" />
                    ) : lawyersError ? (
                      <span className="text-xs text-red-500 px-2">
                        Failed to load lawyers
                      </span>
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
              <Checkbox disabled={isModalLocked}>
                <span className="flex items-center gap-2 text-sm">
                  <BellOutlined className="text-amber-500" />
                  <span className="font-medium">
                    Ensure Hearing Notice is Served
                  </span>
                </span>
              </Checkbox>
            </Form.Item>

            {/* Next Hearing Date — available in scheduling + report phases */}
            {!requiresAdjournedDate && (
              <Form.Item
                name="nextHearingDate"
                label="Next Hearing Date"
                tooltip="Set the date of the next court session (optional unless outcome is Adjourned)">
                <DatePicker
                  showTime
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Select next hearing date (optional)"
                  className="rounded-lg"
                  size="large"
                  disabled={isModalLocked}
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
                />
              </Form.Item>
            )}
          </div>

          {/* ── COURT REPORT SECTION (post-hearing) ────────────────── */}
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
                className={`rounded-xl p-4 border-2 ${
                  isModalLocked
                    ? "bg-slate-50 border-slate-200"
                    : "bg-blue-50 border-blue-200"
                }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileTextOutlined
                      className={
                        isModalLocked ? "text-slate-400" : "text-blue-600"
                      }
                    />
                    <span
                      className={`text-xs font-bold uppercase tracking-widest ${
                        isModalLocked ? "text-slate-400" : "text-blue-700"
                      }`}>
                      Outcome & Notes
                    </span>
                  </div>
                  {isModalLocked && (
                    <Tag color="default" icon={<LockOutlined />}>
                      Read Only
                    </Tag>
                  )}
                </div>

                <Form.Item
                  name="outcome"
                  label={
                    <span className="flex items-center gap-1">
                      Outcome
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
                    disabled={isModalLocked}
                    allowClear
                  />
                </Form.Item>

                {/* Adjourned-to date — shown inline in report section */}
                {requiresAdjournedDate && (
                  <Form.Item
                    name="nextHearingDate"
                    label="Adjourned To"
                    rules={[
                      {
                        required: true,
                        message:
                          "Next hearing date is required for adjourned outcome",
                      },
                    ]}>
                    <DatePicker
                      showTime
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY HH:mm"
                      placeholder="Select adjournment date"
                      className="rounded-lg"
                      size="large"
                      disabled={isModalLocked}
                      disabledDate={(current) =>
                        current && current < dayjs().startOf("day")
                      }
                    />
                  </Form.Item>
                )}

                <Form.Item
                  name="notes"
                  label={
                    <span className="flex items-center gap-1">
                      Court Notes
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
                    disabled={isModalLocked}
                    maxLength={10000}
                    showCount
                  />
                </Form.Item>
              </div>
            </>
          )}

          {/* ── FOOTER ACTIONS ─────────────────────────────────────── */}
          <div className="flex items-center justify-between mt-6">
            {/* Send to Client — only when editing an existing hearing with outcome */}
            <div>
              {editingHearing?.outcome && (
                <Button
                  type="default"
                  icon={<MailOutlined />}
                  onClick={() => setShowSendReportModal(true)}
                  className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400">
                  Send to Client
                </Button>
              )}
            </div>

            <Space size="small">
              <Button onClick={handleModalClose} size="large">
                Cancel
              </Button>
              {!isModalLocked && (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  icon={
                    modalPhase === "report" ? (
                      <FileTextOutlined />
                    ) : (
                      <CheckCircleOutlined />
                    )
                  }
                  className={`font-semibold ${
                    modalPhase === "report" || modalPhase === "edit"
                      ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                      : "bg-violet-600 hover:bg-violet-700 border-violet-600"
                  }`}>
                  {editingHearing
                    ? modalPhase === "report"
                      ? "File Report"
                      : modalPhase === "edit"
                        ? "Update Report"
                        : "Update Hearing"
                    : "Add Hearing"}
                </Button>
              )}
            </Space>
          </div>
        </Form>
      </Modal>

      {/* ── SEND REPORT MODAL ──────────────────────────────────────── */}
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
