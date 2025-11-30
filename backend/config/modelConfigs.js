// config/modelConfigs.js - FIXED Report configuration

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
    ],
    textFilterFields: ["clientEmail", "adjournedFor", "update"],
    defaultSort: "-date",
    dateField: "date",
    maxLimit: 50,
    defaultPopulate: [
      {
        path: "caseReported",
        select:
          "firstParty secondParty suitNo courtNo client courtName location state accountOfficer",
      },
      {
        path: "documents",
        select: "_id fileName fileType", // Only minimal fields for lists
        options: { limit: 3 }, // Only show first 3 documents in lists
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
    ],
    textFilterFields: ["courtName", "location", "state"], // ✅ Partial matching
    defaultSort: "-filingDate",
    dateField: "filingDate",
    maxLimit: 100,
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
    ],
    textFilterFields: ["position", "practiceArea"], // ✅ Partial matching
    defaultSort: "firstName",
    maxLimit: 100,
    defaultPopulate: [],
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
    ],
    textFilterFields: ["sender", "docRef"], // ✅ Explicitly define text fields
    defaultSort: "-dateReceived",
    dateField: "dateReceived",
    maxLimit: 50,
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
};

module.exports = modelConfigs;
