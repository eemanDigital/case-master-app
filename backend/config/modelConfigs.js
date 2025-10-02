//

const modelConfigs = {
  Report: {
    searchableFields: ["update", "adjournedFor", "clientEmail"],
    filterableFields: [
      "reportedBy",
      "caseReported",
      "lawyersInCourt",
      "clientEmail",
      "includeDeleted",
      "onlyDeleted",
    ],
    defaultSort: "-date",
    dateField: "date",
    maxLimit: 50,
  },

  // Add other models here
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
      "caseType",
      "natureOfCase",
      "category",
      "casePriority",
      "modeOfCommencement",
      "judge.name",
    ],
    filterableFields: [
      "firstParty.name.name",
      "secondParty.name.name",
      "suitNo",
      "courtNo",
      "caseStatus",
      "courtName",
      "state",
      "location",
      "accountOfficer",
      "filingDate",
      "modeOfCommencement",
      "casePriority",
      "category",
      "natureOfCase",
      "caseType",
      "client",
      "judge.name",
      // "nextHearingDate",
      // "includeDeleted",
      // "onlyDeleted",
    ],
    defaultSort: "-filingDate",
    dateField: "filingDate",
    maxLimit: 100,
  },

  User: {
    searchableFields: ["firstName", "lastName", "email", "middleName"],
    filterableFields: ["role", "status", "state"],
    defaultSort: "firstName",
    maxLimit: 100,
  },
};

module.exports = modelConfigs;
