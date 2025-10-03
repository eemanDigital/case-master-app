// components/AdvancedSearchBar.js - Add case search
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
  AutoComplete,
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

const AdvancedSearchBar = ({
  onFiltersChange,
  filters = {},
  loading = false,
  searchPlaceholder = "Search reports...",
  showCaseSearch = true, // Enable case search
}) => {
  const [form] = Form.useForm();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [caseOptions, setCaseOptions] = useState([]);

  // Sync form with current filters
  useEffect(() => {
    const formValues = { ...filters };

    if (filters.startDate || filters.endDate) {
      formValues.dateRange = [
        filters.startDate ? moment(filters.startDate) : null,
        filters.endDate ? moment(filters.endDate) : null,
      ];
    }

    form.setFieldsValue(formValues);
  }, [filters, form]);

  // Search for cases (you might want to implement this with an API call)
  const handleCaseSearch = async (searchText) => {
    if (searchText) {
      // This would typically call your cases API to get matching cases
      // For now, we'll use a simple implementation
      setCaseOptions([
        { value: "Case: John vs Smith (Suit No: 123/2024)" },
        { value: "Case: ABC Corp vs XYZ Ltd (Suit No: 456/2024)" },
      ]);
    }
  };

  const handleSearch = (value) => {
    onFiltersChange({ search: value });
  };

  const handleAdvancedSearch = (values) => {
    const newFilters = { ...values };

    // Handle date range
    if (values.dateRange && values.dateRange[0] && values.dateRange[1]) {
      newFilters.startDate = values.dateRange[0].format("YYYY-MM-DD");
      newFilters.endDate = values.dateRange[1].format("YYYY-MM-DD");
    } else {
      delete newFilters.startDate;
      delete newFilters.endDate;
    }

    // Handle case search
    if (values.caseSearch) {
      newFilters.caseSearch = values.caseSearch;
    } else {
      delete newFilters.caseSearch;
    }

    delete newFilters.dateRange;

    // Remove empty values
    Object.keys(newFilters).forEach((key) => {
      if (
        newFilters[key] === undefined ||
        newFilters[key] === "" ||
        newFilters[key] === null
      ) {
        delete newFilters[key];
      }
    });

    onFiltersChange(newFilters);
    setShowAdvanced(false);
  };

  const resetFilters = () => {
    form.resetFields();
    onFiltersChange({});
    setShowAdvanced(false);
  };

  const hasActiveFilters = Object.keys(filters).some(
    (key) =>
      filters[key] !== undefined && filters[key] !== "" && filters[key] !== null
  );

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
              loading={loading}
              defaultValue={filters.search}
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
                Filters {hasActiveFilters && `(${Object.keys(filters).length})`}
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
                        onChange={(e) => handleCaseSearch(e.target.value)}
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
            {Object.keys(filters).map(
              (key) =>
                filters[key] && (
                  <Tag
                    key={key}
                    closable
                    onClose={() => {
                      const newFilters = { ...filters };
                      delete newFilters[key];
                      onFiltersChange(newFilters);
                    }}
                    className="bg-blue-100">
                    {key === "caseSearch"
                      ? `Case: ${filters[key]}`
                      : `${key}: ${filters[key]}`}
                  </Tag>
                )
            )}
          </Space>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchBar;
