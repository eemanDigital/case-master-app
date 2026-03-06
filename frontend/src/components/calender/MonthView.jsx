import React, { useMemo } from "react";
import { Badge, Typography, Tooltip } from "antd";
import { ThunderboltFilled } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getCalendarDays,
  getEventsForDate,
  isToday,
  getEventColor,
} from "../../utils/calendarUtils";

const { Text } = Typography;

const MonthView = ({ currentDate, events, onDateClick, onEventClick }) => {
  const calendarDays = useMemo(() => {
    return getCalendarDays(currentDate);
  }, [currentDate]);

  const currentMonth = dayjs(currentDate).month();

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

    // Count auto-synced hearings
    const autoSyncedCount = dayEvents.filter(isAutoSyncedHearing).length;

    return (
      <div
        key={date.toString()}
        className={`
          min-h-[120px] border border-gray-200 p-2 cursor-pointer
          transition-all duration-200
          ${isCurrentMonth ? "bg-white" : "bg-gray-50"}
          ${isTodayDate ? "ring-2 ring-blue-500 ring-inset" : ""}
          hover:bg-blue-50 hover:shadow-md
        `}
        onClick={() => onDateClick && onDateClick(date)}>
        {/* Date Number */}
        <div className="flex items-center justify-between mb-2">
          <div
            className={`
              w-7 h-7 flex items-center justify-center rounded-full
              text-sm font-medium
              ${
                isTodayDate
                  ? "bg-blue-600 text-white"
                  : isCurrentMonth
                    ? "text-gray-900"
                    : "text-gray-400"
              }
            `}>
            {dateNum}
          </div>

          <div className="flex items-center gap-1">
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

        {/* Events */}
        <div className="space-y-1">
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
