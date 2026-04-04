const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Deadline = require("../models/deadlineModel");
const User = require("../models/userModel");
const { sendCustomEmail } = require("../utils/email");
const Firm = require("../models/firmModel");
const path = require("path");
const fs = require("fs").promises;
const { dispatch } = require("../utils/automationEngine");
const PDFDocument = require("pdfkit");

const POPULATE_FIELDS = [
  { path: "assignedTo", select: "firstName lastName email photo role" },
  { path: "supervisor", select: "firstName lastName email photo role" },
  { path: "createdBy", select: "firstName lastName email" },
  { path: "updatedBy", select: "firstName lastName email" },
];

exports.getAllDeadlines = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    status,
    category,
    assignedTo,
    priority,
    linkedEntityType,
    linkedEntityId,
    dueDateFrom,
    dueDateTo,
    isOverdue,
    search,
  } = req.query;

  const query = {
    firmId: req.firmId,
    isDeleted: { $ne: true },
  };

  if (status) {
    query.status = status;
  }

  if (category) {
    query.category = category;
  }

  if (assignedTo) {
    query.assignedTo = assignedTo;
  }

  if (priority) {
    query.priority = priority;
  }

  if (linkedEntityType) {
    query.linkedEntityType = linkedEntityType;
  }

  if (linkedEntityId) {
    query.linkedEntityId = linkedEntityId;
  }

  if (dueDateFrom || dueDateTo) {
    query.dueDate = {};
    if (dueDateFrom) query.dueDate.$gte = new Date(dueDateFrom);
    if (dueDateTo) query.dueDate.$lte = new Date(dueDateTo);
  }

  if (isOverdue === "true") {
    query.dueDate = { $lt: new Date() };
    query.status = { $nin: ["completed", "cancelled"] };
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [deadlines, total] = await Promise.all([
    Deadline.find(query)
      .populate(POPULATE_FIELDS)
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Deadline.countDocuments(query),
  ]);

  res.status(200).json({
    status: "success",
    data: deadlines,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

exports.createDeadline = catchAsync(async (req, res, next) => {
  const deadlineData = {
    ...req.body,
    firmId: req.firmId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  };

  if (deadlineData.isRecurring && deadlineData.recurrence) {
    const { frequency, interval = 1 } = deadlineData.recurrence;
    const dueDate = new Date(deadlineData.dueDate);

    switch (frequency) {
      case "daily":
        dueDate.setDate(dueDate.getDate() + interval);
        break;
      case "weekly":
        dueDate.setDate(dueDate.getDate() + 7 * interval);
        break;
      case "monthly":
        dueDate.setMonth(dueDate.getMonth() + interval);
        break;
      case "quarterly":
        dueDate.setMonth(dueDate.getMonth() + 3 * interval);
        break;
      case "annually":
        dueDate.setFullYear(dueDate.getFullYear() + interval);
        break;
    }

    deadlineData.recurrence.nextOccurrence = dueDate;
  }

  const deadline = new Deadline(deadlineData);
  deadline.deadlineNumber = await Deadline.generateDeadlineNumber(req.firmId);

  await deadline.save();

  await deadline.populate(POPULATE_FIELDS);

  dispatch("deadline.created", deadline.toObject(), req.firmId).catch(err => {
    console.error("Automation dispatch error (deadline.created):", err.message);
  });

  res.status(201).json({
    status: "success",
    data: deadline,
  });
});

exports.getDeadline = catchAsync(async (req, res, next) => {
  const deadline = await Deadline.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  }).populate(POPULATE_FIELDS);

  if (!deadline) {
    return next(new AppError("Deadline not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: deadline,
  });
});

exports.updateDeadline = catchAsync(async (req, res, next) => {
  const deadline = await Deadline.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!deadline) {
    return next(new AppError("Deadline not found", 404));
  }

  const { dueDate, status, ...otherUpdates } = req.body;
  const updates = { ...otherUpdates, updatedBy: req.user._id };

  if (dueDate && new Date(dueDate).getTime() !== new Date(deadline.dueDate).getTime()) {
    deadline.extensions.push({
      previousDueDate: deadline.dueDate,
      newDueDate: new Date(dueDate),
      reason: req.body.extensionReason || "Due date updated",
      extendedBy: req.user._id,
    });

    deadline.escalation.sevenDayReminderSent = false;
    deadline.escalation.oneDayReminderSent = false;
    deadline.escalation.overdueAlertSent = false;
  }

  Object.assign(deadline, updates);

  if (dueDate) {
    deadline.dueDate = new Date(dueDate);
  }

  if (status && status !== deadline.status) {
    deadline.status = status;

    if (status === "missed") {
      dispatch("deadline.missed", deadline.toObject(), req.firmId).catch(err => {
        console.error("Automation dispatch error (deadline.missed):", err.message);
      });
    }
  }

  await deadline.save();
  await deadline.populate(POPULATE_FIELDS);

  res.status(200).json({
    status: "success",
    data: deadline,
  });
});

exports.deleteDeadline = catchAsync(async (req, res, next) => {
  const deadline = await Deadline.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!deadline) {
    return next(new AppError("Deadline not found", 404));
  }

  deadline.isDeleted = true;
  deadline.deletedAt = new Date();
  deadline.deletedBy = req.user._id;
  await deadline.save();

  res.status(200).json({
    status: "success",
    message: "Deadline deleted successfully",
  });
});

exports.markComplete = catchAsync(async (req, res, next) => {
  const deadline = await Deadline.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  }).populate(POPULATE_FIELDS);

  if (!deadline) {
    return next(new AppError("Deadline not found", 404));
  }

  if (deadline.status === "completed") {
    return next(new AppError("Deadline is already completed", 400));
  }

  const now = new Date();
  const dueDate = new Date(deadline.dueDate);
  const diffTime = now - dueDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  deadline.status = "completed";
  deadline.completedAt = now;
  deadline.completedBy = req.user._id;
  deadline.completionNotes = req.body.completionNotes || null;

  deadline.performance = {
    wasOnTime: diffDays >= 0,
    daysEarly: diffDays > 0 ? diffDays : 0,
    daysLate: diffDays < 0 ? Math.abs(diffDays) : 0,
  };

  if (deadline.isRecurring && deadline.recurrence) {
    const newDueDate = new Date(deadline.dueDate);
    const { frequency, interval = 1 } = deadline.recurrence;

    switch (frequency) {
      case "daily":
        newDueDate.setDate(newDueDate.getDate() + interval);
        break;
      case "weekly":
        newDueDate.setDate(newDueDate.getDate() + 7 * interval);
        break;
      case "monthly":
        newDueDate.setMonth(newDueDate.getMonth() + interval);
        break;
      case "quarterly":
        newDueDate.setMonth(newDueDate.getMonth() + 3 * interval);
        break;
      case "annually":
        newDueDate.setFullYear(newDueDate.getFullYear() + interval);
        break;
    }

    if (!deadline.recurrence.endDate || newDueDate <= deadline.recurrence.endDate) {
      const newDeadline = new Deadline({
        firmId: deadline.firmId,
        title: deadline.title,
        description: deadline.description,
        linkedEntityType: deadline.linkedEntityType,
        linkedEntityId: deadline.linkedEntityId,
        assignedTo: deadline.assignedTo,
        supervisor: deadline.supervisor,
        createdBy: deadline.createdBy,
        dueDate: newDueDate,
        timezone: deadline.timezone,
        category: deadline.category,
        priority: deadline.priority,
        tags: deadline.tags,
        isRecurring: deadline.isRecurring,
        recurrence: {
          ...deadline.recurrence,
          nextOccurrence: null,
          parentDeadlineId: deadline._id,
        },
      });
      newDeadline.deadlineNumber = await Deadline.generateDeadlineNumber(req.firmId);
      await newDeadline.save();
    }
  }

  await deadline.save();

  if (deadline.supervisor) {
    try {
      const firm = await Firm.findById(req.firmId);
      const supervisor = await User.findById(deadline.supervisor);

      if (supervisor && supervisor.email) {
        await sendCustomEmail(
          "Deadline Completed",
          supervisor.email,
          process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
          null,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Deadline Completed</h2>
              <p><strong>Title:</strong> ${deadline.title}</p>
              <p><strong>Completed By:</strong> ${req.user.firstName} ${req.user.lastName}</p>
              <p><strong>Completed At:</strong> ${new Date().toLocaleString("en-NG")}</p>
              <p><strong>Original Due Date:</strong> ${dueDate.toLocaleString("en-NG")}</p>
              <p><strong>Performance:</strong> ${deadline.performance.wasOnTime ? "On Time" : `${deadline.performance.daysLate} days late`}</p>
              ${deadline.completionNotes ? `<p><strong>Notes:</strong> ${deadline.completionNotes}</p>` : ""}
            </div>
          `
        );
      }
    } catch (emailError) {
      console.error("Error sending completion notification:", emailError);
    }
  }

  dispatch("deadline.completed", deadline.toObject(), req.firmId).catch(err => {
    console.error("Automation dispatch error (deadline.completed):", err.message);
  });

  res.status(200).json({
    status: "success",
    data: deadline,
  });
});

exports.extendDeadline = catchAsync(async (req, res, next) => {
  const { newDueDate, reason } = req.body;

  if (!newDueDate) {
    return next(new AppError("New due date is required", 400));
  }

  const deadline = await Deadline.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!deadline) {
    return next(new AppError("Deadline not found", 404));
  }

  deadline.extensions.push({
    previousDueDate: deadline.dueDate,
    newDueDate: new Date(newDueDate),
    reason: reason || "Extension requested",
    extendedBy: req.user._id,
  });

  deadline.dueDate = new Date(newDueDate);
  deadline.status = "extended";
  deadline.updatedBy = req.user._id;

  deadline.escalation.sevenDayReminderSent = false;
  deadline.escalation.oneDayReminderSent = false;
  deadline.escalation.overdueAlertSent = false;
  deadline.escalation.isEscalated = false;

  await deadline.save();
  await deadline.populate(POPULATE_FIELDS);

  if (deadline.supervisor) {
    try {
      const supervisor = await User.findById(deadline.supervisor);

      if (supervisor && supervisor.email) {
        await sendCustomEmail(
          "Deadline Extended",
          supervisor.email,
          process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
          null,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Deadline Extended</h2>
              <p><strong>Title:</strong> ${deadline.title}</p>
              <p><strong>Previous Due Date:</strong> ${deadline.extensions[deadline.extensions.length - 1].previousDueDate.toLocaleString("en-NG")}</p>
              <p><strong>New Due Date:</strong> ${new Date(newDueDate).toLocaleString("en-NG")}</p>
              <p><strong>Reason:</strong> ${reason || "Not specified"}</p>
              <p><strong>Extended By:</strong> ${req.user.firstName} ${req.user.lastName}</p>
            </div>
          `
        );
      }
    } catch (emailError) {
      console.error("Error sending extension notification:", emailError);
    }
  }

  res.status(200).json({
    status: "success",
    data: deadline,
  });
});

exports.getDeadlineStats = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    totalDeadlines,
    statusCounts,
    categoryCounts,
    overdueCount,
    thisWeekCount,
    completedThisMonth,
    avgDaysLateResult,
    performanceByLawyer,
  ] = await Promise.all([
    Deadline.countDocuments({ firmId, isDeleted: { $ne: true } }),
    Deadline.aggregate([
      { $match: { firmId, isDeleted: { $ne: true } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Deadline.aggregate([
      { $match: { firmId, isDeleted: { $ne: true } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
    Deadline.countDocuments({
      firmId,
      dueDate: { $lt: now },
      status: { $nin: ["completed", "cancelled"] },
      isDeleted: { $ne: true },
    }),
    Deadline.countDocuments({
      firmId,
      dueDate: { $gte: startOfWeek, $lte: endOfWeek },
      isDeleted: { $ne: true },
    }),
    Deadline.countDocuments({
      firmId,
      status: "completed",
      completedAt: { $gte: startOfMonth, $lte: endOfMonth },
      isDeleted: { $ne: true },
    }),
    Deadline.aggregate([
      {
        $match: {
          firmId,
          status: "completed",
          "performance.daysLate": { $gt: 0 },
          isDeleted: { $ne: true },
        },
      },
      { $group: { _id: null, avgDaysLate: { $avg: "$performance.daysLate" } } },
    ]),
    Deadline.aggregate([
      {
        $match: {
          firmId,
          status: "completed",
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          total: { $sum: 1 },
          onTime: {
            $sum: { $cond: ["$performance.wasOnTime", 1, 0] },
          },
          missed: {
            $sum: { $cond: [{ $eq: ["$performance.wasOnTime", false] }, 1, 0] },
          },
          avgDaysLate: { $avg: "$performance.daysLate" },
        },
      },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $concat: ["$user.firstName", " ", "$user.lastName"] },
          email: "$user.email",
          total: 1,
          onTime: 1,
          missed: 1,
          avgDaysLate: { $round: ["$avgDaysLate", 1] },
          completionRate: {
            $round: [{ $multiply: [{ $divide: ["$onTime", { $max: ["$total", 1] }] }, 100] }, 1],
          },
        },
      },
    ]),
  ]);

  const completedCount = statusCounts.find((s) => s._id === "completed")?.count || 0;
  const completionRate = totalDeadlines > 0 ? ((completedCount / totalDeadlines) * 100).toFixed(1) : 0;

  res.status(200).json({
    status: "success",
    data: {
      total: totalDeadlines,
      byStatus: statusCounts.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      byCategory: categoryCounts.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {}),
      overdueCount,
      thisWeekCount,
      completedThisMonth,
      completionRate: parseFloat(completionRate),
      averageDaysLate: avgDaysLateResult[0]?.avgDaysLate
        ? parseFloat(avgDaysLateResult[0].avgDaysLate.toFixed(1))
        : 0,
      performanceByLawyer,
    },
  });
});

exports.getPerformanceReport = catchAsync(async (req, res, next) => {
  const { month, year, lawyerId } = req.query;

  const targetMonth = month ? parseInt(month) : new Date().getMonth();
  const targetYear = year ? parseInt(year) : new Date().getFullYear();

  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  const matchStage = {
    firmId: req.firmId,
    status: "completed",
    completedAt: { $gte: startDate, $lte: endDate },
    isDeleted: { $ne: true },
  };

  if (lawyerId) {
    matchStage.assignedTo = lawyerId;
  }

  const report = await Deadline.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$assignedTo",
        totalAssigned: { $sum: 1 },
        completedOnTime: {
          $sum: { $cond: ["$performance.wasOnTime", 1, 0] },
        },
        missed: {
          $sum: { $cond: [{ $eq: ["$performance.wasOnTime", false] }, 1, 0] },
        },
        avgDaysLate: { $avg: "$performance.daysLate" },
        avgDaysEarly: { $avg: "$performance.daysEarly" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        lawyerId: "$_id",
        lawyerName: {
          $concat: [
            { $ifNull: ["$user.firstName", ""] },
            " ",
            { $ifNull: ["$user.lastName", "Unknown"] },
          ],
        },
        lawyerEmail: "$user.email",
        totalAssigned: 1,
        completedOnTime: 1,
        missed: 1,
        avgDaysLate: { $round: [{ $ifNull: ["$avgDaysLate", 0] }, 1] },
        avgDaysEarly: { $round: [{ $ifNull: ["$avgDaysEarly", 0] }, 1] },
        completionRate: {
          $round: [
            {
              $multiply: [
                { $divide: ["$completedOnTime", { $max: ["$totalAssigned", 1] }] },
                100,
              ],
            },
            1,
          ],
        },
      },
    },
    { $sort: { totalAssigned: -1 } },
  ]);

  const firm = await Firm.findById(req.firmId);

  res.status(200).json({
    status: "success",
    data: {
      period: {
        month: targetMonth + 1,
        year: targetYear,
        startDate,
        endDate,
      },
      firmName: firm?.name || "Unknown Firm",
      report,
      summary: {
        totalLawyers: report.length,
        totalDeadlines: report.reduce((sum, r) => sum + r.totalAssigned, 0),
        totalOnTime: report.reduce((sum, r) => sum + r.completedOnTime, 0),
        totalMissed: report.reduce((sum, r) => sum + r.missed, 0),
        overallCompletionRate:
          report.reduce((sum, r) => sum + r.completedOnTime, 0) /
          Math.max(report.reduce((sum, r) => sum + r.totalAssigned, 0), 1) *
          100,
      },
    },
  });
});

exports.generatePerformanceReportPdf = catchAsync(async (req, res, next) => {
  const { month, year, lawyerId } = req.query;

  const targetMonth = month ? parseInt(month) : new Date().getMonth();
  const targetYear = year ? parseInt(year) : new Date().getFullYear();

  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const matchStage = {
    firmId: req.firmId,
    status: "completed",
    completedAt: { $gte: startDate, $lte: endDate },
    isDeleted: { $ne: true },
  };

  if (lawyerId) {
    matchStage.assignedTo = lawyerId;
  }

  const report = await Deadline.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$assignedTo",
        totalAssigned: { $sum: 1 },
        completedOnTime: {
          $sum: { $cond: ["$performance.wasOnTime", 1, 0] },
        },
        missed: {
          $sum: { $cond: [{ $eq: ["$performance.wasOnTime", false] }, 1, 0] },
        },
        avgDaysLate: { $avg: "$performance.daysLate" },
        avgDaysEarly: { $avg: "$performance.daysEarly" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        lawyerId: "$_id",
        lawyerName: {
          $concat: [
            { $ifNull: ["$user.firstName", ""] },
            " ",
            { $ifNull: ["$user.lastName", "Unknown"] },
          ],
        },
        lawyerEmail: "$user.email",
        totalAssigned: 1,
        completedOnTime: 1,
        missed: 1,
        avgDaysLate: { $round: [{ $ifNull: ["$avgDaysLate", 0] }, 1] },
        avgDaysEarly: { $round: [{ $ifNull: ["$avgDaysEarly", 0] }, 1] },
        completionRate: {
          $round: [
            {
              $multiply: [
                { $divide: ["$completedOnTime", { $max: ["$totalAssigned", 1] }] },
                100,
              ],
            },
            1,
          ],
        },
      },
    },
    { $sort: { totalAssigned: -1 } },
  ]);

  const firm = await Firm.findById(req.firmId);

  const totalDeadlines = report.reduce((sum, r) => sum + r.totalAssigned, 0);
  const totalOnTime = report.reduce((sum, r) => sum + r.completedOnTime, 0);
  const totalMissed = report.reduce((sum, r) => sum + r.missed, 0);
  const overallRate = totalDeadlines > 0 ? ((totalOnTime / totalDeadlines) * 100).toFixed(1) : 0;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #10b981; padding-bottom: 20px; }
        .header h1 { color: #10b981; font-size: 28px; margin-bottom: 10px; }
        .header h2 { color: #374151; font-size: 20px; font-weight: normal; }
        .header .period { color: #6b7280; font-size: 14px; margin-top: 5px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
        .stat-card { background: linear-gradient(135deg, #f9fafb, #f3f4f6); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e5e7eb; }
        .stat-card .value { font-size: 32px; font-weight: bold; color: #10b981; }
        .stat-card .label { color: #6b7280; font-size: 12px; margin-top: 5px; text-transform: uppercase; }
        .stat-card.warning .value { color: #f59e0b; }
        .stat-card.danger .value { color: #ef4444; }
        .table-container { margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #10b981; color: white; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; }
        td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
        tr:nth-child(even) { background: #f9fafb; }
        tr:hover { background: #f3f4f6; }
        .rate { font-weight: bold; }
        .rate.high { color: #10b981; }
        .rate.medium { color: #f59e0b; }
        .rate.low { color: #ef4444; }
        .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
        .footer .brand { color: #10b981; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Deadline Performance Report</h1>
        <h2>${firm?.name || "Law Firm"}</h2>
        <p class="period">${monthNames[targetMonth]} ${targetYear}</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="value">${totalDeadlines}</div>
          <div class="label">Total Deadlines</div>
        </div>
        <div class="stat-card">
          <div class="value">${totalOnTime}</div>
          <div class="label">Completed On Time</div>
        </div>
        <div class="stat-card warning">
          <div class="value">${totalMissed}</div>
          <div class="label">Missed Deadlines</div>
        </div>
        <div class="stat-card">
          <div class="value">${overallRate}%</div>
          <div class="label">Completion Rate</div>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Lawyer</th>
              <th>Total</th>
              <th>On Time</th>
              <th>Missed</th>
              <th>Avg Days Late</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            ${report.map(r => `
              <tr>
                <td>${r.lawyerName}</td>
                <td>${r.totalAssigned}</td>
                <td>${r.completedOnTime}</td>
                <td>${r.missed}</td>
                <td>${r.avgDaysLate}</td>
                <td class="rate ${r.completionRate >= 80 ? 'high' : r.completionRate >= 50 ? 'medium' : 'low'}">${r.completionRate}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>Generated by <span class="brand">LawMaster</span> on ${new Date().toLocaleDateString("en-NG")}</p>
      </div>
    </body>
    </html>
  `;

  const chunks = [];
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 50, left: 40, right: 40 },
  });

  doc.on("data", (chunk) => chunks.push(chunk));

  const pageWidth = doc.page.width - 80;
  let y = 50;

  doc.rect(0, 0, doc.page.width, 60).fill("#10b981");
  doc.fillColor("#ffffff").fontSize(18).font("Helvetica-Bold")
    .text("Deadline Performance Report", 40, 15);
  doc.fontSize(10).font("Helvetica")
    .text(`${firm?.name || "Law Firm"} - ${monthNames[targetMonth]} ${targetYear}`, 40, 38);
  y = 80;

  const stats = [
    { label: "Total Deadlines", value: totalDeadlines, color: "#10b981" },
    { label: "On Time", value: totalOnTime, color: "#10b981" },
    { label: "Missed", value: totalMissed, color: "#ef4444" },
    { label: "Rate", value: `${overallRate}%`, color: "#10b981" },
  ];

  const colWidth = (pageWidth - 30) / 4;
  stats.forEach((stat, i) => {
    const x = 40 + i * (colWidth + 10);
    doc.rect(x, y, colWidth, 50).fill("#f3f4f6");
    doc.fillColor(stat.color).fontSize(24).font("Helvetica-Bold")
      .text(String(stat.value), x + 5, y + 8, { width: colWidth - 10, align: "center" });
    doc.fillColor("#6b7280").fontSize(8).font("Helvetica")
      .text(stat.label.toUpperCase(), x + 5, y + 38, { width: colWidth - 10, align: "center" });
  });
  y += 65;

  doc.rect(40, y, pageWidth, 18).fill("#10b981");
  doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
  doc.text("Lawyer", 45, y + 5, { width: 180 });
  doc.text("Total", 230, y + 5, { width: 60 });
  doc.text("On Time", 295, y + 5, { width: 60 });
  doc.text("Missed", 360, y + 5, { width: 60 });
  doc.text("Avg Late", 425, y + 5, { width: 60 });
  doc.text("Rate", 490, y + 5, { width: 60, align: "right" });
  y += 22;

  report.forEach((r, idx) => {
    const bgColor = idx % 2 === 0 ? "#ffffff" : "#f9fafb";
    doc.rect(40, y - 2, pageWidth, 18).fill(bgColor);
    const rateColor = r.completionRate >= 80 ? "#10b981" : r.completionRate >= 50 ? "#f59e0b" : "#ef4444";
    doc.fillColor("#1f2937").fontSize(9).font("Helvetica")
      .text(r.lawyerName, 45, y + 1, { width: 180 })
      .text(String(r.totalAssigned), 230, y + 1, { width: 60 })
      .text(String(r.completedOnTime), 295, y + 1, { width: 60 })
      .text(String(r.missed), 360, y + 1, { width: 60 })
      .text(String(r.avgDaysLate), 425, y + 1, { width: 60 })
      .text(`${r.completionRate}%`, 490, y + 1, { width: 60, align: "right" });
    y += 18;
  });

  doc.fontSize(8).fillColor("#9ca3af")
    .text(`Generated by LawMaster on ${new Date().toLocaleDateString("en-GB")}`, 40, doc.page.height - 30, { align: "center", width: pageWidth });

  return new Promise((resolve, reject) => {
    doc.end();
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="performance-report-${monthNames[targetMonth]}-${targetYear}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.end(pdfBuffer);
      resolve();
    });
    doc.on("error", reject);
  });
});
