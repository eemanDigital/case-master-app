// Court Types
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

// Mode of Commencement
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

// Case Stages
export const CASE_STAGES = [
  { value: "pre-trial", label: "Pre-Trial", color: "blue" },
  { value: "trial", label: "Trial", color: "orange" },
  { value: "judgment", label: "Judgment", color: "purple" },
  { value: "appeal", label: "Appeal", color: "cyan" },
  { value: "execution", label: "Execution", color: "geekblue" },
  { value: "settled", label: "Settled", color: "green" },
  { value: "closed", label: "Closed", color: "default" },
];

// Judgment Outcomes
export const JUDGMENT_OUTCOMES = [
  { value: "won", label: "Won", color: "success" },
  { value: "lost", label: "Lost", color: "error" },
  { value: "partially-won", label: "Partially Won", color: "warning" },
  { value: "dismissed", label: "Dismissed", color: "default" },
  { value: "struck-out", label: "Struck Out", color: "default" },
  { value: "pending", label: "Pending", color: "processing" },
];

// Process Status
export const PROCESS_STATUS = [
  { value: "pending", label: "Pending", color: "default" },
  { value: "filed", label: "Filed", color: "processing" },
  { value: "served", label: "Served", color: "success" },
  { value: "completed", label: "Completed", color: "success" },
];

// Compliance Status
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

// Appeal Status
export const APPEAL_STATUS = [
  { value: "pending", label: "Pending", color: "processing" },
  { value: "won", label: "Won", color: "success" },
  { value: "lost", label: "Lost", color: "error" },
  { value: "withdrawn", label: "Withdrawn", color: "default" },
  { value: "dismissed", label: "Dismissed", color: "default" },
];

// Matter Status (from backend)
export const MATTER_STATUS = [
  { value: "active", label: "Active", color: "processing" },
  { value: "pending", label: "Pending", color: "warning" },
  { value: "completed", label: "Completed", color: "success" },
  { value: "won", label: "Won", color: "success" },
  { value: "lost", label: "Lost", color: "error" },
  { value: "settled", label: "Settled", color: "cyan" },
  { value: "closed", label: "Closed", color: "default" },
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
  "FCT",
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

// Table pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = ["10", "20", "50", "100"];

// Date formats
export const DATE_FORMAT = "DD/MM/YYYY";
export const DATE_TIME_FORMAT = "DD/MM/YYYY HH:mm";
export const API_DATE_FORMAT = "YYYY-MM-DD";

// File upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];
