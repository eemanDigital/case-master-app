import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Popconfirm,
  Modal,
  Form,
  Typography,
  DatePicker,
  Tooltip,
  Row,
  Col,
  Statistic,
  message,
  Tag,
  Timeline,
  Badge,
  Empty,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BankOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  addCourtAppearance,
  fetchRetainerDetails,
} from "../../redux/features/retainer/retainerSlice";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * CourtAppearancesManager Component
 * Manages court appearances for litigation matters
 * Tracks dates, outcomes, and adjournments
 */
const CourtAppearancesManager = ({ matterId }) => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAppearance, setSelectedAppearance] = useState(null);
  const [form] = Form.useForm();

  // Redux state
  const details = useSelector((state) => state.retainer.selectedDetails);
  const loading = useSelector((state) => state.retainer.actionLoading);

  const appearances = details?.courtAppearances || [];

  // Court appearance purposes
  const purposes = [
    { value: "mention", label: "Mention", color: "blue" },
    { value: "hearing", label: "Hearing", color: "orange" },
    { value: "ruling", label: "Ruling", color: "purple" },
    { value: "judgment", label: "Judgment", color: "green" },
    { value: "adjournment", label: "Adjournment", color: "default" },
    { value: "settlement", label: "Settlement", color: "cyan" },
    { value: "mediation", label: "Mediation", color: "gold" },
    { value: "other", label: "Other", color: "default" },
  ];

  // Nigerian courts
  const courts = [
    "Supreme Court",
    "Court of Appeal",
    "Federal High Court",
    "State High Court",
    "National Industrial Court",
    "Magistrate Court",
    "Customary Court",
    "Sharia Court",
    "Investment & Securities Tribunal",
    "Tax Appeal Tribunal",
    "Other",
  ];

  // Calculate statistics
  const calculateStats = () => {
    const total = appearances.length;
    const upcoming = appearances.filter((a) =>
      dayjs(a.appearanceDate).isAfter(dayjs()),
    ).length;
    const past = total - upcoming;
    const nextAdjourned = appearances.filter((a) => a.nextAdjourned).length;
    const withinRetainer = appearances.filter((a) => a.withinRetainer).length;
    const additionalFees = appearances
      .filter((a) => !a.withinRetainer && a.additionalFee)
      .reduce((sum, a) => sum + (a.additionalFee?.amount || 0), 0);

    return {
      total,
      upcoming,
      past,
      nextAdjourned,
      withinRetainer,
      additionalFees,
    };
  };

  const stats = calculateStats();

  // Get next appearance
  const getNextAppearance = () => {
    const upcoming = appearances
      .filter((a) => dayjs(a.appearanceDate).isAfter(dayjs()))
      .sort(
        (a, b) =>
          dayjs(a.appearanceDate).unix() - dayjs(b.appearanceDate).unix(),
      );
    return upcoming[0];
  };

  const nextAppearance = getNextAppearance();

  // Handlers
  const handleAddAppearance = async (values) => {
    try {
      const formData = {
        ...values,
        appearanceDate: values.appearanceDate?.toISOString(),
        nextAdjourned: values.nextAdjourned?.toISOString(),
      };

      await dispatch(addCourtAppearance({ matterId, data: formData })).unwrap();
      message.success("Court appearance added successfully");
      setShowModal(false);
      form.resetFields();
      dispatch(fetchRetainerDetails(matterId));
    } catch (error) {
      message.error(error.message || "Failed to add court appearance");
    }
  };

  // Table columns
  const columns = [
    {
      title: "Appearance Date",
      dataIndex: "appearanceDate",
      key: "appearanceDate",
      width: 130,
      render: (date) => {
        const isPast = dayjs(date).isBefore(dayjs());
        return (
          <Space direction="vertical" size={0}>
            <Text strong className={isPast ? "text-gray-500" : "text-blue-600"}>
              {dayjs(date).format("DD MMM YYYY")}
            </Text>
            <Text type="secondary" className="text-xs">
              {dayjs(date).format("HH:mm")}
            </Text>
          </Space>
        );
      },
      sorter: (a, b) =>
        dayjs(a.appearanceDate).unix() - dayjs(b.appearanceDate).unix(),
    },
    {
      title: "Court",
      dataIndex: "court",
      key: "court",
      width: 150,
      render: (text) => (
        <Space>
          <BankOutlined className="text-blue-500" />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Suit No.",
      dataIndex: "suitNumber",
      key: "suitNumber",
      width: 120,
      render: (text) => (
        <Text className="font-mono text-xs">{text || "N/A"}</Text>
      ),
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
      width: 120,
      filters: purposes.map((p) => ({ text: p.label, value: p.value })),
      onFilter: (value, record) => record.purpose === value,
      render: (purpose) => {
        const config = purposes.find((p) => p.value === purpose);
        return <Tag color={config?.color}>{config?.label || purpose}</Tag>;
      },
    },
    {
      title: "Counsel",
      dataIndex: "counsel",
      key: "counsel",
      width: 120,
      render: (counsel) => (
        <Text>
          {counsel?.firstName} {counsel?.lastName || "TBA"}
        </Text>
      ),
    },
    {
      title: "Outcome",
      dataIndex: "outcome",
      key: "outcome",
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text className="text-gray-600">{text || "Pending"}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Next Date",
      dataIndex: "nextAdjourned",
      key: "nextAdjourned",
      width: 110,
      render: (date) =>
        date ? (
          <Space>
            <CalendarOutlined className="text-orange-500" />
            <Text>{dayjs(date).format("DD/MM/YY")}</Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Billing",
      key: "billing",
      width: 100,
      align: "center",
      render: (_, record) =>
        record.withinRetainer ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Included
          </Tag>
        ) : (
          <Tag color="warning">
            ₦{(record.additionalFee?.amount || 0).toLocaleString()}
          </Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      fixed: "right",
      render: (_, record) => (
        <Tooltip title="View details">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setSelectedAppearance(record);
              setShowDetailModal(true);
            }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="court-appearances-manager">
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Appearances"
              value={stats.total}
              prefix={<BankOutlined className="text-blue-500" />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Upcoming"
              value={stats.upcoming}
              prefix={<CalendarOutlined className="text-orange-500" />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Within Retainer"
              value={stats.withinRetainer}
              prefix={<CheckCircleOutlined className="text-green-500" />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Additional Fees"
              value={stats.additionalFees}
              prefix="₦"
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Next Appearance Alert */}
      {nextAppearance && (
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <Space className="w-full justify-between" align="start">
            <div>
              <Title level={5} className="!mb-2">
                <ClockCircleOutlined className="mr-2 text-blue-600" />
                Next Court Appearance
              </Title>
              <Text strong className="text-blue-700">
                {dayjs(nextAppearance.appearanceDate).format(
                  "dddd, DD MMMM YYYY [at] HH:mm",
                )}
              </Text>
              <br />
              <Text type="secondary">
                {nextAppearance.court} • {nextAppearance.suitNumber}
              </Text>
              <br />
              <Badge
                status="processing"
                text={
                  <Text>
                    {dayjs(nextAppearance.appearanceDate).diff(dayjs(), "day")}{" "}
                    days from now
                  </Text>
                }
              />
            </div>
            <Tag color="blue">{nextAppearance.purpose?.toUpperCase()}</Tag>
          </Space>
        </Card>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Title level={4} className="!mb-0">
          <BankOutlined className="mr-2" />
          Court Appearances
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700">
          Add Appearance
        </Button>
      </div>

      {/* Appearances Table */}
      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={appearances}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} appearance(s)`,
          }}
          scroll={{ x: 1200 }}
          rowClassName={(record) => {
            const isPast = dayjs(record.appearanceDate).isBefore(dayjs());
            const isUpcoming =
              dayjs(record.appearanceDate).isAfter(dayjs()) &&
              dayjs(record.appearanceDate).diff(dayjs(), "day") <= 7;
            if (isUpcoming) return "bg-yellow-50";
            if (isPast) return "bg-gray-50";
            return "";
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No court appearances scheduled">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowModal(true)}>
                  Add First Appearance
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      {/* Add Appearance Modal */}
      <Modal
        title={
          <Space>
            <BankOutlined />
            Add Court Appearance
          </Space>
        }
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={700}
        okText="Add Appearance"
        cancelText="Cancel">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddAppearance}
          initialValues={{
            withinRetainer: true,
            purpose: "mention",
          }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="appearanceDate"
                label="Appearance Date & Time"
                rules={[
                  { required: true, message: "Please select date & time" },
                ]}>
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  className="w-full"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="purpose"
                label="Purpose"
                rules={[{ required: true, message: "Please select purpose" }]}>
                <Select placeholder="Select purpose" size="large">
                  {purposes.map((p) => (
                    <Option key={p.value} value={p.value}>
                      <Tag color={p.color}>{p.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="court"
                label="Court"
                rules={[{ required: true, message: "Please enter court" }]}>
                <Select
                  placeholder="Select or type court name"
                  showSearch
                  size="large">
                  {courts.map((court) => (
                    <Option key={court} value={court}>
                      {court}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="suitNumber"
                label="Suit Number"
                rules={[
                  { required: true, message: "Please enter suit number" },
                ]}>
                <Input placeholder="e.g., FHC/L/CS/123/2024" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="counsel" label="Counsel Assigned (Optional)">
            <Input placeholder="Name of counsel" size="large" />
          </Form.Item>

          <Form.Item name="outcome" label="Outcome (Optional)">
            <TextArea
              rows={2}
              placeholder="Record the outcome or proceedings..."
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="nextAdjourned"
            label="Next Adjourned Date (Optional)">
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              className="w-full"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="withinRetainer"
            label="Within Retainer Agreement"
            valuePropName="checked">
            <Space>
              <input type="checkbox" defaultChecked />
              <Text>This appearance is covered by the retainer</Text>
            </Space>
          </Form.Item>

          <Form.Item noStyle shouldUpdate>
            {({ getFieldValue }) =>
              !getFieldValue("withinRetainer") && (
                <Card
                  title="Additional Fee"
                  size="small"
                  className="bg-yellow-50">
                  <Form.Item
                    name={["additionalFee", "amount"]}
                    label="Fee Amount"
                    rules={[
                      { required: true, message: "Please enter fee amount" },
                    ]}>
                    <Input
                      type="number"
                      prefix="₦"
                      placeholder="0.00"
                      size="large"
                    />
                  </Form.Item>
                  <Form.Item
                    name={["additionalFee", "justification"]}
                    label="Justification">
                    <TextArea
                      rows={2}
                      placeholder="Reason for additional fee..."
                      size="large"
                    />
                  </Form.Item>
                </Card>
              )
            }
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            Court Appearance Details
          </Space>
        }
        open={showDetailModal}
        onCancel={() => {
          setShowDetailModal(false);
          setSelectedAppearance(null);
        }}
        footer={[
          <Button key="close" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>,
        ]}
        width={600}>
        {selectedAppearance && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Appearance Date">
              {dayjs(selectedAppearance.appearanceDate).format(
                "DD MMMM YYYY [at] HH:mm",
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Court">
              {selectedAppearance.court}
            </Descriptions.Item>
            <Descriptions.Item label="Suit Number">
              {selectedAppearance.suitNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Purpose">
              {purposes.find((p) => p.value === selectedAppearance.purpose) && (
                <Tag
                  color={
                    purposes.find((p) => p.value === selectedAppearance.purpose)
                      .color
                  }>
                  {
                    purposes.find((p) => p.value === selectedAppearance.purpose)
                      .label
                  }
                </Tag>
              )}
            </Descriptions.Item>
            {selectedAppearance.counsel && (
              <Descriptions.Item label="Counsel">
                {selectedAppearance.counsel}
              </Descriptions.Item>
            )}
            {selectedAppearance.outcome && (
              <Descriptions.Item label="Outcome">
                {selectedAppearance.outcome}
              </Descriptions.Item>
            )}
            {selectedAppearance.nextAdjourned && (
              <Descriptions.Item label="Next Adjourned Date">
                {dayjs(selectedAppearance.nextAdjourned).format(
                  "DD MMMM YYYY [at] HH:mm",
                )}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Billing Status">
              {selectedAppearance.withinRetainer ? (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  Within Retainer
                </Tag>
              ) : (
                <Space direction="vertical">
                  <Tag color="warning">Additional Fee</Tag>
                  <Text strong>
                    ₦
                    {(
                      selectedAppearance.additionalFee?.amount || 0
                    ).toLocaleString()}
                  </Text>
                  {selectedAppearance.additionalFee?.justification && (
                    <Text type="secondary" className="text-xs">
                      {selectedAppearance.additionalFee.justification}
                    </Text>
                  )}
                </Space>
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default CourtAppearancesManager;
