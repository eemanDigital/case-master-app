const express = require("express");
const {
  addDocumentRecord,
  getAllDocumentRecords,
  getDocumentRecord,
  updateDocumentRecord,
  deleteDocumentRecord,
} = require("../controllers/documentRecordController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.use(protect);

router.post("/", addDocumentRecord);
router.get("/", getAllDocumentRecords);
router.get("/:id", getDocumentRecord);
router.patch("/:id", updateDocumentRecord);
router.delete("/:id", deleteDocumentRecord);

module.exports = router;
