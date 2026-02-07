import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Tag,
  Space,
  Button,
  Tabs,
  Descriptions,
  Statistic,
  Progress,
  Timeline,
  List,
  Avatar,
  Badge,
  Alert,
  Spin,
  Divider,
  Modal,
  Typography,
  Breadcrumb,
  Empty,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  SaveOutlined,
  FileTextOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  ShareAltOutlined,
  CrownOutlined,
  AuditOutlined,
  FileDoneOutlined,
  WarningOutlined,
  HistoryOutlined,
  PrinterOutlined,
  DownloadOutlined,
  FileAddOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  fetchCorporateDetails,
  updateCorporateDetails,
  selectSelectedDetails,
  selectDetailsLoading,
  selectActionLoading,
  createCorporateDetails,
} from "../../redux/features/corporate/corporateSlice";
import PartiesManager from "../../components/corporate/PartiesManager";
import ShareholdersManager from "../../components/corporate/ShareholdersManager";
import DirectorsManager from "../../components/corporate/DirectorsManager";
import MilestonesManager from "../../components/corporate/MilestonesManager";
import TransactionClosingModal from "../../components/corporate/TransactionClosingModal";

import {
  TRANSACTION_TYPES,
  COMPANY_TYPES,
  formatCurrency,
  getTransactionTypeLabel,
  getCompanyTypeLabel,
  getMilestoneStatusColor,
  getRiskSeverityColor,
  isOverdue,
  getDaysUntil,
} from "../../utils/corporateConstants";
import CorporateForm from "../../components/corporate/CorporateForm";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

dayjs.extend(relativeTime);

const CorporateDetails = () => {
  const { matterId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const corporateDetails = useSelector(selectSelectedDetails);
  const detailsLoading = useSelector(selectDetailsLoading);
  const actionLoading = useSelector(selectActionLoading);

  // Local state
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showClosingModal, setShowClosingModal] = useState(false);

  // Fetch details on mount
  useEffect(() => {
    if (matterId) {
      dispatch(fetchCorporateDetails(matterId));
    }
  }, [dispatch, matterId]);

  // Handle form submission for create/update
  const handleSubmit = (values) => {
    if (corporateDetails) {
      // Update existing
      dispatch(updateCorporateDetails({ matterId, data: values })).then(() => {
        setEditMode(false);
      });
    } else {
      // Create new
      dispatch(createCorporateDetails({ matterId, data: values })).then(() => {
        setEditMode(false);
      });
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate("/dashboard/matters/corporate");
  };

  // Print details
  const handlePrint = () => {
    window.print();
  };

  // Export details
  const handleExport = () => {
    Modal.info({
      title: "Export Corporate Details",
      content: "Export feature will be implemented soon.",
    });
  };

  // Handle transaction closing
  const handleCloseTransaction = () => {
    setShowClosingModal(true);
  };

  // Loading state
  if (detailsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading corporate details..." />
      </div>
    );
  }

  const {
    transactionType,
    companyName,
    registrationNumber,
    companyType,
    registrationDate,
    incorporationJurisdiction,
    dealValue,
    authorizedShareCapital,
    paidUpCapital,
    paymentStructure,
    paymentTerms,
    expectedClosingDate,
    actualClosingDate,
    dueDiligence = {},
    governanceStructure = {},
    parties = [],
    shareholders = [],
    directors = [],
    milestones = [],
    regulatoryApprovals = [],
    keyAgreements = [],
    complianceRequirements = [],
    identifiedRisks = [],
    postCompletionObligations = [],
    createdAt,
    updatedAt,
  } = corporateDetails || {};

  const transactionTypeConfig = TRANSACTION_TYPES.find(
    (t) => t.value === transactionType,
  );

  // Calculate metrics
  const totalShareholders = shareholders.length;
  const totalDirectors = directors.length;
  const completedMilestones = milestones.filter(
    (m) => m.status === "completed",
  ).length;
  const pendingApprovals = regulatoryApprovals.filter(
    (a) => a.status === "pending",
  ).length;
  const criticalRisks = identifiedRisks.filter(
    (r) => r.severity === "critical" || r.severity === "high",
  ).length;
  const overdueObligations = postCompletionObligations.filter(
    (o) => isOverdue(o.dueDate) && o.status === "pending",
  ).length;

  // No data state - show create form
  if (!corporateDetails && !editMode) {
    return (
      <div className="corporate-details">
        <div className="mb-6">
          <Breadcrumb>
            <Breadcrumb.Item>
              <Button type="link" onClick={handleBack} className="p-0">
                Corporate Matters
              </Button>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Create Corporate Details</Breadcrumb.Item>
          </Breadcrumb>

          <div className="flex justify-between items-center mt-4">
            <Title level={2}>Create Corporate Details</Title>
            <Button onClick={handleBack} icon={<ArrowLeftOutlined />}>
              Back to List
            </Button>
          </div>
        </div>

        <Card>
          <Empty
            description={
              <div className="text-center">
                <Title level={4} className="mb-2">
                  No corporate details found for this matter
                </Title>
                <Paragraph type="secondary" className="mb-6">
                  Create corporate details to track transaction information,
                  parties, shareholders, and other corporate-specific data.
                </Paragraph>
                <Button
                  type="primary"
                  size="large"
                  icon={<FileAddOutlined />}
                  onClick={() => setEditMode(true)}>
                  Create Corporate Details
                </Button>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="corporate-details">
      {/* Header */}
      <div className="mb-6">
        <Breadcrumb>
          <Breadcrumb.Item>
            <Button type="link" onClick={handleBack} className="p-0">
              Corporate Matters
            </Button>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            {companyName || "Corporate Details"}
          </Breadcrumb.Item>
        </Breadcrumb>

        <div className="flex justify-between items-start mt-4">
          <div>
            <Title level={2} className="mb-2">
              {companyName || "Corporate Transaction"}
              {transactionTypeConfig && (
                <Tag color={transactionTypeConfig.color} className="ml-2">
                  {transactionTypeConfig.icon}{" "}
                  {getTransactionTypeLabel(transactionType)}
                </Tag>
              )}
            </Title>
            <Space>
              {registrationNumber && (
                <Text type="secondary">
                  <BankOutlined /> {registrationNumber}
                </Text>
              )}
              {registrationDate && (
                <Text type="secondary">
                  <CalendarOutlined />{" "}
                  {dayjs(registrationDate).format("DD/MM/YYYY")}
                </Text>
              )}
              {incorporationJurisdiction && (
                <Text type="secondary">📍 {incorporationJurisdiction}</Text>
              )}
            </Space>
          </div>

          <Space>
            {actualClosingDate ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                Transaction Closed
              </Tag>
            ) : (
              <Button type="primary" ghost onClick={handleCloseTransaction}>
                Close Transaction
              </Button>
            )}
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>
              Print
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export
            </Button>
            {!editMode && corporateDetails && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setEditMode(true)}>
                Edit Details
              </Button>
            )}
          </Space>
        </div>
      </div>

      {/* Edit Mode - Show Form */}
      {editMode && (
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-6">
            <Title level={4}>
              {corporateDetails
                ? "Edit Corporate Details"
                : "Create Corporate Details"}
            </Title>
            <Space>
              <Button onClick={() => setEditMode(false)}>Cancel</Button>
              <Button
                type="primary"
                form="corporate-form"
                htmlType="submit"
                loading={actionLoading}
                icon={<SaveOutlined />}>
                {corporateDetails ? "Save Changes" : "Create Details"}
              </Button>
            </Space>
          </div>
          <CorporateForm
            initialValues={corporateDetails}
            onSubmit={handleSubmit}
            loading={actionLoading}
            mode={corporateDetails ? "edit" : "create"}
          />
        </Card>
      )}

      {/* View Mode - Show Details */}
      {!editMode && corporateDetails && (
        <>
          {/* Quick Stats */}
          <Row gutter={16} className="mb-6">
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Deal Value"
                  value={dealValue?.amount || 0}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: "#722ed1" }}
                  formatter={(value) =>
                    formatCurrency(value, dealValue?.currency || "NGN")
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Closing Date"
                  value={
                    expectedClosingDate
                      ? dayjs(expectedClosingDate).format("DD/MM")
                      : "N/A"
                  }
                  prefix={<CalendarOutlined />}
                  valueStyle={{
                    color: actualClosingDate
                      ? "#52c41a"
                      : isOverdue(expectedClosingDate)
                        ? "#ff4d4f"
                        : "#1890ff",
                  }}
                  suffix={
                    expectedClosingDate &&
                    !actualClosingDate && (
                      <Badge
                        status={
                          isOverdue(expectedClosingDate)
                            ? "error"
                            : "processing"
                        }
                        text={
                          isOverdue(expectedClosingDate)
                            ? "Overdue"
                            : `${getDaysUntil(expectedClosingDate)} days left`
                        }
                      />
                    )
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Due Diligence"
                  value={
                    dueDiligence?.status
                      ? dueDiligence.status.replace("-", " ")
                      : "Not Started"
                  }
                  prefix={<AuditOutlined />}
                  valueStyle={{
                    color:
                      dueDiligence?.status === "completed"
                        ? "#52c41a"
                        : dueDiligence?.status === "in-progress"
                          ? "#1890ff"
                          : dueDiligence?.status === "waived"
                            ? "#d9d9d9"
                            : "#ff4d4f",
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Milestones"
                  value={completedMilestones}
                  suffix={`/ ${milestones.length}`}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
                <Progress
                  percent={
                    milestones.length > 0
                      ? (completedMilestones / milestones.length) * 100
                      : 0
                  }
                  size="small"
                  showInfo={false}
                />
              </Card>
            </Col>
          </Row>

          {/* Main Content Tabs */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="corporate-tabs">
            {/* Overview Tab */}
            <TabPane tab="Overview" key="overview">
              <Row gutter={16}>
                {/* Left Column - Basic Info */}
                <Col xs={24} lg={16}>
                  <Card title="Transaction Details" className="mb-6">
                    <Descriptions column={2} bordered>
                      <Descriptions.Item label="Transaction Type" span={2}>
                        <Tag color={transactionTypeConfig?.color}>
                          {transactionTypeConfig?.icon}{" "}
                          {getTransactionTypeLabel(transactionType)}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Company Type">
                        {companyType
                          ? getCompanyTypeLabel(companyType)
                          : "Not specified"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Registration Number">
                        {registrationNumber || "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Jurisdiction">
                        {incorporationJurisdiction || "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Registration Date">
                        {registrationDate
                          ? dayjs(registrationDate).format("DD/MM/YYYY")
                          : "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Payment Structure">
                        {paymentStructure
                          ? paymentStructure.replace(/_/g, " ").toUpperCase()
                          : "N/A"}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  <Card title="Financial Summary" className="mb-6">
                    <Row gutter={16}>
                      <Col xs={24} md={8}>
                        <Statistic
                          title="Deal Value"
                          value={dealValue?.amount || 0}
                          formatter={(value) =>
                            formatCurrency(value, dealValue?.currency || "NGN")
                          }
                          valueStyle={{ fontSize: "24px", fontWeight: "bold" }}
                        />
                      </Col>
                      <Col xs={24} md={8}>
                        <Statistic
                          title="Authorized Capital"
                          value={authorizedShareCapital?.amount || 0}
                          formatter={(value) =>
                            formatCurrency(
                              value,
                              authorizedShareCapital?.currency || "NGN",
                            )
                          }
                          valueStyle={{ fontSize: "20px" }}
                        />
                      </Col>
                      <Col xs={24} md={8}>
                        <Statistic
                          title="Paid-Up Capital"
                          value={paidUpCapital?.amount || 0}
                          formatter={(value) =>
                            formatCurrency(
                              value,
                              paidUpCapital?.currency || "NGN",
                            )
                          }
                          valueStyle={{ fontSize: "20px" }}
                        />
                      </Col>
                    </Row>

                    {paymentTerms && (
                      <div className="mt-6">
                        <Text strong>Payment Terms:</Text>
                        <Paragraph className="mt-2">{paymentTerms}</Paragraph>
                      </div>
                    )}
                  </Card>

                  {/* Due Diligence Status */}
                  <Card title="Due Diligence" className="mb-6">
                    <Descriptions column={1}>
                      <Descriptions.Item label="Status">
                        <Tag
                          color={
                            dueDiligence?.status === "completed"
                              ? "success"
                              : dueDiligence?.status === "in-progress"
                                ? "processing"
                                : dueDiligence?.status === "waived"
                                  ? "default"
                                  : "error"
                          }>
                          {dueDiligence?.status
                            ? dueDiligence.status
                                .replace("-", " ")
                                .toUpperCase()
                            : "NOT STARTED"}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Timeline">
                        <Space>
                          {dueDiligence?.startDate && (
                            <Text>
                              Start:{" "}
                              {dayjs(dueDiligence.startDate).format(
                                "DD/MM/YYYY",
                              )}
                            </Text>
                          )}
                          {dueDiligence?.completionDate && (
                            <Text>
                              Completion:{" "}
                              {dayjs(dueDiligence.completionDate).format(
                                "DD/MM/YYYY",
                              )}
                            </Text>
                          )}
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="Scope">
                        <Paragraph ellipsis={{ rows: 3, expandable: true }}>
                          {dueDiligence?.scope || "No scope defined"}
                        </Paragraph>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  {/* Governance Structure */}
                  {governanceStructure && (
                    <Card title="Governance Structure" className="mb-6">
                      <Row gutter={16}>
                        {governanceStructure.boardSize && (
                          <Col xs={24} md={8}>
                            <Statistic
                              title="Board Size"
                              value={governanceStructure.boardSize}
                              valueStyle={{ fontSize: "20px" }}
                            />
                          </Col>
                        )}
                        {governanceStructure.boardMeetingFrequency && (
                          <Col xs={24} md={8}>
                            <div>
                              <Text strong>Meeting Frequency:</Text>
                              <div>
                                {governanceStructure.boardMeetingFrequency}
                              </div>
                            </div>
                          </Col>
                        )}
                        {governanceStructure.votingStructure && (
                          <Col xs={24} md={8}>
                            <div>
                              <Text strong>Voting Structure:</Text>
                              <div>{governanceStructure.votingStructure}</div>
                            </div>
                          </Col>
                        )}
                      </Row>
                      {governanceStructure.specialRights && (
                        <div className="mt-4">
                          <Text strong>Special Rights:</Text>
                          <Paragraph className="mt-1">
                            {governanceStructure.specialRights}
                          </Paragraph>
                        </div>
                      )}
                    </Card>
                  )}
                </Col>

                {/* Right Column - Quick Actions & Timeline */}
                <Col xs={24} lg={8}>
                  {/* Quick Actions */}
                  <Card title="Quick Actions" className="mb-6">
                    <Space direction="vertical" className="w-full">
                      <Button
                        block
                        icon={<TeamOutlined />}
                        onClick={() => setActiveTab("parties")}>
                        Manage Parties ({parties.length})
                      </Button>
                      <Button
                        block
                        icon={<ShareAltOutlined />}
                        onClick={() => setActiveTab("shareholders")}>
                        Update Shareholders ({totalShareholders})
                      </Button>
                      <Button
                        block
                        icon={<CrownOutlined />}
                        onClick={() => setActiveTab("directors")}>
                        Manage Directors ({totalDirectors})
                      </Button>
                      <Button
                        block
                        icon={<CalendarOutlined />}
                        onClick={() => setActiveTab("milestones")}>
                        Update Milestones ({milestones.length})
                      </Button>
                      <Button
                        block
                        icon={<SafetyCertificateOutlined />}
                        onClick={() => setActiveTab("regulatory")}>
                        Regulatory Approvals ({pendingApprovals} pending)
                      </Button>
                      <Button
                        block
                        icon={<FileDoneOutlined />}
                        onClick={() => setActiveTab("agreements")}>
                        Key Agreements ({keyAgreements.length})
                      </Button>
                    </Space>
                  </Card>

                  {/* Upcoming Deadlines */}
                  <Card title="Upcoming Deadlines" className="mb-6">
                    <Timeline>
                      {expectedClosingDate && !actualClosingDate && (
                        <Timeline.Item
                          color={
                            isOverdue(expectedClosingDate) ? "red" : "blue"
                          }
                          dot={<CalendarOutlined />}>
                          <Text strong>Expected Closing</Text>
                          <br />
                          <Text type="secondary">
                            {dayjs(expectedClosingDate).format("DD MMM YYYY")}
                            {isOverdue(expectedClosingDate) && (
                              <Tag color="red" className="ml-2">
                                OVERDUE
                              </Tag>
                            )}
                          </Text>
                        </Timeline.Item>
                      )}

                      {milestones
                        .filter((m) => m.status !== "completed" && m.dueDate)
                        .sort(
                          (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
                        )
                        .slice(0, 3)
                        .map((milestone, index) => (
                          <Timeline.Item
                            key={index}
                            color={getMilestoneStatusColor(milestone.status)}
                            dot={<ClockCircleOutlined />}>
                            <Text strong>{milestone.title}</Text>
                            <br />
                            <Text type="secondary">
                              Due:{" "}
                              {dayjs(milestone.dueDate).format("DD MMM YYYY")}
                              {milestone.status === "overdue" && (
                                <Tag color="red" className="ml-2">
                                  OVERDUE
                                </Tag>
                              )}
                            </Text>
                          </Timeline.Item>
                        ))}

                      {complianceRequirements
                        .filter((c) => c.status === "pending" && c.dueDate)
                        .sort(
                          (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
                        )
                        .slice(0, 2)
                        .map((req, index) => (
                          <Timeline.Item
                            key={`compliance-${index}`}
                            color={isOverdue(req.dueDate) ? "red" : "orange"}
                            dot={<CheckCircleOutlined />}>
                            <Text strong>{req.requirement}</Text>
                            <br />
                            <Text type="secondary">
                              Due: {dayjs(req.dueDate).format("DD MMM YYYY")}
                              {isOverdue(req.dueDate) && (
                                <Tag color="red" className="ml-2">
                                  OVERDUE
                                </Tag>
                              )}
                            </Text>
                          </Timeline.Item>
                        ))}
                    </Timeline>
                  </Card>

                  {/* Alerts & Warnings */}
                  <Card title="Alerts" className="mb-6">
                    {pendingApprovals > 0 && (
                      <Alert
                        message={`${pendingApprovals} pending regulatory approval(s)`}
                        type="warning"
                        showIcon
                        icon={<ExclamationCircleOutlined />}
                        className="mb-2"
                      />
                    )}
                    {criticalRisks > 0 && (
                      <Alert
                        message={`${criticalRisks} critical/high risk(s) identified`}
                        type="error"
                        showIcon
                        icon={<WarningOutlined />}
                        className="mb-2"
                      />
                    )}
                    {overdueObligations > 0 && (
                      <Alert
                        message={`${overdueObligations} overdue post-completion obligation(s)`}
                        type="error"
                        showIcon
                        icon={<ClockCircleOutlined />}
                        className="mb-2"
                      />
                    )}
                    {dueDiligence?.status === "waived" && (
                      <Alert
                        message="Due diligence waived"
                        type="info"
                        showIcon
                        className="mb-2"
                      />
                    )}
                    {actualClosingDate && (
                      <Alert
                        message={`Transaction closed on ${dayjs(actualClosingDate).format("DD/MM/YYYY")}`}
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                      />
                    )}
                  </Card>
                </Col>
              </Row>
            </TabPane>

            {/* Parties Tab */}
            <TabPane tab="Parties" key="parties">
              <PartiesManager matterId={matterId} parties={parties} />
            </TabPane>

            {/* Shareholders Tab */}
            <TabPane tab="Shareholders" key="shareholders">
              <ShareholdersManager
                matterId={matterId}
                shareholders={shareholders}
              />
            </TabPane>

            {/* Directors Tab */}
            <TabPane tab="Directors" key="directors">
              <DirectorsManager matterId={matterId} directors={directors} />
            </TabPane>

            {/* Milestones Tab */}
            <TabPane tab="Milestones" key="milestones">
              <MilestonesManager matterId={matterId} milestones={milestones} />
            </TabPane>

            {/* Regulatory Tab */}
            <TabPane tab="Regulatory" key="regulatory">
              <Card title="Regulatory Approvals" className="mb-6">
                {regulatoryApprovals.length === 0 ? (
                  <Empty description="No regulatory approvals added" />
                ) : (
                  <List
                    dataSource={regulatoryApprovals}
                    renderItem={(approval) => (
                      <List.Item
                        actions={[
                          <Button key="edit" type="link" size="small">
                            Edit
                          </Button>,
                          <Button key="remove" type="link" size="small" danger>
                            Remove
                          </Button>,
                        ]}>
                        <List.Item.Meta
                          avatar={
                            <Avatar icon={<SafetyCertificateOutlined />} />
                          }
                          title={`${approval.authority} - ${approval.approvalType}`}
                          description={
                            <Space direction="vertical" size={0}>
                              <Text>
                                Status:
                                <Tag
                                  color={
                                    approval.status === "approved"
                                      ? "success"
                                      : approval.status === "rejected"
                                        ? "error"
                                        : approval.status === "pending"
                                          ? "processing"
                                          : "default"
                                  }
                                  className="ml-2">
                                  {approval.status?.toUpperCase() || "UNKNOWN"}
                                </Tag>
                              </Text>
                              <Text type="secondary">
                                Applied:{" "}
                                {approval.applicationDate
                                  ? dayjs(approval.applicationDate).format(
                                      "DD/MM/YYYY",
                                    )
                                  : "N/A"}
                              </Text>
                              <Text type="secondary">
                                Reference:{" "}
                                {approval.referenceNumber || "No reference"}
                              </Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </TabPane>

            {/* Agreements Tab */}
            <TabPane tab="Agreements" key="agreements">
              <Card title="Key Agreements" className="mb-6">
                {keyAgreements.length === 0 ? (
                  <Empty description="No key agreements added" />
                ) : (
                  <List
                    dataSource={keyAgreements}
                    renderItem={(agreement) => (
                      <List.Item
                        actions={[
                          <Button key="view" type="link" size="small">
                            View
                          </Button>,
                          <Button key="edit" type="link" size="small">
                            Edit
                          </Button>,
                        ]}>
                        <List.Item.Meta
                          avatar={<Avatar icon={<FileTextOutlined />} />}
                          title={agreement.agreementType}
                          description={
                            <Space direction="vertical" size={0}>
                              <Text>
                                Status:
                                <Tag
                                  color={
                                    agreement.status === "executed"
                                      ? "success"
                                      : agreement.status === "terminated"
                                        ? "error"
                                        : agreement.status === "under-review"
                                          ? "processing"
                                          : "default"
                                  }
                                  className="ml-2">
                                  {agreement.status
                                    ?.replace("-", " ")
                                    .toUpperCase() || "DRAFT"}
                                </Tag>
                              </Text>
                              <Text type="secondary">
                                Execution:{" "}
                                {agreement.executionDate
                                  ? dayjs(agreement.executionDate).format(
                                      "DD/MM/YYYY",
                                    )
                                  : "N/A"}
                              </Text>
                              <Text type="secondary">
                                Effective:{" "}
                                {agreement.effectiveDate
                                  ? dayjs(agreement.effectiveDate).format(
                                      "DD/MM/YYYY",
                                    )
                                  : "N/A"}
                              </Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </TabPane>

            {/* Compliance Tab */}
            <TabPane tab="Compliance" key="compliance">
              <Card title="Compliance Requirements" className="mb-6">
                {complianceRequirements.length === 0 ? (
                  <Empty description="No compliance requirements added" />
                ) : (
                  <List
                    dataSource={complianceRequirements}
                    renderItem={(requirement) => (
                      <List.Item
                        actions={[
                          <Button key="mark com" type="link" size="small">
                            Mark Complete
                          </Button>,
                          <Button key="edit mark" type="link" size="small">
                            Edit
                          </Button>,
                        ]}>
                        <List.Item.Meta
                          avatar={<Avatar icon={<CheckCircleOutlined />} />}
                          title={requirement.requirement}
                          description={
                            <Space direction="vertical" size={0}>
                              <Text>
                                Status:
                                <Tag
                                  color={
                                    requirement.status === "met"
                                      ? "success"
                                      : requirement.status === "overdue"
                                        ? "error"
                                        : requirement.status === "waived"
                                          ? "default"
                                          : "processing"
                                  }
                                  className="ml-2">
                                  {requirement.status?.toUpperCase() ||
                                    "PENDING"}
                                </Tag>
                              </Text>
                              <Text type="secondary">
                                Due:{" "}
                                {requirement.dueDate
                                  ? dayjs(requirement.dueDate).format(
                                      "DD/MM/YYYY",
                                    )
                                  : "No due date"}
                              </Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </TabPane>

            {/* Risks Tab */}
            <TabPane tab="Risks" key="risks">
              <Card title="Identified Risks" className="mb-6">
                {identifiedRisks.length === 0 ? (
                  <Empty description="No risks identified" />
                ) : (
                  <List
                    dataSource={identifiedRisks}
                    renderItem={(risk) => (
                      <List.Item
                        key={risk._id}
                        actions={[
                          <Button key="mitigate" type="link" size="small">
                            Mitigate
                          </Button>,
                          <Button key="edit-migigate" type="link" size="small">
                            Edit
                          </Button>,
                        ]}>
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              style={{
                                backgroundColor: getRiskSeverityColor(
                                  risk.severity,
                                ),
                              }}
                              icon={<WarningOutlined />}
                            />
                          }
                          title={risk.risk}
                          description={
                            <Space direction="vertical" size={0}>
                              <Text>
                                Severity:
                                <Tag
                                  color={getRiskSeverityColor(risk.severity)}
                                  className="ml-2">
                                  {risk.severity?.toUpperCase() || "UNKNOWN"}
                                </Tag>
                              </Text>
                              <Text type="secondary">
                                Status:
                                <Tag className="ml-2">
                                  {risk.status?.toUpperCase() || "OPEN"}
                                </Tag>
                              </Text>
                              <Paragraph ellipsis={{ rows: 2 }}>
                                <Text type="secondary">
                                  Mitigation:{" "}
                                  {risk.mitigation || "No mitigation plan"}
                                </Text>
                              </Paragraph>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </TabPane>

            {/* History Tab */}
            <TabPane tab="History" key="history">
              <Card title="Activity Log" className="mb-6">
                <Timeline>
                  {createdAt && (
                    <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                      <Text strong>Corporate details created</Text>
                      <br />
                      <Text type="secondary">
                        {dayjs(createdAt).format("DD MMM YYYY HH:mm")}
                      </Text>
                    </Timeline.Item>
                  )}

                  {updatedAt && updatedAt !== createdAt && (
                    <Timeline.Item color="blue" dot={<EditOutlined />}>
                      <Text strong>Corporate details updated</Text>
                      <br />
                      <Text type="secondary">
                        {dayjs(updatedAt).format("DD MMM YYYY HH:mm")}
                      </Text>
                    </Timeline.Item>
                  )}

                  {actualClosingDate && (
                    <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                      <Text strong>Transaction closed</Text>
                      <br />
                      <Text type="secondary">
                        {dayjs(actualClosingDate).format("DD MMM YYYY")}
                      </Text>
                    </Timeline.Item>
                  )}

                  {milestones
                    .filter((m) => m.status === "completed")
                    .sort(
                      (a, b) =>
                        new Date(b.completedDate) - new Date(a.completedDate),
                    )
                    .slice(0, 3)
                    .map((milestone, index) => (
                      <Timeline.Item
                        key={index}
                        color="green"
                        dot={<CheckCircleOutlined />}>
                        <Text strong>
                          Milestone completed: {milestone.title}
                        </Text>
                        <br />
                        <Text type="secondary">
                          {dayjs(milestone.completedDate).format("DD MMM YYYY")}
                        </Text>
                      </Timeline.Item>
                    ))}
                </Timeline>
              </Card>
            </TabPane>
          </Tabs>
        </>
      )}

      {/* Transaction Closing Modal */}
      {corporateDetails && (
        <TransactionClosingModal
          matterId={matterId}
          visible={showClosingModal}
          onClose={() => setShowClosingModal(false)}
          corporateDetails={corporateDetails}
        />
      )}
    </div>
  );
};

export default CorporateDetails;
