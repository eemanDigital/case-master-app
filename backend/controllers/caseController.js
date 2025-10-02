const Case = require("../models/caseModel");
const cron = require("node-cron"); //handle schedule for soft deleted data
const AppError = require("../utils/appError");
const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const catchAsync = require("../utils/catchAsync");
// const setRedisCache = require("../utils/setRedisCache");

// create new case
exports.createCase = catchAsync(async (req, res, next) => {
  const singleCase = await Case.create(req.body);
  res.status(201).json({
    message: "success",
    data: singleCase,
  });
});

/**
 * Controller function to fetch cases from the database.
 * If no cases are found, an error is returned.
 * The fetched cases are also stored in Redis.
 */
exports.getCases = catchAsync(async (req, res, next) => {
  const queryObj = {};
  let {
    caseSummary,
    accountOfficer,
    courtNo,
    sort,
    casePriority,
    natureOfCase,
    filingDate,
    order = "asc",
  } = req.query;
  if (caseSummary) {
    queryObj.caseSummary = { $regex: caseSummary, $options: "i" };
  }
  if (accountOfficer) {
    queryObj.accountOfficer = accountOfficer;
  }

  if (courtNo) {
    queryObj.courtNo = courtNo;
  }

  if (casePriority) {
    queryObj.casePriority = casePriority;
  }

  if (natureOfCase) {
    queryObj.natureOfCase = natureOfCase;
  }

  //sample query: http://localhost:3000/api/v1/cases?filingDate=2024-09-01
  if (filingDate) {
    const date = new Date(filingDate);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1); // Increment by one day
    queryObj.filingDate = { $gte: date, $lt: nextDate };
  }

  console.log("Query", queryObj);
  let results = Case.find(queryObj);

  if (sort) {
    const sortObj = {};
    // let sortOrder = sort.startsWith("-") ? -1 : 1;
    // sort = sort.replace("-", "");

    let sortOrder = order === "desc" ? -1 : 1;

    sortObj[sort] = sortOrder;

    results.sort(sortObj);
    console.log(sortObj);
  }

  const cases = await results;

  res.status(200).json({ cases });
});

// Create pagination service for Case model
const casePagination = PaginationServiceFactory.createService(Case);

// Replace your existing getCases with advanced pagination version
exports.getCases = catchAsync(async (req, res, next) => {
  const result = await casePagination.paginate(req.query);

  // Handle no cases found
  if (result.data.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No cases found",
      data: [],
      pagination: result.pagination,
    });
  }

  res.status(200).json(result);
});

// Advanced search for cases
exports.searchCases = catchAsync(async (req, res, next) => {
  const { criteria, options } = req.body;

  if (!criteria) {
    return res.status(400).json({
      success: false,
      message: "Search criteria is required",
    });
  }

  try {
    const result = await casePagination.advancedSearch(criteria, options);

    if (result.data.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No cases found matching your criteria",
        ...result,
      });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid search criteria",
      error: error.message,
    });
  }
});

// Get cases by specific lawyer
exports.getLawyerCases = catchAsync(async (req, res, next) => {
  const customFilter = { accountOfficer: req.params.accountOfficerId };

  console.log(customFilter);
  const result = await casePagination.paginate(req.query, customFilter);

  res.status(200).json(result);
});

// Get cases by status
exports.getCasesByStatus = catchAsync(async (req, res, next) => {
  const customFilter = { status: req.params.status };
  const result = await casePagination.paginate(req.query, customFilter);

  res.status(200).json(result);
});

// Get upcoming hearings
exports.getUpcomingHearings = catchAsync(async (req, res, next) => {
  const today = new Date();
  const customFilter = {
    nextHearingDate: { $gte: today },
    isDeleted: { $ne: true },
  };

  const result = await casePagination.paginate(
    { ...req.query, sort: "nextHearingDate" },
    customFilter
  );

  res.status(200).json(result);
});

// Get cases filed within date range
exports.getCasesByFilingDate = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return next(new AppError("Start date and end date are required", 400));
  }

  const customFilter = {
    filingDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  };

  const result = await casePagination.paginate(req.query, customFilter);
  res.status(200).json(result);
});

// get single case by id
exports.getCase = catchAsync(async (req, res, next) => {
  //if id/caseId provided does not exist
  const _id = req.params.caseId;
  const data = await Case.findById({ _id })
    .populate({
      path: "reports",
      select: "-caseReported",
    })
    .populate({ path: "client", select: "firstName secondName email " });

  if (!data) {
    return next(new AppError("No case found with that Id", 404));
  }

  // set redis key for caching
  // setRedisCache(`singleCase:${req.params.caseId}`, data);

  res.status(200).json({
    fromCache: false,
    data,
  });
});

// update case by id
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

// Soft delete a case
exports.deleteCase = catchAsync(async (req, res, next) => {
  // Find the case by ID
  const caseData = await Case.findById(req.params.caseId);

  // If the case does not exist, return a 404 error
  if (caseData) {
    await caseData.softDelete();
  } else {
    return next(new AppError("Case with that Id does not exist", 404));
  }

  // Respond with a 204 status and a message
  res.status(204).json({
    message: "Case deleted",
  });
});

// Get cases grouped by account officer
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
  // setRedisCache("casesao", results, 1200);

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
        from: "users",
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
  // setRedisCache("cbc", results, 1200);

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
  // setRedisCache("mnc", result, 1200);

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: result,
  });
});

// get all new cases within year handler
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
  // setRedisCache("ync", result, 1200);

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: result,
  });
});
