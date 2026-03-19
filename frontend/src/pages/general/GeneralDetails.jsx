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
  Alert,
  Modal,
  Avatar,
  Spin,
  message,
  Dropdown,
  Menu,
  Divider,
} from "antd";
import {
  EditOutlined,
  DollarOutlined,
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  MoreOutlined,
  DownloadOutlined,
  PrinterOutlined,
  HistoryOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import GeneralForm from "./GeneralForm";
import RequirementsManager from "../../components/general/RequirementsManager";
import DeliverablesManager from "../../components/general/DeliverablesManager";
import PartiesManager from "../../components/general/PartiesManager";
import DocumentsManager from "../../components/general/DocumentsManager";
import ProjectStagesManager from "../../components/general/ProjectStagesManager";
import DisbursementsManager from "../../components/general/DisbursementsManager";
import { downloadGeneralReport } from "../../utils/pdfDownload";

import {
  fetchGeneralDetails,
  completeGeneralService,
} from "../../redux/features/general/generalSlice";
import {
  NIGERIAN_GENERAL_SERVICE_TYPES,
  BILLING_TYPES,
} from "../../utils/generalConstants";

const { Title, Text, Paragraph } = Typography;

dayjs.extend(relativeTime);

// ============================================
// SUB-COMPONENTS (MEMOIZED)
// ============================================

const ClientInfoCard = React.memo(({ client, isMobile }) => {
  if (!client) return null;

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <span className="font-semibold">Client Information</span>
        </Space>
      }
      className="shadow-sm hover:shadow-md transition-shadow mb-4">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8} className="text-center">
          <Avatar
            size={80}
            src={client.photo}
            className="mb-3 shadow-md border-2 border-blue-200"
            style={{ backgroundColor: "#1890ff" }}>
            {client.firstName?.[0]}
            {client.lastName?.[0]}
          </Avatar>
          <Title level={5} className="!mb-1">
            {client.firstName} {client.lastName}
          </Title>
          {client.companyName && (
            <Text type="secondary" className="text-sm">
              {client.companyName}
            </Text>
          )}
        </Col>
        <Col xs={24} sm={16}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Email">
              <a href={`mailto:${client.email}`} className="text-blue-600">
                {client.email || "N/A"}
              </a>
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              <a href={`tel:${client.phone}`} className="text-blue-600">
                {client.phone || "N/A"}
              </a>
            </Descriptions.Item>
            <Descriptions.Item label="Address">
              <Text className="text-sm">{client.address || "N/A"}</Text>
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>
    </Card>
  );
});

ClientInfoCard.displayName = "ClientInfoCard";

const ServiceDetailsCard = React.memo(
  ({ details, serviceTypeLabel, isMobile }) => {
    const isActive = details.matterId?.status === "active";
    const isCompleted = details.matterId?.status === "completed";

    // ✅ Handle accountOfficer as array
    const accountOfficer = Array.isArray(details.matterId?.accountOfficer)
      ? details.matterId.accountOfficer[0]
      : details.matterId?.accountOfficer;

    return (
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span className="font-semibold">Service Details</span>
          </Space>
        }
        className="shadow-sm hover:shadow-md transition-shadow mb-4">
        <Descriptions bordered column={isMobile ? 1 : 2} size="small">
          <Descriptions.Item label="Matter Number" span={isMobile ? 1 : 2}>
            <Text strong className="text-blue-600">
              {details.matterId?.matterNumber}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Service Type">
            <Tag color="blue">{serviceTypeLabel}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag
              color={isActive ? "success" : isCompleted ? "blue" : "default"}>
              {details.matterId?.status?.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Request Date">
            {dayjs(details.requestDate).format("DD MMM YYYY")}
          </Descriptions.Item>
          <Descriptions.Item label="Expected Completion">
            {details.expectedCompletionDate
              ? dayjs(details.expectedCompletionDate).format("DD MMM YYYY")
              : "Not set"}
          </Descriptions.Item>
          <Descriptions.Item label="Billing Type">
            <Tag color="green">
              {
                BILLING_TYPES.find(
                  (t) => t.value === details.billing?.billingType,
                )?.label
              }
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Jurisdiction">
            {details.jurisdiction?.state
              ? `${details.jurisdiction.state}${details.jurisdiction.lga ? `, ${details.jurisdiction.lga}` : ""}`
              : "Not specified"}
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
              <Text type="secondary">Not assigned</Text>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  },
);

ServiceDetailsCard.displayName = "ServiceDetailsCard";

const FinancialSummaryCard = React.memo(({ details }) => {
  const financial = details?.financialSummary || details?.totalWithTax || {};

  return (
    <Card
      title={
        <Space>
          <DollarOutlined />
          <span className="font-semibold">Financial Summary</span>
        </Space>
      }
      className="shadow-sm hover:shadow-md transition-shadow mb-4">
      <Statistic
        title="Base Fee"
        value={financial.baseFee || 0}
        prefix="₦"
        valueStyle={{ color: "#3f8600", fontSize: "1.5rem" }}
        className="mb-4"
      />
      <Descriptions column={1} size="small">
        <Descriptions.Item label={`VAT (${details?.billing?.vatRate || 7.5}%)`}>
          ₦{financial.vat?.toLocaleString() || "0"}
        </Descriptions.Item>
        <Descriptions.Item label="Gross Amount">
          ₦{financial.gross?.toLocaleString() || "0"}
        </Descriptions.Item>
        <Descriptions.Item label={`WHT (${details?.billing?.whtRate || 5}%)`}>
          <Text className="text-red-600">
            -₦{financial.wht?.toLocaleString() || "0"}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label={<strong>Net Amount</strong>}>
          <Text strong className="text-green-600 text-base">
            ₦{financial.net?.toLocaleString() || "0"}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Disbursements">
          ₦
          {(
            financial.disbursements ||
            details?.totalDisbursements ||
            0
          ).toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label={<strong>Grand Total</strong>}>
          <Text strong className="text-blue-600 text-lg">
            ₦{financial.grandTotal?.toLocaleString() || "0"}
          </Text>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
});

FinancialSummaryCard.displayName = "FinancialSummaryCard";

const QuickActionsCard = React.memo(
  ({ isCompleted, onEdit, onComplete, onDelete, onDownloadPdf }) => (
    <Card
      title={<span className="font-semibold">⚡ Quick Actions</span>}
      className="shadow-sm">
      <Space direction="vertical" className="w-full" size="middle">
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
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={onComplete}
          block
          disabled={isCompleted}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400">
          Mark Complete
        </Button>
        <Button danger icon={<CloseCircleOutlined />} onClick={onDelete} block>
          Delete Matter
        </Button>
      </Space>
    </Card>
  ),
);

QuickActionsCard.displayName = "QuickActionsCard";

// ============================================
// MAIN COMPONENT
// ============================================
const GeneralDetails = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { matterId } = useParams();

  // ✅ ALL HOOKS MUST BE DEFINED BEFORE ANY CONDITIONAL RETURNS
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Redux selectors
  const selectedDetails = useSelector((state) => state.general.selectedDetails);
  const detailsLoading = useSelector((state) => state.general.detailsLoading);
  const actionLoading = useSelector((state) => state.general.actionLoading);

  // Extract details
  const details = useMemo(() => {
    if (!selectedDetails) return null;
    return selectedDetails.generalDetail || selectedDetails;
  }, [selectedDetails]);

  // Service type label
  const serviceTypeLabel = useMemo(() => {
    if (!details?.serviceType) return "N/A";
    const type = NIGERIAN_GENERAL_SERVICE_TYPES.find(
      (t) => t.value === details.serviceType,
    );
    return type?.label || details.serviceType;
  }, [details]);

  // Status flags
  const isCompleted = details?.matterId?.status === "completed";
  const isActive = details?.matterId?.status === "active";

  // Handlers
  const handleEdit = useCallback(() => setIsEditing(true), []);
  const handleEditCancel = useCallback(() => setIsEditing(false), []);

  const handleEditSuccess = useCallback(() => {
    setIsEditing(false);
    dispatch(fetchGeneralDetails(matterId));
    message.success("General matter updated successfully");
  }, [dispatch, matterId]);

  const handleComplete = useCallback(async () => {
    try {
      await dispatch(
        completeGeneralService({
          matterId,
          data: { completionDate: new Date() },
        }),
      ).unwrap();
      setShowCompletionModal(false);
      message.success("Service marked as completed");
      dispatch(fetchGeneralDetails(matterId));
    } catch (error) {
      message.error(error?.message || "Failed to complete service");
    }
  }, [dispatch, matterId]);

  const handleDelete = useCallback(() => {
    Modal.confirm({
      title: "Delete General Matter",
      content:
        "Are you sure you want to delete this matter? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        message.info("Delete functionality to be implemented");
      },
    });
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    try {
      message.loading({ content: "Generating PDF report...", key: "pdf" });
      await downloadGeneralReport(matterId, "general");
      message.success({ content: "PDF report downloaded successfully!", key: "pdf" });
    } catch (error) {
      message.error({ content: "Failed to download PDF report", key: "pdf" });
    }
  }, [matterId]);

  // Action menu
  const actionMenu = useMemo(
    () => (
      <Menu>
        <Menu.Item key="download" icon={<DownloadOutlined />}>
          Export as PDF
        </Menu.Item>
        <Menu.Item
          key="print"
          icon={<PrinterOutlined />}
          onClick={() => window.print()}>
          Print Details
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item key="history" icon={<HistoryOutlined />}>
          View History
        </Menu.Item>
      </Menu>
    ),
    [],
  );

  // Overview Tab (memoized)
  const OverviewTab = useMemo(() => {
    if (!details) return null;

    return (
      <div className="p-4 md:p-6">
        <Row gutter={[16, 24]}>
          <Col xs={24} lg={16}>
            <ClientInfoCard
              client={details?.matterId?.client}
              isMobile={isMobile}
            />
            <ServiceDetailsCard
              details={details}
              serviceTypeLabel={serviceTypeLabel}
              isMobile={isMobile}
            />
            <Card
              title={
                <Space>
                  <FileTextOutlined />
                  <span className="font-semibold">Service Description</span>
                </Space>
              }
              className="shadow-sm hover:shadow-md transition-shadow">
              <Paragraph className="whitespace-pre-wrap">
                {details?.serviceDescription || "No description provided"}
              </Paragraph>
              {details?.procedureNotes && (
                <>
                  <Divider orientation="left">Procedure Notes</Divider>
                  <Paragraph className="whitespace-pre-wrap text-secondary">
                    {details.procedureNotes}
                  </Paragraph>
                </>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            {!isCompleted && isActive && (
              <Alert
                message="🔄 Active Service"
                description="This service is currently active and ongoing."
                type="info"
                showIcon
                className="mb-4"
                action={
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => setShowCompletionModal(true)}
                    className="bg-green-600 hover:bg-green-700">
                    Complete
                  </Button>
                }
              />
            )}
            {isCompleted && details?.actualCompletionDate && (
              <Alert
                message="✅ Service Completed"
                description={`Completed on ${dayjs(details.actualCompletionDate).format("DD MMM YYYY")}`}
                type="success"
                showIcon
                className="mb-4"
              />
            )}
            <FinancialSummaryCard details={details} />
            <QuickActionsCard
              isCompleted={isCompleted}
              onEdit={handleEdit}
              onComplete={() => setShowCompletionModal(true)}
              onDelete={handleDelete}
              onDownloadPdf={handleDownloadPdf}
            />
          </Col>
        </Row>
      </div>
    );
  }, [
    details,
    serviceTypeLabel,
    isMobile,
    isCompleted,
    isActive,
    handleEdit,
    handleDelete,
  ]);

  // Tab items (memoized)
  const tabItems = useMemo(
    () => [
      {
        key: "overview",
        label: (
          <Space>
            <EyeOutlined />
            {!isMobile && "Overview"}
          </Space>
        ),
        children: OverviewTab,
      },
      {
        key: "requirements",
        label: (
          <Space>
            <CheckCircleOutlined />
            {!isMobile && "Requirements"}
          </Space>
        ),
        children: (
          <div className="p-4 md:p-6">
            <RequirementsManager matterId={matterId} />
          </div>
        ),
      },
      {
        key: "deliverables",
        label: (
          <Space>
            <FileTextOutlined />
            {!isMobile && "Deliverables"}
          </Space>
        ),
        children: (
          <div className="p-4 md:p-6">
            <DeliverablesManager matterId={matterId} />
          </div>
        ),
      },
      {
        key: "parties",
        label: (
          <Space>
            <TeamOutlined />
            {!isMobile && "Parties"}
          </Space>
        ),
        children: (
          <div className="p-4 md:p-6">
            <PartiesManager matterId={matterId} />
          </div>
        ),
      },
      {
        key: "documents",
        label: (
          <Space>
            <FileTextOutlined />
            {!isMobile && "Documents"}
          </Space>
        ),
        children: (
          <div className="p-4 md:p-6">
            <DocumentsManager matterId={matterId} />
          </div>
        ),
      },
      {
        key: "stages",
        label: (
          <Space>
            <DollarOutlined />
            {!isMobile && "Stages"}
          </Space>
        ),
        children: (
          <div className="p-4 md:p-6">
            <ProjectStagesManager matterId={matterId} />
          </div>
        ),
      },
      {
        key: "disbursements",
        label: (
          <Space>
            <DollarOutlined />
            {!isMobile && "Disbursements"}
          </Space>
        ),
        children: (
          <div className="p-4 md:p-6">
            <DisbursementsManager matterId={matterId} />
          </div>
        ),
      },
    ],
    [isMobile, OverviewTab, matterId],
  );

  // Effects
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (matterId) {
      dispatch(fetchGeneralDetails(matterId));
    }
  }, [dispatch, matterId]);

  // ✅ NOW CONDITIONAL RETURNS CAN HAPPEN (AFTER ALL HOOKS)
  if (detailsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] flex-col">
        <Spin size="large" />
        <Text className="mt-4 text-gray-600">
          Loading general matter details...
        </Text>
      </div>
    );
  }

  if (!details) {
    return (
      <Card className="text-center p-10 m-6 shadow-lg">
        <Title level={4} className="text-gray-700">
          No General Matter Found
        </Title>
        <Text type="secondary">The requested matter could not be loaded</Text>
        <div className="mt-6">
          <Button
            type="primary"
            onClick={() => navigate("/dashboard/matters/general")}
            size="large">
            Back to List
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            type="link"
            onClick={() => navigate("/dashboard/matters/general")}
            className="pl-0 text-blue-600 hover:text-blue-700">
            ← Back to General List
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
                    isActive ? "success" : isCompleted ? "blue" : "default"
                  }>
                  {details.matterId?.status?.toUpperCase()}
                </Tag>
              </Space>
              <Text type="secondary" className="block mt-2 text-sm">
                {serviceTypeLabel} • #{details.matterId?.matterNumber} •
                Requested {dayjs(details.requestDate).format("DD MMM YYYY")}
              </Text>
            </div>

            <Space wrap>
              <Button
                icon={<EyeOutlined />}
                onClick={() => window.print()}
                className="border-blue-500 text-blue-600 hidden md:inline-flex">
                Print
              </Button>
              <Dropdown overlay={actionMenu} trigger={["click"]}>
                <Button icon={<MoreOutlined />} />
              </Dropdown>
            </Space>
          </div>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size={isMobile ? "small" : "large"}
          type="card"
          className="bg-white rounded-xl shadow-lg overflow-hidden"
          items={tabItems}
        />

        <Modal
          title="✏️ Edit General Matter"
          open={isEditing}
          onCancel={handleEditCancel}
          footer={null}
          width={isMobile ? "100%" : 900}
          destroyOnClose>
          <GeneralForm
            generalDetails={details}
            onCancel={handleEditCancel}
            onSuccess={handleEditSuccess}
          />
        </Modal>

        <Modal
          title="✅ Complete Service"
          open={showCompletionModal}
          onCancel={() => setShowCompletionModal(false)}
          onOk={handleComplete}
          confirmLoading={actionLoading}
          okText="Mark as Completed">
          <p>Are you sure you want to mark this service as completed?</p>
          <Alert
            message="This action will:"
            description={
              <ul className="list-disc list-inside mt-2">
                <li>Update the matter status to "Completed"</li>
                <li>Set the completion date to today</li>
                <li>Finalize all billing calculations</li>
              </ul>
            }
            type="info"
            showIcon
            className="mt-4"
          />
        </Modal>
      </div>
    </div>
  );
};

export default GeneralDetails;
