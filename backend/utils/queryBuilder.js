// utils/queryBuilder.js
class QueryBuilder {
  static buildMongooseFilter(queryParams, modelConfig = {}) {
    const {
      searchableFields = [],
      filterableFields = [],
      defaultSort = "-createdAt",
      dateField = "createdAt",
    } = modelConfig;

    let filter = {};
    const { search, ...filters } = queryParams;

    // Text search across multiple fields
    if (search && searchableFields.length > 0) {
      filter.$or = searchableFields.map((field) => ({
        [field]: { $regex: search, $options: "i" },
      }));
    }

    // Date range filter - FIXED: Only create date filter if dates are provided
    const dateFilter = {};
    if (filters.startDate) dateFilter.$gte = new Date(filters.startDate);
    if (filters.endDate) dateFilter.$lte = new Date(filters.endDate);

    // Only add date filter if at least one date is provided
    if (Object.keys(dateFilter).length > 0) {
      filter[dateField] = dateFilter;
    }

    // Handle other filterable fields
    filterableFields.forEach((field) => {
      if (filters[field] !== undefined && filters[field] !== "") {
        if (Array.isArray(filters[field])) {
          filter[field] = { $in: filters[field] };
        } else {
          filter[field] = filters[field];
        }
      }
    });

    // Special handling for soft deletion
    if (filters.includeDeleted === "true") {
      // Include all records (no filter)
    } else if (filters.onlyDeleted === "true") {
      filter.isDeleted = true;
    } else {
      filter.isDeleted = { $ne: true }; // Default: exclude soft-deleted
    }

    return filter;
  }

  static buildSort(sortQuery, defaultSort = "-createdAt") {
    if (!sortQuery) return defaultSort;

    const sort = {};
    const sortFields = sortQuery.split(",");

    sortFields.forEach((field) => {
      if (field.startsWith("-")) {
        sort[field.substring(1)] = -1;
      } else {
        sort[field] = 1;
      }
    });

    return sort;
  }

  static buildPopulate(populateQuery) {
    if (!populateQuery) return "";
    return populateQuery.split(",").map((path) => ({ path: path.trim() }));
  }

  // NEW: Safe method for advanced search criteria
  static sanitizeCriteria(criteria) {
    const sanitized = { ...criteria };

    // Remove empty objects that could cause cast errors
    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
        if (Object.keys(sanitized[key]).length === 0) {
          delete sanitized[key];
        }
      }
    });

    return sanitized;
  }
}

module.exports = QueryBuilder;
