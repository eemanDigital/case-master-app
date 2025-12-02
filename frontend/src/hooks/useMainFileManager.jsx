// hooks/useFileManager.js
import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { notification } from "antd";

const baseURL = import.meta.env.VITE_BASE_URL;

/**
 * Complete file management hook for upload, download, delete operations
 * @param {string} entityType - Type of entity (Case, Task, User, General)
 * @param {string} entityId - ID of the entity
 * @param {object} options - Configuration options
 */
const useMainFileManager = (
  entityType = "General",
  entityId = null,
  options = {}
) => {
  const {
    autoFetch = false,
    enableNotifications = true,
    onUploadSuccess,
    onUploadError,
    onDeleteSuccess,
    onDeleteError,
  } = options;

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [operationInProgress, setOperationInProgress] = useState(null);
  const [error, setError] = useState(null);

  // Get auth token
  const getAuthToken = () => {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith("jwt="))
      ?.split("=")[1];
  };

  // Fetch files for entity
  const fetchFiles = useCallback(async () => {
    if (!entityId) {
      console.log("No entityId provided, skipping fetch");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const response = await axios.get(
        `${baseURL}/files/entity/${entityType}/${entityId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setFiles(response.data.data?.files || []);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError(err.response?.data?.message || "Failed to fetch files");

      if (enableNotifications) {
        notification.error({
          message: "Fetch Failed",
          description: err.response?.data?.message || "Failed to fetch files",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, enableNotifications]);

  // Upload single file
  const uploadFile = useCallback(
    async (file, metadata = {}) => {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        // Add metadata
        formData.append("category", metadata.category || "general");
        formData.append("entityType", entityType);

        if (entityId) {
          formData.append("entityId", entityId);
        }

        if (metadata.description) {
          formData.append("description", metadata.description);
        }

        if (metadata.tags?.length) {
          formData.append("tags", metadata.tags.join(","));
        }

        const token = getAuthToken();
        const response = await axios.post(`${baseURL}/files/upload`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          },
        });

        const uploadedFile = response.data.data?.file;

        // Update files list
        if (uploadedFile) {
          setFiles((prev) => [uploadedFile, ...prev]);
        }

        if (enableNotifications) {
          notification.success({
            message: "Upload Successful",
            description: `${file.name} uploaded successfully`,
          });
        }

        if (onUploadSuccess) {
          onUploadSuccess(uploadedFile);
        }

        return uploadedFile;
      } catch (err) {
        console.error("Upload error:", err);
        const errorMsg = err.response?.data?.message || "Failed to upload file";
        setError(errorMsg);

        if (enableNotifications) {
          notification.error({
            message: "Upload Failed",
            description: errorMsg,
          });
        }

        if (onUploadError) {
          onUploadError(err);
        }

        throw err;
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [entityType, entityId, enableNotifications, onUploadSuccess, onUploadError]
  );

  // Upload multiple files
  const uploadMultipleFiles = useCallback(
    async (fileList, metadata = {}) => {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      try {
        const formData = new FormData();

        // Append all files
        Array.from(fileList).forEach((file) => {
          formData.append("files", file);
        });

        // Add metadata
        formData.append("category", metadata.category || "general");
        formData.append("entityType", entityType);

        if (entityId) {
          formData.append("entityId", entityId);
        }

        if (metadata.description) {
          formData.append("description", metadata.description);
        }

        if (metadata.tags?.length) {
          formData.append("tags", metadata.tags.join(","));
        }

        const token = getAuthToken();
        const response = await axios.post(
          `${baseURL}/files/upload-multiple`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(progress);
            },
          }
        );

        const uploadedFiles = response.data.data?.files || [];

        // Update files list
        setFiles((prev) => [...uploadedFiles, ...prev]);

        if (enableNotifications) {
          notification.success({
            message: "Upload Successful",
            description: `${uploadedFiles.length} file(s) uploaded successfully`,
          });
        }

        if (onUploadSuccess) {
          onUploadSuccess(uploadedFiles);
        }

        return uploadedFiles;
      } catch (err) {
        console.error("Multiple upload error:", err);
        const errorMsg =
          err.response?.data?.message || "Failed to upload files";
        setError(errorMsg);

        if (enableNotifications) {
          notification.error({
            message: "Upload Failed",
            description: errorMsg,
          });
        }

        if (onUploadError) {
          onUploadError(err);
        }

        throw err;
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [entityType, entityId, enableNotifications, onUploadSuccess, onUploadError]
  );

  // Download file
  const downloadFile = useCallback(
    async (file) => {
      const opId = `download-${file._id}`;
      setOperationInProgress(opId);

      try {
        const token = getAuthToken();

        // Get presigned URL from backend
        const response = await axios.get(`${baseURL}/files/${file._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { downloadUrl } = response.data.data;

        // Download file using presigned URL
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = file.fileName || file.originalName;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (enableNotifications) {
          notification.success({
            message: "Download Started",
            description: `Downloading ${file.fileName}...`,
            duration: 2,
          });
        }

        return true;
      } catch (err) {
        console.error("Download error:", err);

        if (enableNotifications) {
          notification.error({
            message: "Download Failed",
            description:
              err.response?.data?.message || "Failed to download file",
          });
        }

        throw err;
      } finally {
        setOperationInProgress(null);
      }
    },
    [enableNotifications]
  );

  // Delete file
  const deleteFile = useCallback(
    async (file) => {
      const opId = `delete-${file._id}`;
      setOperationInProgress(opId);

      try {
        // Optimistic update
        setFiles((prev) => prev.filter((f) => f._id !== file._id));

        const token = getAuthToken();
        await axios.delete(`${baseURL}/files/${file._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (enableNotifications) {
          notification.success({
            message: "File Deleted",
            description: `${file.fileName} deleted successfully`,
          });
        }

        if (onDeleteSuccess) {
          onDeleteSuccess(file);
        }

        return true;
      } catch (err) {
        // Revert optimistic update on error
        setFiles((prev) => [...prev, file]);

        console.error("Delete error:", err);

        if (enableNotifications) {
          notification.error({
            message: "Delete Failed",
            description: err.response?.data?.message || "Failed to delete file",
          });
        }

        if (onDeleteError) {
          onDeleteError(err);
        }

        throw err;
      } finally {
        setOperationInProgress(null);
      }
    },
    [enableNotifications, onDeleteSuccess, onDeleteError]
  );

  // Bulk delete files
  const bulkDeleteFiles = useCallback(
    async (fileIds) => {
      setLoading(true);

      try {
        const token = getAuthToken();
        const deletePromises = fileIds.map((fileId) => {
          const file = files.find((f) => f._id === fileId);
          return axios
            .delete(`${baseURL}/files/${fileId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            .then(() => file);
        });

        await Promise.all(deletePromises);

        // Remove deleted files from state
        setFiles((prev) => prev.filter((f) => !fileIds.includes(f._id)));

        if (enableNotifications) {
          notification.success({
            message: "Bulk Delete Successful",
            description: `${fileIds.length} file(s) deleted successfully`,
          });
        }

        return true;
      } catch (err) {
        console.error("Bulk delete error:", err);

        if (enableNotifications) {
          notification.error({
            message: "Bulk Delete Failed",
            description: "Failed to delete some files",
          });
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [files, enableNotifications]
  );

  // Get file by ID
  const getFileById = useCallback(
    (fileId) => {
      return files.find((file) => file._id === fileId);
    },
    [files]
  );

  // Get files by category
  const getFilesByCategory = useCallback(
    (category) => {
      return files.filter((file) => file.category === category);
    },
    [files]
  );

  // Calculate statistics
  const statistics = {
    totalFiles: files.length,
    totalSize: files.reduce((sum, file) => sum + (file.fileSize || 0), 0),
    totalSizeMB: files.reduce(
      (sum, file) => sum + parseFloat(file.fileSizeMB || 0),
      0
    ),
    categories: [...new Set(files.map((file) => file.category))],
    fileTypes: [...new Set(files.map((file) => file.fileType))],
  };

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && entityId) {
      fetchFiles();
    }
  }, [autoFetch, entityId, fetchFiles]);

  return {
    // State
    files,
    loading,
    uploading,
    uploadProgress,
    operationInProgress,
    error,
    statistics,

    // Operations
    uploadFile,
    uploadMultipleFiles,
    downloadFile,
    deleteFile,
    bulkDeleteFiles,
    fetchFiles,

    // Utilities
    getFileById,
    getFilesByCategory,
    setFiles,
  };
};

export default useMainFileManager;
