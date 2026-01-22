const express = require("express");
const matterController = require("../controllers/matterController");
const litigationController = require("../controllers/litigationController");
const corporateController = require("../controllers/corporateController");
const { protect, restrictTo } = require("../controllers/authController");

// ============================================
// MATTER ROUTES (General)
// ============================================

const matterRouter = express.Router();

// Protect all routes
matterRouter.use(protect);

// Statistics
matterRouter.get("/stats", matterController.getMatterStats);

// My matters
matterRouter.get("/my-matters", matterController.getMyMatters);

// CRUD operations
matterRouter
  .route("/")
  .get(matterController.getAllMatters)
  .post(matterController.createMatter);

matterRouter
  .route("/:id")
  .get(matterController.getMatter)
  .patch(matterController.updateMatter)
  .delete(matterController.deleteMatter);

// Restore soft-deleted matter
matterRouter.patch("/:id/restore", matterController.restoreMatter);

// ============================================
// LITIGATION ROUTES
// ============================================

const litigationRouter = express.Router();

// Protect all routes
litigationRouter.use(protect);

// Statistics and reports
litigationRouter.get("/stats", litigationController.getLitigationStats);
litigationRouter.get(
  "/upcoming-hearings",
  litigationController.getUpcomingHearings,
);

// List all litigation matters
litigationRouter.get("/", litigationController.getAllLitigationMatters);

// Litigation details CRUD
litigationRouter.post(
  "/:matterId/details",
  litigationController.createLitigationDetails,
);
litigationRouter.get(
  "/:matterId/details",
  litigationController.getLitigationDetails,
);
litigationRouter.patch(
  "/:matterId/details",
  litigationController.updateLitigationDetails,
);

// Hearings management
litigationRouter.post("/:matterId/hearings", litigationController.addHearing);
litigationRouter.patch(
  "/:matterId/hearings/:hearingId",
  litigationController.updateHearing,
);

// Court orders
litigationRouter.post(
  "/:matterId/court-orders",
  litigationController.addCourtOrder,
);

// Processes filed
litigationRouter.post(
  "/:matterId/processes",
  litigationController.addProcessFiled,
);

// Judgment
litigationRouter.patch(
  "/:matterId/judgment",
  litigationController.recordJudgment,
);

// Settlement
litigationRouter.patch(
  "/:matterId/settlement",
  litigationController.recordSettlement,
);

// Appeal
litigationRouter.patch("/:matterId/appeal", litigationController.fileAppeal);

// ============================================
// CORPORATE ROUTES
// ============================================

const corporateRouter = express.Router();

// Protect all routes
corporateRouter.use(protect);

// Statistics and reports
corporateRouter.get("/stats", corporateController.getCorporateStats);
corporateRouter.get(
  "/pending-approvals",
  corporateController.getPendingApprovals,
);

// List all corporate matters
corporateRouter.get("/", corporateController.getAllCorporateMatters);

// Corporate details CRUD
corporateRouter.post(
  "/:matterId/details",
  corporateController.createCorporateDetails,
);
corporateRouter.get(
  "/:matterId/details",
  corporateController.getCorporateDetails,
);
corporateRouter.patch(
  "/:matterId/details",
  corporateController.updateCorporateDetails,
);

// Parties management
corporateRouter.post("/:matterId/parties", corporateController.addParty);
corporateRouter.patch(
  "/:matterId/parties/:index",
  corporateController.updateParty,
);

// Milestones
corporateRouter.post("/:matterId/milestones", corporateController.addMilestone);
corporateRouter.patch(
  "/:matterId/milestones/:milestoneId",
  corporateController.updateMilestone,
);

// Due diligence
corporateRouter.patch(
  "/:matterId/due-diligence",
  corporateController.updateDueDiligence,
);

// Regulatory approvals
corporateRouter.post(
  "/:matterId/regulatory-approvals",
  corporateController.addRegulatoryApproval,
);
corporateRouter.patch(
  "/:matterId/regulatory-approvals/:approvalId",
  corporateController.updateRegulatoryApproval,
);

// Shareholders
corporateRouter.post(
  "/:matterId/shareholders",
  corporateController.addShareholder,
);
corporateRouter.patch(
  "/:matterId/shareholders/:index",
  corporateController.updateShareholder,
);

// Directors
corporateRouter.post("/:matterId/directors", corporateController.addDirector);

// Key agreements
corporateRouter.post(
  "/:matterId/agreements",
  corporateController.addKeyAgreement,
);
corporateRouter.patch(
  "/:matterId/agreements/:agreementId",
  corporateController.updateKeyAgreement,
);

// Compliance requirements
corporateRouter.post(
  "/:matterId/compliance",
  corporateController.addComplianceRequirement,
);
corporateRouter.patch(
  "/:matterId/compliance/:index",
  corporateController.updateComplianceRequirement,
);

// Transaction closing
corporateRouter.patch("/:matterId/closing", corporateController.recordClosing);

// ============================================
// EXPORT ROUTERS
// ============================================

module.exports = {
  matterRouter,
  litigationRouter,
  corporateRouter,
};
