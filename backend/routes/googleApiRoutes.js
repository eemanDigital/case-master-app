const express = require("express");
const {
  createToken,
  createEvents,
} = require("../controllers/googleAuth2Controller");

const router = express.Router();

router.post("/create-token", createToken);
router.post("/create-events", createEvents);

module.exports = router;
