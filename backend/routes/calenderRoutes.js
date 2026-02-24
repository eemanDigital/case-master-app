// calendarRoutes.js - UPDATED TO MATCH userModel ROLES & POSITIONS
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

const router = express.Router();

// ============================================
// PROTECT ALL CALENDAR ROUTES
// ============================================
router.use(protect);

// ============================================
// POSITION-BASED RESTRICTION HELPER
// Checks req.user.position for senior-level access
// since "principal" and "partner" are positions, not roles
// ============================================
const restrictToSeniorPositions = (req, res, next) => {
  // Super admin always passes
  if (req.user.role === "super-admin" || req.user.userType === "super-admin") {
    return next();
  }

  const seniorPositions = [
    "Managing Partner",
    "Senior Partner",
    "Partner",
    "Principal",
    "Head of Chambers",
  ];

  if (seniorPositions.includes(req.user.position)) {
    return next();
  }

  return next({
    status: "fail",
    statusCode: 403,
    message:
      "You do not have permission to perform this action. Senior position required.",
  });
};

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
// CALENDAR SYNC ENDPOINTS
// Valid roles from userModel: "lawyer", "admin", "super-admin"
// "secretary" and "hr" are excluded from sync operations
// ============================================
const syncRestriction = restrictTo("super-admin", "admin", "lawyer");

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
// Available to all authenticated users
// ============================================
router.post("/blocked-dates/check", blockedDateController.checkIfBlocked);
router.get(
  "/blocked-dates/range",
  blockedDateController.getBlockedDatesInRange,
);
router.get("/blocked-dates/my-blocks", blockedDateController.getMyBlockedDates);

// ============================================
// BLOCKED DATES - RESTRICTED OPERATIONS
// Valid roles from userModel: "lawyer", "admin", "super-admin", "hr", "secretary"
// Blocking dates is allowed for all non-client, non-staff roles
// ============================================
const blockRestriction = restrictTo(
  "super-admin",
  "admin",
  "lawyer",
  "hr",
  "secretary",
);

// ============================================
// BLOCKED DATES - EXCEPTION MANAGEMENT
// Restricted to users with senior positions (Partner, Principal, etc.)
// since "principal" and "partner" are POSITIONS not ROLES in the userModel
// ============================================

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

// Exception management — senior positions only (Partner, Principal, Head of Chambers, etc.)
// Uses position-based check since these are positions not roles in the userModel
router.post(
  "/blocked-dates/:id/exceptions",
  restrictToSeniorPositions,
  blockedDateController.grantException,
);

router.delete(
  "/blocked-dates/:id/exceptions/:userId",
  restrictToSeniorPositions,
  blockedDateController.revokeException,
);

// ============================================
// EXPORT ROUTER
// ============================================
module.exports = router;
