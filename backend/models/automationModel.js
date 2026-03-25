const mongoose = require("mongoose");

const TRIGGER_EVENTS = [
  "matter.created",
  "matter.status_changed",
  "matter.deadline_approaching",
  "matter.deadline_missed",
  "matter.completed",
  "cac.created",
  "cac.status_changed",
  "cac.document_received",
  "cac.completed",
  "cac.annual_return_due",
  "client.created",
  "client.document_uploaded",
  "compliance.penalty_started",
  "compliance.status_inactive",
  "compliance.filing_due",
  "compliance.overdue",
  "deadline.created",
  "deadline.approaching_7days",
  "deadline.approaching_24hours",
  "deadline.missed",
  "deadline.completed",
  "payment.confirmed",
  "payment.overdue",
  "document.generated",
  "document.signed",
  "schedule.daily",
  "schedule.weekly",
  "schedule.monthly",
  "manual",
];

const ACTION_TYPES = [
  "send_email",
  "send_in_app_notification",
  "create_deadline",
  "update_status",
  "assign_to",
  "create_task",
  "generate_document",
  "add_timeline_entry",
  "send_whatsapp",
  "webhook",
];

const CONDITION_OPERATORS = [
  "equals",
  "not_equals",
  "contains",
  "greater_than",
  "less_than",
  "is_empty",
  "is_not_empty",
  "in_list",
];

const EMAIL_RECIPIENTS = ["client", "assigned_lawyer", "supervisor", "custom"];

const automationSchema = new mongoose.Schema(
  {
    firmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: [true, "Firm ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Automation name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    trigger: {
      event: {
        type: String,
        enum: {
          values: TRIGGER_EVENTS,
          message: "{VALUE} is not a valid trigger event",
        },
        required: [true, "Trigger event is required"],
      },
      config: {
        fromStatus: String,
        toStatus: String,
        daysBefore: Number,
        scheduleTime: String,
        scheduleDay: String,
      },
    },

    conditions: [{
      field: String,
      operator: {
        type: String,
        enum: CONDITION_OPERATORS,
      },
      value: mongoose.Schema.Types.Mixed,
    }],

    actions: [{
      order: {
        type: Number,
        required: true,
      },
      type: {
        type: String,
        enum: ACTION_TYPES,
        required: true,
      },
      config: {
        emailTo: {
          type: String,
          enum: EMAIL_RECIPIENTS,
        },
        customEmail: String,
        emailSubject: String,
        emailBody: String,
        notifyUsers: [String],
        notificationTitle: String,
        notificationMessage: String,
        deadlineTitle: String,
        deadlineDaysFromNow: Number,
        deadlineCategory: String,
        deadlineAssignTo: {
          type: String,
          enum: ["assigned_lawyer", "supervisor", "custom"],
        },
        deadlineCustomAssignee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        newStatus: String,
        assignToUserId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        templateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Template",
        },
        timelineAction: String,
        timelineDescription: String,
        webhookUrl: String,
        webhookMethod: {
          type: String,
          enum: ["POST", "GET"],
          default: "POST",
        },
        webhookHeaders: mongoose.Schema.Types.Mixed,
        webhookBody: String,
      },
      delayMinutes: {
        type: Number,
        default: 0,
      },
    }],

    availableVariables: [{
      type: String,
    }],

    executionCount: {
      type: Number,
      default: 0,
    },
    lastExecutedAt: Date,
    lastExecutionStatus: {
      type: String,
      enum: ["success", "partial", "failed"],
    },

    executionLog: [{
      executedAt: {
        type: Date,
        default: Date.now,
      },
      triggerData: mongoose.Schema.Types.Mixed,
      actionsExecuted: Number,
      actionsFailed: Number,
      executionErrors: [String],
      durationMs: Number,
    }],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

automationSchema.index({ firmId: 1, isActive: 1 });
automationSchema.index({ firmId: 1, "trigger.event": 1 });
automationSchema.index({ isDeleted: 1 });

automationSchema.statics.getActiveAutomationsForEvent = async function (firmId, event) {
  return this.find({
    firmId,
    isActive: true,
    isDeleted: { $ne: true },
    $or: [
      { "trigger.event": event },
      { "trigger.event": "manual" },
    ],
  });
};

automationSchema.statics.getTemplateVariablesForEvent = function (event) {
  const baseVariables = [
    "{{client_name}}",
    "{{client_email}}",
    "{{lawyer_name}}",
    "{{firm_name}}",
    "{{today_date}}",
  ];

  const eventVariables = {
    matter: ["{{matter_number}}", "{{matter_title}}", "{{matter_status}}"],
    "cac-matter": ["{{entity_name}}", "{{rc_number}}", "{{cac_status}}"],
    "cac.created": ["{{entity_name}}", "{{rc_number}}", "{{entity_type}}"],
    "cac.completed": ["{{entity_name}}", "{{rc_number}}", "{{certificate_url}}"],
    client: ["{{client_name}}", "{{client_email}}", "{{client_phone}}"],
    "client.created": ["{{client_name}}", "{{client_email}}"],
    deadline: ["{{deadline_title}}", "{{due_date}}", "{{days_remaining}}"],
    "deadline.missed": ["{{deadline_title}}", "{{due_date}}", "{{days_late}}"],
    compliance: ["{{entity_name}}", "{{rc_number}}", "{{penalty_amount}}"],
    "compliance.penalty_started": ["{{entity_name}}", "{{rc_number}}", "{{penalty_amount}}", "{{monthly_rate}}"],
    payment: ["{{payment_amount}}", "{{payment_date}}"],
    "payment.confirmed": ["{{payment_amount}}", "{{payment_date}}"],
    document: ["{{document_name}}", "{{document_type}}"],
    "document.generated": ["{{document_name}}", "{{template_name}}"],
  };

  const category = event.split(".")[0];
  return [...baseVariables, ...(eventVariables[category] || []), ...(eventVariables[event] || [])];
};

const Automation = mongoose.model("Automation", automationSchema);

module.exports = Automation;
