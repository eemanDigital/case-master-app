const multer = require("multer");
const path = require("path");

// Multer configuration

exports.multerFileUploader = (directory, multerFileName) => {
  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, directory); // replace with your destination path
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `case-${req.user.id}-${Date.now()}${ext}`);
    },
  });

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
