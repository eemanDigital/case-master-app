import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Divider,
  message,
  Timeline,
  Statistic,
  Row,
  Col,
  Popconfirm,
  Table,
  Tooltip,
} from "antd";
import {
  RocketOutlined,
  DollarOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  initiateRenewal,
  updateRenewalTracking,
  addNegotiation,
} from "../../redux/features/property/propertySlice";
import {
  RENEWAL_STATUS,
  NEGOTIATION_RESPONSE,
  formatCurrency,
  DATE_FORMAT,
  getRenewalStatusLabel,
  getRenewalStatusColor,
} from "../../utils/propertyConstants";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const LeaseRenewalSection = ({ matterId, renewalTracking, rentAmount }) => {
  const dispatch = useDispatch();
  const [renewalModalVisible, setRenewalModalVisible] = useState(false);
  const [negotiationModalVisible, setNegotiationModalVisible] = useState(false);
  const [editingNegotiation, setEditingNegotiation] = useState(null);
  const [isEditingRenewal, setIsEditingRenewal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [negotiationForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const currentStatus = renewalTracking?.renewalStatus || "not-initiated";
  const hasRenewal = renewalTracking?.renewalInitiated;

  const handleInitiateRenewal = async (values) => {
    setLoading(true);
    try {
      await dispatch(initiateRenewal({ matterId, data: values })).unwrap();
      setRenewalModalVisible(false);
      form.resetFields();
      message.success("Renewal process initiated successfully");
    } catch (error) {
      message.error(error?.message || "Failed to initiate renewal");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRenewal = () => {
    setIsEditingRenewal(true);
    editForm.setFieldsValue({
      renewalNoticePeriod: renewalTracking?.renewalNoticePeriod || 90,
      proposedNewRent: renewalTracking?.proposedNewRent?.amount || "",
      rentIncreasePercentage: renewalTracking?.rentIncreasePercentage || 0,
      renewalTerms: renewalTracking?.renewalTerms || "",
    });
    setRenewalModalVisible(true);
  };

  const handleInitiateNewRenewal = () => {
    setIsEditingRenewal(false);
    form.resetFields();
    setRenewalModalVisible(true);
  };

  const handleUpdateRenewal = async (values) => {
    setLoading(true);
    try {
      const updateData = {
        ...values,
        proposedNewRent: values.proposedNewRent ? {
          amount: values.proposedNewRent,
          currency: renewalTracking?.proposedNewRent?.currency || "NGN",
        } : null,
      };
      await dispatch(updateRenewalTracking({ matterId, data: updateData })).unwrap();
      setRenewalModalVisible(false);
      editForm.resetFields();
      message.success("Renewal details updated successfully");
    } catch (error) {
      message.error(error?.message || "Failed to update renewal");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setLoading(true);
    try {
      await dispatch(
        updateRenewalTracking({
          matterId,
          data: { renewalStatus: newStatus },
        }),
      ).unwrap();
      message.success(`Status updated to ${getRenewalStatusLabel(newStatus)}`);
    } catch (error) {
      message.error(error?.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRenewal = async () => {
    setLoading(true);
    try {
      await dispatch(
        updateRenewalTracking({
          matterId,
          data: {
            renewalInitiated: false,
            renewalInitiatedDate: null,
            renewalDeadline: null,
            renewalNoticePeriod: null,
            proposedNewRent: null,
            rentIncreasePercentage: 0,
            renewalTerms: "",
            renewalStatus: "not-initiated",
            negotiationsHistory: [],
          },
        }),
      ).unwrap();
      message.success("Renewal tracking removed");
    } catch (error) {
      message.error(error?.message || "Failed to remove renewal");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNegotiation = async (values) => {
    setLoading(true);
    try {
      await dispatch(addNegotiation({ matterId, data: values })).unwrap();
      setNegotiationModalVisible(false);
      negotiationForm.resetFields();
      setEditingNegotiation(null);
      message.success("Negotiation added successfully");
    } catch (error) {
      message.error(error?.message || "Failed to add negotiation");
    } finally {
      setLoading(false);
    }
  };

  const handleEditNegotiation = (neg) => {
    setEditingNegotiation(neg);
    negotiationForm.setFieldsValue({
      proposedBy: neg.proposedBy,
      proposedAmount: neg.proposedAmount,
      response: neg.response,
      notes: neg.notes || "",
    });
    setNegotiationModalVisible(true);
  };

  const handleUpdateNegotiation = async (values) => {
    if (!editingNegotiation) return handleAddNegotiation(values);
    
    setLoading(true);
    try {
      await dispatch(
        updateRenewalTracking({
          matterId,
          data: {
            negotiationsHistory: renewalTracking?.negotiationsHistory?.map((neg, idx) => {
              if (neg.proposedDate === editingNegotiation.proposedDate) {
                return {
                  ...neg,
                  ...values,
                  responseDate: new Date().toISOString(),
                };
              }
              return neg;
            }),
          },
        }),
      ).unwrap();
      setNegotiationModalVisible(false);
      negotiationForm.resetFields();
      setEditingNegotiation(null);
      message.success("Negotiation updated successfully");
    } catch (error) {
      message.error(error?.message || "Failed to update negotiation");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNegotiation = async (neg) => {
    setLoading(true);
    try {
      await dispatch(
        updateRenewalTracking({
          matterId,
          data: {
            negotiationsHistory: renewalTracking?.negotiationsHistory?.filter(
              (n) => n.proposedDate !== neg.proposedDate
            ),
          },
        }),
      ).unwrap();
      message.success("Negotiation removed");
    } catch (error) {
      message.error(error?.message || "Failed to remove negotiation");
    } finally {
      setLoading(false);
    }
  };

  const negotiationColumns = [
    {
      title: "Party",
      dataIndex: "proposedBy",
      key: "proposedBy",
      render: (val) => <Tag color={val === "landlord" ? "blue" : "green"}>{val}</Tag>,
    },
    {
      title: "Amount",
      dataIndex: "proposedAmount",
      key: "proposedAmount",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Response",
      dataIndex: "response",
      key: "response",
      render: (val) => {
        const config = NEGOTIATION_RESPONSE.find((r) => r.value === val);
        return <Tag color={config?.color || "default"}>{config?.label || val}</Tag>;
      },
    },
    {
      title: "Date",
      dataIndex: "proposedDate",
      key: "proposedDate",
      render: (val) => dayjs(val).format(DATE_FORMAT),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditNegotiation(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Remove this negotiation?"
            onConfirm={() => handleDeleteNegotiation(record)}
          >
            <Tooltip title="Delete">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title={
          <Space>
            <RocketOutlined />
            <span>Renewal Management</span>
          </Space>
        }
        extra={
          hasRenewal && (
            <Space>
              <Tooltip title="Edit Renewal Details">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={handleEditRenewal}
                />
              </Tooltip>
              <Popconfirm
                title="Remove renewal tracking?"
                description="This will remove all renewal data including negotiations."
                onConfirm={handleDeleteRenewal}
                okText="Yes"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Delete">
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            </Space>
          )
        }
      >
        {!hasRenewal ? (
          <div className="text-center py-6">
            <div className="text-gray-500 mb-4">
              Renewal process has not been initiated yet.
            </div>
            <Button
              type="primary"
              icon={<RocketOutlined />}
              onClick={handleInitiateNewRenewal}
            >
              Initiate Renewal
            </Button>
          </div>
        ) : (
          <>
            {/* Renewal Stats */}
            <Row gutter={[16, 16]} className="mb-4">
              <Col xs={12} sm={6}>
                <Statistic
                  title="Status"
                  value={getRenewalStatusLabel(currentStatus)}
                  valueStyle={{ color: getRenewalStatusColor(currentStatus), fontSize: "16px" }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Deadline"
                  value={
                    renewalTracking?.renewalDeadline
                      ? dayjs(renewalTracking.renewalDeadline).format("DD MMM YYYY")
                      : "N/A"
                  }
                  valueStyle={{ color: "#fa8c16", fontSize: "16px" }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Proposed Rent"
                  value={
                    renewalTracking?.proposedNewRent?.amount
                      ? formatCurrency(renewalTracking.proposedNewRent.amount)
                      : "Not set"
                  }
                  valueStyle={{ fontSize: "16px" }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Increase"
                  value={
                    renewalTracking?.rentIncreasePercentage
                      ? `${renewalTracking.rentIncreasePercentage}%`
                      : "0%"
                  }
                  valueStyle={{
                    color: renewalTracking?.rentIncreasePercentage > 0 ? "#52c41a" : "inherit",
                    fontSize: "16px",
                  }}
                />
              </Col>
            </Row>

            {/* Renewal Terms */}
            {renewalTracking?.renewalTerms && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-500 mb-1">Renewal Terms</div>
                <div>{renewalTracking.renewalTerms}</div>
              </div>
            )}

            <Divider className="my-3" />

            {/* Status Actions */}
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-2">Update Status</div>
              <Space wrap size="small">
                {RENEWAL_STATUS.filter((s) => s.value !== "not-initiated").map((status) => (
                  <Button
                    key={status.value}
                    size="small"
                    type={currentStatus === status.value ? "primary" : "default"}
                    onClick={() => handleUpdateStatus(status.value)}
                    disabled={currentStatus === status.value}
                  >
                    {status.label}
                  </Button>
                ))}
              </Space>
            </div>

            <Divider className="my-3" />

            {/* Negotiations Table */}
            <div className="mb-2 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Negotiations ({renewalTracking?.negotiationsHistory?.length || 0})
              </div>
              <Button
                size="small"
                type="primary"
                icon={<HistoryOutlined />}
                onClick={() => {
                  setEditingNegotiation(null);
                  negotiationForm.resetFields();
                  setNegotiationModalVisible(true);
                }}
              >
                Add
              </Button>
            </div>
            <Table
              columns={negotiationColumns}
              dataSource={renewalTracking?.negotiationsHistory || []}
              rowKey={(record) => record.proposedDate}
              size="small"
              pagination={false}
              scroll={{ y: 200 }}
              locale={{ emptyText: "No negotiations recorded" }}
            />
          </>
        )}
      </Card>

      {/* Create/Edit Renewal Modal */}
      <Modal
        title={isEditingRenewal ? "Edit Renewal Details" : "Initiate Lease Renewal"}
        open={renewalModalVisible}
        onCancel={() => {
          setRenewalModalVisible(false);
          setIsEditingRenewal(false);
          editForm.resetFields();
          form.resetFields();
        }}
        footer={null}
        width={500}
        centered
      >
        <Form
          form={isEditingRenewal ? editForm : form}
          layout="vertical"
          onFinish={isEditingRenewal ? handleUpdateRenewal : handleInitiateRenewal}
        >
          <Form.Item
            name="renewalNoticePeriod"
            label="Notice Period (days)"
            rules={[{ required: true, message: "Please enter notice period" }]}
          >
            <InputNumber min={30} max={365} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="proposedNewRent" label="Proposed New Rent">
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => value.replace(/,/g, "")}
              placeholder="Enter proposed rent"
            />
          </Form.Item>

          <Form.Item
            name="rentIncreasePercentage"
            label="Rent Increase %"
            extra="Enter 0 for no increase"
          >
            <InputNumber min={0} max={100} style={{ width: "100%" }} addonAfter="%" />
          </Form.Item>

          <Form.Item name="renewalTerms" label="Renewal Terms">
            <TextArea rows={3} placeholder="Special terms or conditions..." />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={() => {
                setRenewalModalVisible(false);
                setIsEditingRenewal(false);
                editForm.resetFields();
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                {isEditingRenewal ? "Update" : "Initiate Renewal"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add/Edit Negotiation Modal */}
      <Modal
        title={editingNegotiation ? "Edit Negotiation" : "Add Negotiation"}
        open={negotiationModalVisible}
        onCancel={() => {
          setNegotiationModalVisible(false);
          setEditingNegotiation(null);
          negotiationForm.resetFields();
        }}
        footer={null}
        width={450}
        centered
      >
        <Form
          layout="vertical"
          onFinish={editingNegotiation ? handleUpdateNegotiation : handleAddNegotiation}
          form={negotiationForm}
        >
          <Form.Item
            name="proposedBy"
            label="Proposed By"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select party">
              <Option value="landlord">Landlord</Option>
              <Option value="tenant">Tenant</Option>
            </Select>
          </Form.Item>

          <Form.Item name="proposedAmount" label="Amount" rules={[{ required: true }]}>
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => value.replace(/,/g, "")}
              placeholder="Enter amount"
            />
          </Form.Item>

          <Form.Item name="response" label="Response" rules={[{ required: true }]}>
            <Select placeholder="Select response">
              {NEGOTIATION_RESPONSE.map((r) => (
                <Option key={r.value} value={r.value}>
                  <Tag color={r.color}>{r.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={2} placeholder="Additional notes..." />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={() => {
                setNegotiationModalVisible(false);
                setEditingNegotiation(null);
                negotiationForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingNegotiation ? "Update" : "Add"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default LeaseRenewalSection;
