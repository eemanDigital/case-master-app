const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema({
  firmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Firm",
    required: true,
  },

  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },

  category: {
    type: String,
    enum: ["bug", "feature", "support", "billing", "other"],
    default: "support",
  },

  subject: {
    type: String,
    required: true,
  },

  message: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    enum: ["open", "in-progress", "resolved", "closed"],
    default: "open",
  },

  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },

  adminReply: {
    type: String,
    default: null,
  },

  readByAdmin: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Contact = mongoose.model("Contact", ContactSchema);

module.exports = Contact;
