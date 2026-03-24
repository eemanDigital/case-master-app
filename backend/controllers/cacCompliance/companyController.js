const {
  ClientCompany,
  ComplianceCheck,
} = require("../../models/cacCompliance");
const cacComplianceEngine = require("../../services/cacComplianceEngine");
const AppError = require("../../utils/appError");

const formatCurrency = (amount) => {
  return "₦" + amount.toLocaleString("en-NG");
};

exports.createCompany = async (req, res, next) => {
  try {
    const companyData = {
      ...req.body,
      lawFirmId: req.firmId,
      createdBy: req.user._id,
      assignedTo: req.body.assignedTo || req.user._id,
    };

    const company = new ClientCompany(companyData);
    await company.save();

    const auditResult = await cacComplianceEngine.runFullAudit(company);

    res.status(201).json({
      success: true,
      data: {
        company: auditResult.company,
        complianceChecks: auditResult.checks,
        riskLevel: auditResult.riskLevel,
        totalLiability: auditResult.totalLiability,
      },
      message: "Company created and compliance audit completed",
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(
        new AppError(
          "A company with this RC number already exists for this firm",
          400,
        ),
      );
    }
    next(error);
  }
};

exports.getCompanies = async (req, res, next) => {
  try {
    const {
      search,
      risk,
      page = 1,
      limit = 20,
      sort = "complianceRiskLevel",
    } = req.query;

    const query = { lawFirmId: req.firmId, isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { rcNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (risk && risk !== "all") {
      query.complianceRiskLevel = risk;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sortOptions = {};
    if (sort === "complianceRiskLevel") {
      sortOptions.complianceRiskLevel = 1;
    } else if (sort === "name") {
      sortOptions.name = 1;
    } else if (sort === "totalEstimatedLiability") {
      sortOptions.totalEstimatedLiability = -1;
    } else {
      sortOptions.complianceRiskLevel = 1;
    }

    const [companies, total] = await Promise.all([
      ClientCompany.find(query)
        .populate("assignedTo", "firstName lastName email")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      ClientCompany.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: companies,
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

exports.getCompany = async (req, res, next) => {
  try {
    const company = await ClientCompany.findOne({
      _id: req.params.id,
      lawFirmId: req.firmId,
    }).populate("assignedTo", "firstName lastName email");

    if (!company) {
      return next(new AppError("Company not found", 404));
    }

    const checks = await ComplianceCheck.find({ companyId: company._id }).sort({
      checkType: 1,
    });

    res.status(200).json({
      success: true,
      data: {
        company,
        complianceChecks: checks,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCompany = async (req, res, next) => {
  try {
    const company = await ClientCompany.findOne({
      _id: req.params.id,
      lawFirmId: req.firmId,
    });

    if (!company) {
      return next(new AppError("Company not found", 404));
    }

    Object.assign(company, req.body);
    await company.save();

    const auditResult = await cacComplianceEngine.runFullAudit(company);

    res.status(200).json({
      success: true,
      data: {
        company: auditResult.company,
        complianceChecks: auditResult.checks,
        riskLevel: auditResult.riskLevel,
        totalLiability: auditResult.totalLiability,
      },
      message: "Company updated and compliance audit completed",
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCompany = async (req, res, next) => {
  try {
    const company = await ClientCompany.findOneAndUpdate(
      { _id: req.params.id, lawFirmId: req.firmId },
      { isActive: false },
      { new: true },
    );

    if (!company) {
      return next(new AppError("Company not found", 404));
    }

    res.status(200).json({
      success: true,
      data: null,
      message: "Company deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.runAudit = async (req, res, next) => {
  try {
    const company = await ClientCompany.findOne({
      _id: req.params.id,
      lawFirmId: req.firmId,
    });

    if (!company) {
      return next(new AppError("Company not found", 404));
    }

    const auditResult = await cacComplianceEngine.runFullAudit(company);

    res.status(200).json({
      success: true,
      data: {
        company: auditResult.company,
        complianceChecks: auditResult.checks,
        riskLevel: auditResult.riskLevel,
        totalLiability: auditResult.totalLiability,
      },
      message: "Compliance audit completed",
    });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [companies, checks] = await Promise.all([
      ClientCompany.find({ lawFirmId: req.firmId, isActive: true }),
      ComplianceCheck.find({ lawFirmId: req.firmId }).populate({
        path: "companyId",
        match: { isActive: true },
      }),
    ]);

    const filteredChecks = checks.filter((c) => c.companyId);

    const redCount = companies.filter(
      (c) => c.complianceRiskLevel === "red",
    ).length;
    const amberCount = companies.filter(
      (c) => c.complianceRiskLevel === "amber",
    ).length;
    const greenCount = companies.filter(
      (c) => c.complianceRiskLevel === "green",
    ).length;
    const totalFirmLiability = companies.reduce(
      (sum, c) => sum + (c.totalEstimatedLiability || 0),
      0,
    );

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingDeadlines = filteredChecks
      .filter(
        (c) =>
          c.dueDate &&
          new Date(c.dueDate) <= thirtyDaysFromNow &&
          !["compliant", "not_applicable"].includes(c.status),
      )
      .map((c) => ({
        companyId: c.companyId._id,
        companyName: c.companyId.name,
        checkType: c.checkType,
        checkTypeLabel: c.checkTypeLabel,
        dueDate: c.dueDate,
        daysUntil: cacComplianceEngine.getDaysUntil(c.dueDate),
        status: c.status,
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil);

    res.status(200).json({
      success: true,
      data: {
        totalClients: companies.length,
        redCount,
        amberCount,
        greenCount,
        totalFirmLiability,
        upcomingDeadlines,
      },
    });
  } catch (error) {
    next(error);
  }
};
