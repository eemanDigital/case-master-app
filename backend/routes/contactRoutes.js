const express = require("express");
const router = express.Router();
const {
  createContactRequest,
  getAllContacts,
  getContact,
  updateContact,
  deleteContact,
} = require("../controllers/contactController");
const { protect, restrictTo } = require("../controllers/authController");

router.use(protect);

// User routes
router.post("/", createContactRequest);

// Admin routes (admin or super-admin)
router.get("/", restrictTo("admin", "super-admin"), getAllContacts);
router.get("/:id", restrictTo("admin", "super-admin"), getContact);
router.put("/:id", restrictTo("admin", "super-admin"), updateContact);
router.delete("/:id", restrictTo("admin", "super-admin"), deleteContact);

module.exports = router;
