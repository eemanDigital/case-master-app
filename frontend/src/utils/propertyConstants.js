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

// ============================================
// LEASE TRACKING UTILITIES
// ============================================

export const LEASE_STATUS = [
  { value: "draft", label: "Draft", color: "default" },
  { value: "executed", label: "Executed", color: "blue" },
  { value: "active", label: "Active", color: "green" },
  { value: "expired", label: "Expired", color: "red" },
  { value: "terminated", label: "Terminated", color: "orange" },
];

export const LEASE_URGENCY_LEVELS = [
  { value: "safe", label: "Safe", color: "green", icon: "✓" },
  { value: "notice", label: "Notice Period", color: "blue", icon: "ℹ" },
  { value: "warning", label: "Warning", color: "orange", icon: "⚠" },
  { value: "critical", label: "Critical", color: "red", icon: "🚨" },
  { value: "expired", label: "Expired", color: "grey", icon: "✕" },
];

export const LEASE_ALERT_THRESHOLDS = [
  { days: 7, label: "Critical (7 days)", level: "critical" },
  { days: 14, label: "Warning (14 days)", level: "warning" },
  { days: 30, label: "Notice (30 days)", level: "notice" },
  { days: 60, label: "Attention (60 days)", level: "notice" },
  { days: 90, label: "Reminder (90 days)", level: "notice" },
];

export const MILESTONE_STATUS = [
  { value: "pending", label: "Pending", color: "blue" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "skipped", label: "Skipped", color: "default" },
  { value: "overdue", label: "Overdue", color: "red" },
];

export const RENEWAL_STATUS = [
  { value: "not-initiated", label: "Not Initiated", color: "default" },
  { value: "in-progress", label: "In Progress", color: "processing" },
  { value: "agreed", label: "Agreed", color: "success" },
  { value: "disputed", label: "Disputed", color: "warning" },
  { value: "declined", label: "Declined", color: "error" },
  { value: "completed", label: "Completed", color: "green" },
];

export const NEGOTIATION_RESPONSE = [
  { value: "pending", label: "Pending", color: "processing" },
  { value: "accepted", label: "Accepted", color: "success" },
  { value: "rejected", label: "Rejected", color: "error" },
  { value: "counter-offered", label: "Counter Offered", color: "warning" },
];

export const getLeaseStatusLabel = (value) => {
  return LEASE_STATUS.find((s) => s.value === value)?.label || value;
};

export const getLeaseStatusColor = (value) => {
  return LEASE_STATUS.find((s) => s.value === value)?.color || "default";
};

export const getUrgencyLabel = (urgency) => {
  return LEASE_URGENCY_LEVELS.find((u) => u.value === urgency)?.label || urgency;
};

export const getUrgencyColor = (urgency) => {
  return LEASE_URGENCY_LEVELS.find((u) => u.value === urgency)?.color || "default";
};

export const getRenewalStatusLabel = (value) => {
  return RENEWAL_STATUS.find((s) => s.value === value)?.label || value;
};

export const getRenewalStatusColor = (value) => {
  return RENEWAL_STATUS.find((s) => s.value === value)?.color || "default";
};

export const calculateLeaseCountdown = (expiryDate) => {
  if (!expiryDate) return null;

  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry - now;

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let urgency = "safe";
  if (days <= 0) urgency = "expired";
  else if (days <= 7) urgency = "critical";
  else if (days <= 30) urgency = "warning";
  else if (days <= 90) urgency = "notice";

  return {
    days,
    weeks,
    months,
    years,
    urgency,
    isExpired: days <= 0,
    isUrgent: urgency === "critical" || urgency === "warning",
    formattedDays: days < 0 
      ? `Expired ${Math.abs(days)} days ago`
      : days === 0
        ? "Expires today"
        : days === 1
          ? "1 day remaining"
          : `${days} days remaining`,
    formattedWeeks: weeks < 0
      ? `Expired ${Math.abs(weeks)} weeks ago`
      : weeks === 0
        ? "Less than a week"
        : weeks === 1
          ? "1 week remaining"
          : `${weeks} weeks remaining`,
    formattedMonths: months < 0
      ? `Expired ${Math.abs(months)} months ago`
      : months === 0
        ? "Less than a month"
        : months === 1
          ? "1 month remaining"
          : `${months} months remaining`,
  };
};

export const calculateLeaseProgress = (commencementDate, expiryDate) => {
  if (!commencementDate || !expiryDate) return 0;

  const start = new Date(commencementDate);
  const end = new Date(expiryDate);
  const now = new Date();

  const totalDuration = end - start;
  const elapsed = now - start;

  const progress = (elapsed / totalDuration) * 100;
  return Math.max(0, Math.min(100, progress));
};

export const getTimeUntilRenewalDeadline = (renewalDeadline) => {
  if (!renewalDeadline) return null;

  const now = new Date();
  const deadline = new Date(renewalDeadline);
  const diff = deadline - now;

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      isPast: true,
      daysOverdue: Math.abs(days),
      message: `${Math.abs(days)} days overdue`,
    };
  }

  return {
    isPast: false,
    daysRemaining: days,
    message: `${days} days remaining to notify`,
  };
};

export const formatRentAmount = (rentAmount) => {
  if (!rentAmount) return "-";
  
  const amount = rentAmount.amount || rentAmount;
  const currency = rentAmount.currency || "NGN";
  const frequency = rentAmount.frequency || "";

  return `${formatCurrency(amount, currency)}${frequency ? `/${frequency.replace("-", "")}` : ""}`;
};

export const getDefaultAlertThresholds = () => [
  { days: 7, label: "critical", isActive: true },
  { days: 14, label: "warning", isActive: true },
  { days: 30, label: "notice", isActive: true },
  { days: 60, label: "notice", isActive: true },
  { days: 90, label: "notice", isActive: true },
];
