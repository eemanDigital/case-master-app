const express = require("express");
const {
  //   getNotification,
  createNotification,
  getNotification,
  deleteNotification,
} = require("../controllers/notificationController");

const notificationRouter = express.Router();

notificationRouter.post("/", createNotification);
// notificationRouter.get("/", getNotifications);
notificationRouter.get("/:id", getNotification);
notificationRouter.delete("/:id", deleteNotification);

module.exports = notificationRouter;
