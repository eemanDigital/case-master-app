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
  Modal,
  Avatar,
  Spin,
  message,
  Dropdown,
  Menu,
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
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  fetchGeneralDetails,
  completeGeneralService,
} from "../../redux/features/general/generalSlice";
import {
  NIGERIAN_GENERAL_SERVICE_TYPES,
  BILLING_TYPES,
} from "../../utils/generalConstants";
import GeneralForm from "./GeneralForm";
import RequirementsManager from "../components/RequirementsManager";
import DeliverablesManager from "../components/DeliverablesManager";
import PartiesManager from "../components/PartiesManager";
import DocumentsManager from "../components/DocumentsManager";
import ProjectStagesManager from "../components/ProjectStagesManager";
import DisbursementsManager from "../components/DisbursementsManager";

const { Title, Text, Paragraph } = Typography;

const GeneralDetails = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { matterId } = useParams();

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [mobileView, setMobileView] = useState(window.innerWidth < 768);

  const details = useSelector((state) => state.general.selectedDetails);
  const detailsLoading = useSelector((state) => state.general.detailsLoading);
  const actionLoading = useSelector((state) => state.general.actionLoading);

  useEffect(() => {
    const handleResize = () => setMobileView(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (matterId) dispatch(fetchGeneralDetails(matterId));
  }, [dispatch, matterId]);

  const handleEdit = useCallback(() => setIsEditing(true), []);
  const handleEditCancel = useCallback(() => setIsEditing(false), []);
  const handleEditSuccess = useCallback(() => {
    setIsEditing(false);
    dispatch(fetchGeneralDetails(matterId));
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
      message.error(error || "Failed to complete service");
    }
  }, [dispatch, matterId]);

  const serviceTypeLabel = useMemo(() => {
    const type = NIGERIAN_GENERAL_SERVICE_TYPES.find(
      (t) => t.value === details?.serviceType,
    );
    return type?.label || details?.serviceType;
  }, [details]);

  const actionMenu = useMemo(
    () => (
      <Menu>
        <Menu.Item key="download" icon={<DownloadOutlined />}>
          Export as PDF
        </Menu.Item>
        <Menu.Item key="print" icon={<PrinterOutlined />}>
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

  if (detailsLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          flexDirection: "column",
          padding: mobileView ? 16 : 40,
        }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16 }}>Loading general matter details...</Text>
      </div>
    );
  }

  if (!details) {
    return (
      <Card
        style={{
          textAlign: "center",
          padding: 40,
          margin: mobileView ? 16 : 24,
        }}>
        <Title level={4}>No General Matter Selected</Title>
        <Text type="secondary">
          Select a matter from the list to view details
        </Text>
        <div style={{ marginTop: 24 }}>
          <Button type="primary" onClick={() => navigate("/general")}>
            Back to List
          </Button>
        </div>
      </Card>
    );
  }

  const isCompleted = details.matter?.status === "completed";
  const isActive = details.matter?.status === "active";

  const OverviewTab = () => (
    <Row gutter={[mobileView ? 0 : 24, 24]}>
      <Col xs={24} lg={16}>
        <Card
          title={
            <Space>
              <FileTextOutlined />
              <span>Client Information</span>
            </Space>
          }
          style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={8} style={{ textAlign: "center" }}>
              <Avatar size={80} src={details.matter?.client?.photo}>
                {details.matter?.client?.firstName?.[0]}
                {details.matter?.client?.lastName?.[0]}
              </Avatar>
              <Title level={5} style={{ marginTop: 12, marginBottom: 4 }}>
                {details.matter?.client?.firstName}{" "}
                {details.matter?.client?.lastName}
              </Title>
              <Text type="secondary">
                {details.matter?.client?.companyName}
              </Text>
            </Col>
            <Col xs={24} sm={16}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Email">
                  {details.matter?.client?.email || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  {details.matter?.client?.phone || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Address">
                  {details.matter?.client?.address || "N/A"}
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        </Card>

        <Card
          title={
            <Space>
              <FileTextOutlined />
              <span>Service Details</span>
            </Space>
          }
          style={{ marginBottom: 16 }}>
          <Descriptions bordered column={mobileView ? 1 : 2} size="small">
            <Descriptions.Item label="Matter Number" span={mobileView ? 1 : 2}>
              <Text strong>{details.matter?.matterNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Service Type">
              <Tag color="blue">{serviceTypeLabel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag
                color={isActive ? "success" : isCompleted ? "blue" : "default"}>
                {details.matter?.status?.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Request Date">
              {dayjs(details.requestDate).format("DD MMM YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Expected Completion">
              {details.expectedCompletionDate
                ? dayjs(details.expectedCompletionDate).format("DD MMM YYYY")
                : "N/A"}
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
                : "N/A"}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title={
            <Space>
              <FileTextOutlined />
              <span>Service Description</span>
            </Space>
          }>
          <Paragraph style={{ whiteSpace: "pre-wrap" }}>
            {details.serviceDescription}
          </Paragraph>
        </Card>
      </Col>

      <Col xs={24} lg={8}>
        {!isCompleted && isActive && (
          <Alert
            message="Active Service"
            description="This service is currently active and ongoing."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Button
                size="small"
                type="primary"
                onClick={() => setShowCompletionModal(true)}>
                Mark Complete
              </Button>
            }
          />
        )}
        {isCompleted && (
          <Alert
            message="Service Completed"
            description={`Completed on ${dayjs(details.actualCompletionDate).format("DD MMM YYYY")}`}
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Card
          title={
            <Space>
              <DollarOutlined />
              <span>Financial Summary</span>
            </Space>
          }
          style={{ marginBottom: 16 }}>
          <Statistic
            title="Base Fee"
            value={details.financialSummary?.baseFee || 0}
            prefix="₦"
            style={{ marginBottom: 16 }}
          />
          <Descriptions column={1} size="small">
            <Descriptions.Item label={`VAT (${details.billing?.vatRate}%)`}>
              ₦{details.financialSummary?.vat?.toLocaleString() || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Gross">
              ₦{details.financialSummary?.gross?.toLocaleString() || 0}
            </Descriptions.Item>
            <Descriptions.Item label={`WHT (${details.billing?.whtRate}%)`}>
              ₦{details.financialSummary?.wht?.toLocaleString() || 0}
            </Descriptions.Item>
            <Descriptions.Item label={<strong>Net Amount</strong>}>
              <strong>
                ₦{details.financialSummary?.net?.toLocaleString() || 0}
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="Disbursements">
              ₦{details.totalDisbursements?.toLocaleString() || 0}
            </Descriptions.Item>
            <Descriptions.Item label={<strong>Grand Total</strong>}>
              <strong style={{ color: "#52c41a" }}>
                ₦{details.financialSummary?.grandTotal?.toLocaleString() || 0}
              </strong>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {details.requiresNBAStamp && (
          <Card title="NBA Stamp" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Stamp Number">
                {details.nbaStampDetails?.stampNumber || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Stamp Value">
                ₦{details.nbaStampDetails?.stampValue?.toLocaleString() || 0}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        <Card title="Quick Actions">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Button icon={<EditOutlined />} onClick={handleEdit} block>
              Edit Details
            </Button>
            <Button
              icon={<CheckCircleOutlined />}
              onClick={() => setShowCompletionModal(true)}
              block
              disabled={isCompleted}>
              Mark Complete
            </Button>
            <Button danger icon={<CloseCircleOutlined />} block>
              Delete Matter
            </Button>
          </Space>
        </Card>
      </Col>
    </Row>
  );

  return (
    <div style={{ padding: mobileView ? 8 : 24 }}>
      <div style={{ marginBottom: mobileView ? 16 : 24 }}>
        <Button
          type="link"
          onClick={() => navigate("/general")}
          style={{ paddingLeft: 0 }}>
          ← Back to General List
        </Button>
        <Row justify="space-between" align="middle" style={{ marginTop: 8 }}>
          <Col>
            <Space direction={mobileView ? "vertical" : "horizontal"}>
              <Title level={mobileView ? 4 : 3} style={{ margin: 0 }}>
                {details.matter?.client?.companyName ||
                  `${details.matter?.client?.firstName} ${details.matter?.client?.lastName}`}
                <Text
                  type="secondary"
                  style={{ marginLeft: 8, fontSize: "0.8em" }}>
                  #{details.matter?.matterNumber}
                </Text>
              </Title>
              <Tag
                color={
                  details.matter?.status === "active" ? "success" : "blue"
                }>
                {details.matter?.status?.toUpperCase()}
              </Tag>
            </Space>
            <Text
              type="secondary"
              style={{ display: "block", marginTop: mobileView ? 4 : 8 }}>
              {serviceTypeLabel} • Requested{" "}
              {dayjs(details.requestDate).format("DD MMM YYYY")}
            </Text>
          </Col>
          <Col>
            <Space wrap>
              <Button icon={<EyeOutlined />} onClick={() => window.print()}>
                Print
              </Button>
              <Dropdown overlay={actionMenu} trigger={["click"]}>
                <Button icon={<MoreOutlined />} />
              </Dropdown>
            </Space>
          </Col>
        </Row>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size={mobileView ? "small" : "middle"}
        items={[
          {
            key: "overview",
            label: (
              <Space>
                <EyeOutlined />
                Overview
              </Space>
            ),
            children: <OverviewTab />,
          },
          {
            key: "requirements",
            label: (
              <Space>
                <CheckCircleOutlined />
                Requirements
              </Space>
            ),
            children: <RequirementsManager matterId={matterId} />,
          },
          {
            key: "deliverables",
            label: (
              <Space>
                <FileTextOutlined />
                Deliverables
              </Space>
            ),
            children: <DeliverablesManager matterId={matterId} />,
          },
          {
            key: "parties",
            label: (
              <Space>
                <TeamOutlined />
                Parties
              </Space>
            ),
            children: <PartiesManager matterId={matterId} />,
          },
          {
            key: "documents",
            label: (
              <Space>
                <FileTextOutlined />
                Documents
              </Space>
            ),
            children: <DocumentsManager matterId={matterId} />,
          },
          {
            key: "stages",
            label: (
              <Space>
                <DollarOutlined />
                Project Stages
              </Space>
            ),
            children: <ProjectStagesManager matterId={matterId} />,
          },
          {
            key: "disbursements",
            label: (
              <Space>
                <DollarOutlined />
                Disbursements
              </Space>
            ),
            children: <DisbursementsManager matterId={matterId} />,
          },
        ]}
      />

      <Modal
        title="Edit General Matter"
        open={isEditing}
        onCancel={handleEditCancel}
        footer={null}
        width={mobileView ? "100%" : 800}>
        <GeneralForm
          generalDetails={details}
          onCancel={handleEditCancel}
          onSuccess={handleEditSuccess}
        />
      </Modal>

      <Modal
        title="Complete Service"
        open={showCompletionModal}
        onCancel={() => setShowCompletionModal(false)}
        onOk={handleComplete}
        confirmLoading={actionLoading}>
        <p>Mark this service as completed?</p>
        <p>
          <Text type="secondary">
            This will update the matter status to "Completed" and set the
            completion date.
          </Text>
        </p>
      </Modal>
    </div>
  );
};

export default GeneralDetails;
