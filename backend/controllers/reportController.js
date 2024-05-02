const Report = require("../models/caseReportModel");
const Case = require("../models/caseModel"); // Import the Case model
const catchAsync = require("../utils/catchAsync");

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
  const reports = await Report.find();
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
