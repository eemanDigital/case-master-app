// utils/queryBuilder.js - FIXED VERSION
class QueryBuilder {
  static buildMongooseFilter(queryParams, modelConfig = {}) {
    const {
      searchableFields = [],
      filterableFields = [],
      defaultSort = "-createdAt",
      dateField = "createdAt",
      textFilterFields = [],
    } = modelConfig;

    let filter = {};
    const { search, caseId, caseSearch, ...filters } = queryParams;

    // Text search across multiple fields
    if (search && searchableFields.length > 0) {
      filter.$or = searchableFields.map((field) => ({
        [field]: { $regex: search, $options: "i" },
      }));
    }

    // CASE ID FILTER
    if (caseId) {
      filter.caseReported = caseId;
    }

    // CASE SEARCH FILTER
    if (caseSearch) {
      filter.caseSearch = caseSearch;
    }

    // Date range filter with proper end-of-day handling
    const dateFilter = {};

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      dateFilter.$gte = startDate;
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.$lte = endDate;
    }

    if (Object.keys(dateFilter).length > 0) {
      filter[dateField] = dateFilter;
    }

    // Handle other filterable fields with smart matching
    filterableFields.forEach((field) => {
      // Skip special fields
      if (
        field === "startDate" ||
        field === "endDate" ||
        field === dateField ||
        field === "includeDeleted" ||
        field === "onlyDeleted"
      ) {
        return;
      }

      if (filters[field] !== undefined && filters[field] !== "") {
        // Use partial matching for text fields
        if (textFilterFields.includes(field) || this.isTextField(field)) {
          filter[field] = {
            $regex: filters[field].trim(),
            $options: "i",
          };
        }
        // Array fields
        else if (Array.isArray(filters[field])) {
          filter[field] = { $in: filters[field] };
        }
        // Exact match for other fields
        else {
          filter[field] = filters[field];
        }
      }
    });

    // ✅ CRITICAL FIX: Handle soft deletion properly
    // Note: The actual isDeleted filter is applied in the service layer
    // This just marks that these filters were present
    if (filters.includeDeleted === "true") {
      filter.__includeDeleted = true; // Marker for service layer
    } else if (filters.onlyDeleted === "true") {
      filter.__onlyDeleted = true; // Marker for service layer
    }
    // Default is handled in service layer

    return filter;
  }

  /**
   * Determine if a field should use text matching
   */
  static isTextField(fieldName) {
    const textFieldPatterns = [
      "name",
      "sender",
      "recipient",
      "email",
      "phone",
      "address",
      "description",
      "note",
      "comment",
      "title",
      "subject",
      "ref",
      "docref",
      "update",
      "adjourned",
      "clientemail",
      "position",
      "practice",
      "location",
      "court",
      "state",
    ];

    const lowerField = fieldName.toLowerCase();
    return textFieldPatterns.some((pattern) => lowerField.includes(pattern));
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
    if (!populateQuery) return [];
    return populateQuery.split(",").map((path) => ({ path: path.trim() }));
  }

  static sanitizeCriteria(criteria) {
    const sanitized = { ...criteria };

    // Remove marker fields
    delete sanitized.__includeDeleted;
    delete sanitized.__onlyDeleted;

    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
        if (Object.keys(sanitized[key]).length === 0) {
          delete sanitized[key];
        }
      }
    });

    return sanitized;
  }

  /**
   * Helper method to format date for queries
   */
  static formatDateForQuery(dateString, endOfDay = false) {
    const date = new Date(dateString);

    if (endOfDay) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }

    return date;
  }

  /**
   * Debug helper to log the actual filter being applied
   */
  static debugFilter(filter, modelName = "Unknown") {
    console.log(`\n🔍 [QueryBuilder] Filter for ${modelName}:`);

    // Create clean filter for logging (remove markers)
    const cleanFilter = { ...filter };
    delete cleanFilter.__includeDeleted;
    delete cleanFilter.__onlyDeleted;

    console.log(JSON.stringify(cleanFilter, null, 2));

    // Log date ranges in human-readable format
    Object.keys(cleanFilter).forEach((key) => {
      if (cleanFilter[key] && typeof cleanFilter[key] === "object") {
        if (cleanFilter[key].$gte || cleanFilter[key].$lte) {
          console.log(`\n📅 Date Range for ${key}:`);
          if (cleanFilter[key].$gte) {
            console.log(`   From: ${cleanFilter[key].$gte.toISOString()}`);
          }
          if (cleanFilter[key].$lte) {
            console.log(`   To:   ${cleanFilter[key].$lte.toISOString()}`);
          }
        }
        if (cleanFilter[key].$regex) {
          console.log(`\n🔤 Text Search for ${key}:`);
          console.log(
            `   Pattern: "${cleanFilter[key].$regex}" (case-insensitive)`
          );
        }
      }
    });

    console.log(); // Empty line for readability
  }
}

module.exports = QueryBuilder;
