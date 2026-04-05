// ============================================================
// ADVISORY SERVICE - UPDATED
// Thin API-call wrappers. All business logic lives in the slice.
// ============================================================

import apiService from "../../../services/api";
import {
  ADVISORY_ROUTES,
  ADVISORY_PAGINATION_DEFAULTS,
} from "../../../utils/advisoryConstants";

// ── Advisory Matters ──────────────────────────────────────────

/**
 * Fetch all advisory matters with optional filters.
 * @param {Object} params - Pagination / filter query params
 */
const getAllAdvisoryMatters = ({
  page = ADVISORY_PAGINATION_DEFAULTS.PAGE,
  limit = ADVISORY_PAGINATION_DEFAULTS.LIMIT,
  sort = ADVISORY_PAGINATION_DEFAULTS.SORT,
  status,
  advisoryType,
  industry,
  search,
  includeDeleted,
  onlyDeleted,
  populate,
  select,
  includeStats,
} = {}) => {
  const params = {
    page,
    limit,
    sort,
    ...(status && { status }),
    ...(advisoryType && { advisoryType }),
    ...(industry && { industry }),
    ...(search && { search }),
    ...(includeDeleted && { includeDeleted }),
    ...(onlyDeleted && { onlyDeleted }),
    ...(populate && { populate }),
    ...(select && { select }),
    ...(includeStats && { includeStats }),
  };

  return apiService.get(ADVISORY_ROUTES.LIST, { params });
};

/**
 * Advanced advisory search via POST body.
 * @param {Object} criteria - MongoDB-style match criteria
 * @param {Object} options  - Sort / pagination options
 */
const searchAdvisoryMatters = (criteria = {}, options = {}) =>
  apiService.post(ADVISORY_ROUTES.SEARCH, { criteria, options });

/**
 * Fetch aggregate dashboard stats for advisory matters.
 */
const getAdvisoryStats = () => apiService.get(ADVISORY_ROUTES.STATS);

// ── Advisory Details CRUD ─────────────────────────────────────

/**
 * Fetch advisory details for a specific matter.
 * @param {string} matterId
 */
const getAdvisoryDetails = (matterId) =>
  apiService.get(ADVISORY_ROUTES.DETAILS(matterId));

/**
 * Create advisory details for a matter.
 * @param {string} matterId
 * @param {Object} data - AdvisoryDetail fields
 */
const createAdvisoryDetails = (matterId, data) =>
  apiService.post(ADVISORY_ROUTES.DETAILS(matterId), data);

/**
 * Partially update advisory details.
 * @param {string} matterId
 * @param {Object} data - Fields to update
 */
const updateAdvisoryDetails = (matterId, data) =>
  apiService.patch(ADVISORY_ROUTES.DETAILS(matterId), data);

/**
 * Delete advisory details (soft or hard).
 * @param {string} matterId
 * @param {string} deletionType - 'soft' or 'hard'
 */
const deleteAdvisoryDetails = (matterId, deletionType = "soft") => {
  const params = { deletionType };
  return apiService.delete(ADVISORY_ROUTES.DETAILS(matterId), { params });
};

/**
 * Restore soft-deleted advisory details.
 * @param {string} matterId
 */
const restoreAdvisoryDetails = (matterId) =>
  apiService.patch(ADVISORY_ROUTES.RESTORE(matterId));

// ── Service Completion ────────────────────────────────────────

/**
 * Mark an advisory matter as completed.
 * @param {string} matterId
 * @param {{ completionDate?: string, finalOpinion?: Object }} data
 */
const completeAdvisory = (matterId, data = {}) =>
  apiService.post(ADVISORY_ROUTES.COMPLETE(matterId), data);

// ── Research Questions ────────────────────────────────────────

/**
 * Add a research question to an advisory.
 * @param {string} matterId
 * @param {{ question: string, status?: string }} data
 */
const addResearchQuestion = (matterId, data) =>
  apiService.post(ADVISORY_ROUTES.RESEARCH_QUESTIONS(matterId), data);

/**
 * Update a specific research question.
 * @param {string} matterId
 * @param {string} questionId
 * @param {Object} data
 */
const updateResearchQuestion = (matterId, questionId, data) =>
  apiService.patch(
    ADVISORY_ROUTES.RESEARCH_QUESTION(matterId, questionId),
    data,
  );

/**
 * Delete a specific research question.
 * @param {string} matterId
 * @param {string} questionId
 */
const deleteResearchQuestion = (matterId, questionId) =>
  apiService.delete(ADVISORY_ROUTES.RESEARCH_QUESTION(matterId, questionId));

// ── Key Findings ──────────────────────────────────────────────

/**
 * Add a key finding.
 * @param {string} matterId
 * @param {{ finding: string, source?: string, relevance?: string }} data
 */
const addKeyFinding = (matterId, data) =>
  apiService.post(ADVISORY_ROUTES.KEY_FINDINGS(matterId), data);

/**
 * Update a specific key finding.
 * @param {string} matterId
 * @param {string} findingId
 * @param {Object} data
 */
const updateKeyFinding = (matterId, findingId, data) =>
  apiService.patch(ADVISORY_ROUTES.KEY_FINDING(matterId, findingId), data);

/**
 * Delete a specific key finding.
 * @param {string} matterId
 * @param {string} findingId
 */
const deleteKeyFinding = (matterId, findingId) =>
  apiService.delete(ADVISORY_ROUTES.KEY_FINDING(matterId, findingId));

// ── Opinion ───────────────────────────────────────────────────

/**
 * Update the opinion on an advisory.
 * @param {string} matterId
 * @param {{ summary?: string, conclusion?: string, confidence?: string }} data
 */
const updateOpinion = (matterId, data) =>
  apiService.patch(ADVISORY_ROUTES.OPINION(matterId), data);

// ── Recommendations ───────────────────────────────────────────

/**
 * Add a recommendation.
 * @param {string} matterId
 * @param {{ recommendation: string, priority?: string, implementationStatus?: string }} data
 */
const addRecommendation = (matterId, data) =>
  apiService.post(ADVISORY_ROUTES.RECOMMENDATIONS(matterId), data);

/**
 * Update a specific recommendation.
 * @param {string} matterId
 * @param {string} recommendationId
 * @param {Object} data
 */
const updateRecommendation = (matterId, recommendationId, data) =>
  apiService.patch(
    ADVISORY_ROUTES.RECOMMENDATION(matterId, recommendationId),
    data,
  );

/**
 * Delete a specific recommendation.
 * @param {string} matterId
 * @param {string} recommendationId
 */
const deleteRecommendation = (matterId, recommendationId) =>
  apiService.delete(ADVISORY_ROUTES.RECOMMENDATION(matterId, recommendationId));

// ── Deliverables ──────────────────────────────────────────────

/**
 * Add a deliverable to an advisory.
 * @param {string} matterId
 * @param {{ title: string, type?: string, dueDate?: string, status?: string }} data
 */
const addDeliverable = (matterId, data) =>
  apiService.post(ADVISORY_ROUTES.DELIVERABLES(matterId), data);

/**
 * Update a specific deliverable.
 * @param {string} matterId
 * @param {string} deliverableId
 * @param {Object} data
 */
const updateDeliverable = (matterId, deliverableId, data) =>
  apiService.patch(
    ADVISORY_ROUTES.DELIVERABLE(matterId, deliverableId),
    data,
  );

/**
 * Delete a specific deliverable.
 * @param {string} matterId
 * @param {string} deliverableId
 */
const deleteDeliverable = (matterId, deliverableId) =>
  apiService.delete(ADVISORY_ROUTES.DELIVERABLE(matterId, deliverableId));

// ── Compliance Checklist ──────────────────────────────────────

/**
 * Add a compliance item.
 * @param {string} matterId
 * @param {{ requirement: string, status?: string, dueDate?: string, notes?: string }} data
 */
const addComplianceItem = (matterId, data) =>
  apiService.post(`/api/advisory-matters/${matterId}/compliance`, data);

/**
 * Update a specific compliance item.
 * @param {string} matterId
 * @param {string} itemId
 * @param {Object} data
 */
const updateComplianceItem = (matterId, itemId, data) =>
  apiService.patch(`/api/advisory-matters/${matterId}/compliance/${itemId}`, data);

/**
 * Delete a specific compliance item.
 * @param {string} matterId
 * @param {string} itemId
 */
const deleteComplianceItem = (matterId, itemId) =>
  apiService.delete(`/api/advisory-matters/${matterId}/compliance/${itemId}`);

// ── Risk Assessment ──────────────────────────────────────────

/**
 * Update risk assessment.
 * @param {string} matterId
 * @param {{ overallRisk?: string, risks?: Array }} data
 */
const updateRiskAssessment = (matterId, data) =>
  apiService.patch(`/api/advisory-matters/${matterId}/risk-assessment`, data);

/**
 * Add a risk item.
 * @param {string} matterId
 * @param {{ risk: string, likelihood?: string, impact?: string, mitigation?: string }} data
 */
const addRiskItem = (matterId, data) =>
  apiService.post(`/api/advisory-matters/${matterId}/risk-items`, data);

/**
 * Update a specific risk item.
 * @param {string} matterId
 * @param {string} riskId
 * @param {Object} data
 */
const updateRiskItem = (matterId, riskId, data) =>
  apiService.patch(`/api/advisory-matters/${matterId}/risk-items/${riskId}`, data);

/**
 * Delete a specific risk item.
 * @param {string} matterId
 * @param {string} riskId
 */
const deleteRiskItem = (matterId, riskId) =>
  apiService.delete(`/api/advisory-matters/${matterId}/risk-items/${riskId}`);

// ── Bulk Operations ───────────────────────────────────────────

/**
 * Bulk-update multiple advisory matters.
 * @param {string[]} matterIds
 * @param {Object}   updates - Fields to apply to all matched matters
 */
const bulkUpdateAdvisoryMatters = (matterIds, updates) =>
  apiService.patch(ADVISORY_ROUTES.BULK_UPDATE, { matterIds, updates });

// ── Named export object ───────────────────────────────────────
const advisoryService = {
  // Listing
  getAllAdvisoryMatters,
  searchAdvisoryMatters,
  getAdvisoryStats,

  // Core CRUD
  getAdvisoryDetails,
  createAdvisoryDetails,
  updateAdvisoryDetails,
  deleteAdvisoryDetails,
  restoreAdvisoryDetails,

  // Lifecycle
  completeAdvisory,

  // Sub-resources
  addResearchQuestion,
  updateResearchQuestion,
  deleteResearchQuestion,

  addKeyFinding,
  updateKeyFinding,
  deleteKeyFinding,

  updateOpinion,

  addRecommendation,
  updateRecommendation,
  deleteRecommendation,

  addDeliverable,
  updateDeliverable,
  deleteDeliverable,

  // Compliance Checklist
  addComplianceItem,
  updateComplianceItem,
  deleteComplianceItem,

  // Risk Assessment
  updateRiskAssessment,
  addRiskItem,
  updateRiskItem,
  deleteRiskItem,

  // Bulk
  bulkUpdateAdvisoryMatters,
};

export default advisoryService;
