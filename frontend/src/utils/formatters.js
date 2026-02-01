import dayjs from "dayjs";
import {
  DATE_FORMAT,
  DATE_TIME_FORMAT,
  API_DATE_FORMAT,
} from "./litigationConstants";

// ============================================
// DATE FORMATTERS
// ============================================

export const formatDate = (date, format = DATE_FORMAT) => {
  if (!date) return "-";
  return dayjs(date).format(format);
};

export const formatDateTime = (date) => {
  if (!date) return "-";
  return dayjs(date).format(DATE_TIME_FORMAT);
};

export const formatApiDate = (date) => {
  if (!date) return null;
  return dayjs(date).format(API_DATE_FORMAT);
};

export const getRelativeTime = (date) => {
  if (!date) return "-";
  const now = dayjs();
  const target = dayjs(date);
  const diffDays = target.diff(now, "days");

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days ago`;
  } else if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Tomorrow";
  } else if (diffDays <= 7) {
    return `In ${diffDays} days`;
  } else {
    return formatDate(date);
  }
};

// ============================================
// CURRENCY FORMATTERS
// ============================================

export const formatCurrency = (amount, currency = "NGN") => {
  if (amount === null || amount === undefined) return "-";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num) => {
  if (num === null || num === undefined) return "-";
  return new Intl.NumberFormat("en-NG").format(num);
};

// ============================================
// TEXT FORMATTERS
// ============================================

export const truncateText = (text, maxLength = 50) => {
  if (!text) return "-";
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const capitalizeFirstLetter = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const formatName = (firstName, lastName) => {
  if (!firstName && !lastName) return "-";
  return `${firstName || ""} ${lastName || ""}`.trim();
};

// ============================================
// STATUS HELPERS
// ============================================

export const getStatusConfig = (status, configArray) => {
  const config = configArray.find((item) => item.value === status);
  return config || { label: status, color: "default" };
};

// ============================================
// ARRAY HELPERS
// ============================================

export const formatArrayToString = (arr, field = "name") => {
  if (!arr || arr.length === 0) return "-";
  return arr.map((item) => item[field] || item).join(", ");
};

export const getFirstItem = (arr, field = "name") => {
  if (!arr || arr.length === 0) return "-";
  return arr[0][field] || arr[0];
};

// ============================================
// VALIDATION HELPERS
// ============================================

export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone);
};

export const isValidDate = (date) => {
  return dayjs(date).isValid();
};

// ============================================
// FILE HELPERS
// ============================================

export const getFileExtension = (filename) => {
  if (!filename) return "";
  return filename.split(".").pop().toLowerCase();
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// ============================================
// URL HELPERS
// ============================================

export const buildQueryString = (params) => {
  const query = Object.entries(params)
    .filter(
      ([_, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");

  return query ? `?${query}` : "";
};

// ============================================
// DEBOUNCE HELPER
// ============================================

export const debounce = (func, delay = 500) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// ============================================
// EXPORT HELPERS
// ============================================

export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const getExportFilename = (prefix, extension = "xlsx") => {
  const timestamp = dayjs().format("YYYY-MM-DD_HHmm");
  return `${prefix}_${timestamp}.${extension}`;
};
