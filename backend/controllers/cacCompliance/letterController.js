const {
  AdvisoryLetter,
  ClientCompany,
  ComplianceCheck,
} = require("../../models/cacCompliance");
const cacLetterTemplates = require("../../services/cacLetterTemplates");
const cacComplianceEngine = require("../../services/cacComplianceEngine");
const AppError = require("../../utils/appError");

exports.generateLetter = async (req, res, next) => {
  try {
    const { companyId, templateType, customNote } = req.body;

    const company = await ClientCompany.findOne({
      _id: companyId,
      lawFirmId: req.firmId,
    }).populate("assignedTo", "firstName lastName email");

    if (!company) {
      return next(new AppError("Company not found", 404));
    }

    const checks = await ComplianceCheck.find({ companyId });

    const checksMap = {};
    checks.forEach((c) => {
      checksMap[c.checkType] = c;
    });

    const lawFirm = req.user.firmId;

    let content;
    switch (templateType) {
      case "annual_return_overdue":
        content = cacLetterTemplates.annualReturnOverdue(
          company,
          checksMap.annual_return,
          lawFirm,
          customNote,
        );
        break;
      case "psc_violation":
        content = cacLetterTemplates.pscViolation(
          company,
          checksMap.psc_filing,
          lawFirm,
          customNote,
        );
        break;
      case "agm_non_compliance":
        content = cacLetterTemplates.agmNonCompliance(
          company,
          checksMap.agm,
          lawFirm,
          customNote,
        );
        break;
      case "general_non_compliance":
        content = cacLetterTemplates.generalNonCompliance(
          company,
          checks,
          lawFirm,
          customNote,
        );
        break;
      default:
        return next(new AppError("Invalid template type", 400));
    }

    const subjectMap = {
      annual_return_overdue: `Formal Compliance Notice — Outstanding Annual Returns for ${company.name}`,
      psc_violation: `URGENT — PSC Compliance Violation for ${company.name}`,
      agm_non_compliance: `Compliance Notice — Annual General Meeting Obligation for ${company.name}`,
      general_non_compliance: `Compliance Advisory — Multiple Outstanding Obligations for ${company.name}`,
    };

    const letter = new AdvisoryLetter({
      companyId,
      lawFirmId: req.firmId,
      generatedBy: req.user._id,
      subject: subjectMap[templateType],
      templateType,
      content,
      status: "draft",
    });

    await letter.save();

    const populatedLetter = await AdvisoryLetter.findById(letter._id)
      .populate("companyId", "name rcNumber")
      .populate("generatedBy", "firstName lastName");

    res.status(201).json({
      success: true,
      data: populatedLetter,
      message: "Advisory letter generated",
    });
  } catch (error) {
    next(error);
  }
};

exports.getLetters = async (req, res, next) => {
  try {
    const { companyId, status, page = 1, limit = 20 } = req.query;

    const query = { lawFirmId: req.firmId };
    if (companyId) {
      query.companyId = companyId;
    }
    if (status && status !== "all") {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [letters, total] = await Promise.all([
      AdvisoryLetter.find(query)
        .populate("companyId", "name rcNumber")
        .populate("generatedBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AdvisoryLetter.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: letters,
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

exports.getLetter = async (req, res, next) => {
  try {
    const letter = await AdvisoryLetter.findOne({
      _id: req.params.id,
      lawFirmId: req.firmId,
    })
      .populate("companyId", "name rcNumber")
      .populate("generatedBy", "firstName lastName");

    if (!letter) {
      return next(new AppError("Letter not found", 404));
    }

    res.status(200).json({
      success: true,
      data: letter,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateLetter = async (req, res, next) => {
  try {
    const letter = await AdvisoryLetter.findOne({
      _id: req.params.id,
      lawFirmId: req.firmId,
    });

    if (!letter) {
      return next(new AppError("Letter not found", 404));
    }

    if (letter.status !== "draft") {
      return next(new AppError("Cannot edit a sent letter", 400));
    }

    if (req.body.content !== undefined) {
      letter.content = req.body.content;
    }
    if (req.body.subject !== undefined) {
      letter.subject = req.body.subject;
    }

    await letter.save();

    const populatedLetter = await AdvisoryLetter.findById(letter._id)
      .populate("companyId", "name rcNumber")
      .populate("generatedBy", "firstName lastName");

    res.status(200).json({
      success: true,
      data: populatedLetter,
      message: "Letter updated",
    });
  } catch (error) {
    next(error);
  }
};

exports.markSent = async (req, res, next) => {
  try {
    const letter = await AdvisoryLetter.findOne({
      _id: req.params.id,
      lawFirmId: req.firmId,
    });

    if (!letter) {
      return next(new AppError("Letter not found", 404));
    }

    letter.status = "sent";
    letter.sentAt = new Date();
    letter.sentTo = req.body.sentTo || "";
    await letter.save();

    const populatedLetter = await AdvisoryLetter.findById(letter._id)
      .populate("companyId", "name rcNumber")
      .populate("generatedBy", "firstName lastName");

    res.status(200).json({
      success: true,
      data: populatedLetter,
      message: "Letter marked as sent",
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteLetter = async (req, res, next) => {
  try {
    const letter = await AdvisoryLetter.findOne({
      _id: req.params.id,
      lawFirmId: req.firmId,
    });

    if (!letter) {
      return next(new AppError("Letter not found", 404));
    }

    if (letter.status !== "draft") {
      return next(new AppError("Cannot delete a sent letter", 400));
    }

    await AdvisoryLetter.findByIdAndDelete(letter._id);

    res.status(200).json({
      success: true,
      data: null,
      message: "Letter deleted",
    });
  } catch (error) {
    next(error);
  }
};

exports.getLettersByCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    const company = await ClientCompany.findOne({
      _id: companyId,
      lawFirmId: req.firmId,
    });

    if (!company) {
      return next(new AppError("Company not found", 404));
    }

    const letters = await AdvisoryLetter.find({
      companyId,
      lawFirmId: req.firmId,
    })
      .populate("generatedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: letters,
    });
  } catch (error) {
    next(error);
  }
};
