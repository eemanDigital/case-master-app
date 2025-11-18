import React from "react";
import PropTypes from "prop-types";
import {
  Card,
  List,
  Button,
  Space,
  Tooltip,
  Modal,
  Typography,
  Empty,
  Tag,
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
} from "@ant-design/icons";

const { Title, Text } = Typography;

const TaskAttachmentsCard = ({
  documents = [],
  task,
  baseURL,
  handleDeleteDocument,
  handleGeneralDownload,
  onPreviewDocument,
}) => {
  const getFileIcon = (fileName, mimeType, fileUrl) => {
    const ext = fileName?.split(".").pop()?.toLowerCase();

    // Check by MIME type first
    if (mimeType) {
      if (mimeType.includes("pdf"))
        return <FilePdfOutlined className="text-red-500" />;
      if (mimeType.includes("image"))
        return <FileImageOutlined className="text-green-500" />;
      if (mimeType.includes("word") || mimeType.includes("document"))
        return <FileWordOutlined className="text-blue-500" />;
      if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
        return <FileExcelOutlined className="text-green-600" />;
      if (mimeType.includes("zip") || mimeType.includes("compressed"))
        return <FileZipOutlined className="text-orange-500" />;
    }

    // Check file URL for extensions if no mimeType
    const url = fileUrl?.toLowerCase() || "";
    if (url.includes(".pdf"))
      return <FilePdfOutlined className="text-red-500" />;
    if (url.includes(".doc") || url.includes(".docx"))
      return <FileWordOutlined className="text-blue-500" />;
    if (url.includes(".xls") || url.includes(".xlsx"))
      return <FileExcelOutlined className="text-green-600" />;
    if (url.match(/\.(jpg|jpeg|png|gif|bmp|svg)/))
      return <FileImageOutlined className="text-green-500" />;
    if (url.match(/\.(zip|rar|7z)/))
      return <FileZipOutlined className="text-orange-500" />;

    // Fallback to file extension
    switch (ext) {
      case "pdf":
        return <FilePdfOutlined className="text-red-500" />;
      case "doc":
      case "docx":
        return <FileWordOutlined className="text-blue-500" />;
      case "xls":
      case "xlsx":
        return <FileExcelOutlined className="text-green-600" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "bmp":
      case "svg":
        return <FileImageOutlined className="text-green-500" />;
      case "zip":
      case "rar":
      case "7z":
        return <FileZipOutlined className="text-orange-500" />;
      case "txt":
      case "rtf":
        return <FileTextOutlined className="text-gray-500" />;
      default:
        return <FileOutlined className="text-gray-400" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileType = (mimeType, fileName, fileUrl) => {
    if (mimeType) {
      if (mimeType.includes("pdf")) return "PDF Document";
      if (mimeType.includes("image")) return "Image";
      if (mimeType.includes("word") || mimeType.includes("document"))
        return "Word Document";
      if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
        return "Excel Spreadsheet";
      if (mimeType.includes("zip") || mimeType.includes("compressed"))
        return "Compressed File";
      if (mimeType.includes("text")) return "Text File";
    }

    // Extract from URL if no mimeType
    const url = fileUrl?.toLowerCase() || "";
    if (url.includes(".pdf")) return "PDF Document";
    if (url.includes(".doc") || url.includes(".docx")) return "Word Document";
    if (url.includes(".xls") || url.includes(".xlsx"))
      return "Excel Spreadsheet";
    if (url.match(/\.(jpg|jpeg|png|gif|bmp|svg)/)) return "Image";
    if (url.match(/\.(zip|rar|7z)/)) return "Compressed File";

    const ext = fileName?.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return "PDF Document";
      case "doc":
      case "docx":
        return "Word Document";
      case "xls":
      case "xlsx":
        return "Excel Spreadsheet";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "Image";
      case "zip":
      case "rar":
      case "7z":
        return "Compressed File";
      case "txt":
      case "rtf":
        return "Text File";
      default:
        return "File";
    }
  };

  const canDeleteDocument = (document) => {
    // Only allow deletion if user is the uploader, task creator, or admin
    const currentUser = JSON.parse(localStorage.getItem("user"))?.data?._id;
    return (
      document.uploadedBy?._id === currentUser ||
      task?.assignedBy?._id === currentUser ||
      ["super-admin", "admin"].includes(
        JSON.parse(localStorage.getItem("user"))?.data?.role
      )
    );
  };

  const handleDownload = (doc) => {
    if (doc.file) {
      // If we have a direct file URL, use it
      handleGeneralDownload(doc.file, doc.fileName);
    } else if (baseURL && task?._id && doc._id) {
      // If we need to construct the download URL
      const downloadUrl = `${baseURL}/tasks/${task._id}/documents/${doc._id}/download`;
      handleGeneralDownload(downloadUrl, doc.fileName);
    } else {
      console.error("Cannot determine download URL for document:", doc);
    }
  };

  const handleDelete = (doc) => {
    Modal.confirm({
      title: "Delete Document",
      content: `Are you sure you want to delete "${doc.fileName}"? This action cannot be undone.`,
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => handleDeleteDocument(doc._id || doc.id),
    });
  };

  return (
    <Card
      className="border-0 rounded-2xl shadow-sm"
      bodyStyle={{ padding: "24px" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileTextOutlined className="text-blue-600 text-lg" />
          <Title level={3} className="m-0 text-gray-900">
            Attachments
          </Title>
        </div>
        <Tag color="blue" className="text-sm">
          {documents.length} file{documents.length !== 1 ? "s" : ""}
        </Tag>
      </div>

      {documents.length > 0 ? (
        <List
          dataSource={documents}
          renderItem={(doc, index) => (
            <List.Item
              className="border-0 hover:bg-gray-50 rounded-lg p-4 transition-colors duration-200"
              // Update the TaskAttachmentsCard to include preview functionality
              // Add this to the actions array in the List.Item:

              actions={[
                <Tooltip title="Preview" key="preview">
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => onPreviewDocument?.(doc)}
                    className="text-green-500 hover:text-green-700"
                  />
                </Tooltip>,
                <Tooltip title="Download" key="download">
                  <Button
                    type="text"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(doc)}
                    className="text-blue-500 hover:text-blue-700"
                  />
                </Tooltip>,
                canDeleteDocument(doc) && (
                  <Tooltip title="Delete" key="delete">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(doc)}
                      className="text-red-500 hover:text-red-700"
                    />
                  </Tooltip>
                ),
              ].filter(Boolean)}>
              <List.Item.Meta
                avatar={
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                    {getFileIcon(doc.fileName, doc.mimeType, doc.file)}
                  </div>
                }
                title={
                  <div className="flex items-start justify-between">
                    <Text
                      strong
                      className="text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => handleDownload(doc)}>
                      {doc.fileName}
                    </Text>
                  </div>
                }
                description={
                  <Space direction="vertical" size={2} className="mt-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Tag color="default" className="text-xs">
                        {getFileType(doc.mimeType, doc.fileName, doc.file)}
                      </Tag>
                      {doc.fileSize ? (
                        <Text type="secondary" className="text-xs">
                          {formatFileSize(doc.fileSize)}
                        </Text>
                      ) : (
                        <Text type="secondary" className="text-xs">
                          Size unknown
                        </Text>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Text>
                        Uploaded{" "}
                        {doc.uploadedBy?.firstName
                          ? `by ${doc.uploadedBy.firstName}`
                          : ""}
                      </Text>
                      <span>•</span>
                      <Text>
                        {doc.uploadedAt
                          ? new Date(doc.uploadedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : doc.createdAt
                          ? new Date(doc.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "Unknown date"}
                      </Text>
                    </div>
                  </Space>
                }
              />
            </List.Item>
          )}
          className="attachment-list"
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="text-center py-8">
              <FileOutlined className="text-4xl text-gray-300 mb-3" />
              <Text type="secondary" className="text-lg block mb-2">
                No attachments yet
              </Text>
              <Text type="secondary" className="text-sm">
                Upload documents related to this task
              </Text>
            </div>
          }
        />
      )}

      {/* Upload Info */}
      {documents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Text type="secondary" className="text-xs">
            Click on a file name to download. Only uploaders and task managers
            can delete files.
          </Text>
        </div>
      )}
    </Card>
  );
};

TaskAttachmentsCard.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      fileName: PropTypes.string.isRequired,
      file: PropTypes.string,
      mimeType: PropTypes.string,
      fileSize: PropTypes.number,
      uploadedBy: PropTypes.shape({
        _id: PropTypes.string,
        firstName: PropTypes.string,
      }),
      uploadedAt: PropTypes.string,
      createdAt: PropTypes.string,
    })
  ),
  task: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    assignedBy: PropTypes.shape({
      _id: PropTypes.string,
    }),
  }).isRequired,
  baseURL: PropTypes.string,
  handleDeleteDocument: PropTypes.func.isRequired,
  handleGeneralDownload: PropTypes.func.isRequired,
};

TaskAttachmentsCard.defaultProps = {
  documents: [],
  baseURL: "",
};

export default TaskAttachmentsCard;
