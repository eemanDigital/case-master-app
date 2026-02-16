import React, { useMemo } from "react";
import { Empty, Typography, Timeline, Tag } from "antd";
import { ClockCircleOutlined, CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import EventCard from "./EventCard";
import {
  groupEventsByDate,
  sortEventsByTime,
  formatDate,
  isToday,
  isTomorrow,
} from "../../utils/calendarUtils";

const { Title, Text } = Typography;

const AgendaView = ({ events, onEventClick, dateRange }) => {
  const groupedEvents = useMemo(() => {
    const sorted = sortEventsByTime(events);
    return groupEventsByDate(sorted);
  }, [events]);

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

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg">
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

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="space-y-8">
        {Object.keys(groupedEvents)
          .sort()
          .map((dateKey) => {
            const dayEvents = groupedEvents[dateKey];
            const eventCount = getDayCount(dateKey);

            return (
              <div key={dateKey} className="agenda-day-group">
                {/* Date Header */}
                <div className="sticky top-0 bg-white z-10 pb-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <div className="flex items-center gap-3">
                      <CalendarOutlined className="text-xl text-blue-600" />
                      <div>
                        <Title level={4} className="!mb-0">
                          {getDateLabel(dateKey)}
                        </Title>
                        <Text className="text-sm text-gray-500">
                          {eventCount} event{eventCount !== 1 ? "s" : ""}
                        </Text>
                      </div>
                    </div>

                    <Tag color="blue" className="!m-0">
                      {formatDate(dateKey, "MMM DD")}
                    </Tag>
                  </div>
                </div>

                {/* Events Timeline */}
                <Timeline
                  mode="left"
                  className="mt-4"
                  items={dayEvents.map((event, index) => ({
                    color: "blue",
                    dot: <ClockCircleOutlined style={{ fontSize: "16px" }} />,
                    label: (
                      <div className="text-sm font-medium text-gray-600 min-w-[100px]">
                        {dayjs(event.startDateTime).format("hh:mm A")}
                      </div>
                    ),
                    children: (
                      <div className="pb-4">
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
