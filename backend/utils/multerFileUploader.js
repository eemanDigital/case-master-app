const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const crypto = require("crypto");

/**
 * Configure Cloudinary with timeout settings
 */
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET,
  secure: true,
  // ✅ Add timeout configuration
  timeout: 120000, // 120 seconds (2 minutes)
});

/**
 * Generates a unique, clean filename
 */
const generateCleanFilename = (originalname) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(6).toString("hex");
  const cleanName = originalname
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();

  const ext = path.extname(cleanName);
  const nameWithoutExt = path.basename(cleanName, ext);

  return `${timestamp}_${randomString}_${nameWithoutExt}`;
};

/**
 * Configure multer for file upload with validation
 */
exports.multerFileUploader = (fieldName, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = /jpeg|jpg|png|doc|docx|pdf|txt|xlsx|xls|csv/,
  } = options;

  const multerStorage = multer.memoryStorage();

  const multerFilter = (req, file, cb) => {
    const mimetype = allowedTypes.test(file.mimetype.toLowerCase());
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }

    const allowedExtensions = allowedTypes.source
      .replace(/[|/\\]/g, ", ")
      .toUpperCase();

    cb(
      new Error(
        `Invalid file type. Only ${allowedExtensions} files are allowed.`
      ),
      false
    );
  };

  const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: {
      fileSize: maxSize,
    },
  });

  return upload.single(fieldName);
};

/**
 * Helper: Determine Cloudinary folder based on file type
 */
const getCloudinaryFolder = (mimetype) => {
  if (mimetype.startsWith("image/")) return "documents/images";
  if (mimetype.includes("pdf")) return "documents/pdfs";
  if (
    mimetype.includes("word") ||
    mimetype.includes("document") ||
    mimetype.includes("msword")
  ) {
    return "documents/word";
  }
  if (
    mimetype.includes("sheet") ||
    mimetype.includes("excel") ||
    mimetype.includes("csv")
  ) {
    return "documents/spreadsheets";
  }
  if (mimetype.includes("text")) return "documents/text";

  return "documents/others";
};

/**
 * Helper: Determine Cloudinary resource type
 */
const getResourceType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  return "raw";
};

/**
 * ✅ IMPROVED: Upload to Cloudinary with timeout and retry logic
 */
const uploadToCloudinaryStream = (
  buffer,
  filename,
  folder,
  resourceType,
  retryCount = 0
) => {
  const MAX_RETRIES = 2;
  const UPLOAD_TIMEOUT = 90000; // 90 seconds

  return new Promise((resolve, reject) => {
    let timeoutId;
    let streamEnded = false;

    const uploadOptions = {
      resource_type: resourceType,
      folder: folder,
      public_id: filename,
      overwrite: false,
      unique_filename: true,
      use_filename: true,
      timeout: UPLOAD_TIMEOUT,
    };

    // Create timeout handler
    timeoutId = setTimeout(() => {
      if (!streamEnded) {
        streamEnded = true;
        const error = new Error("Upload timeout exceeded");
        error.name = "TimeoutError";
        error.http_code = 408;

        console.error(
          `⏱️ Cloudinary upload timeout (attempt ${retryCount + 1}/${
            MAX_RETRIES + 1
          })`
        );

        // Retry if we haven't exceeded max retries
        if (retryCount < MAX_RETRIES) {
          console.log(
            `🔄 Retrying upload (attempt ${retryCount + 2}/${
              MAX_RETRIES + 1
            })...`
          );
          resolve(
            uploadToCloudinaryStream(
              buffer,
              filename,
              folder,
              resourceType,
              retryCount + 1
            )
          );
        } else {
          reject(error);
        }
      }
    }, UPLOAD_TIMEOUT);

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        clearTimeout(timeoutId);

        if (streamEnded) return; // Already handled by timeout
        streamEnded = true;

        if (error) {
          console.error(`❌ Cloudinary upload error:`, error);

          // Handle specific error types
          if (error.http_code === 499 || error.name === "TimeoutError") {
            error.message = "Upload timeout. Please try with a smaller file.";
          }

          // Retry on timeout or network errors
          if (
            (error.http_code === 499 ||
              error.name === "TimeoutError" ||
              error.message?.includes("timeout")) &&
            retryCount < MAX_RETRIES
          ) {
            console.log(
              `🔄 Retrying upload due to ${error.name} (attempt ${
                retryCount + 2
              }/${MAX_RETRIES + 1})...`
            );
            return resolve(
              uploadToCloudinaryStream(
                buffer,
                filename,
                folder,
                resourceType,
                retryCount + 1
              )
            );
          }

          return reject(error);
        }

        resolve(result);
      }
    );

    // Handle stream errors
    stream.on("error", (error) => {
      clearTimeout(timeoutId);
      if (!streamEnded) {
        streamEnded = true;
        console.error("Stream error:", error);
        reject(error);
      }
    });

    // Pipe the buffer to Cloudinary
    try {
      streamifier.createReadStream(buffer).pipe(stream);
    } catch (pipeError) {
      clearTimeout(timeoutId);
      streamEnded = true;
      console.error("Pipe error:", pipeError);
      reject(pipeError);
    }
  });
};

/**
 * ✅ IMPROVED: Enhanced Cloudinary upload middleware with better error handling
 */
exports.uploadToCloudinary = async (req, res, next) => {
  if (!req.file) return next();

  try {
    console.log(
      `📤 Starting upload: ${req.file.originalname} (${(
        req.file.size /
        1024 /
        1024
      ).toFixed(2)} MB)`
    );

    const cleanFilename = generateCleanFilename(req.file.originalname);
    const folder = getCloudinaryFolder(req.file.mimetype);
    const resourceType = getResourceType(req.file.mimetype);

    // Upload with timeout handling and retry
    const result = await uploadToCloudinaryStream(
      req.file.buffer,
      cleanFilename,
      folder,
      resourceType
    );

    console.log("✅ Cloudinary upload successful:", {
      original_name: req.file.originalname,
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      size: result.bytes,
    });

    // Attach Cloudinary data to request
    req.file.cloudinaryUrl = result.secure_url;
    req.file.cloudinaryPublicId = result.public_id;
    req.file.cloudinaryFolder = folder;
    req.file.cloudinaryFormat = result.format;
    req.file.cloudinaryResourceType = result.resource_type;
    req.file.cleanFilename = cleanFilename;

    next();
  } catch (error) {
    console.error("❌ Cloudinary upload failed:", error.message);

    // Create user-friendly error message
    let userMessage = "File upload failed. Please try again.";

    if (
      error.name === "TimeoutError" ||
      error.http_code === 408 ||
      error.http_code === 499
    ) {
      userMessage =
        "Upload timeout. Please try with a smaller file or check your internet connection.";
    } else if (error.message?.includes("File size")) {
      userMessage = error.message;
    } else if (error.message?.includes("Invalid file type")) {
      userMessage = error.message;
    }

    // Create error object
    const uploadError = new Error(userMessage);
    uploadError.statusCode = 408;
    uploadError.name = "UploadError";
    uploadError.isOperational = true;

    // Pass error to Express error handler (don't crash the server)
    next(uploadError);
  }
};

/**
 * Delete file from Cloudinary with error handling
 */
exports.deleteFromCloudinary = async (publicId, resourceType = "raw") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
      timeout: 30000, // 30 second timeout for deletion
    });

    console.log("✅ Cloudinary deletion successful:", {
      public_id: publicId,
      result: result.result,
    });

    return result;
  } catch (error) {
    console.error("❌ Cloudinary deletion failed:", {
      public_id: publicId,
      error: error.message,
    });

    // Don't throw - just log and continue
    // This prevents deletion failures from crashing the app
    return { result: "error", error: error.message };
  }
};

/**
 * Multiple files uploader with timeout handling
 */
exports.multerMultipleFileUploader = (
  fieldName,
  maxCount = 5,
  options = {}
) => {
  const {
    maxSize = 10 * 1024 * 1024,
    allowedTypes = /jpeg|jpg|png|doc|docx|pdf|txt|xlsx|xls|csv/,
  } = options;

  const multerStorage = multer.memoryStorage();

  const multerFilter = (req, file, cb) => {
    const mimetype = allowedTypes.test(file.mimetype.toLowerCase());
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(
      new Error(
        "Invalid file type. Only allowed document types are permitted."
      ),
      false
    );
  };

  const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: {
      fileSize: maxSize,
      files: maxCount,
    },
  });

  return upload.array(fieldName, maxCount);
};

/**
 * Upload multiple files to Cloudinary with error handling
 */
exports.uploadMultipleToCloudinary = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    const uploadPromises = req.files.map(async (file) => {
      const cleanFilename = generateCleanFilename(file.originalname);
      const folder = getCloudinaryFolder(file.mimetype);
      const resourceType = getResourceType(file.mimetype);

      try {
        const result = await uploadToCloudinaryStream(
          file.buffer,
          cleanFilename,
          folder,
          resourceType
        );

        return {
          success: true,
          originalName: file.originalname,
          cloudinaryUrl: result.secure_url,
          cloudinaryPublicId: result.public_id,
          cloudinaryFolder: folder,
          size: result.bytes,
          format: result.format,
          resourceType: result.resource_type,
        };
      } catch (error) {
        console.error(`Failed to upload ${file.originalname}:`, error.message);
        return {
          success: false,
          originalName: file.originalname,
          error: error.message,
        };
      }
    });

    const results = await Promise.all(uploadPromises);

    // Separate successful and failed uploads
    req.uploadedFiles = results.filter((r) => r.success);
    req.failedUploads = results.filter((r) => !r.success);

    console.log(
      `✅ Uploaded ${req.uploadedFiles.length}/${results.length} files to Cloudinary`
    );

    if (req.failedUploads.length > 0) {
      console.warn(`⚠️ ${req.failedUploads.length} files failed to upload`);
    }

    next();
  } catch (error) {
    console.error("❌ Multiple files upload failed:", error);
    next(new Error(`Multiple files upload failed: ${error.message}`));
  }
};
