// routes/eventRoutes.js
const express = require("express");
const eventController = require("../controllers/eventController");
const { protect } = require("../controllers/authController");
const { auditMiddleware } = require("../middleware/auditMiddleware");
const router = express.Router();

router.use(protect);
router.use(auditMiddleware);

router
  .route("/")
  .get(eventController.getAllEvents)
  .post(eventController.createEvent);

router
  .route("/:id")
  .get(eventController.getEventById)
  .patch(eventController.updateEvent)
  .delete(eventController.deleteEvent);

module.exports = router;
