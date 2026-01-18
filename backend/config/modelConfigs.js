// config/modelConfigs.js - WITH MULTI-TENANCY

const modelConfigs = {
  Report: {
    searchableFields: [
      "update",
      "adjournedFor",
      "caseReported.firstParty.name",
      "caseReported.secondParty.name",
      "caseReported.suitNo",
      "caseReported.courtName",
      "caseReported.courtNo",
      "caseReported.location",
      "caseReported.state",
      "caseReported.accountOfficer.firstName",
      "caseReported.accountOfficer.lastName",
    ],
    filterableFields: [
      "reportedBy",
      "caseReported.suitNo",
      "caseReported.courtNo",
      "lawyersInCourt",
      "clientEmail",
      "adjournedFor",
      "caseId",
      "caseSearch",
      "startDate",
      "endDate",
      "includeDeleted",
      "onlyDeleted",
      "firmId", // ✅ Added
    ],
    textFilterFields: ["clientEmail", "adjournedFor", "update"],
    defaultSort: "-date",
    dateField: "date",
    maxLimit: 50,
    requiresFirmId: true, // ✅ NEW: Enforce firmId
    defaultPopulate: [
      {
        path: "caseReported",
        select:
          "firstParty secondParty suitNo courtNo client courtName location state accountOfficer",
      },
      {
        path: "documents",
        select: "_id fileName fileType",
        options: { limit: 3 },
        match: {
          isDeleted: { $ne: true },
          isArchived: { $ne: true },
        },
      },
      { path: "reportedBy", select: "firstName lastName middleName" },
      { path: "lawyersInCourt", select: "firstName lastName middleName" },
    ],
  },

  Case: {
    searchableFields: [
      "firstParty.name.name",
      "secondParty.name.name",
      "otherParty.name.name",
      "suitNo",
      "courtNo",
      "courtName",
      "location",
      "state",
      "caseSummary",
      "generalComment",
    ],
    filterableFields: [
      "caseStatus",
      "courtName",
      "state",
      "location",
      "category",
      "natureOfCase",
      "casePriority",
      "isFiledByTheOffice",
      "filingDate",
      "accountOfficer",
      "client",
      "startDate",
      "endDate",
      "includeDeleted",
      "onlyDeleted",
      "firmId", // ✅ Added
    ],
    textFilterFields: ["courtName", "location", "state"],
    defaultSort: "-filingDate",
    dateField: "filingDate",
    maxLimit: 100,
    requiresFirmId: true, // ✅ NEW: Enforce firmId
    defaultPopulate: [
      {
        path: "accountOfficer",
        select: "firstName lastName phone email photo",
      },
      {
        path: "client",
        select: "firstName lastName phone email",
      },
    ],
  },

  User: {
    searchableFields: [
      "firstName",
      "lastName",
      "middleName",
      "email",
      "phone",
      "position",
      "practiceArea",
      "lawSchoolAttended",
      "universityAttended",
      "bio",
    ],
    filterableFields: [
      "role",
      "isActive",
      "isLawyer",
      "position",
      "gender",
      "practiceArea",
      "includeDeleted",
      "onlyDeleted",
      "firmId", // ✅ Added
    ],
    textFilterFields: ["position", "practiceArea"],
    defaultSort: "-createdAt",
    maxLimit: 100,
    requiresFirmId: true, // ✅ NEW: Enforce firmId
    defaultPopulate: [],
    includeStats: true, // ✅ Enable statistics for User model
  },

  DocumentRecord: {
    searchableFields: [
      "documentName",
      "documentType",
      "docRef",
      "sender",
      "note",
    ],
    filterableFields: [
      "documentType",
      "sender",
      "recipient",
      "forwardedTo",
      "dateReceived",
      "startDate",
      "endDate",
      "includeDeleted",
      "onlyDeleted",
      "firmId", // ✅ Added
    ],
    textFilterFields: ["sender", "docRef"],
    defaultSort: "-dateReceived",
    dateField: "dateReceived",
    maxLimit: 50,
    requiresFirmId: true, // ✅ NEW: Enforce firmId
    defaultPopulate: [
      {
        path: "recipient",
        select: "firstName lastName email",
      },
      {
        path: "forwardedTo",
        select: "firstName lastName email",
      },
    ],
  },

  Task: {
    searchableFields: [
      "title",
      "description",
      "category",
      "caseToWorkOn.suitNo",
      "caseToWorkOn.firstParty.name",
      "caseToWorkOn.secondParty.name",
    ],
    filterableFields: [
      "status",
      "taskPriority",
      "category",
      "assignees.user",
      "createdBy",
      "caseToWorkOn",
      "dueDate",
      "startDate",
      "endDate",
      "includeDeleted",
      "onlyDeleted",
      "firmId", // ✅ Added
    ],
    textFilterFields: ["title", "description", "category"],
    defaultSort: "-dateCreated",
    dateField: "dateCreated",
    maxLimit: 100,
    requiresFirmId: true, // ✅ NEW: Enforce firmId
    defaultPopulate: [
      { path: "createdBy", select: "firstName lastName email position" },
      { path: "assignees.user", select: "firstName lastName email position" },
      {
        path: "caseToWorkOn",
        select: "suitNo firstParty.name secondParty.name caseStatus",
      },
    ],
  },

  File: {
    searchableFields: ["fileName", "originalName", "description", "tags"],
    filterableFields: [
      "category",
      "entityType",
      "entityId",
      "uploadedBy",
      "fileType",
      "isArchived",
      "includeDeleted",
      "onlyDeleted",
      "firmId", // ✅ Added
    ],
    textFilterFields: ["fileName", "description"],
    defaultSort: "-createdAt",
    dateField: "createdAt",
    maxLimit: 100,
    requiresFirmId: true, // ✅ NEW: Enforce firmId
    defaultPopulate: [
      { path: "uploadedBy", select: "firstName lastName email" },
    ],
  },

  // ✅ NEW: Firm model config (for super-admin queries)
  Firm: {
    searchableFields: ["name", "contact.email", "contact.phone", "subdomain"],
    filterableFields: [
      "subscription.status",
      "subscription.plan",
      "isActive",
      "includeDeleted",
      "onlyDeleted",
    ],
    textFilterFields: ["name", "subdomain"],
    defaultSort: "-createdAt",
    dateField: "createdAt",
    maxLimit: 100,
    requiresFirmId: false, // ✅ Firm queries don't need firmId filter
    defaultPopulate: [],
  },
};

module.exports = modelConfigs;
