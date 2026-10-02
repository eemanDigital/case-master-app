// utils/queryBuilder.js - FIXED VERSION

// Escape user input before it is embedded in a $regex.
// Without this, a caller can supply their own pattern. Besides matching
// unintended records, patterns such as /(a+)+b/ cause catastrophic
// backtracking and take the database process down (ReDoS).
const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Query values arrive from req.query, so they may be strings, arrays, or
// attacker-supplied objects like {"$ne": null}. Handing an operator object
// straight to Mongoose lets a caller turn `?status=active` into
// `status != active` and bypass the intended filter. Coerce to a scalar and
// drop anything that is not a primitive.
const toSafeScalar = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value;
  if (typeof value === "string") return value;
  return null;
};

class QueryBuilder {
  static buildMongooseFilter(queryParams = {}, modelConfig = {}) {
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
      const pattern = escapeRegex(String(search).slice(0, 200));
      filter.$or = searchableFields.map((field) => ({
        [field]: { $regex: pattern, $options: "i" },
      }));
    }

    // CASE ID FILTER
    if (caseId) {
      filter.caseReported = toSafeScalar(caseId);
    }

    // CASE SEARCH FILTER
    if (caseSearch) {
      filter.caseSearch = escapeRegex(String(caseSearch).slice(0, 200));
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
          if (typeof filters[field] !== "string") return; // never regex a non-string
          filter[field] = {
            $regex: escapeRegex(filters[field].trim().slice(0, 200)),
            $options: "i",
          };
        }
        // Array fields
        else if (Array.isArray(filters[field])) {
          // Drop operator objects (e.g. {"$ne": null}) before they reach Mongo
          const values = filters[field]
            .map(toSafeScalar)
            .filter((v) => v !== null);
          if (values.length) filter[field] = { $in: values };
        }
        // Exact match for other fields — coerce to a scalar so a caller cannot
        // smuggle a Mongo operator in as the value
        else {
          const value = toSafeScalar(filters[field]);
          if (value !== null) filter[field] = value;
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

  /**
   * Build a sort clause from `?sort=field,-other`.
   * Field names are restricted to plain alphanumeric/dotted paths so a caller
   * cannot inject `$`-prefixed aggregation operators or force a sort on an
   * unindexed field (a cheap way to burn database CPU).
   */
  static buildSort(sortQuery, defaultSort = "-createdAt", allowedFields = null) {
    const isAllowed = (field) => {
      if (!/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)*$/.test(field)) return false;
      if (Array.isArray(allowedFields) && allowedFields.length > 0) {
        return allowedFields.includes(field);
      }
      return true;
    };

    if (!sortQuery) return defaultSort;

    const sort = {};
    let added = 0;

    String(sortQuery)
      .split(",")
      .forEach((rawField) => {
        const token = rawField.trim();
        if (!token) return;

        const descending = token.startsWith("-");
        const field = descending ? token.slice(1) : token;

        if (!isAllowed(field)) return;
        if (Object.keys(sort).length >= 3) return; // bound the number of keys

        sort[field] = descending ? -1 : 1;
        added += 1;
      });

    // Ignore a fully-rejected value rather than silently producing {}.
    return added ? sort : defaultSort;
  }

  /**
   * Build populate options from `?populate=path,path`.
   *
   * Populate is powerful — it walks a reference into another collection and
   * returns those documents verbatim. With no allowlist a caller could request
   * an arbitrary relation (or a collection they should never see) and have it
   * embedded in the response. Anything not explicitly permitted is dropped.
   */
  static buildPopulate(populateQuery, allowedPaths = []) {
    const whitelist = new Set(allowedPaths);
    const isSafePath = (path) =>
      /^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)*$/.test(path) &&
      !path.startsWith("$") &&
      !path.includes("..") &&
      (whitelist.size === 0 ? false : whitelist.has(path));

    if (!populateQuery) return [];

    return String(populateQuery)
      .split(",")
      .map((path) => path.trim())
      .filter(isSafePath)
      .slice(0, 5)
      .map((path) => ({ path }));
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
            `   Pattern: "${cleanFilter[key].$regex}" (case-insensitive)`,
          );
        }
      }
    });

    console.log(); // Empty line for readability
  }
}

module.exports = QueryBuilder;
