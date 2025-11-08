const Report = require("../models/caseReportModel");
const Case = require("../models/caseModel");
const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { generatePdf } = require("../utils/generatePdf");
const moment = require("moment-timezone");
const QueryBuilder = require("../utils/queryBuilder");

// const moment = require("moment");
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
  res.status(201).json({
    data: {
      message: "success",
      result: report,
    },
  });
});

// get all reports except soft-deleted ones
// exports.getReports = catchAsync(async (req, res, next) => {
//   const reports = await Report.find({ isDeleted: false }).sort("-date");

//   res.status(200).json({
//     results: reports.length,
//     data: reports,
//   });
// });

// Create pagination service for Report model
const reportPagination = PaginationServiceFactory.createService(Report);

// Get reports for a specific case
// exports.getCaseReports = catchAsync(async (req, res, next) => {
//   const customFilter = { caseReported: req.params.caseId };
//   const result = await reportPagination.paginate(req.query, customFilter);

//   res.status(200).json(result);
// });

// // Search reports by specific criteria
// exports.searchReports = catchAsync(async (req, res, next) => {
//   const { criteria, options } = req.body;

//   const result = await reportPagination.advancedSearch(criteria, options);

//   res.status(200).json(result);
// });

// // Get soft-deleted reports
// exports.getDeletedReports = catchAsync(async (req, res, next) => {
//   const customFilter = { isDeleted: true };
//   const result = await reportPagination.paginate(req.query, customFilter);

//   res.status(200).json(result);
// });

// Get all reports with advanced pagination and filtering
exports.getReports = catchAsync(async (req, res, next) => {
  const result = await reportPagination.paginate(req.query);

  res.status(200).json(result);
});

// UPDATED: Advanced search with better error handling
exports.searchReports = catchAsync(async (req, res, next) => {
  const { criteria, options } = req.body;

  // Validate required fields
  if (!criteria) {
    return res.status(400).json({
      success: false,
      message: "Search criteria is required",
    });
  }

  try {
    const result = await reportPagination.advancedSearch(criteria, options);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid search criteria",
      error: error.message,
    });
  }
});

// Get reports for a specific case
exports.getCaseReports = catchAsync(async (req, res, next) => {
  const customFilter = { caseReported: req.params.caseId };

  const result = await reportPagination.paginate(req.query, customFilter);

  res.status(200).json(result);
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
  try {
    // Set the timezone to Nigeria
    const timezone = "Africa/Lagos";

    // get causeList for the current date
    const startOfToday = moment.tz(timezone).startOf("day");
    const endOfToday = moment.tz(timezone).endOf("day");

    // Get the start and end of the current week
    const startOfWeek = moment.tz(timezone).startOf("isoWeek"); // Start of the current ISO week
    const endOfWeek = moment.tz(timezone).endOf("isoWeek"); // End of the current ISO week

    // Get the start and end of the next week
    const startOfNextWeek = moment
      .tz(timezone)
      .add(1, "weeks")
      .startOf("isoWeek"); // Start of next ISO week
    const endOfNextWeek = moment.tz(timezone).add(1, "weeks").endOf("isoWeek"); // End of next ISO week

    // Get the start and end of the current month
    const startOfMonth = moment.tz(timezone).startOf("month");
    const endOfMonth = moment.tz(timezone).endOf("month");

    // Get the start and end of the current year
    const startOfYear = moment.tz(timezone).startOf("year");
    const endOfYear = moment.tz(timezone).endOf("year");

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

    // setRedisCache('causeListToday', reportsToday, 1200);

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
  } catch (error) {
    console.error("Error fetching upcoming matters:", error);
    res.status(500).json({
      message: "error",
      error: error.message,
    });
  }
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

// Add this to your reportController.js for debugging

/**
 * DEBUG ENDPOINT - Remove after fixing
 * Test report filtering and search
 */
exports.debugReportFilters = catchAsync(async (req, res, next) => {
  console.log("\n🔍 DEBUG: Report Filter Test");
  console.log("Query params:", req.query);

  // Test 1: Basic query
  const basicFilter = QueryBuilder.buildMongooseFilter(req.query, {
    searchableFields: ["update", "adjournedFor", "clientEmail"],
    filterableFields: [
      "reportedBy",
      "caseReported",
      "lawyersInCourt",
      "clientEmail",
      "caseId",
      "caseSearch",
    ],
    textFilterFields: ["clientEmail", "adjournedFor"],
    dateField: "date",
  });

  console.log("\n📋 Generated Filter:", JSON.stringify(basicFilter, null, 2));

  // Test 2: Count matching documents
  const count = await Report.countDocuments(basicFilter);
  console.log(`\n📊 Matching documents: ${count}`);

  // Test 3: Get sample documents
  const samples = await Report.find(basicFilter)
    .limit(3)
    .populate("caseReported", "suitNo firstParty secondParty")
    .populate("reportedBy", "firstName lastName");

  console.log(
    `\n📄 Sample Results:`,
    samples.map((s) => ({
      id: s._id,
      caseId: s.caseReported?._id,
      caseName: `${s.caseReported?.firstParty?.name?.[0]?.name} vs ${s.caseReported?.secondParty?.name?.[0]?.name}`,
      update: s.update?.substring(0, 50),
      adjournedFor: s.adjournedFor,
    }))
  );

  // Test 4: If caseSearch is provided, test case search
  if (req.query.caseSearch) {
    const Case = require("../models/caseModel");
    const matchingCases = await Case.find({
      $or: [
        {
          "firstParty.name.name": {
            $regex: req.query.caseSearch,
            $options: "i",
          },
        },
        {
          "secondParty.name.name": {
            $regex: req.query.caseSearch,
            $options: "i",
          },
        },
        { suitNo: { $regex: req.query.caseSearch, $options: "i" } },
      ],
      isDeleted: { $ne: true },
    }).select("suitNo firstParty secondParty");

    console.log(`\n🔍 Case Search "${req.query.caseSearch}":`);
    console.log(`   Found ${matchingCases.length} matching cases`);
    matchingCases.forEach((c) => {
      console.log(
        `   - ${c.firstParty.name?.[0]?.name} vs ${c.secondParty.name?.[0]?.name} (${c.suitNo})`
      );
    });
  }

  res.status(200).json({
    debug: true,
    queryParams: req.query,
    generatedFilter: basicFilter,
    matchingCount: count,
    samples: samples.map((s) => ({
      id: s._id,
      case: s.caseReported,
      update: s.update,
      adjournedFor: s.adjournedFor,
      reportedBy: s.reportedBy,
    })),
  });
});
