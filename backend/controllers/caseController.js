const Case = require("../models/caseModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const setRedisCache = require("../utils/setRedisCache");

exports.createCase = catchAsync(async (req, res, next) => {
  const singleCase = await Case.create(req.body);
  res.status(201).json({
    data: singleCase,
  });
});

// exports.getCases = catchAsync(async (req, res, next) => {
//   const redisKey = "cases"; // Define a key to store the cases in Redis

//   // Fetch cases from the database
//   let cases = await Case.find().sort("-filingDate");

//   // Handle the case where no cases are found
//   if (cases.length === 0) {
//     return next(new AppError("No case found", 404));
//   }

//   // Store the fetched cases in Redis
//   await redisClient.set(redisKey, JSON.stringify(cases), {
//     EX: 600, // Remove data after 10min
//     NX: true,
//   });

//   // Send the response
//   res.status(200).json({
//     results: cases.length,
//     fromCache: false,
//     data: cases,
//   });
// });

/**
 * Controller function to fetch cases from the database.
 * If no cases are found, an error is returned.
 * The fetched cases are also stored in Redis.
 */
exports.getCases = catchAsync(async (req, res, next) => {
  // Fetch cases from the database
  let cases = await Case.find().sort("-filingDate");

  // Handle the case where no cases are found
  if (cases.length === 0) {
    return next(new AppError("No case found", 404));
  }

  // set redis key for caching
  setRedisCache("cases", cases);

  // Send the response with the fetched cases
  res.status(200).json({
    results: cases.length,
    fromCache: false,
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
    .populate({ path: "client", select: "firstName secondName " });

  if (!data) {
    return next(new AppError("No case found with that Id", 404));
  }

  // set redis key for caching
  setRedisCache("singleCase", data);

  res.status(200).json({
    fromCache: false,
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
  // const _id = req.params.caseId;
  const data = await Case.findByIdAndDelete(req.params.caseId);

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

  // set redis key for caching
  setRedisCache("casesao", results, 1200);

  res.status(200).json({
    message: "success",
    fromCache: false,
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

  // set redis key for caching
  setRedisCache("cbc", results, 1200);

  res.status(200).json({
    message: "success",
    fromCache: false,
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

  // set redis key for caching
  setRedisCache("mnc", result, 1200);

  res.status(200).json({
    message: "success",
    fromCache: false,
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

  // set redis key for caching
  setRedisCache("ync", result, 1200);

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: result,
  });
});
