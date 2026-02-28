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
  updateHearing,
} from "../../redux/features/litigation/litigationSlice";
import { getAllEvents } from "../../redux/features/calender/calenderSlice";
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
  HEARING_NOTICE: "hearing_notice",
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
  const displayDate = hearing.nextHearingDate || hearing.date;
  const hearingDate = dayjs(displayDate).startOf("day");
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
// FIX 1: itemHeight is now a constant defined outside the component to avoid
// stale closure issues in handleScroll and the padding calculations.

const VIRTUAL_ITEM_HEIGHT = 72;

const VirtualizedList = ({ items, renderItem, height = 400 }) => {
  const [startIndex, setStartIndex] = useState(0);
  const containerRef = useRef(null);
  const visibleCount = Math.ceil(height / VIRTUAL_ITEM_HEIGHT) + 2;

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const newStartIndex = Math.floor(
      containerRef.current.scrollTop / VIRTUAL_ITEM_HEIGHT,
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
  const paddingTop = startIndex * VIRTUAL_ITEM_HEIGHT;
  const paddingBottom = Math.max(
    0,
    (items.length - (startIndex + visibleCount)) * VIRTUAL_ITEM_HEIGHT,
  );

  return (
    <div ref={containerRef} style={{ height, overflow: "auto" }}>
      <div style={{ paddingTop, paddingBottom }}>
        {visibleItems.map((item, index) => (
          // FIX 2: Use a stable key that doesn't rely solely on array index.
          // Combining _id with startIndex+index keeps keys unique and stable
          // during scroll so React can reconcile correctly.
          <div
            key={item._id ?? `item-${startIndex + index}`}
            style={{ height: VIRTUAL_ITEM_HEIGHT }}>
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
  const isToday = useMemo(
    () => dayjs(displayDate).isSame(dayjs(), "day"),
    [displayDate],
  );

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
      className={`w-full text-left relative flex items-center gap-3 p-3 rounded-xl border
                 transition-all group
                 focus:outline-none focus:ring-2 focus:ring-offset-1
                 ${
                   isToday
                     ? "border-emerald-200 bg-emerald-50/50 hover:border-emerald-300 hover:bg-emerald-50 focus:ring-emerald-400"
                     : "border-gray-100 hover:border-gray-200 hover:bg-gray-50 focus:ring-blue-400"
                 }`}>
      {isToday && (
        <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-r-full" />
      )}
      <div
        className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0
                      transition-all ${
                        isToday
                          ? "bg-gradient-to-br from-emerald-100 to-emerald-50 group-hover:from-emerald-200 group-hover:to-emerald-100"
                          : "bg-gradient-to-br from-gray-100 to-gray-50 group-hover:from-gray-200 group-hover:to-gray-100"
                      }`}>
        <span
          className={`text-sm font-bold leading-none ${
            isToday ? "text-emerald-700" : "text-gray-700"
          }`}>
          {dayjs(displayDate).format("D")}
        </span>
        <span
          className={`text-[8px] font-semibold uppercase ${
            isToday ? "text-emerald-600" : "text-gray-500"
          }`}>
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
      {/* FIX 3: Moved "Hearing Notice Required" tag BEFORE the relative-date
          div so it doesn't overlap the button layout. Also removed the stray
          mb-2 margin that pushed content outside the fixed-height card. */}
      {hearing.hearingNoticeRequired && (
        <Tag
          color="orange"
          className="!text-[10px] !px-2 !py-0.5 flex-shrink-0">
          Notice Required
        </Tag>
      )}
      <div
        className={`text-xs font-medium whitespace-nowrap ${
          isToday ? "text-emerald-600 font-bold" : "text-gray-400"
        }`}>
        {isToday ? "TODAY" : getRelative(displayDate)}
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
  const isToday = useMemo(
    () => dayjs(displayDate).isSame(dayjs(), "day"),
    [displayDate],
  );

  return (
    <button
      onClick={() => onClick(hearing)}
      className={`w-full text-left relative flex gap-3 p-4 rounded-2xl border
                 transition-all duration-200 group
                 hover:shadow-md hover:-translate-y-0.5
                 focus:outline-none focus:ring-2 focus:ring-offset-1
                 ${
                   isToday
                     ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 focus:ring-emerald-400"
                     : "bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200 focus:ring-blue-400"
                 }`}>
      {isToday && (
        <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-emerald-500 animate-pulse" />
      )}
      {!isToday && (
        <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-blue-500" />
      )}

      <div
        className={`flex-shrink-0 w-11 h-11 rounded-xl flex flex-col items-center
                      justify-center ml-2 ${
                        isToday
                          ? "bg-gradient-to-br from-emerald-500 to-teal-500"
                          : "bg-blue-500"
                      } text-white`}>
        <span className="text-base font-black leading-none">
          {dayjs(displayDate).format("D")}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-wider opacity-75">
          {dayjs(displayDate).format("MMM")}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isToday && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                TODAY
              </span>
            )}
            <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-1">
              {caseTitle}
            </p>
          </div>
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

        {/* FIX 4: Show hearing notice tag even when outcome exists, as long
            as hearingNoticeRequired is set. Previously it was hidden whenever
            `hearing.outcome` was truthy, which was logically wrong — a filed
            report doesn't mean the notice has been served. */}
        {hearing.hearingNoticeRequired && (
          <div className="mb-2">
            <Tag
              color="orange"
              className="!text-[10px] !px-2 !py-0.5 animate-pulse">
              Hearing Notice Required
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

const HearingDetailModal = React.memo(({ hearing, open, onClose }) => {
  const dispatch = useDispatch();
  const actionLoading = useSelector(
    (s) => s.litigation?.actionLoading ?? false,
  );

  const [activePanel, setActivePanel] = useState("none");
  // FIX 5: Initialise selectedOutcome from the hearing's existing outcome so
  // the "Adjourned To" date picker appears correctly when updating a report
  // that was previously set to "adjourned".
  const [selectedOutcome, setSelectedOutcome] = useState(
    hearing?.outcome ?? null,
  );
  const [reportForm] = Form.useForm();

  // FIX 6: `autoFetch` was previously wired to `open` (a boolean), which is
  // correct, but the hook is also called unconditionally — good. No change
  // needed here, just confirming it is correct.
  const { data: lawyerOptions, loading: lawyersLoading } = useUserSelectOptions(
    {
      type: "lawyers",
      lawyerOnly: true,
      autoFetch: open,
    },
  );

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

  // FIX 7: Also reset selectedOutcome to the hearing's current outcome when
  // the modal opens or the hearing changes, not just on close. This ensures
  // the "Adjourned To" field shows correctly when re-opening a hearing that
  // already has an "adjourned" outcome.
  useEffect(() => {
    if (open && hearing) {
      setSelectedOutcome(hearing.outcome ?? null);
      reportForm.setFieldsValue({
        outcome: hearing.outcome ?? undefined,
        notes: hearing.notes ?? undefined,
      });
    }
    if (!open) {
      setActivePanel("none");
      setSelectedOutcome(null);
      reportForm.resetFields();
    }
  }, [open, hearing, reportForm]);

  if (!hearing || !displayDate) return null;

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
      message.success("Hearing report filed and calendar synced");
      dispatch(fetchUpcomingHearings({ range: "all", limit: 50 }));
      dispatch(getAllEvents({}));
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
                // FIX 8: Remove the incorrect condition `&& !hasReport`.
                // Past hearings with a report should still be editable ("Update
                // Report"). The button was wrongly enabled for past hearings
                // with a report because the original disabled check was
                // `editPerms.isFuture && !hasReport` — meaning a future hearing
                // WITH a report (impossible normally, but defensive) would not
                // be disabled. Simplify to just `!!editPerms.isFuture`.
                disabled={!!editPerms.isFuture}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                           border-2 font-semibold text-sm transition-all ${
                             editPerms.isFuture
                               ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                               : isToday
                                 ? hasReport
                                   ? "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300"
                                   : "border-emerald-500 text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md"
                                 : "border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-300"
                           }`}>
                <EditOutlined />
                {hasReport
                  ? "Update Report"
                  : isToday
                    ? "File Today's Report"
                    : "File Report"}
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
                    // FIX 9: Re-sync selectedOutcome after cancelling so that
                    // if the user had changed the Select while editing, the
                    // "Adjourned To" field disappears again correctly.
                    setSelectedOutcome(hearing.outcome ?? null);
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
                        // FIX 10: Pre-populate adjournedDate from nextHearingDate
                        // when the outcome is already "adjourned" so the user
                        // sees the current adjourned date and can update it.
                        defaultValue={
                          hearing.outcome === REQUIRES_ADJOURNED_DATE &&
                          hearing.nextHearingDate
                            ? dayjs(hearing.nextHearingDate)
                            : undefined
                        }
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
    dispatch(fetchUpcomingHearings({ range: "all", limit: 50 }));
  }, [dispatch]);

  const { todayReports, urgentSimple, upcomingSimple, hearingNoticeRequired } =
    useMemo(() => {
      const today = dayjs().startOf("day");
      const threeDays = dayjs().add(3, "day").endOf("day");
      const reports = [],
        urgent = [],
        upcoming = [],
        noticeRequired = [];

      hearings.forEach((h) => {
        // Use hearingDate (which is nextHearingDate from backend)
        const displayDate = h.hearingDate;
        const d = dayjs(displayDate);
        const hasReport = !!h.outcome;
        // FIX 11: `needsNotice` should not depend on `hasReport`. A hearing
        // notice is a separate requirement from filing a post-hearing report.
        // Removing `&& !hasReport` ensures hearings still show as needing a
        // notice even after their outcome has been recorded.
        const needsNotice = !!h.hearingNoticeRequired;

        if (needsNotice && d.isAfter(today)) {
          noticeRequired.push(h);
          // FIX 12: Do NOT `return` early here. A hearing can require a notice
          // AND also fall into today/urgent/upcoming at the same time. Returning
          // early caused those hearings to disappear from all other sections.
          // We intentionally fall through so they also populate the right bucket.
        }

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
        hearingNoticeRequired: noticeRequired,
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
      case VIEW.HEARING_NOTICE:
        return {
          type: "single",
          items: hearingNoticeRequired,
          componentType: "simple",
        };
      default:
        return {
          type: "sections",
          sections: [
            ...(hearingNoticeRequired.length > 0
              ? [
                  {
                    title: "📜 Hearing Notice Required",
                    items: hearingNoticeRequired,
                    type: "simple",
                  },
                ]
              : []),
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
  }, [
    activeView,
    todayReports,
    urgentSimple,
    upcomingSimple,
    hearingNoticeRequired,
  ]);
  // FIX 13: Added `hearingNoticeRequired` to the dependency array above.
  // It was previously missing, which meant the "sections" view would not
  // re-render when the hearingNoticeRequired list changed.

  const handleCardClick = useCallback((hearing) => {
    setSelectedHearing(hearing);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setTimeout(() => setSelectedHearing(null), 300);
  }, []);

  const handleViewChange = useCallback((view) => {
    setActiveView((prev) => (prev === view ? VIEW.ALL : view));
  }, []);

  const totalVisible =
    todayReports.length +
    urgentSimple.length +
    upcomingSimple.length +
    hearingNoticeRequired.length;

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
                {totalVisible} scheduled · {todayReports.length} reports today ·{" "}
                {hearingNoticeRequired.length} notice pending
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
              label="Notice"
              value={hearingNoticeRequired.length}
              colorKey="amber"
              active={activeView === VIEW.HEARING_NOTICE}
              onClick={() => handleViewChange(VIEW.HEARING_NOTICE)}
            />
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

          {/* Hearing Notice Required Banner */}
          {hearingNoticeRequired.length > 0 &&
            activeView !== VIEW.HEARING_NOTICE && (
              <button
                onClick={() => handleViewChange(VIEW.HEARING_NOTICE)}
                className="w-full mb-3 flex items-center gap-3 bg-gradient-to-r
                         from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600
                         text-white rounded-xl px-4 py-3 transition-all shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <p className="text-sm font-bold flex-1 text-left">
                  {hearingNoticeRequired.length} Hearing Notice Pending
                </p>
                <RightOutlined className="text-xs opacity-60" />
              </button>
            )}

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
                            fetchUpcomingHearings({ range: "all", limit: 50 }),
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
