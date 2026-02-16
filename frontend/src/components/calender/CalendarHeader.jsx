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
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Section - Title and Navigation */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <CalendarOutlined className="text-2xl text-blue-600" />
            <Title level={4} className="!mb-0 text-gray-800">
              {getDateLabel()}
            </Title>
          </div>

          <Space.Compact>
            <Tooltip title="Previous">
              <Button
                icon={<LeftOutlined />}
                onClick={onPreviousClick}
                disabled={loading}
              />
            </Tooltip>
            <Button onClick={onTodayClick} disabled={loading}>
              Today
            </Button>
            <Tooltip title="Next">
              <Button
                icon={<RightOutlined />}
                onClick={onNextClick}
                disabled={loading}
              />
            </Tooltip>
          </Space.Compact>

          <DatePicker
            value={dayjs(currentDate)}
            onChange={(date) => onDateChange && onDateChange(date?.toDate())}
            allowClear={false}
            disabled={loading}
          />
        </div>

        {/* Right Section - View Controls and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={view}
            onChange={onViewChange}
            disabled={loading}
            style={{ width: 120 }}
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
              { value: "agenda", label: "Agenda" },
            ]}
          />

          <Space>
            <Tooltip title="Refresh">
              <Button
                icon={<ReloadOutlined />}
                onClick={onRefresh}
                loading={loading}
              />
            </Tooltip>

            <Tooltip title="Filters">
              <Button
                icon={<FilterOutlined />}
                onClick={onFilterClick}
                disabled={loading}
              />
            </Tooltip>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onCreateEvent}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700">
              New Event
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
