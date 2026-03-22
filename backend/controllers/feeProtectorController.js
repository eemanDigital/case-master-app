const path = require("path");
const fs = require("fs").promises;
const multer = require("multer");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const CacMatter = require("../models/cacMatterModel");
const ProtectedDocument = require("../models/protectedDocumentModel");
const { generateWatermarkedVersion, generateThumbnail, ensureDirExists } = require("../utils/watermark");
const { sendCustomEmail } = require("../utils/email");
const Firm = require("../models/firmModel");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new AppError("Only images (jpeg, jpg, png) and documents (pdf, doc, docx) are allowed", 400));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

const uploadMiddleware = upload.single("document");

const getEntityModel = (entityType) => {
  switch (entityType) {
    case "cac":
      return CacMatter;
    case "standalone":
      return ProtectedDocument;
    default:
      return null;
  }
};

const getFileUrl = (filePath) => {
  if (!filePath) return null;
  return filePath.replace(/\\/g, "/").replace(/^.*?uploads/, "/uploads");
};

exports.uploadMiddleware = [uploadMiddleware];

exports.createFeeProtector = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No file uploaded", 400));
  }

  const { title, amount, notes, clientId, entityType } = req.body;

  const originalFileUrl = getFileUrl(req.file.path);
  const fileName = req.file.originalname;

  const doc = await ProtectedDocument.create({
    firmId: req.firmId,
    documentName: title || fileName,
    entityType: entityType || "other",
    clientId: clientId || null,
    createdBy: req.user._id,
    protectedDocument: {
      originalFileUrl,
      balanceAmount: amount ? parseFloat(amount) : 0,
      notes: notes || "",
      isBalancePaid: false,
      uploadedAt: new Date(),
    },
  });

  await doc.populate("clientId", "firstName lastName email");

  res.status(201).json({
    status: "success",
    data: {
      id: doc._id,
      type: "document",
      name: doc.documentName,
      clientId: doc.clientId,
      protectedDocument: doc.protectedDocument,
      createdAt: doc.createdAt,
    },
  });
});

exports.getFeeProtector = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  let entity = await ProtectedDocument.findOne({ _id: id, firmId: req.firmId, isDeleted: { $ne: true } });
  let type = "standalone";

  if (!entity) {
    entity = await CacMatter.findOne({ _id: id, firmId: req.firmId });
    type = "cac";
  }

  if (!entity) {
    return next(new AppError("Fee protector not found", 404));
  }

  await entity.populate("clientId", "firstName lastName email");

  res.status(200).json({
    status: "success",
    data: {
      id: entity._id,
      type,
      name: entity.documentName || entity.companyName,
      entityType: entity.entityType,
      clientId: entity.clientId,
      protectedDocument: entity.protectedDocument,
      createdAt: entity.createdAt,
    },
  });
});

exports.updateFeeProtector = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { amount, notes, isBalancePaid, clientId } = req.body;

  let entity = await ProtectedDocument.findOne({ _id: id, firmId: req.firmId, isDeleted: { $ne: true } });

  if (!entity) {
    entity = await CacMatter.findOne({ _id: id, firmId: req.firmId });
  }

  if (!entity) {
    return next(new AppError("Fee protector not found", 404));
  }

  if (amount !== undefined) {
    entity.protectedDocument = entity.protectedDocument || {};
    entity.protectedDocument.balanceAmount = amount;
  }

  if (notes !== undefined) {
    entity.protectedDocument = entity.protectedDocument || {};
    entity.protectedDocument.notes = notes;
  }

  if (isBalancePaid !== undefined) {
    entity.protectedDocument = entity.protectedDocument || {};
    entity.protectedDocument.isBalancePaid = isBalancePaid;
    if (isBalancePaid) {
      entity.protectedDocument.paymentConfirmedAt = new Date();
      entity.protectedDocument.paymentConfirmedBy = req.user._id;
    }
  }

  if (clientId !== undefined) {
    entity.clientId = clientId || null;
  }

  await entity.save();
  await entity.populate("clientId", "firstName lastName email");

  res.status(200).json({
    status: "success",
    data: entity,
  });
});

exports.deleteFeeProtector = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  let entity = await ProtectedDocument.findOne({ _id: id, firmId: req.firmId });

  if (!entity) {
    entity = await CacMatter.findOne({ _id: id, firmId: req.firmId });
  }

  if (!entity) {
    return next(new AppError("Fee protector not found", 404));
  }

  if (entity.constructor.modelName === "ProtectedDocument") {
    entity.isDeleted = true;
    await entity.save();
  } else {
    entity.protectedDocument = undefined;
    await entity.save();
  }

  res.status(200).json({
    status: "success",
    message: "Fee protector deleted successfully",
  });
});

exports.uploadProtectedDocument = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No file uploaded", 400));
  }

  const { entityType, entityId, balanceAmount } = req.body;

  if (!entityType || !entityId) {
    return next(new AppError("Entity type and ID are required", 400));
  }

  const Model = getEntityModel(entityType);
  if (!Model) {
    return next(new AppError("Invalid entity type", 400));
  }

  const entity = await Model.findOne({ _id: entityId, firmId: req.firmId });
  if (!entity) {
    return next(new AppError("Entity not found", 404));
  }

  const firmId = req.firmId.toString();
  const originalsDir = path.join(__dirname, "..", "uploads", "protected", "originals", firmId);
  const watermarkedDir = path.join(__dirname, "..", "uploads", "protected", "watermarked", firmId);
  const thumbnailsDir = path.join(__dirname, "..", "uploads", "protected", "thumbnails", firmId);

  await ensureDirExists(originalsDir);
  await ensureDirExists(watermarkedDir);
  await ensureDirExists(thumbnailsDir);

  const timestamp = Date.now();
  const ext = path.extname(req.file.originalname);
  const baseFilename = `${entityType}_${entityId}_${timestamp}`;
  const originalFilename = `${baseFilename}_original${ext}`;
  const watermarkedFilename = `${baseFilename}_watermarked.jpg`;
  const thumbnailFilename = `${baseFilename}_thumbnail.jpg`;

  const originalPath = path.join(originalsDir, originalFilename);
  const watermarkedPath = path.join(watermarkedDir, watermarkedFilename);
  const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

  await fs.writeFile(originalPath, req.file.buffer);

  await generateWatermarkedVersion(originalPath, watermarkedPath);
  await generateThumbnail(originalPath, thumbnailPath);

  const protectedDocData = {
    originalFileUrl: getFileUrl(originalPath),
    watermarkedFileUrl: getFileUrl(watermarkedPath),
    thumbnailUrl: getFileUrl(thumbnailPath),
    originalFilename: req.file.originalname,
    mimeType: req.file.mimetype,
    uploadedAt: new Date(),
    uploadedBy: req.user._id,
    isBalancePaid: false,
    balanceAmount: balanceAmount ? parseFloat(balanceAmount) : 0,
    accessLog: [],
  };

  entity.protectedDocument = protectedDocData;
  await entity.save({ validateBeforeSave: false });

  if (entityType === "cac" && entity.timeline) {
    entity.timeline.push({
      action: "Document Uploaded",
      description: `Protected document uploaded: ${req.file.originalname}`,
      date: new Date(),
      performedBy: req.user._id,
    });
    await entity.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    status: "success",
    data: {
      thumbnailUrl: protectedDocData.thumbnailUrl,
      originalFilename: protectedDocData.originalFilename,
      uploadedAt: protectedDocData.uploadedAt,
      balanceAmount: protectedDocData.balanceAmount,
    },
  });
});

exports.getProtectedDocument = catchAsync(async (req, res, next) => {
  const { entityType, entityId } = req.params;

  if (!entityType || !entityId) {
    return next(new AppError("Entity type and ID are required", 400));
  }

  const Model = getEntityModel(entityType);
  if (!Model) {
    return next(new AppError("Invalid entity type", 400));
  }

  const entity = await Model.findOne({ _id: entityId, firmId: req.firmId });
  if (!entity) {
    return next(new AppError("Entity not found", 404));
  }

  if (!entity.protectedDocument || !entity.protectedDocument.originalFileUrl) {
    return next(new AppError("No protected document found", 404));
  }

  const { protectedDocument } = entity;
  const isClient = req.user.role === "client" || req.user.userType === "client";
  const isLawyerOrAdmin = ["lawyer", "admin", "super-admin"].includes(req.user.role);

  let fileToServe = null;
  let wasGranted = false;
  let attemptType = req.query.download === "true" ? "download" : "view";

  if (isLawyerOrAdmin) {
    fileToServe = protectedDocument.originalFileUrl;
    wasGranted = true;
  } else if (isClient) {
    if (protectedDocument.isBalancePaid) {
      fileToServe = protectedDocument.originalFileUrl;
      wasGranted = true;
    } else {
      fileToServe = protectedDocument.watermarkedFileUrl;
      wasGranted = false;
    }
  } else {
    fileToServe = protectedDocument.watermarkedFileUrl;
    wasGranted = false;
  }

  entity.protectedDocument.accessLog.push({
    accessedBy: req.user._id,
    accessedAt: new Date(),
    ipAddress: req.ip || req.connection.remoteAddress,
    wasGranted,
    attemptType,
  });
  await entity.save({ validateBeforeSave: false, validate: false });

  const fullPath = path.join(__dirname, "..", "..", fileToServe);

  try {
    const fileBuffer = await fs.readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();

    let contentType = "application/octet-stream";
    if (ext === ".pdf") contentType = "application/pdf";
    else if ([".jpg", ".jpeg"].includes(ext)) contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `${attemptType === "download" ? "attachment" : "inline"}; filename="${path.basename(fullPath)}"`);
    res.setHeader("Cache-Control", "no-cache");

    res.send(fileBuffer);
  } catch (error) {
    console.error("Error serving file:", error);
    return next(new AppError("Error retrieving document", 500));
  }
});

exports.confirmPayment = catchAsync(async (req, res, next) => {
  const { entityType, entityId } = req.params;

  if (!entityType || !entityId) {
    return next(new AppError("Entity type and ID are required", 400));
  }

  const Model = getEntityModel(entityType);
  if (!Model) {
    return next(new AppError("Invalid entity type", 400));
  }

  const entity = await Model.findOne({ _id: entityId, firmId: req.firmId });
  if (!entity) {
    return next(new AppError("Entity not found", 404));
  }

  if (!entity.protectedDocument) {
    return next(new AppError("No protected document found", 404));
  }

  entity.protectedDocument.isBalancePaid = true;
  entity.protectedDocument.balancePaidAt = new Date();
  entity.protectedDocument.balancePaidConfirmedBy = req.user._id;
  await entity.save({ validateBeforeSave: false, validate: false });

  if (entityType === "cac" && entity.timeline) {
    entity.timeline.push({
      action: "Payment Confirmed",
      description: `Balance payment confirmed. Original document now available for download.`,
      date: new Date(),
      performedBy: req.user._id,
    });
    await entity.save({ validateBeforeSave: false, validate: false });
  }

  try {
    const firm = await Firm.findById(req.firmId);
    const clientEmail = entity.clientId?.email || req.body.clientEmail;

    if (clientEmail) {
      await sendCustomEmail(
        "Your Document is Ready for Download",
        clientEmail,
        process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
        null,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Payment Confirmed!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #374151; font-size: 16px;">Dear Valued Client,</p>
              <p style="color: #374151; font-size: 16px;">Great news! Your payment has been confirmed and your original document is now available for download.</p>
              <p style="color: #374151; font-size: 16px;"><strong>Document:</strong> ${entity.protectedDocument.originalFilename || "Your requested document"}</p>
              <div style="background: #10b981; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="margin: 0;">You can now download your original high-resolution document.</p>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Thank you for choosing ${firm?.name || "LawMaster"}!</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #9ca3af; font-size: 12px;">This is an automated message from LawMaster. Please do not reply directly to this email.</p>
            </div>
          </div>
        `
      );
    }
  } catch (emailError) {
    console.error("Error sending confirmation email:", emailError);
  }

  res.status(200).json({
    status: "success",
    message: "Payment confirmed successfully",
    data: {
      isBalancePaid: entity.protectedDocument.isBalancePaid,
      balancePaidAt: entity.protectedDocument.balancePaidAt,
    },
  });
});

exports.revokePaymentConfirmation = catchAsync(async (req, res, next) => {
  const { entityType, entityId } = req.params;

  if (!entityType || !entityId) {
    return next(new AppError("Entity type and ID are required", 400));
  }

  const Model = getEntityModel(entityType);
  if (!Model) {
    return next(new AppError("Invalid entity type", 400));
  }

  const entity = await Model.findOne({ _id: entityId, firmId: req.firmId });
  if (!entity) {
    return next(new AppError("Entity not found", 404));
  }

  if (!entity.protectedDocument) {
    return next(new AppError("No protected document found", 404));
  }

  entity.protectedDocument.isBalancePaid = false;
  entity.protectedDocument.balancePaidAt = null;
  entity.protectedDocument.balancePaidConfirmedBy = null;

  entity.protectedDocument.accessLog.push({
    accessedBy: req.user._id,
    accessedAt: new Date(),
    ipAddress: req.ip || req.connection.remoteAddress,
    wasGranted: false,
    attemptType: "admin-revocation",
  });

  await entity.save({ validateBeforeSave: false, validate: false });

  res.status(200).json({
    status: "success",
    message: "Payment confirmation revoked",
    data: {
      isBalancePaid: false,
    },
  });
});

exports.getAccessLog = catchAsync(async (req, res, next) => {
  const { entityType, entityId } = req.params;

  if (!entityType || !entityId) {
    return next(new AppError("Entity type and ID are required", 400));
  }

  const Model = getEntityModel(entityType);
  if (!Model) {
    return next(new AppError("Invalid entity type", 400));
  }

  const entity = await Model.findOne({ _id: entityId, firmId: req.firmId })
    .select("protectedDocument")
    .populate("protectedDocument.accessLog.accessedBy", "firstName lastName email");

  if (!entity) {
    return next(new AppError("Entity not found", 404));
  }

  if (!entity.protectedDocument || !entity.protectedDocument.accessLog) {
    return res.status(200).json({
      status: "success",
      data: [],
    });
  }

  res.status(200).json({
    status: "success",
    data: entity.protectedDocument.accessLog,
  });
});

exports.getProtectedDocumentStatus = catchAsync(async (req, res, next) => {
  const { entityType, entityId } = req.params;

  if (!entityType || !entityId) {
    return next(new AppError("Entity type and ID are required", 400));
  }

  const Model = getEntityModel(entityType);
  if (!Model) {
    return next(new AppError("Invalid entity type", 400));
  }

  const entity = await Model.findOne({ _id: entityId, firmId: req.firmId })
    .select("protectedDocument clientId");

  if (!entity) {
    return next(new AppError("Entity not found", 404));
  }

  if (!entity.protectedDocument) {
    return res.status(200).json({
      status: "success",
      data: {
        hasDocument: false,
      },
    });
  }

  const { protectedDocument } = entity;
  const isOwner = entity.clientId?.toString() === req.user._id.toString();
  const isLawyerOrAdmin = ["lawyer", "admin", "super-admin"].includes(req.user.role);

  res.status(200).json({
    status: "success",
    data: {
      hasDocument: true,
      thumbnailUrl: protectedDocument.thumbnailUrl,
      originalFilename: protectedDocument.originalFilename,
      uploadedAt: protectedDocument.uploadedAt,
      balanceAmount: protectedDocument.balanceAmount,
      isBalancePaid: protectedDocument.isBalancePaid,
      balancePaidAt: protectedDocument.balancePaidAt,
      canDownload: isLawyerOrAdmin || protectedDocument.isBalancePaid,
      showWatermark: !isLawyerOrAdmin && !protectedDocument.isBalancePaid,
    },
  });
});

exports.getAllFeeProtectors = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, entityType } = req.query;

  const query = { firmId: req.firmId, isDeleted: { $ne: true } };

  if (entityType) {
    query.entityType = entityType;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [standaloneDocs, cacMatters] = await Promise.all([
    ProtectedDocument.find(query)
      .select("documentName entityType clientId protectedDocument createdAt")
      .populate("clientId", "firstName lastName email")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    CacMatter.find({ ...query, "protectedDocument.originalFileUrl": { $exists: true } })
      .select("companyName entityType clientId protectedDocument createdAt")
      .populate("clientId", "firstName lastName email")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
  ]);

  const combined = [
    ...standaloneDocs.map(d => ({
      _id: d._id,
      type: "standalone",
      entityType: d.entityType,
      name: d.documentName,
      clientId: d.clientId,
      protectedDocument: d.protectedDocument,
      createdAt: d.createdAt,
    })),
    ...cacMatters.map(m => ({
      _id: m._id,
      type: "cac",
      entityType: m.entityType,
      name: m.companyName,
      clientId: m.clientId,
      protectedDocument: m.protectedDocument,
      createdAt: m.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.status(200).json({
    status: "success",
    data: combined,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: combined.length,
    },
  });
});

exports.getFeeProtectorStats = catchAsync(async (req, res, next) => {
  const [standaloneStats, cacStats] = await Promise.all([
    ProtectedDocument.aggregate([
      { $match: { firmId: req.firmId, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          paid: { $sum: { $cond: ["$protectedDocument.isBalancePaid", 1, 0] } },
          unpaid: { $sum: { $cond: ["$protectedDocument.isBalancePaid", 0, 1] } },
          totalAmount: { $sum: "$protectedDocument.balanceAmount" },
        },
      },
    ]),
    CacMatter.aggregate([
      { $match: { firmId: req.firmId, "protectedDocument.originalFileUrl": { $exists: true } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          paid: { $sum: { $cond: ["$protectedDocument.isBalancePaid", 1, 0] } },
          unpaid: { $sum: { $cond: ["$protectedDocument.isBalancePaid", 0, 1] } },
          totalAmount: { $sum: "$protectedDocument.balanceAmount" },
        },
      },
    ]),
  ]);

  const totalProtected = (standaloneStats[0]?.total || 0) + (cacStats[0]?.total || 0);
  const totalPaid = (standaloneStats[0]?.paid || 0) + (cacStats[0]?.paid || 0);
  const totalUnpaid = (standaloneStats[0]?.unpaid || 0) + (cacStats[0]?.unpaid || 0);
  const totalAmount = (standaloneStats[0]?.totalAmount || 0) + (cacStats[0]?.totalAmount || 0);

  res.status(200).json({
    status: "success",
    data: {
      totalProtected,
      totalPaid,
      totalUnpaid,
      totalAmount,
      standaloneDocuments: standaloneStats[0] || { total: 0, paid: 0, unpaid: 0, totalAmount: 0 },
      cacMatters: cacStats[0] || { total: 0, paid: 0, unpaid: 0, totalAmount: 0 },
    },
  });
});

exports.getPublicDocumentInfo = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const doc = await ProtectedDocument.findOne({ _id: id })
    .populate("clientId", "firstName lastName email")
    .select("documentName clientId protectedDocument createdAt");

  if (!doc) {
    return next(new AppError("Document not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      _id: doc._id,
      name: doc.documentName,
      client: doc.clientId,
      protectedDocument: doc.protectedDocument,
      createdAt: doc.createdAt,
    },
  });
});

exports.downloadProtectedDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const doc = await ProtectedDocument.findOne({ _id: id, firmId: req.firmId });

  if (!doc || !doc.protectedDocument) {
    return next(new AppError("Protected document not found", 404));
  }

  let fileUrl;
  let filename;

  if (doc.protectedDocument.isBalancePaid && doc.protectedDocument.originalFileUrl) {
    fileUrl = doc.protectedDocument.originalFileUrl;
    filename = doc.documentName;
  } else {
    fileUrl = doc.protectedDocument.watermarkedFileUrl || doc.protectedDocument.originalFileUrl;
    filename = `${doc.documentName} (Watermarked)`;
  }

  if (!fileUrl) {
    return next(new AppError("File not found", 404));
  }

  const filePath = path.join(__dirname, "..", "..", fileUrl.replace(/^\//, ""));

  try {
    await fs.access(filePath);
    res.download(filePath, filename);
  } catch {
    return next(new AppError("File not found on server", 404));
  }
});

exports.previewProtectedDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const doc = await ProtectedDocument.findOne({ _id: id, firmId: req.firmId });

  if (!doc || !doc.protectedDocument) {
    return next(new AppError("Protected document not found", 404));
  }

  let fileUrl;

  if (doc.protectedDocument.isBalancePaid) {
    fileUrl = doc.protectedDocument.originalFileUrl;
  } else {
    fileUrl = doc.protectedDocument.watermarkedFileUrl || doc.protectedDocument.thumbnailUrl;
  }

  if (!fileUrl) {
    return next(new AppError("Preview not available", 404));
  }

  const filePath = path.join(__dirname, "..", "..", fileUrl.replace(/^\//, ""));

  try {
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch {
    return next(new AppError("Preview file not found", 404));
  }
});
