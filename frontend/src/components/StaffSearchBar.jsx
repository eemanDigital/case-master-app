// components/StaffSearchBar.js
import { useState, useEffect } from "react";
import { Input, Select, Button, Space, Form, Row, Col, Card } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Search } = Input;
const { Option } = Select;

/**
 * StaffSearchBar
 * A reusable, user-specific search and filter component.
 */
const StaffSearchBar = ({
  onFiltersChange,
  filters = {},
  loading = false,
  searchPlaceholder = "Search...",
  showUserFilters = true,
  hideFields = false,
}) => {
  const [form] = Form.useForm();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sync external filters with form
  useEffect(() => {
    form.setFieldsValue(filters);
  }, [filters, form]);

  /** 🔍 Basic search handler */
  const handleSearch = (value) => onFiltersChange({ search: value });

  /** 🧩 Advanced filters submission */
  const handleAdvancedSearch = (values) => {
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== undefined && v !== "")
    );
    onFiltersChange(cleaned);
    setShowAdvanced(false);
  };

  /** ♻️ Reset all filters */
  const resetFilters = () => {
    form.resetFields();
    onFiltersChange({});
    setShowAdvanced(false);
  };

  /** Check if any filter is active */
  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== ""
  );

  return (
    <Card size="small" className="mb-4 rounded-xl shadow-sm">
      <Row gutter={[16, 16]} align="middle">
        {/* Search Bar */}
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

        {/* Filter & Reset Buttons */}
        <Col xs={24} md={8}>
          <Space className="w-full justify-end">
            <Button
              icon={<FilterOutlined />}
              type={
                showAdvanced
                  ? "primary"
                  : hasActiveFilters
                  ? "dashed"
                  : "default"
              }
              onClick={() => setShowAdvanced(!showAdvanced)}>
              Filters {hasActiveFilters && `(${Object.keys(filters).length})`}
            </Button>

            {hasActiveFilters && (
              <Button
                icon={<ReloadOutlined />}
                danger
                size="large"
                onClick={resetFilters}>
                Clear
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {/* Advanced Filters Section */}
      {showAdvanced && showUserFilters && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <Form form={form} layout="vertical" onFinish={handleAdvancedSearch}>
            <Row gutter={[16, 16]}>
              {!hideFields && (
                <>
                  {/* Role */}
                  <Col xs={24} md={8}>
                    <Form.Item label="Role" name="role">
                      <Select placeholder="Select role" allowClear>
                        {[
                          "super-admin",
                          "admin",
                          "hr",
                          "secretary",
                          "lawyer",
                          "client",
                          "user",
                        ].map((role) => (
                          <Option key={role} value={role}>
                            {role
                              .replace("-", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  {/* Position */}
                  <Col xs={24} md={8}>
                    <Form.Item label="Position" name="position">
                      <Select placeholder="Select position" allowClear>
                        {[
                          "Principal",
                          "Managing Partner",
                          "Head of Chambers",
                          "Senior Associate",
                          "Associate",
                          "Junior Associate",
                          "Counsel",
                          "Intern",
                          "Secretary",
                          "Para-legal",
                          "Other",
                        ].map((pos) => (
                          <Option key={pos} value={pos}>
                            {pos}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  {/* Is Lawyer */}
                  <Col xs={24} md={8}>
                    <Form.Item label="Is Lawyer" name="isLawyer">
                      <Select placeholder="Select lawyer status" allowClear>
                        <Option value="true">Yes</Option>
                        <Option value="false">No</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  {/* Gender */}
                  <Col xs={24} md={8}>
                    <Form.Item label="Gender" name="gender">
                      <Select placeholder="Select gender" allowClear>
                        <Option value="male">Male</Option>
                        <Option value="female">Female</Option>
                      </Select>
                    </Form.Item>
                  </Col>{" "}
                </>
              )}

              {/* Status */}
              <Col xs={24} md={8}>
                <Form.Item label="Status" name="isActive">
                  <Select placeholder="Select status" allowClear>
                    <Option value="true">Active</Option>
                    <Option value="false">Inactive</Option>
                  </Select>
                </Form.Item>
              </Col>
              {/* Sort By */}
              <Col xs={24} md={8}>
                <Form.Item label="Sort By" name="sort">
                  <Select placeholder="Select sort order" allowClear>
                    <Option value="firstName">First Name (A–Z)</Option>
                    <Option value="-firstName">First Name (Z–A)</Option>
                    <Option value="lastName">Last Name (A–Z)</Option>
                    <Option value="-lastName">Last Name (Z–A)</Option>
                    <Option value="-createdAt">Newest First</Option>
                    <Option value="createdAt">Oldest First</Option>
                    <Option value="position">Position (A–Z)</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* Footer Buttons */}
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
  );
};

export default StaffSearchBar;
