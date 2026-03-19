import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Tabs,
  Typography,
  Tag,
  Statistic,
  Button,
  Space,
  Descriptions,
  Divider,
  Alert,
  Progress,
  Modal,
  Avatar,
  Badge,
  Timeline,
  Spin,
  message,
  Form,
  Input,
  Select,
  DatePicker,
} from "antd";
import {
  EditOutlined,
  DollarOutlined,
  FileTextOutlined,
  TeamOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  StopOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import RetainerForm from "./RetainerForm";
import RequestsManager from "./RequestsManager";
import ServicesManager from "./ServicesManager";
import DisbursementsManager from "./DisbursementsManager";
import CourtAppearancesManager from "./CourtAppearancesManager";
import RenewalModal from "./RenewalModal";
import { downloadRetainerReport } from "../../utils/pdfDownload";
import {
  fetchRetainerDetails,
  renewRetainer,
  terminateRetainer,
} from "../../redux/features/retainer/retainerSlice";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

dayjs.extend(relativeTime);

// ============================================
// TERMINATION MODAL
// ============================================
const TerminationModal = ({ visible, onCancel, onOk, loading, details }) => {
  const [form] = Form.useForm();

  const terminationReasons = useMemo(
    () => [
      { value: "completed", label: "Services Completed" },
      { value: "client-request", label: "Client Request" },
      { value: "mutual-agreement", label: "Mutual Agreement" },
      { value: "non-payment", label: "Non-Payment" },
      { value: "breach-of-contract", label: "Breach of Contract" },
      { value: "firm-decision", label: "Firm Decision" },
      { value: "other", label: "Other" },
    ],
    [],
  );

  useEffect(() => {
    if (visible && details) {
      const noticePeriod = details.terminationClause?.noticePeriod?.value || 30;
      form.setFieldsValue({
        terminationDate: dayjs(),
        noticePeriod,
        effectiveDate: dayjs().add(noticePeriod, "days"),
      });
    }
  }, [visible, details, form]);

  const handleSubmit = useCallback(() => {
    form
      .validateFields()
      .then((values) => {
        onOk({
          terminationDate: values.terminationDate?.toISOString(),
          effectiveDate: values.effectiveDate?.toISOString(),
          reason: values.reason,
          otherReason: values.otherReason,
          notes: values.notes,
          finalBilling: values.finalBilling,
          handoverRequired: values.handoverRequired,
          handoverNotes: values.handoverNotes,
        });
      })
      .catch((error) => {
        console.error("Termination form validation failed:", error);
      });
  }, [form, onOk]);

  return (
    <Modal
      title={
        <Space>
          <StopOutlined className="text-red-500" />
          <span>Terminate Retainer Agreement</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={700}
      okText="Terminate Retainer"
      okButtonProps={{ danger: true }}
      cancelText="Cancel">
      <Alert
        message="Warning: Termination is Permanent"
        description="This action cannot be undone. Ensure all billing and handover processes are completed."
        type="warning"
        showIcon
        icon={<ExclamationCircleOutlined />}
        className="mb-6"
      />

      <Form form={form} layout="vertical">
        <Card title="Termination Details" size="small" className="mb-4">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="terminationDate"
                label="Termination Notice Date"
                rules={[{ required: true, message: "Please select date" }]}>
                <DatePicker
                  className="w-full"
                  format="DD/MM/YYYY"
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="noticePeriod"
                label="Notice Period (days)"
                rules={[{ required: true }]}>
                <Input type="number" disabled suffix="days" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="effectiveDate"
            label="Effective Termination Date"
            rules={[{ required: true, message: "Please select date" }]}>
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason for Termination"
            rules={[{ required: true, message: "Please select reason" }]}>
            <Select placeholder="Select termination reason">
              {terminationReasons.map((reason) => (
                <Select.Option key={reason.value} value={reason.value}>
                  {reason.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate>
            {({ getFieldValue }) =>
              getFieldValue("reason") === "other" && (
                <Form.Item
                  name="otherReason"
                  label="Please Specify"
                  rules={[
                    { required: true, message: "Please specify reason" },
                  ]}>
                  <Input placeholder="Specify the reason..." />
                </Form.Item>
              )
            }
          </Form.Item>

          <Form.Item
            name="notes"
            label="Termination Notes"
            rules={[{ required: true, message: "Please enter notes" }]}>
            <TextArea
              rows={4}
              placeholder="Document the circumstances..."
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Card>

        <Card title="Final Billing & Settlement" size="small" className="mb-4">
          <Form.Item
            name="finalBilling"
            label="Final Billing Status"
            rules={[{ required: true, message: "Please select status" }]}>
            <Select placeholder="Select billing status">
              <Select.Option value="fully-paid">Fully Paid</Select.Option>
              <Select.Option value="pending-payment">
                Pending Payment
              </Select.Option>
              <Select.Option value="partial-payment">
                Partial Payment
              </Select.Option>
              <Select.Option value="waived">Waived</Select.Option>
              <Select.Option value="disputed">Disputed</Select.Option>
            </Select>
          </Form.Item>
        </Card>

        <Card title="File Handover" size="small">
          <Form.Item
            name="handoverRequired"
            label="Document Handover Required"
            initialValue={true}>
            <Select>
              <Select.Option value={true}>Yes</Select.Option>
              <Select.Option value={false}>No</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate>
            {({ getFieldValue }) =>
              getFieldValue("handoverRequired") && (
                <Form.Item
                  name="handoverNotes"
                  label="Handover Details"
                  rules={[
                    {
                      required: true,
                      message: "Please enter handover details",
                    },
                  ]}>
                  <TextArea
                    rows={3}
                    placeholder="List documents to be returned..."
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              )
            }
          </Form.Item>
        </Card>
      </Form>
    </Modal>
  );
};

// ============================================
// SUB-COMPONENTS (ALL MEMOIZED)
// ============================================

const ClientInfoCard = React.memo(({ client }) => {
  if (!client) return null;

  return (
    <Card
      title={
        <Space>
          <UserOutlined />
          <span className="font-semibold">Client Information</span>
        </Space>
      }
      className="shadow-sm hover:shadow-md transition-shadow mb-4">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8} className="text-center">
          <Avatar
            size={80}
            src={client?.photo}
            className="mb-3 shadow-md border-2 border-blue-200"
            style={{ backgroundColor: "#1890ff" }}>
            {client?.firstName?.[0]}
            {client?.lastName?.[0]}
          </Avatar>
          <Title level={5} className="!mb-1">
            {client?.firstName} {client?.lastName}
          </Title>
          {client?.companyName && (
            <Text type="secondary" className="text-sm">
              {client?.companyName}
            </Text>
          )}
        </Col>
        <Col xs={24} sm={16}>
          <Descriptions column={1} size="small">
            <Descriptions.Item
              label={
                <Space>
                  <MailOutlined className="text-blue-500" />
                  Email
                </Space>
              }>
              <a href={`mailto:${client?.email}`} className="text-blue-600">
                {client?.email || "N/A"}
              </a>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <PhoneOutlined className="text-green-500" />
                  Phone
                </Space>
              }>
              <a href={`tel:${client?.phone}`} className="text-blue-600">
                {client?.phone || "N/A"}
              </a>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <EnvironmentOutlined className="text-red-500" />
                  Address
                </Space>
              }>
              <Text className="text-sm">{client?.address || "N/A"}</Text>
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>
    </Card>
  );
});

ClientInfoCard.displayName = "ClientInfoCard";

const RetainerDetailsCard = React.memo(({ details, metrics, isMobile }) => {
  // Handle accountOfficer as array
  const accountOfficer = Array.isArray(details.matterId?.accountOfficer)
    ? details.matterId.accountOfficer[0]
    : details.matterId?.accountOfficer;

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <span className="font-semibold">Retainer Details</span>
        </Space>
      }
      className="shadow-sm hover:shadow-md transition-shadow mb-4">
      <Descriptions bordered column={isMobile ? 1 : 2} size="small">
        <Descriptions.Item label="Matter Number" span={isMobile ? 1 : 2}>
          <Text strong className="text-blue-600">
            {details.matterId?.matterNumber}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Retainer Type">
          <Tag color="blue">
            {details.retainerType?.replace(/-/g, " ").toUpperCase()}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Badge
            status={
              metrics.isActive
                ? "success"
                : metrics.isExpired
                  ? "error"
                  : "warning"
            }
            text={
              <Tag
                color={
                  metrics.isActive
                    ? "success"
                    : metrics.isExpired
                      ? "error"
                      : "warning"
                }>
                {details.matterId?.status?.toUpperCase()}
              </Tag>
            }
          />
        </Descriptions.Item>
        <Descriptions.Item label="Start Date">
          {dayjs(details.agreementStartDate).format("DD MMM YYYY")}
        </Descriptions.Item>
        <Descriptions.Item label="End Date">
          <Space direction="vertical" size={0}>
            <span>{dayjs(details.agreementEndDate).format("DD MMM YYYY")}</span>
            {metrics.daysRemaining > 0 && (
              <Text type="secondary" className="text-xs">
                ({metrics.daysRemaining} days remaining)
              </Text>
            )}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Account Officer">
          {accountOfficer ? (
            <Space>
              <Avatar
                size="small"
                src={accountOfficer.photo}
                style={{ backgroundColor: "#1890ff" }}>
                {accountOfficer.firstName?.[0]}
              </Avatar>
              <span>
                {accountOfficer.firstName} {accountOfficer.lastName}
              </span>
            </Space>
          ) : (
            <Text type="secondary">Not Assigned</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Auto Renewal">
          {details.autoRenewal ? (
            <Space>
              <CheckCircleOutlined className="text-green-500" />
              <Text>Enabled</Text>
            </Space>
          ) : (
            <Text type="secondary">Disabled</Text>
          )}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
});

RetainerDetailsCard.displayName = "RetainerDetailsCard";

const TimelineProgressCard = React.memo(({ details, metrics }) => (
  <Card
    title={
      <Space>
        <CalendarOutlined />
        <span className="font-semibold">Timeline Progress</span>
      </Space>
    }
    className="shadow-sm hover:shadow-md transition-shadow mb-4">
    <Progress
      percent={parseFloat(metrics.progressPercent.toFixed(1))}
      status={metrics.isExpired ? "exception" : "active"}
      strokeColor={{ "0%": "#3b82f6", "100%": "#10b981" }}
    />
    <div className="flex justify-between mt-2 flex-wrap gap-2">
      <Text type="secondary" className="text-xs">
        {dayjs(details.agreementStartDate).format("MMM DD, YYYY")}
      </Text>
      <Text type="secondary" className="text-xs font-medium">
        {metrics.daysElapsed}/{metrics.totalDays} days
      </Text>
      <Text type="secondary" className="text-xs">
        {dayjs(details.agreementEndDate).format("MMM DD, YYYY")}
      </Text>
    </div>
  </Card>
));

TimelineProgressCard.displayName = "TimelineProgressCard";

const FeeAndBillingCard = React.memo(({ details }) => {
  const fee = details.billing?.retainerFee || 0;
  const currency = details.billing?.currency || "NGN";
  const frequency = details.billing?.frequency || "monthly";

  return (
    <Card
      title={
        <Space>
          <DollarOutlined />
          <span className="font-semibold">Fee & Billing</span>
        </Space>
      }
      className="shadow-sm hover:shadow-md transition-shadow mb-4">
      <Statistic
        title="Retainer Fee"
        value={fee}
        prefix="₦"
        className="mb-4"
        valueStyle={{ color: "#3f8600", fontSize: "1.5rem" }}
      />

      <Descriptions column={1} size="small">
        <Descriptions.Item label="Currency">
          <Tag color="blue">{currency}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Frequency">
          <Tag color="cyan">{frequency.toUpperCase()}</Tag>
        </Descriptions.Item>
        {details.billing?.applyVAT && (
          <Descriptions.Item label="VAT">
            <Tag color="green">{details.billing.vatRate}%</Tag>
          </Descriptions.Item>
        )}
        {details.billing?.applyWHT && (
          <Descriptions.Item label="WHT">
            <Tag color="orange">{details.billing.whtRate}%</Tag>
          </Descriptions.Item>
        )}
        {details.billing?.billingCap?.isApplicable &&
          details.billing?.billingCap?.amount && (
            <Descriptions.Item label="Billing Cap">
              ₦ {details.billing.billingCap.amount.toLocaleString()} {currency}
            </Descriptions.Item>
          )}
      </Descriptions>

      {fee > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Text strong className="block mb-2 text-sm">
            Tax Breakdown
          </Text>
          <Space direction="vertical" className="w-full" size="small">
            <div className="flex justify-between">
              <Text type="secondary" className="text-xs">
                Base Fee:
              </Text>
              <Text className="text-xs">₦ {fee.toLocaleString()}</Text>
            </div>
            {details.billing?.applyVAT && (
              <div className="flex justify-between">
                <Text type="secondary" className="text-xs">
                  VAT ({details.billing.vatRate}%):
                </Text>
                <Text className="text-xs text-green-600">
                  + ₦ {(fee * (details.billing.vatRate / 100)).toLocaleString()}
                </Text>
              </div>
            )}
            {details.billing?.applyWHT && (
              <div className="flex justify-between">
                <Text type="secondary" className="text-xs">
                  WHT ({details.billing.whtRate}%):
                </Text>
                <Text className="text-xs text-red-600">
                  - ₦ {(fee * (details.billing.whtRate / 100)).toLocaleString()}
                </Text>
              </div>
            )}
            <Divider className="my-1" />
            <div className="flex justify-between">
              <Text strong className="text-xs">
                Net Amount:
              </Text>
              <Text strong className="text-sm text-blue-600">
                ₦ {details.totalWithTax?.net?.toLocaleString() || "0"}
              </Text>
            </div>
          </Space>
        </div>
      )}
    </Card>
  );
});

FeeAndBillingCard.displayName = "FeeAndBillingCard";

const QuickActionsCard = React.memo(
  ({ metrics, onRenew, onEdit, onTerminate, onDownloadPdf }) => (
    <Card
      title={<span className="font-semibold">⚡ Quick Actions</span>}
      className="shadow-sm hover:shadow-md transition-shadow">
      <Space direction="vertical" className="w-full" size="middle">
        <Button
          type="primary"
          icon={<SyncOutlined />}
          onClick={onRenew}
          block
          disabled={!metrics.isActive}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">
          Renew Retainer
        </Button>
        <Button
          icon={<FilePdfOutlined />}
          onClick={onDownloadPdf}
          block
          className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
          Download Report
        </Button>
        <Button
          icon={<EditOutlined />}
          onClick={onEdit}
          block
          className="border-blue-500 text-blue-600 hover:bg-blue-50">
          Edit Details
        </Button>
        <Button
          danger
          icon={<StopOutlined />}
          onClick={onTerminate}
          block
          disabled={!metrics.isActive}>
          Terminate Retainer
        </Button>
      </Space>
    </Card>
  ),
);

QuickActionsCard.displayName = "QuickActionsCard";

const RecentActivity = React.memo(({ activities = [] }) => {
  const displayActivities = useMemo(
    () => (activities.length > 0 ? activities.slice(0, 5) : []),
    [activities],
  );

  if (displayActivities.length === 0) {
    return (
      <Card
        title={<span className="font-semibold">📊 Recent Activity</span>}
        className="shadow-sm hover:shadow-md transition-shadow">
        <div className="text-center py-8">
          <Text type="secondary">No recent activity</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={<span className="font-semibold">📊 Recent Activity</span>}
      className="shadow-sm hover:shadow-md transition-shadow">
      <Timeline>
        {displayActivities.map((activity, index) => (
          <Timeline.Item key={activity._id || index} color="blue">
            <Space direction="vertical" size={0}>
              <Text strong>{activity.description || "Activity"}</Text>
              <Text type="secondary" className="text-xs">
                {dayjs(activity.actionDate).fromNow()}
                {activity.performedBy && ` • ${activity.performedBy}`}
              </Text>
            </Space>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );
});

RecentActivity.displayName = "RecentActivity";

// ============================================
// MAIN COMPONENT
// ============================================
const RetainerDetails = ({ matterId, onClose }) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ✅ FIX: Get Redux state first (before any conditional logic)
  const selectedDetails = useSelector(
    (state) => state.retainer.selectedDetails,
  );
  const actionLoading = useSelector((state) => state.retainer.actionLoading);
  const detailsLoading = useSelector((state) => state.retainer.detailsLoading);

  // ✅ FIX: Extract details safely - handle both response structures
  const details = useMemo(() => {
    if (!selectedDetails) return null;
    // API wraps response in { data: { retainerDetail: {...} } }
    return selectedDetails.retainerDetail || selectedDetails;
  }, [selectedDetails]);

  // ✅ All hooks MUST be called before any conditional returns
  // Responsive handler
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch details
  useEffect(() => {
    if (matterId) {
      dispatch(fetchRetainerDetails(matterId));
    }
  }, [dispatch, matterId]);

  // Memoized metrics
  const metrics = useMemo(() => {
    if (!details) {
      return {
        daysRemaining: 0,
        daysElapsed: 0,
        totalDays: 0,
        progressPercent: 0,
        isExpiringSoon: false,
        isExpired: false,
        isActive: false,
        hasPendingRequests: false,
      };
    }

    const now = dayjs();
    const endDate = dayjs(details.agreementEndDate);
    const startDate = dayjs(details.agreementStartDate);
    const totalDays = Math.max(endDate.diff(startDate, "day"), 1);
    const daysElapsed = now.diff(startDate, "day");
    const daysRemaining = endDate.diff(now, "day");
    const progressPercent = Math.min(
      Math.max((daysElapsed / totalDays) * 100, 0),
      100,
    );

    return {
      daysRemaining,
      daysElapsed,
      totalDays,
      progressPercent,
      isExpiringSoon: daysRemaining <= 30 && daysRemaining > 0,
      isExpired: daysRemaining < 0,
      isActive: details.matterId?.status === "active",
      hasPendingRequests:
        details.requests?.some((r) => r.status === "pending") || false,
    };
  }, [details]);

  // Memoized handlers
  const handleEdit = useCallback(() => setIsEditing(true), []);
  const handleEditCancel = useCallback(() => setIsEditing(false), []);

  const handleEditSuccess = useCallback(() => {
    setIsEditing(false);
    dispatch(fetchRetainerDetails(matterId));
    message.success("Retainer updated successfully");
  }, [dispatch, matterId]);

  const handleRenewal = useCallback(
    async (renewalData) => {
      try {
        await dispatch(renewRetainer({ matterId, data: renewalData })).unwrap();
        message.success("Retainer renewed successfully");
        setShowRenewalModal(false);
        dispatch(fetchRetainerDetails(matterId));
      } catch (error) {
        message.error(error.message || "Failed to renew retainer");
      }
    },
    [dispatch, matterId],
  );

  const handleTermination = useCallback(
    async (terminationData) => {
      try {
        await dispatch(
          terminateRetainer({ matterId, data: terminationData }),
        ).unwrap();
        message.success("Retainer terminated successfully");
        setShowTerminationModal(false);
        dispatch(fetchRetainerDetails(matterId));
      } catch (error) {
        message.error(error.message || "Failed to terminate retainer");
      }
    },
    [dispatch, matterId],
  );

  // Download PDF Report
  const handleDownloadPdf = useCallback(async () => {
    try {
      message.loading({ content: "Generating PDF report...", key: "pdf" });
      await downloadRetainerReport(matterId, "retainer");
      message.success({ content: "PDF report downloaded successfully!", key: "pdf" });
    } catch (error) {
      message.error({ content: "Failed to download PDF report", key: "pdf" });
    }
  }, [matterId]);

  // ✅ NOW we can do conditional returns (all hooks have been called)
  if (detailsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] flex-col">
        <Spin size="large" />
        <Text className="mt-4 text-gray-600">Loading retainer details...</Text>
      </div>
    );
  }

  if (!details) {
    return (
      <Card className="text-center p-10 m-6 shadow-lg">
        <Title level={4} className="text-gray-700">
          No Retainer Found
        </Title>
        <Text type="secondary">The requested retainer could not be loaded</Text>
        <div className="mt-6">
          <Button type="primary" onClick={onClose} size="large">
            Back to List
          </Button>
        </div>
      </Card>
    );
  }

  // Overview Tab Content - Can now safely use details
  const OverviewTabContent = (
    <div className="p-4 md:p-6">
      <Row gutter={[16, 24]}>
        <Col xs={24} lg={16}>
          <ClientInfoCard client={details.matterId?.client} />
          <RetainerDetailsCard
            details={details}
            metrics={metrics}
            isMobile={isMobile}
          />

          {/* Scope Card */}
          <Card
            title={
              <Space>
                <TeamOutlined />
                <span className="font-semibold">Scope of Services</span>
              </Space>
            }
            className="shadow-sm hover:shadow-md transition-shadow">
            <Paragraph className="whitespace-pre-wrap mb-4">
              {details.scopeDescription || "No scope description provided"}
            </Paragraph>

            {details.exclusions?.length > 0 && (
              <>
                <Divider orientation="left">Exclusions</Divider>
                <ul className="list-disc list-inside">
                  {details.exclusions.map((item, index) => (
                    <li key={index}>
                      <Text type="secondary">{item}</Text>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {details.servicesIncluded?.length > 0 && (
              <>
                <Divider orientation="left">Services Included</Divider>
                <Space direction="vertical" className="w-full" size="small">
                  {details.servicesIncluded.map((service, index) => (
                    <Card
                      key={service._id || index}
                      size="small"
                      className="bg-blue-50">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <Text strong>
                            {service.serviceType
                              ?.replace(/-/g, " ")
                              .toUpperCase()}
                          </Text>
                          <br />
                          <Text type="secondary" className="text-xs">
                            {service.description}
                          </Text>
                        </div>
                        <Space>
                          <Tag color="blue">{service.billingModel}</Tag>
                          <Tag color="green">{service.lproScale}</Tag>
                        </Space>
                      </div>
                      <div className="mt-2 flex gap-4 flex-wrap">
                        <Text className="text-xs">
                          <strong>Limit:</strong> {service.serviceLimit}{" "}
                          {service.unitDescription}
                        </Text>
                        <Text className="text-xs">
                          <strong>Used:</strong> {service.usageCount || 0}
                        </Text>
                        <Text className="text-xs">
                          <strong>Remaining:</strong>{" "}
                          {service.serviceLimit - (service.usageCount || 0)}
                        </Text>
                      </div>
                    </Card>
                  ))}
                </Space>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {metrics.isExpiringSoon && metrics.isActive && (
            <Alert
              message="⚠️ Retainer Expiring Soon"
              description={`Expires in ${metrics.daysRemaining} days. Consider renewal.`}
              type="warning"
              showIcon
              className="mb-4"
              action={
                <Button
                  size="small"
                  type="primary"
                  onClick={() => setShowRenewalModal(true)}
                  className="bg-yellow-600 hover:bg-yellow-700">
                  Renew
                </Button>
              }
            />
          )}

          {metrics.isExpired && (
            <Alert
              message="❌ Retainer Expired"
              description="This agreement has expired."
              type="error"
              showIcon
              className="mb-4"
            />
          )}

          {metrics.hasPendingRequests && (
            <Alert
              message="📬 Pending Requests"
              description={`${details.requests?.filter((r) => r.status === "pending").length} pending request(s)`}
              type="info"
              showIcon
              className="mb-4"
              action={
                <Button size="small" onClick={() => setActiveTab("requests")}>
                  View
                </Button>
              }
            />
          )}

          <TimelineProgressCard details={details} metrics={metrics} />
          <FeeAndBillingCard details={details} />
          <QuickActionsCard
            metrics={metrics}
            onRenew={() => setShowRenewalModal(true)}
            onEdit={handleEdit}
            onTerminate={() => setShowTerminationModal(true)}
            onDownloadPdf={handleDownloadPdf}
          />
        </Col>
      </Row>

      <Divider />
      <RecentActivity activities={details.activityLog} />
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            type="link"
            onClick={onClose}
            className="pl-0 text-blue-600 hover:text-blue-700">
            ← Back to Retainer List
          </Button>

          <div className="mt-2 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <Space
                direction={isMobile ? "vertical" : "horizontal"}
                align="start"
                size={isMobile ? 4 : 12}>
                <Title level={isMobile ? 4 : 3} className="!mb-0">
                  {details.matterId?.client?.companyName ||
                    `${details.matterId?.client?.firstName} ${details.matterId?.client?.lastName}`}
                </Title>
                <Tag
                  color={
                    details.matterId?.status === "active"
                      ? "success"
                      : details.matterId?.status === "pending"
                        ? "warning"
                        : "error"
                  }>
                  {details.matterId?.status?.toUpperCase()}
                </Tag>
              </Space>
              <Text type="secondary" className="block mt-2 text-sm">
                {details.retainerType?.replace(/-/g, " ").toUpperCase()} • #
                {details.matterId?.matterNumber}
              </Text>
            </div>

            <Button
              icon={<EyeOutlined />}
              onClick={() => window.print()}
              className="border-blue-500 text-blue-600 hidden md:inline-flex">
              Print
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size={isMobile ? "small" : "large"}
          type="card"
          className="bg-white rounded-xl shadow-lg overflow-hidden"
          items={[
            {
              key: "overview",
              label: (
                <Space>
                  <EyeOutlined />
                  {!isMobile && "Overview"}
                </Space>
              ),
              children: OverviewTabContent,
            },
            {
              key: "services",
              label: (
                <Space>
                  <TeamOutlined />
                  {!isMobile && "Services"}
                </Space>
              ),
              children: (
                <div className="p-4 md:p-6">
                  <ServicesManager matterId={matterId} />
                </div>
              ),
            },
            {
              key: "requests",
              label: (
                <Space>
                  <FileTextOutlined />
                  {!isMobile && "Requests"}
                  {metrics.hasPendingRequests && (
                    <Badge
                      count={
                        details.requests?.filter((r) => r.status === "pending")
                          .length
                      }
                    />
                  )}
                </Space>
              ),
              children: (
                <div className="p-4 md:p-6">
                  <RequestsManager matterId={matterId} />
                </div>
              ),
            },
            {
              key: "disbursements",
              label: (
                <Space>
                  <DollarOutlined />
                  {!isMobile && "Disbursements"}
                  {details.disbursements?.length > 0 && (
                    <Badge count={details.disbursements.length} />
                  )}
                </Space>
              ),
              children: (
                <div className="p-4 md:p-6">
                  <DisbursementsManager matterId={matterId} />
                </div>
              ),
            },
            {
              key: "court",
              label: (
                <Space>
                  <CalendarOutlined />
                  {!isMobile && "Court"}
                  {details.courtAppearances?.length > 0 && (
                    <Badge count={details.courtAppearances.length} />
                  )}
                </Space>
              ),
              children: (
                <div className="p-4 md:p-6">
                  <CourtAppearancesManager matterId={matterId} />
                </div>
              ),
            },
          ]}
        />

        {/* Modals */}
        <Modal
          title="✏️ Edit Retainer Details"
          open={isEditing}
          onCancel={handleEditCancel}
          footer={null}
          width={isMobile ? "100%" : 900}
          destroyOnClose
          style={isMobile ? { top: 0, padding: 0 } : {}}>
          <RetainerForm
            retainerDetails={details}
            onCancel={handleEditCancel}
            onSuccess={handleEditSuccess}
          />
        </Modal>

        <RenewalModal
          visible={showRenewalModal}
          onCancel={() => setShowRenewalModal(false)}
          onOk={handleRenewal}
          loading={actionLoading}
          currentEndDate={details?.agreementEndDate}
          currentRetainerFee={details?.billing}
        />

        <TerminationModal
          visible={showTerminationModal}
          onCancel={() => setShowTerminationModal(false)}
          onOk={handleTermination}
          loading={actionLoading}
          details={details}
        />
      </div>
    </div>
  );
};

export default RetainerDetails;
