import React from "react";
import { Button, Space, Typography, Select, DatePicker, Tooltip } from "antd";
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  PlusOutlined,
  ReloadOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title } = Typography;

const CalendarHeader = ({
  currentDate,
  view,
  onViewChange,
  onPreviousClick,
  onNextClick,
  onTodayClick,
  onDateChange,
  onCreateEvent,
  onFilterClick,
  onRefresh,
  loading,
}) => {
  const getDateLabel = () => {
    const date = dayjs(currentDate);

    switch (view) {
      case "day":
        return date.format("MMMM DD, YYYY");
      case "week":
        const weekStart = date.startOf("week");
        const weekEnd = date.endOf("week");
        return `${weekStart.format("MMM DD")} - ${weekEnd.format("MMM DD, YYYY")}`;
      case "month":
        return date.format("MMMM YYYY");
      default:
        return date.format("MMMM YYYY");
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-3 md:px-6 py-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left Section - Title and Navigation */}
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3">
            <CalendarOutlined className="text-xl md:text-2xl text-blue-600" />
            <Title level={4} className="!mb-0 !text-base md:!text-lg text-gray-800">
              {getDateLabel()}
            </Title>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip title="Previous">
              <Button
                icon={<LeftOutlined />}
                onClick={onPreviousClick}
                disabled={loading}
                size="small"
              />
            </Tooltip>
            <Button onClick={onTodayClick} disabled={loading} size="small">
              Today
            </Button>
            <Tooltip title="Next">
              <Button
                icon={<RightOutlined />}
                onClick={onNextClick}
                disabled={loading}
                size="small"
              />
            </Tooltip>
          </div>

          <DatePicker
            value={dayjs(currentDate)}
            onChange={(date) => onDateChange && onDateChange(date?.toDate())}
            allowClear={false}
            disabled={loading}
            className="!hidden sm:!inline-block"
            size="small"
          />
        </div>

        {/* Right Section - View Controls and Actions */}
        <div className="flex items-center justify-between md:justify-end gap-2">
          <Select
            value={view}
            onChange={onViewChange}
            disabled={loading}
            size="small"
            className="!w-24 md:!w-32"
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
              { value: "agenda", label: "Agenda" },
            ]}
          />

          <div className="flex items-center gap-1">
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined />}
                onClick={onRefresh}
                loading={loading}
                size="small"
              />
            </Tooltip>

            <Tooltip title="Filters">
              <Button
                icon={<FilterOutlined />}
                onClick={onFilterClick}
                disabled={loading}
                size="small"
              />
            </Tooltip>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onCreateEvent}
              disabled={loading}
              size="small"
              className="bg-blue-600 hover:bg-blue-700">
              <span className="hidden sm:inline">New Event</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
