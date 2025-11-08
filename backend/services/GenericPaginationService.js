// services/GenericPaginationService.js - Fixed for case filtering
const QueryBuilder = require("../utils/queryBuilder");

class GenericPaginationService {
  constructor(model, modelConfig = {}) {
    this.model = model;
    this.config = {
      searchableFields: modelConfig.searchableFields || [],
      filterableFields: modelConfig.filterableFields || [],
      textFilterFields: modelConfig.textFilterFields || [], // ✅ ADD THIS
      defaultSort: modelConfig.defaultSort || "-date",
      dateField: modelConfig.dateField || "date",
      maxLimit: modelConfig.maxLimit || 100,
      defaultPopulate: modelConfig.defaultPopulate || [],
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
        debug, // ✅ Add debug flag
        ...filters
      } = queryParams;

      // Validate and sanitize parameters
      const sanitizedLimit = Math.min(parseInt(limit), this.config.maxLimit);
      const sanitizedPage = Math.max(1, parseInt(page));

      // ✅ Pass full config including textFilterFields
      const baseFilter = QueryBuilder.buildMongooseFilter(
        { search, caseId, caseSearch, ...filters },
        this.config // ✅ This now includes textFilterFields
      );

      let finalFilter = { ...baseFilter, ...customFilter };
      const sortOptions = QueryBuilder.buildSort(sort, this.config.defaultSort);

      // Handle case search - find cases matching the search and get their reports
      if (caseSearch && !caseId) {
        const caseIds = await this.findCaseIdsBySearch(caseSearch);
        if (caseIds.length > 0) {
          finalFilter.caseReported = { $in: caseIds };
        } else {
          // If no cases found, return empty results
          finalFilter.caseReported = { $in: [] };
        }
        delete finalFilter.caseSearch;
      }

      // ✅ Debug logging
      if (debug === "true" || process.env.DEBUG_QUERIES === "true") {
        QueryBuilder.debugFilter(finalFilter, this.model.modelName);
      }

      const startIndex = (sanitizedPage - 1) * sanitizedLimit;

      let query = this.model.find(finalFilter);

      if (select) {
        query = query.select(select);
      }

      // Handle population
      const populateOptions = QueryBuilder.buildPopulate(populate);
      if (populateOptions && populateOptions.length > 0) {
        query = query.populate(populateOptions);
      } else if (this.config.defaultPopulate.length > 0) {
        // Use default population from config
        query = query.populate(this.config.defaultPopulate);
      }

      const [data, total] = await Promise.all([
        query.sort(sortOptions).skip(startIndex).limit(sanitizedLimit).exec(),
        this.model.countDocuments(finalFilter),
      ]);

      // ✅ Log results count if debug enabled
      if (debug === "true" || process.env.DEBUG_QUERIES === "true") {
        console.log(
          `✅ Found ${total} total records, returning ${data.length} records\n`
        );
      }

      return this.formatResponse(data, total, sanitizedPage, sanitizedLimit);
    } catch (error) {
      console.error("Pagination error:", error);
      throw new Error(`Pagination error: ${error.message}`);
    }
  }

  /**
   * Find case IDs by search term
   */
  async findCaseIdsBySearch(searchTerm) {
    try {
      const Case = require("../models/caseModel");

      console.log(`🔍 Searching for cases with term: "${searchTerm}"`);

      const matchingCases = await Case.find({
        $or: [
          { "firstParty.name.name": { $regex: searchTerm, $options: "i" } },
          { "secondParty.name.name": { $regex: searchTerm, $options: "i" } },
          { suitNo: { $regex: searchTerm, $options: "i" } },
          { courtNo: { $regex: searchTerm, $options: "i" } },
        ],
        isDeleted: { $ne: true },
      }).select("_id");

      const caseIds = matchingCases.map((caseDoc) => caseDoc._id);
      console.log(`✅ Found ${caseIds.length} matching cases`);

      return caseIds;
    } catch (error) {
      console.error("Error finding cases by search:", error);
      return [];
    }
  }

  /**
   * Get reports for a specific case (convenience method)
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
      const { page = 1, limit = 10, sort, populate, debug } = options;

      const sanitizedLimit = Math.min(parseInt(limit), this.config.maxLimit);
      const sanitizedPage = Math.max(1, parseInt(page));

      const sortOptions = QueryBuilder.buildSort(sort, this.config.defaultSort);
      const populateOptions = QueryBuilder.buildPopulate(populate);

      const sanitizedCriteria = QueryBuilder.sanitizeCriteria(criteria);

      // ✅ Debug logging
      if (debug === "true" || process.env.DEBUG_QUERIES === "true") {
        QueryBuilder.debugFilter(sanitizedCriteria, this.model.modelName);
      }

      const startIndex = (sanitizedPage - 1) * sanitizedLimit;

      let query = this.model.find(sanitizedCriteria);

      // Apply population
      if (populateOptions && populateOptions.length > 0) {
        query = query.populate(populateOptions);
      } else if (this.config.defaultPopulate.length > 0) {
        query = query.populate(this.config.defaultPopulate);
      }

      const [data, total] = await Promise.all([
        query.sort(sortOptions).skip(startIndex).limit(sanitizedLimit),
        this.model.countDocuments(sanitizedCriteria),
      ]);

      return this.formatResponse(data, total, sanitizedPage, sanitizedLimit);
    } catch (error) {
      console.error("Advanced search error:", error);
      throw new Error(`Advanced search error: ${error.message}`);
    }
  }

  /**
   * Format response with pagination metadata
   */
  formatResponse(data, total, page, limit) {
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data,
      pagination: {
        current: page,
        total: totalPages,
        count: data.length,
        limit: limit,
        totalRecords: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      },
    };
  }
}

module.exports = GenericPaginationService;
