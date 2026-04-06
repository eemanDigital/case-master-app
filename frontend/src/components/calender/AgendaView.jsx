import React, { useMemo, useState, useEffect } from "react";
import { Empty, Typography, Timeline, Tag } from "antd";
import { ClockCircleOutlined, CalendarOutlined, BlockOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import EventCard from "./EventCard";
import {
  groupEventsByDate,
  sortEventsByTime,
  formatDate,
  isToday,
  isTomorrow,
  getEventColor,
} from "../../utils/calendarUtils";

const { Title, Text } = Typography;

const AgendaView = ({ events, blockedDates = [], onEventClick, dateRange }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const groupedEvents = useMemo(() => {
    const sorted = sortEventsByTime(events);
    return groupEventsByDate(sorted);
  }, [events]);

  // Get blocked dates for a specific date
  const getBlockedForDate = (date) => {
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    return blockedDates.filter((block) => {
      const start = dayjs(block.startDate).format("YYYY-MM-DD");
      const end = dayjs(block.endDate).format("YYYY-MM-DD");
      return dateStr >= start && dateStr <= end && block.isActive;
    });
  };

  const getDateLabel = (dateKey) => {
    const date = dayjs(dateKey);

    if (isToday(date)) {
      return "Today";
    } else if (isTomorrow(date)) {
      return "Tomorrow";
    }

    return formatDate(date, "dddd, MMMM DD, YYYY");
  };

  const getDayCount = (dateKey) => {
    const events = groupedEvents[dateKey];
    return events ? events.length : 0;
  };

  if (events.length === 0 && blockedDates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 md:h-96 bg-white rounded-lg p-4">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="text-center">
              <Text className="text-gray-500">No events scheduled</Text>
              <div className="mt-2">
                <Text className="text-sm text-gray-400">
                  Click "New Event" to create your first event
                </Text>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  const renderBlockedDate = (block) => (
    <div key={block._id} className="p-3 rounded-lg bg-red-100 border-l-4 border-red-500">
      <div className="flex items-center gap-2">
        <BlockOutlined className="text-red-600" />
        <Text strong className="text-sm text-red-700">{block.title}</Text>
        <Tag color="red" className="!m-0 !text-xs">Blocked</Tag>
      </div>
      <Text type="secondary" className="text-xs text-red-600 block mt-1">
        {block.reason || "Date is blocked for scheduling"}
      </Text>
    </div>
  );

  const renderMobileView = () => {
    // Get all unique dates from events and blocked dates
    const eventDates = Object.keys(groupedEvents);
    const blockedDateKeys = [...new Set(blockedDates.map((b) => dayjs(b.startDate).format("YYYY-MM-DD")))];
    const allDates = [...new Set([...eventDates, ...blockedDateKeys])].sort();

    return allDates.map((dateKey) => {
      const dayEvents = groupedEvents[dateKey] || [];
      const blockedForDay = getBlockedForDate(dayjs(dateKey));
      const eventCount = getDayCount(dateKey);

      return (
        <div key={dateKey} className={`border-b border-gray-100 last:border-b-0 ${blockedForDay.length > 0 ? "bg-red-50/50" : ""}`}>
          <div className={`sticky top-0 z-10 px-4 py-3 ${blockedForDay.length > 0 ? "bg-red-100" : "bg-gray-50"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarOutlined className={blockedForDay.length > 0 ? "text-red-600" : "text-blue-600"} />
                <Text strong>{getDateLabel(dateKey)}</Text>
                {blockedForDay.length > 0 && <Tag color="red" className="!m-0 !text-xs">Has Blocked</Tag>}
              </div>
              <Tag color="blue" className="!m-0 !text-xs">
                {eventCount}
              </Tag>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {blockedForDay.map(renderBlockedDate)}
            {dayEvents.map((event) => (
              <div
                key={event._id}
                className="p-3 rounded-lg border-l-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                style={{ borderColor: getEventColor(event) }}
                onClick={() => onEventClick && onEventClick(event)}>
                <div className="flex items-center justify-between mb-1">
                  <Text strong className="text-sm">{event.title}</Text>
                  <Text type="secondary" className="text-xs">
                    {dayjs(event.startDateTime).format("h:mm A")}
                  </Text>
                </div>
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
        {renderMobileView()}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <div className="space-y-6 md:space-y-8">
        {Object.keys(groupedEvents)
          .sort()
          .map((dateKey) => {
            const dayEvents = groupedEvents[dateKey];
            const eventCount = getDayCount(dateKey);
            const blockedForDay = getBlockedForDate(dayjs(dateKey));

            return (
              <div key={dateKey} className={`agenda-day-group ${blockedForDay.length > 0 ? "bg-red-50/30 rounded-lg p-3" : ""}`}>
                {/* Date Header */}
                <div className="sticky top-0 bg-white z-10 pb-3 md:pb-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2 md:pb-3">
                    <div className="flex items-center gap-2 md:gap-3">
                      <CalendarOutlined className={`text-lg md:text-xl ${blockedForDay.length > 0 ? "text-red-600" : "text-blue-600"}`} />
                      <div>
                        <Title level={4} className="!mb-0 !text-base md:!text-lg">
                          {getDateLabel(dateKey)}
                        </Title>
                        <Text className="text-xs md:text-sm text-gray-500">
                          {eventCount} event{eventCount !== 1 ? "s" : ""}
                          {blockedForDay.length > 0 && <span className="text-red-600 ml-1">· {blockedForDay.length} blocked</span>}
                        </Text>
                      </div>
                    </div>

                    <Tag color={blockedForDay.length > 0 ? "red" : "blue"} className="!m-0">
                      {formatDate(dateKey, "MMM DD")}
                    </Tag>
                  </div>
                </div>

                {/* Blocked Dates */}
                {blockedForDay.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {blockedForDay.map(renderBlockedDate)}
                  </div>
                )}

                {/* Events Timeline */}
                <Timeline
                  mode="left"
                  className="mt-3 md:mt-4"
                  items={dayEvents.map((event, index) => ({
                    color: "blue",
                    dot: <ClockCircleOutlined style={{ fontSize: "16px" }} />,
                    label: (
                      <div className="text-xs md:text-sm font-medium text-gray-600 min-w-[80px] md:min-w-[100px]">
                        {dayjs(event.startDateTime).format("hh:mm A")}
                      </div>
                    ),
                    children: (
                      <div className="pb-3 md:pb-4">
                        <EventCard
                          event={event}
                          onClick={onEventClick}
                          compact={false}
                        />
                      </div>
                    ),
                  }))}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default AgendaView;
