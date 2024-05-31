const express = require("express");
const {
  createReport,
  getReport,
  getReports,
} = require("../controllers/reportController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.use(protect);

router.post("/", createReport);
router.get("/", getReports);
router.get("/:reportId", getReport);

module.exports = router;
