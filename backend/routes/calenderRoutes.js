// In your calendarRoutes.js - MODIFIED VERSION
const express = require("express");
const calendarController = require("../controllers/calenderController");
const blockedDateController = require("../controllers/blockedDateController");
const { protect, restrictTo } = require("../controllers/authController");
const {
  createCalendarEventFromHearing,
  updateNextHearingInCalendar,
  markHearingAsCompleted,
  createDeadlineFromCourtOrder,
} = require("../controllers/calenderSync");

// ============================================
// MAIN CALENDAR ROUTER
// ============================================
const router = express.Router();

// Protect all calendar routes
router.use(protect);

// ============================================
// CALENDAR EVENTS - STATISTICS & DASHBOARD
// ============================================
router.get("/stats", calendarController.getCalendarStats);
router.get("/my-calendar", calendarController.getMyCalendar);
router.get("/upcoming", calendarController.getUpcomingEvents);
router.get("/matter/:matterId", calendarController.getEventsByMatter);

// ============================================
// CALENDAR EVENTS - STANDARD CRUD OPERATIONS
// ============================================
router
  .route("/events")
  .get(calendarController.getAllEvents)
  .post(calendarController.createEvent);

router
  .route("/events/:id")
  .get(calendarController.getEvent)
  .patch(calendarController.updateEvent)
  .delete(calendarController.deleteEvent);

// Event status management
router.patch("/events/:id/status", calendarController.updateEventStatus);

// Respond to invitation
router.patch("/events/:id/respond", calendarController.respondToInvitation);

// Restore deleted event
router.patch("/events/:id/restore", calendarController.restoreEvent);

// ============================================
// CALENDAR SYNC ENDPOINTS (RESTRICTED)
// ============================================
const syncRestriction = restrictTo(
  "principal",
  "partner",
  "super_admin",
  "admin",
  "associate",
);

// Sync hearing to calendar
router.post("/sync/hearing", syncRestriction, async (req, res, next) => {
  try {
    const { litigationDetail, hearing, matter } = req.body;

    if (!litigationDetail || !hearing || !matter) {
      return res.status(400).json({
        status: "fail",
        message:
          "Missing required fields: litigationDetail, hearing, and matter are required",
      });
    }

    const event = await createCalendarEventFromHearing(
      litigationDetail,
      hearing,
      matter,
    );

    res.status(201).json({
      status: "success",
      message: "Hearing synced to calendar successfully",
      data: { event },
    });
  } catch (error) {
    next(error);
  }
});

// Update next hearing date in calendar
router.patch("/sync/next-hearing", syncRestriction, async (req, res, next) => {
  try {
    const { litigationDetail, matter } = req.body;

    if (!litigationDetail || !matter) {
      return res.status(400).json({
        status: "fail",
        message:
          "Missing required fields: litigationDetail and matter are required",
      });
    }

    await updateNextHearingInCalendar(litigationDetail, matter);

    res.status(200).json({
      status: "success",
      message: "Next hearing date updated in calendar",
    });
  } catch (error) {
    next(error);
  }
});

// Mark past hearings as completed
router.patch(
  "/sync/complete-hearings",
  syncRestriction,
  async (req, res, next) => {
    try {
      const { litigationDetail, matter } = req.body;

      if (!litigationDetail || !matter) {
        return res.status(400).json({
          status: "fail",
          message:
            "Missing required fields: litigationDetail and matter are required",
        });
      }

      await markHearingAsCompleted(litigationDetail, matter);

      res.status(200).json({
        status: "success",
        message: "Past hearings marked as completed",
      });
    } catch (error) {
      next(error);
    }
  },
);

// Create deadline from court order
router.post(
  "/sync/court-order-deadline",
  syncRestriction,
  async (req, res, next) => {
    try {
      const { litigationDetail, courtOrder, matter } = req.body;

      if (!litigationDetail || !courtOrder || !matter) {
        return res.status(400).json({
          status: "fail",
          message:
            "Missing required fields: litigationDetail, courtOrder, and matter are required",
        });
      }

      await createDeadlineFromCourtOrder(litigationDetail, courtOrder, matter);

      res.status(201).json({
        status: "success",
        message: "Court order deadline created successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

// ============================================
// BLOCKED DATES - PUBLIC ENDPOINTS
// ============================================
// Check if date is blocked (available to all authenticated users)
router.post("/blocked-dates/check", blockedDateController.checkIfBlocked);

// Get blocked dates in range
router.get(
  "/blocked-dates/range",
  blockedDateController.getBlockedDatesInRange,
);

// Get my blocked dates
router.get("/blocked-dates/my-blocks", blockedDateController.getMyBlockedDates);

// ============================================
// BLOCKED DATES - RESTRICTED OPERATIONS
// ============================================
const blockRestriction = restrictTo(
  "principal",
  "partner",
  "super_admin",
  "admin",
);

const principalRestriction = restrictTo("principal", "partner");

// CRUD operations
router
  .route("/blocked-dates")
  .get(blockedDateController.getAllBlockedDates)
  .post(blockRestriction, blockedDateController.createBlockedDate);

router
  .route("/blocked-dates/:id")
  .get(blockedDateController.getBlockedDate)
  .patch(blockRestriction, blockedDateController.updateBlockedDate)
  .delete(blockRestriction, blockedDateController.deleteBlockedDate);

// Restore deleted block
router.patch(
  "/blocked-dates/:id/restore",
  blockRestriction,
  blockedDateController.restoreBlockedDate,
);

// Exception management (principals and partners only)
router.post(
  "/blocked-dates/:id/exceptions",
  principalRestriction,
  blockedDateController.grantException,
);

router.delete(
  "/blocked-dates/:id/exceptions/:userId",
  principalRestriction,
  blockedDateController.revokeException,
);

// ============================================
// EXPORT SINGLE ROUTER
// ============================================
module.exports = router;
