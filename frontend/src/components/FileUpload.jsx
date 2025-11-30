// components/FileUploader.jsx
import PropTypes from "prop-types";
import { useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { Button, Modal, Upload, message, Form, Input, Select, Tag } from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  FileOutlined,
} from "@ant-design/icons";
import useModal from "../hooks/useModal";
import { toast } from "react-toastify";

const { Dragger } = Upload;
const { Option } = Select;

const FileUploader = ({
  entityType,
  entityId,
  category = "general",
  onUploadSuccess,
  onUploadError,
  multiple = false,
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
  ],
  buttonText = "Upload Files",
  buttonProps = {},
  showCategorySelector = true,
  showDescription = true,
  showTags = false,
  uploadType = "general", // 'general', 'task-reference', 'task-response'
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  const { open, showModal, handleOk, handleCancel } = useModal();
  const { dataFetcher, loading, error } = useDataFetch();

  const handleUpload = async (values) => {
    if (fileList.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      // Append files
      fileList.forEach((file) => {
        formData.append("files", file);
      });

      // Append metadata
      formData.append("category", values.category || category);
      formData.append("entityType", entityType);
      formData.append("entityId", entityId);

      if (values.description) {
        formData.append("description", values.description);
      }

      if (values.tags && values.tags.length > 0) {
        formData.append("tags", values.tags.join(","));
      }

      // Add upload type for task-specific categorization
      if (uploadType) {
        formData.append("uploadType", uploadType);
      }

      const response = await dataFetcher(
        "files/upload-multiple",
        "post",
        formData,
        { "Content-Type": "multipart/form-data" }
      );

      if (response) {
        toast.success(`Successfully uploaded ${fileList.length} file(s)`);
        form.resetFields();
        setFileList([]);
        handleCancel();

        if (onUploadSuccess) {
          onUploadSuccess(response.data.files);
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      const errorMsg = err?.message || "Failed to upload files";
      toast.error(errorMsg);

      if (onUploadError) {
        onUploadError(err);
      }
    } finally {
      setUploading(false);
    }
  };

  const beforeUpload = (file) => {
    // Check file size (10MB limit)
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error("File must be smaller than 10MB!");
      return false;
    }

    // Check if we've reached max files
    if (fileList.length >= maxFiles) {
      message.error(`You can only upload up to ${maxFiles} files`);
      return false;
    }

    // Add file to list
    setFileList((prev) => [...prev, file]);
    return false; // Prevent automatic upload
  };

  const removeFile = (fileToRemove) => {
    setFileList((prev) => prev.filter((file) => file.uid !== fileToRemove.uid));
  };

  const draggerProps = {
    name: "files",
    multiple: multiple,
    accept: allowedFileTypes.join(","),
    fileList: fileList,
    beforeUpload: beforeUpload,
    onRemove: removeFile,
    showUploadList: false,
    disabled: uploading,
  };

  return (
    <>
      <Button onClick={showModal} icon={<UploadOutlined />} {...buttonProps}>
        {buttonText}
      </Button>

      <Modal
        title={`Upload Files to ${entityType}`}
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={600}
        destroyOnClose>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpload}
          initialValues={{ category }}>
          {/* File Upload Area */}
          <Form.Item label="Select Files">
            <Dragger {...draggerProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag files to this area to upload
              </p>
              <p className="ant-upload-hint">
                Support for {allowedFileTypes.join(", ")}. Maximum 10MB per
                file.
                {maxFiles > 1 && ` Maximum ${maxFiles} files.`}
              </p>
            </Dragger>

            {/* File List Preview */}
            {fileList.length > 0 && (
              <div className="mt-4 max-h-40 overflow-y-auto">
                {fileList.map((file) => (
                  <div
                    key={file.uid}
                    className="flex items-center justify-between p-2 border border-gray-200 rounded mb-2">
                    <div className="flex items-center">
                      <FileOutlined className="text-blue-500 mr-2" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => removeFile(file)}
                      disabled={uploading}
                      danger
                    />
                  </div>
                ))}
              </div>
            )}
          </Form.Item>

          {/* Category Selector */}
          {showCategorySelector && (
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: "Please select a category" }]}>
              <Select placeholder="Select category">
                <Option value="legal">Legal</Option>
                <Option value="contract">Contract</Option>
                <Option value="court">Court</Option>
                <Option value="correspondence">Correspondence</Option>
                <Option value="client">Client</Option>
                <Option value="internal">Internal</Option>
                <Option value="report">Report</Option>
                <Option value="case-document">Case Document</Option>
                <Option value="task-document">Task Document</Option>
                <Option value="general">General</Option>
              </Select>
            </Form.Item>
          )}

          {/* Description */}
          {showDescription && (
            <Form.Item name="description" label="Description">
              <Input.TextArea
                rows={3}
                placeholder="Enter file description (optional)"
                maxLength={500}
                showCount
              />
            </Form.Item>
          )}

          {/* Tags */}
          {showTags && (
            <Form.Item name="tags" label="Tags">
              <Select
                mode="tags"
                placeholder="Add tags (optional)"
                style={{ width: "100%" }}
                tokenSeparators={[","]}
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
                loading={uploading || loading}
                disabled={fileList.length === 0}
                icon={<UploadOutlined />}>
                {uploading
                  ? "Uploading..."
                  : `Upload ${fileList.length} File(s)`}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

FileUploader.propTypes = {
  entityType: PropTypes.oneOf(["Case", "Task", "User", "General"]).isRequired,
  entityId: PropTypes.string.isRequired,
  category: PropTypes.string,
  onUploadSuccess: PropTypes.func,
  onUploadError: PropTypes.func,
  multiple: PropTypes.bool,
  maxFiles: PropTypes.number,
  allowedFileTypes: PropTypes.array,
  buttonText: PropTypes.string,
  buttonProps: PropTypes.object,
  showCategorySelector: PropTypes.bool,
  showDescription: PropTypes.bool,
  showTags: PropTypes.bool,
  uploadType: PropTypes.oneOf(["general", "task-reference", "task-response"]),
};

export default FileUploader;
