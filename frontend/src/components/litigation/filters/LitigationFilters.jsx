// components/litigation/filters/LitigationFilters.jsx
import { useState, useEffect } from "react";
import { Form, Input, Select, Button, Row, Col, Popover, Badge } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  CloseOutlined,
} from "@ant-design/icons";

const { Option } = Select;

const LitigationFilters = ({
  onFilter,
  onClear,
  loading,
  initialValues = {},
}) => {
  const [form] = Form.useForm();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const handleSubmit = (values) => {
    const filters = Object.fromEntries(
      Object.entries(values).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined,
      ),
    );
    onFilter(filters);
    setDrawerOpen(false);
  };

  const handleReset = () => {
    form.resetFields();
    onClear();
    setDrawerOpen(false);
  };

  const activeFilterCount = Object.values(initialValues).filter(
    (v) => v && v !== "",
  ).length;

  const filterContent = (
    <div className="w-[320px] sm:w-[400px]">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <span className="font-semibold text-slate-800">Filter Matters</span>
        {activeFilterCount > 0 && (
          <Badge
            count={activeFilterCount}
            style={{ backgroundColor: "#6366f1" }}
          />
        )}
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="litigation-filters">
        <Row gutter={[12, 12]}>
          <Col xs={24}>
            <Form.Item name="search" className="!mb-0">
              <Input
                placeholder="Search by suit no, title, client..."
                prefix={<SearchOutlined className="text-slate-400" />}
                allowClear
                size="large"
                className="rounded-lg"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="courtName" label="Court" className="!mb-3">
              <Select
                allowClear
                placeholder="Select court"
                size="large"
                className="w-full [&_.ant-select-selector]:rounded-lg">
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

          <Col xs={24} sm={12}>
            <Form.Item name="currentStage" label="Stage" className="!mb-3">
              <Select
                allowClear
                placeholder="Select stage"
                size="large"
                className="w-full [&_.ant-select-selector]:rounded-lg">
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

          <Col xs={24} sm={12}>
            <Form.Item name="status" label="Matter Status" className="!mb-3">
              <Select
                allowClear
                placeholder="Select status"
                size="large"
                className="w-full [&_.ant-select-selector]:rounded-lg">
                <Option value="active">Active</Option>
                <Option value="pending">Pending</Option>
                <Option value="completed">Completed</Option>
                <Option value="closed">Closed</Option>
                <Option value="cancelled">Cancelled</Option>
                <Option value="on-hold">On Hold</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="suitNo" label="Suit Number" className="!mb-3">
              <Input
                placeholder="e.g., HCL/2026/001"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="judge" label="Judge" className="!mb-3">
              <Input
                placeholder="Judge name"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="year" label="Filing Year" className="!mb-3">
              <Select
                allowClear
                placeholder="Select year"
                size="large"
                className="w-full [&_.ant-select-selector]:rounded-lg">
                {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((year) => (
                  <Option key={year} value={year}>
                    {year}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="hasDetail" label="Setup Status" className="!mb-3">
              <Select
                allowClear
                placeholder="Select status"
                size="large"
                className="w-full [&_.ant-select-selector]:rounded-lg">
                <Option value="true">Setup Complete</Option>
                <Option value="false">Pending Setup</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
          <Button onClick={handleReset} size="large">
            Clear All
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            className="bg-indigo-600 hover:bg-indigo-700 border-indigo-600">
            Apply Filters
          </Button>
        </div>
      </Form>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      {/* Search Input - Always Visible */}
      <Form form={form} layout="vertical" className="!mb-0">
        <Form.Item name="search" className="!mb-0">
          <Input
            placeholder="Search matters..."
            prefix={<SearchOutlined className="text-slate-400" />}
            allowClear
            onPressEnter={(e) => {
              const value = e.target.value;
              if (value) {
                onFilter({ search: value });
              } else {
                onClear();
              }
            }}
            className="w-[200px] lg:w-[280px] rounded-lg"
            size="large"
          />
        </Form.Item>
      </Form>

      {/* Filter Popover - Closed by default, opens on click */}
      <Popover
        content={filterContent}
        trigger="click"
        placement="bottomRight"
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        overlayClassName="filter-popover"
        overlayStyle={{ padding: 0 }}>
        <Button
          size="large"
          className={`flex items-center gap-2 rounded-lg border-slate-200 ${
            activeFilterCount > 0
              ? "bg-indigo-50 border-indigo-300 text-indigo-600"
              : "bg-white hover:bg-slate-50"
          }`}
          icon={<FilterOutlined />}>
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </Popover>

      {/* Clear button when filters active */}
      {activeFilterCount > 0 && (
        <Button
          size="large"
          onClick={handleReset}
          icon={<CloseOutlined />}
          className="rounded-lg border-slate-200 text-slate-500 hover:text-red-500">
          <span className="hidden lg:inline">Clear</span>
        </Button>
      )}
    </div>
  );
};

export default LitigationFilters;
