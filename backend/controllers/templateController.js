const Template = require("../models/templateModel");
const GeneratedDocument = require("../models/generatedDocumentModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ─── Optional dependency loading ─────────────────────────────────────────────
let DocxDocument, DocxPacker, DocxParagraph, DocxTextRun;
try {
  const docx = require("docx");
  DocxDocument = docx.Document;
  DocxPacker = docx.Packer;
  DocxParagraph = docx.Paragraph;
  DocxTextRun = docx.TextRun;
  console.log("✅ docx package loaded successfully");
} catch (e) {
  console.warn(
    "docx package not installed - Word export will not be available",
  );
}

let puppeteer;
try {
  puppeteer = require("puppeteer");
  console.log("✅ puppeteer package loaded successfully");
} catch (e) {
  console.warn(
    "puppeteer package not installed - PDF export will not be available",
  );
}

const PDFDocument = require("pdfkit");

// ─── Template Library ─────────────────────────────────────────────────────────

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
        .sort({ isFeatured: -1, title: 1 })
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

  if (!title || !category || !content) {
    return next(new AppError("Title, category, and content are required", 400));
  }

  const extractedPlaceholders = Template.extractPlaceholders(content);

  const mergedPlaceholders = extractedPlaceholders.map((extracted) => {
    const provided = providedPlaceholders?.find((p) => p.key === extracted.key);
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
        403,
      ),
    );
  }

  const updateData = {
    ...(description !== undefined && { description }),
    ...(category && { category }),
    ...(subcategory !== undefined && { subcategory }),
    ...(practiceArea !== undefined && { practiceArea }),
    ...(tags !== undefined && { tags }),
    ...(courtDetails !== undefined && { courtDetails }),
    ...(governingLaw !== undefined && { governingLaw }),
    ...(status && { status }),
    updatedBy: req.user._id,
  };

  if (title) {
    updateData.title = title;
    updateData.slug = `${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}-${Date.now()}`;
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

  const updatedTemplate = await Template.findByIdAndUpdate(
    templateId,
    {
      ...updateData,
      $push: {
        changelog: {
          version: newVersion,
          changes: `Template updated on ${new Date().toISOString()}`,
          updatedAt: new Date(),
          updatedBy: req.user._id,
        },
      },
    },
    { new: true, runValidators: true },
  );

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
      new AppError(
        "System templates cannot be deleted. They are platform-wide.",
        403,
      ),
    );
  }

  await Template.findByIdAndUpdate(templateId, { isDeleted: true });

  res.status(200).json({
    status: "success",
    message: "Template deleted successfully",
  });
});

// ─── Document Generation ──────────────────────────────────────────────────────

const generateDocument = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;
  const { title, filledData, matterId, clientId } = req.body;
  const firmId = req.firmId;

  if (!filledData || typeof filledData !== "object") {
    return next(
      new AppError("filledData is required and must be an object", 400),
    );
  }

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
    .map((p) => ({ key: p.key, label: p.label || p.key }));

  if (missingPlaceholders.length > 0) {
    return next(
      new AppError(
        `Missing required fields: ${missingPlaceholders.map((p) => p.label).join(", ")}`,
        400,
      ),
    );
  }

  const filledContent = template.generateDocument(filledData);

  const generatedDocument = await GeneratedDocument.create({
    firmId,
    templateId: template._id,
    matterId: matterId || undefined,
    clientId: clientId || undefined,
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
  const {
    templateId,
    matterId,
    status,
    generatedBy,
    search,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = req.query;

  const firmId = req.firmId;

  const query = { firmId, isDeleted: false };

  if (templateId) query.templateId = templateId;
  if (matterId) query.matterId = matterId;
  if (status) query.status = status;
  if (generatedBy) query.generatedBy = generatedBy;

  if (search) {
    query.title = { $regex: search, $options: "i" };
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [documents, total] = await Promise.all([
    GeneratedDocument.find(query)
      .populate("templateId", "title category")
      .populate("generatedBy", "firstName lastName")
      .populate("matterId", "matterNumber matterType")
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
    { new: true, runValidators: true },
  ).populate([
    { path: "templateId", select: "title category" },
    { path: "generatedBy", select: "firstName lastName" },
  ]);

  res.status(200).json({
    status: "success",
    data: updatedDocument,
  });
});

// ─── Delete Generated Document ────────────────────────────────────────────────

const deleteGeneratedDocument = catchAsync(async (req, res, next) => {
  const { documentId } = req.params;
  const firmId = req.firmId;

  const document = await GeneratedDocument.findOne({
    _id: documentId,
    firmId,
    isDeleted: false,
  });

  if (!document) {
    return next(new AppError("Generated document not found", 404));
  }

  await GeneratedDocument.findByIdAndUpdate(documentId, { isDeleted: true });

  res.status(200).json({
    status: "success",
    message: "Document deleted successfully",
  });
});

// ─── Export ───────────────────────────────────────────────────────────────────

const exportDocument = catchAsync(async (req, res, next) => {
  const { documentId } = req.params;
  const { format = "txt" } = req.body;
  const firmId = req.firmId;

  if (!["pdf", "docx", "txt"].includes(format)) {
    return next(
      new AppError("Invalid export format. Use pdf, docx, or txt.", 400),
    );
  }

  const document = await GeneratedDocument.findOne({
    _id: documentId,
    firmId,
    isDeleted: false,
  }).populate("templateId", "title");

  if (!document) {
    return next(new AppError("Generated document not found", 404));
  }

  const filename = `${document.title.replace(/[^a-z0-9]/gi, "_")}.${format}`;

  // ── TXT ────────────────────────────────────────────────────────────────────
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

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(document.content);
  }

  // ── DOCX ───────────────────────────────────────────────────────────────────
  if (format === "docx") {
    if (!DocxDocument || !DocxPacker) {
      return next(
        new AppError(
          "Word export not available. Please install the docx package.",
          503,
        ),
      );
    }

    try {
      const doc = new DocxDocument({
        sections: [
          {
            properties: {},
            children: document.content.split("\n").map(
              (line) =>
                new DocxParagraph({
                  children: [
                    new DocxTextRun({
                      text: line || " ",
                      font: "Times New Roman",
                      size: 24, // 12pt — docx uses half-points
                    }),
                  ],
                  spacing: { line: 360 }, // 1.5 line spacing
                }),
            ),
          },
        ],
      });

      // Packer.toBuffer is the correct method
      const buffer = await DocxPacker.toBuffer(doc);

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
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      return res.send(buffer);
    } catch (error) {
      console.error("DOCX generation error:", error);
      return next(
        new AppError(`Failed to generate Word document: ${error.message}`, 500),
      );
    }
  }

  // ── PDF ────────────────────────────────────────────────────────────────────
  if (format === "pdf") {
    try {
      const chunks = [];
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 56, bottom: 56, left: 56, right: 56 },
      });

      doc.on("data", (chunk) => chunks.push(chunk));

      doc.font("Times-Roman").fontSize(12);

      const lines = document.content.split("\n");
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed === "") {
          doc.moveDown(0.5);
        } else {
          doc.text(trimmed, { continued: false });
        }
      });

      await GeneratedDocument.findByIdAndUpdate(documentId, {
        $push: {
          exports: {
            format: "pdf",
            exportedAt: new Date(),
            exportedBy: req.user._id,
          },
        },
      });

      return new Promise((resolve, reject) => {
        doc.end();
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(chunks);
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
          res.setHeader("Content-Length", pdfBuffer.length);
          res.end(pdfBuffer);
          resolve();
        });
        doc.on("error", reject);
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      return next(
        new AppError(`Failed to generate PDF: ${error.message}`, 500),
      );
    }
  }
});

// ─── Duplicate Template ───────────────────────────────────────────────────────

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

  const slug = originalTemplate.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const duplicate = await Template.create({
    firmId,
    title: `${originalTemplate.title} (Copy)`,
    slug: `${slug}-copy-${Date.now()}`,
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
    version: "1.0",
    createdBy: req.user._id,
  });

  res.status(201).json({
    status: "success",
    data: duplicate,
  });
});

// ─── Featured Templates ───────────────────────────────────────────────────────

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

// ─── Templates By Practice Area ───────────────────────────────────────────────

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
    if (!acc[area]) acc[area] = [];
    acc[area].push(template);
    return acc;
  }, {});

  res.status(200).json({
    status: "success",
    data: grouped,
  });
});

// ─── Exports ──────────────────────────────────────────────────────────────────

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
  deleteGeneratedDocument,
  exportDocument,
  duplicateTemplate,
  getFeaturedTemplates,
  getTemplatesByPracticeArea,
};
