// hooks/useFileManager.js
import { useState, useEffect } from "react";
import axios from "axios";
import { notification } from "antd";

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";

/**
 * Universal File Manager Hook
 * Handles file listing, downloading, and deletion for any entity type
 * Uses cookie-based authentication (withCredentials)
 */
const useFileManager = (entityType, entityId, options = {}) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState(null);
  const [error, setError] = useState(null);

  const {
    autoFetch = true,
    enableNotifications = true,
    customEndpoint = null,
  } = options;

  // Fetch files when entity changes
  useEffect(() => {
    if (autoFetch && entityType && entityId) {
      fetchFiles();
    }
  }, [entityType, entityId, autoFetch]);

  /**
   * Fetch files for the entity
   */
  const fetchFiles = async () => {
    if (!entityType || !entityId) {
      console.warn("❌ Entity type and ID required to fetch files");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint =
        customEndpoint || `files/entity/${entityType}/${entityId}`;

      const response = await axios.get(`${baseURL}/${endpoint}`, {
        withCredentials: true,
      });

      const filesData = response.data?.data?.files || [];
      setFiles(filesData);

      if (enableNotifications) {
        notification.success({
          message: "Files Loaded",
          description: `Found ${filesData.length} file(s)`,
        });
      }

      console.log(filesData, "filesData");

      console.log(
        `✅ Loaded ${filesData.length} files for ${entityType}:${entityId}`
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

      // Open download URL in new tab
      window.open(downloadUrl, "_blank");

      if (enableNotifications) {
        notification.success({
          message: "Download Started",
          description: `Downloading ${file.fileName}...`,
        });
      }

      // Track download analytics
      trackFileAction("download", file);
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
      return;
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

      // Track deletion analytics
      trackFileAction("delete", file);

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
   * Upload files to the entity
   */
  const uploadFiles = async (filesToUpload, additionalData = {}) => {
    if (!entityType || !entityId) {
      throw new Error("Entity type and ID required for upload");
    }

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

      // Determine upload endpoint based on entity type
      const uploadEndpoint = getUploadEndpoint();

      const response = await axios.post(
        `${baseURL}/${uploadEndpoint}`,
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
   * Get appropriate upload endpoint based on entity type
   */
  const getUploadEndpoint = () => {
    if (customEndpoint) return customEndpoint;

    switch (entityType.toLowerCase()) {
      case "case":
        return `cases/${entityId}/documents`;
      case "task":
        return `tasks/${entityId}/reference-documents`;
      case "user":
        return `users/${entityId}/files`;
      case "report":
        return `reports/${entityId}/attachments`;
      default:
        return `files/upload`;
    }
  };

  /**
   * Track file actions for analytics
   */
  const trackFileAction = (action, file) => {
    console.log(`📊 File ${action}:`, {
      fileName: file.fileName,
      fileId: file._id,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
    });
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
      operationInProgress === `delete-${fileId}`
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
  const statistics = {
    totalFiles: files.length,
    totalSize: files.reduce((total, file) => total + (file.fileSize || 0), 0),
    totalSizeMB: files.reduce(
      (total, file) => total + (parseFloat(file.fileSizeMB) || 0),
      0
    ),
    categories: [...new Set(files.map((file) => file.category))],
    fileTypes: [...new Set(files.map((file) => file.fileType))],
  };

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
