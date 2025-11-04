// // utils/queryBuilder.js - Fix for case-based filtering
// class QueryBuilder {
//   static buildMongooseFilter(queryParams, modelConfig = {}) {
//     const {
//       searchableFields = [],
//       filterableFields = [],
//       defaultSort = "-createdAt",
//       dateField = "createdAt",
//     } = modelConfig;

//     let filter = {};
//     const { search, caseId, caseSearch, ...filters } = queryParams; // Added caseId and caseSearch

//     // Text search across multiple fields
//     if (search && searchableFields.length > 0) {
//       filter.$or = searchableFields.map((field) => ({
//         [field]: { $regex: search, $options: "i" },
//       }));
//     }

//     // CASE ID FILTER - Filter by specific case ID
//     if (caseId) {
//       filter.caseReported = caseId;
//     }

//     // CASE SEARCH FILTER - Search for cases and get their reports
//     if (caseSearch) {
//       // This will be handled separately in the service
//       filter.caseSearch = caseSearch; // Flag to indicate case search
//     }

//     // Date range filter
//     const dateFilter = {};
//     if (filters.startDate) dateFilter.$gte = new Date(filters.startDate);
//     if (filters.endDate) dateFilter.$lte = new Date(filters.endDate);

//     if (Object.keys(dateFilter).length > 0) {
//       filter[dateField] = dateFilter;
//     }

//     // Handle other filterable fields
//     filterableFields.forEach((field) => {
//       if (filters[field] !== undefined && filters[field] !== "") {
//         if (Array.isArray(filters[field])) {
//           filter[field] = { $in: filters[field] };
//         } else {
//           filter[field] = filters[field];
//         }
//       }
//     });

//     // Special handling for soft deletion
//     if (filters.includeDeleted === "true") {
//       // Include all records
//     } else if (filters.onlyDeleted === "true") {
//       filter.isDeleted = true;
//     } else {
//       filter.isDeleted = { $ne: true };
//     }

//     return filter;
//   }

//   // Remove the complex aggregation method - we don't need it
//   static buildSort(sortQuery, defaultSort = "-createdAt") {
//     if (!sortQuery) return defaultSort;

//     const sort = {};
//     const sortFields = sortQuery.split(",");

//     sortFields.forEach((field) => {
//       if (field.startsWith("-")) {
//         sort[field.substring(1)] = -1;
//       } else {
//         sort[field] = 1;
//       }
//     });

//     return sort;
//   }

//   static buildPopulate(populateQuery) {
//     if (!populateQuery) return "";
//     return populateQuery.split(",").map((path) => ({ path: path.trim() }));
//   }

//   static sanitizeCriteria(criteria) {
//     const sanitized = { ...criteria };

//     Object.keys(sanitized).forEach((key) => {
//       if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
//         if (Object.keys(sanitized[key]).length === 0) {
//           delete sanitized[key];
//         }
//       }
//     });

//     return sanitized;
//   }
// }

// module.exports = QueryBuilder;

// utils/queryBuilder.js - Fixed date range filtering
// class QueryBuilder {
//   static buildMongooseFilter(queryParams, modelConfig = {}) {
//     const {
//       searchableFields = [],
//       filterableFields = [],
//       defaultSort = "-createdAt",
//       dateField = "createdAt",
//     } = modelConfig;

//     let filter = {};
//     const { search, caseId, caseSearch, ...filters } = queryParams;

//     // Text search across multiple fields
//     if (search && searchableFields.length > 0) {
//       filter.$or = searchableFields.map((field) => ({
//         [field]: { $regex: search, $options: "i" },
//       }));
//     }

//     // CASE ID FILTER - Filter by specific case ID
//     if (caseId) {
//       filter.caseReported = caseId;
//     }

//     // CASE SEARCH FILTER - Search for cases and get their reports
//     if (caseSearch) {
//       filter.caseSearch = caseSearch; // Flag to indicate case search
//     }

//     // ✅ FIXED: Date range filter with proper end-of-day handling
//     const dateFilter = {};

//     if (filters.startDate) {
//       // Start of the start date (00:00:00)
//       const startDate = new Date(filters.startDate);
//       startDate.setHours(0, 0, 0, 0);
//       dateFilter.$gte = startDate;
//     }

//     if (filters.endDate) {
//       // ✅ End of the end date (23:59:59.999)
//       const endDate = new Date(filters.endDate);
//       endDate.setHours(23, 59, 59, 999);
//       dateFilter.$lte = endDate;
//     }

//     if (Object.keys(dateFilter).length > 0) {
//       filter[dateField] = dateFilter;
//     }

//     // Handle other filterable fields
//     filterableFields.forEach((field) => {
//       // Skip date-related fields as they're handled above
//       if (field === "startDate" || field === "endDate" || field === dateField) {
//         return;
//       }

//       if (filters[field] !== undefined && filters[field] !== "") {
//         if (Array.isArray(filters[field])) {
//           filter[field] = { $in: filters[field] };
//         } else {
//           filter[field] = filters[field];
//         }
//       }
//     });

//     // Special handling for soft deletion
//     if (filters.includeDeleted === "true") {
//       // Include all records
//     } else if (filters.onlyDeleted === "true") {
//       filter.isDeleted = true;
//     } else {
//       filter.isDeleted = { $ne: true };
//     }

//     return filter;
//   }

//   static buildSort(sortQuery, defaultSort = "-createdAt") {
//     if (!sortQuery) return defaultSort;

//     const sort = {};
//     const sortFields = sortQuery.split(",");

//     sortFields.forEach((field) => {
//       if (field.startsWith("-")) {
//         sort[field.substring(1)] = -1;
//       } else {
//         sort[field] = 1;
//       }
//     });

//     return sort;
//   }

//   static buildPopulate(populateQuery) {
//     if (!populateQuery) return "";
//     return populateQuery.split(",").map((path) => ({ path: path.trim() }));
//   }

//   static sanitizeCriteria(criteria) {
//     const sanitized = { ...criteria };

//     Object.keys(sanitized).forEach((key) => {
//       if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
//         if (Object.keys(sanitized[key]).length === 0) {
//           delete sanitized[key];
//         }
//       }
//     });

//     return sanitized;
//   }

//   /**
//    * Helper method to format date for queries
//    * Ensures consistent date handling across the application
//    */
//   static formatDateForQuery(dateString, endOfDay = false) {
//     const date = new Date(dateString);

//     if (endOfDay) {
//       date.setHours(23, 59, 59, 999);
//     } else {
//       date.setHours(0, 0, 0, 0);
//     }

//     return date;
//   }

//   /**
//    * Debug helper to log the actual filter being applied
//    */
//   static debugFilter(filter, modelName = "Unknown") {
//     console.log(`\n🔍 [QueryBuilder] Filter for ${modelName}:`);
//     console.log(JSON.stringify(filter, null, 2));

//     // Log date ranges in human-readable format
//     Object.keys(filter).forEach((key) => {
//       if (filter[key].$gte || filter[key].$lte) {
//         console.log(`\n📅 Date Range for ${key}:`);
//         if (filter[key].$gte) {
//           console.log(`   From: ${filter[key].$gte.toISOString()}`);
//         }
//         if (filter[key].$lte) {
//           console.log(`   To:   ${filter[key].$lte.toISOString()}`);
//         }
//       }
//     });
//     console.log("---\n");
//   }
// }

// module.exports = QueryBuilder;

// utils/queryBuilder.js - Fixed with partial text matching
class QueryBuilder {
  static buildMongooseFilter(queryParams, modelConfig = {}) {
    const {
      searchableFields = [],
      filterableFields = [],
      defaultSort = "-createdAt",
      dateField = "createdAt",
      textFilterFields = [], // ✅ NEW: Fields that should use partial matching
    } = modelConfig;

    let filter = {};
    const { search, caseId, caseSearch, ...filters } = queryParams;

    // Text search across multiple fields
    if (search && searchableFields.length > 0) {
      filter.$or = searchableFields.map((field) => ({
        [field]: { $regex: search, $options: "i" },
      }));
    }

    // CASE ID FILTER - Filter by specific case ID
    if (caseId) {
      filter.caseReported = caseId;
    }

    // CASE SEARCH FILTER - Search for cases and get their reports
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

    // ✅ Handle other filterable fields with smart matching
    filterableFields.forEach((field) => {
      // Skip date-related fields as they're handled above
      if (field === "startDate" || field === "endDate" || field === dateField) {
        return;
      }

      if (filters[field] !== undefined && filters[field] !== "") {
        // ✅ Use partial matching for text fields
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
        // Exact match for other fields (IDs, enums, etc.)
        else {
          filter[field] = filters[field];
        }
      }
    });

    // Special handling for soft deletion
    if (filters.includeDeleted === "true") {
      // Include all records
    } else if (filters.onlyDeleted === "true") {
      filter.isDeleted = true;
    } else {
      filter.isDeleted = { $ne: true };
    }

    return filter;
  }

  /**
   * ✅ Determine if a field should use text matching
   * Common text fields that should use partial matching
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
      "docRef",
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
    if (!populateQuery) return "";
    return populateQuery.split(",").map((path) => ({ path: path.trim() }));
  }

  static sanitizeCriteria(criteria) {
    const sanitized = { ...criteria };

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
    console.log(JSON.stringify(filter, null, 2));

    // Log date ranges in human-readable format
    Object.keys(filter).forEach((key) => {
      if (filter[key] && typeof filter[key] === "object") {
        if (filter[key].$gte || filter[key].$lte) {
          console.log(`\n📅 Date Range for ${key}:`);
          if (filter[key].$gte) {
            console.log(`   From: ${filter[key].$gte.toISOString()}`);
          }
          if (filter[key].$lte) {
            console.log(`   To:   ${filter[key].$lte.toISOString()}`);
          }
        }
        if (filter[key].$regex) {
          console.log(`\n🔤 Text Search for ${key}:`);
          console.log(`   Pattern: "${filter[key].$regex}" (case-insensitive)`);
        }
      }
    });
  }
}

module.exports = QueryBuilder;
