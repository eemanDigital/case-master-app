// components/MainFileUploader.jsx
import PropTypes from "prop-types";
import { useState } from "react";
import {
  Button,
  Modal,
  Upload,
  message,
  Form,
  Input,
  Select,
  Alert,
  Progress,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  FileOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import useModal from "../hooks/useModal";
import useFileManager from "../hooks/useFileManager";

const { Dragger } = Upload;
const { Option } = Select;

const MainFileUploader = ({
  entityType = "General",
  entityId = null,
  category = "general",
  onUploadSuccess,
  onUploadError,
  multiple = true,
  maxFiles = 10,
  allowedFileTypes = [
    "image/*",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".zip",
    ".rar",
    ".csv",
  ],
  maxFileSizeMB = 10,
  buttonText = "Upload Files",
  buttonProps = {},
  showCategorySelector = true,
  showDescription = true,
  showTags = false,
  showInstructions = true,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const { open, showModal, handleCancel } = useModal();

  // Use file manager hook
  const {
    uploadMultipleFiles,
    uploading,
    uploadProgress,
    error: uploadError,
  } = useFileManager(entityType, entityId, {
    enableNotifications: true,
    onUploadSuccess: (uploadedFiles) => {
      // Reset form and file list
      form.resetFields();
      setFileList([]);
      handleCancel();

      // Call parent callback
      if (onUploadSuccess) {
        onUploadSuccess(uploadedFiles);
      }
    },
    onUploadError: (err) => {
      if (onUploadError) {
        onUploadError(err);
      }
    },
  });

  // Handle form submission
  const handleUpload = async (values) => {
    if (fileList.length === 0) {
      message.error("Please select at least one file to upload");
      return;
    }

    try {
      const metadata = {
        category: values.category || category,
        description: values.description,
        tags: values.tags || [],
      };

      await uploadMultipleFiles(fileList, metadata);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  // Validate file before adding to list
  const beforeUpload = (file) => {
    // Check file size
    const isSizeValid = file.size / 1024 / 1024 < maxFileSizeMB;
    if (!isSizeValid) {
      message.error(
        `${file.name} is too large. Maximum size: ${maxFileSizeMB}MB`
      );
      return false;
    }

    // Check file type
    const fileExtension = `.${file.name.split(".").pop().toLowerCase()}`;
    const isTypeValid = allowedFileTypes.some((type) => {
      if (type.includes("*")) {
        const mimeType = type.split("/")[0];
        return file.type.startsWith(mimeType);
      }
      return (
        fileExtension === type.toLowerCase() ||
        file.type.includes(type.replace(".", "").toLowerCase())
      );
    });

    if (!isTypeValid) {
      message.error(`${file.name} has an invalid file type`);
      return false;
    }

    // Check max files limit
    if (fileList.length >= maxFiles) {
      message.error(`Maximum ${maxFiles} files allowed`);
      return false;
    }

    // Check for duplicate
    const isDuplicate = fileList.some(
      (existingFile) => existingFile.name === file.name
    );
    if (isDuplicate) {
      message.error(`${file.name} is already selected`);
      return false;
    }

    // Add to file list
    setFileList((prev) => [
      ...prev,
      {
        ...file,
        uid: file.uid || `${Date.now()}-${Math.random()}`,
        status: "ready",
        sizeMB: (file.size / 1024 / 1024).toFixed(2),
      },
    ]);

    return false; // Prevent auto upload
  };

  // Remove file from list
  const removeFile = (fileToRemove) => {
    setFileList((prev) => prev.filter((file) => file.uid !== fileToRemove.uid));
    message.success(`${fileToRemove.name} removed`);
  };

  // Get file icon
  const getFileIcon = (fileName) => {
    const extension = fileName?.split(".").pop().toLowerCase();
    const style = { fontSize: "16px", marginRight: "8px" };

    const iconMap = {
      pdf: { ...style, color: "#ff4d4f" },
      doc: { ...style, color: "#1890ff" },
      docx: { ...style, color: "#1890ff" },
      xls: { ...style, color: "#52c41a" },
      xlsx: { ...style, color: "#52c41a" },
      ppt: { ...style, color: "#faad14" },
      pptx: { ...style, color: "#faad14" },
      jpg: { ...style, color: "#722ed1" },
      jpeg: { ...style, color: "#722ed1" },
      png: { ...style, color: "#722ed1" },
      gif: { ...style, color: "#722ed1" },
      zip: { ...style, color: "#13c2c2" },
      rar: { ...style, color: "#13c2c2" },
    };

    return <FileOutlined style={iconMap[extension] || style} />;
  };

  // Calculate total size
  const totalSize = fileList
    .reduce((sum, file) => sum + parseFloat(file.sizeMB || 0), 0)
    .toFixed(2);

  // Dragger props
  const draggerProps = {
    name: "files",
    multiple: multiple && maxFiles > 1,
    accept: allowedFileTypes.join(","),
    fileList: [],
    beforeUpload,
    showUploadList: false,
    disabled: uploading,
  };

  return (
    <>
      <Button onClick={showModal} icon={<UploadOutlined />} {...buttonProps}>
        {buttonText}
      </Button>

      <Modal
        title={`Upload Files${entityId ? ` to ${entityType}` : ""}`}
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={700}
        destroyOnClose
        maskClosable={!uploading}
        closable={!uploading}>
        {/* Instructions */}
        {showInstructions && (
          <Alert
            message="Upload Guidelines"
            description={
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Maximum file size: {maxFileSizeMB}MB per file</li>
                <li>Allowed types: {allowedFileTypes.join(", ")}</li>
                {multiple && <li>Maximum {maxFiles} files per upload</li>}
                <li>Total size limit: {maxFileSizeMB * maxFiles}MB</li>
              </ul>
            }
            type="info"
            icon={<InfoCircleOutlined />}
            className="mb-4"
          />
        )}

        {/* Upload Error Alert */}
        {uploadError && (
          <Alert
            message="Upload Error"
            description={uploadError}
            type="error"
            closable
            className="mb-4"
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpload}
          initialValues={{ category }}>
          {/* File Dragger */}
          <Form.Item
            name="files"
            label={`Select Files${multiple ? ` (Up to ${maxFiles})` : ""}`}
            required>
            <Dragger {...draggerProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag files here to upload
              </p>
              <p className="ant-upload-hint">
                {allowedFileTypes.join(", ")} • Max {maxFileSizeMB}MB per file
              </p>
            </Dragger>

            {/* Upload Progress */}
            {uploading && uploadProgress > 0 && (
              <div className="mt-4">
                <Progress
                  percent={uploadProgress}
                  status={uploadProgress === 100 ? "success" : "active"}
                  strokeColor={{
                    "0%": "#108ee9",
                    "100%": "#87d068",
                  }}
                />
                <div className="text-center text-sm text-gray-600 mt-2">
                  {uploadProgress < 100
                    ? `Uploading... ${uploadProgress}%`
                    : "Processing..."}
                </div>
              </div>
            )}

            {/* File List Preview */}
            {fileList.length > 0 && !uploading && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Selected Files ({fileList.length}/{maxFiles})
                  </span>
                  <span className="text-sm text-gray-600">
                    Total: {totalSize} MB
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded p-2">
                  {fileList.map((file) => (
                    <div
                      key={file.uid}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded mb-1">
                      <div className="flex items-center min-w-0 flex-1">
                        {getFileIcon(file.name)}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {file.sizeMB} MB • {file.type || "Unknown"}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removeFile(file)}
                        disabled={uploading}
                        danger
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Form.Item>

          {/* Category Selector */}
          {showCategorySelector && (
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: "Please select a category" }]}>
              <Select placeholder="Select category" disabled={uploading}>
                <Option value="general">General</Option>
                <Option value="legal">Legal</Option>
                <Option value="contract">Contract</Option>
                <Option value="court">Court</Option>
                <Option value="correspondence">Correspondence</Option>
                <Option value="client">Client</Option>
                <Option value="internal">Internal</Option>
                <Option value="report">Report</Option>
                <Option value="case-document">Case Document</Option>
                <Option value="task-document">Task Document</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
          )}

          {/* Description */}
          {showDescription && (
            <Form.Item
              name="description"
              label="Description (Optional)"
              rules={[
                {
                  max: 500,
                  message: "Description cannot exceed 500 characters",
                },
              ]}>
              <Input.TextArea
                rows={3}
                placeholder="Enter file description"
                maxLength={500}
                showCount
                disabled={uploading}
              />
            </Form.Item>
          )}

          {/* Tags */}
          {showTags && (
            <Form.Item name="tags" label="Tags (Optional)">
              <Select
                mode="tags"
                placeholder="Add tags (press Enter)"
                tokenSeparators={[",", " "]}
                maxTagCount={10}
                maxTagTextLength={20}
                disabled={uploading}
              />
            </Form.Item>
          )}

          {/* Action Buttons */}
          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={handleCancel} disabled={uploading}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={uploading}
                disabled={fileList.length === 0}
                icon={uploading ? null : <UploadOutlined />}>
                {uploading
                  ? `Uploading... ${uploadProgress}%`
                  : `Upload ${fileList.length} File${
                      fileList.length !== 1 ? "s" : ""
                    }`}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

MainFileUploader.propTypes = {
  entityType: PropTypes.oneOf(["Case", "Task", "User", "General"]),
  entityId: PropTypes.string,
  category: PropTypes.string,
  onUploadSuccess: PropTypes.func,
  onUploadError: PropTypes.func,
  multiple: PropTypes.bool,
  maxFiles: PropTypes.number,
  maxFileSizeMB: PropTypes.number,
  allowedFileTypes: PropTypes.array,
  buttonText: PropTypes.string,
  buttonProps: PropTypes.object,
  showCategorySelector: PropTypes.bool,
  showDescription: PropTypes.bool,
  showTags: PropTypes.bool,
  showInstructions: PropTypes.bool,
};

export default MainFileUploader;
