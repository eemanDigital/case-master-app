const Report = require("../models/caseReportModel");
const catchAsync = require("../utils/catchAsync");
const moment = require("moment");

exports.createReport = catchAsync(async (req, res, next) => {
  // if (!req.body.case) req.body.case = req.params.tourId;
  //   if (!req.body.reporter) req.body.reporter = req.user.id;

  // Create a new report associated with the found case
  const report = await Report.create(req.body);
  res.status(200).json({
    data: {
      message: "success",
      result: report,
    },
  });
});

exports.getReports = catchAsync(async (req, res, next) => {
  const reports = await Report.find().sort("-date");
  // .populate({
  //   path: "task",
  //   select: "description status dateAssigned dueDate taskPriority",
  // })
  // .populate({ path: "reports", select: "date update" });
  res.status(200).json({
    results: reports.length,
    data: reports,
  });
});
exports.getReport = catchAsync(async (req, res, next) => {
  const _id = req.params.reportId;
  const report = await Report.findById({ _id });

  res.status(200).json({
    message: "success",
    data: report,
  });
  //   next();
});

// get Reports for week and month

exports.getUpcomingMatter = catchAsync(async (req, res, next) => {
  // Get the current date
  const currentDate = moment();

  // Get the date one week from now
  const nextWeek = moment().add(1, "weeks");

  // Get the date one month from now
  const nextMonth = moment().add(1, "months");

  // Get the date at the end of the current year
  const endOfYear = moment().endOf("year");

  // Get the start and end of the current week
  const startOfWeek = moment().startOf("isoWeek"); // Start of the current ISO week
  const endOfWeek = moment().endOf("isoWeek"); // End of the current ISO week

  // Get the start and end of the next week
  const startOfNextWeek = moment().add(1, "weeks").startOf("isoWeek"); // Start of next ISO week
  const endOfNextWeek = moment().add(1, "weeks").endOf("isoWeek"); // End of next ISO week

  // Get reports for the current week
  const reportsThisWeek = await Report.find({
    adjournedDate: {
      $gte: startOfWeek.toDate(),
      $lt: endOfWeek.toDate(),
    },
  })
    .sort("adjournedDate")
    .select("caseReported adjournedFor adjournedDate");

  // Get reports for the next week
  const reportsNextWeek = await Report.find({
    adjournedDate: {
      $gte: startOfNextWeek.toDate(),
      $lt: endOfNextWeek.toDate(),
    },
  })
    .sort("adjournedDate")
    .select("caseReported adjournedFor adjournedDate");

  // Get reports for the next month
  const reportsNextMonth = await Report.find({
    adjournedDate: {
      $gte: currentDate.toDate(),
      $lt: nextMonth.toDate(),
    },
  })
    .sort("adjournedDate")
    .select("caseReported adjournedFor adjournedDate  ");

  // Get reports for the rest of the year
  const reportsYear = await Report.find({
    adjournedDate: {
      $gte: currentDate.toDate(),
      $lt: endOfYear.toDate(),
    },
  })
    .sort("adjournedDate")
    .select("caseReported adjournedFor adjournedDate");

  res.status(200).json({
    message: "success",
    data: {
      weekResults: reportsThisWeek.length,
      nextWeekResults: reportsNextWeek.length,
      monthResults: reportsNextMonth.length,
      yearResults: reportsYear.length,
      reportsThisWeek,
      reportsNextWeek,
      reportsNextMonth,
      reportsYear,
    },
  });
});
