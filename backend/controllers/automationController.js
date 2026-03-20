const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Automation = require("../models/automationModel");
const { AUTOMATION_RECIPES } = require("../utils/automationRecipes");
const { executeAutomation, resolveVariables } = require("../utils/automationEngine");

const POPULATE_FIELDS = [
  { path: "createdBy", select: "firstName lastName email" },
  { path: "updatedBy", select: "firstName lastName email" },
];

exports.getAllAutomations = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, isActive, search } = req.query;

  const query = {
    firmId: req.firmId,
    isDeleted: { $ne: true },
  };

  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [automations, total] = await Promise.all([
    Automation.find(query)
      .populate(POPULATE_FIELDS)
      .select("-executionLog")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Automation.countDocuments(query),
  ]);

  res.status(200).json({
    status: "success",
    data: automations,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

exports.createAutomation = catchAsync(async (req, res, next) => {
  const automationData = {
    ...req.body,
    firmId: req.firmId,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  };

  if (automationData.trigger?.event) {
    automationData.availableVariables = Automation.getTemplateVariablesForEvent(
      automationData.trigger.event
    );
  }

  const automation = new Automation(automationData);
  await automation.save();

  await automation.populate(POPULATE_FIELDS);

  res.status(201).json({
    status: "success",
    data: automation,
  });
});

exports.getAutomation = catchAsync(async (req, res, next) => {
  const automation = await Automation.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  }).populate(POPULATE_FIELDS);

  if (!automation) {
    return next(new AppError("Automation not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: automation,
  });
});

exports.updateAutomation = catchAsync(async (req, res, next) => {
  const automation = await Automation.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!automation) {
    return next(new AppError("Automation not found", 404));
  }

  const allowedUpdates = [
    "name",
    "description",
    "isActive",
    "trigger",
    "conditions",
    "actions",
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      automation[field] = req.body[field];
    }
  });

  automation.updatedBy = req.user._id;

  if (automation.trigger?.event) {
    automation.availableVariables = Automation.getTemplateVariablesForEvent(
      automation.trigger.event
    );
  }

  await automation.save();

  await automation.populate(POPULATE_FIELDS);

  res.status(200).json({
    status: "success",
    data: automation,
  });
});

exports.deleteAutomation = catchAsync(async (req, res, next) => {
  const automation = await Automation.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!automation) {
    return next(new AppError("Automation not found", 404));
  }

  automation.isDeleted = true;
  automation.deletedAt = new Date();
  automation.deletedBy = req.user._id;
  await automation.save();

  res.status(200).json({
    status: "success",
    message: "Automation deleted successfully",
  });
});

exports.toggleAutomation = catchAsync(async (req, res, next) => {
  const { isActive } = req.body;

  const automation = await Automation.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!automation) {
    return next(new AppError("Automation not found", 404));
  }

  automation.isActive = isActive !== undefined ? isActive : !automation.isActive;
  automation.updatedBy = req.user._id;
  await automation.save();

  res.status(200).json({
    status: "success",
    data: {
      _id: automation._id,
      isActive: automation.isActive,
    },
  });
});

exports.testAutomation = catchAsync(async (req, res, next) => {
  const automation = await Automation.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!automation) {
    return next(new AppError("Automation not found", 404));
  }

  const mockData = req.body.mockData || {
    client_name: "Test Client",
    client_email: "test@example.com",
    lawyer_name: "Test Lawyer",
    firm_name: "Test Firm",
    today_date: new Date().toLocaleDateString("en-NG"),
  };

  const testResults = {
    trigger: {
      event: automation.trigger.event,
      config: automation.trigger.config,
      wouldTrigger: true,
    },
    conditions: {
      count: automation.conditions?.length || 0,
      wouldPass: true,
      details: [],
    },
    actions: {
      count: automation.actions?.length || 0,
      wouldExecute: [],
    },
    mockData,
  };

  if (automation.conditions && automation.conditions.length > 0) {
    testResults.conditions.details = automation.conditions.map((condition) => ({
      field: condition.field,
      operator: condition.operator,
      value: condition.value,
      status: "would pass (mock)",
    }));
  }

  if (automation.actions && automation.actions.length > 0) {
    testResults.actions.wouldExecute = automation.actions.map((action, index) => {
      const resolvedConfig = {};

      if (action.config) {
        Object.keys(action.config).forEach((key) => {
          if (typeof action.config[key] === "string") {
            resolvedConfig[key] = resolveVariables(action.config[key], mockData);
          } else {
            resolvedConfig[key] = action.config[key];
          }
        });
      }

      return {
        order: action.order,
        type: action.type,
        delayMinutes: action.delayMinutes,
        resolvedConfig,
        wouldSendEmail: action.type === "send_email",
        wouldEmailTo: action.type === "send_email" ? resolvedConfig.emailTo : null,
        wouldEmailSubject: action.type === "send_email" ? resolvedConfig.emailSubject : null,
      };
    });
  }

  res.status(200).json({
    status: "success",
    data: testResults,
    message: "Test completed. No actions were executed.",
  });
});

exports.getExecutionLog = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;

  const automation = await Automation.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!automation) {
    return next(new AppError("Automation not found", 404));
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const logs = automation.executionLog
    .sort((a, b) => b.executedAt - a.executedAt)
    .slice(skip, skip + parseInt(limit));

  res.status(200).json({
    status: "success",
    data: logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: automation.executionLog.length,
      pages: Math.ceil(automation.executionLog.length / parseInt(limit)),
    },
  });
});

exports.duplicateAutomation = catchAsync(async (req, res, next) => {
  const source = await Automation.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!source) {
    return next(new AppError("Automation not found", 404));
  }

  const duplicateData = {
    firmId: source.firmId,
    name: `${source.name} (Copy)`,
    description: source.description,
    trigger: source.trigger,
    conditions: source.conditions,
    actions: source.actions,
    availableVariables: source.availableVariables,
    isActive: false,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  };

  const duplicate = new Automation(duplicateData);
  await duplicate.save();

  await duplicate.populate(POPULATE_FIELDS);

  res.status(201).json({
    status: "success",
    data: duplicate,
    message: "Automation duplicated successfully. Please review and activate when ready.",
  });
});

exports.getAutomationTemplates = catchAsync(async (req, res, next) => {
  const templatesWithAvailability = await Promise.all(
    AUTOMATION_RECIPES.map(async (recipe) => {
      const existing = await Automation.findOne({
        firmId: req.firmId,
        name: recipe.name,
        isDeleted: { $ne: true },
      });

      return {
        ...recipe,
        isInstalled: !!existing,
      };
    })
  );

  res.status(200).json({
    status: "success",
    data: templatesWithAvailability,
  });
});

exports.createFromTemplate = catchAsync(async (req, res, next) => {
  const { templateKey, customName, customDescription } = req.body;

  const recipe = AUTOMATION_RECIPES.find((r) => r.key === templateKey);

  if (!recipe) {
    return next(new AppError("Template not found", 404));
  }

  const automationData = {
    firmId: req.firmId,
    name: customName || recipe.name,
    description: customDescription || recipe.description,
    trigger: recipe.trigger,
    conditions: recipe.conditions || [],
    actions: recipe.actions || [],
    availableVariables: Automation.getTemplateVariablesForEvent(recipe.trigger.event),
    isActive: false,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  };

  const automation = new Automation(automationData);
  await automation.save();

  await automation.populate(POPULATE_FIELDS);

  res.status(201).json({
    status: "success",
    data: automation,
    message: "Automation created from template. Review and activate when ready.",
  });
});

exports.getAvailableVariables = catchAsync(async (req, res, next) => {
  const { event } = req.query;

  if (!event) {
    return next(new AppError("Event parameter is required", 400));
  }

  const variables = Automation.getTemplateVariablesForEvent(event);

  res.status(200).json({
    status: "success",
    data: variables,
  });
});

exports.runAutomation = catchAsync(async (req, res, next) => {
  const automation = await Automation.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!automation) {
    return next(new AppError("Automation not found", 404));
  }

  const triggerData = req.body.triggerData || {};

  try {
    await executeAutomation(automation, triggerData, req.firmId);

    res.status(200).json({
      status: "success",
      message: "Automation executed successfully",
    });
  } catch (error) {
    return next(new AppError(`Automation execution failed: ${error.message}`, 500));
  }
});

exports.getAutomationStats = catchAsync(async (req, res, next) => {
  const firmId = req.firmId;

  const [total, active, byTrigger, topPerformers] = await Promise.all([
    Automation.countDocuments({ firmId, isDeleted: { $ne: true } }),
    Automation.countDocuments({ firmId, isActive: true, isDeleted: { $ne: true } }),
    Automation.aggregate([
      { $match: { firmId, isDeleted: { $ne: true } } },
      { $group: { _id: "$trigger.event", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Automation.aggregate([
      { $match: { firmId, executionCount: { $gt: 0 }, isDeleted: { $ne: true } } },
      { $project: { name: 1, executionCount: 1, lastExecutedAt: 1, lastExecutionStatus: 1 } },
      { $sort: { executionCount: -1 } },
      { $limit: 5 },
    ]),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      total,
      active,
      inactive: total - active,
      byTrigger: byTrigger.reduce((acc, t) => ({ ...acc, [t._id]: t.count }), {}),
      topPerformers,
    },
  });
});
