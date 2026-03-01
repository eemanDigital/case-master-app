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
  getDocumentsByStatus,
  getDocumentsByPriority,
  updateDocumentStatus,
  forwardDocument,
  addInternalNote,
  addAttachment,
  bulkUpdateStatus,
  bulkDelete,
  bulkPermanentDelete,
  softDeleteDocumentRecord,
  restoreDocumentRecord,
  getTrash,
  getDocumentStats,
  exportDocuments,
  getActivityLog,
} = require("../controllers/documentRecordController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.use(protect);

router.get("/stats", getDocumentStats);
router.get("/export", exportDocuments);
router.get("/trash", getTrash);
router.post("/bulk-update-status", bulkUpdateStatus);
router.post("/bulk-delete", bulkDelete);
router.post("/bulk-permanent-delete", bulkPermanentDelete);

router.post("/", addDocumentRecord);
router.get("/", getAllDocumentRecords);
router.get("/:id", getDocumentRecord);
router.patch("/:id", updateDocumentRecord);
router.delete("/:id", deleteDocumentRecord);

router.patch("/:id/status", updateDocumentStatus);
router.post("/:id/forward", forwardDocument);
router.post("/:id/notes", addInternalNote);
router.post("/:id/attachments", addAttachment);
router.patch("/:id/restore", restoreDocumentRecord);
router.delete("/:id/soft-delete", softDeleteDocumentRecord);
router.get("/:id/activity", getActivityLog);

router.post("/search", searchDocumentRecords);
router.get("/type/:documentType", getDocumentsByType);
router.get("/sender/:sender", getDocumentsBySender);
router.get("/recipient/:recipientId", getDocumentsByRecipient);
router.get("/forwarded-to/:forwardedToId", getDocumentsByForwardedTo);
router.get("/date-range/filter", getDocumentsByDateRange);
router.get("/status/:status", getDocumentsByStatus);
router.get("/priority/:priority", getDocumentsByPriority);

module.exports = router;
