import React, { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Input,
  Button,
  Space,
  Tag,
  Collapse,
  Spin,
} from "antd";
import {
  FilterOutlined,
  SearchOutlined,
  ClearOutlined,
  CalendarOutlined,
  UserOutlined,
  FileTextOutlined,
  TagOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import apiService from "../services/api";

import {
  fetchTasks,
  setTaskFilters,
  clearTaskFilters,
  selectTaskFilters,
  selectTaskLoading,
} from "../redux/features/task/taskSlice";

import useUserSelectOptions from "../hooks/useUserSelectOptions";

const { Option } = Select;
const { RangePicker } = DatePicker;

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "default" },
  { value: "in-progress", label: "In Progress", color: "processing" },
  { value: "under-review", label: "Under Review", color: "orange" },
  { value: "completed", label: "Completed", color: "success" },
  { value: "rejected", label: "Rejected", color: "error" },
  { value: "overdue", label: "Overdue", color: "red" },
  { value: "cancelled", label: "Cancelled", color: "default" },
];

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent", color: "red" },
  { value: "high", label: "High", color: "orange" },
  { value: "medium", label: "Medium", color: "blue" },
  { value: "low", label: "Low", color: "default" },
];

const CATEGORY_OPTIONS = [
  { value: "legal-research", label: "Legal Research" },
  { value: "document-drafting", label: "Document Drafting" },
  { value: "client-meeting", label: "Client Meeting" },
  { value: "court-filing", label: "Court Filing" },
  { value: "discovery", label: "Discovery" },
  { value: "correspondence", label: "Correspondence" },
  { value: "administrative", label: "Administrative" },
  { value: "other", label: "Other" },
];

const MATTER_TYPE_OPTIONS = [
  { value: "litigation", label: "Litigation" },
  { value: "corporate", label: "Corporate" },
  { value: "property", label: "Property" },
  { value: "advisory", label: "Advisory" },
  { value: "retainer", label: "Retainer" },
  { value: "general", label: "General" },
];

const TaskFilters = ({ onFilterChange, showAdvanced = true }) => {
  const dispatch = useDispatch();
  const filters = useSelector(selectTaskFilters);
  const loading = useSelector(selectTaskLoading);

  const { data: userOptions, loading: usersLoading } = useUserSelectOptions({
    type: "all",
    autoFetch: true,
  });

  const [matterSearchLoading, setMatterSearchLoading] = useState(false);
  const [matterOptions, setMatterOptions] = useState([]);

  const searchMatters = useCallback(async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setMatterOptions([]);
      return;
    }

    setMatterSearchLoading(true);
    try {
      const response = await apiService.get("/matters", {
        search: searchText,
        limit: 20,
        status: "active",
      });

      const matters = response.data?.data || [];
      setMatterOptions(
        matters.map((m) => ({
          _id: m._id,
          value: m._id,
          label: m.title || m.matterNumber,
          subtitle: `${m.matterType} • ${m.matterNumber}`,
        })),
      );
    } catch (error) {
      console.error("Failed to search matters:", error);
    } finally {
      setMatterSearchLoading(false);
    }
  }, []);

  const handleFilterChange = useCallback(
    (key, value) => {
      dispatch(setTaskFilters({ [key]: value }));
      onFilterChange?.({ [key]: value });
    },
    [dispatch, onFilterChange],
  );

  const handleDateRangeChange = useCallback(
    (dates) => {
      if (dates && dates[0] && dates[1]) {
        dispatch(
          setTaskFilters({
            startDate: dates[0].toISOString(),
            endDate: dates[1].toISOString(),
          }),
        );
        onFilterChange?.({
          startDate: dates[0].toISOString(),
          endDate: dates[1].toISOString(),
        });
      } else {
        dispatch(setTaskFilters({ startDate: "", endDate: "" }));
        onFilterChange?.({ startDate: "", endDate: "" });
      }
    },
    [dispatch, onFilterChange],
  );

  const handleClearFilters = useCallback(() => {
    dispatch(clearTaskFilters());
    onFilterChange?.({});
  }, [dispatch, onFilterChange]);

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== "" && v !== undefined && v !== null,
  );

  const filterItems = [
    {
      key: "basic",
      label: "Basic Filters",
      children: (
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search tasks..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Status"
              value={filters.status}
              onChange={(v) => handleFilterChange("status", v)}
              allowClear
              className="w-full">
              {STATUS_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  <Tag color={opt.color}>{opt.label}</Tag>
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Priority"
              value={filters.priority}
              onChange={(v) => handleFilterChange("priority", v)}
              allowClear
              className="w-full">
              {PRIORITY_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  <Tag color={opt.color}>{opt.label}</Tag>
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Category"
              value={filters.category}
              onChange={(v) => handleFilterChange("category", v)}
              allowClear
              className="w-full">
              {CATEGORY_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      ),
    },
  ];

  if (showAdvanced) {
    filterItems.push({
      key: "advanced",
      label: "Advanced Filters",
      children: (
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Assigned To"
              value={filters.assignedTo}
              onChange={(v) => handleFilterChange("assignedTo", v)}
              allowClear
              loading={usersLoading}
              showSearch
              className="w-full"
              optionFilterProp="children">
              {userOptions?.map((user) => (
                <Option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Matter Type"
              value={filters.matterType}
              onChange={(v) => handleFilterChange("matterType", v)}
              allowClear
              className="w-full">
              {MATTER_TYPE_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Linked Matter"
              value={filters.matterId}
              onChange={(v) => handleFilterChange("matterId", v)}
              onSearch={searchMatters}
              filterOption={false}
              allowClear
              loading={matterSearchLoading}
              showSearch
              className="w-full"
              dropdownRender={(menu) =>
                matterSearchLoading ? (
                  <div className="p-4 text-center">
                    <Spin size="small" />
                  </div>
                ) : (
                  menu
                )
              }>
              {matterOptions.map((matter) => (
                <Option
                  key={matter._id}
                  value={matter._id}
                  label={matter.label}>
                  <div>
                    <div className="font-medium">{matter.label}</div>
                    <div className="text-xs text-gray-500">
                      {matter.subtitle}
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={
                filters.startDate && filters.endDate
                  ? [dayjs(filters.startDate), dayjs(filters.endDate)]
                  : null
              }
              onChange={handleDateRangeChange}
              className="w-full"
              placeholder={["Start Date", "End Date"]}
            />
          </Col>
        </Row>
      ),
    });
  }

  return (
    <Card size="small" className="mb-4" styles={{ body: { padding: filters } }}>
      <Collapse
        defaultActiveKey={showAdvanced ? [] : ["basic"]}
        ghost
        items={filterItems}
      />

      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
          <Button
            icon={<ClearOutlined />}
            onClick={handleClearFilters}
            size="small">
            Clear All Filters
          </Button>
        </div>
      )}
    </Card>
  );
};

export default TaskFilters;
