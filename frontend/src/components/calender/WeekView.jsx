import React, { useMemo } from "react";
import { Badge, Typography, Tooltip } from "antd";
import { ThunderboltFilled } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getWeekDays,
  getEventsForDate,
  isToday,
  getEventColor,
} from "../../utils/calendarUtils";

const WeekView = ({ currentDate, events, onDateClick, onEventClick }) => {
  const weekDays = useMemo(() => {
    return getWeekDays(currentDate);
  }, [currentDate]);

  const currentWeek = dayjs(currentDate).week();

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const HOURS = Array.from({ length: 24 }, (_, i) => i);

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

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Week Header */}
      <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200">
        <div className="py-3 text-center text-sm font-semibold text-gray-700 border-r">
          Time
        </div>
        {weekDays.map((date, index) => {
          const isTodayDate = isToday(date);
          return (
            <div
              key={index}
              className={`py-3 text-center text-sm font-semibold border-r last:border-r-0 ${
                isTodayDate ? "bg-blue-50 text-blue-600" : "text-gray-700"
              }`}>
              <div>{WEEKDAYS[index]}</div>
              <div
                className={`text-lg ${
                  isTodayDate
                    ? "bg-blue-600 text-white rounded-full w-8 h-8 mx-auto flex items-center justify-center"
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

              return (
                <div
                  key={dayIndex}
                  className={`min-h-[50px] border-r last:border-r-0 p-0.5 cursor-pointer hover:bg-blue-50 transition-colors ${
                    isTodayDate ? "bg-blue-50/30" : ""
                  }`}
                  onClick={() => {
                    const clickDate = dayjs(date).hour(hour).toDate();
                    onDateClick && onDateClick(clickDate);
                  }}>
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
