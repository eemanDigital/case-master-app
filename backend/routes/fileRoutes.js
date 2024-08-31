const express = require("express");
const {
  createFile,
  getFiles,
  downloadFile,
  getFile,
  updateFile,
  deleteFile,
} = require("../controllers/fileController");
const { protect } = require("../controllers/authController");
const {
  uploadToCloudinary,
  multerFileUploader,
} = require("../utils/multerFileUploader");
const File = require("../models/fileModel");
const { downloadDocument } = require("../controllers/factory");

const router = express.Router();

// Protect all routes
router.use(protect);

// File routes
router.get("/", getFiles);
router.get("/file/:id", getFile);
router.get("/:id/download", downloadFile);

router.post("/", multerFileUploader("file"), uploadToCloudinary, createFile);

router.patch(
  "/:id",
  multerFileUploader("file"),
  uploadToCloudinary,
  updateFile
);

router.delete("/:id", deleteFile);

module.exports = router;
