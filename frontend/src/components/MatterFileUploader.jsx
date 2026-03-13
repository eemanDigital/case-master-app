// components/MatterFileUploader.jsx
import { useState } from "react";
import { useSelector } from "react-redux";
import { Button, Modal, Upload, Form, Input, message } from "antd";
import { UploadOutlined, InboxOutlined } from "@ant-design/icons";
import useModal from "../hooks/useModal";
import { toast } from "react-toastify";

const { Dragger } = Upload;

const MatterFileUploader = ({
  matterId,
  onUploadSuccess,
  buttonText = "Upload Document",
  buttonProps = {},
  category = "legal",
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);

  const { open, showModal, handleOk, handleCancel } = useModal();

  const getBaseURL = () => {
    return import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";
  };

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

      // Append matter-specific metadata
      formData.append("entityType", "Matter");
      formData.append("entityId", matterId);
      formData.append("category", values.category || category);

      if (values.description) {
        formData.append("description", values.description);
      }

      const response = await fetch(
        `${getBaseURL()}/matters/${matterId}/documents`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        toast.success(
          `Successfully uploaded ${fileList.length} file(s)`
        );
        form.resetFields();
        setFileList([]);
        handleCancel();
        if (onUploadSuccess) {
          onUploadSuccess(data.data);
        }
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    multiple: true,
    beforeUpload: (file) => {
      // Limit file size to 50MB
      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        message.error("File must be smaller than 50MB!");
        return Upload.LIST_IGNORE;
      }
      
      // Check file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "image/jpeg",
        "image/png",
        "image/gif",
      ];
      
      const isAllowed = allowedTypes.includes(file.type) ||
        file.name.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpg|jpeg|png|gif)$/i);
      
      if (!isAllowed) {
        message.error("You can only upload document files!");
        return Upload.LIST_IGNORE;
      }

      setFileList((prev) => [...prev, file]);
      return false; // Prevent auto upload
    },
    fileList,
    onRemove: (file) => {
      setFileList((prev) => {
        const index = prev.indexOf(file);
        const newFileList = prev.slice();
        newFileList.splice(index, 1);
        return newFileList;
      });
    },
  };

  return (
    <>
      <Button
        type="primary"
        icon={<UploadOutlined />}
        onClick={showModal}
        {...buttonProps}>
        {buttonText}
      </Button>

      <Modal
        title="Upload Documents"
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={uploading}
        footer={null}
        width={500}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpload}
          initialValues={{ category: category }}>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: false }]}>
            <Input.TextArea
              rows={2}
              placeholder="Add a description for these documents..."
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true }]}>
            <select
              className="ant-input"
              style={{ width: "100%", padding: "8px" }}
              defaultValue={category}>
              <option value="legal">Legal Document</option>
              <option value="contract">Contract</option>
              <option value="correspondence">Correspondence</option>
              <option value="court">Court Document</option>
              <option value="evidence">Evidence</option>
              <option value="general">General</option>
            </select>
          </Form.Item>

          <Form.Item label="Files">
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag files to upload
              </p>
              <p className="ant-upload-hint">
                Support for single or bulk upload. File must be less than 50MB.
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end gap-2">
            <Button onClick={handleCancel}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={uploading}
              disabled={fileList.length === 0}>
              Upload {fileList.length > 0 && `(${fileList.length})`}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default MatterFileUploader;
