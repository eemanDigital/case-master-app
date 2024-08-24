const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Function to configure multer for file upload
exports.multerFileUploader = (multerFileName) => {
  // Store files in memory
  const multerStorage = multer.memoryStorage();

  // Filter to validate file types
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
        new Error(
          "Invalid file type. Only JPEG, PNG, DOC, DOCX, PDF, TXT files are allowed."
        ),
        false
      );
    }
  };

  // Configure multer with storage and file filter
  const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
  });

  // Return a middleware function to handle single file upload
  return upload.single(multerFileName);
};

// Middleware to upload file to Cloudinary
exports.uploadToCloudinary = (req, res, next) => {
  if (!req.file) return next();

  // Function to upload file buffer to Cloudinary
  const uploadStream = (buffer) => {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          public_id: path.parse(req.file.originalname).name, // Use original filename without extension
          format: path.extname(req.file.originalname).slice(1), // Explicitly set the format
        },
        (error, result) => {
          if (error) {
            return reject(new Error("Error uploading file to Cloudinary"));
          }
          resolve(result);
        }
      );

      // Pipe the buffer stream to Cloudinary
      streamifier.createReadStream(buffer).pipe(stream);
    });
  };

  // Upload the file buffer and attach Cloudinary URL and public ID to the request
  uploadStream(req.file.buffer)
    .then((result) => {
      req.file.cloudinaryUrl = result.secure_url;
      req.file.cloudinaryPublicId = result.public_id;
      next();
    })
    .catch((error) => {
      next(error);
    });
};
