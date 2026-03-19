import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Space,
  Spin,
  Tabs,
  message,
  Tooltip,
  Badge,
  Tag,
} from "antd";
import {
  SaveOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  GlobalOutlined,
  SearchOutlined,
  BulbOutlined,
  CheckSquareOutlined,
  SafetyOutlined,
  AlertOutlined,
  CalendarOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { debounce } from "lodash";

// Components
import TagInput from "./TagInput";
import ResearchQuestionsList from "./ResearchQuestionsList";
import DynamicList from "./DynamicList";
import MatterContextCard from "../common/MatterContextCard";

// Constants — single source of truth
import {
  ADVISORY_TYPE_OPTIONS,
  DELIVERABLE_TYPE_OPTIONS,
  DELIVERABLE_STATUS_OPTIONS,
  PRIORITY_LEVEL_OPTIONS,
  OVERALL_RISK_LEVEL_OPTIONS,
  CONFIDENCE_LEVEL_LABELS,
  RECOMMENDATION_STATUS_OPTIONS,
  COMPLIANCE_STATUS_OPTIONS,
  RESEARCH_QUESTION_STATUS_OPTIONS,
  ADVISORY_FIELD_LIMITS,
} from "../../utils/advisoryConstants";

const { Title, Text } = Typography;
const { TextArea } = Input;

// ============================================================
// FIELD CONFIGURATIONS — keys aligned to Mongoose schema
// ============================================================

const FINDINGS_FIELDS = [
  {
    key: "finding",
    label: "Finding",
    type: "text",
    span: 24,
    required: true,
    placeholder: "Enter key finding",
  },
  {
    key: "source",
    label: "Source",
    type: "text",
    span: 12,
    placeholder: "Source reference",
    emptyText: "No source specified",
  },
  {
    key: "relevance",
    label: "Relevance",
    type: "text",
    span: 12,
    placeholder: "Relevance to matter",
  },
];

// Schema: { caseName, citation, summary, relevance } — not the same as FINDINGS_FIELDS
const PRECEDENTS_FIELDS = [
  {
    key: "caseName",
    label: "Case Name",
    type: "text",
    span: 24,
    required: true,
    placeholder: "e.g., Donoghue v Stevenson [1932] AC 562",
  },
  {
    key: "citation",
    label: "Citation",
    type: "text",
    span: 12,
    placeholder: "Full citation reference",
    emptyText: "No citation specified",
  },
  {
    key: "summary",
    label: "Summary",
    type: "textarea",
    span: 24,
    rows: 2,
    placeholder: "Brief summary of the precedent",
  },
  {
    key: "relevance",
    label: "Relevance",
    type: "text",
    span: 12,
    placeholder: "Relevance to this matter",
  },
];

const DELIVERABLES_FIELDS = [
  {
    key: "title",
    label: "Title",
    type: "text",
    span: 24,
    required: true,
    placeholder: "Deliverable title",
  },
  {
    key: "type",
    label: "Type",
    type: "select",
    span: 12,
    options: DELIVERABLE_TYPE_OPTIONS,
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    span: 12,
    options: DELIVERABLE_STATUS_OPTIONS,
    getColor: (status) => {
      const colors = {
        approved: "success",
        delivered: "blue",
        "in-progress": "processing",
        pending: "default",
      };
      return colors[status] || "default";
    },
  },
  {
    key: "dueDate",
    label: "Due Date",
    type: "date",
    span: 12,
  },
  {
    key: "deliveryDate",
    label: "Delivery Date",
    type: "date",
    span: 12,
    disabled: (item) => item.status === "pending",
  },
];

const RECOMMENDATIONS_FIELDS = [
  {
    key: "recommendation",
    label: "Recommendation",
    type: "textarea",
    span: 24,
    rows: 3,
    required: true,
    placeholder: "Enter recommendation",
  },
  {
    key: "priority",
    label: "Priority",
    type: "select",
    span: 8,
    options: PRIORITY_LEVEL_OPTIONS,
    getColor: (priority) => {
      const colors = { high: "red", medium: "orange", low: "green" };
      return colors[priority] || "default";
    },
  },
  // Schema field: implementationStatus (was missing from original form)
  {
    key: "implementationStatus",
    label: "Implementation Status",
    type: "select",
    span: 8,
    options: RECOMMENDATION_STATUS_OPTIONS,
    getColor: (status) => {
      const colors = {
        implemented: "success",
        "in-progress": "processing",
        rejected: "error",
        pending: "default",
      };
      return colors[status] || "default";
    },
  },
  {
    key: "timeline",
    label: "Timeline",
    type: "text",
    span: 8,
    placeholder: "e.g., Immediate, 30 days",
  },
];

// Schema compliance checklist: { requirement, status, notes, dueDate }
// status enum: compliant | non-compliant | partially-compliant | not-applicable
const COMPLIANCE_FIELDS = [
  {
    key: "requirement",
    label: "Requirement",
    type: "text",
    span: 24,
    required: true,
    placeholder: "Compliance requirement",
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    span: 8,
    // Uses COMPLIANCE_STATUS_OPTIONS — matches schema enum exactly
    options: COMPLIANCE_STATUS_OPTIONS,
    getColor: (status) => {
      const colors = {
        compliant: "success",
        "non-compliant": "error",
        "partially-compliant": "warning",
        "not-applicable": "default",
      };
      return colors[status] || "default";
    },
  },
  {
    key: "dueDate",
    label: "Due Date",
    type: "date",
    span: 8,
  },
  // Schema field: notes (was missing from original form)
  {
    key: "notes",
    label: "Notes",
    type: "text",
    span: 8,
    placeholder: "Additional notes",
  },
];

// Schema risk item key is "risk", not "riskItem"
const RISK_FIELDS = [
  {
    key: "risk", // ← fixed: was "riskItem", schema uses "risk"
    label: "Risk Item",
    type: "text",
    span: 24,
    required: true,
    placeholder: "Describe the risk",
  },
  {
    key: "likelihood",
    label: "Likelihood",
    type: "select",
    span: 8,
    options: PRIORITY_LEVEL_OPTIONS, // low | medium | high
  },
  {
    key: "impact",
    label: "Impact",
    type: "select",
    span: 8,
    options: PRIORITY_LEVEL_OPTIONS, // low | medium | high
  },
  {
    key: "mitigation",
    label: "Mitigation",
    type: "text",
    span: 8,
    placeholder: "Mitigation strategy",
  },
];

// ============================================================
// DEFAULT ITEMS — keys aligned to schema
// ============================================================

const DEFAULT_FINDING = { finding: "", source: "", relevance: "" };
const DEFAULT_PRECEDENT = {
  caseName: "",
  citation: "",
  summary: "",
  relevance: "",
};
const DEFAULT_DELIVERABLE = {
  title: "",
  type: "legal-opinion",
  status: "pending",
  dueDate: null,
  deliveryDate: null,
};
const DEFAULT_RECOMMENDATION = {
  recommendation: "",
  priority: "medium",
  implementationStatus: "pending",
  timeline: "",
};
const DEFAULT_COMPLIANCE = {
  requirement: "",
  status: "compliant",
  notes: "",
  dueDate: null,
};
const DEFAULT_RISK = {
  risk: "",
  likelihood: "medium",
  impact: "medium",
  mitigation: "",
};

// ============================================================
// CONFIDENCE OPTIONS — derived from constants
// ============================================================
const CONFIDENCE_OPTIONS = Object.entries(CONFIDENCE_LEVEL_LABELS).map(
  ([value, label]) => ({ value, label }),
);

// ============================================================
// MAIN COMPONENT
// ============================================================

const AdvisoryDetailForm = ({
  initialData = null,
  onSubmit,
  loading = false,
  mode = "create",
  matterId,
  firmId,
  matterData,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("basic");
  const [advisoryType, setAdvisoryType] = useState(
    initialData?.advisoryType || "legal_opinion",
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const debouncedSubmitRef = useRef(
    debounce((transformedValues) => {
      onSubmit(transformedValues);
    }, 500),
  );

  // Initialise form with existing data
  useEffect(() => {
    if (initialData) {
      const formattedData = {
        ...initialData,
        requestDate: initialData.requestDate
          ? dayjs(initialData.requestDate)
          : dayjs(),
        targetDeliveryDate: initialData.targetDeliveryDate
          ? dayjs(initialData.targetDeliveryDate)
          : null,
        actualDeliveryDate: initialData.actualDeliveryDate
          ? dayjs(initialData.actualDeliveryDate)
          : null,
        researchQuestions: initialData.researchQuestions || [],
        keyFindings: initialData.keyFindings || [],
        legalPrecedents: initialData.legalPrecedents || [],
        deliverables: initialData.deliverables || [],
        complianceChecklist: initialData.complianceChecklist || [],
        recommendations: initialData.recommendations || [],
        jurisdiction: initialData.jurisdiction || [],
        applicableLaws: initialData.applicableLaws || [],
        regulatoryBodies: initialData.regulatoryBodies || [],
      };
      form.setFieldsValue(formattedData);
      setAdvisoryType(initialData.advisoryType);
    }
  }, [initialData, form]);

  const handleFormChange = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      // Validate visible fields first (shows inline errors on the current tab)
      await form.validateFields();

      // getFieldsValue(true) collects ALL registered values including
      // fields on unmounted tabs — critical for the tab-conditional render pattern
      const values = form.getFieldsValue(true);

      const transformedValues = {
        ...values,
        requestDate:
          values.requestDate?.toISOString() || new Date().toISOString(),
        targetDeliveryDate: values.targetDeliveryDate?.toISOString() || null,
        actualDeliveryDate: values.actualDeliveryDate?.toISOString() || null,
        matterId,
        firmId,
      };

      // Serialise date objects inside arrays
      if (transformedValues.deliverables?.length) {
        transformedValues.deliverables = transformedValues.deliverables.map(
          (d) => ({
            ...d,
            dueDate: d.dueDate || null,
            deliveryDate: d.deliveryDate || null,
          }),
        );
      }

      if (transformedValues.complianceChecklist?.length) {
        transformedValues.complianceChecklist =
          transformedValues.complianceChecklist.map((c) => ({
            ...c,
            dueDate: c.dueDate || null,
          }));
      }

      debouncedSubmitRef.current(transformedValues);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Validation failed:", error);
      message.error("Please fix the errors in the form");
    }
  }, [form, matterId, firmId]);

  const handleAdvisoryTypeChange = useCallback(
    (value) => {
      setAdvisoryType(value);
      form.setFieldValue("advisoryType", value);
      setHasUnsavedChanges(true);
    },
    [form],
  );

  // Tab item counts shown in badges
  const getTabBadge = useCallback(
    (tabKey) => {
      const fields = form.getFieldsValue(true);
      switch (tabKey) {
        case "research":
          return fields.researchQuestions?.length || 0;
        case "analysis":
          return (
            (fields.keyFindings?.length || 0) +
            (fields.legalPrecedents?.length || 0)
          );
        case "deliverables":
          return fields.deliverables?.length || 0;
        case "compliance":
          return fields.complianceChecklist?.length || 0;
        case "risk":
          return fields.riskAssessment?.risks?.length || 0;
        default:
          return 0;
      }
    },
    [form],
  );

  const tabItems = useMemo(
    () => [
      {
        key: "basic",
        label: (
          <span>
            <FileTextOutlined /> Basic Info
          </span>
        ),
      },
      {
        key: "research",
        label: (
          <Badge count={getTabBadge("research")} offset={[10, 0]}>
            <span>
              <SearchOutlined /> Research
            </span>
          </Badge>
        ),
      },
      {
        key: "analysis",
        label: (
          <Badge count={getTabBadge("analysis")} offset={[10, 0]}>
            <span>
              <BulbOutlined /> Analysis
            </span>
          </Badge>
        ),
      },
      {
        key: "deliverables",
        label: (
          <Badge count={getTabBadge("deliverables")} offset={[10, 0]}>
            <span>
              <CheckSquareOutlined /> Deliverables
            </span>
          </Badge>
        ),
      },
      {
        key: "compliance",
        label: (
          <Badge count={getTabBadge("compliance")} offset={[10, 0]}>
            <span>
              <SafetyOutlined /> Compliance
            </span>
          </Badge>
        ),
      },
      {
        key: "risk",
        label: (
          <Badge count={getTabBadge("risk")} offset={[10, 0]}>
            <span>
              <AlertOutlined /> Risk
            </span>
          </Badge>
        ),
      },
    ],
    [getTabBadge],
  );

  return (
    <div className="advisory-detail-form" style={{ padding: "24px" }}>
      <Spin spinning={loading}>
        {matterData && <MatterContextCard matter={matterData} />}
        <Form
          form={form}
          layout="vertical"
          size="large"
          preserve={true}
          onValuesChange={handleFormChange}
          initialValues={{
            advisoryType: "legal_opinion",
            requestDate: dayjs(),
            researchQuestions: [],
            keyFindings: [],
            legalPrecedents: [],
            deliverables: [],
            jurisdiction: [],
            applicableLaws: [],
            regulatoryBodies: [],
            complianceChecklist: [],
            recommendations: [],
            opinion: { confidence: "medium" },
            riskAssessment: { overallRisk: "medium", risks: [] },
          }}>
          <Card
            style={{
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
            title={
              <Space>
                <Title level={3} style={{ margin: 0 }}>
                  {mode === "create" ? "Create Advisory" : "Edit Advisory"}
                </Title>
                {hasUnsavedChanges && <Tag color="orange">Unsaved Changes</Tag>}
              </Space>
            }
            extra={
              <Space>
                <Button
                  icon={<LeftOutlined />}
                  onClick={() => {
                    if (
                      !hasUnsavedChanges ||
                      window.confirm("You have unsaved changes. Are you sure?")
                    ) {
                      window.history.back();
                    }
                  }}>
                  Back
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSubmit}
                  loading={loading}
                  size="large">
                  {mode === "create" ? "Create" : "Save"}
                </Button>
              </Space>
            }>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              type="card"
              size="large"
              style={{ marginTop: "16px" }}
            />

            <div style={{ padding: "24px 0" }}>
              {/* ── BASIC INFO ─────────────────────────────────────────── */}
              {activeTab === "basic" && (
                <>
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="advisoryType"
                        label="Advisory Type"
                        rules={[
                          {
                            required: true,
                            message: "Please select advisory type",
                          },
                        ]}>
                        <Select
                          placeholder="Select advisory type"
                          options={ADVISORY_TYPE_OPTIONS}
                          onChange={handleAdvisoryTypeChange}
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                    {advisoryType === "other" && (
                      <Col xs={24} md={12}>
                        <Form.Item
                          name="otherAdvisoryType"
                          label="Specify Advisory Type"
                          rules={[
                            { required: true, message: "Please specify" },
                          ]}>
                          <Input
                            placeholder="Describe the advisory type"
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                    )}
                  </Row>

                  <Form.Item
                    name="requestDescription"
                    label={
                      <span>
                        Request Description{" "}
                        <Tooltip title="Detailed description of what is being requested">
                          <InfoCircleOutlined />
                        </Tooltip>
                      </span>
                    }
                    rules={[
                      { required: true, message: "Description is required" },
                    ]}>
                    <TextArea
                      rows={4}
                      placeholder="Describe the advisory request..."
                      showCount
                      maxLength={ADVISORY_FIELD_LIMITS.REQUEST_DESCRIPTION}
                    />
                  </Form.Item>

                  <Form.Item name="scope" label="Scope">
                    <TextArea
                      rows={3}
                      placeholder="Define scope and boundaries..."
                      showCount
                      maxLength={ADVISORY_FIELD_LIMITS.SCOPE}
                    />
                  </Form.Item>

                  <Divider orientation="left">
                    <GlobalOutlined /> Jurisdiction &amp; Applicable Law
                  </Divider>

                  <Row gutter={24}>
                    <Col xs={24} md={8}>
                      <Form.Item name="jurisdiction" label="Jurisdiction(s)">
                        <TagInput placeholder="Add jurisdiction" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name="applicableLaws" label="Applicable Laws">
                        <TagInput placeholder="Add law" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        name="regulatoryBodies"
                        label="Regulatory Bodies">
                        <TagInput placeholder="Add body" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider orientation="left">
                    <CalendarOutlined /> Timeline
                  </Divider>

                  <Row gutter={24}>
                    <Col xs={24} md={8}>
                      <Form.Item
                        name="requestDate"
                        label="Request Date"
                        rules={[{ required: true }]}>
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        name="targetDeliveryDate"
                        label="Target Delivery">
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        name="actualDeliveryDate"
                        label="Actual Delivery">
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )}

              {/* ── RESEARCH ───────────────────────────────────────────── */}
              {activeTab === "research" && (
                <>
                  <Form.Item name="researchNotes" label="Research Notes">
                    <TextArea
                      rows={6}
                      placeholder="Research notes, sources, methodology..."
                      showCount
                      maxLength={ADVISORY_FIELD_LIMITS.RESEARCH_NOTES}
                    />
                  </Form.Item>

                  <Divider orientation="left">Research Questions</Divider>
                  <Form.Item name="researchQuestions">
                    <ResearchQuestionsList
                      statusOptions={RESEARCH_QUESTION_STATUS_OPTIONS}
                    />
                  </Form.Item>
                </>
              )}

              {/* ── ANALYSIS ───────────────────────────────────────────── */}
              {activeTab === "analysis" && (
                <>
                  <Divider orientation="left">Key Findings</Divider>
                  <Form.Item name="keyFindings">
                    <DynamicList
                      fields={FINDINGS_FIELDS}
                      defaultItem={DEFAULT_FINDING}
                      addButtonText="Add Finding"
                    />
                  </Form.Item>

                  <Divider orientation="left">Legal Precedents</Divider>
                  {/* Uses PRECEDENTS_FIELDS — keys match schema: caseName/citation/summary/relevance */}
                  <Form.Item name="legalPrecedents">
                    <DynamicList
                      fields={PRECEDENTS_FIELDS}
                      defaultItem={DEFAULT_PRECEDENT}
                      addButtonText="Add Precedent"
                    />
                  </Form.Item>

                  <Divider orientation="left">Opinion</Divider>
                  <Row gutter={24}>
                    <Col span={24}>
                      <Form.Item name={["opinion", "summary"]} label="Summary">
                        <TextArea
                          rows={3}
                          maxLength={ADVISORY_FIELD_LIMITS.OPINION_SUMMARY}
                          showCount
                        />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name={["opinion", "conclusion"]}
                        label="Conclusion">
                        <TextArea
                          rows={2}
                          maxLength={ADVISORY_FIELD_LIMITS.CONCLUSION}
                          showCount
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name={["opinion", "confidence"]}
                        label="Confidence">
                        <Select options={CONFIDENCE_OPTIONS} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider orientation="left">Recommendations</Divider>
                  <Form.Item name="recommendations">
                    <DynamicList
                      fields={RECOMMENDATIONS_FIELDS}
                      defaultItem={DEFAULT_RECOMMENDATION}
                      addButtonText="Add Recommendation"
                    />
                  </Form.Item>
                </>
              )}

              {/* ── DELIVERABLES ───────────────────────────────────────── */}
              {activeTab === "deliverables" && (
                <Form.Item name="deliverables">
                  <DynamicList
                    fields={DELIVERABLES_FIELDS}
                    defaultItem={DEFAULT_DELIVERABLE}
                    addButtonText="Add Deliverable"
                  />
                </Form.Item>
              )}

              {/* ── COMPLIANCE ─────────────────────────────────────────── */}
              {activeTab === "compliance" && (
                <Form.Item name="complianceChecklist">
                  <DynamicList
                    fields={COMPLIANCE_FIELDS}
                    defaultItem={DEFAULT_COMPLIANCE}
                    addButtonText="Add Compliance Item"
                  />
                </Form.Item>
              )}

              {/* ── RISK ───────────────────────────────────────────────── */}
              {activeTab === "risk" && (
                <>
                  <Row gutter={24}>
                    <Col span={8}>
                      <Form.Item
                        name={["riskAssessment", "overallRisk"]}
                        label="Overall Risk Level">
                        <Select
                          size="large"
                          options={OVERALL_RISK_LEVEL_OPTIONS}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider orientation="left">Risk Items</Divider>
                  {/* "risk" key in RISK_FIELDS matches schema field name */}
                  <Form.Item name={["riskAssessment", "risks"]}>
                    <DynamicList
                      fields={RISK_FIELDS}
                      defaultItem={DEFAULT_RISK}
                      addButtonText="Add Risk"
                    />
                  </Form.Item>
                </>
              )}
            </div>
          </Card>
        </Form>
      </Spin>
    </div>
  );
};

export default React.memo(AdvisoryDetailForm);
