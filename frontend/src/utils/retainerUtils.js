import dayjs from "dayjs";

/**
 * Calculate retainer metrics from details
 * @param {Object} details - Retainer details object
 * @returns {Object} Calculated metrics
 */
export const calculateRetainerMetrics = (details) => {
  if (!details) {
    return {
      daysRemaining: 0,
      daysElapsed: 0,
      totalDays: 0,
      progressPercent: 0,
      isExpiringSoon: false,
      isExpired: false,
      isActive: false,
      isOverdue: false,
      hasPendingRequests: false,
    };
  }

  const now = dayjs();
  const endDate = dayjs(details.agreementEndDate);
  const startDate = dayjs(details.agreementStartDate);

  const totalDays = Math.max(endDate.diff(startDate, "day"), 1);
  const daysElapsed = now.diff(startDate, "day");
  const daysRemaining = endDate.diff(now, "day");

  // Clamp progress between 0 and 100
  const progressPercent = Math.min(
    Math.max((daysElapsed / totalDays) * 100, 0),
    100,
  );

  const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0;
  const isExpired = daysRemaining < 0;
  const isActive = details.matter?.status === "active";
  const isOverdue = details.matter?.status === "overdue";
  const hasPendingRequests = details.requests?.some(
    (r) => r.status === "pending",
  );

  return {
    daysRemaining,
    daysElapsed,
    totalDays,
    progressPercent,
    isExpiringSoon,
    isExpired,
    isActive,
    isOverdue,
    hasPendingRequests,
  };
};

/**
 * Calculate tax amounts for retainer fee
 * @param {number} amount - Base retainer fee
 * @param {Object} options - Tax calculation options
 * @returns {Object} Tax breakdown
 */
export const calculateTaxes = (amount, options = {}) => {
  const {
    vatRate = 7.5,
    whtRate = 5,
    applyVAT = true,
    applyWHT = true,
  } = options;

  const vatAmount = applyVAT ? amount * (vatRate / 100) : 0;
  const whtAmount = applyWHT ? amount * (whtRate / 100) : 0;
  const totalWithTax = amount + vatAmount;
  const netAmount = totalWithTax - whtAmount;

  return {
    baseAmount: amount,
    vatAmount,
    whtAmount,
    totalWithTax,
    netAmount,
    vatRate,
    whtRate,
  };
};

/**
 * Format currency for Nigerian Naira
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: NGN)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = "NGN") => {
  if (!amount && amount !== 0) return "N/A";

  const symbol = currency === "NGN" ? "₦" : "$";
  return `${symbol} ${Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Get status color for Ant Design components
 * @param {string} status - Status string
 * @returns {string} Color name
 */
export const getStatusColor = (status) => {
  const colorMap = {
    active: "success",
    pending: "warning",
    overdue: "error",
    completed: "default",
    terminated: "error",
    expired: "error",
  };

  return colorMap[status?.toLowerCase()] || "default";
};

/**
 * Get retainer type display name
 * @param {string} type - Retainer type code
 * @returns {string} Display name
 */
export const getRetainerTypeLabel = (type) => {
  const typeMap = {
    fixed: "Fixed Fee Retainer",
    value_based: "Value Based",
    blended: "Blended Fee",
    success_based: "Success Based",
    monthly_retainer: "Monthly Retainer",
    "general-counsel": "General Counsel",
    advisory: "Advisory",
    compliance: "Compliance",
    specialized: "Specialized",
  };

  return (
    typeMap[type] || type?.replace("-", " ").replace("_", " ").toUpperCase()
  );
};

/**
 * Validate retainer form data
 * @param {Object} formData - Form data to validate
 * @returns {Object} Validation result
 */
export const validateRetainerData = (formData) => {
  const errors = {};

  // Required fields
  if (!formData.retainerType) {
    errors.retainerType = "Retainer type is required";
  }

  if (!formData.agreementStartDate) {
    errors.agreementStartDate = "Start date is required";
  }

  if (!formData.agreementEndDate) {
    errors.agreementEndDate = "End date is required";
  }

  // Date validation
  if (formData.agreementStartDate && formData.agreementEndDate) {
    const start = dayjs(formData.agreementStartDate);
    const end = dayjs(formData.agreementEndDate);

    if (end.isBefore(start)) {
      errors.agreementEndDate = "End date must be after start date";
    }
  }

  // Billing validation
  if (!formData.billing?.retainerFee || formData.billing.retainerFee <= 0) {
    errors.retainerFee = "Retainer fee must be greater than 0";
  }

  if (!formData.billing?.frequency) {
    errors.billingFrequency = "Billing frequency is required";
  }

  // Scope validation
  if (!formData.scopeDescription || formData.scopeDescription.trim() === "") {
    errors.scopeDescription = "Scope description is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} format - Date format (default: DD MMM YYYY)
 * @returns {string} Formatted date
 */
export const formatDate = (date, format = "DD MMM YYYY") => {
  if (!date) return "N/A";
  return dayjs(date).format(format);
};

/**
 * Calculate days between two dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number} Number of days
 */
export const getDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  return dayjs(endDate).diff(dayjs(startDate), "day");
};

/**
 * Check if retainer is expiring soon
 * @param {string|Date} endDate - End date
 * @param {number} threshold - Days threshold (default: 30)
 * @returns {boolean} True if expiring soon
 */
export const isExpiringSoon = (endDate, threshold = 30) => {
  if (!endDate) return false;
  const daysRemaining = dayjs(endDate).diff(dayjs(), "day");
  return daysRemaining <= threshold && daysRemaining > 0;
};

/**
 * Check if retainer is expired
 * @param {string|Date} endDate - End date
 * @returns {boolean} True if expired
 */
export const isExpired = (endDate) => {
  if (!endDate) return false;
  return dayjs(endDate).isBefore(dayjs());
};

/**
 * Generate retainer summary report data
 * @param {Object} details - Retainer details
 * @returns {Object} Summary report data
 */
export const generateRetainerSummary = (details) => {
  if (!details) return null;

  const metrics = calculateRetainerMetrics(details);
  const taxes = calculateTaxes(
    details.billing?.retainerFee || details.retainerFee?.amount || 0,
    {
      vatRate: details.billing?.vatRate || 7.5,
      whtRate: details.billing?.whtRate || 5,
      applyVAT: details.billing?.applyVAT !== false,
      applyWHT: details.billing?.applyWHT !== false,
    },
  );

  return {
    client: {
      name: `${details.matter?.client?.firstName} ${details.matter?.client?.lastName}`,
      company: details.matter?.client?.companyName,
      email: details.matter?.client?.email,
      phone: details.matter?.client?.phone,
    },
    retainer: {
      type: getRetainerTypeLabel(details.retainerType),
      matterNumber: details.matter?.matterNumber,
      status: details.matter?.status,
      startDate: formatDate(details.agreementStartDate),
      endDate: formatDate(details.agreementEndDate),
      autoRenewal: details.autoRenewal,
    },
    financial: {
      retainerFee: formatCurrency(taxes.baseAmount),
      vat: formatCurrency(taxes.vatAmount),
      wht: formatCurrency(taxes.whtAmount),
      totalWithTax: formatCurrency(taxes.totalWithTax),
      netAmount: formatCurrency(taxes.netAmount),
      currency: details.billing?.currency || "NGN",
      frequency: details.billing?.frequency || details.retainerFee?.frequency,
    },
    timeline: {
      daysElapsed: metrics.daysElapsed,
      daysRemaining: metrics.daysRemaining,
      totalDays: metrics.totalDays,
      progressPercent: metrics.progressPercent.toFixed(1),
      isExpiringSoon: metrics.isExpiringSoon,
      isExpired: metrics.isExpired,
    },
    services: details.servicesIncluded || [],
    scope: details.scopeDescription,
    exclusions: details.exclusions || [],
  };
};

/**
 * Export retainer data as CSV
 * @param {Array} retainers - Array of retainer objects
 * @returns {string} CSV string
 */
export const exportToCSV = (retainers) => {
  if (!retainers || retainers.length === 0) return "";

  const headers = [
    "Matter Number",
    "Client",
    "Retainer Type",
    "Status",
    "Start Date",
    "End Date",
    "Fee",
    "Currency",
    "Frequency",
  ];

  const rows = retainers.map((r) => [
    r.matter?.matterNumber || "",
    `${r.matter?.client?.firstName} ${r.matter?.client?.lastName}`,
    getRetainerTypeLabel(r.retainerType),
    r.matter?.status || "",
    formatDate(r.agreementStartDate),
    formatDate(r.agreementEndDate),
    r.billing?.retainerFee || r.retainerFee?.amount || 0,
    r.billing?.currency || r.retainerFee?.currency || "NGN",
    r.billing?.frequency || r.retainerFee?.frequency || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
};

/**
 * Download data as file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} type - MIME type
 */
export const downloadFile = (content, filename, type = "text/csv") => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Debounce function for search/filter operations
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Get initials from name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} Initials
 */
export const getInitials = (firstName, lastName) => {
  const first = firstName?.[0]?.toUpperCase() || "";
  const last = lastName?.[0]?.toUpperCase() || "";
  return `${first}${last}`;
};

export default {
  calculateRetainerMetrics,
  calculateTaxes,
  formatCurrency,
  getStatusColor,
  getRetainerTypeLabel,
  validateRetainerData,
  formatDate,
  getDaysBetween,
  isExpiringSoon,
  isExpired,
  generateRetainerSummary,
  exportToCSV,
  downloadFile,
  debounce,
  getInitials,
};
