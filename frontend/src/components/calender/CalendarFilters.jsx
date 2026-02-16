import React from "react";
import { Drawer, Form, Select, Button, Space, Divider, DatePicker } from "antd";
import { FilterOutlined, ClearOutlined } from "@ant-design/icons";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  EVENT_STATUS,
  EVENT_STATUS_LABELS,
  PRIORITY_LEVELS,
  PRIORITY_LABELS,
} from "../../utils/calendarConstants";

const { RangePicker } = DatePicker;

const CalendarFilters = ({
  visible,
  onClose,
  filters,
  onFiltersChange,
  onReset,
}) => {
  const [form] = Form.useForm();

  const handleApply = () => {
    const values = form.getFieldsValue();
    onFiltersChange(values);
    onClose();
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
    onClose();
  };

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <FilterOutlined />
          <span>Filter Events</span>
        </div>
      }
      placement="right"
      width={400}
      onClose={onClose}
      open={visible}
      extra={
        <Space>
          <Button onClick={handleReset} icon={<ClearOutlined />}>
            Reset
          </Button>
          <Button type="primary" onClick={handleApply}>
            Apply Filters
          </Button>
        </Space>
      }>
      <Form form={form} layout="vertical" initialValues={filters}>
        <Form.Item
          name="types"
          label="Event Types"
          tooltip="Filter by event type">
          <Select
            mode="multiple"
            placeholder="Select event types"
            allowClear
            showSearch
            optionFilterProp="children">
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          tooltip="Filter by event status">
          <Select mode="multiple" placeholder="Select status" allowClear>
            {Object.entries(EVENT_STATUS_LABELS).map(([value, label]) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="priority"
          label="Priority"
          tooltip="Filter by priority level">
          <Select mode="multiple" placeholder="Select priority" allowClear>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Divider />

        <Form.Item
          name="dateRange"
          label="Date Range"
          tooltip="Filter events within a date range">
          <RangePicker style={{ width: "100%" }} format="MMMM DD, YYYY" />
        </Form.Item>

        <Divider />

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">
            <strong>Active Filters:</strong>
          </div>
          <div className="space-y-1 text-xs">
            {filters?.types?.length > 0 && (
              <div>Types: {filters.types.length} selected</div>
            )}
            {filters?.status?.length > 0 && (
              <div>Status: {filters.status.length} selected</div>
            )}
            {filters?.priority?.length > 0 && (
              <div>Priority: {filters.priority.length} selected</div>
            )}
            {filters?.dateRange && <div>Date range: Custom range</div>}
            {!filters?.types?.length &&
              !filters?.status?.length &&
              !filters?.priority?.length &&
              !filters?.dateRange && (
                <div className="text-gray-400">No filters applied</div>
              )}
          </div>
        </div>
      </Form>
    </Drawer>
  );
};

export default CalendarFilters;
