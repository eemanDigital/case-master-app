// components/litigation/filters/LitigationFilters.jsx
import { useState, useEffect } from "react";
import { Form, Input, Select, Button, Space, Row, Col, Tooltip } from "antd";
import {
  SearchOutlined,
  ClearOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";

const { Option } = Select;

const LitigationFilters = ({
  onFilter,
  onClear,
  loading,
  initialValues = {},
  compact = false,
  onToggleVisibility,
}) => {
  const [form] = Form.useForm();
  const [isExpanded, setIsExpanded] = useState(!compact);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const handleSubmit = (values) => {
    // Remove empty values
    const filters = Object.fromEntries(
      Object.entries(values).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined,
      ),
    );
    onFilter(filters);
  };

  const handleReset = () => {
    form.resetFields();
    onClear();
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggleVisibility?.();
  };

  const activeFilterCount = Object.values(initialValues).filter(
    (v) => v && v !== "",
  ).length;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      className="litigation-filters">
      {/* Search Row - Always Visible */}
      <div className="flex items-center gap-2">
        <Form.Item name="search" className="!mb-0 flex-1">
          <Input
            placeholder="Search by suit no, title, client..."
            prefix={<SearchOutlined className="text-gray-400" />}
            allowClear
            className="w-full"
          />
        </Form.Item>

        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="bg-indigo-600 hover:bg-indigo-700 border-indigo-600">
            Search
          </Button>

          <Tooltip title={isExpanded ? "Hide filters" : "Show filters"}>
            <Button
              icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
              onClick={handleToggle}
              className="text-gray-600"
            />
          </Tooltip>

          {activeFilterCount > 0 && (
            <Tooltip title="Clear all filters">
              <Button
                icon={<ClearOutlined />}
                onClick={handleReset}
                className="text-gray-600"
              />
            </Tooltip>
          )}
        </Space>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="courtName" label="Court">
                <Select
                  allowClear
                  placeholder="Select court"
                  className="[&_.ant-select-selector]:rounded-lg">
                  <Option value="high court">High Court</Option>
                  <Option value="magistrate court">Magistrate Court</Option>
                  <Option value="court of appeal">Court of Appeal</Option>
                  <Option value="supreme court">Supreme Court</Option>
                  <Option value="federal high court">Federal High Court</Option>
                  <Option value="sharia court of appeal">
                    Sharia Court of Appeal
                  </Option>
                  <Option value="customary court of appeal">
                    Customary Court of Appeal
                  </Option>
                  <Option value="national industrial court">
                    National Industrial Court
                  </Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="currentStage" label="Stage">
                <Select
                  allowClear
                  placeholder="Select stage"
                  className="[&_.ant-select-selector]:rounded-lg">
                  <Option value="filing">Filing</Option>
                  <Option value="pre-trial">Pre-Trial</Option>
                  <Option value="trial">Trial</Option>
                  <Option value="post-trial">Post-Trial</Option>
                  <Option value="judgment">Judgment</Option>
                  <Option value="appeal">Appeal</Option>
                  <Option value="settled">Settled</Option>
                  <Option value="enforcement">Enforcement</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="status" label="Matter Status">
                <Select
                  allowClear
                  placeholder="Select status"
                  className="[&_.ant-select-selector]:rounded-lg">
                  <Option value="active">Active</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="completed">Completed</Option>
                  <Option value="closed">Closed</Option>
                  <Option value="cancelled">Cancelled</Option>
                  <Option value="on-hold">On Hold</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="suitNo" label="Suit Number">
                <Input placeholder="e.g., HCL/2026/001" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="judge" label="Judge">
                <Input placeholder="Judge name" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="year" label="Filing Year">
                <Select
                  allowClear
                  placeholder="Select year"
                  className="[&_.ant-select-selector]:rounded-lg">
                  {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((year) => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="hasDetail" label="Setup Status">
                <Select
                  allowClear
                  placeholder="Select status"
                  className="[&_.ant-select-selector]:rounded-lg">
                  <Option value="true">Setup Complete</Option>
                  <Option value="false">Pending Setup</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={24} md={24} lg={24}>
              <div className="flex justify-end">
                <Button onClick={handleReset} className="mr-2">
                  Clear All
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 border-indigo-600">
                  Apply Filters
                </Button>
              </div>
            </Col>
          </Row>
        </div>
      )}
    </Form>
  );
};

export default LitigationFilters;
