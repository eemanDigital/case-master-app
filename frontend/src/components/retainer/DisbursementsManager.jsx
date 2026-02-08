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
  InputNumber,
  Tooltip,
  Row,
  Col,
  Statistic,
  message,
  Tag,
  Switch,
  Upload,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  FileTextOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  addDisbursement,
  updateDisbursement,
  deleteDisbursement,
  fetchRetainerDetails,
} from "../../redux/features/retainer/retainerSlice";

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * DisbursementsManager Component
 * Manages out-of-pocket expenses and disbursements
 * Tracks receipts and client billing
 */
const DisbursementsManager = ({ matterId }) => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [editingDisbursement, setEditingDisbursement] = useState(null);
  const [form] = Form.useForm();

  // Redux state
  const details = useSelector((state) => state.retainer.selectedDetails);
  const loading = useSelector((state) => state.retainer.actionLoading);

  const disbursements = details?.disbursements || [];

  // Disbursement categories
  const categories = [
    { value: "court-fees", label: "Court Fees" },
    { value: "registry-fees", label: "Registry Fees" },
    { value: "professional-fees", label: "Professional Fees" },
    { value: "transport", label: "Transportation" },
    { value: "stamps", label: "Stamps & Duties" },
    { value: "filing-fees", label: "Filing Fees" },
    { value: "search-fees", label: "Search Fees" },
    { value: "correspondence", label: "Correspondence" },
    { value: "other", label: "Other" },
  ];

  // Calculate statistics
  const calculateStats = () => {
    const totalEstimated = disbursements.reduce(
      (sum, d) => sum + (d.estimatedAmount || 0),
      0,
    );
    const totalActual = disbursements.reduce(
      (sum, d) => sum + (d.actualAmount || 0),
      0,
    );
    const billableAmount = disbursements
      .filter((d) => d.isBillableToClient)
      .reduce((sum, d) => sum + (d.actualAmount || d.estimatedAmount || 0), 0);
    const nonBillableAmount = disbursements
      .filter((d) => !d.isBillableToClient)
      .reduce((sum, d) => sum + (d.actualAmount || d.estimatedAmount || 0), 0);
    const withReceipts = disbursements.filter((d) => d.receiptNumber).length;
    const pending = disbursements.filter((d) => !d.actualAmount).length;

    return {
      totalEstimated,
      totalActual,
      billableAmount,
      nonBillableAmount,
      withReceipts,
      pending,
      variance: totalActual - totalEstimated,
    };
  };

  const stats = calculateStats();

  // Handlers
  const handleAddDisbursement = async (values) => {
    try {
      const formData = {
        ...values,
        incurredDate:
          values.incurredDate?.toISOString() || new Date().toISOString(),
      };

      await dispatch(addDisbursement({ matterId, data: formData })).unwrap();
      message.success("Disbursement added successfully");
      setShowModal(false);
      form.resetFields();
      dispatch(fetchRetainerDetails(matterId));
    } catch (error) {
      message.error(error.message || "Failed to add disbursement");
    }
  };

  const handleUpdateDisbursement = async (disbursementId, values) => {
    try {
      const formData = {
        ...values,
        incurredDate: values.incurredDate?.toISOString(),
      };

      await dispatch(
        updateDisbursement({ matterId, disbursementId, data: formData }),
      ).unwrap();
      message.success("Disbursement updated successfully");
      setShowModal(false);
      setEditingDisbursement(null);
      form.resetFields();
      dispatch(fetchRetainerDetails(matterId));
    } catch (error) {
      message.error(error.message || "Failed to update disbursement");
    }
  };

  const handleDeleteDisbursement = async (disbursementId) => {
    try {
      await dispatch(deleteDisbursement({ matterId, disbursementId })).unwrap();
      message.success("Disbursement deleted successfully");
      dispatch(fetchRetainerDetails(matterId));
    } catch (error) {
      message.error(error.message || "Failed to delete disbursement");
    }
  };

  // Table columns
  const columns = [
    {
      title: "Item",
      dataIndex: "item",
      key: "item",
      width: 180,
      render: (text) => (
        <Text strong className="text-gray-800">
          {text}
        </Text>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 140,
      filters: categories.map((c) => ({ text: c.label, value: c.value })),
      onFilter: (value, record) => record.category === value,
      render: (category) => {
        const cat = categories.find((c) => c.value === category);
        return <Tag color="blue">{cat?.label || category}</Tag>;
      },
    },
    {
      title: "Estimated",
      dataIndex: "estimatedAmount",
      key: "estimatedAmount",
      width: 120,
      align: "right",
      render: (amount) => (
        <Text type="secondary">₦ {(amount || 0).toLocaleString()}</Text>
      ),
      sorter: (a, b) => (a.estimatedAmount || 0) - (b.estimatedAmount || 0),
    },
    {
      title: "Actual",
      dataIndex: "actualAmount",
      key: "actualAmount",
      width: 120,
      align: "right",
      render: (amount) => (
        <Text strong className="text-green-600">
          {amount ? `₦ ${amount.toLocaleString()}` : "Pending"}
        </Text>
      ),
      sorter: (a, b) => (a.actualAmount || 0) - (b.actualAmount || 0),
    },
    {
      title: "Variance",
      key: "variance",
      width: 100,
      align: "right",
      render: (_, record) => {
        if (!record.actualAmount) return <Text type="secondary">-</Text>;
        const variance = record.actualAmount - (record.estimatedAmount || 0);
        return (
          <Text
            type={
              variance > 0 ? "danger" : variance < 0 ? "success" : "secondary"
            }>
            {variance > 0 ? "+" : ""}₦ {variance.toLocaleString()}
          </Text>
        );
      },
    },
    {
      title: "Date",
      dataIndex: "incurredDate",
      key: "incurredDate",
      width: 110,
      render: (date) =>
        date ? (
          <Text>{dayjs(date).format("DD/MM/YY")}</Text>
        ) : (
          <Text type="secondary">N/A</Text>
        ),
      sorter: (a, b) =>
        dayjs(a.incurredDate || 0).unix() - dayjs(b.incurredDate || 0).unix(),
    },
    {
      title: "Receipt",
      dataIndex: "receiptNumber",
      key: "receiptNumber",
      width: 120,
      render: (receipt, record) => (
        <Space>
          {receipt ? (
            <>
              <CheckCircleOutlined className="text-green-500" />
              <Text className="text-xs">{receipt}</Text>
            </>
          ) : record.receiptRequired ? (
            <Tag color="warning">Required</Tag>
          ) : (
            <Text type="secondary">N/A</Text>
          )}
        </Space>
      ),
    },
    {
      title: "Billable",
      dataIndex: "isBillableToClient",
      key: "isBillableToClient",
      width: 90,
      align: "center",
      filters: [
        { text: "Billable", value: true },
        { text: "Non-Billable", value: false },
      ],
      onFilter: (value, record) => record.isBillableToClient === value,
      render: (billable) =>
        billable ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Yes
          </Tag>
        ) : (
          <Tag color="default" icon={<CloseCircleOutlined />}>
            No
          </Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit disbursement">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => {
                setEditingDisbursement(record);
                form.setFieldsValue({
                  ...record,
                  incurredDate: record.incurredDate
                    ? dayjs(record.incurredDate)
                    : null,
                });
                setShowModal(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this disbursement?"
            description="This action cannot be undone."
            onConfirm={() => handleDeleteDisbursement(record._id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}>
            <Tooltip title="Delete disbursement">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="disbursements-manager">
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Estimated"
              value={stats.totalEstimated}
              prefix="₦"
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Total Actual"
              value={stats.totalActual}
              prefix="₦"
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Billable to Client"
              value={stats.billableAmount}
              prefix="₦"
              valueStyle={{ color: "#389e0d" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            size="small"
            className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="Variance"
              value={Math.abs(stats.variance)}
              prefix={stats.variance > 0 ? "+" : stats.variance < 0 ? "-" : ""}
              suffix="₦"
              valueStyle={{
                color:
                  stats.variance > 0
                    ? "#cf1322"
                    : stats.variance < 0
                      ? "#52c41a"
                      : "#8c8c8c",
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      {stats.pending > 0 && (
        <div className="mb-4">
          <Tag color="warning">
            {stats.pending} disbursement(s) pending actual amount entry
          </Tag>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Title level={4} className="!mb-0">
          <DollarOutlined className="mr-2" />
          Disbursements & Out-of-Pockets
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingDisbursement(null);
            form.resetFields();
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700">
          Add Disbursement
        </Button>
      </div>

      {/* Disbursements Table */}
      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={disbursements}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} disbursement(s)`,
          }}
          scroll={{ x: 1200 }}
          summary={(pageData) => {
            let totalEstimated = 0;
            let totalActual = 0;

            pageData.forEach(({ estimatedAmount, actualAmount }) => {
              totalEstimated += estimatedAmount || 0;
              totalActual += actualAmount || 0;
            });

            return (
              <>
                <Table.Summary.Row className="bg-gray-50">
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <Text strong>Page Total:</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <Text strong>₦ {totalEstimated.toLocaleString()}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <Text strong className="text-green-600">
                      ₦ {totalActual.toLocaleString()}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <Text strong>
                      ₦ {(totalActual - totalEstimated).toLocaleString()}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} colSpan={4} />
                </Table.Summary.Row>
              </>
            );
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No disbursements recorded">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowModal(true)}>
                  Add First Disbursement
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      {/* Disbursement Form Modal */}
      <Modal
        title={
          <Space>
            <DollarOutlined />
            {editingDisbursement ? "Edit Disbursement" : "Add Disbursement"}
          </Space>
        }
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingDisbursement(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={700}
        okText={editingDisbursement ? "Update" : "Add Disbursement"}
        cancelText="Cancel">
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            if (editingDisbursement) {
              handleUpdateDisbursement(editingDisbursement._id, values);
            } else {
              handleAddDisbursement(values);
            }
          }}
          initialValues={{
            category: "other",
            isBillableToClient: true,
            receiptRequired: true,
            incurredDate: dayjs(),
          }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="item"
                label="Disbursement Item"
                rules={[
                  { required: true, message: "Please enter item description" },
                ]}>
                <Input
                  placeholder="e.g., Court filing fee, Transport to registry"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: "Please select category" }]}>
                <Select placeholder="Select category" size="large">
                  {categories.map((cat) => (
                    <Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="estimatedAmount"
                label="Estimated Amount"
                rules={[
                  { required: true, message: "Please enter estimated amount" },
                  { type: "number", min: 0, message: "Cannot be negative" },
                ]}>
                <InputNumber
                  min={0}
                  className="w-full"
                  prefix="₦"
                  placeholder="0.00"
                  size="large"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="actualAmount"
                label="Actual Amount"
                help="Leave blank if not yet incurred"
                rules={[
                  { type: "number", min: 0, message: "Cannot be negative" },
                ]}>
                <InputNumber
                  min={0}
                  className="w-full"
                  prefix="₦"
                  placeholder="0.00"
                  size="large"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="incurredDate" label="Date Incurred">
            <DatePicker format="DD/MM/YYYY" className="w-full" size="large" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="isBillableToClient"
                label="Billable to Client"
                valuePropName="checked">
                <Switch
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                  defaultChecked
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="receiptRequired"
                label="Receipt Required"
                valuePropName="checked">
                <Switch
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                  defaultChecked
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item noStyle shouldUpdate>
            {({ getFieldValue }) =>
              getFieldValue("receiptRequired") && (
                <Form.Item name="receiptNumber" label="Receipt Number">
                  <Input
                    placeholder="Enter receipt number"
                    size="large"
                    addonBefore={<FileTextOutlined />}
                  />
                </Form.Item>
              )
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DisbursementsManager;
