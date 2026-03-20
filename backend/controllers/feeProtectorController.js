const path = require("path");
const fs = require("fs").promises;
const multer = require("multer");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const CacMatter = require("../models/cacMatterModel");
const GeneratedDocument = require("../models/generatedDocumentModel");
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
    case "document":
      return GeneratedDocument;
    default:
      return null;
  }
};

const getFileUrl = (filePath) => {
  if (!filePath) return null;
  return filePath.replace(/\\/g, "/").replace(/^.*?uploads/, "/uploads");
};

exports.uploadMiddleware = [uploadMiddleware];

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
