// const Case = require("../models/caseModel");
// const cron = require("node-cron"); //handle schedule for soft deleted data
// const AppError = require("../utils/appError");
// const PaginationServiceFactory = require("../services/PaginationServiceFactory");
// const catchAsync = require("../utils/catchAsync");
// // const setRedisCache = require("../utils/setRedisCache");

// // create new case
// exports.createCase = catchAsync(async (req, res, next) => {
//   const singleCase = await Case.create(req.body);
//   res.status(201).json({
//     message: "success",
//     data: singleCase,
//   });
// });

// /**
//  * Controller function to fetch cases from the database.
//  * If no cases are found, an error is returned.
//  * The fetched cases are also stored in Redis.
//  */
// // exports.getCases = catchAsync(async (req, res, next) => {
// //   const queryObj = {};
// //   let {
// //     caseSummary,
// //     accountOfficer,
// //     courtNo,
// //     sort,
// //     casePriority,
// //     natureOfCase,
// //     filingDate,
// //     order = "asc",
// //   } = req.query;
// //   if (caseSummary) {
// //     queryObj.caseSummary = { $regex: caseSummary, $options: "i" };
// //   }
// //   if (accountOfficer) {
// //     queryObj.accountOfficer = accountOfficer;
// //   }

// //   if (courtNo) {
// //     queryObj.courtNo = courtNo;
// //   }

// //   if (casePriority) {
// //     queryObj.casePriority = casePriority;
// //   }

// //   if (natureOfCase) {
// //     queryObj.natureOfCase = natureOfCase;
// //   }

// //   //sample query: http://localhost:3000/api/v1/cases?filingDate=2024-09-01
// //   if (filingDate) {
// //     const date = new Date(filingDate);
// //     const nextDate = new Date(date);
// //     nextDate.setDate(nextDate.getDate() + 1); // Increment by one day
// //     queryObj.filingDate = { $gte: date, $lt: nextDate };
// //   }

// //   console.log("Query", queryObj);
// //   let results = Case.find(queryObj);

// //   if (sort) {
// //     const sortObj = {};
// //     // let sortOrder = sort.startsWith("-") ? -1 : 1;
// //     // sort = sort.replace("-", "");

// //     let sortOrder = order === "desc" ? -1 : 1;

// //     sortObj[sort] = sortOrder;

// //     results.sort(sortObj);
// //     console.log(sortObj);
// //   }

// //   const cases = await results;

// //   res.status(200).json({ cases });
// // });

// // Create pagination service for Case model
// const casePagination = PaginationServiceFactory.createService(Case);

// // Get all cases with advanced pagination
// exports.getCases = catchAsync(async (req, res, next) => {
//   const result = await casePagination.paginate(req.query);

//   if (result.data.length === 0) {
//     return res.status(200).json({
//       success: true,
//       message: "No cases found",
//       data: [],
//       pagination: result.pagination,
//     });
//   }

//   res.status(200).json(result);
// });

// // Advanced search for cases
// exports.searchCases = catchAsync(async (req, res, next) => {
//   const { criteria, options } = req.body;

//   if (!criteria) {
//     return res.status(400).json({
//       success: false,
//       message: "Search criteria is required",
//     });
//   }

//   try {
//     const result = await casePagination.advancedSearch(criteria, options);

//     if (result.data.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message: "No cases found matching your criteria",
//         ...result,
//       });
//     }

//     res.status(200).json(result);
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: "Invalid search criteria",
//       error: error.message,
//     });
//   }
// });

// // Get cases by status
// exports.getCasesByStatus = catchAsync(async (req, res, next) => {
//   const customFilter = { caseStatus: req.params.status };
//   const result = await casePagination.paginate(req.query, customFilter);

//   res.status(200).json(result);
// });

// // Get cases by account officer
// exports.getCasesByAccountOfficer = catchAsync(async (req, res, next) => {
//   const customFilter = { accountOfficer: req.params.accountOfficerId };
//   const result = await casePagination.paginate(req.query, customFilter);

//   res.status(200).json(result);
// });

// // Get cases by client
// exports.getCasesByClient = catchAsync(async (req, res, next) => {
//   const customFilter = { client: req.params.clientId };
//   const result = await casePagination.paginate(req.query, customFilter);

//   res.status(200).json(result);
// });

// // Get cases by court
// exports.getCasesByCourt = catchAsync(async (req, res, next) => {
//   const customFilter = { courtName: req.params.courtName };
//   const result = await casePagination.paginate(req.query, customFilter);

//   res.status(200).json(result);
// });

// // Get cases by category
// exports.getCasesByCategory = catchAsync(async (req, res, next) => {
//   const customFilter = { category: req.params.category };
//   const result = await casePagination.paginate(req.query, customFilter);

//   res.status(200).json(result);
// });

// // Get cases by priority
// exports.getCasesByPriority = catchAsync(async (req, res, next) => {
//   const customFilter = { casePriority: req.params.priority };
//   const result = await casePagination.paginate(req.query, customFilter);

//   res.status(200).json(result);
// });

// // Get active cases (default)
// exports.getActiveCases = catchAsync(async (req, res, next) => {
//   const customFilter = { active: true, isDeleted: { $ne: true } };
//   const result = await casePagination.paginate(req.query, customFilter);

//   res.status(200).json(result);
// });

// // get single case by id
// exports.getCase = catchAsync(async (req, res, next) => {
//   //if id/caseId provided does not exist
//   const _id = req.params.caseId;
//   const data = await Case.findById({ _id })
//     .populate({
//       path: "reports",
//       select: "-caseReported",
//     })
//     .populate({ path: "client", select: "firstName secondName email " });

//   if (!data) {
//     return next(new AppError("No case found with that Id", 404));
//   }

//   // set redis key for caching
//   // setRedisCache(`singleCase:${req.params.caseId}`, data);

//   res.status(200).json({
//     fromCache: false,
//     data,
//   });
// });

// // update case by id
// exports.updateCase = catchAsync(async (req, res, next) => {
//   const caseId = req.params.caseId;
//   const updatedCase = await Case.findByIdAndUpdate({ _id: caseId }, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!updatedCase) {
//     return next(
//       new AppError(`No Case Found with ID: ${req.params.caseId}`, 404)
//     );
//   }

//   res.status(200).json({
//     message: "success",
//     updatedCase,
//   });
// });

// // Soft delete a case
// exports.deleteCase = catchAsync(async (req, res, next) => {
//   // Find the case by ID
//   const caseData = await Case.findById(req.params.caseId);

//   // If the case does not exist, return a 404 error
//   if (caseData) {
//     await caseData.softDelete();
//   } else {
//     return next(new AppError("Case with that Id does not exist", 404));
//   }

//   // Respond with a 204 status and a message
//   res.status(204).json({
//     message: "Case deleted",
//   });
// });

// // Get cases grouped by account officer
// exports.getCasesByAccountOfficer = catchAsync(async (req, res, next) => {
//   const results = await Case.aggregate([
//     {
//       $unwind: "$accountOfficer",
//     },
//     {
//       $lookup: {
//         from: "users", //  users collection name
//         localField: "accountOfficer",
//         foreignField: "_id",
//         as: "accountOfficerDetails",
//       },
//     },
//     {
//       $unwind: "$accountOfficerDetails", // Handle the case where multiple users might be returned
//     },
//     {
//       $group: {
//         _id: {
//           $concat: [
//             "$accountOfficerDetails.firstName",
//             " ",
//             "$accountOfficerDetails.lastName",
//           ],
//         },
//         count: { $sum: 1 },
//         parties: {
//           $push: {
//             $concat: [
//               // Ensure these fields exist and contain data
//               { $arrayElemAt: ["$firstParty.name.name", 0] },
//               " vs ",
//               { $arrayElemAt: ["$secondParty.name.name", 0] },
//             ],
//           },
//         },
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//         accountOfficer: "$_id",
//         parties: 1,
//         count: 1,
//       },
//     },
//   ]);

//   // set redis key for caching
//   // setRedisCache("casesao", results, 1200);

//   res.status(200).json({
//     message: "success",
//     fromCache: false,
//     data: results,
//   });
// });

// exports.getCasesByClient = catchAsync(async (req, res, next) => {
//   const results = await Case.aggregate([
//     {
//       $unwind: "$client",
//     },
//     {
//       $lookup: {
//         from: "users",
//         localField: "client",
//         foreignField: "_id",
//         as: "clientDetails",
//       },
//     },
//     {
//       $unwind: "$clientDetails", // Handle the case where multiple clients might be returned
//     },
//     {
//       $group: {
//         _id: {
//           $concat: [
//             "$clientDetails.firstName",
//             " ",
//             "$clientDetails.secondName",
//           ],
//         },
//         count: { $sum: 1 },
//         parties: {
//           $push: {
//             $concat: [
//               // Ensure these fields exist and contain data
//               { $arrayElemAt: ["$firstParty.name.name", 0] },
//               " vs ",
//               { $arrayElemAt: ["$secondParty.name.name", 0] },
//             ],
//           },
//         },
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//         client: "$_id",
//         parties: 1,
//         count: 1,
//       },
//     },
//   ]);

//   // set redis key for caching
//   // setRedisCache("cbc", results, 1200);

//   res.status(200).json({
//     message: "success",
//     fromCache: false,
//     data: results,
//   });
// });

// // get newly file or new brief
// exports.getMonthlyNewCases = catchAsync(async (req, res, next) => {
//   const result = await Case.aggregate([
//     {
//       $group: {
//         _id: { $month: "$filingDate" },
//         parties: {
//           $push: {
//             $concat: [
//               { $arrayElemAt: ["$firstParty.name.name", 0] },
//               " vs ",
//               { $arrayElemAt: ["$secondParty.name.name", 0] },
//             ],
//           },
//         },
//         count: { $sum: 1 },
//       },
//     },

//     {
//       $project: {
//         _id: 0,
//         month: "$_id",
//         parties: 1,
//         count: 1,
//       },
//     },
//     {
//       $sort: { month: 1 },
//     },
//   ]);

//   // set redis key for caching
//   // setRedisCache("mnc", result, 1200);

//   res.status(200).json({
//     message: "success",
//     fromCache: false,
//     data: result,
//   });
// });

// // get all new cases within year handler
// exports.getYearlyNewCases = catchAsync(async (req, res, next) => {
//   const result = await Case.aggregate([
//     {
//       $group: {
//         _id: { $year: "$filingDate" },
//         parties: {
//           $push: {
//             $concat: [
//               { $arrayElemAt: ["$firstParty.name.name", 0] },
//               " vs ",
//               { $arrayElemAt: ["$secondParty.name.name", 0] },
//             ],
//           },
//         },
//         count: { $sum: 1 },
//       },
//     },

//     {
//       $project: {
//         _id: 0,
//         year: "$_id",
//         parties: 1,
//         count: 1,
//       },
//     },
//     {
//       $sort: { year: 1 },
//     },
//   ]);

//   // set redis key for caching
//   // setRedisCache("ync", result, 1200);

//   res.status(200).json({
//     message: "success",
//     fromCache: false,
//     data: result,
//   });
// });

const Case = require("../models/caseModel");
const cron = require("node-cron");
const AppError = require("../utils/appError");
const PaginationServiceFactory = require("../services/PaginationServiceFactory");
const catchAsync = require("../utils/catchAsync");
// const setRedisCache = require("../utils/setRedisCache");

// Create pagination service for Case model
const casePagination = PaginationServiceFactory.createService(Case);

// Projection configurations for optimized queries
const CASE_LIST_PROJECTION = {
  caseNumber: 1,
  caseStatus: 1,
  casePriority: 1,
  courtName: 1,
  filingDate: 1,
  firstParty: 1,
  secondParty: 1,
  accountOfficer: 1,
  client: 1,
  category: 1,
  natureOfCase: 1,
  modeOfCommencement: 1,
  active: 1,
};

const CASE_DETAIL_PROJECTION = {
  __v: 0,
  createdAt: 0,
  updatedAt: 0,
};

// create new case
exports.createCase = catchAsync(async (req, res, next) => {
  const singleCase = await Case.create(req.body);

  // Invalidate relevant cache entries
  // clearCachePattern('dashboard-stats:*');
  // clearCachePattern('cases:*');

  res.status(201).json({
    message: "success",
    data: singleCase,
  });
});

// Get all cases with advanced pagination and optimized projection
exports.getCases = catchAsync(async (req, res, next) => {
  const result = await casePagination.paginate(
    req.query,
    {},
    CASE_LIST_PROJECTION
  );

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

// Advanced search for cases with optimization
exports.searchCases = catchAsync(async (req, res, next) => {
  const { criteria, options } = req.body;

  if (!criteria) {
    return res.status(400).json({
      success: false,
      message: "Search criteria is required",
    });
  }

  try {
    const result = await casePagination.advancedSearch(criteria, {
      ...options,
      projection: CASE_LIST_PROJECTION,
    });

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

// Optimized filtered case routes
exports.getCasesByStatus = catchAsync(async (req, res, next) => {
  const customFilter = { caseStatus: req.params.status };
  const result = await casePagination.paginate(
    req.query,
    customFilter,
    CASE_LIST_PROJECTION
  );
  res.status(200).json(result);
});

exports.getCasesByAccountOfficer = catchAsync(async (req, res, next) => {
  const customFilter = { accountOfficer: req.params.accountOfficerId };
  const result = await casePagination.paginate(
    req.query,
    customFilter,
    CASE_LIST_PROJECTION
  );
  res.status(200).json(result);
});

exports.getCasesByClient = catchAsync(async (req, res, next) => {
  const customFilter = { client: req.params.clientId };
  const result = await casePagination.paginate(
    req.query,
    customFilter,
    CASE_LIST_PROJECTION
  );
  res.status(200).json(result);
});

exports.getCasesByCourt = catchAsync(async (req, res, next) => {
  const customFilter = { courtName: req.params.courtName };
  const result = await casePagination.paginate(
    req.query,
    customFilter,
    CASE_LIST_PROJECTION
  );
  res.status(200).json(result);
});

exports.getCasesByCategory = catchAsync(async (req, res, next) => {
  const customFilter = { category: req.params.category };
  const result = await casePagination.paginate(
    req.query,
    customFilter,
    CASE_LIST_PROJECTION
  );
  res.status(200).json(result);
});

exports.getCasesByPriority = catchAsync(async (req, res, next) => {
  const customFilter = { casePriority: req.params.priority };
  const result = await casePagination.paginate(
    req.query,
    customFilter,
    CASE_LIST_PROJECTION
  );
  res.status(200).json(result);
});

exports.getActiveCases = catchAsync(async (req, res, next) => {
  const customFilter = { active: true, isDeleted: { $ne: true } };
  const result = await casePagination.paginate(
    req.query,
    customFilter,
    CASE_LIST_PROJECTION
  );
  res.status(200).json(result);
});

// Optimized single case retrieval with selective population
exports.getCase = catchAsync(async (req, res, next) => {
  const _id = req.params.caseId;
  const data = await Case.findById({ _id })
    .populate({
      path: "reports",
      select: "title reportDate status createdAt", // Only necessary fields
      options: { sort: { reportDate: -1 }, limit: 10 }, // Limit to recent reports
    })
    .populate({
      path: "client",
      select: "firstName secondName email phone profileImage",
    })
    .populate({
      path: "accountOfficer",
      select: "firstName lastName email phone role",
    })
    .select(CASE_DETAIL_PROJECTION)
    .lean(); // Use lean for better performance

  if (!data) {
    return next(new AppError("No case found with that Id", 404));
  }

  // setRedisCache(`singleCase:${req.params.caseId}`, data);
  res.status(200).json({
    fromCache: false,
    data,
  });
});

// Optimized update case
exports.updateCase = catchAsync(async (req, res, next) => {
  const caseId = req.params.caseId;
  const updatedCase = await Case.findByIdAndUpdate({ _id: caseId }, req.body, {
    new: true,
    runValidators: true,
    select: CASE_DETAIL_PROJECTION,
  }).lean();

  if (!updatedCase) {
    return next(
      new AppError(`No Case Found with ID: ${req.params.caseId}`, 404)
    );
  }

  // Invalidate cache
  // clearCachePattern(`singleCase:${caseId}`);
  // clearCachePattern('dashboard-stats:*');

  res.status(200).json({
    message: "success",
    updatedCase,
  });
});

// Soft delete a case
exports.deleteCase = catchAsync(async (req, res, next) => {
  const caseData = await Case.findById(req.params.caseId);

  if (caseData) {
    await caseData.softDelete();

    // Invalidate cache
    // clearCachePattern(`singleCase:${req.params.caseId}`);
    // clearCachePattern('dashboard-stats:*');
    // clearCachePattern('cases:*');
  } else {
    return next(new AppError("Case with that Id does not exist", 404));
  }

  res.status(204).json({
    message: "Case deleted",
  });
});

// Single optimized dashboard stats endpoint
exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const matchStage = { isDeleted: { $ne: true } };

  // Single aggregation pipeline for all stats
  const dashboardStats = await Case.aggregate([
    { $match: matchStage },
    {
      $facet: {
        // Total counts
        totalCases: [{ $count: "count" }],
        activeCases: [{ $match: { active: true } }, { $count: "count" }],

        // Grouped statistics
        casesByStatus: [{ $group: { _id: "$caseStatus", count: { $sum: 1 } } }],
        casesByCourt: [{ $group: { _id: "$courtName", count: { $sum: 1 } } }],
        casesByNature: [
          { $group: { _id: "$natureOfCase", count: { $sum: 1 } } },
        ],
        casesByRating: [
          { $group: { _id: "$casePriority", count: { $sum: 1 } } },
        ],
        casesByMode: [
          { $group: { _id: "$modeOfCommencement", count: { $sum: 1 } } },
        ],
        casesByCategory: [{ $group: { _id: "$category", count: { $sum: 1 } } }],

        // Monthly and yearly cases - optimized without heavy parties array
        monthlyNewCases: [
          {
            $group: {
              _id: { $month: "$filingDate" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          {
            $project: {
              _id: 0,
              month: "$_id",
              count: 1,
            },
          },
        ],

        yearlyNewCases: [
          {
            $group: {
              _id: { $year: "$filingDate" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          {
            $project: {
              _id: 0,
              year: "$_id",
              count: 1,
            },
          },
        ],
      },
    },
  ]);

  // Parallel lookups for account officer and client cases
  const [casesByAccountOfficer, casesByClient] = await Promise.all([
    // Cases by Account Officer - optimized
    Case.aggregate([
      { $match: matchStage },
      { $unwind: "$accountOfficer" },
      {
        $lookup: {
          from: "users",
          localField: "accountOfficer",
          foreignField: "_id",
          as: "accountOfficerDetails",
          pipeline: [
            {
              $project: {
                firstName: 1,
                lastName: 1,
                email: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$accountOfficerDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$accountOfficer",
          accountOfficerName: {
            $first: {
              $cond: {
                if: "$accountOfficerDetails",
                then: {
                  $concat: [
                    "$accountOfficerDetails.firstName",
                    " ",
                    "$accountOfficerDetails.lastName",
                  ],
                },
                else: "Unassigned",
              },
            },
          },
          count: { $sum: 1 },
          email: { $first: "$accountOfficerDetails.email" },
        },
      },
      {
        $project: {
          _id: 0,
          accountOfficerId: "$_id",
          accountOfficer: "$accountOfficerName",
          email: 1,
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]),

    // Cases by Client - optimized
    Case.aggregate([
      { $match: matchStage },
      { $unwind: "$client" },
      {
        $lookup: {
          from: "users",
          localField: "client",
          foreignField: "_id",
          as: "clientDetails",
          pipeline: [
            {
              $project: {
                firstName: 1,
                secondName: 1,
                email: 1,
              },
            },
          ],
        },
      },
      { $unwind: { path: "$clientDetails", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$client",
          clientName: {
            $first: {
              $cond: {
                if: "$clientDetails",
                then: {
                  $concat: [
                    "$clientDetails.firstName",
                    " ",
                    "$clientDetails.secondName",
                  ],
                },
                else: "Unknown Client",
              },
            },
          },
          count: { $sum: 1 },
          email: { $first: "$clientDetails.email" },
        },
      },
      {
        $project: {
          _id: 0,
          clientId: "$_id",
          client: "$clientName",
          email: 1,
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  const stats = dashboardStats[0];

  // Format response
  const response = {
    status: "success",
    data: {
      totalCases: stats.totalCases[0]?.count || 0,
      activeCases: stats.activeCases[0]?.count || 0,
      casesByStatus: stats.casesByStatus,
      casesByCourt: stats.casesByCourt,
      casesByNature: stats.casesByNature,
      casesByRating: stats.casesByRating,
      casesByMode: stats.casesByMode,
      casesByCategory: stats.casesByCategory,
      casesByAccountOfficer,
      casesByClient,
      monthlyNewCases: stats.monthlyNewCases,
      yearlyNewCases: stats.yearlyNewCases,
    },
  };

  // Cache the response
  // setRedisCache(`dashboard-stats:${req.user.id}`, response, 300); // 5 minutes cache

  res.status(200).json(response);
});

// Optimized aggregate endpoints (keep for backward compatibility if needed)
exports.getCasesByAccountOfficerAggregate = catchAsync(
  async (req, res, next) => {
    const results = await Case.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $unwind: "$accountOfficer" },
      {
        $lookup: {
          from: "users",
          localField: "accountOfficer",
          foreignField: "_id",
          as: "accountOfficerDetails",
          pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
        },
      },
      {
        $unwind: {
          path: "$accountOfficerDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$accountOfficer",
          accountOfficerName: {
            $first: {
              $cond: {
                if: "$accountOfficerDetails",
                then: {
                  $concat: [
                    "$accountOfficerDetails.firstName",
                    " ",
                    "$accountOfficerDetails.lastName",
                  ],
                },
                else: "Unassigned",
              },
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          accountOfficer: "$accountOfficerName",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      message: "success",
      fromCache: false,
      data: results,
    });
  }
);

exports.getCasesByClientAggregate = catchAsync(async (req, res, next) => {
  const results = await Case.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $unwind: "$client" },
    {
      $lookup: {
        from: "users",
        localField: "client",
        foreignField: "_id",
        as: "clientDetails",
        pipeline: [{ $project: { firstName: 1, secondName: 1 } }],
      },
    },
    { $unwind: { path: "$clientDetails", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$client",
        clientName: {
          $first: {
            $cond: {
              if: "$clientDetails",
              then: {
                $concat: [
                  "$clientDetails.firstName",
                  " ",
                  "$clientDetails.secondName",
                ],
              },
              else: "Unknown Client",
            },
          },
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        client: "$clientName",
        count: 1,
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: results,
  });
});

// Optimized monthly and yearly cases without heavy parties data
exports.getMonthlyNewCases = catchAsync(async (req, res, next) => {
  const result = await Case.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: { $month: "$filingDate" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        month: "$_id",
        count: 1,
      },
    },
    {
      $sort: { month: 1 },
    },
  ]);

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: result,
  });
});

exports.getYearlyNewCases = catchAsync(async (req, res, next) => {
  const result = await Case.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: { $year: "$filingDate" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        year: "$_id",
        count: 1,
      },
    },
    {
      $sort: { year: 1 },
    },
  ]);

  res.status(200).json({
    message: "success",
    fromCache: false,
    data: result,
  });
});

// Utility function for cache clearing (if using Redis)
const clearCachePattern = async (pattern) => {
  // Implementation depends on your Redis setup
  // Example:
  // const keys = await redis.keys(pattern);
  // if (keys.length > 0) await redis.del(keys);
};
