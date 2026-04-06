import React, { useMemo, useState, useEffect } from "react";
import { Badge, Typography, Tooltip } from "antd";
import { ThunderboltFilled, BlockOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getCalendarDays,
  getEventsForDate,
  isToday,
  getEventColor,
} from "../../utils/calendarUtils";

const { Text } = Typography;

const MonthView = ({ currentDate, events, blockedDates = [], onDateClick, onEventClick }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const calendarDays = useMemo(() => {
    return getCalendarDays(currentDate);
  }, [currentDate]);

  const currentMonth = dayjs(currentDate).month();

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Check if date is blocked
  const getBlockedInfo = (date) => {
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    return blockedDates.find((block) => {
      const start = dayjs(block.startDate).format("YYYY-MM-DD");
      const end = dayjs(block.endDate).format("YYYY-MM-DD");
      return dateStr >= start && dateStr <= end && block.isActive;
    });
  };

  // Check if event is auto-synced hearing
  const isAutoSyncedHearing = (event) => {
    return (
      (event.eventType === "hearing" || event.eventType === "mention") &&
      event.tags?.includes("auto-synced")
    );
  };

  // Get event icon/badge
  const getEventIcon = (event) => {
    if (isAutoSyncedHearing(event)) {
      return (
        <Tooltip title="Auto-synced from litigation">
          <ThunderboltFilled
            className="text-purple-600 animate-pulse"
            style={{ fontSize: 10 }}
          />
        </Tooltip>
      );
    }
    return null;
  };

  const renderDay = (date) => {
    const dayEvents = getEventsForDate(events, date);
    const isCurrentMonth = dayjs(date).month() === currentMonth;
    const isTodayDate = isToday(date);
    const dateNum = dayjs(date).date();
    const blockedInfo = getBlockedInfo(date);
    const isBlocked = !!blockedInfo;

    // Count auto-synced hearings
    const autoSyncedCount = dayEvents.filter(isAutoSyncedHearing).length;

    return (
      <div
        key={date.toString()}
        className={`
          min-h-[120px] border border-gray-200 p-2 cursor-pointer
          transition-all duration-200 relative
          ${isCurrentMonth ? "bg-white" : "bg-gray-50"}
          ${isTodayDate ? "ring-2 ring-blue-500 ring-inset" : ""}
          ${isBlocked ? "bg-red-50" : ""}
          hover:${isBlocked ? "bg-red-100" : "bg-blue-50"} hover:shadow-md
        `}
        onClick={() => onDateClick && onDateClick(date)}>
        {/* Blocked indicator overlay */}
        {isBlocked && (
          <div className="absolute inset-0 pointer-events-none opacity-30 bg-gradient-to-br from-red-100 to-red-50" />
        )}
        
        {/* Date Number */}
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div
            className={`
              w-7 h-7 flex items-center justify-center rounded-full
              text-sm font-medium
              ${isTodayDate
                ? "bg-blue-600 text-white"
                : isBlocked
                  ? "bg-red-500 text-white"
                  : isCurrentMonth
                    ? "text-gray-900"
                    : "text-gray-400"
              }
            `}>
            {dateNum}
          </div>

          <div className="flex items-center gap-1">
            {/* Blocked indicator */}
            {isBlocked && (
              <Tooltip title={`Blocked: ${blockedInfo.title}`}>
                <div className="w-5 h-5 rounded bg-red-500 flex items-center justify-center">
                  <BlockOutlined className="text-white text-xs" />
                </div>
              </Tooltip>
            )}

            {/* Auto-synced hearings indicator */}
            {autoSyncedCount > 0 && (
              <Tooltip
                title={`${autoSyncedCount} auto-synced hearing${autoSyncedCount > 1 ? "s" : ""}`}>
                <Badge
                  count={autoSyncedCount}
                  style={{ backgroundColor: "#722ed1" }}
                  className="!text-xs"
                />
              </Tooltip>
            )}

            {/* Total events badge */}
            {dayEvents.length > 0 && (
              <Badge
                count={dayEvents.length}
                style={{ backgroundColor: "#1890ff" }}
                className="!text-xs"
              />
            )}
          </div>
        </div>

        {/* Blocked message */}
        {isBlocked && (
          <div className="mb-1 px-1 py-0.5 bg-red-100 rounded text-[10px] text-red-700 font-medium truncate relative z-10">
            <BlockOutlined className="mr-1" />
            {blockedInfo.title}
          </div>
        )}

        {/* Events */}
        <div className="space-y-1 relative z-10">
          {dayEvents.slice(0, 3).map((event, index) => {
            const isAutoSynced = isAutoSyncedHearing(event);

            return (
              <div
                key={event._id || index}
                className={`
                  group px-2 py-1 rounded text-xs truncate cursor-pointer
                  bg-gradient-to-r from-white to-gray-50
                  border-l-2 hover:shadow-sm transition-all
                  ${isAutoSynced ? "ring-1 ring-purple-200" : ""}
                `}
                style={{ borderColor: getEventColor(event) }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick && onEventClick(event);
                }}>
                <div className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: getEventColor(event) }}
                  />
                  <span className="truncate font-medium text-gray-700 group-hover:text-blue-600 flex-1">
                    {event.title}
                  </span>
                  {getEventIcon(event)}
                </div>
              </div>
            );
          })}

          {dayEvents.length > 3 && (
            <Text className="!text-xs text-gray-500 ml-2">
              +{dayEvents.length - 3} more
            </Text>
          )}
        </div>
      </div>
    );
  };

  const renderMobileList = () => {
    const currentMonthEvents = events.filter(
      (event) => dayjs(event.startDateTime).month() === currentMonth
    );

    const sortedDates = [...new Set(currentMonthEvents.map((e) => dayjs(e.startDateTime).format("YYYY-MM-DD")))].sort();

    // Include blocked dates in the list
    const blockedInMonth = blockedDates.filter((block) => {
      const blockMonth = dayjs(block.startDate).month();
      return blockMonth === currentMonth && block.isActive;
    });

    const blockedDatesInMonth = blockedInMonth.map((b) => dayjs(b.startDate).format("YYYY-MM-DD"));
    const allDates = [...new Set([...sortedDates, ...blockedDatesInMonth])].sort();

    if (allDates.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No events this month
        </div>
      );
    }

    return allDates.map((dateKey) => {
      const dayEvents = currentMonthEvents.filter(
        (e) => dayjs(e.startDateTime).format("YYYY-MM-DD") === dateKey
      );
      const blockedInfo = getBlockedInfo(dayjs(dateKey));
      const date = dayjs(dateKey);

      return (
        <div key={dateKey} className={`border-b border-gray-100 last:border-b-0 ${blockedInfo ? "bg-red-50" : ""}`}>
          <div
            className={`sticky top-0 px-3 py-2 cursor-pointer ${blockedInfo ? "bg-red-100" : "bg-gray-50"}`}
            onClick={() => onDateClick && onDateClick(date.toDate())}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isToday(date.toDate()) ? "bg-blue-600 text-white" : blockedInfo ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700"}`}>
                {date.date()}
              </div>
              <div>
                <Text strong>{date.format("dddd")}</Text>
                <Text type="secondary" className="block text-xs">
                  {date.format("MMMM DD")} · {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
                  {blockedInfo && ` · Blocked`}
                </Text>
              </div>
            </div>
          </div>
          <div className="p-3 space-y-2">
            {blockedInfo && (
              <div className="p-3 rounded-lg bg-red-100 border-l-4 border-red-500">
                <div className="flex items-center gap-2">
                  <BlockOutlined className="text-red-600" />
                  <Text strong className="text-sm text-red-700">{blockedInfo.title}</Text>
                </div>
                <Text type="secondary" className="text-xs text-red-600">
                  {blockedInfo.reason || "Date is blocked"}
                </Text>
              </div>
            )}
            {dayEvents.map((event) => (
              <div
                key={event._id}
                className="p-3 rounded-lg border-l-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                style={{ borderColor: getEventColor(event) }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick && onEventClick(event);
                }}>
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getEventColor(event) }}
                  />
                  <Text strong className="text-sm">{event.title}</Text>
                  {isAutoSyncedHearing(event) && (
                    <ThunderboltFilled className="text-purple-600" style={{ fontSize: 10 }} />
                  )}
                </div>
                <Text type="secondary" className="text-xs">
                  {dayjs(event.startDateTime).format("h:mm A")}
                </Text>
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  if (isMobile) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <Text strong>{dayjs(currentDate).format("MMMM YYYY")}</Text>
        </div>
        {renderMobileList()}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-sm font-semibold text-gray-700">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date) => renderDay(date))}
      </div>
    </div>
  );
};

export default MonthView;
