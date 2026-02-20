import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Empty,
  Button,
  Avatar,
  Tooltip,
  Spin,
  DatePicker,
  message,
  Alert,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  BankOutlined,
  RightOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  EditOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  fetchUpcomingHearings,
  selectUpcomingHearings,
  selectHearingsStats,
  selectLitigationLoading,
  selectLitigationError,
  addHearing,
  updateHearing,
} from "../../redux/features/litigation/litigationSlice";
import useUserSelectOptions from "../../hooks/useUserSelectOptions";
import { formatName } from "../../utils/formatters";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(relativeTime);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { TextArea } = Input;

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const VIEW = {
  ALL: "all",
  TODAY_REPORTS: "today_reports",
  URGENT: "urgent",
};

const OUTCOME_OPTIONS = [
  { value: "adjourned", label: "Adjourned" },
  { value: "part_heard", label: "Part Heard" },
  { value: "judgment_reserved", label: "Judgment Reserved" },
  { value: "struck_out", label: "Struck Out" },
  { value: "settled", label: "Settled" },
  { value: "dismissed", label: "Dismissed" },
  { value: "decided", label: "Decided" },
  { value: "mention_only", label: "Mention Only" },
  { value: "hearing_of_witness", label: "Hearing of Witness" },
  { value: "cross_examination", label: "Cross Examination" },
  { value: "no_sitting", label: "No Sitting" },
  { value: "other", label: "Other" },
];

const REQUIRES_ADJOURNED_DATE = "adjourned";
const ITEMS_PER_PAGE = 5;
const VIRTUALIZATION_THRESHOLD = 20;

// ─── UTILITIES ────────────────────────────────────────────────────────────────

const formatDisplayDate = (date) => dayjs(date).format("ddd, DD MMM YYYY");
const formatTime = (date) => dayjs(date).format("HH:mm");

const getRelative = (date) => {
  const diff = dayjs(date).diff(dayjs(), "day");
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  if (diff < 7) return `In ${diff} days`;
  return dayjs(date).from(dayjs());
};

const getEditPermissions = (hearing) => {
  if (!hearing) return { canEditOutcome: false, canEditNotes: false };
  const now = dayjs().startOf("day");
  const hearingDate = dayjs(hearing.date).startOf("day");
  if (hearingDate.isSame(now)) {
    return { canEditOutcome: true, canEditNotes: true, isToday: true };
  } else if (hearingDate.isAfter(now)) {
    return { canEditOutcome: false, canEditNotes: false, isFuture: true };
  }
  return { canEditOutcome: true, canEditNotes: true, isPast: true };
};

const buildLawyerList = (hearing) => {
  if (!hearing) return [];
  const map = new Map();
  hearing.matter?.accountOfficer?.forEach((o) => {
    if (o?._id) map.set(o._id, { ...o, role: "Account Officer" });
  });
  hearing.lawyerPresent?.forEach((l) => {
    if (l?._id && !map.has(l._id))
      map.set(l._id, { ...l, role: "Appearing Lawyer" });
  });
  return Array.from(map.values());
};

// ─── VIRTUALIZED LIST ────────────────────────────────────────────────────────

const VirtualizedList = ({ items, renderItem, height = 400 }) => {
  const [startIndex, setStartIndex] = useState(0);
  const containerRef = useRef(null);
  const itemHeight = 72;
  const visibleCount = Math.ceil(height / itemHeight) + 2;

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const newStartIndex = Math.floor(
      containerRef.current.scrollTop / itemHeight,
    );
    setStartIndex(Math.max(0, newStartIndex));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const visibleItems = items.slice(startIndex, startIndex + visibleCount);
  const paddingTop = startIndex * itemHeight;
  const paddingBottom = Math.max(
    0,
    (items.length - (startIndex + visibleCount)) * itemHeight,
  );

  return (
    <div ref={containerRef} style={{ height, overflow: "auto" }}>
      <div style={{ paddingTop, paddingBottom }}>
        {visibleItems.map((item, index) => (
          <div key={item._id || index} style={{ height: itemHeight }}>
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── SIMPLE HEARING CARD ─────────────────────────────────────────────────────

const SimpleHearingCard = React.memo(({ hearing, onClick }) => {
  const displayDate = hearing.nextHearingDate || hearing.date;

  const caseTitle = useMemo(
    () =>
      hearing.matter?.title ||
      `${hearing.firstParty?.name?.[0]?.name ?? "—"} v. ${
        hearing.secondParty?.name?.[0]?.name ?? "—"
      }`,
    [hearing],
  );

  return (
    <button
      onClick={() => onClick(hearing)}
      className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-gray-100
                 hover:border-gray-200 hover:bg-gray-50 transition-all group
                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1">
      <div
        className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50
                      flex flex-col items-center justify-center flex-shrink-0
                      group-hover:from-gray-200 group-hover:to-gray-100 transition-all">
        <span className="text-sm font-bold text-gray-700 leading-none">
          {dayjs(displayDate).format("D")}
        </span>
        <span className="text-[8px] font-semibold uppercase text-gray-500">
          {dayjs(displayDate).format("MMM")}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {caseTitle}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <ClockCircleOutlined className="text-[10px]" />
            {formatTime(displayDate)}
          </span>
          <span>•</span>
          <span className="truncate">{hearing.courtName || "Court"}</span>
        </div>
      </div>
      <div className="text-xs font-medium text-gray-400 whitespace-nowrap">
        {getRelative(displayDate)}
      </div>
    </button>
  );
});
SimpleHearingCard.displayName = "SimpleHearingCard";

// ─── DETAILED HEARING CARD ───────────────────────────────────────────────────

const DetailedHearingCard = React.memo(({ hearing, onClick }) => {
  const hasReport = !!hearing.outcome;

  const lawyers = useMemo(() => buildLawyerList(hearing), [hearing]);

  const caseTitle = useMemo(
    () =>
      hearing.matter?.title ||
      `${hearing.firstParty?.name?.[0]?.name ?? "—"} v. ${
        hearing.secondParty?.name?.[0]?.name ?? "—"
      }`,
    [hearing],
  );

  const displayDate = hearing.nextHearingDate || hearing.date;

  return (
    <button
      onClick={() => onClick(hearing)}
      className="w-full text-left relative flex gap-3 p-4 rounded-2xl border
                 transition-all duration-200 group
                 hover:shadow-md hover:-translate-y-0.5
                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                 bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200">
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-blue-500" />

      <div
        className="flex-shrink-0 w-11 h-11 rounded-xl flex flex-col items-center
                      justify-center ml-2 bg-blue-500 text-white">
        <span className="text-base font-black leading-none">
          {dayjs(displayDate).format("D")}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-wider opacity-75">
          {dayjs(displayDate).format("MMM")}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-1">
            {caseTitle}
          </p>
          {hasReport && (
            <Tooltip title="Report filed">
              <CheckCircleOutlined className="text-emerald-500 text-xs flex-shrink-0" />
            </Tooltip>
          )}
        </div>

        <p className="text-[11px] font-mono text-gray-400 mb-2 truncate">
          {hearing.suitNo || hearing.matter?.matterNumber || "–"}
        </p>

        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500 mb-2">
          <span className="flex items-center gap-1">
            <BankOutlined className="text-[10px] text-gray-400" />
            <span className="capitalize font-medium">
              {hearing.courtName?.replace(/(^\w|\s\w)/g, (m) =>
                m.toUpperCase(),
              )}
              {hearing.courtNo ? ` · Court ${hearing.courtNo}` : ""}
            </span>
          </span>
          {hearing.courtLocation && (
            <span className="flex items-center gap-1 text-gray-400">
              <EnvironmentOutlined className="text-[10px]" />
              {hearing.courtLocation}
            </span>
          )}
        </div>

        {hearing.outcome && (
          <div className="mb-2">
            <Tag color="green" className="!text-[10px] !px-2 !py-0.5">
              {hearing.outcome.replace(/_/g, " ")}
            </Tag>
          </div>
        )}

        {lawyers.length > 0 ? (
          <div className="flex items-center gap-2">
            <Avatar.Group
              maxCount={3}
              size={18}
              maxStyle={{
                backgroundColor: "#ede9fe",
                color: "#6d28d9",
                fontSize: "9px",
              }}>
              {lawyers.map((l) => (
                <Tooltip
                  key={l._id}
                  title={`${formatName(l.firstName, l.lastName)} · ${l.role}`}>
                  <Avatar
                    size={18}
                    src={l.photo}
                    style={{
                      backgroundColor: "#ede9fe",
                      color: "#6d28d9",
                      fontSize: "9px",
                    }}>
                    {l.firstName?.[0]}
                    {l.lastName?.[0]}
                  </Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
            <span className="text-[10px] text-gray-500 truncate">
              {lawyers.length === 1
                ? `${formatName(lawyers[0].firstName, lawyers[0].lastName)} · ${lawyers[0].role}`
                : `${lawyers.length} lawyers assigned`}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <WarningOutlined className="text-amber-400 text-[10px]" />
            <span className="text-[10px] text-amber-600 font-semibold">
              No lawyers assigned
            </span>
          </div>
        )}
      </div>
    </button>
  );
});
DetailedHearingCard.displayName = "DetailedHearingCard";

// ─── STAT PILL ────────────────────────────────────────────────────────────────

const StatPill = React.memo(
  ({ icon, label, value, colorKey, active, onClick }) => {
    const colors =
      {
        blue: {
          ring: "ring-blue-400",
          text: "text-blue-600",
          bg: "bg-blue-50",
          activeBg: "bg-blue-600 text-white",
        },
        amber: {
          ring: "ring-amber-400",
          text: "text-amber-600",
          bg: "bg-amber-50",
          activeBg: "bg-amber-500 text-white",
        },
        violet: {
          ring: "ring-violet-400",
          text: "text-violet-600",
          bg: "bg-violet-50",
          activeBg: "bg-violet-600 text-white",
        },
        slate: {
          ring: "ring-slate-300",
          text: "text-slate-600",
          bg: "bg-slate-50",
          activeBg: "bg-slate-600 text-white",
        },
      }[colorKey] || {};

    return (
      <button
        onClick={onClick}
        className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border-2
        transition-all duration-200 focus:outline-none focus:ring-2 ${colors.ring} focus:ring-offset-1
        ${
          active
            ? `${colors.activeBg} border-transparent shadow`
            : `${colors.bg} border-transparent hover:border-gray-200`
        }`}>
        <div className={`text-sm ${active ? "text-white" : colors.text}`}>
          {icon}
        </div>
        <div
          className={`text-2xl font-black leading-none ${active ? "text-white" : "text-gray-900"}`}>
          {value}
        </div>
        <div
          className={`text-[9px] font-bold uppercase tracking-widest ${active ? "text-white/80" : "text-gray-400"}`}>
          {label}
        </div>
      </button>
    );
  },
);
StatPill.displayName = "StatPill";

// ─── HEARING DETAIL MODAL ────────────────────────────────────────────────────
// FIX: All hooks are now declared unconditionally at the top of the component,
// BEFORE any conditional returns. Previously `useMemo` hooks were called after
// `if (!hearing) return null`, which violated the Rules of Hooks and caused
// "Rendered more hooks than during the previous render" errors whenever the
// modal opened/closed and `hearing` toggled between null and a value.

const HearingDetailModal = React.memo(({ hearing, open, onClose }) => {
  const dispatch = useDispatch();
  const actionLoading = useSelector(
    (s) => s.litigation?.actionLoading ?? false,
  );

  const [activePanel, setActivePanel] = useState("none");
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [reportForm] = Form.useForm();

  const { data: lawyerOptions, loading: lawyersLoading } = useUserSelectOptions(
    {
      type: "lawyers",
      lawyerOnly: true,
      autoFetch: open,
    },
  );

  // ── All useMemo hooks BEFORE any early return ──────────────────────────────
  // They safely return empty/fallback values when hearing is null.

  const lawyers = useMemo(() => buildLawyerList(hearing), [hearing]);

  const caseTitle = useMemo(() => {
    if (!hearing) return "";
    return (
      hearing.matter?.title ||
      `${hearing.firstParty?.name?.[0]?.name ?? "—"} v. ${
        hearing.secondParty?.name?.[0]?.name ?? "—"
      }`
    );
  }, [hearing]);

  const displayDate = useMemo(
    () => hearing?.nextHearingDate || hearing?.date || null,
    [hearing],
  );

  const isToday = useMemo(
    () => (displayDate ? dayjs(displayDate).isSame(dayjs(), "day") : false),
    [displayDate],
  );

  const hasReport = useMemo(() => !!hearing?.outcome, [hearing]);

  const editPerms = useMemo(() => getEditPermissions(hearing), [hearing]);

  const requiresAdjournedDate = selectedOutcome === REQUIRES_ADJOURNED_DATE;

  // Reset state when modal closes or hearing changes
  useEffect(() => {
    if (!open) {
      setActivePanel("none");
      setSelectedOutcome(null);
      reportForm.resetFields();
    }
  }, [open, reportForm]);

  // ── NOW it is safe to return null, because all hooks have already been called
  if (!hearing || !displayDate) return null;

  // Submit report
  const handleReportSubmit = async (values) => {
    if (!editPerms.canEditOutcome) {
      message.error("Cannot edit outcome for future hearings");
      return;
    }
    const hearingData = {
      outcome: values.outcome,
      notes: values.notes || "",
      ...(values.outcome === REQUIRES_ADJOURNED_DATE && values.adjournedDate
        ? { nextHearingDate: values.adjournedDate.toISOString() }
        : {}),
    };
    try {
      await dispatch(
        updateHearing({
          matterId: hearing.matterId,
          hearingId: hearing._id,
          hearingData,
        }),
      ).unwrap();
      message.success("Hearing report filed successfully");
      dispatch(fetchUpcomingHearings({ limit: 50, days: 30 }));
      setActivePanel("none");
      onClose();
    } catch {
      message.error("Failed to file report");
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={580}
      title={null}
      styles={{
        body: { padding: 0 },
        content: {
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
        },
      }}>
      {/* Gradient header */}
      <div
        className={`px-6 pt-6 pb-5 ${
          isToday
            ? "bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500"
            : "bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600"
        }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {isToday && (
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-blue-100 text-[11px] font-bold uppercase tracking-widest">
                  Today's Hearing
                </span>
              </div>
            )}
            <h2 className="text-white font-black text-lg leading-snug truncate">
              {caseTitle}
            </h2>
            <p className="text-white/60 font-mono text-xs mt-1">
              {hearing.suitNo || hearing.matter?.matterNumber || "–"}
            </p>
          </div>
          <div
            className={`flex-shrink-0 flex flex-col items-center justify-center
                        w-14 h-14 rounded-2xl ${isToday ? "bg-white/20" : "bg-white/10"}`}>
            <span className="text-white font-black text-xl leading-none">
              {dayjs(displayDate).format("D")}
            </span>
            <span className="text-white/70 text-[10px] font-bold uppercase tracking-wide">
              {dayjs(displayDate).format("MMM")}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto max-h-[70vh]">
        <div className="px-6 py-5 space-y-4">
          {/* Date & time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <CalendarOutlined className="text-blue-600 text-sm" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                  Date
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {formatDisplayDate(displayDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <ClockCircleOutlined className="text-blue-600 text-sm" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                  Time
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {formatTime(displayDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Court details */}
          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Court Details
              </p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <BankOutlined className="text-violet-500 w-4 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {hearing.courtName?.replace(/(^\w|\s\w)/g, (m) =>
                      m.toUpperCase(),
                    )}
                    {hearing.courtNo ? ` — Court ${hearing.courtNo}` : ""}
                  </p>
                  {hearing.division && (
                    <p className="text-[11px] text-gray-400">
                      {hearing.division} Division
                    </p>
                  )}
                </div>
              </div>
              {(hearing.courtLocation || hearing.state) && (
                <div className="flex items-center gap-3">
                  <EnvironmentOutlined className="text-violet-500 w-4 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    {[hearing.courtLocation, hearing.state]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Lawyers */}
          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Lawyers Appearing
              </p>
            </div>
            <div className="p-4">
              {lawyers.length > 0 ? (
                <div className="space-y-3">
                  {lawyers.map((lawyer) => (
                    <div
                      key={lawyer._id}
                      className="flex items-center gap-3 bg-violet-50/60 border border-violet-100 rounded-xl p-3">
                      <Avatar
                        size={40}
                        src={lawyer.photo}
                        style={{
                          backgroundColor: "#ede9fe",
                          color: "#6d28d9",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}>
                        {lawyer.firstName?.[0]}
                        {lawyer.lastName?.[0]}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">
                          {formatName(lawyer.firstName, lawyer.lastName)}
                        </p>
                        <p className="text-[11px] text-violet-600 font-semibold">
                          {lawyer.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <ExclamationCircleOutlined className="text-amber-500 text-base flex-shrink-0" />
                  <p className="text-sm font-bold text-amber-900">
                    No Lawyers Assigned
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Existing report */}
          {hasReport && (
            <div className="rounded-2xl border border-emerald-200 overflow-hidden">
              <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100 flex items-center gap-2">
                <CheckCircleOutlined className="text-emerald-600 text-xs" />
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                  Hearing Report Filed
                </p>
              </div>
              <div className="p-4 space-y-2">
                {hearing.outcome && (
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
                      Outcome
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {hearing.outcome.replace(/_/g, " ")}
                    </p>
                  </div>
                )}
                {hearing.notes && (
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
                      Notes
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {hearing.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CTA */}
          {activePanel === "none" && (
            <div className="pt-1">
              <button
                onClick={() => {
                  if (editPerms.isFuture) {
                    message.warning("Cannot file report for future hearings");
                  } else {
                    setActivePanel("report");
                  }
                }}
                disabled={editPerms.isFuture && !hasReport}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                           border-2 font-semibold text-sm transition-all ${
                             editPerms.isFuture && !hasReport
                               ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                               : "border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-300"
                           }`}>
                <EditOutlined />
                {hasReport ? "Update Report" : "File Report"}
              </button>
            </div>
          )}

          {/* Report panel */}
          {activePanel === "report" && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 overflow-hidden">
              <div className="bg-blue-100/60 px-4 py-3 border-b border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileTextOutlined className="text-blue-600" />
                  <p className="text-sm font-bold text-blue-900">
                    {hasReport ? "Update Report" : "File Report"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActivePanel("none");
                    reportForm.resetFields();
                  }}
                  className="text-blue-400 hover:text-blue-700 text-xs font-semibold">
                  Cancel
                </button>
              </div>
              <div className="p-4">
                {editPerms.isFuture && (
                  <Alert
                    message="Future Hearing"
                    description="Cannot file report until hearing date arrives"
                    type="warning"
                    showIcon
                    className="mb-4"
                  />
                )}
                <Form
                  form={reportForm}
                  layout="vertical"
                  onFinish={handleReportSubmit}
                  initialValues={{
                    outcome: hearing.outcome,
                    notes: hearing.notes,
                  }}>
                  <Form.Item
                    name="outcome"
                    label="Outcome"
                    rules={[{ required: true, message: "Select an outcome" }]}>
                    <Select
                      placeholder="What was the outcome?"
                      options={OUTCOME_OPTIONS}
                      onChange={setSelectedOutcome}
                      disabled={editPerms.isFuture}
                    />
                  </Form.Item>

                  {requiresAdjournedDate && (
                    <Form.Item
                      name="adjournedDate"
                      label="Adjourned To"
                      rules={[
                        {
                          required: true,
                          message: "Date required for 'Adjourned' outcome",
                        },
                      ]}>
                      <DatePicker
                        showTime
                        style={{ width: "100%" }}
                        format="DD/MM/YYYY HH:mm"
                      />
                    </Form.Item>
                  )}

                  <Form.Item name="notes" label="Court Notes">
                    <TextArea
                      rows={4}
                      placeholder="Summarise what transpired..."
                      disabled={editPerms.isFuture}
                    />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={actionLoading}
                    disabled={editPerms.isFuture}
                    className="w-full !h-10 !rounded-xl !font-bold">
                    {hasReport ? "Update Report" : "Submit Report"}
                  </Button>
                </Form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
});
HearingDetailModal.displayName = "HearingDetailModal";

// ─── HEARING SECTION ──────────────────────────────────────────────────────────

const HearingSection = React.memo(({ title, items, type, onClick }) => {
  const [showAll, setShowAll] = useState(false);
  const displayedItems = showAll ? items : items.slice(0, ITEMS_PER_PAGE);
  const hasMore = items.length > ITEMS_PER_PAGE;

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1 sticky top-0 bg-white/90 backdrop-blur-sm z-10 py-2">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {title}
        </h4>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div className="space-y-2">
        {displayedItems.map((item) =>
          type === "detailed" ? (
            <DetailedHearingCard
              key={item._id}
              hearing={item}
              onClick={onClick}
            />
          ) : (
            <SimpleHearingCard
              key={item._id}
              hearing={item}
              onClick={onClick}
            />
          ),
        )}
      </div>
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-2 text-xs font-semibold text-blue-600
                     hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
          + Show {items.length - ITEMS_PER_PAGE} more
        </button>
      )}
    </div>
  );
});
HearingSection.displayName = "HearingSection";

// ─── MAIN WIDGET ──────────────────────────────────────────────────────────────

const CourtHearingsWidget = ({ limit = 5 }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const hearings = useSelector(selectUpcomingHearings);
  const stats = useSelector(selectHearingsStats);
  const loading = useSelector(selectLitigationLoading);
  const error = useSelector(selectLitigationError);

  const [activeView, setActiveView] = useState(VIEW.ALL);
  const [selectedHearing, setSelectedHearing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchUpcomingHearings({ limit: 50, days: 30 }));
  }, [dispatch]);

  const { todayReports, urgentSimple, upcomingSimple } = useMemo(() => {
    const today = dayjs().startOf("day");
    const threeDays = dayjs().add(3, "day").endOf("day");
    const reports = [],
      urgent = [],
      upcoming = [];

    hearings.forEach((h) => {
      const displayDate = h.nextHearingDate || h.date;
      const d = dayjs(displayDate);
      const hasReport = !!h.outcome;

      if (d.isSame(today, "day")) {
        if (hasReport) reports.push(h);
        else upcoming.push(h);
      } else if (d.isAfter(today) && d.isSameOrBefore(threeDays)) {
        urgent.push(h);
      } else if (d.isAfter(today)) {
        upcoming.push(h);
      }
    });

    return {
      todayReports: reports,
      urgentSimple: urgent,
      upcomingSimple: upcoming,
    };
  }, [hearings]);

  const displayedContent = useMemo(() => {
    switch (activeView) {
      case VIEW.TODAY_REPORTS:
        return {
          type: "single",
          items: todayReports,
          componentType: "detailed",
        };
      case VIEW.URGENT:
        return { type: "single", items: urgentSimple, componentType: "simple" };
      default:
        return {
          type: "sections",
          sections: [
            ...(todayReports.length > 0
              ? [
                  {
                    title: "📋 Today's Reports",
                    items: todayReports,
                    type: "detailed",
                  },
                ]
              : []),
            ...(urgentSimple.length > 0
              ? [
                  {
                    title: "⚠️ Next 3 Days",
                    items: urgentSimple,
                    type: "simple",
                  },
                ]
              : []),
            ...(upcomingSimple.length > 0
              ? [
                  {
                    title: "📅 Upcoming",
                    items: upcomingSimple,
                    type: "simple",
                  },
                ]
              : []),
          ],
        };
    }
  }, [activeView, todayReports, urgentSimple, upcomingSimple]);

  const handleCardClick = useCallback((hearing) => {
    setSelectedHearing(hearing);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    // FIX: Don't null out selectedHearing immediately on close.
    // The modal uses an exit animation; if we set selectedHearing to null
    // right away, the modal re-renders with hearing=null mid-animation,
    // which previously triggered the hooks-count mismatch crash.
    // Instead we clear it after a short delay so the modal can animate out
    // with its content intact.
    setTimeout(() => setSelectedHearing(null), 300);
  }, []);

  const handleViewChange = useCallback((view) => {
    setActiveView((prev) => (prev === view ? VIEW.ALL : view));
  }, []);

  const totalVisible =
    todayReports.length + urgentSimple.length + upcomingSimple.length;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <CalendarOutlined className="text-blue-600 text-base" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 leading-none">
                Court Hearings
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {totalVisible} scheduled · {todayReports.length} reports today
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              navigate("/dashboard/calendar", { state: { filter: "hearings" } })
            }
            className="flex items-center gap-1 text-xs text-blue-600 font-bold hover:text-blue-700 transition-colors">
            View all <RightOutlined className="text-[10px]" />
          </button>
        </div>

        <div className="px-5 pb-5">
          {/* Stat pills */}
          <div className="flex gap-2 mb-4">
            <StatPill
              icon={<FileTextOutlined />}
              label="Reports"
              value={todayReports.length}
              colorKey="blue"
              active={activeView === VIEW.TODAY_REPORTS}
              onClick={() => handleViewChange(VIEW.TODAY_REPORTS)}
            />
            <StatPill
              icon={<ExclamationCircleOutlined />}
              label="Urgent"
              value={urgentSimple.length}
              colorKey="amber"
              active={activeView === VIEW.URGENT}
              onClick={() => handleViewChange(VIEW.URGENT)}
            />
            <StatPill
              icon={<CalendarOutlined />}
              label="All"
              value={totalVisible}
              colorKey="violet"
              active={activeView === VIEW.ALL}
              onClick={() => handleViewChange(VIEW.ALL)}
            />
            <StatPill
              icon={<ClockCircleOutlined />}
              label="This Week"
              value={stats.thisWeek || 0}
              colorKey="slate"
              active={false}
              onClick={() => handleViewChange(VIEW.ALL)}
            />
          </div>

          {/* Today's banner */}
          {todayReports.length > 0 && activeView !== VIEW.TODAY_REPORTS && (
            <button
              onClick={() => handleViewChange(VIEW.TODAY_REPORTS)}
              className="w-full mb-4 flex items-center gap-3 bg-gradient-to-r
                         from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600
                         text-white rounded-xl px-4 py-3 transition-all shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <p className="text-sm font-bold flex-1 text-left">
                {todayReports.length} Report
                {todayReports.length !== 1 ? "s" : ""} Filed Today
              </p>
              <RightOutlined className="text-xs opacity-60" />
            </button>
          )}

          {/* Content */}
          <div className="max-h-[460px] overflow-y-auto pr-1">
            {loading && hearings.length === 0 ? (
              <div className="py-14 flex items-center justify-center">
                <Spin />
              </div>
            ) : error ? (
              <div className="py-14 text-center">
                <Empty
                  description={
                    <div className="text-center">
                      <p className="text-gray-600 mb-3">
                        Failed to load hearings
                      </p>
                      <Button
                        size="small"
                        onClick={() =>
                          dispatch(
                            fetchUpcomingHearings({ limit: 50, days: 30 }),
                          )
                        }>
                        Retry
                      </Button>
                    </div>
                  }
                />
              </div>
            ) : totalVisible === 0 ? (
              <div className="py-14 text-center">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-sm font-bold text-gray-700 mb-1">
                  No hearings found
                </p>
                <p className="text-xs text-gray-400">
                  {activeView === VIEW.TODAY_REPORTS
                    ? "No reports filed today"
                    : activeView === VIEW.URGENT
                      ? "No urgent hearings in the next 3 days"
                      : "No upcoming hearings scheduled"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedContent.type === "sections" ? (
                  displayedContent.sections.map((section) => (
                    <HearingSection
                      key={section.title}
                      title={section.title}
                      items={section.items}
                      type={section.type}
                      onClick={handleCardClick}
                    />
                  ))
                ) : (
                  <div className="space-y-2">
                    {displayedContent.items.length >
                    VIRTUALIZATION_THRESHOLD ? (
                      <VirtualizedList
                        items={displayedContent.items}
                        height={400}
                        renderItem={(item) =>
                          displayedContent.componentType === "detailed" ? (
                            <DetailedHearingCard
                              hearing={item}
                              onClick={handleCardClick}
                            />
                          ) : (
                            <SimpleHearingCard
                              hearing={item}
                              onClick={handleCardClick}
                            />
                          )
                        }
                      />
                    ) : (
                      displayedContent.items.map((item) =>
                        displayedContent.componentType === "detailed" ? (
                          <DetailedHearingCard
                            key={item._id}
                            hearing={item}
                            onClick={handleCardClick}
                          />
                        ) : (
                          <SimpleHearingCard
                            key={item._id}
                            hearing={item}
                            onClick={handleCardClick}
                          />
                        ),
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {totalVisible > 0 && !loading && !error && (
            <p className="text-center text-[11px] text-gray-400 mt-3">
              Showing {totalVisible} hearing{totalVisible !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <HearingDetailModal
        hearing={selectedHearing}
        open={modalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default React.memo(CourtHearingsWidget);
