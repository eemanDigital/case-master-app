const path = require("path");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const { deleteFromCloudinary } = require("../utils/multerFileUploader"); // ✅ Import deletion function

// document download handler
exports.downloadDocument = (model) => {
  return catchAsync(async (req, res, next) => {
    const { parentId, documentId } = req.params;

    console.log("Downloading document:", { parentId, documentId });

    // Fetch the parent document
    const docData = await model.findById(parentId);
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

    // ✅ FIXED: Instead of returning JSON, redirect to Cloudinary with download parameters
    if (fileUrl.includes("cloudinary.com")) {
      // Add Cloudinary download parameters
      const downloadUrl = `${fileUrl}?fl_attachment`;

      res.status(200).json({
        message: "success",
        data: {
          fileUrl: downloadUrl,
          fileName: fileName,
          // ✅ Include file extension information
          mimeType: document.mimeType,
          originalName: fileName,
        },
      });
    } else {
      // For non-Cloudinary files
      res.status(200).json({
        message: "success",
        data: {
          fileUrl: fileUrl,
          fileName: fileName,
          mimeType: document.mimeType,
        },
      });
    }
  });
};

// ✅ FIXED: document upload handler
exports.createDocument = (model) => {
  return catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { fileName } = req.body;
    const { file } = req;

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

    // ✅ FIXED: Store both URL and public_id for deletion
    const document = {
      fileName: fileName.trim(),
      file: filePath,
      cloudinaryPublicId: req.file.cloudinaryPublicId, // ✅ Add this
      resourceType: req.file.cloudinaryResourceType, // ✅ Add this
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    };

    const updatedDoc = await model.findByIdAndUpdate(
      id,
      { $push: { documents: document } },
      { new: true, runValidators: true }
    );

    if (!updatedDoc) {
      return next(new AppError(`No document found with ID: ${id}`, 404));
    }

    res.status(200).json({
      message: "success",
      updatedDoc,
    });
  });
};

// for documents alone
// general delete handler
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`No document found with that ID`, 404));
    }
    res.status(204).json({
      status: "success",
      data: null,
    });
  });

// ✅ FIXED: delete document/file handler with Cloudinary cleanup
exports.deleteDocument = (model) => {
  return catchAsync(async (req, res, next) => {
    const { parentId, documentId } = req.params;

    // ✅ First, fetch the parent document to get Cloudinary info
    const docData = await model.findById(parentId);

    if (!docData) {
      return next(new AppError("No parent document found with that ID", 404));
    }

    // ✅ Find the specific document to delete
    const document = docData.documents.id(documentId);

    if (!document) {
      return next(new AppError("No document found with that ID", 404));
    }

    // ✅ Delete from Cloudinary BEFORE removing from DB
    if (document.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(
          document.cloudinaryPublicId,
          document.resourceType || "raw"
        );
        console.log(
          `✅ Deleted file from Cloudinary: ${document.cloudinaryPublicId}`
        );
      } catch (cloudinaryError) {
        console.error(
          "⚠️ Failed to delete from Cloudinary:",
          cloudinaryError.message
        );
        // Continue with DB deletion even if Cloudinary fails
        // You might want to log this for cleanup later
      }
    } else {
      console.warn("⚠️ No Cloudinary public_id found for document");
    }

    // ✅ Now remove from database
    const updatedDocData = await model.findByIdAndUpdate(
      parentId,
      {
        $pull: { documents: { _id: documentId } },
      },
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

//aggregation handler for group
exports.getCasesByGroup = (field, model) =>
  catchAsync(async (req, res, next) => {
    const results = await model.aggregate([
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
      message: "success",
      fromCache: false,
      data: results,
    });
  });

// alternative download handler for documents
exports.directDownloadDocument = (model) => {
  return catchAsync(async (req, res, next) => {
    const { parentId, documentId } = req.params;

    console.log("Downloading document:", { parentId, documentId });

    // Fetch the parent document
    const docData = await model.findById(parentId);
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

    // ✅ Check if client wants direct download (via query parameter or header)
    const directDownload = req.query.direct === "true";

    if (directDownload) {
      // ✅ DIRECT DOWNLOAD: Redirect to Cloudinary with download parameters
      if (fileUrl.includes("cloudinary.com")) {
        // Add Cloudinary download parameters for forced download
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
      // ✅ API RESPONSE: Return file information as JSON
      let enhancedUrl = fileUrl;

      if (
        fileUrl.includes("cloudinary.com") &&
        !fileUrl.includes("fl_attachment")
      ) {
        enhancedUrl +=
          (enhancedUrl.includes("?") ? "&" : "?") + "fl_attachment";
      }

      res.status(200).json({
        message: "success",
        data: {
          fileUrl: enhancedUrl,
          fileName: fileName,
          mimeType: document.mimeType,
          directDownloadUrl: `${req.originalUrl}?direct=true`, // Provide direct download URL
        },
      });
    }
  });
};
