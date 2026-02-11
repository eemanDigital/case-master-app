// pages/advisory/AdvisoryDetailPage.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Button,
  Tabs,
  Spin,
  Alert,
  Space,
  Typography,
  Statistic,
  Descriptions,
  Breadcrumb,
  message,
  Skeleton,
  Tag,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  DownloadOutlined,
  HistoryOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  SafetyOutlined,
  AlertOutlined,
  SearchOutlined,
  CheckSquareOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  fetchAdvisoryDetails,
  deleteAdvisoryDetails,
  selectCurrentAdvisoryDetail,
  selectAdvisoryLoading,
  selectAdvisoryError,
} from "../../redux/features/advisory/advisorySlice";
import DeleteConfirmModal from "../../components/advisory/DeleteConfirmModal";

// Lazy-load heavy panels - USING YOUR EXACT PATHS
const ResearchQuestionsPanel = lazy(
  () => import("../../components/advisory/ResearchQuestionsList"),
);
const DeliverablesPanel = lazy(
  () => import("../../components/advisory/DeliverablesPanel"),
);
const RiskAssessmentPanel = lazy(
  () => import("../../components/advisory/RiskAssessmentPanel"),
);
const CompliancePanel = lazy(
  () => import("../../components/advisory/CompliancePanel"),
);
const ActivityLog = lazy(() => import("../../components/advisory/ActivityLog"));

const { Title, Text, Paragraph } = Typography;

// ─────────────────────────────────────────────────────────────
// STATUS CONFIG — defined outside components so object refs are stable
// ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    color: "default",
    text: "Pending",
    cls: "bg-gray-100 text-gray-800",
  },
  active: {
    color: "processing",
    text: "Active",
    cls: "bg-blue-100 text-blue-800",
  },
  completed: {
    color: "success",
    text: "Completed",
    cls: "bg-green-100 text-green-800",
  },
  closed: {
    color: "default",
    text: "Closed",
    cls: "bg-gray-100 text-gray-800",
  },
  cancelled: {
    color: "error",
    text: "Cancelled",
    cls: "bg-red-100 text-red-800",
  },
  researching: {
    color: "processing",
    text: "Researching",
    cls: "bg-blue-100 text-blue-800",
  },
  delivered: {
    color: "success",
    text: "Delivered",
    cls: "bg-green-100 text-green-800",
  },
  approved: {
    color: "success",
    text: "Approved",
    cls: "bg-green-100 text-green-800",
  },
  "in-progress": {
    color: "processing",
    text: "In Progress",
    cls: "bg-blue-100 text-blue-800",
  },
};

const RISK_CONFIG = {
  low: { text: "Low", cls: "bg-green-100 text-green-800" },
  medium: { text: "Medium", cls: "bg-yellow-100 text-yellow-800" },
  high: { text: "High", cls: "bg-red-100 text-red-800" },
  critical: { text: "Critical", cls: "bg-purple-100 text-purple-800" },
};

const FALLBACK_CONFIG = { text: "", cls: "bg-gray-100 text-gray-800" };

// ─────────────────────────────────────────────────────────────
// SMALL SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────

const StatusBadge = React.memo(({ status }) => {
  const cfg = STATUS_CONFIG[status] || { ...FALLBACK_CONFIG, text: status };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.text}
    </span>
  );
});
StatusBadge.displayName = "StatusBadge";

const RiskLevelBadge = React.memo(({ level }) => {
  const cfg = RISK_CONFIG[level] || { ...FALLBACK_CONFIG, text: level };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.text}
    </span>
  );
});
RiskLevelBadge.displayName = "RiskLevelBadge";

const PanelLoadingFallback = () => (
  <div className="space-y-4">
    <Skeleton active paragraph={{ rows: 4 }} />
    <Skeleton active paragraph={{ rows: 3 }} />
  </div>
);

// ─────────────────────────────────────────────────────────────
// ADVISORY HEADER
// ─────────────────────────────────────────────────────────────

const AdvisoryHeader = React.memo(
  ({ advisory, onEdit, onDelete, onDuplicate, onExport, isDeleted }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Title level={2} className="!mb-0 !text-gray-900 truncate">
              {advisory.matter?.title || "Untitled Advisory"}
            </Title>
            <StatusBadge status={advisory.status} />
            {isDeleted && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Deleted
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Matter #{advisory.matter?.matterNumber || "N/A"}</span>
            <span>•</span>
            <span>
              Advisory Type: {advisory.advisoryType?.replace(/_/g, " ")}
            </span>
            {advisory.priority && (
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  advisory.priority === "high"
                    ? "bg-red-100 text-red-800"
                    : advisory.priority === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                }`}>
                {advisory.priority.toUpperCase()} PRIORITY
              </span>
            )}
          </div>
        </div>

        <Space className="flex-shrink-0">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={onEdit}
            disabled={isDeleted}>
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={onDelete}
            disabled={isDeleted}>
            Delete
          </Button>
          <Button
            icon={<CopyOutlined />}
            onClick={onDuplicate}
            disabled={isDeleted}>
            Duplicate
          </Button>
          <Button icon={<DownloadOutlined />} onClick={onExport}>
            Export
          </Button>
        </Space>
      </div>
    </div>
  ),
);
AdvisoryHeader.displayName = "AdvisoryHeader";

// ─────────────────────────────────────────────────────────────
// ADVISORY OVERVIEW
// Reads directly from Redux so it doesn't force tabItems to rebuild
// ─────────────────────────────────────────────────────────────

const AdvisoryOverview = React.memo(() => {
  const advisory = useSelector(selectCurrentAdvisoryDetail);

  const stats = useMemo(
    () => ({
      researchQuestions: advisory?.researchQuestions?.length || 0,
      answeredQuestions:
        advisory?.researchQuestions?.filter((q) => q.status === "answered")
          .length || 0,
      deliverables: advisory?.deliverables?.length || 0,
      delivered:
        advisory?.deliverables?.filter(
          (d) => d.status === "delivered" || d.status === "approved",
        ).length || 0,
      recommendations: advisory?.recommendations?.length || 0,
      keyFindings: advisory?.keyFindings?.length || 0,
    }),
    [advisory],
  );

  if (!advisory) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Advisory Details"
            className="shadow-sm border-gray-200"
            bodyStyle={{ padding: "24px" }}>
            <Descriptions
              column={2}
              className="[&_.ant-descriptions-item-label]:font-medium [&_.ant-descriptions-item-label]:text-gray-700">
              <Descriptions.Item label="Advisory Type">
                <div className="flex items-center gap-2">
                  <Tag color="blue" className="rounded-full">
                    {advisory.advisoryType?.replace(/_/g, " ")}
                  </Tag>
                  {advisory.otherAdvisoryType && (
                    <span className="text-gray-600">
                      ({advisory.otherAdvisoryType})
                    </span>
                  )}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <StatusBadge status={advisory.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Request Date">
                {advisory.requestDate
                  ? dayjs(advisory.requestDate).format("DD MMM YYYY")
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Target Delivery">
                {advisory.targetDeliveryDate ? (
                  dayjs(advisory.targetDeliveryDate).format("DD MMM YYYY")
                ) : (
                  <span className="text-gray-400">Not set</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Actual Delivery">
                {advisory.actualDeliveryDate ? (
                  dayjs(advisory.actualDeliveryDate).format("DD MMM YYYY")
                ) : (
                  <span className="text-gray-400">Not delivered</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Overall Risk">
                <RiskLevelBadge level={advisory.riskAssessment?.overallRisk} />
              </Descriptions.Item>
            </Descriptions>

            <div className="border-t border-gray-100 my-6" />

            <div className="space-y-4">
              <div>
                <Title level={5} className="!mb-2 text-gray-800">
                  Request Description
                </Title>
                <Paragraph className="text-gray-600 whitespace-pre-wrap">
                  {advisory.requestDescription || "No description provided"}
                </Paragraph>
              </div>
              {advisory.scope && (
                <div>
                  <Title level={5} className="!mb-2 text-gray-800">
                    Scope
                  </Title>
                  <Paragraph className="text-gray-600 whitespace-pre-wrap">
                    {advisory.scope}
                  </Paragraph>
                </div>
              )}
              {advisory.researchNotes && (
                <div>
                  <Title level={5} className="!mb-2 text-gray-800">
                    Research Notes
                  </Title>
                  <Paragraph className="text-gray-600 whitespace-pre-wrap">
                    {advisory.researchNotes}
                  </Paragraph>
                </div>
              )}
            </div>
          </Card>

          {(advisory.opinion?.summary || advisory.opinion?.conclusion) && (
            <Card
              title="Opinion & Conclusion"
              className="shadow-sm border-gray-200"
              bodyStyle={{ padding: "24px" }}>
              <div className="space-y-4">
                {advisory.opinion.summary && (
                  <div>
                    <Title level={5} className="!mb-2 text-gray-800">
                      Summary
                    </Title>
                    <Paragraph className="text-gray-600 whitespace-pre-wrap">
                      {advisory.opinion.summary}
                    </Paragraph>
                  </div>
                )}
                {advisory.opinion.conclusion && (
                  <div>
                    <Title level={5} className="!mb-2 text-gray-800">
                      Conclusion
                    </Title>
                    <Paragraph className="text-gray-600 whitespace-pre-wrap">
                      {advisory.opinion.conclusion}
                    </Paragraph>
                  </div>
                )}
                {advisory.opinion.confidence && (
                  <div className="flex items-center gap-2">
                    <Text className="font-medium text-gray-700">
                      Confidence Level:
                    </Text>
                    <RiskLevelBadge level={advisory.opinion.confidence} />
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">
          <Card
            title="Quick Stats"
            className="shadow-sm border-gray-200"
            bodyStyle={{ padding: "24px" }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <Statistic
                  title={
                    <span className="text-sm font-medium text-gray-600">
                      Research Questions
                    </span>
                  }
                  value={stats.researchQuestions}
                  suffix={`/ ${stats.answeredQuestions} answered`}
                  valueStyle={{ fontSize: "24px", color: "#1e40af" }}
                />
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <Statistic
                  title={
                    <span className="text-sm font-medium text-gray-600">
                      Deliverables
                    </span>
                  }
                  value={stats.deliverables}
                  suffix={`/ ${stats.delivered} delivered`}
                  valueStyle={{ fontSize: "24px", color: "#059669" }}
                />
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <Statistic
                  title={
                    <span className="text-sm font-medium text-gray-600">
                      Recommendations
                    </span>
                  }
                  value={stats.recommendations}
                  valueStyle={{ fontSize: "24px", color: "#7c3aed" }}
                />
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <Statistic
                  title={
                    <span className="text-sm font-medium text-gray-600">
                      Key Findings
                    </span>
                  }
                  value={stats.keyFindings}
                  valueStyle={{ fontSize: "24px", color: "#ea580c" }}
                />
              </div>
            </div>
          </Card>

          <Card
            title="Jurisdiction & Laws"
            className="shadow-sm border-gray-200"
            bodyStyle={{ padding: "24px" }}>
            <div className="space-y-4">
              {advisory.jurisdiction?.length > 0 && (
                <div>
                  <Text strong className="text-gray-700 block mb-2">
                    Jurisdiction
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {advisory.jurisdiction.map((j, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {j}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {advisory.applicableLaws?.length > 0 && (
                <div>
                  <Text strong className="text-gray-700 block mb-2">
                    Applicable Laws
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {advisory.applicableLaws.map((law, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {law}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {advisory.regulatoryBodies?.length > 0 && (
                <div>
                  <Text strong className="text-gray-700 block mb-2">
                    Regulatory Bodies
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {advisory.regulatoryBodies.map((body, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                        {body}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card
            title="Timeline"
            className="shadow-sm border-gray-200"
            bodyStyle={{ padding: "24px" }}>
            <div className="space-y-4">
              {[
                {
                  label: "Request Date",
                  value: advisory.requestDate,
                  fallback: "N/A",
                },
                {
                  label: "Target Delivery",
                  value: advisory.targetDeliveryDate,
                  fallback: "Not set",
                },
                {
                  label: "Actual Delivery",
                  value: advisory.actualDeliveryDate,
                  fallback: "Pending",
                },
              ].map(({ label, value, fallback }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className="text-sm font-medium">
                    {value ? (
                      dayjs(value).format("DD MMM YYYY")
                    ) : (
                      <span className="text-gray-400">{fallback}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
});
AdvisoryOverview.displayName = "AdvisoryOverview";

// ─────────────────────────────────────────────────────────────
// TAB CONFIG — USING YOUR EXACT PROP NAMES
// ─────────────────────────────────────────────────────────────

const buildTabItems = (advisoryId) => {
  // Guard against undefined advisoryId
  if (!advisoryId) {
    console.error("advisoryId is undefined in buildTabItems");
    return [];
  }

  return [
    {
      key: "overview",
      label: (
        <span className="flex items-center gap-2">
          <InfoCircleOutlined /> Overview
        </span>
      ),
      children: <AdvisoryOverview />,
    },
    {
      key: "research",
      label: (
        <span className="flex items-center gap-2">
          <SearchOutlined /> Research
        </span>
      ),
      children: (
        <Suspense fallback={<PanelLoadingFallback />}>
          <ResearchQuestionsPanel advisoryId={advisoryId} />
        </Suspense>
      ),
    },
    {
      key: "findings",
      label: (
        <span className="flex items-center gap-2">
          <BulbOutlined /> Findings
        </span>
      ),
      children: (
        <div className="p-4 text-gray-400 text-sm">
          Findings panel coming soon.
        </div>
      ),
    },
    {
      key: "deliverables",
      label: (
        <span className="flex items-center gap-2">
          <CheckSquareOutlined /> Deliverables
        </span>
      ),
      children: (
        <Suspense fallback={<PanelLoadingFallback />}>
          <DeliverablesPanel advisoryId={advisoryId} />
        </Suspense>
      ),
    },
    {
      key: "risk",
      label: (
        <span className="flex items-center gap-2">
          <AlertOutlined /> Risk
        </span>
      ),
      children: (
        <Suspense fallback={<PanelLoadingFallback />}>
          <RiskAssessmentPanel advisoryId={advisoryId} />
        </Suspense>
      ),
    },
    {
      key: "compliance",
      label: (
        <span className="flex items-center gap-2">
          <SafetyOutlined /> Compliance
        </span>
      ),
      children: (
        <Suspense fallback={<PanelLoadingFallback />}>
          <CompliancePanel advisoryId={advisoryId} />
        </Suspense>
      ),
    },
    {
      key: "documents",
      label: (
        <span className="flex items-center gap-2">
          <FileTextOutlined /> Documents
        </span>
      ),
      children: (
        <div className="p-4 text-gray-400 text-sm">
          Documents panel coming soon.
        </div>
      ),
    },
    {
      key: "activity",
      label: (
        <span className="flex items-center gap-2">
          <HistoryOutlined /> Activity
        </span>
      ),
      children: (
        <Suspense fallback={<PanelLoadingFallback />}>
          <ActivityLog advisoryId={advisoryId} />
        </Suspense>
      ),
    },
  ];
};

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

const AdvisoryDetailPage = () => {
  const { matterId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("overview");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const advisory = useSelector(selectCurrentAdvisoryDetail);
  const loading = useSelector(selectAdvisoryLoading("fetchDetails"));
  const error = useSelector(selectAdvisoryError("fetchDetails"));

  // Debug: Log advisoryId to verify it's coming from URL
  useEffect(() => {
    console.log("advisoryId (matterId) from URL:", matterId);
  }, [matterId]);

  useEffect(() => {
    if (matterId) {
      dispatch(fetchAdvisoryDetails(matterId));
    }
  }, [matterId, dispatch]);

  const handleDelete = useCallback(async () => {
    try {
      const result = await dispatch(
        deleteAdvisoryDetails({ matterId, deletionType: "soft" }),
      );
      if (result.meta.requestStatus === "fulfilled") {
        message.success("Advisory deleted successfully");
        navigate("/dashboard/matters/advisory");
      } else {
        message.error("Failed to delete advisory");
      }
    } catch {
      message.error("Failed to delete advisory");
    }
  }, [matterId, dispatch, navigate]);

  const handleDuplicate = useCallback(() => {
    message.info("Duplication feature coming soon");
  }, []);

  const handleExport = useCallback(() => {
    message.info("Export feature coming soon");
  }, []);

  // Memoize tabItems with matterId dependency - USING advisoryId prop name
  const tabItems = useMemo(() => {
    if (!matterId) return [];
    return buildTabItems(matterId);
  }, [matterId]);

  // Loading state
  if (loading && !advisory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" className="mb-4" />
          <div className="text-gray-600">Loading advisory details...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert
          type="error"
          message="Failed to load advisory"
          description={error}
          showIcon
          action={
            <Button onClick={() => dispatch(fetchAdvisoryDetails(matterId))}>
              Retry
            </Button>
          }
          className="max-w-2xl"
        />
      </div>
    );
  }

  // Not found state
  if (!advisory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert
          type="warning"
          message="Advisory not found"
          description="The advisory you're looking for doesn't exist or has been deleted."
          showIcon
          action={
            <Button
              type="primary"
              onClick={() => navigate("/dashboard/matters/advisory")}>
              Go Back
            </Button>
          }
          className="max-w-2xl"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Breadcrumb className="mb-6">
        <Breadcrumb.Item>
          <button
            onClick={() => navigate("/dashboard/matters/advisory")}
            className="text-blue-600 hover:text-blue-800 transition-colors">
            Advisory
          </button>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <span className="text-gray-700 font-medium">
            {advisory.matter?.title || "Advisory"}
          </span>
        </Breadcrumb.Item>
      </Breadcrumb>

      <AdvisoryHeader
        advisory={advisory}
        onEdit={() => navigate(`/dashboard/matters/advisory/${matterId}/edit`)}
        onDelete={() => setDeleteModalVisible(true)}
        onDuplicate={handleDuplicate}
        onExport={handleExport}
        isDeleted={advisory.isDeleted}
      />

      <Card className="shadow-sm border-gray-200" bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="large"
          className="px-6 pt-4"
          items={tabItems}
          destroyInactiveTabPane={false}
        />
      </Card>

      <DeleteConfirmModal
        visible={deleteModalVisible}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
        title="Delete Advisory"
        content="Are you sure you want to delete this advisory? This action cannot be undone."
      />
    </div>
  );
};

export default React.memo(AdvisoryDetailPage);
