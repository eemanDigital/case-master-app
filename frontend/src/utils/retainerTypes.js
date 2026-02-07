export const RETAINER_TYPES = [
  { value: "general-counsel", label: "General Counsel", color: "blue" },
  { value: "advisory", label: "Advisory", color: "green" },
  { value: "compliance", label: "Compliance", color: "orange" },
  { value: "specialized", label: "Specialized", color: "purple" },
  { value: "other", label: "Other", color: "default" },
];

export const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "success" },
  { value: "pending", label: "Pending", color: "warning" },
  { value: "terminated", label: "Terminated", color: "error" },
  { value: "expired", label: "Expired", color: "default" },
  { value: "draft", label: "Draft", color: "default" },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "default" },
  { value: "normal", label: "Normal", color: "blue" },
  { value: "high", label: "High", color: "orange" },
  { value: "urgent", label: "Urgent", color: "red" },
];

export const SERVICE_TYPES = [
  "Legal Consultation",
  "Contract Review",
  "Document Drafting",
  "Compliance Review",
  "Legal Research",
  "Meeting Attendance",
  "Dispute Resolution",
  "Regulatory Filing",
  "Transaction Support",
  "Other",
];

export const REQUEST_TYPES = [
  "Legal Advice",
  "Document Review",
  "Contract Drafting",
  "Compliance Check",
  "Meeting Request",
  "Research Request",
  "Dispute Assistance",
  "Regulatory Query",
  "Other",
];

export const TERMINATION_REASONS = [
  "Client Request",
  "Non-Payment",
  "Breach of Contract",
  "Scope Completion",
  "Mutual Agreement",
  "Service Dissatisfaction",
  "Budget Constraints",
  "Other",
];

export const BILLING_FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
];

export const RESPONSE_TIMES = [
  { value: 4, label: "4 hours (Urgent)" },
  { value: 8, label: "8 hours (High Priority)" },
  { value: 24, label: "24 hours (Normal)" },
  { value: 48, label: "48 hours (Low Priority)" },
  { value: 72, label: "72 hours" },
];
