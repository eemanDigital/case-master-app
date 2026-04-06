import React, { useMemo, useState, useEffect } from "react";
import { Badge, Typography, Tooltip } from "antd";
import { ThunderboltFilled, BlockOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getWeekDays,
  getEventsForDate,
  isToday,
  getEventColor,
} from "../../utils/calendarUtils";

const WeekView = ({ currentDate, events, blockedDates = [], onDateClick, onEventClick }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const weekDays = useMemo(() => {
    return getWeekDays(currentDate);
  }, [currentDate]);

  const currentWeek = dayjs(currentDate).week();

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  // Check if date is blocked
  const getBlockedInfo = (date) => {
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    return blockedDates.find((block) => {
      const start = dayjs(block.startDate).format("YYYY-MM-DD");
      const end = dayjs(block.endDate).format("YYYY-MM-DD");
      return dateStr >= start && dateStr <= end && block.isActive;
    });
  };

  const isAutoSyncedHearing = (event) => {
    return (
      (event.eventType === "hearing" || event.eventType === "mention") &&
      event.tags?.includes("auto-synced")
    );
  };

  const getEventIcon = (event) => {
    if (isAutoSyncedHearing(event)) {
      return (
        <Tooltip title="Auto-synced from litigation">
          <ThunderboltFilled
            className="text-purple-600 animate-pulse"
            style={{ fontSize: 8 }}
          />
        </Tooltip>
      );
    }
    return null;
  };

  const getEventsForHour = (date, hour) => {
    const dayEvents = getEventsForDate(events, date);
    return dayEvents.filter((event) => {
      const eventHour = dayjs(event.startDateTime).hour();
      return eventHour === hour;
    });
  };

  const renderMobileView = () => {
    const weekEvents = weekDays.flatMap((date) =>
      getEventsForDate(events, date).map((event) => ({
        ...event,
        date,
      }))
    );

    const sortedEvents = weekEvents.sort((a, b) =>
      dayjs(a.startDateTime).diff(dayjs(b.startDateTime))
    );

    return (
      <div className="space-y-4 p-4">
        {weekDays.map((date) => {
          const isTodayDate = isToday(date);
          const blockedInfo = getBlockedInfo(date);
          return (
            <div key={date.toString()} className={`border-b border-gray-100 last:border-b-0 pb-4 last:pb-0 ${blockedInfo ? "bg-red-50 rounded-lg p-2" : ""}`}>
              <div
                className={`flex items-center gap-3 mb-3 cursor-pointer ${blockedInfo ? "bg-red-100 rounded-lg p-2" : ""}`}
                onClick={() => onDateClick && onDateClick(date.toDate())}>
                <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center ${isTodayDate ? "bg-blue-600 text-white" : blockedInfo ? "bg-red-500 text-white" : "bg-gray-100 text-gray-700"}`}>
                  <span className="text-xs">{WEEKDAYS[dayjs(date).day()]}</span>
                  <span className="text-lg font-bold">{dayjs(date).date()}</span>
                </div>
                <div>
                  <Text strong className={isTodayDate ? "text-blue-600" : ""}>
                    {isTodayDate ? "Today" : dayjs(date).format("dddd")}
                  </Text>
                  <Text type="secondary" className="block text-xs">
                    {dayjs(date).format("MMMM DD")}
                    {blockedInfo && <span className="text-red-600 ml-1">· Blocked</span>}
                  </Text>
                </div>
              </div>
              
              {blockedInfo && (
                <div className="p-3 rounded-lg bg-red-100 border-l-4 border-red-500 mb-3">
                  <div className="flex items-center gap-2">
                    <BlockOutlined className="text-red-600" />
                    <Text strong className="text-sm text-red-700">{blockedInfo.title}</Text>
                  </div>
                  <Text type="secondary" className="text-xs text-red-600">
                    {blockedInfo.reason || "Date is blocked"}
                  </Text>
                </div>
              )}
              
              <div className="space-y-2 pl-1">
                {sortedEvents
                  .filter((e) => dayjs(e.date).isSame(date, "day"))
                  .map((event) => (
                    <div
                      key={event._id}
                      className="p-3 rounded-lg border-l-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                      style={{ borderColor: getEventColor(event) }}
                      onClick={() => onEventClick && onEventClick(event)}>
                      <div className="flex items-center gap-2 mb-1">
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
        })}
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <Text strong>Week of {dayjs(weekDays[0]).format("MMM DD")}</Text>
        </div>
        {renderMobileView()}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Week Header */}
      <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200">
        <div className="py-3 text-center text-sm font-semibold text-gray-700 border-r">
          Time
        </div>
        {weekDays.map((date, index) => {
          const isTodayDate = isToday(date);
          const blockedInfo = getBlockedInfo(date);
          return (
            <div
              key={index}
              className={`py-3 text-center text-sm font-semibold border-r last:border-r-0 relative ${
                blockedInfo ? "bg-red-50 text-red-700" : isTodayDate ? "bg-blue-50 text-blue-600" : "text-gray-700"
              }`}>
              {blockedInfo && (
                <div className="absolute top-1 right-1">
                  <Tooltip title={`Blocked: ${blockedInfo.title}`}>
                    <BlockOutlined className="text-red-500 text-xs" />
                  </Tooltip>
                </div>
              )}
              <div>{WEEKDAYS[index]}</div>
              <div
                className={`text-lg ${
                  isTodayDate
                    ? "bg-blue-600 text-white rounded-full w-8 h-8 mx-auto flex items-center justify-center"
                    : blockedInfo
                      ? "bg-red-500 text-white rounded-full w-8 h-8 mx-auto flex items-center justify-center"
                      : ""
                }`}>
                {dayjs(date).date()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time Grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
            {/* Time Column */}
            <div className="py-2 px-1 text-xs text-gray-500 text-right border-r bg-gray-50">
              {hour === 0
                ? "12 AM"
                : hour < 12
                  ? `${hour} AM`
                  : hour === 12
                    ? "12 PM"
                    : `${hour - 12} PM`}
            </div>

            {/* Day Columns */}
            {weekDays.map((date, dayIndex) => {
              const hourEvents = getEventsForHour(date, hour);
              const isTodayDate = isToday(date);
              const blockedInfo = getBlockedInfo(date);

              return (
                <div
                  key={dayIndex}
                  className={`min-h-[50px] border-r last:border-r-0 p-0.5 cursor-pointer transition-colors relative ${
                    blockedInfo ? "bg-red-50 hover:bg-red-100" : isTodayDate ? "bg-blue-50/30 hover:bg-blue-50" : "hover:bg-blue-50"
                  }`}
                  onClick={() => {
                    const clickDate = dayjs(date).hour(hour).toDate();
                    onDateClick && onDateClick(clickDate);
                  }}>
                  {blockedInfo && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
                  )}
                  {hourEvents.map((event) => {
                    const isAutoSynced = isAutoSyncedHearing(event);
                    return (
                      <div
                        key={event._id}
                        className={`text-[10px] px-1 py-0.5 rounded mb-0.5 cursor-pointer truncate ${
                          isAutoSynced
                            ? "bg-purple-100 text-purple-800 border-l-2 border-purple-500"
                            : "bg-blue-100 text-blue-800"
                        }`}
                        style={{ borderColor: getEventColor(event) }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick && onEventClick(event);
                        }}>
                        <div className="flex items-center gap-1">
                          {getEventIcon(event)}
                          <span className="truncate font-medium">
                            {dayjs(event.startDateTime).format("HH:mm")}{" "}
                            {event.title}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView;
