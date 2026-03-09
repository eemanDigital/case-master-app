const Template = require("../models/templateModel");
const GeneratedDocument = require("../models/generatedDocumentModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

let Document, DocxXmlTransformer;
try {
  const docx = require("docx");
  Document = docx.Document;
  DocxXmlTransformer = docx.DocxXmlTransformer;
} catch (e) {
  console.warn("docx package not installed - Word export will not be available");
}

let puppeteer;
try {
  puppeteer = require("puppeteer");
} catch (e) {
  console.warn("puppeteer package not installed - PDF export will not be available");
}

const getAllTemplates = catchAsync(async (req, res, next) => {
  const {
    category,
    practiceArea,
    subcategory,
    search,
    status,
    page = 1,
    limit = 20,
    isSystemTemplate,
  } = req.query;

  const firmId = req.firmId;

  const buildQuery = (isSystem) => {
    const query = { isSystemTemplate: isSystem, isDeleted: false };

    if (isSystem) {
      query.firmId = null;
    } else {
      query.firmId = firmId;
    }

    if (category) query.category = category;
    if (practiceArea) query.practiceArea = practiceArea;
    if (subcategory) query.subcategory = subcategory;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }
    if (isSystemTemplate !== undefined) {
      query.isSystemTemplate = isSystemTemplate === "true";
    }

    return query;
  };

  const systemQuery = buildQuery(true);
  const firmQuery = buildQuery(false);

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [systemTemplates, firmTemplates, totalSystem, totalFirm] =
    await Promise.all([
      Template.find(systemQuery)
        .sort({ title: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Template.find(firmQuery)
        .sort({ title: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Template.countDocuments(systemQuery),
      Template.countDocuments(firmQuery),
    ]);

  const allTemplates = [...systemTemplates, ...firmTemplates];
  const totalRecords = totalSystem + totalFirm;

  res.status(200).json({
    status: "success",
    results: allTemplates.length,
    pagination: {
      current: parseInt(page),
      total: Math.ceil(totalRecords / parseInt(limit)),
      limit: parseInt(limit),
      totalRecords,
    },
    data: allTemplates,
  });
});

const getTemplate = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;
  const firmId = req.firmId;

  const template = await Template.findOne({
    _id: templateId,
    isDeleted: false,
    $or: [{ isSystemTemplate: true }, { firmId: firmId }],
  });

  if (!template) {
    return next(new AppError("Template not found", 404));
  }

  await template.incrementUsage();

  res.status(200).json({
    status: "success",
    data: template,
  });
});

const createTemplate = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    category,
    subcategory,
    practiceArea,
    content,
    tags,
    courtDetails,
    governingLaw,
    status,
    placeholders: providedPlaceholders,
  } = req.body;

  const extractedPlaceholders = Template.extractPlaceholders(content);

  const mergedPlaceholders = extractedPlaceholders.map((extracted) => {
    const provided = providedPlaceholders?.find(
      (p) => p.key === extracted.key
    );
    return provided ? { ...extracted, ...provided } : extracted;
  });

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const template = await Template.create({
    firmId: req.firmId,
    title,
    slug: `${slug}-${Date.now()}`,
    description,
    category,
    subcategory,
    practiceArea,
    content,
    placeholders: mergedPlaceholders,
    isSystemTemplate: false,
    tags,
    courtDetails,
    governingLaw,
    status: status || "active",
    createdBy: req.user._id,
  });

  res.status(201).json({
    status: "success",
    data: template,
  });
});

const updateTemplate = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;
  const firmId = req.firmId;
  const {
    title,
    description,
    category,
    subcategory,
    practiceArea,
    content,
    tags,
    courtDetails,
    governingLaw,
    status,
    placeholders,
  } = req.body;

  const template = await Template.findOne({
    _id: templateId,
    isDeleted: false,
    $or: [{ isSystemTemplate: true, firmId: null }, { firmId: firmId }],
  });

  if (!template) {
    return next(new AppError("Template not found", 404));
  }

  if (template.isSystemTemplate) {
    return next(
      new AppError(
        "System templates cannot be edited. Please duplicate it first.",
        403
      )
    );
  }

  const updateData = {
    description,
    category,
    subcategory,
    practiceArea,
    tags,
    courtDetails,
    governingLaw,
    status,
    updatedBy: req.user._id,
  };

  if (title) {
    updateData.title = title;
    updateData.slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  if (content) {
    updateData.content = content;
    const extractedPlaceholders = Template.extractPlaceholders(content);
    const mergedPlaceholders = extractedPlaceholders.map((extracted) => {
      const provided = placeholders?.find((p) => p.key === extracted.key);
      return provided ? { ...extracted, ...provided } : extracted;
    });
    updateData.placeholders = mergedPlaceholders;
  } else if (placeholders) {
    updateData.placeholders = placeholders;
  }

  const currentVersion = parseFloat(template.version) || 1.0;
  const newVersion = (currentVersion + 0.1).toFixed(1);

  updateData.version = newVersion;
  updateData.$push = {
    changelog: {
      version: newVersion,
      changes: `Template updated on ${new Date().toISOString()}`,
      updatedAt: new Date(),
      updatedBy: req.user._id,
    },
  };

  const updatedTemplate = await Template.findByIdAndUpdate(templateId, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: updatedTemplate,
  });
});

const deleteTemplate = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;
  const firmId = req.firmId;

  const template = await Template.findOne({
    _id: templateId,
    isDeleted: false,
    $or: [{ isSystemTemplate: true, firmId: null }, { firmId: firmId }],
  });

  if (!template) {
    return next(new AppError("Template not found", 404));
  }

  if (template.isSystemTemplate) {
    return next(
      new AppError("System templates cannot be deleted. They are platform-wide.", 403)
    );
  }

  await Template.findByIdAndUpdate(templateId, { isDeleted: true });

  res.status(200).json({
    status: "success",
    message: "Template deleted successfully",
  });
});

const generateDocument = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;
  const { title, filledData, matterId, clientId } = req.body;
  const firmId = req.firmId;

  const template = await Template.findOne({
    _id: templateId,
    isDeleted: false,
    $or: [{ isSystemTemplate: true }, { firmId: firmId }],
  });

  if (!template) {
    return next(new AppError("Template not found", 404));
  }

  const missingPlaceholders = template.placeholders
    .filter((p) => p.required && !filledData[p.key])
    .map((p) => p.key);

  if (missingPlaceholders.length > 0) {
    return next(
      new AppError(
        `Missing required fields: ${missingPlaceholders.join(", ")}`,
        400
      )
    );
  }

  const filledContent = template.generateDocument(filledData);

  const generatedDocument = await GeneratedDocument.create({
    firmId,
    templateId: template._id,
    matterId,
    clientId,
    title: title || `${template.title} - ${new Date().toLocaleDateString()}`,
    content: filledContent,
    filledData,
    generatedBy: req.user._id,
    status: "draft",
  });

  await template.incrementUsage();

  await generatedDocument.populate([
    { path: "templateId", select: "title category" },
    { path: "generatedBy", select: "firstName lastName" },
  ]);

  res.status(201).json({
    status: "success",
    data: generatedDocument,
  });
});

const getGeneratedDocuments = catchAsync(async (req, res, next) => {
  const { templateId, matterId, status, generatedBy, page = 1, limit = 20 } =
    req.query;
  const firmId = req.firmId;

  const query = { firmId, isDeleted: false };

  if (templateId) query.templateId = templateId;
  if (matterId) query.matterId = matterId;
  if (status) query.status = status;
  if (generatedBy) query.generatedBy = generatedBy;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [documents, total] = await Promise.all([
    GeneratedDocument.find(query)
      .populate("templateId", "title category")
      .populate("generatedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    GeneratedDocument.countDocuments(query),
  ]);

  res.status(200).json({
    status: "success",
    results: documents.length,
    pagination: {
      current: parseInt(page),
      total: Math.ceil(total / parseInt(limit)),
      limit: parseInt(limit),
      totalRecords: total,
    },
    data: documents,
  });
});

const getGeneratedDocument = catchAsync(async (req, res, next) => {
  const { documentId } = req.params;
  const firmId = req.firmId;

  const document = await GeneratedDocument.findOne({
    _id: documentId,
    firmId,
    isDeleted: false,
  }).populate([
    { path: "templateId", select: "title category placeholders" },
    { path: "generatedBy", select: "firstName lastName" },
    { path: "matterId", select: "matterNumber matterType" },
    { path: "clientId", select: "firstName lastName email" },
  ]);

  if (!document) {
    return next(new AppError("Generated document not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: document,
  });
});

const updateGeneratedDocument = catchAsync(async (req, res, next) => {
  const { documentId } = req.params;
  const { title, content, status, filledData } = req.body;
  const firmId = req.firmId;

  const document = await GeneratedDocument.findOne({
    _id: documentId,
    firmId,
    isDeleted: false,
  });

  if (!document) {
    return next(new AppError("Generated document not found", 404));
  }

  const updateData = {
    ...(title && { title }),
    ...(content && { content }),
    ...(status && { status }),
    ...(filledData && { filledData }),
  };

  const updatedDocument = await GeneratedDocument.findByIdAndUpdate(
    documentId,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: "templateId", select: "title category" },
    { path: "generatedBy", select: "firstName lastName" },
  ]);

  res.status(200).json({
    status: "success",
    data: updatedDocument,
  });
});

const exportDocument = catchAsync(async (req, res, next) => {
  const { documentId } = req.params;
  const { format = "txt" } = req.body;
  const firmId = req.firmId;

  const document = await GeneratedDocument.findOne({
    _id: documentId,
    firmId,
    isDeleted: false,
  }).populate("templateId", "title");

  if (!document) {
    return next(new AppError("Generated document not found", 404));
  }

  const filename = `${document.title.replace(/[^a-z0-9]/gi, "_")}.${format}`;

  if (format === "txt") {
    await GeneratedDocument.findByIdAndUpdate(documentId, {
      $push: {
        exports: {
          format: "txt",
          exportedAt: new Date(),
          exportedBy: req.user._id,
        },
      },
    });

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(document.content);
  }

  if (format === "docx") {
    if (!Document || !DocxXmlTransformer) {
      return next(new AppError("Word export not available. Please install docx package.", 503));
    }

    const { TextRun } = require("docx");
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: document.content.split("\n").map((line) => ({
            children: [new TextRun({ text: line })],
          })),
        },
      ],
    });

    const buffer = await DocxXmlTransformer.toBuffer(doc);

    await GeneratedDocument.findByIdAndUpdate(documentId, {
      $push: {
        exports: {
          format: "docx",
          exportedAt: new Date(),
          exportedBy: req.user._id,
        },
      },
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buffer);
  }

  if (format === "pdf") {
    if (!puppeteer) {
      return next(new AppError("PDF export not available. Please install puppeteer package.", 503));
    }

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.5;
              padding: 2cm;
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>${document.content}</body>
        </html>
      `;

      let browser;
      try {
        browser = await puppeteer.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-web-security"
          ],
        });
      } catch (launchError) {
        console.error("Puppeteer launch error:", launchError.message);
        return res.status(503).json({
          status: "error",
          message: `PDF export failed: Could not launch browser. The server may be restarting. Please try again.`,
        });
      }

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0", timeout: 30000 });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
      });

      await browser.close();

      await GeneratedDocument.findByIdAndUpdate(documentId, {
        $push: {
          exports: {
            format: "pdf",
            exportedAt: new Date(),
            exportedBy: req.user._id,
          },
        },
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF generation error:", error);
      return res.status(500).json({
        status: "error",
        message: `Failed to generate PDF: ${error.message}`,
      });
    }
  }

  return next(new AppError("Invalid export format", 400));
});

const duplicateTemplate = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;
  const firmId = req.firmId;

  const originalTemplate = await Template.findOne({
    _id: templateId,
    isDeleted: false,
    $or: [{ isSystemTemplate: true }, { firmId: firmId }],
  });

  if (!originalTemplate) {
    return next(new AppError("Template not found", 404));
  }

  const duplicate = await Template.create({
    firmId,
    title: `${originalTemplate.title} (Copy)`,
    slug: `${originalTemplate.slug}-copy-${Date.now()}`,
    description: originalTemplate.description,
    category: originalTemplate.category,
    subcategory: originalTemplate.subcategory,
    practiceArea: originalTemplate.practiceArea,
    content: originalTemplate.content,
    placeholders: originalTemplate.placeholders,
    isSystemTemplate: false,
    tags: originalTemplate.tags,
    courtDetails: originalTemplate.courtDetails,
    governingLaw: originalTemplate.governingLaw,
    status: "draft",
    usageCount: 0,
    createdBy: req.user._id,
  });

  res.status(201).json({
    status: "success",
    data: duplicate,
  });
});

const getFeaturedTemplates = catchAsync(async (req, res, next) => {
  const templates = await Template.find({
    isSystemTemplate: true,
    isFeatured: true,
    isDeleted: false,
    status: "active",
  }).sort({ title: 1 });

  res.status(200).json({
    status: "success",
    results: templates.length,
    data: templates,
  });
});

const getTemplatesByPracticeArea = catchAsync(async (req, res, next) => {
  const { category } = req.query;
  const firmId = req.firmId;

  const query = { isDeleted: false, status: "active" };

  if (category) query.category = category;

  const [systemTemplates, firmTemplates] = await Promise.all([
    Template.find({ ...query, isSystemTemplate: true, firmId: null }),
    Template.find({ ...query, isSystemTemplate: false, firmId }),
  ]);

  const allTemplates = [...systemTemplates, ...firmTemplates];

  const grouped = allTemplates.reduce((acc, template) => {
    const area = template.practiceArea || "general";
    if (!acc[area]) {
      acc[area] = [];
    }
    acc[area].push(template);
    return acc;
  }, {});

  res.status(200).json({
    status: "success",
    data: grouped,
  });
});

module.exports = {
  getAllTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generateDocument,
  getGeneratedDocuments,
  getGeneratedDocument,
  updateGeneratedDocument,
  exportDocument,
  duplicateTemplate,
  getFeaturedTemplates,
  getTemplatesByPracticeArea,
};
