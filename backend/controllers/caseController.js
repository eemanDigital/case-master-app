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
// exports.getCase = catchAsync(async (req, res, next) => {
//   const _id = req.params.caseId;
//   const data = await Case.findById({ _id })
//     .populate({
//       path: "reports",
//       select: "title reportDate status createdAt", // Only necessary fields
//       options: { sort: { reportDate: -1 }, limit: 10 }, // Limit to recent reports
//     })
//     .populate({
//       path: "client",
//       select: "firstName secondName email phone profileImage",
//     })
//     .populate({
//       path: "accountOfficer",
//       select: "firstName lastName email phone role",
//     })
//     .select(CASE_DETAIL_PROJECTION)
//     .lean(); // Use lean for better performance

//   if (!data) {
//     return next(new AppError("No case found with that Id", 404));
//   }

//   // setRedisCache(`singleCase:${req.params.caseId}`, data);
//   res.status(200).json({
//     fromCache: false,
//     data,
//   });
// });
// In your caseController.js - Fix the getCase function
// exports.getCase = catchAsync(async (req, res, next) => {
//   const _id = req.params.caseId;

//   const data = await Case.findById({ _id })
//     .populate({
//       path: "reports", // ✅ This is the VIRTUAL field
//       select: "date update adjournedFor adjournedDate clientEmail",
//       options: { sort: { date: -1 } },
//       populate: [
//         {
//           path: "reportedBy",
//           select: "firstName lastName middleName",
//         },
//         {
//           path: "lawyersInCourt",
//           select: "firstName lastName middleName",
//         },
//       ],
//     })
//     .populate({
//       path: "client",
//       select: "firstName secondName email phone profileImage",
//     })
//     .populate({
//       path: "accountOfficer",
//       select: "firstName lastName email phone role",
//     })
//     .select(CASE_DETAIL_PROJECTION);

//   if (!data) {
//     return next(new AppError("No case found with that Id", 404));
//   }

//   // ✅ Debug: Check if reports are populated
//   // console.log("🔍 Case Reports Debug:", {
//   //   caseId: _id,
//   //   suitNo: data.suitNo,
//   //   reportsCount: data.reports ? data.reports.length : 0,
//   //   reports: data.reports ? data.reports.map((r) => r._id) : "No reports",
//   // });

//   res.status(200).json({
//     fromCache: false,
//     data,
//   });
// });
exports.getCase = catchAsync(async (req, res, next) => {
  const _id = req.params.caseId;

  const data = await Case.findById({ _id })
    .populate({
      path: "reports",
      select: "date update adjournedFor adjournedDate clientEmail",
      options: { sort: { date: -1 } },
      populate: [
        {
          path: "reportedBy",
          select: "firstName lastName middleName",
        },
        {
          path: "lawyersInCourt",
          select: "firstName lastName middleName",
        },
      ],
    })
    .populate({
      path: "client",
      select: "firstName secondName email phone profileImage",
    })
    .populate({
      path: "accountOfficer",
      select: "firstName lastName email phone role",
    })
    // ✅ ADD DOCUMENT POPULATION
    .populate({
      path: "documents",
      select:
        "fileName originalName fileUrl fileSize fileType mimeType description category uploadedBy createdAt downloadCount",
      options: { sort: { createdAt: -1 } },
      populate: {
        path: "uploadedBy",
        select: "firstName lastName email",
      },
      match: {
        isDeleted: { $ne: true },
        isArchived: { $ne: true },
      },
    })
    .select(CASE_DETAIL_PROJECTION);

  if (!data) {
    return next(new AppError("No case found with that Id", 404));
  }

  // ✅ Debug: Check if documents and reports are populated
  // console.log("🔍 Case Population Debug:", {
  //   caseId: _id,
  //   suitNo: data.suitNo,
  //   reportsCount: data.reports ? data.reports.length : 0,
  //   documentsCount: data.documents ? data.documents.length : 0,
  //   documents: data.documents
  //     ? data.documents.map((d) => ({
  //         id: d._id,
  //         name: d.fileName,
  //         type: d.fileType,
  //       }))
  //     : "No documents",
  // });

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
          accountOfficerId: { $first: "$accountOfficer" }, // Keep the ID for API calls
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
          // Only include minimal case info for the chart
          parties: {
            $push: {
              $concat: [
                {
                  $ifNull: [
                    { $arrayElemAt: ["$firstParty.name.name", 0] },
                    "Unknown",
                  ],
                },
                " vs ",
                {
                  $ifNull: [
                    { $arrayElemAt: ["$secondParty.name.name", 0] },
                    "Unknown",
                  ],
                },
              ],
            },
          },
          // Include just suit numbers and status for quick reference
          caseSummary: {
            $push: {
              suitNo: "$suitNo",
              status: "$caseStatus",
              priority: "$casePriority",
            },
          },
          // Statistics for the chart
          statusBreakdown: {
            $push: "$caseStatus",
          },
          priorityBreakdown: {
            $push: "$casePriority",
          },
        },
      },
      {
        $project: {
          _id: 0,
          accountOfficerId: 1,
          accountOfficer: "$accountOfficerName",
          count: 1,
          parties: 1,
          caseSummary: 1,
          statusBreakdown: 1,
          priorityBreakdown: 1,
          // Calculate metrics
          activeCases: {
            $size: {
              $filter: {
                input: "$statusBreakdown",
                as: "status",
                cond: { $eq: ["$$status", "pending"] },
              },
            },
          },
          highPriorityCases: {
            $size: {
              $filter: {
                input: "$priorityBreakdown",
                as: "priority",
                cond: { $eq: ["$$priority", "high"] },
              },
            },
          },
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
