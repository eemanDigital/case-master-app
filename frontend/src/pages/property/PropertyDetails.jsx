import { useState, useEffect } from "react";
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
  Alert,
  Spin,
  Modal,
  Typography,
  Breadcrumb,
  Empty,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  SaveOutlined,
  HomeOutlined,
  DollarOutlined,
  FileTextOutlined,
  AuditOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
  PrinterOutlined,
  DownloadOutlined,
  FileAddOutlined,
  FilePdfOutlined,
  KeyOutlined,
  AlertOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { message } from "antd";

// Redux imports
import {
  fetchPropertyDetails,
  updatePropertyDetails,
  createPropertyDetails,
  selectSelectedDetails,
  selectDetailsLoading,
  selectActionLoading,
} from "../../redux/features/property/propertySlice";

// Component imports
import PropertyForm from "../../components/property/PropertyForm";
import PropertiesManager from "../../components/property/PropertiesManager";
import PaymentScheduleManager from "../../components/property/PaymentScheduleManager";
import ConditionsManager from "../../components/property/ConditionsManager";
import TransactionCompletionModal from "../../components/property/TransactionCompletionModal";
import LeaseTracker from "../../components/property/LeaseTracker";
import LeaseAlertManager from "../../components/property/LeaseAlertManager";
import LeaseMilestonesManager from "../../components/property/LeaseMilestonesManager";
import LeaseRenewalSection from "../../components/property/LeaseRenewalSection";
import { downloadPropertyReport } from "../../utils/pdfDownload";

// Utils
import {
  TRANSACTION_TYPES,
  formatCurrency,
  getTransactionTypeLabel,
  getPropertyTypeLabel,
  getTitleDocumentLabel,
  isOverdue,
} from "../../utils/propertyConstants";

const { Title, Text, Paragraph } = Typography;

dayjs.extend(relativeTime);

const PropertyDetails = () => {
  const { matterId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const propertyDetails = useSelector(selectSelectedDetails);
  const detailsLoading = useSelector(selectDetailsLoading);
  const actionLoading = useSelector(selectActionLoading);

  console.log(propertyDetails);

  // Local state
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Fetch details on mount
  useEffect(() => {
    if (matterId) {
      dispatch(fetchPropertyDetails(matterId));
    }
  }, [dispatch, matterId]);

  // Handle form submission for create/update
  const handleSubmit = async (values) => {
    try {
      if (propertyDetails) {
        // Update existing
        await dispatch(
          updatePropertyDetails({ matterId, data: values }),
        ).unwrap();
        setEditMode(false);
      } else {
        // Create new
        await dispatch(
          createPropertyDetails({ matterId, data: values }),
        ).unwrap();
        setEditMode(false);
      }
    } catch (error) {
      console.error("Failed to save property details:", error);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate("/dashboard/matters/property");
  };

  // Print details
  const handlePrint = () => {
    window.print();
  };

  // Export details - Download Property Report PDF
  const handleExport = async () => {
    try {
      message.loading({ content: "Generating PDF report...", key: "pdf" });
      await downloadPropertyReport(matterId, "property");
      message.success({ content: "PDF report downloaded successfully!", key: "pdf" });
    } catch (error) {
      message.error({ content: "Failed to download PDF report", key: "pdf" });
    }
  };

  // Handle transaction completion
  const handleCompleteTransaction = () => {
    setShowCompletionModal(true);
  };

  // Loading state
  if (detailsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading property details..." />
      </div>
    );
  }

  // Destructure property details with defaults
  const {
    transactionType,
    purchasePrice,
    rentAmount,
    securityDeposit,
    paymentTerms,
    contractOfSale = {},
    leaseAgreement = {},
    leaseAlertSettings = {},
    leaseMilestones = [],
    renewalTracking = {},
    deedOfAssignment = {},
    governorsConsent = {},
    surveyPlan = {},
    titleSearch = {},
    physicalInspection = {},
    development = {},
    vendor = {},
    purchaser = {},
    landlord = {},
    tenant = {},
    properties = [],
    paymentSchedule = [],
    conditions = [],
    createdAt,
    updatedAt,
  } = propertyDetails || {};

  const transactionTypeConfig = TRANSACTION_TYPES.find(
    (t) => t.value === transactionType,
  );
  const primaryProperty = properties?.[0];

  // Calculate metrics
  const totalProperties = properties?.length || 0;
  const pendingPayments =
    paymentSchedule?.filter(
      (p) => p.status === "pending" && isOverdue(p.dueDate),
    )?.length || 0;
  const totalPayments = paymentSchedule?.length || 0;
  const paidPayments =
    paymentSchedule?.filter((p) => p.status === "paid")?.length || 0;
  const pendingConditions =
    conditions?.filter((c) => c.status === "pending")?.length || 0;
  const overdueConditions =
    conditions?.filter((c) => c.status === "pending" && isOverdue(c.dueDate))
      ?.length || 0;

  // Lease-specific metrics
  const isLeaseTransaction = ["lease", "sublease", "tenancy_matter"].includes(transactionType);
  const pendingMilestones = leaseMilestones?.filter((m) => m.status === "pending")?.length || 0;
  const completedMilestones = leaseMilestones?.filter((m) => m.status === "completed")?.length || 0;

  // Calculate lease urgency
  const calculateUrgency = () => {
    if (!leaseAgreement?.expiryDate) return null;
    const now = new Date();
    const expiry = new Date(leaseAgreement.expiryDate);
    const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) return { level: "expired", days: daysRemaining };
    if (daysRemaining <= 7) return { level: "critical", days: daysRemaining };
    if (daysRemaining <= 30) return { level: "warning", days: daysRemaining };
    if (daysRemaining <= 90) return { level: "notice", days: daysRemaining };
    return { level: "safe", days: daysRemaining };
  };

  const leaseUrgency = isLeaseTransaction ? calculateUrgency() : null;

  // No data state - show create form
  if (!propertyDetails && !editMode) {
    return (
      <div className="property-details">
        <div className="mb-6">
          <Breadcrumb>
            <Breadcrumb.Item>
              <Button type="link" onClick={handleBack} className="p-0">
                Property Matters
              </Button>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Create Property Details</Breadcrumb.Item>
          </Breadcrumb>

          <div className="flex justify-between items-center mt-4">
            <Title level={2}>Create Property Details</Title>
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
                  No property details found for this matter
                </Title>
                <Paragraph type="secondary" className="mb-6">
                  Create property details to track transaction information,
                  properties, payment schedules, and other property-specific
                  data.
                </Paragraph>
                <Button
                  type="primary"
                  size="large"
                  icon={<FileAddOutlined />}
                  onClick={() => setEditMode(true)}>
                  Create Property Details
                </Button>
              </div>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="property-details">
      {/* Header */}
      <div className="mb-6">
        <Breadcrumb>
          <Breadcrumb.Item>
            <Button type="link" onClick={handleBack} className="p-0">
              Property Matters
            </Button>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            {primaryProperty?.address || "Property Details"}
          </Breadcrumb.Item>
        </Breadcrumb>

        <div className="flex justify-between items-start mt-4">
          <div>
            <Title level={2} className="mb-2">
              {primaryProperty?.address || "Property Transaction"}
              {transactionTypeConfig && (
                <Tag color={transactionTypeConfig.color} className="ml-2">
                  {transactionTypeConfig.icon}{" "}
                  {getTransactionTypeLabel(transactionType)}
                </Tag>
              )}
            </Title>
            <Space>
              {primaryProperty?.propertyType && (
                <Text type="secondary">
                  <HomeOutlined />{" "}
                  {getPropertyTypeLabel(primaryProperty.propertyType)}
                </Text>
              )}
              {primaryProperty?.state && (
                <Text type="secondary">
                  <EnvironmentOutlined /> {primaryProperty.state}
                  {primaryProperty.lga && `, ${primaryProperty.lga}`}
                </Text>
              )}
              {primaryProperty?.titleDocument && (
                <Text type="secondary">
                  <FileTextOutlined />{" "}
                  {getTitleDocumentLabel(primaryProperty.titleDocument)}
                </Text>
              )}
            </Space>
          </div>

          <Space>
            {deedOfAssignment?.status === "registered" ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                Transaction Completed
              </Tag>
            ) : (
              <Button type="primary" ghost onClick={handleCompleteTransaction}>
                Complete Transaction
              </Button>
            )}
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>
              Print
            </Button>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              onClick={handleExport}
              className="bg-blue-600 hover:bg-blue-700 border-0"
            >
              Download Report
            </Button>
            {!editMode && propertyDetails && (
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
              {propertyDetails
                ? "Edit Property Details"
                : "Create Property Details"}
            </Title>
            <Space>
              <Button onClick={() => setEditMode(false)}>Cancel</Button>
              <Button
                type="primary"
                form="property-form"
                htmlType="submit"
                loading={actionLoading}
                icon={<SaveOutlined />}>
                {propertyDetails ? "Save Changes" : "Create Details"}
              </Button>
            </Space>
          </div>
          <PropertyForm
            initialValues={propertyDetails}
            onSubmit={handleSubmit}
            loading={actionLoading}
            mode={propertyDetails ? "edit" : "create"}
          />
        </Card>
      )}

      {/* View Mode - Show Details */}
      {!editMode && propertyDetails && (
        <>
          {/* Quick Stats */}
          <Row gutter={16} className="mb-6">
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Property Value"
                  value={purchasePrice?.amount || rentAmount?.amount || 0}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: "#722ed1" }}
                  formatter={(value) =>
                    formatCurrency(
                      value,
                      purchasePrice?.currency || rentAmount?.currency || "NGN",
                    )
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Properties"
                  value={totalProperties}
                  prefix={<HomeOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Pending Payments"
                  value={pendingPayments}
                  suffix={`/ ${totalPayments}`}
                  prefix={<DollarOutlined />}
                  valueStyle={{
                    color: pendingPayments > 0 ? "#ff4d4f" : "#52c41a",
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Payment Progress"
                  value={
                    totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0
                  }
                  suffix="%"
                  prefix={
                    <Progress
                      type="circle"
                      percent={
                        totalPayments > 0
                          ? (paidPayments / totalPayments) * 100
                          : 0
                      }
                      size={20}
                      showInfo={false}
                    />
                  }
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
          </Row>

          {/* Main Content Tabs */}
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {/* Overview Tab */}
            <Tabs.TabPane tab="Overview" key="overview">
              <Row gutter={16}>
                {/* Left Column - Basic Info */}
                <Col xs={24} lg={16}>
                  <Card title="Transaction Details" className="mb-6">
                    <Descriptions column={2} bordered size="small">
                      <Descriptions.Item label="Transaction Type" span={2}>
                        <Tag color={transactionTypeConfig?.color}>
                          {transactionTypeConfig?.icon}{" "}
                          {getTransactionTypeLabel(transactionType)}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Payment Terms">
                        {paymentTerms
                          ? paymentTerms.replace("-", " ").toUpperCase()
                          : "Not specified"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Purchase Price">
                        {purchasePrice?.amount ? (
                          <span className="font-semibold">
                            {formatCurrency(purchasePrice.amount, purchasePrice.currency)}
                          </span>
                        ) : "Not applicable"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Rent Amount">
                        {rentAmount?.amount ? (
                          <Space>
                            <span className="font-semibold">
                              {formatCurrency(rentAmount.amount, rentAmount.currency)}
                            </span>
                            {rentAmount.frequency && (
                              <Tag color="blue">/{rentAmount.frequency}</Tag>
                            )}
                          </Space>
                        ) : "Not applicable"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Security Deposit">
                        {securityDeposit?.amount
                          ? formatCurrency(securityDeposit.amount, securityDeposit.currency)
                          : "Not specified"}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  {/* Lease Overview - Only for lease transactions */}
                  {isLeaseTransaction && (
                    <Card 
                      title={
                        <Space>
                          <KeyOutlined />
                          <span>Lease Information</span>
                          {leaseUrgency && leaseUrgency.level !== "safe" && (
                            <Tag 
                              color={leaseUrgency.level === "critical" ? "red" : leaseUrgency.level === "warning" ? "orange" : "blue"}
                            >
                              {leaseUrgency.level === "expired" 
                                ? `Expired ${Math.abs(leaseUrgency.days)} days ago`
                                : `${leaseUrgency.days} days remaining`
                              }
                            </Tag>
                          )}
                        </Space>
                      } 
                      className="mb-6"
                      style={leaseUrgency?.level === "critical" ? { borderColor: "#ff4d4f" } : {}}
                    >
                      <Descriptions column={2} bordered size="small">
                        <Descriptions.Item label="Lease Status">
                          <Tag
                            color={
                              leaseAgreement?.status === "active"
                                ? "success"
                                : leaseAgreement?.status === "executed"
                                  ? "blue"
                                  : leaseAgreement?.status === "expired"
                                    ? "default"
                                    : "processing"
                            }
                          >
                            {leaseAgreement?.status?.toUpperCase() || "NOT SET"}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Renewal Option">
                          <Tag color={leaseAgreement?.renewalOption ? "green" : "default"}>
                            {leaseAgreement?.renewalOption ? "YES" : "NO"}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Commencement Date">
                          {leaseAgreement?.commencementDate
                            ? dayjs(leaseAgreement.commencementDate).format("DD/MM/YYYY")
                            : "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Expiry Date">
                          <Text strong style={{ color: leaseUrgency?.level === "critical" ? "#ff4d4f" : leaseUrgency?.level === "warning" ? "#fa8c16" : "inherit" }}>
                            {leaseAgreement?.expiryDate
                              ? dayjs(leaseAgreement.expiryDate).format("DD/MM/YYYY")
                              : "Not set"}
                          </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Duration">
                          {leaseAgreement?.duration
                            ? `${leaseAgreement.duration.years || 0}y ${leaseAgreement.duration.months || 0}m`
                            : "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Time Remaining">
                          {leaseUrgency ? (
                            <Tag
                              color={
                                leaseUrgency.level === "critical" ? "red" :
                                leaseUrgency.level === "warning" ? "orange" :
                                leaseUrgency.level === "notice" ? "blue" : "green"
                              }
                            >
                              {leaseUrgency.days < 0 
                                ? `Expired ${Math.abs(leaseUrgency.days)} days ago`
                                : `${leaseUrgency.days} days`
                              }
                            </Tag>
                          ) : "N/A"}
                        </Descriptions.Item>
                        {renewalTracking?.renewalInitiated && (
                          <>
                            <Descriptions.Item label="Renewal Status" span={2}>
                              <Tag
                                color={
                                  renewalTracking.renewalStatus === "agreed" ? "success" :
                                  renewalTracking.renewalStatus === "in-progress" ? "processing" :
                                  renewalTracking.renewalStatus === "completed" ? "green" :
                                  renewalTracking.renewalStatus === "disputed" ? "orange" :
                                  "default"
                                }
                              >
                                {renewalTracking.renewalStatus?.replace(/-/g, " ").toUpperCase()}
                              </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Renewal Deadline">
                              {renewalTracking?.renewalDeadline
                                ? dayjs(renewalTracking.renewalDeadline).format("DD/MM/YYYY")
                                : "Not set"}
                            </Descriptions.Item>
                            <Descriptions.Item label="Proposed New Rent">
                              {renewalTracking?.proposedNewRent?.amount
                                ? formatCurrency(renewalTracking.proposedNewRent.amount, renewalTracking.proposedNewRent.currency)
                                : "Not proposed"}
                            </Descriptions.Item>
                            {renewalTracking?.rentIncreasePercentage > 0 && (
                              <Descriptions.Item label="Increase">
                                <Tag color="green">+{renewalTracking.rentIncreasePercentage}%</Tag>
                              </Descriptions.Item>
                            )}
                            <Descriptions.Item label="Negotiations">
                              {renewalTracking?.negotiationsHistory?.length || 0} recorded
                            </Descriptions.Item>
                          </>
                        )}
                      </Descriptions>
                      
                      {/* Milestones Summary */}
                      {leaseMilestones?.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center mb-2">
                            <Text strong>Milestones ({completedMilestones}/{leaseMilestones.length} completed)</Text>
                          </div>
                          <Progress 
                            percent={leaseMilestones.length > 0 ? Math.round((completedMilestones / leaseMilestones.length) * 100) : 0} 
                            size="small"
                            strokeColor="#52c41a"
                          />
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Due Diligence Summary */}
                  <Card title="Due Diligence Summary" className="mb-6">
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={8}>
                        <div className="text-center p-3 border rounded">
                          <div className="text-sm text-gray-500 mb-1">Title Search</div>
                          <Tag
                            color={titleSearch?.isCompleted ? "success" : "warning"}
                            className="text-base px-3 py-1"
                          >
                            {titleSearch?.isCompleted ? "COMPLETED" : "PENDING"}
                          </Tag>
                          {titleSearch?.searchDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              {dayjs(titleSearch.searchDate).format("DD/MM/YYYY")}
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col xs={24} md={8}>
                        <div className="text-center p-3 border rounded">
                          <div className="text-sm text-gray-500 mb-1">Physical Inspection</div>
                          <Tag
                            color={physicalInspection?.isCompleted ? "success" : "warning"}
                            className="text-base px-3 py-1"
                          >
                            {physicalInspection?.isCompleted ? "COMPLETED" : "PENDING"}
                          </Tag>
                          {physicalInspection?.inspectionDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              {dayjs(physicalInspection.inspectionDate).format("DD/MM/YYYY")}
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col xs={24} md={8}>
                        <div className="text-center p-3 border rounded">
                          <div className="text-sm text-gray-500 mb-1">Survey Plan</div>
                          <Tag
                            color={surveyPlan?.isAvailable ? "success" : "warning"}
                            className="text-base px-3 py-1"
                          >
                            {surveyPlan?.isAvailable ? "AVAILABLE" : "NOT AVAILABLE"}
                          </Tag>
                          {surveyPlan?.surveyNumber && (
                            <div className="text-xs text-gray-500 mt-1">
                              #{surveyPlan.surveyNumber}
                            </div>
                          )}
                        </div>
                      </Col>
                    </Row>
                    {titleSearch?.encumbrances?.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <Text type="secondary" className="text-sm">Encumbrances:</Text>
                        <ul className="mt-1 text-sm text-orange-600">
                          {titleSearch.encumbrances.slice(0, 3).map((enc, idx) => (
                            <li key={idx}>{enc}</li>
                          ))}
                          {titleSearch.encumbrances.length > 3 && (
                            <li>+{titleSearch.encumbrances.length - 3} more...</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </Card>

                  {/* Parties Information */}
                  <Card title="Parties Involved" className="mb-6">
                    <Row gutter={16}>
                      {(vendor?.name || purchaser?.name) && (
                        <>
                          {vendor?.name && (
                            <Col xs={24} md={12}>
                              <Card size="small" title="Vendor/Owner">
                                <div>
                                  <Text strong>{vendor.name}</Text>
                                  {vendor.contact && (
                                    <div className="text-gray-600 text-sm">
                                      {vendor.contact}
                                    </div>
                                  )}
                                </div>
                              </Card>
                            </Col>
                          )}
                          {purchaser?.name && (
                            <Col xs={24} md={12}>
                              <Card size="small" title="Purchaser/Buyer">
                                <div>
                                  <Text strong>{purchaser.name}</Text>
                                  {purchaser.contact && (
                                    <div className="text-gray-600 text-sm">
                                      {purchaser.contact}
                                    </div>
                                  )}
                                </div>
                              </Card>
                            </Col>
                          )}
                        </>
                      )}

                      {(landlord?.name || tenant?.name) && (
                        <>
                          {landlord?.name && (
                            <Col xs={24} md={12}>
                              <Card size="small" title="Landlord">
                                <div>
                                  <Text strong>{landlord.name}</Text>
                                  {landlord.contact && (
                                    <div className="text-gray-600 text-sm">
                                      {landlord.contact}
                                    </div>
                                  )}
                                </div>
                              </Card>
                            </Col>
                          )}
                          {tenant?.name && (
                            <Col xs={24} md={12}>
                              <Card size="small" title="Tenant">
                                <div>
                                  <Text strong>{tenant.name}</Text>
                                  {tenant.contact && (
                                    <div className="text-gray-600 text-sm">
                                      {tenant.contact}
                                    </div>
                                  )}
                                </div>
                              </Card>
                            </Col>
                          )}
                        </>
                      )}
                    </Row>
                  </Card>

                  {/* Legal Status */}
                  <Card title="Legal Status" className="mb-6">
                    <Row gutter={16}>
                      <Col xs={24} md={8}>
                        <div className="text-center">
                          <Text strong>Contract of Sale</Text>
                          <div className="mt-2">
                            <Tag
                              color={
                                contractOfSale?.status === "completed"
                                  ? "success"
                                  : contractOfSale?.status === "executed"
                                    ? "blue"
                                    : contractOfSale?.status === "terminated"
                                      ? "red"
                                      : "default"
                              }>
                              {contractOfSale?.status?.toUpperCase() ||
                                "NOT STARTED"}
                            </Tag>
                          </div>
                          {contractOfSale?.executionDate && (
                            <div className="text-sm text-gray-600 mt-1">
                              Executed:{" "}
                              {dayjs(contractOfSale.executionDate).format(
                                "DD/MM/YYYY",
                              )}
                            </div>
                          )}
                        </div>
                      </Col>

                      <Col xs={24} md={8}>
                        <div className="text-center">
                          <Text strong>Governor's Consent</Text>
                          <div className="mt-2">
                            <Tag
                              color={
                                governorsConsent?.status === "approved"
                                  ? "success"
                                  : governorsConsent?.status === "pending"
                                    ? "processing"
                                    : governorsConsent?.status === "rejected"
                                      ? "error"
                                      : "default"
                              }>
                              {governorsConsent?.status?.toUpperCase() ||
                                "NOT REQUIRED"}
                            </Tag>
                          </div>
                          {governorsConsent?.applicationDate && (
                            <div className="text-sm text-gray-600 mt-1">
                              Applied:{" "}
                              {dayjs(governorsConsent.applicationDate).format(
                                "DD/MM/YYYY",
                              )}
                            </div>
                          )}
                        </div>
                      </Col>

                      <Col xs={24} md={8}>
                        <div className="text-center">
                          <Text strong>Deed of Assignment</Text>
                          <div className="mt-2">
                            <Tag
                              color={
                                deedOfAssignment?.status === "registered"
                                  ? "success"
                                  : deedOfAssignment?.status === "executed"
                                    ? "blue"
                                    : deedOfAssignment?.status === "pending"
                                      ? "processing"
                                      : "default"
                              }>
                              {deedOfAssignment?.status?.toUpperCase() ||
                                "PENDING"}
                            </Tag>
                          </div>
                          {deedOfAssignment?.registrationDate && (
                            <div className="text-sm text-gray-600 mt-1">
                              Registered:{" "}
                              {dayjs(deedOfAssignment.registrationDate).format(
                                "DD/MM/YYYY",
                              )}
                            </div>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Card>

                  {/* Development Info (if applicable) */}
                  {development?.isApplicable && (
                    <Card title="Development Information" className="mb-6">
                      <Row gutter={16}>
                        {development.estimatedCost?.amount && (
                          <Col xs={24} md={8}>
                            <Statistic
                              title="Estimated Cost"
                              value={development.estimatedCost.amount}
                              formatter={(value) =>
                                formatCurrency(
                                  value,
                                  development.estimatedCost.currency,
                                )
                              }
                              valueStyle={{ fontSize: "18px" }}
                            />
                          </Col>
                        )}
                        {development.expectedCompletion && (
                          <Col xs={24} md={8}>
                            <div>
                              <Text strong>Expected Completion</Text>
                              <div>
                                {dayjs(development.expectedCompletion).format(
                                  "DD/MM/YYYY",
                                )}
                              </div>
                            </div>
                          </Col>
                        )}
                        {development.planningPermit?.status && (
                          <Col xs={24} md={8}>
                            <div>
                              <Text strong>Planning Permit</Text>
                              <div>
                                <Tag
                                  color={
                                    development.planningPermit.status ===
                                    "approved"
                                      ? "success"
                                      : development.planningPermit.status ===
                                          "pending"
                                        ? "processing"
                                        : "error"
                                  }>
                                  {development.planningPermit.status.toUpperCase()}
                                </Tag>
                              </div>
                            </div>
                          </Col>
                        )}
                      </Row>
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
                        icon={<HomeOutlined />}
                        onClick={() => setActiveTab("properties")}>
                        Manage Properties ({totalProperties})
                      </Button>
                      <Button
                        block
                        icon={<DollarOutlined />}
                        onClick={() => setActiveTab("payments")}>
                        Payment Schedule ({pendingPayments} overdue)
                      </Button>
                      <Button
                        block
                        icon={<FileTextOutlined />}
                        onClick={() => setActiveTab("conditions")}>
                        Conditions ({pendingConditions} pending)
                      </Button>
                      <Button
                        block
                        icon={<AuditOutlined />}
                        onClick={() => setActiveTab("legal")}>
                        Legal Processes
                      </Button>
                      <Button
                        block
                        icon={<SafetyCertificateOutlined />}
                        onClick={() => setActiveTab("regulatory")}>
                        Regulatory Approvals
                      </Button>
                      <Button
                        block
                        // icon={<MapOutlined />}
                        onClick={() => setActiveTab("inspection")}>
                        Due Diligence
                      </Button>
                      {isLeaseTransaction && (
                        <>
                          <Button
                            block
                            icon={<KeyOutlined />}
                            onClick={() => setActiveTab("lease")}>
                            Lease Tracker {leaseUrgency && leaseUrgency.level !== "safe" && (
                              <Tag color={leaseUrgency.level === "critical" ? "red" : leaseUrgency.level === "warning" ? "orange" : "blue"} className="ml-2">
                                {leaseUrgency.days}d
                              </Tag>
                            )}
                          </Button>
                          <Button
                            block
                            icon={<AlertOutlined />}
                            onClick={() => setActiveTab("lease-alerts")}>
                            Alert Settings
                          </Button>
                        </>
                      )}
                    </Space>
                  </Card>

                  {/* Upcoming Deadlines */}
                  <Card title="Upcoming Deadlines" className="mb-6">
                    <Timeline>
                      {paymentSchedule
                        ?.filter((p) => p.status === "pending" && p.dueDate)
                        .sort(
                          (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
                        )
                        .slice(0, 3)
                        .map((payment, index) => (
                          <Timeline.Item
                            key={index}
                            color={isOverdue(payment.dueDate) ? "red" : "blue"}
                            dot={<DollarOutlined />}>
                            <Text strong>
                              Payment #{payment.installmentNumber}
                            </Text>
                            <br />
                            <Text type="secondary">
                              Due:{" "}
                              {dayjs(payment.dueDate).format("DD MMM YYYY")}
                              {isOverdue(payment.dueDate) && (
                                <Tag color="red" className="ml-2">
                                  OVERDUE
                                </Tag>
                              )}
                            </Text>
                            <br />
                            <Text type="secondary">
                              Amount: {formatCurrency(payment.amount, "NGN")}
                            </Text>
                          </Timeline.Item>
                        ))}

                      {conditions
                        ?.filter((c) => c.status === "pending" && c.dueDate)
                        .sort(
                          (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
                        )
                        .slice(0, 2)
                        .map((condition, index) => (
                          <Timeline.Item
                            key={`condition-${index}`}
                            color={
                              isOverdue(condition.dueDate) ? "red" : "orange"
                            }
                            dot={<CheckCircleOutlined />}>
                            <Text strong>{condition.condition}</Text>
                            <br />
                            <Text type="secondary">
                              Due:{" "}
                              {dayjs(condition.dueDate).format("DD MMM YYYY")}
                              {isOverdue(condition.dueDate) && (
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
                    {pendingPayments > 0 && (
                      <Alert
                        message={`${pendingPayments} overdue payment(s)`}
                        type="error"
                        showIcon
                        icon={<ExclamationCircleOutlined />}
                        className="mb-2"
                      />
                    )}
                    {overdueConditions > 0 && (
                      <Alert
                        message={`${overdueConditions} overdue condition(s)`}
                        type="error"
                        showIcon
                        icon={<ClockCircleOutlined />}
                        className="mb-2"
                      />
                    )}
                    {governorsConsent?.status === "pending" && (
                      <Alert
                        message="Pending governor's consent"
                        type="warning"
                        showIcon
                        icon={<SafetyCertificateOutlined />}
                        className="mb-2"
                      />
                    )}
                    {titleSearch?.isCompleted === false && (
                      <Alert
                        message="Title search not completed"
                        type="warning"
                        showIcon
                        icon={<AuditOutlined />}
                        className="mb-2"
                      />
                    )}
                    {physicalInspection?.isCompleted === false && (
                      <Alert
                        message="Physical inspection not completed"
                        type="warning"
                        showIcon
                        // icon={<MapOutlined />}
                        className="mb-2"
                      />
                    )}
                    {isLeaseTransaction && leaseUrgency?.level === "critical" && (
                      <Alert
                        message={`Lease expires in ${leaseUrgency.days} day(s) - CRITICAL`}
                        type="error"
                        showIcon
                        icon={<ExclamationCircleOutlined />}
                        className="mb-2"
                      />
                    )}
                    {isLeaseTransaction && leaseUrgency?.level === "warning" && (
                      <Alert
                        message={`Lease expires in ${leaseUrgency.days} day(s) - Review required`}
                        type="warning"
                        showIcon
                        icon={<AlertOutlined />}
                        className="mb-2"
                      />
                    )}
                    {isLeaseTransaction && pendingMilestones > 0 && (
                      <Alert
                        message={`${pendingMilestones} pending milestone(s)`}
                        type="info"
                        showIcon
                        icon={<ClockCircleOutlined />}
                        className="mb-2"
                      />
                    )}
                    {deedOfAssignment?.status === "registered" && (
                      <Alert
                        message="Transaction completed and registered"
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                      />
                    )}
                  </Card>
                </Col>
              </Row>
            </Tabs.TabPane>

            {/* Properties Tab */}
            <Tabs.TabPane tab="Properties" key="properties">
              <PropertiesManager matterId={matterId} properties={properties} />
            </Tabs.TabPane>

            {/* Payments Tab */}
            <Tabs.TabPane tab="Payments" key="payments">
              <PaymentScheduleManager
                matterId={matterId}
                paymentSchedule={paymentSchedule}
              />
            </Tabs.TabPane>

            {/* Conditions Tab */}
            <Tabs.TabPane tab="Conditions" key="conditions">
              <ConditionsManager matterId={matterId} conditions={conditions} />
            </Tabs.TabPane>

            {/* Legal Processes Tab */}
            <Tabs.TabPane tab="Legal" key="legal">
              <Card title="Legal Processes" className="mb-6">
                <Tabs type="card">
                  <Tabs.TabPane tab="Contract of Sale" key="contract">
                    <Descriptions column={1} bordered>
                      <Descriptions.Item label="Status">
                        <Tag
                          color={
                            contractOfSale?.status === "completed"
                              ? "success"
                              : contractOfSale?.status === "executed"
                                ? "blue"
                                : contractOfSale?.status === "terminated"
                                  ? "red"
                                  : "default"
                          }>
                          {contractOfSale?.status?.toUpperCase() ||
                            "NOT STARTED"}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Execution Date">
                        {contractOfSale?.executionDate
                          ? dayjs(contractOfSale.executionDate).format(
                              "DD/MM/YYYY",
                            )
                          : "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Completion Date">
                        {contractOfSale?.completionDate
                          ? dayjs(contractOfSale.completionDate).format(
                              "DD/MM/YYYY",
                            )
                          : "N/A"}
                      </Descriptions.Item>
                    </Descriptions>
                  </Tabs.TabPane>

                  <Tabs.TabPane tab="Lease Agreement" key="lease">
                    <Descriptions column={1} bordered>
                      <Descriptions.Item label="Status">
                        <Tag
                          color={
                            leaseAgreement?.status === "active"
                              ? "success"
                              : leaseAgreement?.status === "executed"
                                ? "blue"
                                : leaseAgreement?.status === "expired"
                                  ? "default"
                                  : "error"
                          }>
                          {leaseAgreement?.status?.toUpperCase() ||
                            "NOT STARTED"}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Commencement Date">
                        {leaseAgreement?.commencementDate
                          ? dayjs(leaseAgreement.commencementDate).format(
                              "DD/MM/YYYY",
                            )
                          : "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Expiry Date">
                        {leaseAgreement?.expiryDate
                          ? dayjs(leaseAgreement.expiryDate).format(
                              "DD/MM/YYYY",
                            )
                          : "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Duration">
                        {leaseAgreement?.duration
                          ? `${leaseAgreement.duration.years || 0} years, ${
                              leaseAgreement.duration.months || 0
                            } months`
                          : "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Renewal Option">
                        {leaseAgreement?.renewalOption ? "Yes" : "No"}
                      </Descriptions.Item>
                    </Descriptions>
                  </Tabs.TabPane>

                  <Tabs.TabPane tab="Deed of Assignment" key="deed">
                    <Descriptions column={1} bordered>
                      <Descriptions.Item label="Status">
                        <Tag
                          color={
                            deedOfAssignment?.status === "registered"
                              ? "success"
                              : deedOfAssignment?.status === "executed"
                                ? "blue"
                                : deedOfAssignment?.status === "pending"
                                  ? "processing"
                                  : "default"
                          }>
                          {deedOfAssignment?.status?.toUpperCase() || "PENDING"}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Execution Date">
                        {deedOfAssignment?.executionDate
                          ? dayjs(deedOfAssignment.executionDate).format(
                              "DD/MM/YYYY",
                            )
                          : "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Registration Date">
                        {deedOfAssignment?.registrationDate
                          ? dayjs(deedOfAssignment.registrationDate).format(
                              "DD/MM/YYYY",
                            )
                          : "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Registration Number">
                        {deedOfAssignment?.registrationNumber || "N/A"}
                      </Descriptions.Item>
                    </Descriptions>
                  </Tabs.TabPane>
                </Tabs>
              </Card>
            </Tabs.TabPane>

            {/* Regulatory Tab */}
            <Tabs.TabPane tab="Regulatory" key="regulatory">
              <Card title="Regulatory Approvals" className="mb-6">
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="Governor's Consent">
                    <Tag
                      color={
                        governorsConsent?.status === "approved"
                          ? "success"
                          : governorsConsent?.status === "pending"
                            ? "processing"
                            : governorsConsent?.status === "rejected"
                              ? "error"
                              : "default"
                      }>
                      {governorsConsent?.status?.toUpperCase() ||
                        "NOT REQUIRED"}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Application Date">
                    {governorsConsent?.applicationDate
                      ? dayjs(governorsConsent.applicationDate).format(
                          "DD/MM/YYYY",
                        )
                      : "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Approval Date">
                    {governorsConsent?.approvalDate
                      ? dayjs(governorsConsent.approvalDate).format(
                          "DD/MM/YYYY",
                        )
                      : "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Reference Number">
                    {governorsConsent?.referenceNumber || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Required">
                    {governorsConsent?.isRequired ? "Yes" : "No"}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Tabs.TabPane>

            {/* Inspection Tab */}
            <Tabs.TabPane tab="Due Diligence" key="inspection">
              <Card title="Due Diligence" className="mb-6">
                <Tabs type="card">
                  <Tabs.TabPane tab="Title Search" key="title">
                    <Descriptions column={1} bordered>
                      <Descriptions.Item label="Status">
                        <Tag
                          color={
                            titleSearch?.isCompleted ? "success" : "error"
                          }>
                          {titleSearch?.isCompleted ? "COMPLETED" : "PENDING"}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Search Date">
                        {titleSearch?.searchDate
                          ? dayjs(titleSearch.searchDate).format("DD/MM/YYYY")
                          : "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Findings" span={2}>
                        <Paragraph>
                          {titleSearch?.findings || "No findings recorded"}
                        </Paragraph>
                      </Descriptions.Item>
                      <Descriptions.Item label="Encumbrances">
                        {titleSearch?.encumbrances &&
                        titleSearch.encumbrances.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {titleSearch.encumbrances.map((enc, index) => (
                              <li key={index}>{enc}</li>
                            ))}
                          </ul>
                        ) : (
                          "No encumbrances"
                        )}
                      </Descriptions.Item>
                    </Descriptions>
                  </Tabs.TabPane>

                  <Tabs.TabPane tab="Physical Inspection" key="physical">
                    <Descriptions column={1} bordered>
                      <Descriptions.Item label="Status">
                        <Tag
                          color={
                            physicalInspection?.isCompleted
                              ? "success"
                              : "error"
                          }>
                          {physicalInspection?.isCompleted
                            ? "COMPLETED"
                            : "PENDING"}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Inspection Date">
                        {physicalInspection?.inspectionDate
                          ? dayjs(physicalInspection.inspectionDate).format(
                              "DD/MM/YYYY",
                            )
                          : "N/A"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Findings" span={2}>
                        <Paragraph>
                          {physicalInspection?.findings ||
                            "No findings recorded"}
                        </Paragraph>
                      </Descriptions.Item>
                    </Descriptions>
                  </Tabs.TabPane>
                </Tabs>
              </Card>
            </Tabs.TabPane>

            {/* Lease Tracking Tab - Only show for lease transactions */}
            {isLeaseTransaction && (
              <Tabs.TabPane tab={
                <span>
                  <KeyOutlined className="mr-1" />
                  Lease
                  {leaseUrgency && leaseUrgency.level !== "safe" && (
                    <Tag 
                      color={leaseUrgency.level === "critical" ? "red" : leaseUrgency.level === "warning" ? "orange" : "blue"} 
                      className="ml-2"
                    >
                      {leaseUrgency.days}d
                    </Tag>
                  )}
                </span>
              } key="lease">
                <Row gutter={16}>
                  <Col xs={24} lg={24}>
                    {/* Lease Tracker Component */}
                    <LeaseTracker 
                      leaseAgreement={leaseAgreement}
                      renewalTracking={renewalTracking}
                      tenant={tenant}
                      landlord={landlord}
                    />
                  </Col>
                </Row>

                <Row gutter={16} className="mt-4">
                  <Col xs={24} lg={12}>
                    {/* Milestones Manager */}
                    <LeaseMilestonesManager 
                      matterId={matterId}
                      milestones={leaseMilestones}
                    />
                  </Col>
                  <Col xs={24} lg={12}>
                    {/* Import LeaseDetails for renewal management */}
                    <LeaseRenewalSection 
                      matterId={matterId}
                      renewalTracking={renewalTracking}
                      rentAmount={rentAmount}
                    />
                  </Col>
                </Row>

                {/* Lease Agreement Edit Form */}
                <Card title="Lease Agreement Details" className="mt-4">
                  <Descriptions column={2} bordered>
                    <Descriptions.Item label="Status">
                      <Tag
                        color={
                          leaseAgreement?.status === "active"
                            ? "success"
                            : leaseAgreement?.status === "executed"
                              ? "blue"
                              : leaseAgreement?.status === "expired"
                                ? "default"
                                : "processing"
                        }>
                        {leaseAgreement?.status?.toUpperCase() || "NOT SET"}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Renewal Option">
                      <Tag color={leaseAgreement?.renewalOption ? "green" : "default"}>
                        {leaseAgreement?.renewalOption ? "YES" : "NO"}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Commencement Date">
                      {leaseAgreement?.commencementDate
                        ? dayjs(leaseAgreement.commencementDate).format("DD/MM/YYYY")
                        : "Not set"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Expiry Date">
                      {leaseAgreement?.expiryDate
                        ? dayjs(leaseAgreement.expiryDate).format("DD/MM/YYYY")
                        : "Not set"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Duration">
                      {leaseAgreement?.duration
                        ? `${leaseAgreement.duration.years || 0} years, ${leaseAgreement.duration.months || 0} months`
                        : "Not set"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Time Remaining">
                      {leaseUrgency && (
                        <Tag
                          color={
                            leaseUrgency.level === "critical" ? "red" :
                            leaseUrgency.level === "warning" ? "orange" :
                            leaseUrgency.level === "notice" ? "blue" : "green"
                          }
                        >
                          {leaseUrgency.level === "expired" 
                            ? `Expired ${Math.abs(leaseUrgency.days)} days ago`
                            : `${leaseUrgency.days} days remaining`
                          }
                        </Tag>
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Tabs.TabPane>
            )}

            {/* Lease Alerts Tab */}
            {isLeaseTransaction && (
              <Tabs.TabPane tab={
                <span>
                  <AlertOutlined className="mr-1" />
                  Alert Settings
                </span>
              } key="lease-alerts">
                <Row gutter={16}>
                  <Col xs={24} lg={24}>
                    <LeaseAlertManager 
                      matterId={matterId}
                      alertSettings={leaseAlertSettings}
                    />
                  </Col>
                </Row>

                <Card title="Lease Expiration Summary" className="mt-4">
                  <Row gutter={16}>
                    <Col xs={24} sm={8}>
                      <Card size="small">
                        <Statistic
                          title="Total Milestones"
                          value={leaseMilestones?.length || 0}
                          prefix={<RocketOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card size="small">
                        <Statistic
                          title="Completed"
                          value={completedMilestones}
                          valueStyle={{ color: "#52c41a" }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card size="small">
                        <Statistic
                          title="Pending"
                          value={pendingMilestones}
                          valueStyle={{ color: pendingMilestones > 0 ? "#fa8c16" : "#52c41a" }}
                        />
                      </Card>
                    </Col>
                  </Row>
                </Card>

                <Card title="Renewal Status" className="mt-4">
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label="Renewal Initiated">
                      <Tag color={renewalTracking?.renewalInitiated ? "green" : "default"}>
                        {renewalTracking?.renewalInitiated ? "YES" : "NO"}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Renewal Status">
                      <Tag
                        color={
                          renewalTracking?.renewalStatus === "agreed" ? "green" :
                          renewalTracking?.renewalStatus === "in-progress" ? "blue" :
                          renewalTracking?.renewalStatus === "disputed" ? "orange" :
                          renewalTracking?.renewalStatus === "completed" ? "success" :
                          "default"
                        }
                      >
                        {renewalTracking?.renewalStatus?.replace(/-/g, " ").toUpperCase() || "NOT INITIATED"}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Renewal Deadline">
                      {renewalTracking?.renewalDeadline
                        ? dayjs(renewalTracking.renewalDeadline).format("DD/MM/YYYY")
                        : "Not set"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Proposed New Rent">
                      {renewalTracking?.proposedNewRent?.amount
                        ? `${renewalTracking.proposedNewRent.currency || "NGN"} ${renewalTracking.proposedNewRent.amount.toLocaleString()}`
                        : "Not proposed"}
                      {renewalTracking?.rentIncreasePercentage > 0 && (
                        <Tag color="green" className="ml-2">
                          +{renewalTracking.rentIncreasePercentage}%
                        </Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Negotiations">
                      {renewalTracking?.negotiationsHistory?.length || 0} recorded
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Tabs.TabPane>
            )}

            {/* History Tab */}
            <Tabs.TabPane tab="History" key="history">
              <Card title="Activity Log" className="mb-6">
                <Timeline>
                  {createdAt && (
                    <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                      <Text strong>Property details created</Text>
                      <br />
                      <Text type="secondary">
                        {dayjs(createdAt).format("DD MMM YYYY HH:mm")}
                      </Text>
                    </Timeline.Item>
                  )}

                  {updatedAt && updatedAt !== createdAt && (
                    <Timeline.Item color="blue" dot={<EditOutlined />}>
                      <Text strong>Property details updated</Text>
                      <br />
                      <Text type="secondary">
                        {dayjs(updatedAt).format("DD MMM YYYY HH:mm")}
                      </Text>
                    </Timeline.Item>
                  )}

                  {contractOfSale?.executionDate && (
                    <Timeline.Item color="green" dot={<FileTextOutlined />}>
                      <Text strong>Contract of sale executed</Text>
                      <br />
                      <Text type="secondary">
                        {dayjs(contractOfSale.executionDate).format(
                          "DD MMM YYYY",
                        )}
                      </Text>
                    </Timeline.Item>
                  )}

                  {governorsConsent?.approvalDate && (
                    <Timeline.Item
                      color="green"
                      dot={<SafetyCertificateOutlined />}>
                      <Text strong>Governor's consent approved</Text>
                      <br />
                      <Text type="secondary">
                        {dayjs(governorsConsent.approvalDate).format(
                          "DD MMM YYYY",
                        )}
                      </Text>
                    </Timeline.Item>
                  )}

                  {deedOfAssignment?.registrationDate && (
                    <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                      <Text strong>Deed of assignment registered</Text>
                      <br />
                      <Text type="secondary">
                        {dayjs(deedOfAssignment.registrationDate).format(
                          "DD MMM YYYY",
                        )}
                      </Text>
                    </Timeline.Item>
                  )}
                </Timeline>
              </Card>
            </Tabs.TabPane>
          </Tabs>
        </>
      )}

      {/* Transaction Completion Modal */}
      {propertyDetails && (
        <TransactionCompletionModal
          matterId={matterId}
          visible={showCompletionModal}
          onClose={() => setShowCompletionModal(false)}
          propertyDetails={propertyDetails}
        />
      )}
    </div>
  );
};

export default PropertyDetails;
