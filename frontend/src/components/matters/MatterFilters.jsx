import React, { memo, useState } from "react";
import {
  Form,
  Select,
  Input,
  DatePicker,
  Button,
  Space,
  Row,
  Col,
  Card,
  Collapse,
} from "antd";
import {
  FilterOutlined,
  SearchOutlined,
  ClearOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { MATTER_CONFIG } from "../../config/matterConfig";
import UserSelect from "../UserSelect";

const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const MatterFilters = memo(
  ({
    onFilter,
    onClear,
    initialFilters = {},
    loading = false,
    showAdvanced = false,
  }) => {
    const [form] = Form.useForm();
    const [showMoreFilters, setShowMoreFilters] = useState(showAdvanced);

    const handleSubmit = (values) => {
      const filters = {};

      // Basic filters
      if (values.search) filters.search = values.search;
      if (values.matterType) filters.matterType = values.matterType;
      if (values.status) filters.status = values.status;
      if (values.priority) filters.priority = values.priority;
      if (values.client) filters.client = values.client;
      if (values.accountOfficer) filters.accountOfficer = values.accountOfficer;

      // Date filters
      if (values.dateRange) {
        filters.startDate = values.dateRange[0].toISOString();
        filters.endDate = values.dateRange[1].toISOString();
      }

      onFilter(filters);
    };

    const handleClear = () => {
      form.resetFields();
      onClear?.();
    };

    return (
      <Card className="mb-6" bodyStyle={{ padding: "16px" }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={initialFilters}>
          <Row gutter={[16, 16]}>
            {/* Quick Search */}
            <Col xs={24} md={12} lg={8}>
              <Form.Item name="search" label="Search">
                <Input
                  placeholder="Search by title, matter number..."
                  prefix={<SearchOutlined />}
                  allowClear
                />
              </Form.Item>
            </Col>

            {/* Matter Type */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="matterType" label="Matter Type">
                <Select
                  placeholder="All Types"
                  options={MATTER_CONFIG.MATTER_TYPES}
                  allowClear
                />
              </Form.Item>
            </Col>

            {/* Status */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="status" label="Status">
                <Select
                  placeholder="All Status"
                  options={MATTER_CONFIG.STATUS_OPTIONS}
                  allowClear
                />
              </Form.Item>
            </Col>

            {/* Toggle Advanced Filters */}
            <Col xs={24} className="flex justify-end">
              <Button
                type="link"
                icon={showMoreFilters ? <UpOutlined /> : <DownOutlined />}
                onClick={() => setShowMoreFilters(!showMoreFilters)}>
                {showMoreFilters ? "Hide Advanced" : "Show Advanced"}
              </Button>
            </Col>
          </Row>

          {/* Advanced Filters (Collapsible) */}
          <Collapse
            activeKey={showMoreFilters ? "advanced" : []}
            bordered={false}
            className="bg-transparent">
            <Panel
              key="advanced"
              header={null}
              showArrow={false}
              className="!border-0 !p-0">
              <Row gutter={[16, 16]} className="mt-4">
                {/* Priority */}
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="priority" label="Priority">
                    <Select
                      placeholder="All Priorities"
                      options={MATTER_CONFIG.PRIORITY_OPTIONS}
                      allowClear
                    />
                  </Form.Item>
                </Col>

                {/* Client */}
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="client" label="Client">
                    <UserSelect placeholder="Select Client" userType="client" />
                  </Form.Item>
                </Col>

                {/* Account Officer */}
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="accountOfficer" label="Account Officer">
                    <UserSelect
                      placeholder="Select Account Officer"
                      userType="staff"
                      mode="multiple"
                    />
                  </Form.Item>
                </Col>

                {/* Date Range */}
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="dateRange" label="Date Range">
                    <RangePicker className="w-full" />
                  </Form.Item>
                </Col>

                {/* Category */}
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="category" label="Category">
                    <Select
                      placeholder="All Categories"
                      options={MATTER_CONFIG.CATEGORIES}
                      allowClear
                    />
                  </Form.Item>
                </Col>

                {/* Nature of Matter */}
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item name="natureOfMatter" label="Nature of Matter">
                    <Select
                      placeholder="Select Nature"
                      options={Object.values(
                        MATTER_CONFIG.NATURE_OF_MATTER,
                      ).flat()}
                      allowClear
                      showSearch
                      filterOption={(input, option) =>
                        option.label.toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Panel>
          </Collapse>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              onClick={handleClear}
              icon={<ClearOutlined />}
              disabled={loading}>
              Clear All
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<FilterOutlined />}
              loading={loading}>
              Apply Filters
            </Button>
          </div>
        </Form>
      </Card>
    );
  },
);

MatterFilters.displayName = "MatterFilters";

export default MatterFilters;
