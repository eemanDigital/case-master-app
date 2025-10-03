import moment from "moment";
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
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  CloseOutlined,
} from "@ant-design/icons";

const { Search } = Input;
const { RangePicker } = DatePicker;

const AdvancedSearchBar = ({
  onFiltersChange,
  filters = {},
  loading = false,
  searchPlaceholder = "Search...",
  showCaseSearch = true,
  showDateFilter = true,
}) => {
  const [form] = Form.useForm();
  const [showAdvanced, setShowAdvanced] = useState(false);

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
                {/* Case-specific filters */}
                <Col xs={24} md={8}>
                  <Form.Item label="Status" name="caseStatus">
                    <Select placeholder="Select status" allowClear>
                      <Select.Option value="pending">Pending</Select.Option>
                      <Select.Option value="active">Active</Select.Option>
                      <Select.Option value="closed">Closed</Select.Option>
                      <Select.Option value="decided">Decided</Select.Option>
                      <Select.Option value="settled">Settled</Select.Option>
                      <Select.Option value="lost">Lost</Select.Option>
                      <Select.Option value="won">Won</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item label="Category" name="category">
                    <Select placeholder="Select category" allowClear>
                      <Select.Option value="civil">Civil</Select.Option>
                      <Select.Option value="criminal">Criminal</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item label="Priority" name="casePriority">
                    <Select placeholder="Select priority" allowClear>
                      <Select.Option value="low">Low</Select.Option>
                      <Select.Option value="medium">Medium</Select.Option>
                      <Select.Option value="high">High</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item label="Court" name="courtName">
                    <Select placeholder="Select court" allowClear>
                      <Select.Option value="supreme court">
                        Supreme Court
                      </Select.Option>
                      <Select.Option value="court of appeal">
                        Court of Appeal
                      </Select.Option>
                      <Select.Option value="high court">
                        High Court
                      </Select.Option>
                      <Select.Option value="federal high court">
                        Federal High Court
                      </Select.Option>
                      <Select.Option value="magistrate court">
                        Magistrate Court
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                {showDateFilter && (
                  <Col xs={24} md={8}>
                    <Form.Item label="Filing Date Range" name="dateRange">
                      <RangePicker className="w-full" format="YYYY-MM-DD" />
                    </Form.Item>
                  </Col>
                )}

                <Col xs={24} md={8}>
                  <Form.Item label="Sort By" name="sort">
                    <Select placeholder="Select sort order" allowClear>
                      <Select.Option value="-filingDate">
                        Newest First
                      </Select.Option>
                      <Select.Option value="filingDate">
                        Oldest First
                      </Select.Option>
                      <Select.Option value="casePriority">
                        Priority (High to Low)
                      </Select.Option>
                      <Select.Option value="-casePriority">
                        Priority (Low to High)
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row justify="end">
                <Space>
                  <Button onClick={() => setShowAdvanced(false)}>Cancel</Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Apply Filters
                  </Button>
                </Space>
              </Row>
            </Form>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdvancedSearchBar;
