// ============================================
// PROPERTY CONSTANTS
// ============================================

// Transaction Types (from backend)
export const TRANSACTION_TYPES = [
  {
    value: "purchase",
    label: "Purchase",
    icon: "🏠",
    color: "blue",
  },
  {
    value: "sale",
    label: "Sale",
    icon: "💰",
    color: "green",
  },
  {
    value: "lease",
    label: "Lease",
    icon: "📜",
    color: "purple",
  },
  {
    value: "sublease",
    label: "Sublease",
    icon: "🔗",
    color: "orange",
  },
  {
    value: "mortgage",
    label: "Mortgage",
    icon: "🏦",
    color: "cyan",
  },
  {
    value: "property_development",
    label: "Property Development",
    icon: "🏗️",
    color: "magenta",
  },
  {
    value: "land_acquisition",
    label: "Land Acquisition",
    icon: "🌍",
    color: "gold",
  },
  {
    value: "title_perfection",
    label: "Title Perfection",
    icon: "✅",
    color: "lime",
  },
  {
    value: "boundary_dispute",
    label: "Boundary Dispute",
    icon: "⚠️",
    color: "red",
  },
  {
    value: "tenancy_matter",
    label: "Tenancy Matter",
    icon: "👥",
    color: "volcano",
  },
  {
    value: "property_management",
    label: "Property Management",
    icon: "🏢",
    color: "geekblue",
  },
  {
    value: "foreclosure",
    label: "Foreclosure",
    icon: "📉",
    color: "grey",
  },
  {
    value: "partition",
    label: "Partition",
    icon: "✂️",
    color: "blue",
  },
  {
    value: "right_of_way",
    label: "Right of Way",
    icon: "🛣️",
    color: "orange",
  },
  {
    value: "easement",
    label: "Easement",
    icon: "⚖️",
    color: "red",
  },
  {
    value: "other",
    label: "Other",
    icon: "📋",
    color: "default",
  },
];

// Property Types
export const PROPERTY_TYPES = [
  {
    value: "residential",
    label: "Residential",
    icon: "🏡",
    color: "blue",
  },
  {
    value: "commercial",
    label: "Commercial",
    icon: "🏢",
    color: "green",
  },
  {
    value: "industrial",
    label: "Industrial",
    icon: "🏭",
    color: "orange",
  },
  {
    value: "agricultural",
    label: "Agricultural",
    icon: "🌾",
    color: "brown",
  },
  {
    value: "mixed-use",
    label: "Mixed Use",
    icon: "🏘️",
    color: "purple",
  },
  {
    value: "land",
    label: "Land",
    icon: "🌍",
    color: "geekblue",
  },
];

// Title Documents
export const TITLE_DOCUMENTS = [
  { value: "c-of-o", label: "Certificate of Occupancy", short: "C of O" },
  { value: "deed-of-assignment", label: "Deed of Assignment", short: "Deed" },
  {
    value: "governors-consent",
    label: "Governor's Consent",
    short: "Gov Consent",
  },
  { value: "survey-plan", label: "Survey Plan", short: "Survey" },
  { value: "other", label: "Other Document", short: "Other" },
];

// Payment Terms
export const PAYMENT_TERMS = [
  { value: "lump-sum", label: "Lump Sum", icon: "💵" },
  { value: "installments", label: "Installments", icon: "📊" },
  { value: "mortgage", label: "Mortgage", icon: "🏦" },
  { value: "other", label: "Other", icon: "📋" },
];

// Rent Frequencies
export const RENT_FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
  { value: "one-time", label: "One Time" },
];

// Land Size Units
export const LAND_SIZE_UNITS = [
  { value: "sqm", label: "Square Meters (sqm)" },
  { value: "sqft", label: "Square Feet (sqft)" },
  { value: "hectares", label: "Hectares" },
  { value: "acres", label: "Acres" },
  { value: "plots", label: "Plots" },
];

// Nigerian States
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

// Currencies
export const CURRENCIES = [
  { value: "NGN", label: "Nigerian Naira (₦)", symbol: "₦" },
  { value: "USD", label: "US Dollar ($)", symbol: "$" },
  { value: "GBP", label: "British Pound (£)", symbol: "£" },
  { value: "EUR", label: "Euro (€)", symbol: "€" },
];

// Payment Status
export const PAYMENT_STATUS = [
  { value: "pending", label: "Pending", color: "blue" },
  { value: "paid", label: "Paid", color: "green" },
  { value: "overdue", label: "Overdue", color: "red" },
  { value: "waived", label: "Waived", color: "grey" },
];

// Condition Status
export const CONDITION_STATUS = [
  { value: "pending", label: "Pending", color: "blue" },
  { value: "met", label: "Met", color: "green" },
  { value: "waived", label: "Waived", color: "grey" },
  { value: "overdue", label: "Overdue", color: "red" },
];

// Legal Document Status
export const DOCUMENT_STATUS = [
  { value: "draft", label: "Draft", color: "default" },
  { value: "executed", label: "Executed", color: "blue" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "terminated", label: "Terminated", color: "red" },
  { value: "active", label: "Active", color: "green" },
  { value: "expired", label: "Expired", color: "grey" },
  { value: "pending", label: "Pending", color: "processing" },
  { value: "registered", label: "Registered", color: "success" },
];

// Approval Status
export const APPROVAL_STATUS = [
  { value: "not-required", label: "Not Required", color: "default" },
  { value: "pending", label: "Pending", color: "processing" },
  { value: "approved", label: "Approved", color: "success" },
  { value: "rejected", label: "Rejected", color: "error" },
];

// Date Format
export const DATE_FORMAT = "DD/MM/YYYY";

// Helper Functions
export const getTransactionTypeLabel = (value) => {
  return TRANSACTION_TYPES.find((t) => t.value === value)?.label || value;
};

export const getPropertyTypeLabel = (value) => {
  return PROPERTY_TYPES.find((p) => p.value === value)?.label || value;
};

export const getTitleDocumentLabel = (value) => {
  return TITLE_DOCUMENTS.find((d) => d.value === value)?.label || value;
};

export const getPaymentTermLabel = (value) => {
  return PAYMENT_TERMS.find((t) => t.value === value)?.label || value;
};

export const formatCurrency = (amount, currency = "NGN") => {
  const currencyObj = CURRENCIES.find((c) => c.value === currency);
  const symbol = currencyObj?.symbol || currency;

  if (!amount && amount !== 0) return "-";

  return `${symbol} ${new Intl.NumberFormat("en-NG").format(amount)}`;
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

export const formatLandSize = (value, unit) => {
  if (!value) return "-";
  const unitLabel =
    LAND_SIZE_UNITS.find((u) => u.value === unit)?.label || unit;
  return `${value.toLocaleString()} ${unitLabel}`;
};
