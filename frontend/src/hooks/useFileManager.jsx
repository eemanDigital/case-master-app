// hooks/useFileManager.js
import { useState, useEffect } from "react";
import axios from "axios";
import { notification } from "antd";

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";

/**
 * Universal File Manager Hook
 * Handles file listing, downloading, and deletion for any entity type
 * Supports both entity-based and general document management
 */
const useFileManager = (entityType = null, entityId = null, options = {}) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState(null);
  const [error, setError] = useState(null);

  const {
    autoFetch = true,
    enableNotifications = true,
    customEndpoint = null,
    fetchGeneralFiles = false, // New option for general files
  } = options;

  // Fetch files when entity changes
  useEffect(() => {
    if (autoFetch) {
      fetchFiles();
    }
  }, [entityType, entityId, autoFetch]);

  /**
   * Fetch files for the entity or general files
   */
  const fetchFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint;
      let response;

      if (fetchGeneralFiles || !entityType || !entityId) {
        // Fetch general documents (my-files)
        endpoint = customEndpoint || "files/my-files";
        response = await axios.get(`${baseURL}/${endpoint}`, {
          withCredentials: true,
        });
      } else {
        // Fetch entity-specific files
        endpoint = customEndpoint || `files/entity/${entityType}/${entityId}`;
        response = await axios.get(`${baseURL}/${endpoint}`, {
          withCredentials: true,
        });
      }

      const filesData = response.data?.data?.files || [];
      setFiles(filesData);

      if (enableNotifications && filesData.length > 0) {
        notification.success({
          message: "Files Loaded",
          description: `Found ${filesData.length} file(s)`,
        });
      }

      console.log(
        `✅ Loaded ${filesData.length} files${
          entityType && entityId
            ? ` for ${entityType}:${entityId}`
            : " (general documents)"
        }`
      );
    } catch (error) {
      console.error("❌ Error fetching files:", error);
      setError(error.response?.data?.message || "Failed to load files");

      if (enableNotifications) {
        notification.error({
          message: "Load Failed",
          description: "Failed to load files. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Download a file
   */
  const downloadFile = async (file) => {
    const fileId = file._id || file.id;
    if (!fileId) {
      console.error("❌ File ID required for download");
      return;
    }

    setOperationInProgress(`download-${fileId}`);

    try {
      // Get download URL from API
      const response = await axios.get(`${baseURL}/files/${fileId}`, {
        withCredentials: true,
      });

      const downloadUrl = response.data?.data?.downloadUrl;

      if (!downloadUrl) {
        throw new Error("No download URL returned from server");
      }

      console.log("🔗 Downloading file:", {
        fileName: file.fileName,
        downloadUrl: downloadUrl.substring(0, 100) + "...",
      });

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      // For direct download (instead of opening in new tab)
      link.download = file.fileName || "download";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (enableNotifications) {
        notification.success({
          message: "Download Started",
          description: `Downloading ${file.fileName}...`,
        });
      }

      return downloadUrl;
    } catch (error) {
      console.error("❌ Download error:", error);

      if (enableNotifications) {
        notification.error({
          message: "Download Failed",
          description:
            error.response?.data?.message || "Failed to download file",
        });
      }
      throw error;
    } finally {
      setOperationInProgress(null);
    }
  };

  /**
   * Delete a file
   */
  const deleteFile = async (file) => {
    const fileId = file._id || file.id;
    if (!fileId) {
      console.error("❌ File ID required for deletion");
      return false;
    }

    setOperationInProgress(`delete-${fileId}`);

    try {
      // Optimistically remove from UI
      const updatedFiles = files.filter((f) => f._id !== fileId);
      setFiles(updatedFiles);

      await axios.delete(`${baseURL}/files/${fileId}`, {
        withCredentials: true,
      });

      if (enableNotifications) {
        notification.success({
          message: "File Deleted",
          description: `${file.fileName} was deleted successfully`,
        });
      }

      return true;
    } catch (error) {
      // Revert optimistic update on failure
      setFiles((prev) => [...prev, file]);

      console.error("❌ Delete error:", error);

      if (enableNotifications) {
        notification.error({
          message: "Delete Failed",
          description: error.response?.data?.message || "Failed to delete file",
        });
      }
      return false;
    } finally {
      setOperationInProgress(null);
    }
  };

  /**
   * Bulk delete multiple files
   */
  const bulkDeleteFiles = async (fileIds) => {
    if (!fileIds || fileIds.length === 0) {
      console.error("❌ File IDs required for bulk deletion");
      return false;
    }

    setOperationInProgress(`bulk-delete`);

    try {
      // Optimistically remove from UI
      const updatedFiles = files.filter((f) => !fileIds.includes(f._id));
      setFiles(updatedFiles);

      // Delete files one by one (or implement bulk delete endpoint)
      const deletePromises = fileIds.map(async (fileId) => {
        await axios.delete(`${baseURL}/files/${fileId}`, {
          withCredentials: true,
        });
      });

      await Promise.all(deletePromises);

      if (enableNotifications) {
        notification.success({
          message: "Files Deleted",
          description: `Deleted ${fileIds.length} file(s) successfully`,
        });
      }

      return true;
    } catch (error) {
      // Revert by re-fetching all files on failure
      fetchFiles();

      console.error("❌ Bulk delete error:", error);

      if (enableNotifications) {
        notification.error({
          message: "Delete Failed",
          description: "Failed to delete selected files",
        });
      }
      return false;
    } finally {
      setOperationInProgress(null);
    }
  };

  /**
   * Get file statistics
   */
  const getStatistics = () => {
    const totalFiles = files.length;
    const totalSizeMB = files.reduce(
      (total, file) => total + (parseFloat(file.fileSizeMB) || 0),
      0
    );

    const categories = [
      ...new Set(files.map((file) => file.category).filter(Boolean)),
    ];
    const fileTypes = [
      ...new Set(files.map((file) => file.fileType).filter(Boolean)),
    ];

    return {
      totalFiles,
      totalSize: totalSizeMB * 1024 * 1024, // Convert back to bytes
      totalSizeMB,
      categories,
      fileTypes,
      averageSizeMB: totalFiles > 0 ? (totalSizeMB / totalFiles).toFixed(2) : 0,
    };
  };

  /**
   * Upload files
   */
  const uploadFiles = async (filesToUpload, additionalData = {}) => {
    setLoading(true);

    try {
      const formData = new FormData();

      // Append files
      filesToUpload.forEach((file) => {
        formData.append("files", file);
      });

      // Append metadata
      Object.keys(additionalData).forEach((key) => {
        formData.append(key, additionalData[key]);
      });

      // Always use the general upload endpoint
      const response = await axios.post(
        `${baseURL}/files/upload-multiple`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const newFiles = response.data?.data?.files || [];

      // Add new files to state
      setFiles((prev) => [...prev, ...newFiles]);

      if (enableNotifications) {
        notification.success({
          message: "Upload Successful",
          description: `Uploaded ${newFiles.length} file(s) successfully`,
        });
      }

      return newFiles;
    } catch (error) {
      console.error("❌ Upload error:", error);

      if (enableNotifications) {
        notification.error({
          message: "Upload Failed",
          description:
            error.response?.data?.message || "Failed to upload files",
        });
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Utility functions
   */
  const getFileById = (fileId) => {
    return files.find((file) => file._id === fileId || file.id === fileId);
  };

  const getFilesByCategory = (category) => {
    return files.filter((file) => file.category === category);
  };

  const getFilesByType = (fileType) => {
    return files.filter((file) => file.fileType === fileType);
  };

  const isOperationInProgress = (file) => {
    const fileId = file._id || file.id;
    return (
      operationInProgress === `download-${fileId}` ||
      operationInProgress === `delete-${fileId}` ||
      operationInProgress === `bulk-delete`
    );
  };

  const refreshFiles = () => {
    fetchFiles();
  };

  const clearFiles = () => {
    setFiles([]);
  };

  const addFiles = (newFiles) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  // Calculate statistics
  const statistics = getStatistics();

  return {
    // State
    files,
    loading,
    error,
    operationInProgress,

    // Core operations
    fetchFiles,
    downloadFile,
    deleteFile,
    bulkDeleteFiles,
    uploadFiles,

    // Utility functions
    getFileById,
    getFilesByCategory,
    getFilesByType,
    isOperationInProgress,
    refreshFiles,
    clearFiles,
    addFiles,

    // Statistics
    statistics,

    // State setters (for external control)
    setFiles,
    setLoading,
  };
};

export default useFileManager;
