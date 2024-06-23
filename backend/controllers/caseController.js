const Case = require("../models/caseModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.createCase = catchAsync(async (req, res, next) => {
  const singleCase = await Case.create(req.body);
  res.status(201).json({
    data: singleCase,
  });
});

exports.getCases = catchAsync(async (req, res, next) => {
  const cases = await Case.find()
    .populate({ path: "client", select: "firstName secondName -_id -case" })
    .sort({ filingDate: -1 });
  // .populate({
  //   path: "task",
  //   select: "description status dateAssigned dueDate taskPriority",
  // })
  // .populate({ path: "reports", select: "date update" });
  res.status(200).json({
    results: cases.length,
    data: cases,
  });
});

exports.getCase = catchAsync(async (req, res, next) => {
  //if id/caseId provided does not exist
  const _id = req.params.caseId;
  const data = await Case.findById({ _id })
    .populate({
      path: "reports",
      select: "-caseReported",
    })
    .populate({ path: "documents" });

  if (!data) {
    return next(new AppError("No case found with that Id", 404));
  }
  res.status(200).json({
    data,
  });
});

exports.updateCase = catchAsync(async (req, res, next) => {
  const caseId = req.params.caseId;
  const updatedCase = await Case.findByIdAndUpdate({ _id: caseId }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedCase) {
    return next(
      new AppError(`No Case Found with ID: ${req.params.caseId}`, 404)
    );
  }

  res.status(200).json({
    message: "success",
    updatedCase,
  });
});

exports.deleteCase = catchAsync(async (req, res, next) => {
  const _id = req.params.caseId;
  const data = await Case.findByIdAndDelete({ _id });

  if (!data) {
    return next(new AppError("case with that Id does not exist", 404));
  }
  res.status(204).json({
    message: "Case deleted",
  });
});

exports.getCasesByAccountOfficer = catchAsync(async (req, res, next) => {
  const results = await Case.aggregate([
    {
      $unwind: "$accountOfficer",
    },
    {
      $lookup: {
        from: "users", //  users collection name
        localField: "accountOfficer",
        foreignField: "_id",
        as: "accountOfficerDetails",
      },
    },
    {
      $unwind: "$accountOfficerDetails", // Handle the case where multiple users might be returned
    },
    {
      $group: {
        _id: {
          $concat: [
            "$accountOfficerDetails.firstName",
            " ",
            "$accountOfficerDetails.lastName",
          ],
        },
        count: { $sum: 1 },
        parties: {
          $push: {
            $concat: [
              // Ensure these fields exist and contain data
              { $arrayElemAt: ["$firstParty.name.name", 0] },
              " vs ",
              { $arrayElemAt: ["$secondParty.name.name", 0] },
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        accountOfficer: "$_id",
        parties: 1,
        count: 1,
      },
    },
  ]);

  res.status(200).json({
    message: "success",
    data: results,
  });
});
exports.getCasesByClient = catchAsync(async (req, res, next) => {
  const results = await Case.aggregate([
    {
      $unwind: "$client",
    },
    {
      $lookup: {
        from: "clients", // Ensure this matches the name of the Client collection
        localField: "client",
        foreignField: "_id",
        as: "clientDetails",
      },
    },
    {
      $unwind: "$clientDetails", // Handle the case where multiple clients might be returned
    },
    {
      $group: {
        _id: {
          $concat: [
            "$clientDetails.firstName",
            " ",
            "$clientDetails.secondName",
          ],
        },
        count: { $sum: 1 },
        parties: {
          $push: {
            $concat: [
              // Ensure these fields exist and contain data
              { $arrayElemAt: ["$firstParty.name.name", 0] },
              " vs ",
              { $arrayElemAt: ["$secondParty.name.name", 0] },
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        client: "$_id",
        parties: 1,
        count: 1,
      },
    },
  ]);

  res.status(200).json({
    message: "success",
    data: results,
  });
});

// get newly file or new brief
exports.getMonthlyNewCases = catchAsync(async (req, res, next) => {
  const result = await Case.aggregate([
    {
      $group: {
        _id: { $month: "$filingDate" },
        parties: {
          $push: {
            $concat: [
              { $arrayElemAt: ["$firstParty.name.name", 0] },
              " vs ",
              { $arrayElemAt: ["$secondParty.name.name", 0] },
            ],
          },
        },
        count: { $sum: 1 },
      },
    },

    {
      $project: {
        _id: 0,
        month: "$_id",
        parties: 1,
        count: 1,
      },
    },
    {
      $sort: { month: 1 },
    },
  ]);

  res.status(200).json({
    message: "success",
    data: result,
  });
});

exports.getYearlyNewCases = catchAsync(async (req, res, next) => {
  const result = await Case.aggregate([
    {
      $group: {
        _id: { $year: "$filingDate" },
        parties: {
          $push: {
            $concat: [
              { $arrayElemAt: ["$firstParty.name.name", 0] },
              " vs ",
              { $arrayElemAt: ["$secondParty.name.name", 0] },
            ],
          },
        },
        count: { $sum: 1 },
      },
    },

    {
      $project: {
        _id: 0,
        year: "$_id",
        parties: 1,
        count: 1,
      },
    },
    {
      $sort: { year: 1 },
    },
  ]);

  res.status(200).json({
    message: "success",
    data: result,
  });
});
