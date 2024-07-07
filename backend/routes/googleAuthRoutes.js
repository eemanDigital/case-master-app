const express = require("express");
const passport = require("passport");
const createSendToken = require("../utils/handleSendToken");
const {
  createToken,
  createEvents,
} = require("../controllers/googleAuthController");

const router = express.Router();

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "http://localhost:5173",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    createSendToken(req.user, 200, res);
  }
);

// Routes for creating token and events
router.post("/create-token", createToken);
router.post("/create-events", createEvents);

module.exports = router;
