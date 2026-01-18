const path = require("path");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { deleteFromCloudinary } = require("../utils/multerFileUploader");

/**
 * ✅ Download document handler with multi-tenancy
 */
exports.downloadDocument = (model) => {
  return catchAsync(async (req, res, next) => {
    const { parentId, documentId } = req.params;

    console.log("Downloading document:", {
      parentId,
      documentId,
      firmId: req.firmId,
    });

    // ✅ Fetch the parent document with firmId filter
    const docData = await model.findOne({ _id: parentId, firmId: req.firmId });

    if (!docData) {
      return next(new AppError(`No document found with ID: ${parentId}`, 404));
    }

    // Fetch the specific document
    const document = docData.documents.id(documentId);
    if (!document) {
      return next(
        new AppError(`No document found with ID: ${documentId}`, 404)
      );
    }

    const fileUrl = document.file;
    const fileName = document.fileName;

    // Return file information
    if (fileUrl.includes("cloudinary.com")) {
      // Add Cloudinary download parameters
      const downloadUrl = `${fileUrl}?fl_attachment`;

      res.status(200).json({
        status: "success",
        data: {
          fileUrl: downloadUrl,
          fileName: fileName,
          mimeType: document.mimeType,
          originalName: fileName,
          fileSize: document.fileSize,
        },
      });
    } else {
      // For non-Cloudinary files
      res.status(200).json({
        status: "success",
        data: {
          fileUrl: fileUrl,
          fileName: fileName,
          mimeType: document.mimeType,
          fileSize: document.fileSize,
        },
      });
    }
  });
};

/**
 * ✅ Create document handler with multi-tenancy
 */
exports.createDocument = (model) => {
  return catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { fileName } = req.body;
    const { file } = req;

    // ✅ Validate firmId
    if (!req.firmId) {
      return next(new AppError("Invalid request. firmId is required.", 400));
    }

    if (!file) {
      return next(new AppError("Please provide a document file", 400));
    }

    if (!fileName || fileName.trim() === "") {
      return next(
        new AppError("A file name is required for each document", 400)
      );
    }

    // Use Cloudinary URL
    const filePath = req.file.cloudinaryUrl;

    if (!filePath) {
      return next(new AppError("Error uploading file to Cloudinary", 500));
    }

    // ✅ Verify parent document belongs to firm
    const parentDoc = await model.findOne({ _id: id, firmId: req.firmId });
    if (!parentDoc) {
      return next(new AppError(`No document found with ID: ${id}`, 404));
    }

    // ✅ Create document object with all necessary fields
    const document = {
      fileName: fileName.trim(),
      file: filePath,
      cloudinaryPublicId: req.file.cloudinaryPublicId,
      resourceType: req.file.cloudinaryResourceType || "raw",
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    };

    // ✅ Update with firmId verification
    const updatedDoc = await model.findOneAndUpdate(
      { _id: id, firmId: req.firmId },
      { $push: { documents: document } },
      { new: true, runValidators: true }
    );

    if (!updatedDoc) {
      return next(new AppError(`Failed to update document`, 500));
    }

    res.status(200).json({
      status: "success",
      data: updatedDoc,
    });
  });
};

/**
 * ✅ General delete handler with multi-tenancy
 */
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // ✅ Add firmId filter
    const doc = await Model.findOneAndDelete({
      _id: req.params.id,
      firmId: req.firmId,
    });

    if (!doc) {
      return next(new AppError(`No document found with that ID`, 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

/**
 * ✅ Delete document/file handler with Cloudinary cleanup and multi-tenancy
 */
exports.deleteDocument = (model) => {
  return catchAsync(async (req, res, next) => {
    const { parentId, documentId } = req.params;

    // ✅ Fetch the parent document with firmId filter
    const docData = await model.findOne({ _id: parentId, firmId: req.firmId });

    if (!docData) {
      return next(new AppError("No document found with that ID", 404));
    }

    // ✅ Find the specific document to delete
    const document = docData.documents.id(documentId);

    if (!document) {
      return next(new AppError("No document found with that ID", 404));
    }

    // ✅ Delete from Cloudinary BEFORE removing from DB
    if (document.cloudinaryPublicId) {
      try {
        console.log(
          `🗑️ Deleting from Cloudinary: ${document.cloudinaryPublicId}`
        );

        const result = await deleteFromCloudinary(
          document.cloudinaryPublicId,
          document.resourceType || "raw"
        );

        if (result && result.result === "ok") {
          console.log(
            `✅ Successfully deleted from Cloudinary: ${document.cloudinaryPublicId}`
          );
        } else {
          console.warn(
            `⚠️ Cloudinary deletion returned: ${result?.result || "unknown"}`
          );
        }
      } catch (cloudinaryError) {
        console.error(
          "❌ Failed to delete from Cloudinary:",
          cloudinaryError.message
        );
        // Continue with DB deletion even if Cloudinary fails
        // Log this for manual cleanup later
      }
    } else {
      console.warn("⚠️ No Cloudinary public_id found for document");
    }

    // ✅ Remove from database with firmId verification
    const updatedDocData = await model.findOneAndUpdate(
      { _id: parentId, firmId: req.firmId },
      { $pull: { documents: { _id: documentId } } },
      { new: true }
    );

    if (!updatedDocData) {
      return next(new AppError("Failed to update document", 500));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });
};

/**
 * ✅ Aggregation handler for group with multi-tenancy
 */
exports.getCasesByGroup = (field, model) =>
  catchAsync(async (req, res, next) => {
    // ✅ Add firmId to aggregation pipeline
    const results = await model.aggregate([
      {
        $match: {
          firmId: req.firmId, // ✅ Filter by firmId first
        },
      },
      {
        $group: {
          _id: field,
          count: { $sum: 1 },
          parties: {
            $push: {
              $concat: [
                { $arrayElemAt: ["$firstParty.name.name", 0] },
                " vs ",
                { $arrayElemAt: ["$secondParty.name.name", 0] },
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          groupName: "$_id",
          parties: 1,
          count: 1,
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      fromCache: false,
      data: results,
    });
  });

/**
 * ✅ Direct download handler with multi-tenancy
 */
exports.directDownloadDocument = (model) => {
  return catchAsync(async (req, res, next) => {
    const { parentId, documentId } = req.params;

    console.log("Direct downloading document:", {
      parentId,
      documentId,
      firmId: req.firmId,
    });

    // ✅ Fetch the parent document with firmId filter
    const docData = await model.findOne({ _id: parentId, firmId: req.firmId });

    if (!docData) {
      return next(new AppError(`No document found with ID: ${parentId}`, 404));
    }

    // Fetch the specific document
    const document = docData.documents.id(documentId);
    if (!document) {
      return next(
        new AppError(`No document found with ID: ${documentId}`, 404)
      );
    }

    const fileUrl = document.file;
    const fileName = document.fileName;

    // Check if client wants direct download
    const directDownload = req.query.direct === "true";

    if (directDownload) {
      // DIRECT DOWNLOAD: Redirect to Cloudinary with download parameters
      if (fileUrl.includes("cloudinary.com")) {
        let downloadUrl = fileUrl;

        if (!downloadUrl.includes("fl_attachment")) {
          // Insert download transformation into Cloudinary URL
          if (downloadUrl.includes("/upload/")) {
            downloadUrl = downloadUrl.replace(
              "/upload/",
              "/upload/fl_attachment/"
            );
          } else {
            downloadUrl += "?fl_attachment";
          }
        }

        console.log("Redirecting to:", downloadUrl);
        return res.redirect(downloadUrl);
      } else {
        // For non-Cloudinary files, set download headers
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileName}"`
        );
        return res.redirect(fileUrl);
      }
    } else {
      // API RESPONSE: Return file information as JSON
      let enhancedUrl = fileUrl;

      if (
        fileUrl.includes("cloudinary.com") &&
        !enhancedUrl.includes("fl_attachment")
      ) {
        enhancedUrl +=
          (enhancedUrl.includes("?") ? "&" : "?") + "fl_attachment";
      }

      res.status(200).json({
        status: "success",
        data: {
          fileUrl: enhancedUrl,
          fileName: fileName,
          mimeType: document.mimeType,
          fileSize: document.fileSize,
          uploadedAt: document.uploadedAt,
          directDownloadUrl: `${req.originalUrl}?direct=true`,
        },
      });
    }
  });
};

/**
 * ✅ NEW: Get all documents for an entity with multi-tenancy
 */
exports.getDocuments = (model) => {
  return catchAsync(async (req, res, next) => {
    const { parentId } = req.params;

    // ✅ Fetch with firmId filter
    const docData = await model
      .findOne({ _id: parentId, firmId: req.firmId })
      .populate("documents.uploadedBy", "firstName lastName email");

    if (!docData) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      results: docData.documents.length,
      data: {
        documents: docData.documents,
      },
    });
  });
};

/**
 * ✅ NEW: Update document metadata with multi-tenancy
 */
exports.updateDocument = (model) => {
  return catchAsync(async (req, res, next) => {
    const { parentId, documentId } = req.params;
    const { fileName, description } = req.body;

    // ✅ Fetch with firmId filter
    const docData = await model.findOne({ _id: parentId, firmId: req.firmId });

    if (!docData) {
      return next(new AppError("No document found with that ID", 404));
    }

    // Find the document
    const document = docData.documents.id(documentId);
    if (!document) {
      return next(new AppError("No document found with that ID", 404));
    }

    // Update fields
    if (fileName) document.fileName = fileName.trim();
    if (description !== undefined) document.description = description;
    document.updatedAt = new Date();

    await docData.save();

    res.status(200).json({
      status: "success",
      data: {
        document,
      },
    });
  });
};

/**
 * ✅ NEW: Bulk delete documents with multi-tenancy
 */
exports.bulkDeleteDocuments = (model) => {
  return catchAsync(async (req, res, next) => {
    const { parentId } = req.params;
    const { documentIds } = req.body;

    if (!documentIds || !Array.isArray(documentIds)) {
      return next(new AppError("Please provide an array of document IDs", 400));
    }

    // ✅ Fetch with firmId filter
    const docData = await model.findOne({ _id: parentId, firmId: req.firmId });

    if (!docData) {
      return next(new AppError("No document found with that ID", 404));
    }

    const deletedCount = 0;
    const errors = [];

    // Delete each document
    for (const docId of documentIds) {
      const document = docData.documents.id(docId);

      if (document) {
        // Delete from Cloudinary
        if (document.cloudinaryPublicId) {
          try {
            await deleteFromCloudinary(
              document.cloudinaryPublicId,
              document.resourceType || "raw"
            );
          } catch (err) {
            errors.push({ documentId: docId, error: err.message });
          }
        }

        // Remove from array
        docData.documents.pull(docId);
        deletedCount++;
      }
    }

    await docData.save();

    res.status(200).json({
      status: "success",
      data: {
        deletedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  });
};
