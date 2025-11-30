// components/TaskAttachmentsCard.js
import PropTypes from "prop-types";
import { RiDeleteBin2Line } from "react-icons/ri";
import { FaDownload, FaPaperclip, FaReply } from "react-icons/fa";

import {
  Modal,
  Button,
  Card,
  Tag,
  Space,
  Divider,
  Empty,
  Tooltip,
  Spin,
} from "antd";
import { formatDate } from "../utils/formatDate";

const TaskAttachmentsCard = ({
  fileManager,
  showUploadSection = false,
  onUploadClick,
}) => {
  const {
    files,
    downloadFile,
    deleteFile,
    isOperationInProgress,
    loading,
    statistics,
  } = fileManager;

  console.log("📁 TaskAttachmentsCard files:", files);

  // Extract documents by type using file metadata
  // const referenceDocuments =
  //   files.filter(
  //     (file) =>
  //       file.metadata?.uploadType === "task-reference" ||
  //       file.category === "task-reference"
  //   ) || [];

  // const responseDocuments =
  //   files.filter(
  //     (file) =>
  //       file.metadata?.uploadType === "task-response" ||
  //       file.category === "task-response"
  //   ) || [];

  // console.log("📋 Reference Documents:", referenceDocuments);
  // console.log("📋 Response Documents:", responseDocuments);

  const getFileIcon = (fileName) => {
    const extension = fileName?.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "📄";
      case "doc":
      case "docx":
        return "📝";
      case "xls":
      case "xlsx":
        return "📊";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "🖼️";
      case "zip":
      case "rar":
        return "📦";
      default:
        return "📎";
    }
  };

  const getFileSize = (sizeInBytes) => {
    if (!sizeInBytes) return "Unknown size";
    const sizeInMB = sizeInBytes / (1024 * 1024);
    return sizeInMB < 1
      ? `${(sizeInBytes / 1024).toFixed(1)} KB`
      : `${sizeInMB.toFixed(1)} MB`;
  };

  const handleDownload = async (document) => {
    try {
      await downloadFile(document);
    } catch (error) {
      // Error is already handled by the fileManager
      console.error("Download failed:", error);
    }
  };

  const handleDelete = (document) => {
    Modal.confirm({
      title: "Delete Document",
      content: `Are you sure you want to delete "${document.fileName}"?`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => deleteFile(document),
    });
  };

  if (loading && statistics.totalFiles === 0) {
    return (
      <Card className="mb-8 mt-3 shadow-sm">
        <div className="text-center py-8">
          <Spin size="large" />
          <p className="text-gray-500 mt-2">Loading documents...</p>
        </div>
      </Card>
    );
  }

  if (statistics.totalFiles === 0) {
    return (
      <Card className="mb-8 mt-3 shadow-sm">
        <div className="text-center py-8">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No documents attached to this task"
          />
          <p className="text-gray-500 mt-2">
            Upload reference documents or response files to get started
          </p>
          {showUploadSection && onUploadClick && (
            <Button type="primary" className="mt-4" onClick={onUploadClick}>
              Upload Documents
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Task Documents</span>
          <Space>
            {files.length > 0 && (
              <Tag color="blue">{files.length} Reference</Tag>
            )}
            {/* {responseDocuments.length > 0 && (
              <Tag color="green">{responseDocuments.length} Response</Tag>
            )} */}
            {showUploadSection && onUploadClick && (
              <Button type="dashed" size="small" onClick={onUploadClick}>
                Add Documents
              </Button>
            )}
          </Space>
        </div>
      }
      className="mb-8 mt-3 shadow-sm"
      loading={loading}>
      {/* Reference Documents Section */}
      {files.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <FaPaperclip className="text-blue-500 mr-2" />
            <h3 className="text-md font-semibold text-gray-700">
              Reference Documents ({files.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {files.map((document) => (
              <DocumentCard
                key={`ref-${document._id || document.id}`}
                document={document}
                type="reference"
                onDownload={handleDownload}
                onDelete={handleDelete}
                getFileIcon={getFileIcon}
                getFileSize={getFileSize}
                isOperationInProgress={isOperationInProgress}
              />
            ))}
          </div>
          {/* {responseDocuments.length > 0 && <Divider className="my-6" />} */}
        </div>
      )}

      {/* Response Documents Section */}
      {/* {responseDocuments.length > 0 && (
        <div>
          <div className="flex items-center mb-3">
            <FaReply className="text-green-500 mr-2" />
            <h3 className="text-md font-semibold text-gray-700">
              Response Documents ({responseDocuments.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {responseDocuments.map((document) => (
              <DocumentCard
                key={`resp-${document._id || document.id}`}
                document={document}
                type="response"
                responseInfo={document.metadata}
                onDownload={handleDownload}
                onDelete={handleDelete}
                getFileIcon={getFileIcon}
                getFileSize={getFileSize}
                isOperationInProgress={isOperationInProgress}
              />
            ))}
          </div>
        </div>
      )} */}

      {/* Total Statistics */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Total documents: {statistics.totalFiles}</span>
          <span>Total size: {getFileSize(statistics.totalSize)}</span>
        </div>
      </div>
    </Card>
  );
};

// Separate Document Card Component
const DocumentCard = ({
  document,
  type,
  responseInfo,
  onDownload,
  onDelete,
  getFileIcon,
  getFileSize,
  isOperationInProgress,
}) => {
  const fileId = document._id || document.id;

  console.log(document, "document");
  const isDownloading = isOperationInProgress(document);
  const isDeleting = isOperationInProgress(document);

  const getDocumentTypeColor = () => {
    return type === "reference" ? "blue" : "green";
  };

  const getDocumentTypeText = () => {
    return type === "reference" ? "Reference" : "Response";
  };

  return (
    <Card
      size="small"
      className="relative hover:shadow-md transition-shadow duration-200"
      bodyStyle={{ padding: "12px" }}>
      {/* Delete Button */}
      <Tooltip title="Delete document">
        <button
          className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
          onClick={() => onDelete(document)}
          disabled={isDeleting || isDownloading}>
          <RiDeleteBin2Line className="text-sm" />
        </button>
      </Tooltip>

      {/* Document Icon and Basic Info */}
      <div className="flex items-start mb-3">
        <span className="text-2xl mr-3">{getFileIcon(document.fileName)}</span>
        <div className="flex-1 min-w-0">
          <Tooltip title={document.fileName}>
            <p className="text-sm font-medium text-gray-800 truncate mb-1">
              {document.fileName}
            </p>
          </Tooltip>
          <Tag color={getDocumentTypeColor()} size="small">
            {getDocumentTypeText()}
          </Tag>
        </div>
      </div>

      {/* Document Metadata */}
      <div className="space-y-1 text-xs text-gray-600 mb-3">
        {document.fileSize && <div>Size: {getFileSize(document.fileSize)}</div>}
        {document.createdAt && (
          <div>Uploaded: {formatDate(document.createdAt)}</div>
        )}
        {document.uploadedBy && (
          <div className="truncate">
            By: {document.uploadedBy.firstName} {document.uploadedBy.lastName}
          </div>
        )}
        {responseInfo && (
          <>
            {responseInfo.respondedBy && (
              <div className="truncate">
                Response by: {responseInfo.respondedBy?.firstName}{" "}
                {responseInfo.respondedBy?.lastName}
              </div>
            )}
            {responseInfo.submittedAt && (
              <div>Submitted: {formatDate(responseInfo.submittedAt)}</div>
            )}
          </>
        )}
        {document.description && (
          <Tooltip title={document.description}>
            <div className="truncate text-gray-500">{document.description}</div>
          </Tooltip>
        )}
        {document.downloadCount > 0 && (
          <div className="text-xs text-gray-500">
            Downloaded {document.downloadCount} time(s)
          </div>
        )}
      </div>

      {/* Download Button */}
      <Button
        type="primary"
        size="small"
        icon={<FaDownload />}
        onClick={() => onDownload(document)}
        loading={isDownloading}
        disabled={isDeleting}
        className="w-full">
        {isDownloading ? "Downloading..." : "Download"}
      </Button>
    </Card>
  );
};

TaskAttachmentsCard.propTypes = {
  fileManager: PropTypes.shape({
    files: PropTypes.array.isRequired,
    downloadFile: PropTypes.func.isRequired,
    deleteFile: PropTypes.func.isRequired,
    isOperationInProgress: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    statistics: PropTypes.shape({
      totalFiles: PropTypes.number,
      totalSize: PropTypes.number,
    }).isRequired,
  }).isRequired,
  showUploadSection: PropTypes.bool,
  onUploadClick: PropTypes.func,
};

DocumentCard.propTypes = {
  document: PropTypes.object.isRequired,
  type: PropTypes.oneOf(["reference", "response"]).isRequired,
  responseInfo: PropTypes.object,
  onDownload: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  getFileIcon: PropTypes.func.isRequired,
  getFileSize: PropTypes.func.isRequired,
  isOperationInProgress: PropTypes.func.isRequired,
};

export default TaskAttachmentsCard;
