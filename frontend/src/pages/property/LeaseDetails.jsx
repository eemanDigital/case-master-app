import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Row,
  Col,
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
} from "antd";
import {
  RocketOutlined,
  DollarOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
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

const LeaseDetails = ({ matterId, renewalTracking, rentAmount }) => {
  const dispatch = useDispatch();
  const [renewalModalVisible, setRenewalModalVisible] = useState(false);
  const [negotiationModalVisible, setNegotiationModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [negotiationForm] = Form.useForm();

  const handleInitiateRenewal = async (values) => {
    setLoading(true);
    try {
      await dispatch(initiateRenewal({ matterId, data: values }));
      setRenewalModalVisible(false);
      form.resetFields();
      message.success("Renewal process initiated successfully");
    } catch (error) {
      message.error("Failed to initiate renewal");
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
      );
      message.success(`Renewal status updated to ${getRenewalStatusLabel(newStatus)}`);
    } catch (error) {
      message.error("Failed to update renewal status");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNegotiation = async (values) => {
    setLoading(true);
    try {
      await dispatch(addNegotiation({ matterId, data: values }));
      setNegotiationModalVisible(false);
      negotiationForm.resetFields();
      message.success("Negotiation record added successfully");
    } catch (error) {
      message.error("Failed to add negotiation");
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = renewalTracking?.renewalStatus || "not-initiated";

  return (
    <>
      <Card
        title={
          <Space>
            <RocketOutlined />
            <span>Lease Renewal Management</span>
          </Space>
        }
      >
        {!renewalTracking?.renewalInitiated ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              Renewal process has not been initiated yet.
            </div>
            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              onClick={() => setRenewalModalVisible(true)}
            >
              Initiate Renewal Process
            </Button>
          </div>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card size="small" title="Current Status">
                  <Tag color={getRenewalStatusColor(currentStatus)} className="text-lg px-4 py-2">
                    {getRenewalStatusLabel(currentStatus)}
                  </Tag>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="Initiated Date">
                  <div className="text-lg font-semibold">
                    {renewalTracking.renewalInitiatedDate
                      ? dayjs(renewalTracking.renewalInitiatedDate).format(DATE_FORMAT)
                      : "N/A"}
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="Renewal Deadline">
                  <div className="text-lg font-semibold text-orange-500">
                    {renewalTracking.renewalDeadline
                      ? dayjs(renewalTracking.renewalDeadline).format(DATE_FORMAT)
                      : "N/A"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Notice period: {renewalTracking.renewalNoticePeriod || 90} days
                  </div>
                </Card>
              </Col>
            </Row>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" title="Current Rent">
                  <Statistic
                    value={rentAmount?.amount || 0}
                    prefix={<DollarOutlined />}
                    formatter={(value) => formatCurrency(value, rentAmount?.currency || "NGN")}
                    suffix={`/${rentAmount?.frequency || "monthly"}`}
                  />
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="Proposed New Rent">
                  <Statistic
                    value={renewalTracking.proposedNewRent?.amount || rentAmount?.amount || 0}
                    prefix={<DollarOutlined />}
                    formatter={(value) =>
                      formatCurrency(value, renewalTracking.proposedNewRent?.currency || "NGN")
                    }
                    valueStyle={{
                      color:
                        renewalTracking.rentIncreasePercentage > 0
                          ? "#52c41a"
                          : "inherit",
                    }}
                  />
                  {renewalTracking.rentIncreasePercentage > 0 && (
                    <Tag color="green" className="mt-2">
                      +{renewalTracking.rentIncreasePercentage}% increase
                    </Tag>
                  )}
                </Card>
              </Col>
            </Row>

            <Divider />

            <Card size="small" title="Update Renewal Status">
              <Space wrap>
                {RENEWAL_STATUS.filter(
                  (s) => s.value !== "not-initiated",
                ).map((status) => (
                  <Button
                    key={status.value}
                    type={currentStatus === status.value ? "primary" : "default"}
                    disabled={currentStatus === status.value}
                    onClick={() => handleUpdateStatus(status.value)}
                  >
                    {status.label}
                  </Button>
                ))}
              </Space>
            </Card>

            <Divider />

            <Card
              title="Negotiation History"
              extra={
                <Button
                  type="primary"
                  icon={<HistoryOutlined />}
                  onClick={() => setNegotiationModalVisible(true)}
                >
                  Add Negotiation
                </Button>
              }
            >
              {renewalTracking.negotiationsHistory?.length > 0 ? (
                <Timeline
                  items={renewalTracking.negotiationsHistory.map((neg, idx) => ({
                    color:
                      neg.response === "accepted"
                        ? "green"
                        : neg.response === "rejected"
                          ? "red"
                          : neg.response === "counter-offered"
                            ? "orange"
                            : "blue",
                    children: (
                      <div key={idx}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {neg.proposedBy === "landlord" ? "Landlord" : "Tenant"}
                            </div>
                            <div className="text-lg font-bold">
                              {formatCurrency(neg.proposedAmount)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {dayjs(neg.proposedDate).format(
                                `${DATE_FORMAT} HH:mm`,
                              )}
                            </div>
                          </div>
                          <Tag color={NEGOTIATION_RESPONSE.find((r) => r.value === neg.response)?.color || "default"}>
                            {neg.response?.toUpperCase()}
                          </Tag>
                        </div>
                        {neg.notes && (
                          <div className="mt-2 text-sm text-gray-600">
                            {neg.notes}
                          </div>
                        )}
                      </div>
                    ),
                  }))}
                />
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No negotiations recorded yet
                </div>
              )}
            </Card>

            {currentStatus === "agreed" && (
              <Card
                title="Finalize Renewal"
                className="mt-4"
                style={{ borderColor: "#52c41a" }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Ready to finalize renewal?</div>
                    <div className="text-sm text-gray-500">
                      Update the lease agreement with new terms and expiry date
                    </div>
                  </div>
                  <Space>
                    <Button onClick={() => handleUpdateStatus("completed")}>
                      Mark as Completed
                    </Button>
                    <Button type="primary">Update Lease Agreement</Button>
                  </Space>
                </div>
              </Card>
            )}
          </>
        )}
      </Card>

      {/* Initiate Renewal Modal */}
      <Modal
        title="Initiate Lease Renewal"
        open={renewalModalVisible}
        onCancel={() => setRenewalModalVisible(false)}
        footer={null}
        width={600}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleInitiateRenewal}>
          <Form.Item
            name="renewalNoticePeriod"
            label="Notice Period (days)"
            initialValue={90}
            rules={[{ required: true, message: "Please enter notice period" }]}
          >
            <InputNumber min={30} max={365} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="proposedNewRent"
            label="Proposed New Rent Amount"
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/,/g, "")}
              placeholder="Enter proposed rent"
            />
          </Form.Item>

          <Form.Item
            name="rentIncreasePercentage"
            label="Rent Increase Percentage"
            extra="Enter 0 for no increase, or a positive number for increase"
          >
            <InputNumber
              min={0}
              max={100}
              style={{ width: "100%" }}
              addonAfter="%"
            />
          </Form.Item>

          <Form.Item name="renewalTerms" label="Renewal Terms">
            <TextArea
              rows={3}
              placeholder="Specify any special terms or conditions for the renewal..."
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={() => setRenewalModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Initiate Renewal
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Negotiation Modal */}
      <Modal
        title="Add Negotiation Record"
        open={negotiationModalVisible}
        onCancel={() => setNegotiationModalVisible(false)}
        footer={null}
        width={500}
        centered
      >
        <Form
          form={negotiationForm}
          layout="vertical"
          onFinish={handleAddNegotiation}
        >
          <Form.Item
            name="proposedBy"
            label="Proposed By"
            rules={[{ required: true, message: "Please select who proposed" }]}
          >
            <Select>
              <Option value="landlord">Landlord</Option>
              <Option value="tenant">Tenant</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="proposedAmount"
            label="Proposed Amount"
            rules={[{ required: true, message: "Please enter proposed amount" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/,/g, "")}
              placeholder="Enter proposed rent amount"
            />
          </Form.Item>

          <Form.Item
            name="response"
            label="Response"
            rules={[{ required: true, message: "Please select response" }]}
          >
            <Select>
              {NEGOTIATION_RESPONSE.map((response) => (
                <Option key={response.value} value={response.value}>
                  <Tag color={response.color}>{response.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Additional notes about this negotiation..." />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={() => setNegotiationModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Add Negotiation
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default LeaseDetails;
