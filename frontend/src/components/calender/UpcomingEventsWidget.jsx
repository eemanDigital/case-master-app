import React from "react";
import { Card, List, Empty, Tag, Typography, Badge, Button } from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useUpcomingEvents } from "../../hooks/useCalendar";
import {
  formatDateTime,
  getRelativeTime,
  isEventNow,
  getEventColor,
} from "../../utils/calendarUtils";
import { EVENT_TYPE_LABELS } from "../../utils/calendarConstants";

const { Text, Title } = Typography;

const UpcomingEventsWidget = ({ limit = 5, onEventClick, onViewAll }) => {
  const { events, loading } = useUpcomingEvents({ limit });

  if (loading) {
    return (
      <Card loading className="shadow-sm">
        <div className="h-64" />
      </Card>
    );
  }

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarOutlined className="text-blue-600" />
            <span>Upcoming Events</span>
          </div>
          {events.length > 0 && (
            <Badge
              count={events.length}
              showZero
              style={{ backgroundColor: "#1890ff" }}
            />
          )}
        </div>
      }
      extra={
        onViewAll && (
          <Button type="link" onClick={onViewAll} icon={<RightOutlined />}>
            View All
          </Button>
        )
      }
      className="shadow-sm hover:shadow-md transition-shadow">
      {events.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text className="text-gray-500">No upcoming events</Text>
          }
          className="py-8"
        />
      ) : (
        <List
          dataSource={events}
          renderItem={(event) => {
            const isNow = isEventNow(event);
            const eventColor = getEventColor(event);

            return (
              <List.Item
                className="cursor-pointer hover:bg-gray-50 transition-colors px-3 -mx-3 rounded"
                onClick={() => onEventClick && onEventClick(event)}>
                <div className="w-full">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isNow && (
                          <Badge
                            status="processing"
                            className="animate-pulse"
                          />
                        )}
                        <Text
                          strong
                          className="text-sm truncate block"
                          title={event.title}>
                          {event.title}
                        </Text>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <ClockCircleOutlined />
                        <span>{getRelativeTime(event.startDateTime)}</span>
                      </div>
                    </div>

                    <div
                      className="w-1 h-12 rounded shrink-0"
                      style={{ backgroundColor: eventColor }}
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag color={eventColor} className="!text-xs !m-0">
                      {EVENT_TYPE_LABELS[event.eventType]}
                    </Tag>

                    <Text className="text-xs text-gray-400">
                      {formatDateTime(event.startDateTime, "MMM DD, hh:mm A")}
                    </Text>
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
};

export default UpcomingEventsWidget;
