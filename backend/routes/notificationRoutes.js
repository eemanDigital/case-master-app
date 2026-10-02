const express = require("express");
const notificationController = require("../controllers/notificationController");
const { protect } = require("../controllers/authController");

const notificationRouter = express.Router();

// Authentication is mandatory on every route in this router. Previously the
// router was mounted without `protect`, which exposed notification read,
// create and delete to anonymous callers.
notificationRouter.use(protect);

notificationRouter.get("/", notificationController.getMyNotifications);

// The controller additionally rejects client accounts, so any authenticated
// staff member may raise a notification without an exhaustive role list.
notificationRouter.post("/", notificationController.createNotification);

notificationRouter.get("/:id", notificationController.getNotification);

notificationRouter.patch("/:id/read", notificationController.markNotificationRead);

notificationRouter.delete("/:id", notificationController.deleteNotification);

module.exports = notificationRouter;