import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Card,
  Timeline,
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

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const GRACE_PERIOD_HOURS = 48;

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

  // Determine phase
  let phase = "schedule"; // default
  if (isBeforeHearing) {
    phase = "schedule";
  } else if (isWithinGracePeriod) {
    phase = hasOutcome ? "edit" : "report";
  } else {
    phase = "locked";
  }

  // Determine display status for timeline
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

// ═══════════════════════════════════════════════════════════════════════════
// PHASE BANNER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const PhaseBanner = ({ phaseInfo, hasOutcome }) => {
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
            <span className="font-semibold">Scheduling Mode</span>
            <Tag color="blue" className="!m-0">
              Pre-Hearing
            </Tag>
          </div>
        }
        description={
          <div className="text-xs mt-1">
            You can assign lawyers and set hearing notice requirements. Outcome
            and court notes will be filed after the hearing date.
          </div>
        }
      />
    );
  }

  if (phase === "report" || phase === "edit") {
    const progressPercent = Math.max(
      0,
      Math.min(
        100,
        ((GRACE_PERIOD_HOURS - hoursRemaining) / GRACE_PERIOD_HOURS) * 100,
      ),
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
            <span className="font-semibold">
              {phase === "edit" ? "Edit Report Window" : "File Hearing Report"}
            </span>
            <div className="flex items-center gap-2">
              <ClockCircleOutlined className="text-xs" />
              <span className="font-mono text-xs font-bold">
                {hoursRemaining}h {minutesRemaining}m
              </span>
            </div>
          </div>
        }
        description={
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs">
              <span>
                {phase === "edit"
                  ? "Report can be edited until grace period ends"
                  : "Report must be filed within 48 hours of hearing date"}
              </span>
              <span className="font-medium">
                {gracePeriodEnd.format("DD MMM, HH:mm")}
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
              <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded p-2 mt-2">
                <WarningOutlined className="mt-0.5" />
                <span className="font-medium">
                  Critical: Less than 4 hours remaining! File report immediately
                  to avoid administrative escalation.
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
            <span className="font-semibold">Report Window Closed</span>
            <Tag color="red" className="!m-0">
              Grace Period Expired
            </Tag>
          </div>
        }
        description={
          <div className="text-xs mt-1">
            The 48-hour grace period ended on{" "}
            <span className="font-semibold">
              {gracePeriodEnd.format("DD MMM YYYY [at] HH:mm")}
            </span>
            . t
            {hasOutcome
              ? "Report is now read-only."
              : "Please contact an administrator to file a late report."}
          </div>
        }
      />
    );
  }

  return null;
};

// ═══════════════════════════════════════════════════════════════════════════
// FIELD LOCK INDICATOR
// ═══════════════════════════════════════════════════════════════════════════

const FieldLockIndicator = ({ phase, fieldType }) => {
  const isReportField = ["outcome", "notes"].includes(fieldType);
  const isLocked =
    (isReportField && phase === "schedule") || phase === "locked";

  if (!isLocked) return null;

  return (
    <Tooltip
      title={
        phase === "schedule"
          ? "Available after hearing date"
          : "Grace period expired - contact admin"
      }>
      <LockOutlined className="text-slate-400 text-xs ml-2" />
    </Tooltip>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const HearingTimeline = ({
  matterId,
  hearings: propsHearings = [],
  matterDetails = null,
}) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectActionLoading);
  const matterHearings = useSelector(selectMatterHearings);

  const hearings = matterHearings.length > 0 ? matterHearings : propsHearings;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingHearing, setEditingHearing] = useState(null);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [modalPhase, setModalPhase] = useState("schedule");
  const [form] = Form.useForm();
  const [showSendReportModal, setShowSendReportModal] = useState(false);

  const { data: lawyersOptions, loading: lawyersLoading } =
    useUserSelectOptions({
      type: "lawyers",
      lawyerOnly: true,
      autoFetch: true,
    });

  const stableMatterId = String(matterId || "");

  useEffect(() => {
    if (!stableMatterId) return;

    dispatch(fetchMatterHearings(stableMatterId));

    return () => {
      dispatch(clearMatterHearings());
    };
  }, [dispatch, stableMatterId]);

  // ═══ SORTED HEARINGS WITH PHASE INFO ═══════════════════════════════════
  const sortedHearingsWithPhase = useMemo(() => {
    return [...hearings]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((h) => ({
        ...h,
        phaseInfo: getPhaseInfo(h.date, h.outcome),
      }));
  }, [hearings]);

  // ═══ NEXT HEARING ═══════════════════════════════════════════════════════
  const nextHearing = useMemo(() => {
    const now = new Date();
    return [...hearings]
      .filter((h) => h.nextHearingDate && new Date(h.nextHearingDate).getTime())
      .sort((a, b) => new Date(a.nextHearingDate) - new Date(b.nextHearingDate))
      .find((h) => new Date(h.nextHearingDate) > now);
  }, [hearings]);

  // ═══ STATISTICS ═════════════════════════════════════════════════════════
  const stats = useMemo(() => {
    const categorized = {
      today: 0,
      upcoming: 0,
      pending: 0,
      completed: 0,
      overdue: 0,
    };

    sortedHearingsWithPhase.forEach((h) => {
      categorized[h.phaseInfo.displayStatus] =
        (categorized[h.phaseInfo.displayStatus] || 0) + 1;
    });

    return {
      total: hearings.length,
      ...categorized,
    };
  }, [sortedHearingsWithPhase, hearings.length]);

  // ═══ HANDLERS ═══════════════════════════════════════════════════════════

  const handleAddHearing = useCallback(() => {
    setEditingHearing(null);
    setSelectedOutcome(null);
    setModalPhase("schedule");
    form.resetFields();
    setIsModalVisible(true);
  }, [form]);

  const handleEditHearing = useCallback(
    (hearing) => {
      const phaseInfo = getPhaseInfo(hearing.date, hearing.outcome);

      // Determine what fields to pre-fill based on phase
      const baseValues = {
        date: dayjs(hearing.date),
        purpose: hearing.purpose,
        hearingNoticeRequired: hearing.hearingNoticeRequired || false,
        lawyerPresent: hearing.lawyerPresent?.map((l) => l._id || l) || [],
      };

      // Always include nextHearingDate if it exists (for schedule phase editing)
      const nextHearingValues = hearing.nextHearingDate
        ? {
            nextHearingDate: dayjs(hearing.nextHearingDate),
          }
        : {};

      // Pre-fill report fields if outcome exists (always show existing data)
      const reportValues = hearing.outcome
        ? {
            outcome: hearing.outcome,
            notes: hearing.notes,
            nextHearingDate: hearing.nextHearingDate
              ? dayjs(hearing.nextHearingDate)
              : null,
          }
        : {};

      form.setFieldsValue({
        ...baseValues,
        ...nextHearingValues,
        ...reportValues,
      });
      setSelectedOutcome(hearing.outcome);
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
          "Are you sure you want to delete this hearing? This will also remove the calendar event.",
        okText: "Delete",
        okType: "danger",
        onOk: async () => {
          try {
            await dispatch(
              deleteHearing({ matterId: stableMatterId, hearingId }),
            ).unwrap();
            message.success("Hearing deleted successfully");
            // Refresh calendar to reflect the deletion
            dispatch(getAllEvents({}));
          } catch (error) {
            message.error(error?.message || "Failed to delete hearing");
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
        nextHearingDate: values.nextHearingDate?.toISOString() || null,
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
          message.success("Hearing updated successfully");
        } else {
          await dispatch(
            addHearing({ matterId: stableMatterId, hearingData }),
          ).unwrap();
          message.success("Hearing added and synced to calendar");
        }

        // Refresh calendar to show the synced event
        dispatch(getAllEvents({}));

        setIsModalVisible(false);
        setEditingHearing(null);
        setSelectedOutcome(null);
        form.resetFields();
      } catch (error) {
        console.error("Hearing operation error:", error);
        message.error(error?.message || "Operation failed");
      }
    },
    [dispatch, stableMatterId, editingHearing, form],
  );

  const requiresAdjournedDate = selectedOutcome === REQUIRES_ADJOURNED_DATE;

  const handleModalClose = useCallback(() => {
    setIsModalVisible(false);
    setEditingHearing(null);
    setSelectedOutcome(null);
    form.resetFields();
  }, [form]);

  // Compute current phase info for editing hearing
  const currentPhaseInfo = editingHearing
    ? getPhaseInfo(editingHearing.date, editingHearing.outcome)
    : null;

  return (
    <div className="space-y-6">
      {/* ═══ STATS CARDS ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: <HistoryOutlined />,
            color: "bg-slate-100 text-slate-700 border-slate-200",
          },
          {
            label: "Today",
            value: stats.today,
            icon: <ThunderboltOutlined />,
            color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          },
          {
            label: "Upcoming",
            value: stats.upcoming,
            icon: <CalendarOutlined />,
            color: "bg-blue-50 text-blue-700 border-blue-200",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: <ExclamationCircleOutlined />,
            color: "bg-amber-50 text-amber-700 border-amber-200",
          },
          {
            label: "Completed",
            value: stats.completed,
            icon: <CheckCircleOutlined />,
            color: "bg-purple-50 text-purple-700 border-purple-200",
          },
        ].map((stat, idx) => (
          <Card
            key={idx}
            size="small"
            className={`text-center border-2 rounded-xl ${stat.color} hover:shadow-md transition-all`}
            bordered
            bodyStyle={{ padding: "16px 12px" }}>
            <div className="text-base mb-2">{stat.icon}</div>
            <div className="text-2xl font-black mb-1">{stat.value}</div>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-75">
              {stat.label}
            </div>
          </Card>
        ))}
      </div>

      {/* ═══ NEXT HEARING ALERT ═══════════════════════════════════ */}
      {nextHearing && <HearingHeader nextHearing={nextHearing} />}

      {/* ═══ TIMELINE CARD ═════════════════════════════════════════ */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
                <HistoryOutlined className="text-white text-lg" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 leading-none mb-1">
                  Hearings Timeline
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {hearings.length} hearing
                  {hearings.length !== 1 ? "s" : ""} recorded
                </p>
              </div>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddHearing}
              className="bg-purple-600 hover:bg-purple-700 border-purple-600 font-semibold shadow-md"
              size="large">
              Add Hearing
            </Button>
          </div>
        }
        bordered={false}
        className="rounded-2xl shadow-sm border-2 border-slate-100">
        {sortedHearingsWithPhase.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="py-12">
                <div className="text-5xl mb-4">⚖️</div>
                <p className="text-slate-700 font-semibold text-base mb-2">
                  No hearings recorded
                </p>
                <p className="text-slate-400 text-sm mb-6">
                  Start tracking court hearings to manage your litigation
                  workflow
                </p>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddHearing}
                  className="bg-purple-600 hover:bg-purple-700 border-purple-600"
                  size="large">
                  Add First Hearing
                </Button>
              </div>
            }
          />
        ) : (
          <div>
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

      {/* ═══ ADD/EDIT MODAL ═════════════════════════════════════════ */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                editingHearing
                  ? "bg-blue-100 text-blue-600"
                  : "bg-purple-100 text-purple-600"
              }`}>
              {editingHearing ? <EditOutlined /> : <PlusOutlined />}
            </div>
            <div>
              <span className="text-base font-bold text-slate-800">
                {editingHearing ? "Edit Hearing" : "Add New Hearing"}
              </span>
              {editingHearing && currentPhaseInfo && (
                <div className="text-xs font-medium text-slate-500 mt-0.5">
                  {currentPhaseInfo.phase === "schedule" && "Scheduling Mode"}
                  {currentPhaseInfo.phase === "report" && "Filing Mode"}
                  {currentPhaseInfo.phase === "edit" && "Editing Mode"}
                  {currentPhaseInfo.phase === "locked" && "View Only"}
                </div>
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
        {/* Phase Banner */}
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
          className="mt-4"
          requiredMark={false}>
          {/* ═══ ALWAYS VISIBLE FIELDS ═══════════════════════════ */}
          <div className="bg-slate-50 rounded-xl p-4 mb-4 border-2 border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <CalendarOutlined className="text-slate-600" />
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Hearing Details
              </span>
            </div>

            <Form.Item
              name="date"
              label="Hearing Date & Time"
              rules={[
                { required: true, message: "Please select hearing date" },
              ]}>
              <DatePicker
                showTime
                style={{ width: "100%" }}
                format="DD/MM/YYYY HH:mm"
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
                className="rounded-lg"
                disabled={modalPhase === "locked"}
              />
            </Form.Item>

            <Form.Item name="lawyerPresent" label="Lawyers Assigned">
              <Select
                mode="multiple"
                placeholder="Select lawyers"
                options={lawyersOptions}
                loading={lawyersLoading}
                showSearch
                size="large"
                disabled={modalPhase === "locked"}
              />
            </Form.Item>

            <Form.Item name="hearingNoticeRequired" valuePropName="checked">
              <Checkbox disabled={modalPhase === "locked"}>
                <span className="flex items-center gap-2">
                  <BellOutlined className="text-amber-500" />
                  <span className="font-medium">
                    Ensure Hearing Notice is Served
                  </span>
                </span>
              </Checkbox>
            </Form.Item>

            {/* Next Hearing Date - Available for schedule and report phases */}
            {(modalPhase === "schedule" || modalPhase === "report" || modalPhase === "edit") && !requiresAdjournedDate && (
              <Form.Item
                name="nextHearingDate"
                label={
                  <span className="flex items-center gap-2">
                    <CalendarOutlined className="text-blue-500" />
                    <span>Next Hearing Date</span>
                  </span>
                }
                tooltip="Set or update the next hearing date (for future court sessions)">
                <DatePicker
                  showTime
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Select next hearing date"
                  className="rounded-lg"
                  size="large"
                  disabled={modalPhase === "locked"}
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
                />
              </Form.Item>
            )}
          </div>

          <Divider className="!my-5" />

          {/* ═══ REPORT FIELDS (CONDITIONAL) ═════════════════════ */}
          {(modalPhase === "report" ||
            modalPhase === "edit" ||
            modalPhase === "locked") && (
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <FileTextOutlined className="text-blue-600" />
                <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                  Court Report
                </span>
                {modalPhase === "locked" && (
                  <Tag color="red" className="!m-0 !ml-auto">
                    Read Only
                  </Tag>
                )}
              </div>

              <Form.Item
                name="outcome"
                label={
                  <span className="flex items-center">
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
                  disabled={modalPhase === "locked"}
                />
              </Form.Item>

              {requiresAdjournedDate && (
                <Form.Item
                  name="nextHearingDate"
                  label="Adjourned To"
                  rules={[
                    {
                      required: true,
                      message:
                        "Next hearing date required for adjourned outcome",
                    },
                  ]}>
                  <DatePicker
                    showTime
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY HH:mm"
                    placeholder="Select next hearing date"
                    className="rounded-lg"
                    size="large"
                    disabled={modalPhase === "locked"}
                    disabledDate={(current) =>
                      current && current < dayjs().startOf("day")
                    }
                  />
                </Form.Item>
              )}

              <Form.Item
                name="notes"
                label={
                  <span className="flex items-center">
                    Court Notes
                    <FieldLockIndicator phase={modalPhase} fieldType="notes" />
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
                  placeholder="Detailed summary of what transpired in court..."
                  className="rounded-lg"
                  disabled={modalPhase === "locked"}
                  maxLength={10000}
                  showCount
                />
              </Form.Item>
            </div>
          )}

          {/* ═══ FOOTER ACTIONS ═══════════════════════════════════ */}
          <Form.Item className="!mb-0 !mt-6">
            <Space className="w-full justify-end" size="middle">
              <Button onClick={handleModalClose} size="large">
                Cancel
              </Button>
              {modalPhase !== "locked" && (
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
                      : "bg-purple-600 hover:bg-purple-700 border-purple-600"
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
              {/* Send to Client Button - Show when hearing has outcome */}
              {editingHearing?.outcome && (
                <Button
                  type="default"
                  size="large"
                  icon={<MailOutlined />}
                  onClick={() => setShowSendReportModal(true)}
                  className="border-indigo-300 text-indigo-600 hover:bg-indigo-50">
                  Send to Client
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Send Hearing Report Modal */}
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
