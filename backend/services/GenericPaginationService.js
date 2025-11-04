// // services/GenericPaginationService.js - Simplified for case filtering
// const QueryBuilder = require("../utils/queryBuilder");

// class GenericPaginationService {
//   constructor(model, modelConfig = {}) {
//     this.model = model;
//     this.config = {
//       searchableFields: modelConfig.searchableFields || [],
//       filterableFields: modelConfig.filterableFields || [],
//       defaultSort: modelConfig.defaultSort || "-date",
//       dateField: modelConfig.dateField || "date",
//       maxLimit: modelConfig.maxLimit || 100,
//     };
//   }

//   async paginate(queryParams = {}, customFilter = {}) {
//     try {
//       const {
//         page = 1,
//         limit = 10,
//         sort,
//         search,
//         populate,
//         select,
//         caseId, // Specific case ID
//         caseSearch, // Search term for cases
//         ...filters
//       } = queryParams;

//       // Validate and sanitize parameters
//       const sanitizedLimit = Math.min(parseInt(limit), this.config.maxLimit);
//       const sanitizedPage = Math.max(1, parseInt(page));

//       // Build base filter
//       const baseFilter = QueryBuilder.buildMongooseFilter(
//         { search, caseId, caseSearch, ...filters },
//         this.config
//       );

//       let finalFilter = { ...baseFilter, ...customFilter };
//       const sortOptions = QueryBuilder.buildSort(sort, this.config.defaultSort);

//       // Handle case search - find cases matching the search and get their reports
//       if (caseSearch && !caseId) {
//         const caseIds = await this.findCaseIdsBySearch(caseSearch);
//         finalFilter.caseReported = { $in: caseIds };

//         // Remove the caseSearch flag from filter
//         delete finalFilter.caseSearch;
//       }

//       const startIndex = (sanitizedPage - 1) * sanitizedLimit;

//       let query = this.model.find(finalFilter);

//       if (select) {
//         query = query.select(select);
//       }

//       // Handle population
//       const populateOptions = QueryBuilder.buildPopulate(populate);
//       if (populateOptions && populateOptions.length > 0) {
//         query = query.populate(populateOptions);
//       } else {
//         // Default population for reports
//         query = query.populate("caseReported reportedBy lawyersInCourt");
//       }

//       const [data, total] = await Promise.all([
//         query.sort(sortOptions).skip(startIndex).limit(sanitizedLimit).exec(),
//         this.model.countDocuments(finalFilter),
//       ]);

//       return this.formatResponse(data, total, sanitizedPage, sanitizedLimit);
//     } catch (error) {
//       console.error("Pagination error:", error);
//       throw new Error(`Pagination error: ${error.message}`);
//     }
//   }

//   // NEW: Find case IDs by search term
//   async findCaseIdsBySearch(searchTerm) {
//     try {
//       const Case = require("../models/caseModel"); // Adjust path as needed

//       const matchingCases = await Case.find({
//         $or: [
//           { "firstParty.name.name": { $regex: searchTerm, $options: "i" } },
//           { "secondParty.name.name": { $regex: searchTerm, $options: "i" } },
//           { suitNo: { $regex: searchTerm, $options: "i" } },
//           { courtNo: { $regex: searchTerm, $options: "i" } },
//         ],
//         isDeleted: { $ne: true },
//       }).select("_id");

//       return matchingCases.map((caseDoc) => caseDoc._id);
//     } catch (error) {
//       console.error("Error finding cases by search:", error);
//       return []; // Return empty array if error
//     }
//   }

//   // Get reports for a specific case (convenience method)
//   async getReportsByCaseId(caseId, queryParams = {}) {
//     return this.paginate({ ...queryParams, caseId });
//   }

//   // Search reports by case name/suit number
//   async searchReportsByCase(searchTerm, queryParams = {}) {
//     return this.paginate({ ...queryParams, caseSearch: searchTerm });
//   }

//   // Rest of the methods remain the same...
//   async advancedSearch(criteria = {}, options = {}) {
//     try {
//       const { page = 1, limit = 10, sort, populate } = options;

//       const sanitizedLimit = Math.min(parseInt(limit), this.config.maxLimit);
//       const sanitizedPage = Math.max(1, parseInt(page));

//       const sortOptions = QueryBuilder.buildSort(sort, this.config.defaultSort);
//       const populateOptions = QueryBuilder.buildPopulate(populate);

//       const sanitizedCriteria = QueryBuilder.sanitizeCriteria(criteria);

//       const startIndex = (sanitizedPage - 1) * sanitizedLimit;

//       const [data, total] = await Promise.all([
//         this.model
//           .find(sanitizedCriteria)
//           .populate(populateOptions || "caseReported reportedBy lawyersInCourt")
//           .sort(sortOptions)
//           .skip(startIndex)
//           .limit(sanitizedLimit),
//         this.model.countDocuments(sanitizedCriteria),
//       ]);

//       return this.formatResponse(data, total, sanitizedPage, sanitizedLimit);
//     } catch (error) {
//       console.error("Advanced search error:", error);
//       throw new Error(`Advanced search error: ${error.message}`);
//     }
//   }

//   formatResponse(data, total, page, limit) {
//     const totalPages = Math.ceil(total / limit);

//     return {
//       success: true,
//       data,
//       pagination: {
//         current: page,
//         total: totalPages,
//         count: data.length,
//         limit: limit,
//         totalRecords: total,
//         hasNext: page < totalPages,
//         hasPrev: page > 1,
//         nextPage: page < totalPages ? page + 1 : null,
//         prevPage: page > 1 ? page - 1 : null,
//       },
//     };
//   }
// }

// module.exports = GenericPaginationService;

// services/GenericPaginationService.js - With debugging support
const QueryBuilder = require("../utils/queryBuilder");

class GenericPaginationService {
  constructor(model, modelConfig = {}) {
    this.model = model;
    this.config = {
      searchableFields: modelConfig.searchableFields || [],
      filterableFields: modelConfig.filterableFields || [],
      defaultSort: modelConfig.defaultSort || "-date",
      dateField: modelConfig.dateField || "date",
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
        caseId,
        caseSearch,
        debug, // ✅ Add debug flag
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
      const sortOptions = QueryBuilder.buildSort(sort, this.config.defaultSort);

      // Handle case search - find cases matching the search and get their reports
      if (caseSearch && !caseId) {
        const caseIds = await this.findCaseIdsBySearch(caseSearch);
        finalFilter.caseReported = { $in: caseIds };
        delete finalFilter.caseSearch;
      }

      // ✅ Debug logging (enable by adding ?debug=true to query)
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
      } else {
        // Default population for reports
        if (this.model.modelName === "Report") {
          query = query.populate("caseReported reportedBy lawyersInCourt");
        } else if (this.model.modelName === "DocumentRecord") {
          query = query.populate("recipient forwardedTo");
        }
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

  // Find case IDs by search term
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
      }).select("_id");

      return matchingCases.map((caseDoc) => caseDoc._id);
    } catch (error) {
      console.error("Error finding cases by search:", error);
      return [];
    }
  }

  // Get reports for a specific case
  async getReportsByCaseId(caseId, queryParams = {}) {
    return this.paginate({ ...queryParams, caseId });
  }

  // Search reports by case name/suit number
  async searchReportsByCase(searchTerm, queryParams = {}) {
    return this.paginate({ ...queryParams, caseSearch: searchTerm });
  }

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

      const [data, total] = await Promise.all([
        this.model
          .find(sanitizedCriteria)
          .populate(
            populateOptions ||
              (this.model.modelName === "Report"
                ? "caseReported reportedBy lawyersInCourt"
                : this.model.modelName === "DocumentRecord"
                ? "recipient forwardedTo"
                : "")
          )
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
