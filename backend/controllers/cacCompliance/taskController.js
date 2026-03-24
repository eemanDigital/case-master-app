const { FilingTask, ClientCompany } = require("../../models/cacCompliance");
const complianceRules = require("../../config/complianceRules");
const AppError = require("../../utils/appError");

const getFilingDeadlineInfo = (taskType) => {
  const taskTypeMap = {
    file_director_change: "directorChange",
    file_address_change: "addressChange",
    file_share_capital: "shareCapital",
    file_allotment: "returnOfAllotment",
    register_charge: "chargesRegistration",
  };

  const ruleKey = taskTypeMap[taskType];
  if (!ruleKey || !complianceRules.filingDeadlines[ruleKey]) {
    return { days: 14, penalty: 0, legalBasis: "" };
  }

  const rule = complianceRules.filingDeadlines[ruleKey];
  return {
    days: rule.days,
    penalty: rule.penalty || rule.penaltyPerOfficerPerDay || 0,
    legalBasis: rule.legalBasis,
  };
};

exports.createTask = async (req, res, next) => {
  try {
    const company = await ClientCompany.findOne({
      _id: req.body.companyId,
      lawFirmId: req.firmId,
    });

    if (!company) {
      return next(new AppError("Company not found", 404));
    }

    const deadlineInfo = getFilingDeadlineInfo(req.body.taskType);
    const dueDate =
      req.body.dueDate ||
      new Date(Date.now() + deadlineInfo.days * 24 * 60 * 60 * 1000);

    let applicablePenalty = deadlineInfo.penalty;
    if (typeof applicablePenalty === "object") {
      applicablePenalty =
        company.type === "public"
          ? applicablePenalty.public
          : applicablePenalty.default;
    }

    const taskData = {
      ...req.body,
      lawFirmId: req.firmId,
      createdBy: req.user._id,
      dueDate,
      applicablePenalty: applicablePenalty || 0,
      penaltyLegalBasis: deadlineInfo.legalBasis,
    };

    const task = new FilingTask(taskData);
    await task.save();

    const populatedTask = await FilingTask.findById(task._id)
      .populate("companyId", "name rcNumber")
      .populate("assignedTo", "firstName lastName email");

    res.status(201).json({
      success: true,
      data: populatedTask,
      message: "Filing task created",
    });
  } catch (error) {
    next(error);
  }
};

exports.getTasks = async (req, res, next) => {
  try {
    const { status, companyId, assignedTo, page = 1, limit = 50 } = req.query;

    const query = { lawFirmId: req.firmId };
    if (status && status !== "all") {
      query.status = status;
    }
    if (companyId) {
      query.companyId = companyId;
    }
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tasks, total] = await Promise.all([
      FilingTask.find(query)
        .populate("companyId", "name rcNumber")
        .populate("assignedTo", "firstName lastName email")
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      FilingTask.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getTask = async (req, res, next) => {
  try {
    const task = await FilingTask.findOne({
      _id: req.params.id,
      lawFirmId: req.firmId,
    })
      .populate("companyId", "name rcNumber")
      .populate("assignedTo", "firstName lastName email")
      .populate("createdBy", "firstName lastName");

    if (!task) {
      return next(new AppError("Task not found", 404));
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await FilingTask.findOne({
      _id: req.params.id,
      lawFirmId: req.firmId,
    });

    if (!task) {
      return next(new AppError("Task not found", 404));
    }

    if (req.body.status === "filed") {
      req.body.filedDate = new Date();
    }

    Object.assign(task, req.body);
    await task.save();

    const populatedTask = await FilingTask.findById(task._id)
      .populate("companyId", "name rcNumber")
      .populate("assignedTo", "firstName lastName email");

    res.status(200).json({
      success: true,
      data: populatedTask,
      message: "Task updated",
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await FilingTask.findOneAndUpdate(
      { _id: req.params.id, lawFirmId: req.firmId },
      { status: "cancelled" },
      { new: true },
    );

    if (!task) {
      return next(new AppError("Task not found", 404));
    }

    res.status(200).json({
      success: true,
      data: null,
      message: "Task cancelled",
    });
  } catch (error) {
    next(error);
  }
};

exports.getOverdueTasks = async (req, res, next) => {
  try {
    const tasks = await FilingTask.find({
      lawFirmId: req.firmId,
      status: { $in: ["pending", "in_progress"] },
      dueDate: { $lt: new Date() },
    })
      .populate("companyId", "name rcNumber")
      .populate("assignedTo", "firstName lastName email")
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTasksByCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    const company = await ClientCompany.findOne({
      _id: companyId,
      lawFirmId: req.firmId,
    });

    if (!company) {
      return next(new AppError("Company not found", 404));
    }

    const tasks = await FilingTask.find({
      companyId,
      lawFirmId: req.firmId,
    })
      .populate("assignedTo", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};
