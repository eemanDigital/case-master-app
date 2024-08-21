const express = require("express");
const router = express.Router();
const { createContactRequest } = require("../controllers/contactController");
const { protect } = require("../controllers/authController");

router.use(protect);
// Create a new contact/help request
router.post("/", createContactRequest);

module.exports = router;
