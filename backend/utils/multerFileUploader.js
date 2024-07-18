const multer = require("multer");
const path = require("path");
const cloudinary = require("./cloudinary");
const AppError = require("../utils/appError");
const streamifier = require("streamifier");

exports.multerFileUploader = (multerFileName) => {
  const multerStorage = multer.memoryStorage();

  const multerFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|doc|docx|pdf|txt/;
    const mimetype = filetypes.test(file.mimetype.toLowerCase());
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new AppError(
          "Invalid file type. Only JPEG, PNG, DOC, DOCX, PDF, TXT files are allowed.",
          400
        ),
        false
      );
    }
  };

  const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
  });

  return upload.single(multerFileName);
};

// Middleware to upload file to Cloudinary
exports.uploadToCloudinary = (req, res, next) => {
  if (!req.file) return next();

  const uploadStream = (buffer) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "auto" },
        (error, result) => {
          if (error) {
            return reject(
              new AppError("Error uploading file to Cloudinary", 500)
            );
          }
          resolve(result);
        }
      );

      streamifier.createReadStream(buffer).pipe(stream);
    });
  };

  uploadStream(req.file.buffer)
    .then((result) => {
      req.file.cloudinaryUrl = result.secure_url;
      next();
    })
    .catch((error) => {
      next(error);
    });
};
