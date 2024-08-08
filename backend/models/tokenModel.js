const mongoose = require("mongoose");

const tokenSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  verificationToken: {
    type: String,
    default: "",
  },
  resetToken: {
    type: String,
    default: "",
  },
  loginToken: {
    type: String,
    default: "",
  },
  refresh_token: {
    type: String,
    default: "",
  },
  googleRefreshToken: {
    type: String,
    default: "",
  },
  createAt: {
    type: Date,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

const Token = mongoose.model("Token", tokenSchema);

module.exports = Token;
