import { Form, Select, Input, Button, Space, DatePicker, Row, Col } from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";
import {
  COURT_TYPES,
  CASE_STAGES,
  MATTER_STATUS,
  NIGERIAN_STATES,
} from "../../../utils/litigationConstants";

const { Option } = Select;
// const { RangePicker } = DatePicker;

const LitigationFilters = ({ onFilter, onClear, loading }) => {
  const [form] = Form.useForm();

  const handleFilter = (values) => {
    // Remove empty values
    const cleanedValues = Object.entries(values).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        acc[key] = value;
      }
      return acc;
    }, {});

    onFilter(cleanedValues);
  };

  const handleClear = () => {
    form.resetFields();
    onClear();
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      <Form
        form={form}
        onFinish={handleFilter}
        layout="vertical"
        className="mb-0">
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="suitNo" label="Suit Number">
              <Input placeholder="Search suit number" allowClear />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="courtName" label="Court">
              <Select
                placeholder="Select court"
                allowClear
                showSearch
                optionFilterProp="children">
                {COURT_TYPES.map((court) => (
                  <Option key={court.value} value={court.value}>
                    {court.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="currentStage" label="Current Stage">
              <Select placeholder="Select stage" allowClear>
                {CASE_STAGES.map((stage) => (
                  <Option key={stage.value} value={stage.value}>
                    {stage.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="status" label="Status">
              <Select placeholder="Select status" allowClear>
                {MATTER_STATUS.map((status) => (
                  <Option key={status.value} value={status.value}>
                    {status.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="state" label="State">
              <Select
                placeholder="Select state"
                allowClear
                showSearch
                optionFilterProp="children">
                {NIGERIAN_STATES.map((state) => (
                  <Option key={state.value} value={state.value}>
                    {state.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="judge" label="Judge">
              <Input placeholder="Search judge name" allowClear />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="year" label="Filing Year">
              <DatePicker
                picker="year"
                placeholder="Select year"
                style={{ width: "100%" }}
                allowClear
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6} className="flex items-end">
            <Form.Item className="w-full mb-0">
              <Space className="w-full" style={{ justifyContent: "flex-end" }}>
                <Button icon={<ClearOutlined />} onClick={handleClear}>
                  Clear
                </Button>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  htmlType="submit"
                  loading={loading}>
                  Filter
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default LitigationFilters;
