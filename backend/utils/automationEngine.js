const axios = require("axios");
const Automation = require("../models/automationModel");
const User = require("../models/userModel");
const Firm = require("../models/firmModel");
const Deadline = require("../models/deadlineModel");
const { sendCustomEmail } = require("./email");

const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

const resolveVariables = (template, data) => {
  if (!template) return template;
  if (typeof template !== "string") return template;

  return template.replace(VARIABLE_PATTERN, (match, variable) => {
    const trimmedVar = variable.trim();
    return data[trimmedVar] !== undefined ? data[trimmedVar] : match;
  });
};

const extractVariablesFromData = (triggerData, event) => {
  const base = {
    today_date: new Date().toLocaleDateString("en-NG"),
  };

  if (!triggerData) return base;

  const entityType = event.split(".")[0];

  switch (entityType) {
    case "matter":
      return {
        ...base,
        matter_number: triggerData.matterNumber || triggerData.matter_number || triggerData._id?.toString(),
        matter_title: triggerData.matterName || triggerData.matter_title || triggerData.title,
        matter_status: triggerData.status,
      };

    case "cac":
    case "cac-matter":
      return {
        ...base,
        entity_name: triggerData.companyName || triggerData.entityName,
        rc_number: triggerData.rcNumber || triggerData.rc_number,
        cac_status: triggerData.status,
        certificate_url: triggerData.protectedDocument?.watermarkedFileUrl,
      };

    case "client":
      return {
        ...base,
        client_name: triggerData.firstName && triggerData.lastName
          ? `${triggerData.firstName} ${triggerData.lastName}`
          : triggerData.fullName || triggerData.client_name || "",
        client_email: triggerData.email,
        client_phone: triggerData.phone,
      };

    case "deadline":
      return {
        ...base,
        deadline_title: triggerData.title,
        due_date: new Date(triggerData.dueDate).toLocaleDateString("en-NG"),
        days_remaining: triggerData.daysRemaining,
        days_late: triggerData.performance?.daysLate || 0,
      };

    case "compliance":
      return {
        ...base,
        entity_name: triggerData.entityName,
        rc_number: triggerData.rcNumber,
        penalty_amount: triggerData.penaltyTracking?.currentPenaltyAmount,
        monthly_rate: triggerData.penaltyTracking?.monthlyPenaltyRate,
      };

    case "payment":
      return {
        ...base,
        payment_amount: triggerData.amount || triggerData.paymentAmount,
        payment_date: new Date(triggerData.createdAt || triggerData.paymentDate).toLocaleDateString("en-NG"),
      };

    case "document":
      return {
        ...base,
        document_name: triggerData.title || triggerData.name,
        document_type: triggerData.type || triggerData.documentType,
        template_name: triggerData.templateId?.name,
      };

    default:
      return base;
  }
};

const evaluateCondition = (condition, data) => {
  const fieldValue = condition.field.split(".").reduce((obj, key) => {
    return obj ? obj[key] : undefined;
  }, data);

  const { operator, value } = condition;

  switch (operator) {
    case "equals":
      return fieldValue === value;
    case "not_equals":
      return fieldValue !== value;
    case "contains":
      return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
    case "greater_than":
      return Number(fieldValue) > Number(value);
    case "less_than":
      return Number(fieldValue) < Number(value);
    case "is_empty":
      return !fieldValue || fieldValue === "";
    case "is_not_empty":
      return fieldValue && fieldValue !== "";
    case "in_list":
      return Array.isArray(value) && value.includes(fieldValue);
    default:
      return true;
  }
};

const getRecipientEmail = async (config, triggerData, firmId) => {
  const firm = await Firm.findById(firmId);

  switch (config.emailTo) {
    case "client":
      return triggerData.clientId?.email || triggerData.email || null;

    case "assigned_lawyer":
      return triggerData.assignedTo?.email || null;

    case "supervisor":
      return triggerData.supervisor?.email || null;

    case "custom":
      return resolveVariables(config.customEmail, triggerData);

    default:
      return null;
  }
};

const executeSendEmail = async (action, resolvedData, firmId) => {
  const { config } = action;
  const recipientEmail = await getRecipientEmail(config, resolvedData, firmId);

  if (!recipientEmail) {
    throw new Error("Could not determine recipient email");
  }

  const subject = resolveVariables(config.emailSubject, resolvedData);
  const body = resolveVariables(config.emailBody, resolvedData);

  await sendCustomEmail(
    subject,
    recipientEmail,
    process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
    null,
    body
  );

  return { success: true, recipientEmail, subject };
};

const executeCreateDeadline = async (action, resolvedData, firmId, userId) => {
  const { config } = action;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (config.deadlineDaysFromNow || 7));

  let assignToUserId = null;

  switch (config.deadlineAssignTo) {
    case "assigned_lawyer":
      assignToUserId = resolvedData.assignedTo?._id || resolvedData.assignedTo;
      break;
    case "supervisor":
      assignToUserId = resolvedData.supervisor?._id || resolvedData.supervisor;
      break;
    case "custom":
      assignToUserId = config.deadlineCustomAssignee;
      break;
  }

  const deadline = new Deadline({
    firmId,
    title: resolveVariables(config.deadlineTitle || "Auto-created Deadline", resolvedData),
    category: config.deadlineCategory || "custom",
    dueDate,
    assignedTo: assignToUserId,
    createdBy: userId,
    description: `Auto-created by automation: ${resolvedData.deadline_title || ""}`,
  });

  deadline.deadlineNumber = await Deadline.generateDeadlineNumber(firmId);
  await deadline.save();

  return { success: true, deadlineId: deadline._id };
};

const executeAddTimelineEntry = async (action, resolvedData, entityType, entityId) => {
  const { config } = action;

  let Model;
  switch (entityType) {
    case "cac-matter":
      Model = require("../models/cacMatterModel");
      break;
    default:
      return { success: false, error: "Unsupported entity type for timeline" };
  }

  const entity = await Model.findById(entityId);
  if (!entity) {
    return { success: false, error: "Entity not found" };
  }

  if (!entity.timeline) {
    entity.timeline = [];
  }

  entity.timeline.push({
    action: resolveVariables(config.timelineAction, resolvedData),
    description: resolveVariables(config.timelineDescription, resolvedData),
    date: new Date(),
  });

  await entity.save();

  return { success: true };
};

const executeWebhook = async (action, resolvedData) => {
  const { config } = action;

  const url = resolveVariables(config.webhookUrl, resolvedData);
  const method = config.webhookMethod || "POST";

  const headers = {};
  if (config.webhookHeaders) {
    Object.entries(config.webhookHeaders).forEach(([key, value]) => {
      headers[key] = resolveVariables(value, resolvedData);
    });
  }

  let body;
  if (config.webhookBody && method === "POST") {
    body = JSON.parse(resolveVariables(config.webhookBody, resolvedData));
  }

  const response = await axios({
    method,
    url,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    data: body,
    timeout: 30000,
  });

  return { success: true, statusCode: response.status };
};

const executeAction = async (action, resolvedData, firmId, userId, entityType, entityId) => {
  const { delayMinutes = 0, type, config } = action;

  const execute = async () => {
    switch (type) {
      case "send_email":
        return await executeSendEmail(action, resolvedData, firmId);

      case "create_deadline":
        return await executeCreateDeadline(action, resolvedData, firmId, userId);

      case "add_timeline_entry":
        return await executeAddTimelineEntry(action, resolvedData, entityType, entityId);

      case "webhook":
        return await executeWebhook(action, resolvedData);

      default:
        return { success: false, error: `Unsupported action type: ${type}` };
    }
  };

  if (delayMinutes > 0 && delayMinutes <= 5) {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const result = await execute();
          resolve(result);
        } catch (error) {
          resolve({ success: false, error: error.message });
        }
      }, delayMinutes * 60 * 1000);
    });
  }

  return await execute();
};

const executeAutomation = async (automation, triggerData, firmId) => {
  const startTime = Date.now();

  if (!automation.isActive) {
    return { skipped: true, reason: "Automation is not active" };
  }

  if (automation.conditions && automation.conditions.length > 0) {
    const resolvedData = extractVariablesFromData(triggerData, automation.trigger.event);

    for (const condition of automation.conditions) {
      if (!evaluateCondition(condition, resolvedData)) {
        return { skipped: true, reason: "Conditions not met" };
      }
    }
  }

  const resolvedData = extractVariablesFromData(triggerData, automation.trigger.event);
  const firm = await Firm.findById(firmId);
  resolvedData.firm_name = firm?.name || "LawMaster";

  let actionsExecuted = 0;
  let actionsFailed = 0;
  const errors = [];

  const sortedActions = [...automation.actions].sort((a, b) => a.order - b.order);

  for (const action of sortedActions) {
    try {
      await executeAction(action, resolvedData, firmId, automation.createdBy, automation.trigger.event.split(".")[0], triggerData._id);
      actionsExecuted++;
    } catch (error) {
      actionsFailed++;
      errors.push(error.message);
      console.error(`Automation action failed: ${error.message}`);
    }
  }

  const executionLog = {
    executedAt: new Date(),
    triggerData: automation.trigger.event,
    actionsExecuted,
    actionsFailed,
    errors,
    durationMs: Date.now() - startTime,
  };

  automation.executionCount += 1;
  automation.lastExecutedAt = new Date();
  automation.lastExecutionStatus = actionsFailed === 0 ? "success" : actionsFailed < actionsExecuted ? "partial" : "failed";
  automation.executionLog.unshift(executionLog);
  automation.executionLog = automation.executionLog.slice(0, 100);

  await automation.save();

  return {
    success: true,
    actionsExecuted,
    actionsFailed,
    durationMs: Date.now() - startTime,
  };
};

const dispatch = async (event, triggerData, firmId) => {
  try {
    const automations = await Automation.find({
      firmId,
      isActive: true,
      isDeleted: { $ne: true },
      $or: [
        { "trigger.event": event },
        { "trigger.event": "manual" },
      ],
    });

    for (const automation of automations) {
      if (automation.trigger.event !== event) continue;

      if (automation.trigger.config) {
        if (automation.trigger.config.toStatus && triggerData.status !== automation.trigger.config.toStatus) {
          continue;
        }
        if (automation.trigger.config.fromStatus && triggerData.previousStatus !== automation.trigger.config.fromStatus) {
          continue;
        }
      }

      executeAutomation(automation, triggerData, firmId).catch((error) => {
        console.error(`Automation ${automation._id} execution failed:`, error);
      });
    }
  } catch (error) {
    console.error("Error dispatching automation:", error);
  }
};

module.exports = {
  executeAutomation,
  dispatch,
  resolveVariables,
  extractVariablesFromData,
  evaluateCondition,
};
