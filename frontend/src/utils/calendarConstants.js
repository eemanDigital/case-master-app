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
  [EVENT_TYPES.HEARING]: "Court Hearing",
  [EVENT_TYPES.MENTION]: "Mention",
  [EVENT_TYPES.ADJOURNMENT]: "Adjournment",
  [EVENT_TYPES.FILING_DEADLINE]: "Filing Deadline",
  [EVENT_TYPES.STATUTORY_DEADLINE]: "Statutory Deadline",
  [EVENT_TYPES.CLIENT_MEETING]: "Client Meeting",
  [EVENT_TYPES.INTERNAL_MEETING]: "Internal Meeting",
  [EVENT_TYPES.TASK]: "Task",
  [EVENT_TYPES.REMINDER]: "Reminder",
  [EVENT_TYPES.COURT_ORDER_DEADLINE]: "Court Order Deadline",
};

export const EVENT_STATUS_LABELS = {
  [EVENT_STATUS.SCHEDULED]: "Scheduled",
  [EVENT_STATUS.CONFIRMED]: "Confirmed",
  [EVENT_STATUS.COMPLETED]: "Completed",
  [EVENT_STATUS.CANCELLED]: "Cancelled",
  [EVENT_STATUS.RESCHEDULED]: "Rescheduled",
  [EVENT_STATUS.ADJOURNED]: "Adjourned",
  [EVENT_STATUS.NO_SHOW]: "No Show",
};

export const PRIORITY_LABELS = {
  [PRIORITY_LEVELS.LOW]: "Low",
  [PRIORITY_LEVELS.MEDIUM]: "Medium",
  [PRIORITY_LEVELS.HIGH]: "High",
  [PRIORITY_LEVELS.URGENT]: "Urgent",
};

export const PRIORITY_COLORS = {
  [PRIORITY_LEVELS.LOW]: "#52c41a",
  [PRIORITY_LEVELS.MEDIUM]: "#1890ff",
  [PRIORITY_LEVELS.HIGH]: "#fa8c16",
  [PRIORITY_LEVELS.URGENT]: "#f5222d",
};

export const EVENT_TYPE_COLORS = {
  [EVENT_TYPES.HEARING]: "#722ed1",
  [EVENT_TYPES.MENTION]: "#eb2f96",
  [EVENT_TYPES.ADJOURNMENT]: "#fa541c",
  [EVENT_TYPES.FILING_DEADLINE]: "#f5222d",
  [EVENT_TYPES.STATUTORY_DEADLINE]: "#cf1322",
  [EVENT_TYPES.CLIENT_MEETING]: "#1890ff",
  [EVENT_TYPES.INTERNAL_MEETING]: "#13c2c2",
  [EVENT_TYPES.TASK]: "#52c41a",
  [EVENT_TYPES.REMINDER]: "#faad14",
  [EVENT_TYPES.COURT_ORDER_DEADLINE]: "#a0d911",
};

export const STATUS_COLORS = {
  [EVENT_STATUS.SCHEDULED]: "#1890ff",
  [EVENT_STATUS.CONFIRMED]: "#52c41a",
  [EVENT_STATUS.COMPLETED]: "#595959",
  [EVENT_STATUS.CANCELLED]: "#f5222d",
  [EVENT_STATUS.RESCHEDULED]: "#fa8c16",
  [EVENT_STATUS.ADJOURNED]: "#faad14",
  [EVENT_STATUS.NO_SHOW]: "#d9d9d9",
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
