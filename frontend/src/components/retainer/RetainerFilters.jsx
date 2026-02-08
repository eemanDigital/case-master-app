import React, { useState } from "react";
import {
  Card,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  Row,
  Col,
} from "antd";
import {
  FilterOutlined,
  CloseOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * RetainerFilters Component
 * Advanced filtering for retainer list
 */
const RetainerFilters = ({ onApply, onClose }) => {
  const [form] = Form.useForm();

  const handleApply = () => {
    const values = form.getFieldsValue();
    // Filter out empty values
    const filters = Object.entries(values).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        acc[key] = value;
      }
      return acc;
    }, {});
    onApply(filters);
  };

  const handleReset = () => {
    form.resetFields();
    onApply({});
  };

  return (
    <Card
      title={
        <Space>
          <FilterOutlined />
          Advanced Filters
        </Space>
      }
      extra={
        onClose && (
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            size="small"
          />
        )
      }
      className="shadow-md">
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item name="retainerType" label="Retainer Type">
              <Select placeholder="Select type" allowClear>
                <Option value="general-legal">General Legal</Option>
                <Option value="company-secretarial">Company Secretarial</Option>
                <Option value="retainer-deposit">Retainer Deposit</Option>
                <Option value="specialized">Specialized</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="status" label="Status">
              <Select placeholder="Select status" allowClear>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="expired">Expired</Option>
                <Option value="pending">Pending</Option>
                <Option value="terminated">Terminated</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="expiringInDays" label="Expiring In">
              <Select placeholder="Select timeframe" allowClear>
                <Option value="7">Next 7 days</Option>
                <Option value="30">Next 30 days</Option>
                <Option value="60">Next 60 days</Option>
                <Option value="90">Next 90 days</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="dateRange" label="Date Range">
              <RangePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="minFee" label="Min Fee (₦)">
              <InputNumber
                className="w-full"
                min={0}
                placeholder="0"
                formatter={(value) =>
                  `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item name="maxFee" label="Max Fee (₦)">
              <InputNumber
                className="w-full"
                min={0}
                placeholder="1000000"
                formatter={(value) =>
                  `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row justify="end" gutter={8} className="mt-4">
          <Col>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Reset
            </Button>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<FilterOutlined />}
              onClick={handleApply}
              className="bg-blue-600 hover:bg-blue-700">
              Apply Filters
            </Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default RetainerFilters;
