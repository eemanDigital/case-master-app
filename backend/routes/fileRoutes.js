const express = require("express");
const {
  createFile,
  getFiles,
  downloadFile,
  getFile,
  updateFile,
  deleteFile,
  getFileStats,
  bulkDeleteFiles,
} = require("../controllers/fileController");
const { protect } = require("../controllers/authController");
const {
  uploadToCloudinary,
  multerFileUploader,
} = require("../utils/multerFileUploader");

const router = express.Router();

// ============================================
// PUBLIC ROUTES (if any - currently none)
// ============================================

// ============================================
// PROTECTED ROUTES (All routes require authentication)
// ============================================
router.use(protect);

// ============================================
// STATISTICS & ANALYTICS
// ============================================

/**
 * @route   GET /api/v1/documents/stats
 * @desc    Get file statistics for authenticated user (total files, size, categories)
 * @access  Private
 * @returns {Object} Statistics including totalFiles, totalSize, categories breakdown
 */
router.get("/stats", getFileStats);

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * @route   DELETE /api/v1/documents/bulk
 * @desc    Delete multiple files at once
 * @access  Private
 * @body    { fileIds: ["id1", "id2", "id3"] }
 * @returns {Object} Deleted count and status
 */
router.delete("/bulk", bulkDeleteFiles);

// ============================================
// MAIN FILE CRUD OPERATIONS
// ============================================

/**
 * @route   GET /api/v1/documents
 * @desc    Get all documents for authenticated user with pagination and filtering
 * @access  Private
 * @query   page, limit, sort, category, fileType, search
 * @example GET /api/v1/documents?page=1&limit=10&category=legal&search=contract
 */
router.get("/", getFiles);

/**
 * @route   POST /api/v1/documents
 * @desc    Upload a new document to Cloudinary and create database record
 * @access  Private
 * @body    fileName, description, category
 * @file    file (required - multipart/form-data)
 * @returns {Object} Created file document
 *
 * File Upload Configuration:
 * - Max size: 10MB (configurable in multerFileUploader)
 * - Allowed types: JPEG, PNG, PDF, DOC, DOCX, TXT, XLSX, XLS, CSV
 * - Files are automatically organized in Cloudinary by type
 */
router.post(
  "/",
  multerFileUploader("file", {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: /jpeg|jpg|png|doc|docx|pdf|txt|xlsx|xls|csv/,
  }),
  uploadToCloudinary,
  createFile
);

// ============================================
// INDIVIDUAL FILE OPERATIONS
// ============================================

/**
 * @route   GET /api/v1/documents/:id
 * @desc    Get single document by ID with ownership verification
 * @access  Private
 * @param   id - Document ID
 * @returns {Object} File document details
 */
router.get("/:id", getFile);

/**
 * @route   GET /api/v1/documents/:id/download
 * @desc    Get document download URL (also tracks download count)
 * @access  Private
 * @param   id - Document ID
 * @returns {Object} File URL, fileName, and publicId for download
 */
router.get("/:id/download", downloadFile);

/**
 * @route   PATCH /api/v1/documents/:id
 * @desc    Update document metadata and/or replace file
 * @access  Private
 * @param   id - Document ID
 * @body    fileName, description, category
 * @file    file (optional - if provided, replaces existing file)
 * @returns {Object} Updated file document
 *
 * Note: If new file is uploaded, old file is automatically deleted from Cloudinary
 */
router.patch(
  "/:id",
  multerFileUploader("file", {
    maxSize: 10 * 1024 * 1024,
    allowedTypes: /jpeg|jpg|png|doc|docx|pdf|txt|xlsx|xls|csv/,
  }),
  uploadToCloudinary,
  updateFile
);

/**
 * @route   DELETE /api/v1/documents/:id
 * @desc    Delete document from both database and Cloudinary with ownership verification
 * @access  Private
 * @param   id - Document ID
 * @returns {null} 204 No Content on success
 *
 * Note: File is permanently deleted from Cloudinary storage
 */
router.delete("/:id", deleteFile);

// ============================================
// LEGACY/DEPRECATED ROUTES (if maintaining backward compatibility)
// ============================================

/**
 * @route   GET /api/v1/documents/file/:id
 * @desc    Get single file (legacy route - use /:id instead)
 * @access  Private
 * @deprecated Use GET /api/v1/documents/:id instead
 */
// router.get("/file/:id", getFile); // Uncomment if needed for backward compatibility

// ============================================
// ERROR HANDLING
// ============================================
// Note: Global error handler in app.js catches all route errors

module.exports = router;
