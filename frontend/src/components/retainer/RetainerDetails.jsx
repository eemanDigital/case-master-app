import React, { useState, useEffect } from "react";
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
  Dropdown,
  Menu,
  Spin,
  message,
  Form,
  Input,
  Select,
  DatePicker,
} from "antd";
import {
  EditOutlined,
  CloseOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  MoreOutlined,
  DownloadOutlined,
  PrinterOutlined,
  ShareAltOutlined,
  HistoryOutlined,
  EyeOutlined,
  SettingOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import RetainerForm from "./RetainerForm";
import BillingForm from "./BillingForm";
import RequestsManager from "./RequestsManager";
import ServicesManager from "./ServicesManager";
import RenewalModal from "./RenewalModal";
import {
  updateRetainerDetails,
  renewRetainer,
  terminateRetainer,
  fetchRetainerDetails,
} from "../../redux/features/retainer/retainerSlice";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

dayjs.extend(relativeTime);

// ============================================
// TERMINATION MODAL COMPONENT
// ============================================
const TerminationModal = ({ visible, onCancel, onOk, loading, details }) => {
  const [form] = Form.useForm();

  const terminationReasons = [
    { value: "completed", label: "Services Completed" },
    { value: "client-request", label: "Client Request" },
    { value: "mutual-agreement", label: "Mutual Agreement" },
    { value: "non-payment", label: "Non-Payment" },
    { value: "breach-of-contract", label: "Breach of Contract" },
    { value: "firm-decision", label: "Firm Decision" },
    { value: "other", label: "Other" },
  ];

  useEffect(() => {
    if (visible && details) {
      form.setFieldsValue({
        terminationDate: dayjs(),
        noticePeriod: details.terminationClause?.noticePeriod?.value || 30,
        effectiveDate: dayjs().add(
          details.terminationClause?.noticePeriod?.value || 30,
          "days",
        ),
      });
    }
  }, [visible, details, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onOk({
        terminationDate: values.terminationDate.toISOString(),
        effectiveDate: values.effectiveDate.toISOString(),
        reason: values.reason,
        otherReason: values.otherReason,
        notes: values.notes,
        finalBilling: values.finalBilling,
        handoverRequired: values.handoverRequired,
        handoverNotes: values.handoverNotes,
      });
    });
  };

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
        description="Terminating this retainer will end the agreement and archive all records. This action cannot be undone. Ensure all billing and handover processes are completed."
        type="warning"
        showIcon
        icon={<ExclamationCircleOutlined />}
        className="mb-6"
      />

      <Form form={form} layout="vertical">
        {/* Termination Details */}
        <Card title="Termination Details" size="small" className="mb-4">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="terminationDate"
                label="Termination Notice Date"
                rules={[{ required: true, message: "Please select date" }]}>
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="noticePeriod"
                label="Notice Period (days)"
                rules={[{ required: true, message: "Required" }]}>
                <Input
                  type="number"
                  disabled
                  suffix="days"
                  addonAfter={
                    <Text type="secondary" className="text-xs">
                      As per contract
                    </Text>
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="effectiveDate"
            label="Effective Termination Date"
            rules={[{ required: true, message: "Please select date" }]}
            extra="Date when the retainer officially ends">
            <DatePicker
              style={{ width: "100%" }}
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
              placeholder="Document the circumstances and any relevant details about this termination..."
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Card>

        {/* Final Billing */}
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

        {/* Handover */}
        <Card title="File Handover" size="small">
          <Form.Item
            name="handoverRequired"
            label="Document Handover Required"
            valuePropName="checked"
            initialValue={true}>
            <Select placeholder="Select">
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
                    placeholder="List documents to be returned, files to be handed over, or other handover requirements..."
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
// MODULAR COMPONENTS
// ============================================

// Client Info Component
const ClientInfoCard = ({ client }) => (
  <Card
    title={
      <Space>
        <UserOutlined />
        <span className="font-semibold">Client Information</span>
      </Space>
    }
    className="shadow-sm hover:shadow-md transition-shadow mb-4"
    extra={
      <Button type="link" size="small" className="text-blue-600">
        View Full Profile
      </Button>
    }>
    <Row gutter={16}>
      <Col xs={24} sm={8} className="text-center mb-4 sm:mb-0">
        <Avatar
          size={80}
          src={client?.photo}
          className="mb-3 shadow-md border-2 border-blue-200">
          {client?.firstName?.[0]}
          {client?.lastName?.[0]}
        </Avatar>
        <Title level={5} className="!mb-1">
          {client?.firstName} {client?.lastName}
        </Title>
        <Text type="secondary" className="text-sm">
          {client?.companyName}
        </Text>
      </Col>
      <Col xs={24} sm={16}>
        <Descriptions column={1} size="small">
          <Descriptions.Item
            label={
              <Space>
                <MailOutlined className="text-blue-500" />
                <span className="font-medium">Email</span>
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
                <span className="font-medium">Phone</span>
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
                <span className="font-medium">Address</span>
              </Space>
            }>
            {client?.address || "N/A"}
          </Descriptions.Item>
        </Descriptions>
      </Col>
    </Row>
  </Card>
);

// Retainer Details Card
const RetainerDetailsCard = ({ details, metrics, mobileView }) => (
  <Card
    title={
      <Space>
        <FileTextOutlined />
        <span className="font-semibold">Retainer Details</span>
      </Space>
    }
    className="shadow-sm hover:shadow-md transition-shadow mb-4">
    <Descriptions bordered column={mobileView ? 1 : 2} size="small">
      <Descriptions.Item label="Matter Number" span={mobileView ? 1 : 2}>
        <Text strong className="text-blue-600">
          {details.matter?.matterNumber}
        </Text>
      </Descriptions.Item>
      <Descriptions.Item label="Retainer Type">
        <Tag
          color={
            details.retainerType === "general-counsel"
              ? "blue"
              : details.retainerType === "advisory"
                ? "green"
                : details.retainerType === "compliance"
                  ? "orange"
                  : details.retainerType === "specialized"
                    ? "purple"
                    : "default"
          }>
          {details.retainerType?.replace("-", " ").toUpperCase()}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Status">
        <Badge
          status={
            metrics.isActive
              ? "success"
              : metrics.isExpired
                ? "error"
                : metrics.isOverdue
                  ? "warning"
                  : "default"
          }
          text={
            <Tag
              color={
                metrics.isActive
                  ? "success"
                  : metrics.isExpired
                    ? "error"
                    : metrics.isOverdue
                      ? "warning"
                      : "default"
              }>
              {details.matter?.status?.toUpperCase()}
            </Tag>
          }
        />
      </Descriptions.Item>
      <Descriptions.Item label="Start Date">
        {dayjs(details.agreementStartDate).format("DD MMM YYYY")}
      </Descriptions.Item>
      <Descriptions.Item label="End Date">
        <Space>
          {dayjs(details.agreementEndDate).format("DD MMM YYYY")}
          {metrics.daysRemaining > 0 && (
            <Text type="secondary" className="text-xs">
              ({metrics.daysRemaining} days remaining)
            </Text>
          )}
        </Space>
      </Descriptions.Item>
      <Descriptions.Item label="Account Officer">
        <Space>
          <Avatar size="small" src={details.matter?.accountOfficer?.photo}>
            {details.matter?.accountOfficer?.firstName?.[0]}
          </Avatar>
          <span>
            {details.matter?.accountOfficer?.firstName}{" "}
            {details.matter?.accountOfficer?.lastName}
          </span>
        </Space>
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

// Timeline Progress Card
const TimelineProgressCard = ({ details, metrics }) => (
  <Card
    title={
      <Space>
        <CalendarOutlined />
        <span className="font-semibold">Timeline Progress</span>
      </Space>
    }
    className="shadow-sm hover:shadow-md transition-shadow mb-4">
    <div className="mb-4">
      <Progress
        percent={parseFloat(metrics.progressPercent.toFixed(1))}
        status={metrics.isExpired ? "exception" : "active"}
        strokeColor={{
          "0%": "#3b82f6",
          "100%": "#10b981",
        }}
      />
      <div className="flex justify-between mt-2">
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
    </div>
  </Card>
);

// Fee & Billing Card
const FeeAndBillingCard = ({ details }) => (
  <Card
    title={
      <Space>
        <DollarOutlined />
        <span className="font-semibold">Fee & Billing</span>
      </Space>
    }
    className="shadow-sm hover:shadow-md transition-shadow mb-4">
    <Statistic
      title="Monthly Retainer Fee"
      value={details.billing?.retainerFee || details.retainerFee?.amount}
      prefix="₦"
      suffix={
        details.billing?.currency || details.retainerFee?.currency || "NGN"
      }
      className="mb-4"
      valueStyle={{ color: "#3f8600", fontSize: "1.5rem" }}
    />

    <Descriptions column={1} size="small">
      <Descriptions.Item label="Billing Frequency">
        <Tag color="blue">
          {(
            details.billing?.frequency ||
            details.retainerFee?.frequency ||
            "monthly"
          ).toUpperCase()}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Next Billing Date">
        {dayjs().add(1, "month").startOf("month").format("DD MMM YYYY")}
      </Descriptions.Item>
      {details.billing?.billingCap?.amount && (
        <Descriptions.Item label="Billing Cap">
          <Text>
            ₦ {details.billing.billingCap.amount.toLocaleString()}{" "}
            {details.billing?.currency || "NGN"}
          </Text>
        </Descriptions.Item>
      )}
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
    </Descriptions>
  </Card>
);

// Quick Actions Card
const QuickActionsCard = ({
  metrics,
  onRenew,
  onEdit,
  onTerminate,
  onViewBilling,
}) => (
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
        icon={<EditOutlined />}
        onClick={onEdit}
        block
        className="border-blue-500 text-blue-600 hover:bg-blue-50">
        Edit Details
      </Button>
      <Button
        icon={<FileTextOutlined />}
        onClick={onViewBilling}
        block
        className="border-green-500 text-green-600 hover:bg-green-50">
        View Billing
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
);

// Recent Activity Component
const RecentActivity = ({ activities = [] }) => {
  const defaultActivities = [
    {
      time: "2 hours ago",
      action: "Service hours updated",
      user: "John Doe",
      color: "green",
    },
    {
      time: "1 day ago",
      action: "Client request completed",
      user: "Jane Smith",
      color: "blue",
    },
    {
      time: "3 days ago",
      action: "Invoice generated",
      user: "System",
      color: "blue",
    },
    {
      time: "1 week ago",
      action: "Retainer details updated",
      user: "John Doe",
      color: "blue",
    },
    {
      time: "2 weeks ago",
      action: "Monthly report sent",
      user: "System",
      color: "blue",
    },
  ];

  const displayActivities =
    activities.length > 0 ? activities : defaultActivities;

  return (
    <Card
      title={<span className="font-semibold">📊 Recent Activity</span>}
      className="shadow-sm hover:shadow-md transition-shadow">
      <Timeline>
        {displayActivities.map((activity, index) => (
          <Timeline.Item key={index} color={activity.color}>
            <Space direction="vertical" size={0}>
              <Text strong>{activity.action}</Text>
              <Text type="secondary" className="text-xs">
                {activity.time} • By {activity.user}
              </Text>
            </Space>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const RetainerDetails = ({ matterId, onClose, initialEditMode = false }) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [mobileView, setMobileView] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const details = useSelector((state) => state.retainer.selectedDetails);
  const actionLoading = useSelector((state) => state.retainer.actionLoading);
  const detailsLoading = useSelector((state) => state.retainer.detailsLoading);

  useEffect(() => {
    if (matterId) {
      dispatch(fetchRetainerDetails(matterId));
    }
  }, [dispatch, matterId]);

  const calculateMetrics = () => {
    if (!details) return {};

    const now = dayjs();
    const endDate = dayjs(details.agreementEndDate);
    const startDate = dayjs(details.agreementStartDate);
    const totalDays = endDate.diff(startDate, "day");
    const daysElapsed = now.diff(startDate, "day");
    const daysRemaining = endDate.diff(now, "day");
    const progressPercent = Math.min(
      Math.max((daysElapsed / totalDays) * 100, 0),
      100,
    );

    const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;
    const isExpired = daysRemaining < 0;
    const isActive = details.matter?.status === "active";
    const isOverdue = details.matter?.status === "overdue";
    const hasPendingRequests = details.requests?.some(
      (r) => r.status === "pending",
    );

    return {
      daysRemaining,
      daysElapsed,
      totalDays,
      progressPercent,
      isExpiringSoon,
      isExpired,
      isActive,
      isOverdue,
      hasPendingRequests,
    };
  };

  const metrics = calculateMetrics();

  const handleEdit = () => setIsEditing(true);
  const handleEditCancel = () => setIsEditing(false);
  const handleEditSuccess = () => {
    setIsEditing(false);
    dispatch(fetchRetainerDetails(matterId));
  };

  const handleRenewal = async (renewalData) => {
    try {
      await dispatch(renewRetainer({ matterId, data: renewalData })).unwrap();
      message.success("Retainer renewed successfully");
      setShowRenewalModal(false);
      dispatch(fetchRetainerDetails(matterId));
    } catch (error) {
      message.error(error.message || "Failed to renew retainer");
    }
  };

  const handleTermination = async (terminationData) => {
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
  };

  const handleBillingSave = async (billingData) => {
    try {
      // Add billing logic here
      message.success("Billing saved successfully");
      setShowBillingForm(false);
    } catch (error) {
      message.error(error.message || "Failed to save billing");
    }
  };

  const actionMenu = (
    <Menu>
      <Menu.Item key="download" icon={<DownloadOutlined />}>
        Export as PDF
      </Menu.Item>
      <Menu.Item key="print" icon={<PrinterOutlined />}>
        Print Details
      </Menu.Item>
      <Menu.Item key="share" icon={<ShareAltOutlined />}>
        Share with Team
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="history"
        icon={<HistoryOutlined />}
        onClick={() => setShowHistory(true)}>
        View History
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        Settings
      </Menu.Item>
    </Menu>
  );

  if (detailsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] flex-col p-10">
        <Spin size="large" />
        <Text className="mt-4 text-gray-600">Loading retainer details...</Text>
      </div>
    );
  }

  if (!details) {
    return (
      <Card className="text-center p-10 m-6 shadow-lg">
        <Title level={4} className="text-gray-700">
          No Retainer Selected
        </Title>
        <Text type="secondary">
          Select a retainer from the list to view details
        </Text>
        <div className="mt-6">
          <Button type="primary" onClick={onClose} size="large">
            Back to List
          </Button>
        </div>
      </Card>
    );
  }

  const OverviewTab = () => (
    <Row gutter={[mobileView ? 0 : 24, 24]}>
      <Col xs={24} lg={16}>
        <ClientInfoCard client={details.matter?.client} />
        <RetainerDetailsCard
          details={details}
          metrics={metrics}
          mobileView={mobileView}
        />

        {/* Scope Description Card */}
        <Card
          title={
            <Space>
              <TeamOutlined />
              <span className="font-semibold">Scope of Services</span>
            </Space>
          }
          className="shadow-sm hover:shadow-md transition-shadow">
          <Paragraph className="whitespace-pre-wrap mb-4">
            {details.scopeDescription}
          </Paragraph>

          {details.exclusions && details.exclusions.length > 0 && (
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
        </Card>
      </Col>

      <Col xs={24} lg={8}>
        {/* Status Alerts */}
        {metrics.isExpiringSoon && metrics.isActive && (
          <Alert
            message="⚠️ Retainer Expiring Soon"
            description={`Expires in ${metrics.daysRemaining} days. Consider renewal options.`}
            type="warning"
            showIcon
            className="mb-4 border-yellow-300"
            action={
              <Button
                size="small"
                type="primary"
                onClick={() => setShowRenewalModal(true)}
                className="bg-yellow-600 hover:bg-yellow-700">
                Renew Now
              </Button>
            }
          />
        )}

        {metrics.isExpired && (
          <Alert
            message="❌ Retainer Expired"
            description="This retainer agreement has expired. Please renew or close the matter."
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        {metrics.hasPendingRequests && (
          <Alert
            message="📬 Pending Requests"
            description="There are pending client requests that require attention."
            type="info"
            showIcon
            className="mb-4"
          />
        )}

        <TimelineProgressCard details={details} metrics={metrics} />
        <FeeAndBillingCard details={details} />
        <QuickActionsCard
          metrics={metrics}
          onRenew={() => setShowRenewalModal(true)}
          onEdit={handleEdit}
          onTerminate={() => setShowTerminationModal(true)}
          onViewBilling={() => setActiveTab("billing")}
        />
      </Col>
    </Row>
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

          <Row justify="space-between" align="middle" className="mt-2">
            <Col>
              <Space
                direction={mobileView ? "vertical" : "horizontal"}
                align={mobileView ? "start" : "center"}>
                <Title level={mobileView ? 4 : 3} className="!mb-0">
                  {details.matter?.client?.companyName}
                  <Text type="secondary" className="ml-2 text-sm font-normal">
                    #{details.matter?.matterNumber}
                  </Text>
                </Title>
                <Tag
                  color={
                    details.matter?.status === "active"
                      ? "success"
                      : details.matter?.status === "pending"
                        ? "warning"
                        : "error"
                  }
                  className="text-xs">
                  {details.matter?.status?.toUpperCase()}
                </Tag>
              </Space>
              <Text type="secondary" className="block mt-2">
                {details.retainerType?.replace("-", " ").toUpperCase()} •
                Started{" "}
                {dayjs(details.agreementStartDate).format("DD MMM YYYY")}
              </Text>
            </Col>

            <Col>
              <Space wrap>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => window.print()}
                  className="border-blue-500 text-blue-600">
                  Print
                </Button>
                <Dropdown overlay={actionMenu} trigger={["click"]}>
                  <Button icon={<MoreOutlined />} />
                </Dropdown>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Main Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size={mobileView ? "small" : "middle"}
          type="card"
          className="bg-white rounded-xl shadow-lg overflow-hidden"
          items={[
            {
              key: "overview",
              label: (
                <Space>
                  <EyeOutlined />
                  Overview
                </Space>
              ),
              children: (
                <>
                  <div className="p-6">
                    <OverviewTab />
                  </div>
                  <Divider />
                  <div className="p-6">
                    <RecentActivity activities={details.activityLog} />
                  </div>
                </>
              ),
            },
            {
              key: "services",
              label: (
                <Space>
                  <TeamOutlined />
                  Services
                </Space>
              ),
              children: (
                <div className="p-6">
                  <ServicesManager matterId={matterId} />
                </div>
              ),
            },
            {
              key: "requests",
              label: (
                <Space>
                  <FileTextOutlined />
                  Requests
                  {metrics.hasPendingRequests && (
                    <Badge
                      count={
                        details.requests?.filter((r) => r.status === "pending")
                          .length
                      }
                      className="ml-1"
                    />
                  )}
                </Space>
              ),
              children: (
                <div className="p-6">
                  <RequestsManager matterId={matterId} />
                </div>
              ),
            },
            {
              key: "billing",
              label: (
                <Space>
                  <DollarOutlined />
                  Billing
                </Space>
              ),
              children: (
                <div className="p-6">
                  {showBillingForm ? (
                    <BillingForm
                      retainerDetails={details}
                      onSave={handleBillingSave}
                      onCancel={() => setShowBillingForm(false)}
                    />
                  ) : (
                    <Card className="text-center p-10">
                      <FileTextOutlined className="text-6xl text-blue-500 mb-4" />
                      <Title level={5}>Create Invoice</Title>
                      <Text type="secondary" className="block mb-4">
                        Generate a new invoice for this retainer
                      </Text>
                      <Button
                        type="primary"
                        size="large"
                        onClick={() => setShowBillingForm(true)}>
                        Create Invoice
                      </Button>
                    </Card>
                  )}
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
          width={mobileView ? "100%" : 900}
          style={mobileView ? { top: 0, margin: 0 } : {}}>
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

        <Modal
          title="📜 Retainer History"
          open={showHistory}
          onCancel={() => setShowHistory(false)}
          footer={null}
          width={mobileView ? "100%" : 800}>
          <Card>
            <Timeline mode="left">
              <Timeline.Item color="green">
                <Text strong>Retainer Created</Text>
                <br />
                <Text type="secondary">
                  {dayjs(details.createdAt).format("DD MMM YYYY, HH:mm")} by
                  System
                </Text>
              </Timeline.Item>
              <Timeline.Item color="blue">
                <Text strong>First Invoice Generated</Text>
                <br />
                <Text type="secondary">
                  {dayjs(details.agreementStartDate).format("DD MMM YYYY")}
                </Text>
              </Timeline.Item>
              {details.updatedAt && (
                <Timeline.Item color="orange">
                  <Text strong>Last Updated</Text>
                  <br />
                  <Text type="secondary">
                    {dayjs(details.updatedAt).format("DD MMM YYYY, HH:mm")}
                  </Text>
                </Timeline.Item>
              )}
            </Timeline>
          </Card>
        </Modal>
      </div>
    </div>
  );
};

export default RetainerDetails;
