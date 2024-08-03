const express = require("express");
const {
  createToken,
  createEvents,
} = require("../controllers/googleCalenderController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.post("/create-token", protect, createToken);
router.post("/create-events", protect, createEvents);

module.exports = router;
