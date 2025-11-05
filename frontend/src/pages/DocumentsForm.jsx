import { useState } from "react";
import { Modal, Select, Input, Progress, Alert } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import DocumentsList from "../components/DocumentsList";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { toast } from "react-toastify";
import ButtonWithIcon from "../components/ButtonWithIcon";
import { FaUpload, FaFileAlt, FaTimes } from "react-icons/fa";

const { TextArea } = Input;
const { Option } = Select;

const DocumentForm = () => {
  const [formData, setFormData] = useState({
    fileName: "",
    description: "",
    category: "general",
    file: null,
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const { fetchData } = useDataGetterHook();
  const { dataFetcher, loading } = useDataFetch();

  // File validation constants
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
  const ALLOWED_FILE_TYPES = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      ".xlsx",
    "text/plain": ".txt",
    "text/csv": ".csv",
    "image/jpeg": ".jpg, .jpeg",
    "image/png": ".png",
  };

  // Validate file
  const validateFile = (file) => {
    if (!file) {
      return "Please select a file";
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES[file.type]) {
      return "Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, JPG, PNG";
    }

    return null;
  };

  // Handle input changes
  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  // Process and validate file
  const processFile = (file) => {
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setFileError(error);
      setFormData((prev) => ({ ...prev, file: null }));
      toast.error(error);
      return;
    }

    setFileError("");
    setFormData((prev) => ({
      ...prev,
      file: file,
      // Auto-populate fileName if empty
      fileName: prev.fileName || file.name.replace(/\.[^/.]+$/, ""),
    }));
    toast.success("File selected successfully");
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Remove selected file
  const removeFile = () => {
    setFormData((prev) => ({ ...prev, file: null }));
    setFileError("");
    // Clear file input
    const fileInput = document.getElementById("file");
    if (fileInput) fileInput.value = "";
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType?.includes("pdf")) return "📄";
    if (fileType?.includes("word") || fileType?.includes("document"))
      return "📝";
    if (fileType?.includes("sheet") || fileType?.includes("excel")) return "📊";
    if (fileType?.includes("image")) return "🖼️";
    if (fileType?.includes("text")) return "📃";
    return "📎";
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.file) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!formData.fileName.trim()) {
      toast.error("Please enter a file name");
      return;
    }

    const payload = new FormData();
    payload.append("fileName", formData.fileName.trim());
    payload.append("file", formData.file);
    if (formData.description) {
      payload.append("description", formData.description.trim());
    }
    payload.append("category", formData.category);

    const fileHeaders = {
      "Content-Type": "multipart/form-data",
    };

    try {
      setUploadProgress(0);

      // Simulate upload progress (if your backend doesn't support progress events)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await dataFetcher(
        "documents",
        "post",
        payload,
        fileHeaders
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response?.status === "success" || response?.message === "success") {
        toast.success("Document uploaded successfully!");
        // Refresh document list
        await fetchData("documents", "documents");
        // Reset form and close modal
        resetForm();
        setIsModalVisible(false);
      } else {
        throw new Error(
          response?.error || response?.message || "Upload failed"
        );
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to upload document. Please try again."
      );
      setUploadProgress(0);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      fileName: "",
      description: "",
      category: "general",
      file: null,
    });
    setFileError("");
    setUploadProgress(0);
    const fileInput = document.getElementById("file");
    if (fileInput) fileInput.value = "";
  };

  // Show modal
  const showModal = () => {
    resetForm();
    setIsModalVisible(true);
  };

  // Handle cancel
  const handleCancel = () => {
    if (loading) {
      toast.warning("Please wait for the upload to complete");
      return;
    }
    resetForm();
    setIsModalVisible(false);
  };

  return (
    <div className="container mx-auto xl:px-5 md:px-4 sm:px-0">
      <ButtonWithIcon
        icon={<FaUpload />}
        onClick={showModal}
        text="Upload Document"
      />

      <Modal
        title={
          <div className="flex items-center space-x-2">
            <FaFileAlt className="text-blue-600" />
            <span>Upload Document</span>
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
        maskClosable={!loading}>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* File Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Name <span className="text-red-500">*</span>
            </label>
            <Input
              required
              placeholder="Enter file name"
              value={formData.fileName}
              onChange={(e) => handleInputChange("fileName", e.target.value)}
              maxLength={255}
              showCount
              disabled={loading}
            />
          </div>

          {/* Category Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <Select
              value={formData.category}
              onChange={(value) => handleInputChange("category", value)}
              style={{ width: "100%" }}
              disabled={loading}>
              <Option value="general">General</Option>
              <Option value="legal">Legal</Option>
              <Option value="contract">Contract</Option>
              <Option value="court">Court</Option>
              <Option value="correspondence">Correspondence</Option>
              <Option value="client">Client</Option>
              <Option value="internal">Internal</Option>
              <Option value="report">Report</Option>
              <Option value="other">Other</Option>
            </Select>
          </div>

          {/* Description Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <TextArea
              placeholder="Add a description for this document"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              maxLength={500}
              showCount
              disabled={loading}
            />
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File <span className="text-red-500">*</span>
            </label>

            {/* Drag and Drop Area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : fileError
                  ? "border-red-300 bg-red-50"
                  : formData.file
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 bg-gray-50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}>
              {!formData.file ? (
                <>
                  <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <div className="space-y-2">
                    <label
                      htmlFor="file"
                      className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>Click to upload</span>
                      <span className="text-gray-500"> or drag and drop</span>
                      <input
                        id="file"
                        name="file"
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="sr-only"
                        disabled={loading}
                      />
                    </label>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, JPG, PNG
                    </p>
                    <p className="text-xs text-gray-500">
                      Maximum file size: 10MB
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3 flex-1">
                    <span className="text-3xl">
                      {getFileIcon(formData.file.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {formData.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(formData.file.size)} •{" "}
                        {formData.file.type.split("/")[1]?.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  {!loading && (
                    <button
                      type="button"
                      onClick={removeFile}
                      className="ml-3 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors">
                      <FaTimes />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* File Error Message */}
            {fileError && (
              <Alert
                message={fileError}
                type="error"
                showIcon
                className="mt-2"
              />
            )}
          </div>

          {/* Upload Progress */}
          {loading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress
                percent={uploadProgress}
                status={uploadProgress === 100 ? "success" : "active"}
                strokeColor={{
                  "0%": "#108ee9",
                  "100%": "#87d068",
                }}
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.file || !!fileError}
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                "Upload Document"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Documents List */}
      <DocumentsList />
    </div>
  );
};

export default DocumentForm;
