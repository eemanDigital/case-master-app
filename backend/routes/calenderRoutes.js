const express = require("express");
const calendarController = require("../controllers/calenderController");
const blockedDateController = require("../controllers/blockedDateController");
const { protect, restrictTo } = require("../controllers/authController");

// ============================================
// CALENDAR EVENTS ROUTER
// ============================================

const calendarRouter = express.Router();

// Protect all calendar routes
calendarRouter.use(protect);

// Statistics
calendarRouter.get("/stats", calendarController.getCalendarStats);

// My calendar
calendarRouter.get("/my-calendar", calendarController.getMyCalendar);

// Upcoming events
calendarRouter.get("/upcoming", calendarController.getUpcomingEvents);

// Events by matter
calendarRouter.get("/matter/:matterId", calendarController.getEventsByMatter);

// CRUD operations
calendarRouter
  .route("/events")
  .get(calendarController.getAllEvents)
  .post(calendarController.createEvent);

calendarRouter
  .route("/events/:id")
  .get(calendarController.getEvent)
  .patch(calendarController.updateEvent)
  .delete(calendarController.deleteEvent);

// Event status management
calendarRouter.patch(
  "/events/:id/status",
  calendarController.updateEventStatus,
);

// Respond to invitation
calendarRouter.patch(
  "/events/:id/respond",
  calendarController.respondToInvitation,
);

// Restore deleted event
calendarRouter.patch("/events/:id/restore", calendarController.restoreEvent);

// ============================================
// BLOCKED DATES ROUTER
// ============================================

const blockedDateRouter = express.Router();

// Protect all blocked date routes
blockedDateRouter.use(protect);

// Check if date is blocked (public endpoint for all users)
blockedDateRouter.post("/check", blockedDateController.checkIfBlocked);

// Get blocked dates in range
blockedDateRouter.get("/range", blockedDateController.getBlockedDatesInRange);

// Get my blocked dates
blockedDateRouter.get("/my-blocks", blockedDateController.getMyBlockedDates);

// CRUD operations (restricted to principals/partners/admins)
blockedDateRouter
  .route("/")
  .get(blockedDateController.getAllBlockedDates)
  .post(
    restrictTo("principal", "partner", "super_admin", "admin"),
    blockedDateController.createBlockedDate,
  );

blockedDateRouter
  .route("/:id")
  .get(blockedDateController.getBlockedDate)
  .patch(
    restrictTo("principal", "partner", "super_admin", "admin"),
    blockedDateController.updateBlockedDate,
  )
  .delete(
    restrictTo("principal", "partner", "super_admin", "admin"),
    blockedDateController.deleteBlockedDate,
  );

// Restore deleted block
blockedDateRouter.patch(
  "/:id/restore",
  restrictTo("principal", "partner", "super_admin", "admin"),
  blockedDateController.restoreBlockedDate,
);

// Exception management (principals and partners only)
blockedDateRouter.post(
  "/:id/exceptions",
  restrictTo("principal", "partner"),
  blockedDateController.grantException,
);

blockedDateRouter.delete(
  "/:id/exceptions/:userId",
  restrictTo("principal", "partner"),
  blockedDateController.revokeException,
);

// ============================================
// EXPORT ROUTERS
// ============================================

module.exports = {
  calendarRouter,
  blockedDateRouter,
};
