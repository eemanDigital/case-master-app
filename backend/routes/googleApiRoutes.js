const express = require("express");
const {
  createToken,
  createEvents,
} = require("../controllers/googleAuthController");

const router = express.Router();

router.post("/create-token", createToken);
router.post("/create-events", createEvents);

module.exports = router;
