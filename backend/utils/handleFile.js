// const path = require("path");
// const multer = require("multer");

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/images");
//   },
//   filename: (req, file, cb) => {
//     // Generate a unique filename for the uploaded file
//     cb(
//       null,
//       file.fieldname + "_" + Date.now() + path.extname(file.originalname)
//     );
//   },
// });

// const upload = multer({
//   storage: multerStorage,
// });

// exports.uploadUserPhoto = upload.single("photo");

// const multerStorage = multer.memoryStorage();

// const multerFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image')) {
//     cb(null, true);
//   } else {
//     cb(new AppError('Not an image! Please upload only images.', 400), false);
//   }
// };

// const upload = multer({
//   storage: multerStorage,
//   fileFilter: multerFilter
// });

// exports.uploadTourImages = upload.fields([
//   { name: 'imageCover', maxCount: 1 },
//   { name: 'images', maxCount: 3 }
// ]);

// // upload.single('image') req.file
// // upload.array('images', 5) req.files

// exports.resizeTourImages = catchAsync(async (req, res, next) => {
//   if (!req.files.imageCover || !req.files.images) return next();

//   // 1) Cover image
//   req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
//   await sharp(req.files.imageCover[0].buffer)
//     .resize(2000, 1333)
//     .toFormat('jpeg')
//     .jpeg({ quality: 90 })
//     .toFile(`public/img/tours/${req.body.imageCover}`);

//   // 2) Images
//   req.body.images = [];

//   await Promise.all(
//     req.files.images.map(async (file, i) => {
//       const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

//       await sharp(file.buffer)
//         .resize(2000, 1333)
//         .toFormat('jpeg')
//         .jpeg({ quality: 90 })
//         .toFile(`public/img/tours/${filename}`);

//       req.body.images.push(filename);
//     })
//   );

//   next();
// });
const path = require("path");
const multer = require("multer");
const AppError = require("../utils/appError");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );

    // console.log(req.file);
  },
});

const fileFilter = (req, file, cb) => {
  // filter out file if not specified here
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "application/pdf" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // For .docx files
    file.mimetype === "text/plain" // For plain text files
  ) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Not a valid document! Please upload only valid document.",
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
});

// Middleware to handle file upload errors
const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer error occurred
    res.status(400).json({ error: "File upload error", message: err.message });
  } else if (err) {
    // Other non-Multer error occurred
    res
      .status(500)
      .json({ error: "Internal server error", message: err.message });
  } else {
    // No error occurred, proceed to the next middleware
    next();
  }
};

exports.uploadUserPhoto = (req, res, next) => {
  // Use the upload middleware to handle file upload
  upload.single("file")(req, res, (err) => {
    if (err) {
      // Pass the error to the error handling middleware
      uploadErrorHandler(err, req, res, next);
    } else {
      // No error occurred, proceed to the next middleware
      next();
    }
  });
};
