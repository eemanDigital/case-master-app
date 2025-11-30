// components/TaskFileUploader.jsx
import { useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { Button, Modal, Upload, Form, Input, Select, message } from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  FileOutlined,
} from "@ant-design/icons";
import useModal from "../hooks/useModal";
import { toast } from "react-toastify";

const { Dragger } = Upload;
const { Option } = Select;

const TaskFileUploader = ({
  taskId,
  uploadType = "reference", // 'reference' or 'response'
  onUploadSuccess,
  buttonText = "Upload Task Files",
  buttonProps = {},
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  const { open, showModal, handleOk, handleCancel } = useModal();
  const { dataFetcher, loading } = useDataFetch();

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

      // Append task-specific metadata
      formData.append("entityType", "Task");
      formData.append("entityId", taskId);
      formData.append("category", "task-document");
      formData.append("uploadType", uploadType); // 'reference' or 'response'

      if (values.description) {
        formData.append("description", values.description);
      }

      // Use the task-specific upload endpoint
      const endpoint =
        uploadType === "reference"
          ? `tasks/${taskId}/reference-documents`
          : `tasks/${taskId}/response-documents`;

      const response = await dataFetcher(endpoint, "post", formData, {
        "Content-Type": "multipart/form-data",
      });

      if (response) {
        toast.success(`Successfully uploaded ${fileList.length} file(s)`);
        form.resetFields();
        setFileList([]);
        handleCancel();

        if (onUploadSuccess) {
          onUploadSuccess(response.data);
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      const errorMsg = err?.message || "Failed to upload files";
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const beforeUpload = (file) => {
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      toast.error("File must be smaller than 10MB!");
      return false;
    }

    setFileList((prev) => [...prev, file]);
    return false;
  };

  const removeFile = (fileToRemove) => {
    setFileList((prev) => prev.filter((file) => file.uid !== fileToRemove.uid));
  };

  const draggerProps = {
    name: "files",
    multiple: true,
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip",
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
        title={`Upload ${
          uploadType === "reference" ? "Reference" : "Response"
        } Documents`}
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={600}
        destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleUpload}>
          <Form.Item label="Select Files">
            <Dragger {...draggerProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag files to this area to upload
              </p>
              <p className="ant-upload-hint">
                Support for documents, images, and archives. Maximum 10MB per
                file.
              </p>
            </Dragger>

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

          <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={3}
              placeholder="Enter file description (optional)"
              maxLength={500}
              showCount
            />
          </Form.Item>

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

export default TaskFileUploader;
