// Generic Pagination Service
// This service provides a reusable pagination mechanism for Mongoose models.
// It supports filtering, searching, sorting, and populating related fields.

const QueryBuilder = require("../utils/queryBuilder");

class GenericPaginationService {
  constructor(model, modelConfig = {}) {
    this.model = model;
    this.config = {
      searchableFields: modelConfig.searchableFields || [],
      filterableFields: modelConfig.filterableFields || [],
      defaultSort: modelConfig.defaultSort || "-createdAt",
      dateField: modelConfig.dateField || "createdAt",
      maxLimit: modelConfig.maxLimit || 100,
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
        ...filters
      } = queryParams;

      // Validate and sanitize parameters
      const sanitizedLimit = Math.min(parseInt(limit), this.config.maxLimit);
      const sanitizedPage = Math.max(1, parseInt(page));

      // Build filter - using fixed method
      const baseFilter = QueryBuilder.buildMongooseFilter(
        { search, ...filters },
        this.config
      );

      const finalFilter = { ...baseFilter, ...customFilter };
      const sortOptions = QueryBuilder.buildSort(sort, this.config.defaultSort);
      const populateOptions = QueryBuilder.buildPopulate(populate);

      // Execute query with pagination
      const startIndex = (sanitizedPage - 1) * sanitizedLimit;

      let query = this.model.find(finalFilter);

      if (select) {
        query = query.select(select);
      }

      if (populateOptions && populateOptions.length > 0) {
        query = query.populate(populateOptions);
      }

      const [data, total] = await Promise.all([
        query.sort(sortOptions).skip(startIndex).limit(sanitizedLimit).exec(),
        this.model.countDocuments(finalFilter),
      ]);

      return this.formatResponse(data, total, sanitizedPage, sanitizedLimit);
    } catch (error) {
      console.error("Pagination error:", error);
      throw new Error(`Pagination error: ${error.message}`);
    }
  }

  // UPDATED: Advanced search with better error handling
  async advancedSearch(criteria = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort, populate } = options;

      const sanitizedLimit = Math.min(parseInt(limit), this.config.maxLimit);
      const sanitizedPage = Math.max(1, parseInt(page));

      const sortOptions = QueryBuilder.buildSort(sort, this.config.defaultSort);
      const populateOptions = QueryBuilder.buildPopulate(populate);

      // Sanitize criteria to prevent cast errors
      const sanitizedCriteria = QueryBuilder.sanitizeCriteria(criteria);

      const startIndex = (sanitizedPage - 1) * sanitizedLimit;

      const [data, total] = await Promise.all([
        this.model
          .find(sanitizedCriteria)
          .populate(populateOptions || "")
          .sort(sortOptions)
          .skip(startIndex)
          .limit(sanitizedLimit),
        this.model.countDocuments(sanitizedCriteria),
      ]);

      return this.formatResponse(data, total, sanitizedPage, sanitizedLimit);
    } catch (error) {
      console.error("Advanced search error:", error);
      throw new Error(`Advanced search error: ${error.message}`);
    }
  }

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
