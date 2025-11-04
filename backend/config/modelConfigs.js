// config/modelConfigs.js - Fixed for your Case model
// const modelConfigs = {
//   Report: {
//     searchableFields: ["update", "adjournedFor", "clientEmail"],
//     filterableFields: [
//       "reportedBy",
//       "caseReported",
//       "lawyersInCourt",
//       "clientEmail",
//       "caseId",
//       "caseSearch",
//       "includeDeleted",
//       "onlyDeleted",
//     ],
//     defaultSort: "-date",
//     dateField: "date",
//     maxLimit: 50,
//     defaultPopulate: [
//       {
//         path: "caseReported",
//         select:
//           "firstParty secondParty suitNo courtNo client courtName location state",
//       },
//       { path: "reportedBy", select: "firstName lastName middleName" },
//       { path: "lawyersInCourt", select: "firstName lastName middleName" },
//     ],
//   },

//   Case: {
//     searchableFields: [
//       "firstParty.name.name",
//       "secondParty.name.name",
//       "otherParty.name.name",
//       "suitNo",
//       "courtNo",
//       "courtName",
//       "location",
//       "state",
//       "caseSummary",
//       "generalComment",
//     ],
//     filterableFields: [
//       "caseStatus",
//       "courtName",
//       "state",
//       "location",
//       "category",
//       "natureOfCase",
//       "casePriority",
//       "isFiledByTheOffice",
//       "filingDate",
//       "accountOfficer",
//       "client",
//       "includeDeleted",
//       "onlyDeleted",
//     ],
//     defaultSort: "-filingDate",
//     dateField: "filingDate",
//     maxLimit: 100,
//     defaultPopulate: [
//       {
//         path: "accountOfficer",
//         select: "firstName lastName phone email photo",
//       },
//       {
//         path: "client",
//         select: "firstName lastName phone email",
//       },
//     ],
//   },

//   User: {
//     searchableFields: [
//       "firstName",
//       "lastName",
//       "middleName",
//       "email",
//       "phone",
//       "position",
//       "practiceArea",
//       "lawSchoolAttended",
//       "universityAttended",
//       "bio",
//     ],
//     filterableFields: [
//       "role",
//       "isActive",
//       "isLawyer",
//       "position",
//       "gender",
//       "practiceArea",
//       "includeDeleted",
//       "onlyDeleted",
//     ],
//     defaultSort: "firstName",
//     maxLimit: 100,
//     defaultPopulate: [], // No default population for users
//   },

//   DocumentRecord: {
//     searchableFields: [
//       "documentName",
//       "documentType",
//       "docRef",
//       "sender",
//       "note",
//     ],
//     filterableFields: [
//       "documentType",
//       "sender",
//       "recipient",
//       "forwardedTo",
//       "dateReceived",
//       "startDate",
//       "endDate",
//       "includeDeleted",
//       "onlyDeleted",
//     ],
//     defaultSort: "-dateReceived",
//     dateField: "dateReceived",
//     maxLimit: 50,
//     defaultPopulate: [
//       {
//         path: "recipient",
//         select: "firstName lastName email",
//       },
//       {
//         path: "forwardedTo",
//         select: "firstName lastName email",
//       },
//     ],
//   },
// };

// module.exports = modelConfigs;

// config/modelConfigs.js - With text filter fields defined
const modelConfigs = {
  Report: {
    searchableFields: ["update", "adjournedFor", "clientEmail"],
    filterableFields: [
      "reportedBy",
      "caseReported",
      "lawyersInCourt",
      "clientEmail",
      "caseId",
      "caseSearch",
      "includeDeleted",
      "onlyDeleted",
    ],
    textFilterFields: ["clientEmail"], // ✅ Fields that should use partial matching
    defaultSort: "-date",
    dateField: "date",
    maxLimit: 50,
    defaultPopulate: [
      {
        path: "caseReported",
        select:
          "firstParty secondParty suitNo courtNo client courtName location state",
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
      "sender", // ✅ Will now use partial matching!
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
