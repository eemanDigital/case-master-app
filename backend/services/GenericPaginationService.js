// services/GenericPaginationService.js - ENHANCED WITH STATISTICS
const QueryBuilder = require("../utils/queryBuilder");

class GenericPaginationService {
  constructor(model, modelConfig = {}) {
    this.model = model;
    this.config = {
      searchableFields: modelConfig.searchableFields || [],
      filterableFields: modelConfig.filterableFields || [],
      textFilterFields: modelConfig.textFilterFields || [],
      defaultSort: modelConfig.defaultSort || "-date",
      dateField: modelConfig.dateField || "date",
      maxLimit: modelConfig.maxLimit || 100,
      defaultPopulate: modelConfig.defaultPopulate || [],
      includeStats: modelConfig.includeStats || false, // ✅ NEW: Enable statistics
      statsFields: modelConfig.statsFields || [], // ✅ NEW: Fields to count
    };
  }

  async paginate(queryParams = {}, customFilter = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort,
        search,
        populate,
        select,
        caseId,
        caseSearch,
        debug,
        includeStats, // ✅ NEW: Enable stats for this query
        ...filters
      } = queryParams;

      // Validate and sanitize parameters
      const sanitizedLimit = Math.min(parseInt(limit), this.config.maxLimit);
      const sanitizedPage = Math.max(1, parseInt(page));

      // Build base filter
      const baseFilter = QueryBuilder.buildMongooseFilter(
        { search, caseId, caseSearch, ...filters },
        this.config
      );

      let finalFilter = { ...baseFilter, ...customFilter };

      // ✅ NEW: Handle "staff" role filter specially
      if (filters.role === "staff") {
        finalFilter.role = { $ne: "client" };
        delete finalFilter.role; // Avoid conflict
        v;
      }

      // Handle soft deletion
      if (filters.includeDeleted === "true") {
        delete finalFilter.isDeleted;
      } else if (filters.onlyDeleted === "true") {
        finalFilter.isDeleted = true;
      } else {
        finalFilter.isDeleted = { $ne: true };
      }

      const sortOptions = QueryBuilder.buildSort(sort, this.config.defaultSort);

      // Handle case search
      if (caseSearch && !caseId) {
        const caseIds = await this.findCaseIdsBySearch(caseSearch);
        if (caseIds.length > 0) {
          finalFilter.caseReported = { $in: caseIds };
        } else {
          finalFilter.caseReported = { $in: [] };
        }
        delete finalFilter.caseSearch;
      }

      // Debug logging
      if (debug === "true" || process.env.DEBUG_QUERIES === "true") {
        console.log("\n🔍 ================================");
        console.log(`📋 Model: ${this.model.modelName}`);
        console.log(`📄 Page: ${sanitizedPage}, Limit: ${sanitizedLimit}`);
        console.log("🎯 Final Filter:");
        console.log(JSON.stringify(finalFilter, null, 2));
      }

      // ✅ NEW: Calculate statistics if enabled
      let statistics = null;
      const shouldIncludeStats =
        includeStats === "true" ||
        this.config.includeStats ||
        this.model.modelName === "User"; // Always include for User model

      if (shouldIncludeStats) {
        statistics = await this.calculateStatistics(finalFilter);
      }

      // Count total records
      const totalRecords = await this.model.countDocuments(finalFilter);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalRecords / sanitizedLimit);
      const startIndex = (sanitizedPage - 1) * sanitizedLimit;

      // Validate page bounds
      if (sanitizedPage > totalPages && totalPages > 0) {
        console.warn(
          `⚠️ Page ${sanitizedPage} exceeds total pages ${totalPages}`
        );
        return this.formatResponse(
          [],
          totalRecords,
          sanitizedPage,
          sanitizedLimit,
          statistics
        );
      }

      // Build query
      let query = this.model.find(finalFilter);

      if (select) {
        query = query.select(select);
      }

      // Handle population
      const populateOptions = QueryBuilder.buildPopulate(populate);
      if (populateOptions && populateOptions.length > 0) {
        query = query.populate(populateOptions);
      } else if (this.config.defaultPopulate.length > 0) {
        query = query.populate(this.config.defaultPopulate);
      }

      // Execute query
      const data = await query
        .sort(sortOptions)
        .skip(startIndex)
        .limit(sanitizedLimit)
        .lean()
        .exec();

      // Debug logging
      if (debug === "true" || process.env.DEBUG_QUERIES === "true") {
        console.log(`✅ Total Records: ${totalRecords}`);
        console.log(`📦 Returned Records: ${data.length}`);
        console.log(`📊 Total Pages: ${totalPages}`);
        if (statistics) {
          console.log(`📈 Statistics:`, statistics);
        }
        console.log("🔍 ================================\n");
      }

      // Verify data consistency
      if (data.length > sanitizedLimit) {
        console.error(
          `❌ ERROR: Returned ${data.length} records but limit is ${sanitizedLimit}`
        );
        data.splice(sanitizedLimit);
      }

      return this.formatResponse(
        data,
        totalRecords,
        sanitizedPage,
        sanitizedLimit,
        statistics
      );
    } catch (error) {
      console.error("❌ Pagination error:", error);
      throw new Error(`Pagination error: ${error.message}`);
    }
  }

  /**
   * ✅ NEW: Calculate statistics for User model or other models
   */
  async calculateStatistics(baseFilter = {}) {
    try {
      // Remove specific filters that should not apply to overall stats
      const statsFilter = { ...baseFilter };
      delete statsFilter.role; // We want to count all roles
      delete statsFilter.isActive; // We want to count both active and inactive
      delete statsFilter.$or; // Remove text search for stats

      const modelName = this.model.modelName;

      // ✅ User-specific statistics
      if (modelName === "User") {
        const [
          totalCount,
          roleStats,
          activeStats,
          lawyerStats,
          verifiedStats,
          deletedCount,
        ] = await Promise.all([
          // Total users (excluding deleted by default)
          this.model.countDocuments(statsFilter),

          // Count by role
          this.model.aggregate([
            { $match: statsFilter },
            { $group: { _id: "$role", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ]),

          // Active vs Inactive
          this.model.aggregate([
            { $match: statsFilter },
            { $group: { _id: "$isActive", count: { $sum: 1 } } },
          ]),

          // Lawyers count
          this.model.countDocuments({ ...statsFilter, isLawyer: true }),

          // Verified users
          this.model.countDocuments({ ...statsFilter, isVerified: true }),

          // Deleted users (override the filter)
          this.model.countDocuments({
            ...statsFilter,
            isDeleted: true,
          }),
        ]);

        // Format role statistics
        const roles = {
          total: totalCount,
          client: 0,
          staff: 0,
          admin: 0,
          "super-admin": 0,
          hr: 0,
          lawyer: 0,
          secretary: 0,
        };

        roleStats.forEach((stat) => {
          if (stat._id === "client") {
            roles.client = stat.count;
          } else {
            // All non-client roles count as "staff"
            roles.staff += stat.count;

            // Also count specific roles
            if (roles.hasOwnProperty(stat._id)) {
              roles[stat._id] = stat.count;
            }
          }
        });

        // Format active statistics
        const active = {
          active: 0,
          inactive: 0,
        };

        activeStats.forEach((stat) => {
          if (stat._id === true) {
            active.active = stat.count;
          } else if (stat._id === false) {
            active.inactive = stat.count;
          }
        });

        return {
          total: totalCount,
          roles,
          active,
          lawyers: lawyerStats,
          verified: verifiedStats,
          deleted: deletedCount,
          breakdown: {
            clients: roles.client,
            staff: roles.staff,
            admins: roles.admin + roles["super-admin"],
            activeUsers: active.active,
            inactiveUsers: active.inactive,
            lawyers: lawyerStats,
            verifiedUsers: verifiedStats,
          },
        };
      }

      // ✅ Generic statistics for other models
      else {
        const stats = {
          total: await this.model.countDocuments(statsFilter),
        };

        // Add custom field statistics if configured
        if (this.config.statsFields.length > 0) {
          const fieldStats = await Promise.all(
            this.config.statsFields.map(async (field) => {
              const result = await this.model.aggregate([
                { $match: statsFilter },
                { $group: { _id: `$${field}`, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
              ]);
              return { field, values: result };
            })
          );

          stats.fields = {};
          fieldStats.forEach(({ field, values }) => {
            stats.fields[field] = values.reduce((acc, val) => {
              acc[val._id] = val.count;
              return acc;
            }, {});
          });
        }

        return stats;
      }
    } catch (error) {
      console.error("Error calculating statistics:", error);
      return null;
    }
  }

  /**
   * Find case IDs by search term
   */
  async findCaseIdsBySearch(searchTerm) {
    try {
      const Case = require("../models/caseModel");

      const matchingCases = await Case.find({
        $or: [
          { "firstParty.name.name": { $regex: searchTerm, $options: "i" } },
          { "secondParty.name.name": { $regex: searchTerm, $options: "i" } },
          { suitNo: { $regex: searchTerm, $options: "i" } },
          { courtNo: { $regex: searchTerm, $options: "i" } },
        ],
        isDeleted: { $ne: true },
      })
        .select("_id")
        .lean();

      return matchingCases.map((caseDoc) => caseDoc._id);
    } catch (error) {
      console.error("Error finding cases by search:", error);
      return [];
    }
  }

  /**
   * Get reports for a specific case
   */
  async getReportsByCaseId(caseId, queryParams = {}) {
    return this.paginate({ ...queryParams, caseId });
  }

  /**
   * Search reports by case name/suit number
   */
  async searchReportsByCase(searchTerm, queryParams = {}) {
    return this.paginate({ ...queryParams, caseSearch: searchTerm });
  }

  /**
   * Advanced search with criteria
   */
  async advancedSearch(criteria = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort,
        populate,
        debug,
        includeStats,
      } = options;

      const sanitizedLimit = Math.min(parseInt(limit), this.config.maxLimit);
      const sanitizedPage = Math.max(1, parseInt(page));

      const sortOptions = QueryBuilder.buildSort(sort, this.config.defaultSort);
      const populateOptions = QueryBuilder.buildPopulate(populate);

      let sanitizedCriteria = QueryBuilder.sanitizeCriteria(criteria);

      // Always exclude deleted records unless specified
      if (!sanitizedCriteria.isDeleted && !sanitizedCriteria.includeDeleted) {
        sanitizedCriteria.isDeleted = { $ne: true };
      }

      if (debug === "true" || process.env.DEBUG_QUERIES === "true") {
        QueryBuilder.debugFilter(sanitizedCriteria, this.model.modelName);
      }

      // Calculate statistics if enabled
      let statistics = null;
      if (includeStats === "true" || this.config.includeStats) {
        statistics = await this.calculateStatistics(sanitizedCriteria);
      }

      const startIndex = (sanitizedPage - 1) * sanitizedLimit;

      // Count first
      const totalRecords = await this.model.countDocuments(sanitizedCriteria);

      let query = this.model.find(sanitizedCriteria);

      if (populateOptions && populateOptions.length > 0) {
        query = query.populate(populateOptions);
      } else if (this.config.defaultPopulate.length > 0) {
        query = query.populate(this.config.defaultPopulate);
      }

      const data = await query
        .sort(sortOptions)
        .skip(startIndex)
        .limit(sanitizedLimit)
        .lean()
        .exec();

      return this.formatResponse(
        data,
        totalRecords,
        sanitizedPage,
        sanitizedLimit,
        statistics
      );
    } catch (error) {
      console.error("Advanced search error:", error);
      throw new Error(`Advanced search error: ${error.message}`);
    }
  }

  /**
   * ✅ ENHANCED: Format response with statistics
   */
  formatResponse(data, totalRecords, page, limit, statistics = null) {
    const totalPages = Math.ceil(totalRecords / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const response = {
      success: true,
      data,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalRecords: totalRecords,
        limit: limit,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
        // Legacy fields for backward compatibility
        current: page,
        total: totalPages,
        count: data.length,
        hasNext: hasNextPage,
        hasPrev: hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
    };

    // ✅ Add statistics if available
    if (statistics) {
      response.statistics = statistics;
    }

    return response;
  }
}

module.exports = GenericPaginationService;
