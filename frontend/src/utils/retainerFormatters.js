import dayjs from "dayjs";

export const formatCurrency = (amount, currency = "NGN") => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date, format = "DD MMM YYYY") => {
  if (!date) return "N/A";

  return dayjs(date).format(format);
};

export const formatHours = (hours) => {
  if (!hours && hours !== 0) return "N/A";
  return `${hours} hrs`;
};

export const getStatusColor = (status) => {
  switch (status) {
    case "active":
      return "success";
    case "pending":
      return "warning";
    case "terminated":
      return "error";
    case "expired":
      return "default";
    case "draft":
      return "default";
    default:
      return "default";
  }
};

export const getRetainerTypeLabel = (type) => {
  const labels = {
    "general-counsel": "General Counsel",
    advisory: "Advisory",
    compliance: "Compliance",
    specialized: "Specialized",
    other: "Other",
  };
  return labels[type] || type;
};

export const getPriorityColor = (priority) => {
  switch (priority) {
    case "urgent":
      return "red";
    case "high":
      return "orange";
    case "normal":
      return "blue";
    case "low":
      return "default";
    default:
      return "default";
  }
};

export const calculateUtilizationPercentage = (used, allocated) => {
  if (!allocated || allocated === 0) return 0;
  return Math.min((used / allocated) * 100, 100);
};
