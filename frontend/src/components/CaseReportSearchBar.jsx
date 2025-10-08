// components/CaseReportSearchBar.js - Fixed reset functionality
import { useState, useEffect } from "react";
import {
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Form,
  Row,
  Col,
  Card,
  Tag,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { Typography } from "antd";

const { Text } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;

const CaseReportSearchBar = ({
  onFiltersChange,
  filters = {},
  loading = false,
  searchPlaceholder = "Search reports...",
  showCaseSearch = true,
}) => {
  const [form] = Form.useForm();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || "");

  // Sync form with current filters whenever they change
  useEffect(() => {
    const formValues = {};

    // Handle search input
    setSearchValue(filters.search || "");

    // Handle date range conversion
    if (filters.startDate && filters.endDate) {
      formValues.dateRange = [
        moment(filters.startDate),
        moment(filters.endDate),
      ];
    }

    // Handle other form fields
    if (filters.caseSearch) formValues.caseSearch = filters.caseSearch;
    if (filters.adjournedFor) formValues.adjournedFor = filters.adjournedFor;
    if (filters.sort) formValues.sort = filters.sort;

    // Set form values
    form.setFieldsValue(formValues);
  }, [filters, form]);

  // Handle basic search
  const handleSearch = (value) => {
    const newFilters = { ...filters, search: value };
    // Remove search if empty
    if (!value) {
      delete newFilters.search;
    }
    onFiltersChange(newFilters);
  };

  // Handle search input change (for controlled input)
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    // If user clears the input, remove search filter immediately
    if (!value && filters.search) {
      const newFilters = { ...filters };
      delete newFilters.search;
      onFiltersChange(newFilters);
    }
  };

  // Handle advanced search form submission
  const handleAdvancedSearch = (values) => {
    const newFilters = { ...filters };

    // Handle date range
    if (values.dateRange && values.dateRange[0] && values.dateRange[1]) {
      newFilters.startDate = values.dateRange[0].format("YYYY-MM-DD");
      newFilters.endDate = values.dateRange[1].format("YYYY-MM-DD");
    } else {
      delete newFilters.startDate;
      delete newFilters.endDate;
    }

    // Handle other filters
    if (values.caseSearch) {
      newFilters.caseSearch = values.caseSearch;
    } else {
      delete newFilters.caseSearch;
    }

    if (values.adjournedFor) {
      newFilters.adjournedFor = values.adjournedFor;
    } else {
      delete newFilters.adjournedFor;
    }

    if (values.sort) {
      newFilters.sort = values.sort;
    } else {
      delete newFilters.sort;
    }

    onFiltersChange(newFilters);
    setShowAdvanced(false);
  };

  // Reset all filters
  const resetFilters = () => {
    // Clear all filters in parent component
    onFiltersChange({});

    // Reset local form state
    form.resetFields();
    setSearchValue("");
    setShowAdvanced(false);
  };

  // Remove individual filter
  const removeFilter = (key) => {
    const newFilters = { ...filters };

    // Handle special cases
    if (key === "dateRange" || key === "startDate" || key === "endDate") {
      delete newFilters.startDate;
      delete newFilters.endDate;
      form.setFieldsValue({ dateRange: undefined });
    } else if (key === "search") {
      delete newFilters.search;
      setSearchValue("");
    } else {
      delete newFilters[key];
      form.setFieldsValue({ [key]: undefined });
    }

    onFiltersChange(newFilters);
  };

  // Check if any filter is active
  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key];
    return value !== undefined && value !== "" && value !== null;
  });

  // Get active filters for display (excluding internal keys)
  const getActiveFilters = () => {
    const activeFilters = [];
    Object.keys(filters).forEach((key) => {
      if (filters[key] && key !== "limit" && key !== "page") {
        // Handle date range as a single filter
        if (key === "startDate" && filters.endDate) {
          activeFilters.push({
            key: "dateRange",
            value: `${filters.startDate} to ${filters.endDate}`,
          });
        } else if (key === "endDate") {
          // Skip endDate as it's shown with startDate
          return;
        } else {
          activeFilters.push({ key, value: filters[key] });
        }
      }
    });
    return activeFilters;
  };

  return (
    <div className="advanced-search-bar">
      <Card size="small" className="mb-4">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <Search
              placeholder={searchPlaceholder}
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              onChange={handleSearchChange}
              value={searchValue}
              loading={loading}
              className="w-full"
            />
          </Col>

          <Col xs={24} md={8}>
            <Space className="w-full justify-end">
              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowAdvanced(!showAdvanced)}
                type={
                  showAdvanced
                    ? "primary"
                    : hasActiveFilters
                    ? "dashed"
                    : "default"
                }>
                Filters {hasActiveFilters && `(${getActiveFilters().length})`}
              </Button>

              {hasActiveFilters && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={resetFilters}
                  danger
                  size="large">
                  Clear
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* Advanced Filters Section */}
        {showAdvanced && (
          <div className="advanced-filters mt-4 p-4 border rounded-lg bg-gray-50">
            <Form form={form} layout="vertical" onFinish={handleAdvancedSearch}>
              <Row gutter={[16, 16]}>
                {/* CASE SEARCH FILTER */}
                {showCaseSearch && (
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Search by Case"
                      name="caseSearch"
                      tooltip="Search by case name, party names, or suit number">
                      <Input
                        placeholder="e.g., John vs Smith or 123/2024"
                        allowClear
                      />
                    </Form.Item>
                  </Col>
                )}

                <Col xs={24} md={12}>
                  <Form.Item label="Date Range" name="dateRange">
                    <RangePicker className="w-full" format="YYYY-MM-DD" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Adjourned For" name="adjournedFor">
                    <Input
                      placeholder="Filter by adjourned reason"
                      allowClear
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Sort By" name="sort">
                    <Select placeholder="Select sort order" allowClear>
                      <Select.Option value="-date">Newest First</Select.Option>
                      <Select.Option value="date">Oldest First</Select.Option>
                      <Select.Option value="-adjournedDate">
                        Next Hearing (Latest)
                      </Select.Option>
                      <Select.Option value="adjournedDate">
                        Next Hearing (Earliest)
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row justify="end">
                <Space>
                  <Button
                    onClick={() => setShowAdvanced(false)}
                    icon={<CloseOutlined />}>
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Apply Filters
                  </Button>
                </Space>
              </Row>
            </Form>
          </div>
        )}
      </Card>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="active-filters mb-4">
          <Space wrap>
            <Text type="secondary">Active filters:</Text>
            {getActiveFilters().map((filter) => {
              const { key, value } = filter;
              let displayText = "";

              // Format display text based on filter type
              if (key === "search") {
                displayText = `Search: ${value}`;
              } else if (key === "caseSearch") {
                displayText = `Case: ${value}`;
              } else if (key === "dateRange") {
                displayText = `Date: ${value}`;
              } else if (key === "adjournedFor") {
                displayText = `Adjourned For: ${value}`;
              } else if (key === "sort") {
                const sortLabels = {
                  "-date": "Newest First",
                  date: "Oldest First",
                  "-adjournedDate": "Next Hearing (Latest)",
                  adjournedDate: "Next Hearing (Earliest)",
                };
                displayText = `Sort: ${sortLabels[value] || value}`;
              } else {
                displayText = `${key}: ${value}`;
              }

              return (
                <Tag
                  key={key}
                  closable
                  onClose={() => removeFilter(key)}
                  className="bg-blue-100 border-blue-300">
                  {displayText}
                </Tag>
              );
            })}
            <Button
              type="link"
              size="small"
              onClick={resetFilters}
              icon={<ReloadOutlined />}
              className="p-0 h-auto">
              Clear all
            </Button>
          </Space>
        </div>
      )}
    </div>
  );
};

export default CaseReportSearchBar;
