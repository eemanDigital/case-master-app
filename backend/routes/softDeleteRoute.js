const express = require("express");
const {
  softDeleteItem,
  restoreDelete,
} = require("../controllers/softDeleteController");
const Case = require("../models/caseModel");
const Report = require("../models/caseReportModel");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.use(protect);

// Soft delete routes
router.delete("/cases/:id", softDeleteItem({ model: Case, modelName: "Case" }));
router.delete(
  "/reports/:id",
  softDeleteItem({ model: Report, modelName: "Report" })
);

// Restore routes
router.post(
  "/cases/:id/restore",
  restoreDelete({ model: Case, modelName: "Case" })
);
router.post(
  "/reports/:id/restore",
  restoreDelete({ model: Report, modelName: "Report" })
);

module.exports = router;
