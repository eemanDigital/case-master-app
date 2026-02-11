// ============================================================
// ADVISORY CONSTANTS
// ============================================================

// ── Advisory Types ────────────────────────────────────────────
export const ADVISORY_TYPES = {
  LEGAL_OPINION: "legal_opinion",
  REGULATORY_COMPLIANCE: "regulatory_compliance",
  DUE_DILIGENCE: "due_diligence",
  CONTRACT_REVIEW: "contract_review",
  POLICY_DEVELOPMENT: "policy_development",
  LEGAL_RESEARCH: "legal_research",
  RISK_ASSESSMENT: "risk_assessment",
  LITIGATION_RISK_ANALYSIS: "litigation_risk_analysis",
  REGULATORY_STRATEGY: "regulatory_strategy",
  TRANSACTION_ADVISORY: "transaction_advisory",
  OTHER: "other",
};

export const ADVISORY_TYPE_LABELS = {
  [ADVISORY_TYPES.LEGAL_OPINION]: "Legal Opinion",
  [ADVISORY_TYPES.REGULATORY_COMPLIANCE]: "Regulatory Compliance",
  [ADVISORY_TYPES.DUE_DILIGENCE]: "Due Diligence",
  [ADVISORY_TYPES.CONTRACT_REVIEW]: "Contract Review",
  [ADVISORY_TYPES.POLICY_DEVELOPMENT]: "Policy Development",
  [ADVISORY_TYPES.LEGAL_RESEARCH]: "Legal Research",
  [ADVISORY_TYPES.RISK_ASSESSMENT]: "Risk Assessment",
  [ADVISORY_TYPES.LITIGATION_RISK_ANALYSIS]: "Litigation Risk Analysis",
  [ADVISORY_TYPES.REGULATORY_STRATEGY]: "Regulatory Strategy",
  [ADVISORY_TYPES.TRANSACTION_ADVISORY]: "Transaction Advisory",
  [ADVISORY_TYPES.OTHER]: "Other",
};

export const ADVISORY_TYPE_OPTIONS = Object.entries(ADVISORY_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

// ── Matter / Advisory Status ──────────────────────────────────
export const ADVISORY_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const ADVISORY_STATUS_LABELS = {
  [ADVISORY_STATUS.PENDING]: "Pending",
  [ADVISORY_STATUS.ACTIVE]: "Active",
  [ADVISORY_STATUS.IN_PROGRESS]: "In Progress",
  [ADVISORY_STATUS.COMPLETED]: "Completed",
  [ADVISORY_STATUS.CANCELLED]: "Cancelled",
};

export const ADVISORY_STATUS_OPTIONS = Object.entries(
  ADVISORY_STATUS_LABELS,
).map(([value, label]) => ({ value, label }));

// ── Research Question Status ──────────────────────────────────
export const RESEARCH_QUESTION_STATUS = {
  PENDING: "pending",
  RESEARCHING: "researching",
  ANSWERED: "answered",
};

export const RESEARCH_QUESTION_STATUS_LABELS = {
  [RESEARCH_QUESTION_STATUS.PENDING]: "Pending",
  [RESEARCH_QUESTION_STATUS.RESEARCHING]: "Researching",
  [RESEARCH_QUESTION_STATUS.ANSWERED]: "Answered",
};

export const RESEARCH_QUESTION_STATUS_OPTIONS = Object.entries(
  RESEARCH_QUESTION_STATUS_LABELS,
).map(([value, label]) => ({ value, label }));

// ── Deliverable Types ─────────────────────────────────────────
export const DELIVERABLE_TYPES = {
  LEGAL_OPINION: "legal-opinion",
  MEMO: "memo",
  REPORT: "report",
  PRESENTATION: "presentation",
  OTHER: "other",
};

export const DELIVERABLE_TYPE_LABELS = {
  [DELIVERABLE_TYPES.LEGAL_OPINION]: "Legal Opinion",
  [DELIVERABLE_TYPES.MEMO]: "Memo",
  [DELIVERABLE_TYPES.REPORT]: "Report",
  [DELIVERABLE_TYPES.PRESENTATION]: "Presentation",
  [DELIVERABLE_TYPES.OTHER]: "Other",
};

export const DELIVERABLE_TYPE_OPTIONS = Object.entries(
  DELIVERABLE_TYPE_LABELS,
).map(([value, label]) => ({ value, label }));

// ── Deliverable Status ────────────────────────────────────────
export const DELIVERABLE_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in-progress",
  DELIVERED: "delivered",
  APPROVED: "approved",
};

export const DELIVERABLE_STATUS_LABELS = {
  [DELIVERABLE_STATUS.PENDING]: "Pending",
  [DELIVERABLE_STATUS.IN_PROGRESS]: "In Progress",
  [DELIVERABLE_STATUS.DELIVERED]: "Delivered",
  [DELIVERABLE_STATUS.APPROVED]: "Approved",
};

export const DELIVERABLE_STATUS_OPTIONS = Object.entries(
  DELIVERABLE_STATUS_LABELS,
).map(([value, label]) => ({ value, label }));

// ── Priority / Confidence / Risk Levels ───────────────────────
export const PRIORITY_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

export const PRIORITY_LEVEL_LABELS = {
  [PRIORITY_LEVELS.LOW]: "Low",
  [PRIORITY_LEVELS.MEDIUM]: "Medium",
  [PRIORITY_LEVELS.HIGH]: "High",
};

export const PRIORITY_LEVEL_OPTIONS = Object.entries(PRIORITY_LEVEL_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const OVERALL_RISK_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

export const OVERALL_RISK_LEVEL_LABELS = {
  [OVERALL_RISK_LEVELS.LOW]: "Low",
  [OVERALL_RISK_LEVELS.MEDIUM]: "Medium",
  [OVERALL_RISK_LEVELS.HIGH]: "High",
  [OVERALL_RISK_LEVELS.CRITICAL]: "Critical",
};

export const OVERALL_RISK_LEVEL_OPTIONS = Object.entries(
  OVERALL_RISK_LEVEL_LABELS,
).map(([value, label]) => ({ value, label }));

export const CONFIDENCE_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

export const CONFIDENCE_LEVEL_LABELS = {
  [CONFIDENCE_LEVELS.LOW]: "Low",
  [CONFIDENCE_LEVELS.MEDIUM]: "Medium",
  [CONFIDENCE_LEVELS.HIGH]: "High",
};

// ── Recommendation Implementation Status ─────────────────────
export const RECOMMENDATION_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in-progress",
  IMPLEMENTED: "implemented",
  REJECTED: "rejected",
};

export const RECOMMENDATION_STATUS_LABELS = {
  [RECOMMENDATION_STATUS.PENDING]: "Pending",
  [RECOMMENDATION_STATUS.IN_PROGRESS]: "In Progress",
  [RECOMMENDATION_STATUS.IMPLEMENTED]: "Implemented",
  [RECOMMENDATION_STATUS.REJECTED]: "Rejected",
};

export const RECOMMENDATION_STATUS_OPTIONS = Object.entries(
  RECOMMENDATION_STATUS_LABELS,
).map(([value, label]) => ({ value, label }));

// ── Compliance Status ─────────────────────────────────────────
export const COMPLIANCE_STATUS = {
  COMPLIANT: "compliant",
  NON_COMPLIANT: "non-compliant",
  PARTIALLY_COMPLIANT: "partially-compliant",
  NOT_APPLICABLE: "not-applicable",
};

export const COMPLIANCE_STATUS_LABELS = {
  [COMPLIANCE_STATUS.COMPLIANT]: "Compliant",
  [COMPLIANCE_STATUS.NON_COMPLIANT]: "Non-Compliant",
  [COMPLIANCE_STATUS.PARTIALLY_COMPLIANT]: "Partially Compliant",
  [COMPLIANCE_STATUS.NOT_APPLICABLE]: "Not Applicable",
};

export const COMPLIANCE_STATUS_OPTIONS = Object.entries(
  COMPLIANCE_STATUS_LABELS,
).map(([value, label]) => ({ value, label }));

// ── API Route Segments ────────────────────────────────────────
export const ADVISORY_BASE_ROUTE = "/advisory";

export const ADVISORY_ROUTES = {
  LIST: ADVISORY_BASE_ROUTE,
  SEARCH: `${ADVISORY_BASE_ROUTE}/search`,
  STATS: `${ADVISORY_BASE_ROUTE}/stats`,
  BULK_UPDATE: `${ADVISORY_BASE_ROUTE}/bulk-update`,
  DETAILS: (matterId) => `${ADVISORY_BASE_ROUTE}/${matterId}/details`,
  RESTORE: (matterId) => `${ADVISORY_BASE_ROUTE}/${matterId}/details/restore`,
  COMPLETE: (matterId) => `${ADVISORY_BASE_ROUTE}/${matterId}/complete`,
  RESEARCH_QUESTIONS: (matterId) =>
    `${ADVISORY_BASE_ROUTE}/${matterId}/research-questions`,
  RESEARCH_QUESTION: (matterId, questionId) =>
    `${ADVISORY_BASE_ROUTE}/${matterId}/research-questions/${questionId}`,
  KEY_FINDINGS: (matterId) => `${ADVISORY_BASE_ROUTE}/${matterId}/key-findings`,
  KEY_FINDING: (matterId, findingId) =>
    `${ADVISORY_BASE_ROUTE}/${matterId}/key-findings/${findingId}`,
  OPINION: (matterId) => `${ADVISORY_BASE_ROUTE}/${matterId}/opinion`,
  RECOMMENDATIONS: (matterId) =>
    `${ADVISORY_BASE_ROUTE}/${matterId}/recommendations`,
  RECOMMENDATION: (matterId, recommendationId) =>
    `${ADVISORY_BASE_ROUTE}/${matterId}/recommendations/${recommendationId}`,
  DELIVERABLES: (matterId) => `${ADVISORY_BASE_ROUTE}/${matterId}/deliverables`,
  DELIVERABLE: (matterId, deliverableId) =>
    `${ADVISORY_BASE_ROUTE}/${matterId}/deliverables/${deliverableId}`,
};

// ── Redux Slice Keys ──────────────────────────────────────────
export const ADVISORY_SLICE_NAME = "advisory";

export const ADVISORY_LOADING_KEYS = {
  FETCH_ALL: "fetchAll",
  FETCH_DETAILS: "fetchDetails",
  CREATE_DETAILS: "createDetails",
  UPDATE_DETAILS: "updateDetails",
  DELETE_DETAILS: "deleteDetails",
  RESTORE_DETAILS: "restoreDetails",
  FETCH_STATS: "fetchStats",
  COMPLETE: "complete",
  BULK_UPDATE: "bulkUpdate",
  SEARCH: "search",
  RESEARCH_QUESTION: "researchQuestion",
  KEY_FINDING: "keyFinding",
  OPINION: "opinion",
  RECOMMENDATION: "recommendation",
  DELIVERABLE: "deliverable",
};

// ── Pagination Defaults ───────────────────────────────────────
export const ADVISORY_PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 50,
  SORT: "-dateOpened",
};

// ── Field Length Constraints (mirrors schema maxlength) ───────
export const ADVISORY_FIELD_LIMITS = {
  REQUEST_DESCRIPTION: 5000,
  SCOPE: 5000,
  RESEARCH_NOTES: 10000,
  OPINION_SUMMARY: 5000,
  CONCLUSION: 2000,
};
