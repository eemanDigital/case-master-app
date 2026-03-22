const path = require("path");
const fs = require("fs").promises;
const multer = require("multer");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const CacMatter = require("../models/cacMatterModel");
const ProtectedDocument = require("../models/protectedDocumentModel");
const {
  generateWatermarkedVersion,
  ensureDirExists,
} = require("../utils/watermark");
const { sendCustomEmail } = require("../utils/email");
const Firm = require("../models/firmModel");

// ─── Multer ────────────────────────────────────────────────────────────────

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf|doc|docx/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) return cb(null, true);
  cb(
    new AppError("Only images and documents (pdf, doc, docx) are allowed", 400),
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

exports.uploadMiddleware = [upload.single("file")];

// ─── Helpers ───────────────────────────────────────────────────────────────

const getFileUrl = (filePath) =>
  filePath.replace(/\\/g, "/").replace(/^.*?uploads/, "/uploads");

const resolveFilePath = (fileUrl) =>
  path.join(__dirname, "..", fileUrl.replace(/^\//, ""));

const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
  };
  return map[ext] || "application/octet-stream";
};

// resolveActualPath: resolves the file that actually exists on disk.
// With the new watermark system, Word docs are converted to PDF, so we need
// to handle the case where a .doc/.docx input results in a .pdf output.
const resolveActualPath = async (storedPath) => {
  try {
    await fs.access(storedPath);
    return storedPath;
  } catch {
    // Try with .pdf extension (Word docs are now converted to PDF)
    const pdfPath = storedPath.replace(/\.(docx?|pdf)$/i, ".pdf");
    try {
      await fs.access(pdfPath);
      return pdfPath;
    } catch {
      // Legacy fallback: old Puppeteer watermarker renamed .pdf → .png
      const pngPath = storedPath.replace(/\.pdf$/i, ".png");
      try {
        await fs.access(pngPath);
        return pngPath;
      } catch {
        return storedPath; // not found either way — caller gets clean 404
      }
    }
  }
};

// Format a ProtectedDocument for API response (consistent shape for frontend adapter)
const formatDoc = (doc) => ({
  _id: doc._id,
  type: "standalone",
  name: doc.documentName,
  entityType: doc.entityType,
  clientId: doc.clientId,
  protectedDocument: doc.protectedDocument,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

// ─── Create (upload + watermark) ───────────────────────────────────────────

exports.createFeeProtector = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError("No file uploaded", 400));

  const { title, amount, notes, clientId } = req.body;
  const firmId = req.firmId.toString();

  const originalsDir = path.join(
    __dirname,
    "..",
    "uploads",
    "protected",
    "originals",
    firmId,
  );
  const watermarkedDir = path.join(
    __dirname,
    "..",
    "uploads",
    "protected",
    "watermarked",
    firmId,
  );

  await ensureDirExists(originalsDir);
  await ensureDirExists(watermarkedDir);

  const timestamp = Date.now();
  const ext = path.extname(req.file.originalname).toLowerCase();
  const base = `standalone_${timestamp}`;

  const originalPath = path.join(originalsDir, `${base}_original${ext}`);

  const isWordFile = [".doc", ".docx"].includes(ext);
  const watermarkedExt = isWordFile ? ".pdf" : ext;
  const watermarkedPath = path.join(
    watermarkedDir,
    `${base}_watermarked${watermarkedExt}`,
  );

  await fs.writeFile(originalPath, req.file.buffer);

  let actualWatermarkedPath = watermarkedPath;
  try {
    const result = await generateWatermarkedVersion(
      originalPath,
      watermarkedPath,
    );
    if (result) actualWatermarkedPath = result;
  } catch (err) {
    console.warn(
      "Watermark generation failed, using original as fallback:",
      err.message,
    );
    await fs.copyFile(originalPath, watermarkedPath);
    actualWatermarkedPath = watermarkedPath;
  }

  const actualMimeType = isWordFile
    ? "application/pdf"
    : req.file.mimetype;

  const doc = await ProtectedDocument.create({
    firmId: req.firmId,
    documentName: title || req.file.originalname,
    entityType: "other",
    clientId: clientId || null,
    createdBy: req.user._id,
    protectedDocument: {
      originalFileUrl: getFileUrl(originalPath),
      watermarkedFileUrl: getFileUrl(actualWatermarkedPath),
      originalFilename: req.file.originalname,
      mimeType: actualMimeType,
      originalMimeType: req.file.mimetype,
      balanceAmount: amount ? parseFloat(amount) : 0,
      notes: notes || "",
      isBalancePaid: false,
      uploadedAt: new Date(),
    },
  });

  await doc.populate("clientId", "firstName lastName email");

  res.status(201).json({
    status: "success",
    data: formatDoc(doc),
  });
});

// ─── Get all ───────────────────────────────────────────────────────────────

exports.getAllFeeProtectors = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = { firmId: req.firmId, isDeleted: { $ne: true } };
  if (status === "paid") query["protectedDocument.isBalancePaid"] = true;
  if (status === "pending")
    query["protectedDocument.isBalancePaid"] = { $ne: true };

  const [docs, total] = await Promise.all([
    ProtectedDocument.find(query)
      .select(
        "documentName entityType clientId protectedDocument createdAt updatedAt",
      )
      .populate("clientId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    ProtectedDocument.countDocuments(query),
  ]);

  res.status(200).json({
    status: "success",
    data: docs.map(formatDoc),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ─── Get one ───────────────────────────────────────────────────────────────

exports.getFeeProtector = catchAsync(async (req, res, next) => {
  const doc = await ProtectedDocument.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  }).populate("clientId", "firstName lastName email");

  if (!doc) return next(new AppError("Document not found", 404));

  res.status(200).json({ status: "success", data: formatDoc(doc) });
});

// ─── Update ────────────────────────────────────────────────────────────────

exports.updateFeeProtector = catchAsync(async (req, res, next) => {
  const { amount, notes, clientId } = req.body;

  const doc = await ProtectedDocument.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!doc) return next(new AppError("Document not found", 404));

  if (amount !== undefined)
    doc.protectedDocument.balanceAmount = parseFloat(amount);
  if (notes !== undefined) doc.protectedDocument.notes = notes;
  if (clientId !== undefined) doc.clientId = clientId || null;

  await doc.save();
  await doc.populate("clientId", "firstName lastName email");

  res.status(200).json({ status: "success", data: formatDoc(doc) });
});

// ─── Delete ────────────────────────────────────────────────────────────────

exports.deleteFeeProtector = catchAsync(async (req, res, next) => {
  const doc = await ProtectedDocument.findOne({
    _id: req.params.id,
    firmId: req.firmId,
  });

  if (!doc) return next(new AppError("Document not found", 404));

  // Soft delete
  doc.isDeleted = true;
  await doc.save();

  // Clean up files from disk (non-blocking)
  const cleanup = async () => {
    try {
      const { originalFileUrl, watermarkedFileUrl } =
        doc.protectedDocument || {};
      if (originalFileUrl)
        await fs.unlink(resolveFilePath(originalFileUrl)).catch(() => {});
      if (watermarkedFileUrl)
        await fs.unlink(resolveFilePath(watermarkedFileUrl)).catch(() => {});
    } catch (err) {
      console.warn("File cleanup error:", err.message);
    }
  };
  cleanup();

  res.status(200).json({ status: "success", message: "Document deleted" });
});

// ─── Confirm payment (manual) ──────────────────────────────────────────────
// Returns full document so the Redux adapter can upsert correctly

exports.confirmPayment = catchAsync(async (req, res, next) => {
  const { paymentMethod, transactionRef, notes } = req.body;

  const doc = await ProtectedDocument.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!doc) return next(new AppError("Document not found", 404));
  if (!doc.protectedDocument)
    return next(new AppError("No protected document on record", 404));

  if (doc.protectedDocument.isBalancePaid) {
    return next(
      new AppError("Payment has already been confirmed for this document", 400),
    );
  }

  doc.protectedDocument.isBalancePaid = true;
  doc.protectedDocument.balancePaidAt = new Date();
  doc.protectedDocument.balancePaidConfirmedBy = req.user._id;
  doc.protectedDocument.paymentMethod = paymentMethod || "manual";
  doc.protectedDocument.paymentReference =
    transactionRef || `MANUAL-${Date.now()}`;
  if (notes) doc.protectedDocument.paymentNotes = notes;

  await doc.save();
  await doc.populate("clientId", "firstName lastName email");

  // Send email notification (non-blocking)
  const notifyClient = async () => {
    try {
      const firm = await Firm.findById(req.firmId);
      const clientEmail = doc.clientId?.email;
      if (!clientEmail) return;

      const origin = process.env.FRONTEND_URL || "http://localhost:5173";
      const downloadUrl = `${origin}/preview/${doc._id}`;

      await sendCustomEmail(
        "Your Document is Ready to Download",
        clientEmail,
        process.env.DEFAULT_FROM_EMAIL || "noreply@lawmaster.com",
        null,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #10b981; padding: 24px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Payment Confirmed!</h1>
          </div>
          <div style="background: #f9fafb; padding: 28px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #374151;">Dear ${doc.clientId?.firstName || "Valued Client"},</p>
            <p style="color: #374151;">Your payment of <strong>₦${(doc.protectedDocument.balanceAmount || 0).toLocaleString()}</strong> for <strong>${doc.documentName}</strong> has been confirmed.</p>
            <p style="color: #374151;">You can now download the clean document using the link below:</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${downloadUrl}" style="background: #10b981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Download Your Document
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Or copy this link: ${downloadUrl}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px;">Thank you for using ${firm?.name || "LawMaster"}.</p>
          </div>
        </div>
        `,
      );
    } catch (err) {
      console.warn("Payment confirmation email failed:", err.message);
    }
  };
  notifyClient();

  res.status(200).json({
    status: "success",
    message: "Payment confirmed. Client can now download the document.",
    data: formatDoc(doc),
  });
});

// ─── Revoke payment confirmation ───────────────────────────────────────────

exports.revokePayment = catchAsync(async (req, res, next) => {
  const doc = await ProtectedDocument.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!doc) return next(new AppError("Document not found", 404));
  if (!doc.protectedDocument)
    return next(new AppError("No protected document on record", 404));

  if (!doc.protectedDocument.isBalancePaid) {
    return next(
      new AppError("Payment has not been confirmed for this document", 400),
    );
  }

  doc.protectedDocument.isBalancePaid = false;
  doc.protectedDocument.balancePaidAt = null;
  doc.protectedDocument.balancePaidConfirmedBy = null;
  doc.protectedDocument.paymentMethod = null;
  doc.protectedDocument.paymentReference = null;
  doc.protectedDocument.revokedAt = new Date();
  doc.protectedDocument.revokedBy = req.user._id;

  await doc.save();
  await doc.populate("clientId", "firstName lastName email");

  res.status(200).json({
    status: "success",
    message: "Payment confirmation revoked. Document is locked again.",
    data: formatDoc(doc),
  });
});

// ─── Stats ─────────────────────────────────────────────────────────────────

exports.getFeeProtectorStats = catchAsync(async (req, res, next) => {
  const [result] = await ProtectedDocument.aggregate([
    { $match: { firmId: req.firmId, isDeleted: { $ne: true } } },
    {
      $group: {
        _id: null,
        totalProtected: { $sum: 1 },
        totalPaid: {
          $sum: { $cond: ["$protectedDocument.isBalancePaid", 1, 0] },
        },
        totalUnpaid: {
          $sum: { $cond: ["$protectedDocument.isBalancePaid", 0, 1] },
        },
        totalAmount: { $sum: "$protectedDocument.balanceAmount" },
        paidAmount: {
          $sum: {
            $cond: [
              "$protectedDocument.isBalancePaid",
              "$protectedDocument.balanceAmount",
              0,
            ],
          },
        },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: result || {
      totalProtected: 0,
      totalPaid: 0,
      totalUnpaid: 0,
      totalAmount: 0,
      paidAmount: 0,
    },
  });
});

// ─── Public: document info (no auth) ──────────────────────────────────────
// Used by the public preview page to show document details

exports.getPublicDocumentInfo = catchAsync(async (req, res, next) => {
  const doc = await ProtectedDocument.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  })
    .select("documentName clientId protectedDocument createdAt")
    .populate("clientId", "firstName lastName");

  if (!doc) return next(new AppError("Document not found", 404));

  res.status(200).json({
    status: "success",
    data: {
      _id: doc._id,
      name: doc.documentName,
      protectedDocument: {
        balanceAmount: doc.protectedDocument?.balanceAmount,
        isBalancePaid: doc.protectedDocument?.isBalancePaid,
        balancePaidAt: doc.protectedDocument?.balancePaidAt,
        mimeType: doc.protectedDocument?.mimeType,
        originalMimeType: doc.protectedDocument?.originalMimeType,
        watermarkedMimeType: doc.protectedDocument?.watermarkedFileUrl
          ? getMimeType(
              resolveFilePath(doc.protectedDocument.watermarkedFileUrl),
            )
          : doc.protectedDocument?.mimeType,
        originalFilename: doc.protectedDocument?.originalFilename,
        uploadedAt: doc.protectedDocument?.uploadedAt,
      },
      createdAt: doc.createdAt,
    },
  });
});

// ─── Public: preview (watermarked, no auth) ────────────────────────────────
// Always serves the watermarked file regardless of payment status

exports.previewProtectedDocument = catchAsync(async (req, res, next) => {
  const doc = await ProtectedDocument.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  });

  if (!doc?.protectedDocument)
    return next(new AppError("Document not found", 404));

  // Always serve watermarked version for public preview.
  // resolveActualPath handles the case where generatePdfWatermark saved a .png
  // instead of a .pdf (it returns the actual path it wrote to).
  const storedUrl =
    doc.protectedDocument.watermarkedFileUrl ||
    doc.protectedDocument.originalFileUrl;
  const storedPath = resolveFilePath(storedUrl);
  const actualPath = await resolveActualPath(storedPath);

  try {
    await fs.access(actualPath);
  } catch {
    return next(new AppError("Preview file not found on server", 404));
  }

  // Use mime type from the actual file on disk, not what was originally uploaded
  const mimeType = getMimeType(actualPath);
  const filename = path.basename(actualPath);

  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.sendFile(actualPath);
});

// ─── Public: download (no auth, but payment must be confirmed) ─────────────
// Client uses this link — it works only after isBalancePaid = true

exports.downloadProtectedDocument = catchAsync(async (req, res, next) => {
  const doc = await ProtectedDocument.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  });

  if (!doc?.protectedDocument)
    return next(new AppError("Document not found", 404));

  // Gate: must be paid
  if (!doc.protectedDocument.isBalancePaid) {
    return next(
      new AppError(
        "Payment confirmation required before this document can be downloaded.",
        403,
      ),
    );
  }

  const filePath = resolveFilePath(doc.protectedDocument.originalFileUrl);
  const filename = doc.protectedDocument.originalFilename || doc.documentName;

  try {
    await fs.access(filePath);
  } catch {
    return next(new AppError("File not found on server", 404));
  }

  // Log the download access
  doc.protectedDocument.accessLog = doc.protectedDocument.accessLog || [];
  doc.protectedDocument.accessLog.push({
    accessedAt: new Date(),
    ipAddress: req.ip || req.connection?.remoteAddress,
    wasGranted: true,
    attemptType: "public-download",
  });
  doc.save({ validateBeforeSave: false }).catch(() => {});

  res.setHeader("Content-Type", getMimeType(filePath));
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(filePath);
});

// ─── Admin: download (requires auth, always works) ─────────────────────────

exports.adminDownloadDocument = catchAsync(async (req, res, next) => {
  const doc = await ProtectedDocument.findOne({
    _id: req.params.id,
    firmId: req.firmId,
    isDeleted: { $ne: true },
  });

  if (!doc?.protectedDocument)
    return next(new AppError("Document not found", 404));

  const filePath = resolveFilePath(doc.protectedDocument.originalFileUrl);
  const filename = doc.protectedDocument.originalFilename || doc.documentName;

  try {
    await fs.access(filePath);
  } catch {
    return next(new AppError("File not found on server", 404));
  }

  res.setHeader("Content-Type", getMimeType(filePath));
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(filePath);
});
