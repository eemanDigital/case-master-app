const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["read", "unread"],
    default: "unread",
  },
  relatedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
