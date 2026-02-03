// ============================================
// CORPORATE CONSTANTS
// ============================================

// Transaction Types (20 types from backend)
export const TRANSACTION_TYPES = [
  {
    value: "merger_acquisition",
    label: "Merger & Acquisition",
    icon: "🤝",
    color: "blue",
  },
  {
    value: "company_incorporation",
    label: "Company Incorporation",
    icon: "🏢",
    color: "green",
  },
  {
    value: "joint_venture",
    label: "Joint Venture",
    icon: "🔗",
    color: "purple",
  },
  {
    value: "shareholder_agreement",
    label: "Shareholder Agreement",
    icon: "📄",
    color: "orange",
  },
  {
    value: "corporate_governance",
    label: "Corporate Governance",
    icon: "⚖️",
    color: "cyan",
  },
  {
    value: "securities_offering",
    label: "Securities Offering",
    icon: "📈",
    color: "magenta",
  },
  {
    value: "private_equity",
    label: "Private Equity",
    icon: "💼",
    color: "gold",
  },
  {
    value: "venture_capital",
    label: "Venture Capital",
    icon: "🚀",
    color: "lime",
  },
  {
    value: "debt_financing",
    label: "Debt Financing",
    icon: "💰",
    color: "red",
  },
  {
    value: "restructuring",
    label: "Restructuring",
    icon: "🔄",
    color: "volcano",
  },
  { value: "insolvency", label: "Insolvency", icon: "📉", color: "grey" },
  {
    value: "corporate_compliance",
    label: "Corporate Compliance",
    icon: "✅",
    color: "geekblue",
  },
  {
    value: "board_advisory",
    label: "Board Advisory",
    icon: "👔",
    color: "purple",
  },
  {
    value: "share_purchase",
    label: "Share Purchase",
    icon: "📊",
    color: "blue",
  },
  {
    value: "asset_purchase",
    label: "Asset Purchase",
    icon: "🏗️",
    color: "orange",
  },
  { value: "divestiture", label: "Divestiture", icon: "📤", color: "red" },
  {
    value: "partnership_formation",
    label: "Partnership Formation",
    icon: "🤝",
    color: "green",
  },
  {
    value: "franchise_agreement",
    label: "Franchise Agreement",
    icon: "🏪",
    color: "gold",
  },
  {
    value: "distribution_agreement",
    label: "Distribution Agreement",
    icon: "🚚",
    color: "cyan",
  },
  { value: "licensing", label: "Licensing", icon: "📜", color: "magenta" },
  { value: "other", label: "Other", icon: "📋", color: "default" },
];

// Entity Types
export const ENTITY_TYPES = [
  { value: "company", label: "Company", icon: "🏢" },
  { value: "individual", label: "Individual", icon: "👤" },
  { value: "partnership", label: "Partnership", icon: "🤝" },
  { value: "trust", label: "Trust", icon: "🏛️" },
  { value: "government", label: "Government Entity", icon: "🏛️" },
];

// Company Types (8 types from backend)
export const COMPANY_TYPES = [
  {
    value: "private_limited",
    label: "Private Limited Company",
    short: "Pvt Ltd",
  },
  { value: "public_limited", label: "Public Limited Company", short: "PLC" },
  { value: "unlimited", label: "Unlimited Company", short: "Unlimited" },
  { value: "partnership", label: "Partnership", short: "Partnership" },
  {
    value: "sole_proprietorship",
    label: "Sole Proprietorship",
    short: "Sole Prop",
  },
  {
    value: "incorporated_trustees",
    label: "Incorporated Trustees",
    short: "Inc Trustees",
  },
  { value: "business_name", label: "Business Name", short: "Business" },
  { value: "foreign_company", label: "Foreign Company", short: "Foreign" },
];

// Payment Structure
export const PAYMENT_STRUCTURES = [
  { value: "lump_sum", label: "Lump Sum", icon: "💵" },
  { value: "installments", label: "Installments", icon: "📊" },
  { value: "milestone_based", label: "Milestone-Based", icon: "🎯" },
  { value: "other", label: "Other", icon: "📋" },
];

// Milestone Status
export const MILESTONE_STATUS = [
  { value: "pending", label: "Pending", color: "blue" },
  { value: "in-progress", label: "In Progress", color: "orange" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "overdue", label: "Overdue", color: "red" },
];

// Due Diligence Status
export const DUE_DILIGENCE_STATUS = [
  { value: "not-started", label: "Not Started", color: "default" },
  { value: "in-progress", label: "In Progress", color: "blue" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "waived", label: "Waived", color: "grey" },
];

// Regulatory Approval Status
export const APPROVAL_STATUS = [
  { value: "pending", label: "Pending", color: "blue" },
  { value: "approved", label: "Approved", color: "green" },
  { value: "rejected", label: "Rejected", color: "red" },
  { value: "not-required", label: "Not Required", color: "grey" },
];

// Regulatory Authorities (Nigerian authorities)
export const REGULATORY_AUTHORITIES = [
  {
    value: "SEC",
    label: "Securities and Exchange Commission (SEC)",
    short: "SEC",
  },
  { value: "CAC", label: "Corporate Affairs Commission (CAC)", short: "CAC" },
  {
    value: "FCCPC",
    label: "Federal Competition & Consumer Protection Commission",
    short: "FCCPC",
  },
  { value: "CBN", label: "Central Bank of Nigeria (CBN)", short: "CBN" },
  {
    value: "NAICOM",
    label: "National Insurance Commission (NAICOM)",
    short: "NAICOM",
  },
  {
    value: "PENCOM",
    label: "National Pension Commission (PENCOM)",
    short: "PENCOM",
  },
  { value: "NSE", label: "Nigerian Stock Exchange (NSE)", short: "NSE" },
  {
    value: "NERC",
    label: "Nigerian Electricity Regulatory Commission",
    short: "NERC",
  },
  { value: "NCC", label: "Nigerian Communications Commission", short: "NCC" },
  {
    value: "NOTAP",
    label: "National Office for Technology Acquisition and Promotion",
    short: "NOTAP",
  },
  { value: "FME", label: "Federal Ministry of Environment", short: "FME" },
  {
    value: "NIPC",
    label: "Nigerian Investment Promotion Commission",
    short: "NIPC",
  },
  { value: "Other", label: "Other Regulatory Authority", short: "Other" },
];

// Agreement Status
export const AGREEMENT_STATUS = [
  { value: "draft", label: "Draft", color: "default" },
  { value: "under-review", label: "Under Review", color: "blue" },
  { value: "executed", label: "Executed", color: "green" },
  { value: "terminated", label: "Terminated", color: "red" },
];

// Compliance Status
export const COMPLIANCE_STATUS = [
  { value: "pending", label: "Pending", color: "blue" },
  { value: "met", label: "Met", color: "green" },
  { value: "overdue", label: "Overdue", color: "red" },
  { value: "waived", label: "Waived", color: "grey" },
];

// Risk Severity
export const RISK_SEVERITY = [
  { value: "low", label: "Low", color: "green" },
  { value: "medium", label: "Medium", color: "orange" },
  { value: "high", label: "High", color: "red" },
  { value: "critical", label: "Critical", color: "volcano" },
];

// Risk Status
export const RISK_STATUS = [
  { value: "open", label: "Open", color: "red" },
  { value: "mitigated", label: "Mitigated", color: "orange" },
  { value: "accepted", label: "Accepted", color: "blue" },
  { value: "closed", label: "Closed", color: "green" },
];

// Post-Completion Obligation Status
export const OBLIGATION_STATUS = [
  { value: "pending", label: "Pending", color: "blue" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "overdue", label: "Overdue", color: "red" },
];

// Agreement Types
export const AGREEMENT_TYPES = [
  "Share Purchase Agreement",
  "Asset Purchase Agreement",
  "Merger Agreement",
  "Joint Venture Agreement",
  "Shareholders Agreement",
  "Subscription Agreement",
  "Underwriting Agreement",
  "Loan Agreement",
  "Security Agreement",
  "Franchise Agreement",
  "Distribution Agreement",
  "License Agreement",
  "Non-Disclosure Agreement",
  "Service Agreement",
  "Management Agreement",
  "Escrow Agreement",
  "Other",
];

// Legal Opinion Types
export const OPINION_TYPES = [
  "Tax Opinion",
  "Regulatory Opinion",
  "Legal Due Diligence Opinion",
  "Title Opinion",
  "Corporate Opinion",
  "Compliance Opinion",
  "IP Opinion",
  "Labor Opinion",
  "Environmental Opinion",
  "Other",
];

// Nigerian States (for jurisdiction)
export const NIGERIAN_STATES = [
  { value: "abia", label: "Abia" },
  { value: "adamawa", label: "Adamawa" },
  { value: "akwa-ibom", label: "Akwa Ibom" },
  { value: "anambra", label: "Anambra" },
  { value: "bauchi", label: "Bauchi" },
  { value: "bayelsa", label: "Bayelsa" },
  { value: "benue", label: "Benue" },
  { value: "borno", label: "Borno" },
  { value: "cross-river", label: "Cross River" },
  { value: "delta", label: "Delta" },
  { value: "ebonyi", label: "Ebonyi" },
  { value: "edo", label: "Edo" },
  { value: "ekiti", label: "Ekiti" },
  { value: "enugu", label: "Enugu" },
  { value: "fct", label: "Federal Capital Territory" },
  { value: "gombe", label: "Gombe" },
  { value: "imo", label: "Imo" },
  { value: "jigawa", label: "Jigawa" },
  { value: "kaduna", label: "Kaduna" },
  { value: "kano", label: "Kano" },
  { value: "katsina", label: "Katsina" },
  { value: "kebbi", label: "Kebbi" },
  { value: "kogi", label: "Kogi" },
  { value: "kwara", label: "Kwara" },
  { value: "lagos", label: "Lagos" },
  { value: "nasarawa", label: "Nasarawa" },
  { value: "niger", label: "Niger" },
  { value: "ogun", label: "Ogun" },
  { value: "ondo", label: "Ondo" },
  { value: "osun", label: "Osun" },
  { value: "oyo", label: "Oyo" },
  { value: "plateau", label: "Plateau" },
  { value: "rivers", label: "Rivers" },
  { value: "sokoto", label: "Sokoto" },
  { value: "taraba", label: "Taraba" },
  { value: "yobe", label: "Yobe" },
  { value: "zamfara", label: "Zamfara" },
];

// Common Currencies
export const CURRENCIES = [
  { value: "NGN", label: "Nigerian Naira (₦)", symbol: "₦" },
  { value: "USD", label: "US Dollar ($)", symbol: "$" },
  { value: "GBP", label: "British Pound (£)", symbol: "£" },
  { value: "EUR", label: "Euro (€)", symbol: "€" },
  { value: "ZAR", label: "South African Rand (R)", symbol: "R" },
  { value: "GHS", label: "Ghanaian Cedi (₵)", symbol: "₵" },
  { value: "KES", label: "Kenyan Shilling (KSh)", symbol: "KSh" },
];

// Date Format
export const DATE_FORMAT = "DD/MM/YYYY";
export const DATETIME_FORMAT = "DD/MM/YYYY HH:mm";

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = ["10", "20", "50", "100"];

// Table Columns Export
export const CORPORATE_TABLE_COLUMNS = [
  "matterNumber",
  "title",
  "transactionType",
  "companyName",
  "companyType",
  "dealValue",
  "expectedClosingDate",
  "status",
  "priority",
];

// Helper Functions
export const getTransactionTypeLabel = (value) => {
  return TRANSACTION_TYPES.find((t) => t.value === value)?.label || value;
};

export const getEntityTypeLabel = (value) => {
  return ENTITY_TYPES.find((e) => e.value === value)?.label || value;
};

export const getCompanyTypeLabel = (value) => {
  return COMPANY_TYPES.find((c) => c.value === value)?.label || value;
};

export const getMilestoneStatusColor = (status) => {
  return MILESTONE_STATUS.find((s) => s.value === status)?.color || "default";
};

export const getApprovalStatusColor = (status) => {
  return APPROVAL_STATUS.find((s) => s.value === status)?.color || "default";
};

export const getRiskSeverityColor = (severity) => {
  return RISK_SEVERITY.find((r) => r.value === severity)?.color || "default";
};

export const formatCurrency = (amount, currency = "NGN") => {
  const currencyObj = CURRENCIES.find((c) => c.value === currency);
  const symbol = currencyObj?.symbol || currency;

  if (!amount && amount !== 0) return "-";

  return `${symbol} ${new Intl.NumberFormat("en-NG").format(amount)}`;
};

export const calculateOwnershipPercentage = (numberOfShares, totalShares) => {
  if (!totalShares || totalShares === 0) return 0;
  return ((numberOfShares / totalShares) * 100).toFixed(2);
};

export const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

export const getDaysUntil = (date) => {
  if (!date) return null;
  const diff = new Date(date) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getProgressPercentage = (completed, total) => {
  if (!total || total === 0) return 0;
  return ((completed / total) * 100).toFixed(0);
};
