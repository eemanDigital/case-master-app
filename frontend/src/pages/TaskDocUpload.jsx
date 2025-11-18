import { useState } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  Upload,
  message,
  Card,
  Typography,
} from "antd";
import { UploadOutlined, PlusOutlined } from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const { Text } = Typography;

const TaskDocUpload = ({ taskId }) => {
  const [open, setOpen] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();
  const { dataFetcher, loading } = useDataFetch();
  const { user } = useSelector((state) => state.auth); // Get current user

  const showModal = () => {
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    form.resetFields();
    setFileList([]);
  };

  const beforeUpload = (file) => {
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error("File must be smaller than 10MB!");
      return false;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      message.error(
        "You can only upload PDF, Word, Excel, Image, or Text files!"
      );
      return false;
    }

    return true;
  };

  const handleUpload = async (values) => {
    if (fileList.length === 0) {
      message.error("Please select a file to upload!");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileList[0].originFileObj);
    formData.append("fileName", values.fileName || fileList[0].name);

    // Add the uploadedBy field with current user ID
    if (user?.data?._id) {
      formData.append("uploadedBy", user.data._id);
    }

    try {
      const response = await dataFetcher(
        `tasks/${taskId}/documents`,
        "POST",
        formData,
        true // isFormData
      );

      if (response?.status === "success") {
        toast.success("Document uploaded successfully!");
        handleCancel();
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload document");
    }
  };

  const handleFileChange = ({ fileList }) => {
    setFileList(fileList);
  };

  return (
    <>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={showModal}
        className="flex items-center gap-2">
        Upload Document
      </Button>

      <Modal
        title="Upload Document"
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={600}>
        <Card bordered={false} className="mt-4">
          <Form form={form} layout="vertical" onFinish={handleUpload}>
            <Form.Item
              name="fileName"
              label="Document Name"
              rules={[
                { required: true, message: "Please enter a document name" },
                {
                  max: 255,
                  message: "Document name cannot exceed 255 characters",
                },
              ]}>
              <Input placeholder="Enter a descriptive name for this document" />
            </Form.Item>

            <Form.Item
              label="Select File"
              required
              extra="Supported formats: PDF, Word, Excel, Images, Text files (Max: 10MB)">
              <Upload
                fileList={fileList}
                beforeUpload={beforeUpload}
                onChange={handleFileChange}
                onRemove={() => setFileList([])}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                maxCount={1}>
                <Button icon={<UploadOutlined />} className="w-full">
                  Click to Select File
                </Button>
              </Upload>
            </Form.Item>

            {fileList.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                <Text strong>Selected File:</Text>
                <div className="mt-1">
                  <Text className="text-sm">{fileList[0].name}</Text>
                  <br />
                  <Text type="secondary" className="text-xs">
                    Size: {(fileList[0].size / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </div>
              </div>
            )}

            <Form.Item className="mb-0">
              <div className="flex gap-3 justify-end">
                <Button onClick={handleCancel}>Cancel</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={fileList.length === 0}>
                  Upload Document
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Card>
      </Modal>
    </>
  );
};

export default TaskDocUpload;
