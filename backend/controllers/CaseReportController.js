const Report = require("../models/caseReportModel");
const Case = require("../models/caseModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { generatePdf } = require("../utils/generatePdf");

const moment = require("moment");
// const setRedisCache = require("../utils/setRedisCache");

// create report
exports.createReport = catchAsync(async (req, res, next) => {
  const { caseReported, clientEmail } = req.body;

  // Check if the case exists and populate the client
  if (caseReported && clientEmail) {
    const caseData = await Case.findById(caseReported).populate({
      path: "client",
      select: "email",
    });

    if (!caseData) {
      return next(new AppError("No case found with that ID", 404));
    }

    // Check if the case has an associated client
    if (!caseData.client) {
      return next(new AppError("No client associated with this case", 400));
    }

    // Check if the name/clientId/clientEmail matches the email in the client case
    if (caseData.client.email !== clientEmail) {
      return next(new AppError("Selected client does not match the case", 400));
    }
  }

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

// get single report
exports.getReport = catchAsync(async (req, res, next) => {
  const _id = req.params.reportId;
  const report = await Report.findById({ _id });

  res.status(200).json({
    message: "success",
    data: report,
  });
  //   next();
});

//update report
exports.updateCaseReport = catchAsync(async (req, res, next) => {
  const id = req.params.reportId;
  const { caseReported, clientEmail } = req.body;

  if (!id) {
    return next(new AppError("No report ID provided", 400));
  }

  // Check if the case exists and populate the client
  if (caseReported && clientEmail) {
    const caseData = await Case.findById(caseReported).populate({
      path: "client",
      select: "email",
    });

    if (!caseData) {
      return next(new AppError("No case found with that ID", 404));
    }

    // Check if the case has an associated client
    if (!caseData.client) {
      return next(new AppError("No client associated with this case", 400));
    }

    // Check if the clientEmail matches the email in the client case
    if (caseData.client.email !== clientEmail) {
      return next(new AppError("Selected client does not match the case", 400));
    }
  }

  const updatedReport = await Report.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedReport) {
    return next(new AppError("No report found with this ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: updatedReport,
  });
});

// delete report
exports.deleteReport = catchAsync(async (req, res, next) => {
  const report = await Report.findByIdAndDelete(req.params.id);

  if (!report) {
    return next(new AppError("No report found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// get Reports for week and month

exports.getUpcomingMatter = catchAsync(async (req, res, next) => {
  // get causeList fot the current date
  const startOfToday = moment().startOf("day");
  const endOfToday = moment().endOf("day");

  // Get the start and end of the current week
  const startOfWeek = moment().startOf("isoWeek"); // Start of the current ISO week
  const endOfWeek = moment().endOf("isoWeek"); // End of the current ISO week

  // Get the start and end of the next week
  const startOfNextWeek = moment().add(1, "weeks").startOf("isoWeek"); // Start of next ISO week
  const endOfNextWeek = moment().add(1, "weeks").endOf("isoWeek"); // End of next ISO week

  // Get the start and end of the current month
  const startOfMonth = moment().startOf("month");
  const endOfMonth = moment().endOf("month");

  // Get the start and end of the current year
  const startOfYear = moment().startOf("year");
  const endOfYear = moment().endOf("year");

  // Query for reports coming up today
  const reportsToday = await Report.find({
    adjournedDate: {
      $gte: startOfToday.toDate(),
      $lte: endOfToday.toDate(),
    },
  })
    .sort("adjournedDate")
    .select("caseReported adjournedFor adjournedDate");

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

  // Get reports for the current month
  const reportsThisMonth = await Report.find({
    adjournedDate: {
      $gte: startOfMonth.toDate(),
      $lt: endOfMonth.toDate(),
    },
  })
    .sort("adjournedDate")
    .select("caseReported adjournedFor adjournedDate");

  // Get reports for the current year
  const reportsThisYear = await Report.find({
    adjournedDate: {
      $gte: startOfYear.toDate(),
      $lt: endOfYear.toDate(),
    },
  })
    .sort("adjournedDate")
    .select("caseReported adjournedFor adjournedDate");

  // setRedisCache("causeListToday", reportsToday, 1200);

  res.status(200).json({
    message: "success",
    data: {
      reportsToday,
      todayResult: reportsToday.length,
      weekResults: reportsThisWeek.length,
      nextWeekResults: reportsNextWeek.length,
      monthResults: reportsThisMonth.length,
      yearResults: reportsThisYear.length,
      reportsThisWeek,
      reportsNextWeek,
      reportsThisMonth,
      reportsThisYear,
    },
  });
});

// generate reports in pdf format
exports.generateReportPdf = catchAsync(async (req, res, next) => {
  const report = await Report.findById(req.params.id);
  if (!report) {
    return next(new AppError("No report found with that ID", 404));
  }

  // Handle undefined data
  const safeReport = {
    caseReported: report.caseReported || null,
    date: report.date || Date.now(),
    update: report.update || "",
    adjournedFor: report.adjournedFor || "",
    adjournedDate: report.adjournedDate || Date.now(),
    reportedBy: report.reportedBy || null,
    lawyersInCourt: report.lawyersInCourt || [],
  };

  // generate pdf handler function
  generatePdf(
    { report: safeReport },
    res,
    "../views/report.pug",
    `../output/${Math.random()}_report.pdf`
  );
});

exports.generateCauseListWeek = catchAsync(async (req, res, next) => {
  // Get the start and end of the current week
  const startOfWeek = moment().startOf("isoWeek"); // Start of the current ISO week
  const endOfWeek = moment().endOf("isoWeek"); // End of the current ISO week

  const reports = await Report.find({
    adjournedDate: {
      $gte: startOfWeek.toDate(),
      $lt: endOfWeek.toDate(),
    },
  })
    .sort("adjournedDate")
    .select("caseReported adjournedFor adjournedDate");

  if (!reports || reports.length === 0) {
    return next(new AppError("No reports found", 404));
  }

  // Map through reports to ensure all fields are properly set
  const safeReports = reports.map((report) => ({
    caseReported: report.caseReported || null,
    date: report.date || Date.now(),
    adjournedFor: report.adjournedFor || "",
    adjournedDate: report.adjournedDate || Date.now(),
    lawyersInCourt: report.lawyersInCourt || [],
  }));

  // Generate PDF handler function
  generatePdf(
    { reports: safeReports },
    res,
    "../views/causeListWeek.pug",
    `../output/${Math.random()}_causeList.pdf`
  );
});
exports.generateCauseListNextWeek = catchAsync(async (req, res, next) => {
  // Get the start and end of the next week
  const startOfNextWeek = moment().add(1, "weeks").startOf("isoWeek"); // Start of next ISO week
  const endOfNextWeek = moment().add(1, "weeks").endOf("isoWeek"); // End of next ISO week

  // Get reports for the next week
  const reports = await Report.find({
    adjournedDate: {
      $gte: startOfNextWeek.toDate(),
      $lt: endOfNextWeek.toDate(),
    },
  })
    .sort("adjournedDate")
    .select("caseReported adjournedFor adjournedDate");

  if (!reports || reports.length === 0) {
    return next(new AppError("No reports found", 404));
  }

  // Map through reports to ensure all fields are properly set
  const safeReports = reports.map((report) => ({
    caseReported: report.caseReported || null,
    date: report.date || Date.now(),
    adjournedFor: report.adjournedFor || "",
    adjournedDate: report.adjournedDate || Date.now(),
    lawyersInCourt: report.lawyersInCourt || [],
  }));

  // Generate PDF handler function
  generatePdf(
    { reports: safeReports },
    res,
    "../views/causeListNextWeek.pug",
    `../output/${Math.random()}_causeList.pdf`
  );
});

// download cause list for the month
exports.generateCauseListMonth = catchAsync(async (req, res, next) => {
  // Get the start and end of the current week
  // Get the start and end of the current month
  const startOfMonth = moment().startOf("month");
  const endOfMonth = moment().endOf("month");

  // Get reports for the current month
  const reports = await Report.find({
    adjournedDate: {
      $gte: startOfMonth.toDate(),
      $lt: endOfMonth.toDate(),
    },
  })
    .sort("adjournedDate")
    .select("caseReported adjournedFor adjournedDate");

  if (!reports || reports.length === 0) {
    return next(new AppError("No reports found", 404));
  }

  // Map through reports to ensure all fields are properly set
  const safeReports = reports.map((report) => ({
    caseReported: report.caseReported || null,
    date: report.date || Date.now(),
    adjournedFor: report.adjournedFor || "",
    adjournedDate: report.adjournedDate || Date.now(),
    lawyersInCourt: report.lawyersInCourt || [],
  }));

  // Generate PDF handler function
  generatePdf(
    { reports: safeReports },
    res,
    "../views/causeListMonth.pug",
    `../output/${Math.random()}_causeList.pdf`
  );
});
