// // components/CaseDocuments.js

import { Card, Button, List, Tag, Space, Spin, Empty, Typography } from "antd";
import {
  DownloadOutlined,
  DeleteOutlined,
  FileOutlined,
} from "@ant-design/icons";
import useFileManager from "../hooks/useFileManager";

const { Text, Title } = Typography;

const CaseDocuments = ({ caseId }) => {
  const {
    files,
    loading,
    downloadFile,
    deleteFile,
    operationInProgress,
    statistics,
    refreshFiles,
  } = useFileManager("Case", caseId, {
    enableNotifications: true,
    autoFetch: true,
  });

  console.log("📁 Case Documents:", { files, caseId, statistics });

  const handleDownload = async (file) => {
    try {
      await downloadFile(file);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleDelete = async (file) => {
    if (
      !window.confirm(`Are you sure you want to delete "${file.fileName}"?`)
    ) {
      return;
    }

    const success = await deleteFile(file);
    if (success) {
      console.log("✅ File deleted successfully");
    }
  };

  const getFileIcon = (fileType) => {
    const type = fileType?.toLowerCase();
    if (type?.includes("pdf")) return "📄";
    if (type?.includes("doc")) return "📝";
    if (type?.includes("xls")) return "📊";
    if (type?.includes("image") || type?.match(/(jpg|jpeg|png|gif)/))
      return "🖼️";
    if (type?.includes("zip") || type?.includes("rar")) return "📦";
    return "📎";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown";
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && files.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading documents...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <FileOutlined />
          <span>Case Documents</span>
          <Tag color="blue">{statistics.totalFiles} files</Tag>
          {statistics.totalSize > 0 && (
            <Tag color="green">{formatFileSize(statistics.totalSize)}</Tag>
          )}
        </Space>
      }
      extra={
        <Button type="link" onClick={refreshFiles} disabled={loading}>
          Refresh
        </Button>
      }>
      {files.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No documents uploaded yet"
        />
      ) : (
        <List
          dataSource={files}
          renderItem={(file) => {
            const isDownloading =
              operationInProgress === `download-${file._id}`;
            const isDeleting = operationInProgress === `delete-${file._id}`;

            return (
              <List.Item
                actions={[
                  <Button
                    key={caseId}
                    type="link"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(file)}
                    loading={isDownloading}
                    disabled={isDeleting}>
                    {isDownloading ? "Downloading..." : "Download"}
                  </Button>,
                  <Button
                    key={caseId + "-delete"}
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(file)}
                    loading={isDeleting}
                    disabled={isDownloading}>
                    Delete
                  </Button>,
                ]}>
                <List.Item.Meta
                  avatar={
                    <span style={{ fontSize: "24px" }}>
                      {getFileIcon(file.fileType)}
                    </span>
                  }
                  title={
                    <Space>
                      <Text strong>{file.fileName}</Text>
                      <Tag size="small">{file.fileType?.toUpperCase()}</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">
                        {formatFileSize(file.fileSize)} • Uploaded{" "}
                        {formatDate(file.createdAt)}
                      </Text>
                      {file.uploadedBy && (
                        <Text type="secondary">
                          By {file.uploadedBy.firstName}{" "}
                          {file.uploadedBy.lastName}
                        </Text>
                      )}
                      {file.downloadCount > 0 && (
                        <Text type="secondary">
                          Downloaded {file.downloadCount} time(s)
                        </Text>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
};

export default CaseDocuments;
