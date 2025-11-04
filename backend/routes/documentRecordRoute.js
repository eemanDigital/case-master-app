const express = require("express");
const {
  addDocumentRecord,
  getAllDocumentRecords,
  getDocumentRecord,
  updateDocumentRecord,
  deleteDocumentRecord,
  searchDocumentRecords,
  getDocumentsByType,
  getDocumentsBySender,
  getDocumentsByRecipient,
  getDocumentsByForwardedTo,
  getDocumentsByDateRange,
} = require("../controllers/documentRecordController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.use(protect);

// CRUD operations
router.post("/", addDocumentRecord);
router.get("/", getAllDocumentRecords); // Main endpoint with pagination, filtering, sorting
router.get("/:id", getDocumentRecord);
router.patch("/:id", updateDocumentRecord);
router.delete("/:id", deleteDocumentRecord);

// Advanced search and filtering endpoints
router.post("/search", searchDocumentRecords); // Advanced search with criteria
router.get("/type/:documentType", getDocumentsByType); // Filter by document type
router.get("/sender/:sender", getDocumentsBySender); // Filter by sender name
router.get("/recipient/:recipientId", getDocumentsByRecipient); // Filter by recipient
router.get("/forwarded-to/:forwardedToId", getDocumentsByForwardedTo); // Filter by forwarded user
router.get("/date-range/filter", getDocumentsByDateRange); // Filter by date range

module.exports = router;
