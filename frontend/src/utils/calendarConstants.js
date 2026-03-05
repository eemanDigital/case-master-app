// ============================================
// CALENDAR CONSTANTS
// ============================================

export const EVENT_TYPES = {
  HEARING: "hearing",
  MENTION: "mention",
  ADJOURNMENT: "adjournment",
  FILING_DEADLINE: "filing_deadline",
  STATUTORY_DEADLINE: "statutory_deadline",
  CLIENT_MEETING: "client_meeting",
  INTERNAL_MEETING: "internal_meeting",
  TASK: "task",
  REMINDER: "reminder",
  COURT_ORDER_DEADLINE: "court_order_deadline",
  MATTER_CREATED: "matter_created",
  EXPECTED_CLOSURE: "expected_closure",
};

export const EVENT_TYPE_COLORS = {
  hearing: "#722ed1",
  mention: "#1890ff",
  adjournment: "#fa8c16",
  filing_deadline: "#ff4d4f",
  statutory_deadline: "#ff4d4f",
  client_meeting: "#52c41a",
  internal_meeting: "#13c2c2",
  task: "#2f54eb",
  reminder: "#eb2f96",
  court_order_deadline: "#ff5722",
  matter_created: "#1890ff",
  expected_closure: "#52c41a",
};

export const EVENT_STATUS = {
  SCHEDULED: "scheduled",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  RESCHEDULED: "rescheduled",
  ADJOURNED: "adjourned",
  NO_SHOW: "no_show",
};

export const VISIBILITY_LEVELS = {
  PRIVATE: "private",
  TEAM: "team",
  FIRM: "firm",
};

export const PRIORITY_LEVELS = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

export const LOCATION_TYPES = {
  COURT: "court",
  OFFICE: "office",
  CLIENT_OFFICE: "client_office",
  ONLINE: "online",
  OTHER: "other",
};

export const RESPONSE_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  TENTATIVE: "tentative",
};

export const BLOCK_TYPES = {
  FULL_DAY: "full_day",
  TIME_SLOT: "time_slot",
  DATE_RANGE: "date_range",
};

export const BLOCK_SCOPES = {
  FIRM_WIDE: "firm_wide",
  SPECIFIC_USERS: "specific_users",
  SPECIFIC_EVENT_TYPES: "specific_event_types",
};

export const BLOCK_CATEGORIES = {
  PUBLIC_HOLIDAY: "public_holiday",
  COURT_VACATION: "court_vacation",
  FIRM_CLOSURE: "firm_closure",
  PRINCIPAL_ENGAGEMENT: "principal_engagement",
  SENIOR_PARTNER_ENGAGEMENT: "senior_partner_engagement",
  TRAINING_DAY: "training_day",
  TEAM_BUILDING: "team_building",
  LEAVE_PERIOD: "leave_period",
  EMERGENCY: "emergency",
  MAINTENANCE: "maintenance",
  RELIGIOUS_OBSERVANCE: "religious_observance",
  OTHER: "other",
};

export const EVENT_TYPE_LABELS = {
  hearing: "Court Hearing",
  mention: "Mention",
  adjournment: "Adjournment",
  filing_deadline: "Filing Deadline",
  statutory_deadline: "Statutory Deadline",
  client_meeting: "Client Meeting",
  internal_meeting: "Internal Meeting",
  task: "Task",
  reminder: "Reminder",
  court_order_deadline: "Court Order Deadline",
  matter_created: "Matter Created",
  expected_closure: "Expected Closure",
};

export const EVENT_STATUS_LABELS = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
  adjourned: "Adjourned",
  no_show: "No Show",
};

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_COLORS = {
  low: "#52c41a",
  medium: "#1890ff",
  high: "#fa8c16",
  urgent: "#f5222d",
};

export const STATUS_COLORS = {
  scheduled: "#1890ff",
  confirmed: "#52c41a",
  completed: "#52c41a",
  cancelled: "#ff4d4f",
  rescheduled: "#fa8c16",
  adjourned: "#fa8c16",
  no_show: "#ff4d4f",
};

export const RECURRENCE_FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

export const REMINDER_TIMES = [
  { value: 5, label: "5 minutes before" },
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 120, label: "2 hours before" },
  { value: 1440, label: "1 day before" },
  { value: 2880, label: "2 days before" },
  { value: 10080, label: "1 week before" },
];

export const REMINDER_TYPES = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "in_app", label: "In-App Notification" },
  { value: "push", label: "Push Notification" },
];
