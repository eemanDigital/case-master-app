/**
 * ScrollingEvents.jsx
 *
 * Consumes useCalendarEvents() — same hook as CalendarPage/MonthView —
 * so no duplicate API calls are made.
 *
 * Handles the inconsistent event shapes returned by the API:
 *  - Some events have `start`/`end` as ISO strings at the top level
 *  - Some events have `startDateTime`/`endDateTime` instead
 *  - Some events have no `title` (derived from description or eventType)
 *  - Some events have no `end` at all
 *  - `status: "completed"` events are excluded from the marquee
 */

import { useMemo } from "react";
import { useCalendarEvents } from "../hooks/useCalendar";
import Marquee from "react-fast-marquee";
import { FaRegCalendar, FaRegClock, FaBolt } from "react-icons/fa";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import { getEventColor } from "../utils/calendarUtils";

dayjs.extend(isBetween);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);

// ─── Event type labels ────────────────────────────────────────────────────────
const EVENT_TYPE_LABELS = {
  hearing: "Hearing",
  mention: "Mention",
  meeting: "Meeting",
  client_meeting: "Client Meeting",
  deadline: "Deadline",
  reminder: "Reminder",
  court: "Court",
  task: "Task",
};

// ─── Normalise an event into a consistent shape ───────────────────────────────
// The API returns mixed shapes — this function always produces:
//   { _id, title, start, end, eventType, status, location, tags }
// where start/end are valid dayjs-parseable strings.
const normaliseEvent = (event) => {
  if (!event || typeof event !== "object") return null;

  // Resolve start — prefer `start`, fall back to `startDateTime`
  const rawStart = event.start ?? event.startDateTime ?? null;
  // Resolve end — prefer `end`, fall back to `endDateTime`
  const rawEnd = event.end ?? event.endDateTime ?? null;

  if (!rawStart) return null; // can't render an event with no time

  const start = dayjs(rawStart);
  if (!start.isValid()) return null;

  // Derive a display title
  let title = "";
  if (typeof event.title === "string" && event.title.trim()) {
    title = event.title.trim();
  } else if (
    typeof event.description === "string" &&
    event.description.trim()
  ) {
    // Use first line of description as fallback title
    title = event.description.split("\n")[0].trim();
  } else {
    title = EVENT_TYPE_LABELS[event.eventType] ?? "Event";
  }

  return {
    _id: event._id,
    title,
    start: rawStart,
    end: rawEnd,
    eventType: typeof event.eventType === "string" ? event.eventType : "",
    status: typeof event.status === "string" ? event.status : "",
    location: typeof event.location === "string" ? event.location : "",
    tags: Array.isArray(event.tags) ? event.tags : [],
    // Keep original for getEventColor which may inspect other fields
    _raw: event,
  };
};

// ─── Status pill config ───────────────────────────────────────────────────────
const getStatusConfig = (startStr, endStr, now) => {
  const s = dayjs(startStr);
  const e = endStr ? dayjs(endStr) : s.add(1, "hour");

  if (now.isBetween(s, e, null, "[]"))
    return {
      label: "Live Now",
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      dot: "bg-emerald-500",
      pulse: true,
    };

  const diffMin = s.diff(now, "minute");
  const diffHr = s.diff(now, "hour");
  const diffDay = s.diff(now, "day");

  if (diffMin > 0 && diffMin <= 15)
    return {
      label: "Starting Soon",
      bg: "bg-orange-100",
      text: "text-orange-800",
      dot: "bg-orange-500",
      pulse: true,
    };
  if (diffMin > 15 && diffHr < 1)
    return {
      label: `In ${diffMin} min`,
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      dot: "bg-yellow-500",
      pulse: false,
    };
  if (diffHr >= 1 && diffHr < 24)
    return {
      label: `In ${diffHr}h`,
      bg: "bg-sky-100",
      text: "text-sky-800",
      dot: "bg-sky-500",
      pulse: false,
    };
  if (diffDay === 1)
    return {
      label: "Tomorrow",
      bg: "bg-violet-100",
      text: "text-violet-800",
      dot: "bg-violet-500",
      pulse: false,
    };
  if (diffDay > 1 && diffDay <= 7)
    return {
      label: `In ${diffDay} days`,
      bg: "bg-indigo-100",
      text: "text-indigo-800",
      dot: "bg-indigo-500",
      pulse: false,
    };
  return {
    label: "Upcoming",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
    pulse: false,
  };
};

// ─── Format start time relative to today ─────────────────────────────────────
const formatStart = (dateStr) => {
  const d = dayjs(dateStr);
  if (!d.isValid()) return "";
  if (d.isToday()) return d.format("h:mm A");
  if (d.isTomorrow()) return `Tomorrow ${d.format("h:mm A")}`;
  return d.format("MMM D, h:mm A");
};

// ─── Auto-synced hearing check ────────────────────────────────────────────────
const isAutoSynced = (event) =>
  (event.eventType === "hearing" || event.eventType === "mention") &&
  event.tags.includes("auto-synced");

// ─── Event card ───────────────────────────────────────────────────────────────
const EventCard = ({ event, now }) => {
  // Pass the original raw event to getEventColor so it can inspect all fields
  const color = getEventColor(event._raw ?? event);
  const status = getStatusConfig(event.start, event.end, now);
  const synced = isAutoSynced(event);
  const typeLabel = EVENT_TYPE_LABELS[event.eventType] ?? "";

  return (
    <div
      className="flex items-stretch mr-3 rounded-xl shadow-sm overflow-hidden min-w-[300px] max-w-[340px] bg-white border border-gray-100 hover:shadow-md transition-shadow duration-200"
      style={{ borderLeft: `4px solid ${color}` }}>
      <div className="flex items-start gap-3 p-3 flex-1 min-w-0">
        {/* Icon */}
        <div
          className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}1a` }}>
          <FaRegCalendar style={{ color }} size={14} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-1.5 mb-0.5">
            {synced && (
              <FaBolt
                className="text-violet-500 shrink-0"
                size={10}
                title="Auto-synced from litigation"
              />
            )}
            <Link
              to={`/dashboard/events/${event._id}/details`}
              className="text-sm font-semibold text-gray-800 hover:text-blue-600 truncate block leading-snug"
              title={event.title}
              onClick={(e) => e.stopPropagation()}>
              {event.title}
            </Link>
          </div>

          {/* Time + type */}
          <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <FaRegClock size={10} />
              {formatStart(event.start)}
              {event.end ? ` – ${dayjs(event.end).format("h:mm A")}` : ""}
            </span>
            {typeLabel && (
              <>
                <span className="text-gray-300">·</span>
                <span className="font-medium" style={{ color }}>
                  {typeLabel}
                </span>
              </>
            )}
          </div>

          {/* Location */}
          {event.location && (
            <div className="text-xs text-gray-400 mt-0.5 truncate">
              📍 {event.location}
            </div>
          )}
        </div>

        {/* Status pill */}
        <div className="shrink-0 self-center ml-1">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${status.bg} ${status.text}`}>
            {status.pulse && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`}
              />
            )}
            {status.label}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const ScrollingEvents = () => {
  const { events, loading } = useCalendarEvents();

  // Stable reference time — dayjs is immutable, no mutation risk
  const now = useMemo(() => dayjs(), []);

  const upcomingEvents = useMemo(() => {
    // Handle both flat-array and { data: [] } shapes from the hook
    const raw = Array.isArray(events)
      ? events
      : Array.isArray(events?.data)
        ? events.data
        : [];

    return raw
      .map(normaliseEvent) // normalise mixed shapes
      .filter(Boolean) // drop nulls (events with no start)
      .filter((event) => {
        // Exclude completed/cancelled events from the ticker
        if (event.status === "completed" || event.status === "cancelled") {
          return false;
        }
        const start = dayjs(event.start);
        const end = event.end ? dayjs(event.end) : start.add(1, "hour");
        // Keep: happening now, or starting in the future
        return now.isBetween(start, end, null, "[]") || start.isAfter(now);
      })
      .sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf());
  }, [events, now]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 px-4 text-sm text-gray-500">
        <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
        Loading events…
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (upcomingEvents.length === 0) {
    return (
      <div className="flex items-center gap-2 py-2 px-4 text-sm text-gray-400">
        <FaRegCalendar size={13} />
        No upcoming events
      </div>
    );
  }

  // ── Marquee ────────────────────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 min-w-0">
        <Marquee speed={38} gradient={false} pauseOnHover>
          {upcomingEvents.map((event) => (
            <EventCard key={event._id} event={event} now={now} />
          ))}
        </Marquee>
      </div>

      {/* Count + next event badge */}
      <div className="hidden md:flex shrink-0 flex-col items-end">
        <div className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm text-gray-600 leading-tight">
          <span className="font-bold text-blue-600">
            {upcomingEvents.length}
          </span>{" "}
          event{upcomingEvents.length !== 1 ? "s" : ""}
          <div className="text-gray-400 mt-0.5">
            Next: {formatStart(upcomingEvents[0].start)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrollingEvents;
