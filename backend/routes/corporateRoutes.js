const express = require("express");
const corporateController = require("../controllers/corporateController");
const { protect, restrictTo } = require("../controllers/authController");

const corporateRouter = express.Router();

// Protect all routes
corporateRouter.use(protect);

// ============================================
// STATISTICS & DASHBOARD
// ============================================

/**
 * @route   GET /api/corporate-matters/stats
 * @desc    Get corporate-specific statistics
 * @access  Private (All authenticated users)
 * @query   includeDetails (optional)
 * @example GET /api/corporate-matters/stats
 */
corporateRouter.get("/stats", corporateController.getCorporateStats);

/**
 * @route   GET /api/corporate-matters/pending-approvals
 * @desc    Get all corporate matters with pending regulatory approvals
 * @access  Private (All authenticated users)
 * @query   page, limit
 * @example GET /api/corporate-matters/pending-approvals?page=1&limit=20
 */
corporateRouter.get(
  "/pending-approvals",
  corporateController.getPendingApprovals,
);

// ============================================
// CORPORATE REPORT PDF
// ============================================

/**
 * @route   GET /api/corporate-matters/:matterId/report
 * @desc    Generate corporate matter report PDF
 * @access  Private
 * @example GET /api/corporate-matters/123abc/report
 */
corporateRouter.get("/:matterId/report", corporateController.generateCorporateReportPdf);

// ============================================
// CORPORATE MATTERS LISTING & SEARCH
// ============================================

/**
 * @route   GET /api/corporate-matters
 * @desc    Get all corporate matters with pagination, filtering, and sorting
 * @access  Private (All authenticated users)
 * @query   page, limit, sort, populate, select, debug, includeStats,
 *          status, search, includeDeleted, onlyDeleted,
 *          transactionType, companyName, companyType
 * @example GET /api/corporate-matters?page=1&limit=50&transactionType=merger
 */
corporateRouter.get("/", corporateController.getAllCorporateMatters);

/**
 * @route   POST /api/corporate-matters/search
 * @desc    Advanced search for corporate matters
 * @access  Private (All authenticated users)
 * @body    criteria (MongoDB query), options (pagination, sorting)
 * @example POST /api/corporate-matters/search
 *          {
 *            "criteria": {
 *              "status": "active",
 *              "dealValue.amount": { "$gte": 1000000 }
 *            },
 *            "options": {
 *              "page": 1,
 *              "limit": 50,
 *              "sort": "-dateOpened"
 *            }
 *          }
 */
corporateRouter.post("/search", corporateController.searchCorporateMatters);

// ============================================
// CORPORATE DETAILS MANAGEMENT
// ============================================

/**
 * @route   POST /api/corporate-matters/:matterId/details
 * @desc    Create corporate details for a matter
 * @access  Private (Admin, Lawyer only)
 * @param   matterId - Matter ID
 * @body    transactionType, companyName, companyType, jurisdiction, dealValue, etc.
 * @example POST /api/corporate-matters/507f1f77bcf86cd799439013/details
 *          {
 *            "transactionType": "merger",
 *            "companyName": "TechCorp Inc.",
 *            "dealValue": { "amount": 5000000, "currency": "USD" }
 *          }
 */
corporateRouter.post(
  "/:matterId/details",
  restrictTo("admin", "lawyer"),
  corporateController.createCorporateDetails,
);

/**
 * @route   GET /api/corporate-matters/:matterId/details
 * @desc    Get corporate details for a specific matter
 * @access  Private (All authenticated users)
 * @param   matterId - Matter ID
 * @example GET /api/corporate-matters/507f1f77bcf86cd799439013/details
 */
corporateRouter.get(
  "/:matterId/details",
  corporateController.getCorporateDetails,
);

/**
 * @route   PATCH /api/corporate-matters/:matterId/details
 * @desc    Update corporate details
 * @access  Private (Admin, Lawyer only)
 * @param   matterId - Matter ID
 * @body    Updates to corporate details
 * @example PATCH /api/corporate-matters/507f1f77bcf86cd799439013/details
 *          {
 *            "dealValue": { "amount": 6000000, "currency": "USD" },
 *            "companyType": "Public Limited"
 *          }
 */
corporateRouter.patch(
  "/:matterId/details",
  restrictTo("admin", "lawyer"),
  corporateController.updateCorporateDetails,
);

// ============================================
// PARTIES MANAGEMENT
// ============================================

/**
 * @route   POST /api/corporate-matters/:matterId/parties
 * @desc    Add party to corporate transaction
 * @access  Private (Admin, Lawyer only)
 * @param   matterId - Matter ID
 * @body    party details
 * @example POST /api/corporate-matters/507f1f77bcf86cd799439013/parties
 *          {
 *            "name": "Acme Corp",
 *            "type": "buyer",
 *            "contactPerson": "John Doe",
 *            "email": "john@acme.com"
 *          }
 */
corporateRouter.post(
  "/:matterId/parties",
  restrictTo("admin", "lawyer"),
  corporateController.addParty,
);

/**
 * @route   PATCH /api/corporate-matters/:matterId/parties/:partyId
 * @desc    Update party information
 * @access  Private (Admin, Lawyer only)
 * @param   matterId - Matter ID
 * @param   partyId - Party ID
 * @body    Updated party details
 * @example PATCH /api/corporate-matters/507f1f77bcf86cd799439013/parties/party123
 */
corporateRouter.patch(
  "/:matterId/parties/:partyId",
  restrictTo("admin", "lawyer"),
  corporateController.updateParty,
);

/**
 * @route   DELETE /api/corporate-matters/:matterId/parties/:partyId
 * @desc    Remove party from corporate transaction
 * @access  Private (Admin, Lawyer only)
 * @param   matterId - Matter ID
 * @param   partyId - Party ID
 * @example DELETE /api/corporate-matters/507f1f77bcf86cd799439013/parties/party123
 */
corporateRouter.delete(
  "/:matterId/parties/:partyId",
  restrictTo("admin", "lawyer"),
  corporateController.removeParty,
);

/**
 * @route   GET /api/corporate-matters/:matterId/parties
 * @desc    Get all parties for a corporate matter
 * @access  Private (All authenticated users)
 * @param   matterId - Matter ID
 * @example GET /api/corporate-matters/507f1f77bcf86cd799439013/parties
 */
corporateRouter.get("/:matterId/parties", corporateController.getParties);

// ============================================
// SHAREHOLDERS MANAGEMENT
// ============================================

corporateRouter.post(
  "/:matterId/shareholders",
  restrictTo("admin", "lawyer"),
  corporateController.addShareholder,
);

corporateRouter.patch(
  "/:matterId/shareholders/:shareholderId",
  restrictTo("admin", "lawyer"),
  corporateController.updateShareholder,
);

corporateRouter.delete(
  "/:matterId/shareholders/:shareholderId",
  restrictTo("admin", "lawyer"),
  corporateController.removeShareholder,
);

corporateRouter.get(
  "/:matterId/shareholders",
  corporateController.getShareholders,
);

// ============================================
// DIRECTORS MANAGEMENT
// ============================================

corporateRouter.post(
  "/:matterId/directors",
  restrictTo("admin", "lawyer"),
  corporateController.addDirector,
);

corporateRouter.patch(
  "/:matterId/directors/:directorId",
  restrictTo("admin", "lawyer"),
  corporateController.updateDirector,
);

corporateRouter.delete(
  "/:matterId/directors/:directorId",
  restrictTo("admin", "lawyer"),
  corporateController.removeDirector,
);

corporateRouter.get("/:matterId/directors", corporateController.getDirectors);

// ============================================
// MILESTONES MANAGEMENT
// ============================================

corporateRouter.post(
  "/:matterId/milestones",
  restrictTo("admin", "lawyer"),
  corporateController.addMilestone,
);

corporateRouter.patch(
  "/:matterId/milestones/:milestoneId",
  restrictTo("admin", "lawyer"),
  corporateController.updateMilestone,
);

corporateRouter.delete(
  "/:matterId/milestones/:milestoneId",
  restrictTo("admin", "lawyer"),
  corporateController.removeMilestone,
);

corporateRouter.get("/:matterId/milestones", corporateController.getMilestones);

corporateRouter.patch(
  "/:matterId/milestones/:milestoneId/complete",
  restrictTo("admin", "lawyer"),
  corporateController.completeMilestone,
);

// ============================================
// DUE DILIGENCE MANAGEMENT
// ============================================

corporateRouter.get(
  "/:matterId/due-diligence",
  corporateController.getDueDiligence,
);

corporateRouter.patch(
  "/:matterId/due-diligence",
  restrictTo("admin", "lawyer"),
  corporateController.updateDueDiligence,
);

// ============================================
// REGULATORY APPROVALS MANAGEMENT
// ============================================

corporateRouter.post(
  "/:matterId/regulatory-approvals",
  restrictTo("admin", "lawyer"),
  corporateController.addRegulatoryApproval,
);

corporateRouter.patch(
  "/:matterId/regulatory-approvals/:approvalId",
  restrictTo("admin", "lawyer"),
  corporateController.updateRegulatoryApproval,
);

corporateRouter.delete(
  "/:matterId/regulatory-approvals/:approvalId",
  restrictTo("admin", "lawyer"),
  corporateController.removeRegulatoryApproval,
);

corporateRouter.get(
  "/:matterId/regulatory-approvals",
  corporateController.getRegulatoryApprovals,
);

corporateRouter.patch(
  "/:matterId/regulatory-approvals/:approvalId/status",
  restrictTo("admin", "lawyer"),
  corporateController.updateApprovalStatus,
);

// ============================================
// COMPLIANCE REQUIREMENTS MANAGEMENT
// ============================================

corporateRouter.post(
  "/:matterId/compliance",
  restrictTo("admin", "lawyer"),
  corporateController.addComplianceRequirement,
);

corporateRouter.patch(
  "/:matterId/compliance/:requirementId",
  restrictTo("admin", "lawyer"),
  corporateController.updateComplianceRequirement,
);

corporateRouter.delete(
  "/:matterId/compliance/:requirementId",
  restrictTo("admin", "lawyer"),
  corporateController.removeComplianceRequirement,
);

corporateRouter.get(
  "/:matterId/compliance",
  corporateController.getComplianceRequirements,
);

// ============================================
// KEY AGREEMENTS MANAGEMENT
// ============================================

corporateRouter.post(
  "/:matterId/agreements",
  restrictTo("admin", "lawyer"),
  corporateController.addKeyAgreement,
);

corporateRouter.patch(
  "/:matterId/agreements/:agreementId",
  restrictTo("admin", "lawyer"),
  corporateController.updateKeyAgreement,
);

corporateRouter.delete(
  "/:matterId/agreements/:agreementId",
  restrictTo("admin", "lawyer"),
  corporateController.removeKeyAgreement,
);

corporateRouter.get(
  "/:matterId/agreements",
  corporateController.getKeyAgreements,
);

// ============================================
// TRANSACTION CLOSING
// ============================================

/**
 * @route   PATCH /api/corporate-matters/:matterId/closing
 * @desc    Record transaction closing details
 * @access  Private (Admin, Lawyer only)
 * @param   matterId - Matter ID
 * @body    actualClosingDate, closingNotes
 * @example PATCH /api/corporate-matters/507f1f77bcf86cd799439013/closing
 *          {
 *            "actualClosingDate": "2024-12-15",
 *            "closingNotes": "Transaction completed successfully"
 *          }
 */
corporateRouter.patch(
  "/:matterId/closing",
  restrictTo("admin", "lawyer"),
  corporateController.recordClosing,
);

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * @route   PATCH /api/corporate-matters/bulk-update
 * @desc    Update multiple corporate matters at once
 * @access  Private (Admin, Lawyer only)
 * @body    matterIds (array), updates (object)
 * @example PATCH /api/corporate-matters/bulk-update
 *          {
 *            "matterIds": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"],
 *            "updates": {
 *              "status": "active",
 *              "priority": "high"
 *            }
 *          }
 */
corporateRouter.patch(
  "/bulk-update",
  restrictTo("admin", "lawyer"),
  corporateController.bulkUpdateCorporateMatters,
);

module.exports = corporateRouter;
