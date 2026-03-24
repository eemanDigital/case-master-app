const {
  ComplianceCheck,
  ClientCompany,
  Alert,
} = require("../../models/cacCompliance");
const cacComplianceEngine = require("../../services/cacComplianceEngine");
const AppError = require("../../utils/appError");

exports.getDashboard = async (req, res, next) => {
  try {
    const companies = await ClientCompany.find({
      lawFirmId: req.firmId,
      isActive: true,
    }).populate("assignedTo", "firstName lastName email");

    const checks = await ComplianceCheck.find({
      lawFirmId: req.firmId,
    });

    const checksByCompany = {};
    checks.forEach((c) => {
      if (!checksByCompany[c.companyId]) {
        checksByCompany[c.companyId] = [];
      }
      checksByCompany[c.companyId].push(c);
    });

    const atRiskCompanies = companies
      .filter(
        (c) =>
          c.complianceRiskLevel === "red" || c.complianceRiskLevel === "amber",
      )
      .map((c) => {
        const companyChecks = checksByCompany[c._id] || [];
        const urgentCheck = companyChecks
          .filter((ch) => !["compliant", "not_applicable"].includes(ch.status))
          .sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0))[0];

        return {
          _id: c._id,
          name: c.name,
          rcNumber: c.rcNumber,
          riskLevel: c.complianceRiskLevel,
          totalLiability: c.totalEstimatedLiability,
          urgentProblem: urgentCheck
            ? `${urgentCheck.checkTypeLabel} ${urgentCheck.daysOverdue > 0 ? urgentCheck.daysOverdue + " days overdue" : "due soon"}`
            : "No immediate issues",
          assignedTo: c.assignedTo,
        };
      })
      .sort((a, b) => {
        if (a.riskLevel === "red" && b.riskLevel !== "red") return -1;
        if (b.riskLevel === "red" && a.riskLevel !== "red") return 1;
        return b.totalLiability - a.totalLiability;
      });

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingDeadlines = [];
    companies.forEach((c) => {
      const companyChecks = checksByCompany[c._id] || [];
      companyChecks.forEach((ch) => {
        if (ch.dueDate && new Date(ch.dueDate) <= thirtyDaysFromNow) {
          const daysUntil = cacComplianceEngine.getDaysUntil(ch.dueDate);
          if (
            daysUntil >= 0 &&
            !["compliant", "not_applicable"].includes(ch.status)
          ) {
            upcomingDeadlines.push({
              companyId: c._id,
              companyName: c.name,
              checkType: ch.checkType,
              checkTypeLabel: ch.checkTypeLabel,
              dueDate: ch.dueDate,
              daysUntil: daysUntil,
              status: ch.status,
              assignedTo: c.assignedTo,
            });
          }
        }
      });
    });

    upcomingDeadlines.sort((a, b) => a.daysUntil - b.daysUntil);

    const stats = {
      totalClients: companies.length,
      atRiskCount: atRiskCompanies.length,
      totalFirmLiability: companies.reduce(
        (sum, c) => sum + (c.totalEstimatedLiability || 0),
        0,
      ),
    };

    res.status(200).json({
      success: true,
      data: {
        stats,
        atRiskCompanies,
        upcomingDeadlines,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAtRisk = async (req, res, next) => {
  try {
    const companies = await ClientCompany.find({
      lawFirmId: req.firmId,
      isActive: true,
      complianceRiskLevel: { $in: ["red", "amber"] },
    })
      .populate("assignedTo", "firstName lastName email")
      .sort({ complianceRiskLevel: 1, totalEstimatedLiability: -1 });

    const checks = await ComplianceCheck.find({
      lawFirmId: req.firmId,
      companyId: { $in: companies.map((c) => c._id) },
    });

    const checksByCompany = {};
    checks.forEach((c) => {
      if (!checksByCompany[c.companyId]) {
        checksByCompany[c.companyId] = [];
      }
      checksByCompany[c.companyId].push(c);
    });

    const result = companies.map((c) => ({
      ...c.toObject(),
      complianceChecks: checksByCompany[c._id] || [],
    }));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDeadlines = async (req, res, next) => {
  try {
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const checks = await ComplianceCheck.find({
      lawFirmId: req.firmId,
      dueDate: { $lte: sixtyDaysFromNow, $gt: new Date() },
      status: { $in: ["due_soon", "overdue"] },
    })
      .populate("companyId", "name rcNumber assignedTo")
      .sort({ dueDate: 1 });

    const result = checks
      .filter((c) => c.companyId)
      .map((c) => ({
        _id: c._id,
        companyId: c.companyId._id,
        companyName: c.companyId.name,
        rcNumber: c.companyId.rcNumber,
        checkType: c.checkType,
        checkTypeLabel: c.checkTypeLabel,
        dueDate: c.dueDate,
        daysUntil: cacComplianceEngine.getDaysUntil(c.dueDate),
        status: c.status,
        estimatedPenalty: c.estimatedPenalty,
      }));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.resolveCheck = async (req, res, next) => {
  try {
    const check = await ComplianceCheck.findOne({
      _id: req.params.id,
      lawFirmId: req.firmId,
    });

    if (!check) {
      return next(new AppError("Compliance check not found", 404));
    }

    check.isResolved = true;
    check.resolvedAt = new Date();
    check.resolvedBy = req.user._id;
    await check.save();

    const company = await ClientCompany.findById(check.companyId);
    if (company) {
      await cacComplianceEngine.runFullAudit(company);
    }

    res.status(200).json({
      success: true,
      data: check,
      message: "Compliance check marked as resolved",
    });
  } catch (error) {
    next(error);
  }
};
