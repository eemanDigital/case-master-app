import React from "react";
import PropTypes from "prop-types";
import {
  Card,
  List,
  Button,
  Space,
  Tooltip,
  Typography,
  Empty,
  Tag,
  Popconfirm,
  Avatar,
  Badge,
  Upload,
  message,
} from "antd";
import {
  DownloadOutlined,
  DeleteOutlined,
  FileOutlined,
  FileTextOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileZipOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { downloadFile, deleteFile } from "../utils/fileDownloadHandler";
import { useSelector } from "react-redux";
import { formatDate } from "../utils/formatDate";
import { useDataFetch } from "../hooks/useDataFetch";

const { Title, Text } = Typography;

const TaskAttachmentsCard = ({
  documents = [],
  task,
  baseURL,
  onDocumentUpdate,
  onPreviewDocument,
}) => {
  const [deletingIds, setDeletingIds] = React.useState(new Set());
  const [uploading, setUploading] = React.useState(false);
  const { user } = useSelector((state) => state.auth);
  const { dataFetcher } = useDataFetch();

  // File type helpers
  const getFileIcon = (fileName, mimeType) => {
    if (mimeType?.includes("pdf") || fileName?.match(/\.pdf$/i))
      return <FilePdfOutlined className="text-red-500" />;
    if (
      mimeType?.includes("image") ||
      fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    )
      return <FileImageOutlined className="text-green-500" />;
    if (mimeType?.includes("word") || fileName?.match(/\.(doc|docx)$/i))
      return <FileWordOutlined className="text-blue-500" />;
    if (mimeType?.includes("excel") || fileName?.match(/\.(xls|xlsx)$/i))
      return <FileExcelOutlined className="text-green-600" />;
    if (mimeType?.includes("zip") || fileName?.match(/\.(zip|rar|7z)$/i))
      return <FileZipOutlined className="text-orange-500" />;
    if (mimeType?.includes("text") || fileName?.match(/\.(txt|md)$/i))
      return <FileTextOutlined className="text-gray-500" />;
    return <FileOutlined className="text-gray-400" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getFileType = (mimeType, fileName) => {
    if (mimeType?.includes("pdf") || fileName?.match(/\.pdf$/i)) return "PDF";
    if (
      mimeType?.includes("image") ||
      fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    )
      return "Image";
    if (mimeType?.includes("word") || fileName?.match(/\.(doc|docx)$/i))
      return "Word";
    if (mimeType?.includes("excel") || fileName?.match(/\.(xls|xlsx)$/i))
      return "Excel";
    if (mimeType?.includes("text") || fileName?.match(/\.(txt|md)$/i))
      return "Text";
    if (mimeType?.includes("zip") || fileName?.match(/\.(zip|rar|7z)$/i))
      return "Archive";
    const ext = fileName?.split(".").pop()?.toUpperCase();
    return ext || "File";
  };

  // Permission check
  const canDeleteDocument = (document) => {
    const currentUserId = user?.data?._id;
    const isUploader =
      document.uploadedBy?._id === currentUserId ||
      document.uploadedBy === currentUserId;
    const isTaskCreator = task?.assignedBy?._id === currentUserId;
    const isAdmin = ["super-admin", "admin"].includes(user?.data?.role);
    const isAssignedStaff = task?.assignedTo?.some(
      (assignment) => assignment.user?._id === currentUserId
    );

    return isUploader || isTaskCreator || isAdmin || isAssignedStaff;
  };

  const canUploadDocument = () => {
    const currentUserId = user?.data?._id;
    const isTaskCreator = task?.assignedBy?._id === currentUserId;
    const isAdmin = ["super-admin", "admin"].includes(user?.data?.role);
    const isAssignedStaff = task?.assignedTo?.some(
      (assignment) => assignment.user?._id === currentUserId
    );

    return isTaskCreator || isAdmin || isAssignedStaff;
  };

  // Handlers
  const handleDownload = async (event, doc) => {
    try {
      await downloadFile(
        event,
        `${baseURL}/tasks/${task._id}/documents/${doc._id}/download`,
        doc.fileName
      );
    } catch (error) {
      console.error("Download failed:", error);
      message.error("Failed to download file");
    }
  };

  const handleDelete = async (doc) => {
    setDeletingIds((prev) => new Set(prev).add(doc._id));

    try {
      await deleteFile(
        `${baseURL}/tasks/${task._id}/documents/${doc._id}`,
        onDocumentUpdate
      );
      message.success("Document deleted successfully");
    } catch (error) {
      console.error("Delete failed:", error);
      message.error("Failed to delete document");
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(doc._id);
        return newSet;
      });
    }
  };

  const handleFileUpload = async (file) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);

      const result = await dataFetcher(
        `tasks/${task._id}/documents`,
        "POST",
        formData,
        true // isFormData
      );

      if (result?.status === "success") {
        message.success("Document uploaded successfully");
        onDocumentUpdate?.();
      }
    } catch (error) {
      console.error("Upload failed:", error);
      message.error("Failed to upload document");
    } finally {
      setUploading(false);
    }

    return false; // Prevent default upload behavior
  };

  const beforeUpload = (file) => {
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error("File must be smaller than 10MB!");
      return false;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      message.error(
        "You can only upload PDF, Word, Excel, text, or image files!"
      );
      return false;
    }

    return true;
  };

  const uploadProps = {
    beforeUpload,
    customRequest: ({ file }) => handleFileUpload(file),
    showUploadList: false,
    disabled: !canUploadDocument() || uploading,
  };

  const renderDocumentList = (docList, title, icon) => (
    <div className="mb-6 last:mb-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <Text strong className="text-gray-800">
            {title}
          </Text>
          <Badge count={docList.length} showZero={false} />
        </div>

        {title === "Task Documents" && canUploadDocument() && (
          <Upload {...uploadProps}>
            <Button
              type="primary"
              size="small"
              icon={<UploadOutlined />}
              loading={uploading}>
              Upload Document
            </Button>
          </Upload>
        )}
      </div>

      {docList.length > 0 ? (
        <List
          dataSource={docList}
          renderItem={(doc) => (
            <List.Item
              key={doc._id}
              className="hover:bg-gray-50 rounded-lg p-4 transition-all border-0 mb-2 last:mb-0"
              actions={[
                <Tooltip title="Preview" key="preview">
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => onPreviewDocument?.(doc)}
                    className="text-green-500 hover:text-green-700"
                    size="small"
                  />
                </Tooltip>,
                <Tooltip title="Download" key="download">
                  <Button
                    type="text"
                    icon={<DownloadOutlined />}
                    onClick={(e) => handleDownload(e, doc)}
                    className="text-blue-500 hover:text-blue-700"
                    size="small"
                  />
                </Tooltip>,
                canDeleteDocument(doc) && (
                  <Popconfirm
                    key="delete"
                    title="Delete Document"
                    description={`Are you sure you want to delete "${doc.fileName}"?`}
                    onConfirm={() => handleDelete(doc)}
                    okText="Delete"
                    okType="danger"
                    cancelText="Cancel">
                    <Tooltip title="Delete">
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        loading={deletingIds.has(doc._id)}
                        size="small"
                      />
                    </Tooltip>
                  </Popconfirm>
                ),
              ].filter(Boolean)}>
              <List.Item.Meta
                avatar={
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg border">
                    {getFileIcon(doc.fileName, doc.mimeType)}
                  </div>
                }
                title={
                  <Text
                    strong
                    className="cursor-pointer hover:text-blue-600 text-sm"
                    onClick={(e) => handleDownload(e, doc)}>
                    {doc.fileName}
                  </Text>
                }
                description={
                  <Space direction="vertical" size={2} className="mt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag color="default" className="text-xs">
                        {getFileType(doc.mimeType, doc.fileName)}
                      </Tag>
                      {doc.fileSize && (
                        <Text type="secondary" className="text-xs">
                          {formatFileSize(doc.fileSize)}
                        </Text>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <ClockCircleOutlined />
                      <Text>{formatDate(doc.uploadedAt || doc.createdAt)}</Text>
                      {doc.uploadedBy && (
                        <>
                          <Text>•</Text>
                          <div className="flex items-center gap-1">
                            <UserOutlined />
                            <Text>
                              {typeof doc.uploadedBy === "object"
                                ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}`
                                : "Unknown User"}
                            </Text>
                          </div>
                        </>
                      )}
                    </div>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={`No ${title.toLowerCase()} yet`}
          className="py-8"
        />
      )}
    </div>
  );

  return (
    <Card
      className="border-0 rounded-2xl shadow-sm"
      bodyStyle={{ padding: "24px" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileTextOutlined className="text-blue-600 text-lg" />
          <Title level={3} className="m-0 text-gray-900">
            Documents & Attachments
          </Title>
        </div>
        <div className="flex items-center gap-2">
          {documents.length > 0 && (
            <Tag color="blue">
              {documents.length} file{documents.length !== 1 ? "s" : ""}
            </Tag>
          )}
        </div>
      </div>

      {renderDocumentList(
        documents,
        "Task Documents",
        <FileTextOutlined className="text-blue-500" />
      )}

      {/* Summary */}
      {documents.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border mt-4">
          <div className="flex items-center justify-between text-sm">
            <Text className="text-gray-600">Total documents:</Text>
            <Text strong>{documents.length}</Text>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <Text className="text-gray-600">Total size:</Text>
            <Text strong>
              {formatFileSize(
                documents.reduce((total, doc) => total + (doc.fileSize || 0), 0)
              )}
            </Text>
          </div>
        </div>
      )}
    </Card>
  );
};

TaskAttachmentsCard.propTypes = {
  documents: PropTypes.array,
  task: PropTypes.object.isRequired,
  baseURL: PropTypes.string.isRequired,
  onDocumentUpdate: PropTypes.func,
  onPreviewDocument: PropTypes.func,
};

TaskAttachmentsCard.defaultProps = {
  documents: [],
  onDocumentUpdate: () => {},
  onPreviewDocument: () => {},
};

export default TaskAttachmentsCard;
