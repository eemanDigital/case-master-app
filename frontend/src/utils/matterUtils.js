import { formatCurrency, MATTER_CONFIG } from "../config/matterConfig";

// Generate matter number (client-side simulation)
export const generateMatterNumber = (
  firmCode = "MTR",
  year = new Date().getFullYear(),
  sequence = 1,
) => {
  return `${firmCode}/${year}/${String(sequence).padStart(4, "0")}`;
};

// Calculate matter age in days
export const getMatterAge = (dateOpened) => {
  const opened = new Date(dateOpened);
  const now = new Date();
  const diffTime = Math.abs(now - opened);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Get upcoming deadline
export const getUpcomingDeadline = (expectedClosureDate) => {
  if (!expectedClosureDate) return null;

  const deadline = new Date(expectedClosureDate);
  const now = new Date();
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { days: Math.abs(diffDays), status: "overdue" };
  if (diffDays === 0) return { days: 0, status: "today" };
  if (diffDays <= 7) return { days: diffDays, status: "upcoming" };
  return { days: diffDays, status: "normal" };
};

// Filter matters by various criteria
export const filterMatters = (matters, filters) => {
  return matters.filter((matter) => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableFields = [
        matter.title,
        matter.description,
        matter.matterNumber,
        matter.client?.firstName,
        matter.client?.lastName,
      ]
        .join(" ")
        .toLowerCase();

      if (!searchableFields.includes(searchTerm)) return false;
    }

    // Matter type filter
    if (filters.matterType && matter.matterType !== filters.matterType)
      return false;

    // Status filter
    if (filters.status && matter.status !== filters.status) return false;

    // Priority filter
    if (filters.priority && matter.priority !== filters.priority) return false;

    // Client filter
    if (filters.client && matter.client?._id !== filters.client) return false;

    // Account officer filter
    if (filters.accountOfficer) {
      const officerIds = matter.accountOfficer?.map((officer) => officer._id);
      if (!officerIds?.includes(filters.accountOfficer)) return false;
    }

    // Date range filter
    if (filters.startDate && filters.endDate) {
      const matterDate = new Date(matter.dateOpened);
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);

      if (matterDate < startDate || matterDate > endDate) return false;
    }

    return true;
  });
};

// Sort matters
export const sortMatters = (matters, sortBy = "-dateOpened") => {
  const [field, order] = sortBy.startsWith("-")
    ? [sortBy.slice(1), "desc"]
    : [sortBy, "asc"];

  return [...matters].sort((a, b) => {
    let valueA = a[field];
    let valueB = b[field];

    // Handle nested fields
    if (field.includes(".")) {
      const fields = field.split(".");
      valueA = fields.reduce((obj, key) => obj?.[key], a);
      valueB = fields.reduce((obj, key) => obj?.[key], b);
    }

    // Handle dates
    if (field.includes("Date") || field.includes("date")) {
      valueA = new Date(valueA);
      valueB = new Date(valueB);
    }

    // Handle numbers
    if (typeof valueA === "number" && typeof valueB === "number") {
      return order === "asc" ? valueA - valueB : valueB - valueA;
    }

    // Handle strings
    if (typeof valueA === "string" && typeof valueB === "string") {
      return order === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    return 0;
  });
};

// Export matters to CSV
export const exportToCSV = (
  matters,
  columns = MATTER_CONFIG.TABLE_COLUMNS.basic,
) => {
  const headers = columns
    .map((col) => {
      const columnMap = {
        matterNumber: "Matter Number",
        title: "Title",
        client: "Client",
        matterType: "Type",
        status: "Status",
        priority: "Priority",
        accountOfficer: "Account Officer",
        dateOpened: "Date Opened",
        estimatedValue: "Estimated Value",
      };
      return columnMap[col] || col;
    })
    .join(",");

  const rows = matters
    .map((matter) => {
      return columns
        .map((col) => {
          let value = matter[col];

          switch (col) {
            case "client":
              value = matter.client
                ? `${matter.client.firstName} ${matter.client.lastName}`
                : "";
              break;
            case "accountOfficer":
              value = matter.accountOfficer
                ?.map((officer) => `${officer.firstName} ${officer.lastName}`)
                .join("; ");
              break;
            case "dateOpened":
              value = new Date(value).toLocaleDateString();
              break;
            case "estimatedValue":
              value = formatCurrency(value, matter.currency);
              break;
          }

          // Escape commas and quotes for CSV
          return `"${String(value || "").replace(/"/g, '""')}"`;
        })
        .join(",");
    })
    .join("\n");

  return `${headers}\n${rows}`;
};

// Download CSV
export const downloadCSV = (csvContent, filename = "matters.csv") => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, filename);
  } else {
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
