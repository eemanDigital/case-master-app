// Court Types - Exactly matching model enum
export const COURT_TYPES = [
  { value: "supreme court", label: "Supreme Court" },
  { value: "court of appeal", label: "Court of Appeal" },
  { value: "federal high court", label: "Federal High Court" },
  { value: "high court", label: "High Court" },
  { value: "national industrial court", label: "National Industrial Court" },
  { value: "sharia courts of appeal", label: "Sharia Courts of Appeal" },
  { value: "customary court of appeal", label: "Customary Court of Appeal" },
  { value: "magistrate court", label: "Magistrate Court" },
  { value: "customary court", label: "Customary Court" },
  { value: "sharia court", label: "Sharia Court" },
  { value: "area court", label: "Area Court" },
  { value: "coroner", label: "Coroner" },
  { value: "tribunal", label: "Tribunal" },
  { value: "election tribunal", label: "Election Tribunal" },
  { value: "code of conduct tribunal", label: "Code of Conduct Tribunal" },
  { value: "tax appeal tribunal", label: "Tax Appeal Tribunal" },
  { value: "rent tribunal", label: "Rent Tribunal" },
  { value: "others", label: "Others" },
];

// Mode of Commencement - Exactly matching model enum
export const COMMENCEMENT_MODES = [
  { value: "writ of summons", label: "Writ of Summons" },
  { value: "originating summons", label: "Originating Summons" },
  { value: "originating motion", label: "Originating Motion" },
  { value: "petition", label: "Petition" },
  { value: "information", label: "Information" },
  { value: "charge", label: "Charge" },
  { value: "complaint", label: "Complaint" },
  { value: "indictment", label: "Indictment" },
  { value: "application", label: "Application" },
  { value: "notice of appeal", label: "Notice of Appeal" },
  { value: "notice of application", label: "Notice of Application" },
  { value: "other", label: "Other" },
];

// Case Stages - Exactly matching model enum
export const CASE_STAGES = [
  { value: "pre-trial", label: "Pre-Trial", color: "blue" },
  { value: "trial", label: "Trial", color: "orange" },
  { value: "judgment", label: "Judgment", color: "purple" },
  { value: "appeal", label: "Appeal", color: "cyan" },
  { value: "execution", label: "Execution", color: "geekblue" },
  { value: "settled", label: "Settled", color: "green" },
  { value: "closed", label: "Closed", color: "default" },
];

// Judgment Outcomes - Exactly matching model enum
export const JUDGMENT_OUTCOMES = [
  { value: "won", label: "Won", color: "success" },
  { value: "lost", label: "Lost", color: "error" },
  { value: "partially-won", label: "Partially Won", color: "warning" },
  { value: "dismissed", label: "Dismissed", color: "default" },
  { value: "struck-out", label: "Struck Out", color: "default" },
  { value: "pending", label: "Pending", color: "processing" },
];

// Process Status - Exactly matching model enum
export const PROCESS_STATUS = [
  { value: "pending", label: "Pending", color: "default" },
  { value: "filed", label: "Filed", color: "processing" },
  { value: "served", label: "Served", color: "success" },
  { value: "completed", label: "Completed", color: "success" },
];

// Compliance Status - Exactly matching model enum
export const COMPLIANCE_STATUS = [
  { value: "pending", label: "Pending", color: "default" },
  { value: "complied", label: "Complied", color: "success" },
  {
    value: "partially-complied",
    label: "Partially Complied",
    color: "warning",
  },
  { value: "not-complied", label: "Not Complied", color: "error" },
];

// Appeal Status - Exactly matching model enum
export const APPEAL_STATUS = [
  { value: "pending", label: "Pending", color: "processing" },
  { value: "won", label: "Won", color: "success" },
  { value: "lost", label: "Lost", color: "error" },
  { value: "withdrawn", label: "Withdrawn", color: "default" },
  { value: "dismissed", label: "Dismissed", color: "default" },
];

// Matter Status (from Matter model)
export const MATTER_STATUS = [
  { value: "active", label: "Active", color: "processing" },
  { value: "pending", label: "Pending", color: "warning" },
  { value: "completed", label: "Completed", color: "success" },
  { value: "closed", label: "Closed", color: "default" },
  { value: "settled", label: "Settled", color: "cyan" },
];

// Party Types
export const PARTY_TYPES = [
  { value: "firstParty", label: "First Party (Plaintiff/Applicant)" },
  { value: "secondParty", label: "Second Party (Defendant/Respondent)" },
  { value: "otherParty", label: "Other Party" },
];

// Party Categories
export const PARTY_CATEGORIES = [
  { value: "individual", label: "Individual" },
  { value: "corporate", label: "Corporate" },
  { value: "government", label: "Government" },
  { value: "ngo", label: "NGO" },
];

// Nigerian States
export const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Federal Capital Territory",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
].map((state) => ({ value: state, label: state }));

// Court Divisions (Common divisions in Nigeria)
export const COURT_DIVISIONS = [
  "Lagos Division",
  "Abuja Division",
  "Port Harcourt Division",
  "Kaduna Division",
  "Ibadan Division",
  "Enugu Division",
  "Jos Division",
  "Calabar Division",
  "Benin Division",
  "Owerri Division",
  "Sokoto Division",
  "Maiduguri Division",
  "Akure Division",
  "Yola Division",
  "Uyo Division",
  "Abeokuta Division",
  "Awka Division",
  "Makurdi Division",
  "Minna Division",
  "Asaba Division",
].map((division) => ({ value: division, label: division }));

// Hearing Purposes
export const HEARING_PURPOSES = [
  "Case Management Conference",
  "Pre-Trial Conference",
  "Motion Hearing",
  "Trial",
  "Judgment",
  "Sentencing",
  "Appeal Hearing",
  "Bail Application",
  "Submissions",
  "Adoption of Written Addresses",
  "Ruling",
  "Other",
];

// Court Order Types
export const COURT_ORDER_TYPES = [
  "Injunction",
  "Interim Order",
  "Interlocutory Order",
  "Final Order",
  "Consent Order",
  "Discovery Order",
  "Costs Order",
  "Strike Out Order",
  "Dismissal Order",
  "Judgment",
  "Appeal Order",
  "Other",
];

// Practice Areas for Litigation
export const LITIGATION_PRACTICE_AREAS = [
  "Civil Litigation",
  "Criminal Litigation",
  "Commercial Litigation",
  "Corporate Litigation",
  "Employment & Labor",
  "Family Law",
  "Property & Real Estate",
  "Intellectual Property",
  "Tax Litigation",
  "Banking & Finance",
  "Insurance",
  "Maritime",
  "Aviation",
  "Construction",
  "Environmental Law",
  "Constitutional Law",
  "Human Rights",
  "International Law",
  "Alternative Dispute Resolution",
  "Other",
];

// Document Types for Litigation
export const LITIGATION_DOCUMENT_TYPES = [
  "Writ of Summons",
  "Statement of Claim",
  "Statement of Defense",
  "Reply",
  "Notice of Appeal",
  "Affidavit",
  "Written Address",
  "Motion",
  "Petition",
  "Pleadings",
  "Evidence",
  "Court Order",
  "Judgment",
  "Settlement Agreement",
  "Correspondence",
  "Legal Opinion",
  "Research",
  "Other",
];

// Table pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = ["10", "20", "50", "100"];

// Date formats
export const DATE_FORMAT = "DD/MM/YYYY";
export const DATE_TIME_FORMAT = "DD/MM/YYYY HH:mm";
export const API_DATE_FORMAT = "YYYY-MM-DD";

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

// Field length limits (matching model)
export const FIELD_LIMITS = {
  suitNo: { min: 3, max: 100 },
  courtNo: { max: 50 },
  description: { max: 1000 },
  otherCourt: { max: 200 },
  otherModeOfCommencement: { max: 200 },
  citationReference: { max: 500 },
  judgmentSummary: { max: 5000 },
  settlementTerms: { max: 5000 },
  notes: { max: 2000 },
};

// Validation messages
export const VALIDATION_MESSAGES = {
  required: "This field is required",
  minLength: (field, min) => `${field} must be at least ${min} characters`,
  maxLength: (field, max) => `${field} must be less than ${max} characters`,
  invalidEmail: "Please enter a valid email address",
  invalidPhone: "Please enter a valid phone number",
  invalidDate: "Please select a valid date",
  invalidNumber: "Please enter a valid number",
};

// Helper function to get stage color
export const getStageColor = (stage) => {
  const stageObj = CASE_STAGES.find((s) => s.value === stage);
  return stageObj ? stageObj.color : "default";
};

// Helper function to get status color
export const getStatusColor = (status, type = "judgment") => {
  const statusMap = {
    judgment: JUDGMENT_OUTCOMES,
    process: PROCESS_STATUS,
    compliance: COMPLIANCE_STATUS,
    appeal: APPEAL_STATUS,
    matter: MATTER_STATUS,
  };

  const statusArray = statusMap[type] || MATTER_STATUS;
  const statusObj = statusArray.find((s) => s.value === status);
  return statusObj ? statusObj.color : "default";
};

// Helper function to get court label
export const getCourtLabel = (courtValue) => {
  const court = COURT_TYPES.find((c) => c.value === courtValue);
  return court ? court.label : courtValue;
};

// Helper function to get commencement mode label
export const getCommencementLabel = (modeValue) => {
  const mode = COMMENCEMENT_MODES.find((m) => m.value === modeValue);
  return mode ? mode.label : modeValue;
};

// Export all as object for easier imports
export default {
  COURT_TYPES,
  COMMENCEMENT_MODES,
  CASE_STAGES,
  JUDGMENT_OUTCOMES,
  PROCESS_STATUS,
  COMPLIANCE_STATUS,
  APPEAL_STATUS,
  MATTER_STATUS,
  PARTY_TYPES,
  PARTY_CATEGORIES,
  NIGERIAN_STATES,
  COURT_DIVISIONS,
  HEARING_PURPOSES,
  COURT_ORDER_TYPES,
  LITIGATION_PRACTICE_AREAS,
  LITIGATION_DOCUMENT_TYPES,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  DATE_FORMAT,
  DATE_TIME_FORMAT,
  API_DATE_FORMAT,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  FIELD_LIMITS,
  VALIDATION_MESSAGES,
  getStageColor,
  getStatusColor,
  getCourtLabel,
  getCommencementLabel,
};
