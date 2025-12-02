// components/DocumentsList.jsx
import PropTypes from "prop-types";
import { useState, useEffect, useMemo } from "react";
import {
  Table,
  Card,
  Space,
  Tag,
  Button,
  Popconfirm,
  Input,
  Select,
  Tooltip,
  Badge,
  Typography,
  Modal,
  Row,
  Col,
  Statistic,
  Empty,
  Dropdown,
  Menu,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileZipOutlined,
  MoreOutlined,
  ReloadOutlined,
  FolderOutlined,
  CloudUploadOutlined,
  FilterOutlined,
  SortAscendingOutlined,
} from "@ant-design/icons";
import { formatDate } from "../utils/formatDate";
import useFileManager from "../hooks/useFileManager";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import FileUploader from "./FileUpload";

const { Text, Title } = Typography;
const { Option } = Select;

const DocumentsList = ({
  entityType = null,
  entityId = null,
  showUploader = true,
  uploaderProps = {},
  title = "Documents",
}) => {
  const { user } = useSelector((state) => state.auth);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [batchActionLoading, setBatchActionLoading] = useState(false);

  // Initialize file manager - Use fetchGeneralFiles for documents without entity
  const {
    files,
    loading,
    downloadFile,
    deleteFile,
    fetchFiles,
    operationInProgress,
    statistics,
    bulkDeleteFiles,
  } = useFileManager(entityType, entityId, {
    autoFetch: true,
    enableNotifications: false, // Disable notifications, we'll use toast
    fetchGeneralFiles: !entityId, // Fetch general files if no entityId
  });

  // Fetch files on mount
  useEffect(() => {
    fetchFiles();
  }, []);

  // Get file icon based on file type
  const getFileIcon = (file, size = "20px") => {
    const extension = file.fileType?.toLowerCase();
    const mimeType = file.mimeType?.toLowerCase();

    const iconStyle = { fontSize: size };

    if (extension === "pdf" || mimeType?.includes("pdf")) {
      return <FilePdfOutlined style={{ ...iconStyle, color: "#ff4d4f" }} />;
    }
    if (
      extension === "doc" ||
      extension === "docx" ||
      mimeType?.includes("word")
    ) {
      return <FileWordOutlined style={{ ...iconStyle, color: "#1890ff" }} />;
    }
    if (
      extension === "xls" ||
      extension === "xlsx" ||
      mimeType?.includes("excel")
    ) {
      return <FileExcelOutlined style={{ ...iconStyle, color: "#52c41a" }} />;
    }
    if (
      ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(extension) ||
      mimeType?.includes("image")
    ) {
      return <FileImageOutlined style={{ ...iconStyle, color: "#faad14" }} />;
    }
    if (
      extension === "zip" ||
      extension === "rar" ||
      extension === "7z" ||
      extension === "tar" ||
      extension === "gz" ||
      mimeType?.includes("zip") ||
      mimeType?.includes("archive")
    ) {
      return <FileZipOutlined style={{ ...iconStyle, color: "#722ed1" }} />;
    }
    if (extension === "txt" || mimeType?.includes("text")) {
      return <FileOutlined style={{ ...iconStyle, color: "#8c8c8c" }} />;
    }
    return <FileOutlined style={{ ...iconStyle, color: "#13c2c2" }} />;
  };

  // Check if user can delete file
  const canDeleteFile = (file) => {
    if (!file || !user) return false;

    const isFileOwner =
      file.uploadedBy?._id?.toString() === user?.data?._id?.toString();
    const isAdmin = ["admin", "super-admin"].includes(user?.data?.role);

    return isFileOwner || isAdmin;
  };

  // Handle file download
  const handleDownload = async (file, event) => {
    event?.stopPropagation();

    try {
      await downloadFile(file);
      toast.success(`Downloading ${file.fileName}...`);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error(`Failed to download ${file.fileName}`);
    }
  };

  // Handle file deletion
  const handleDelete = async (file, event) => {
    event?.stopPropagation();

    try {
      const success = await deleteFile(file);
      if (success) {
        toast.success(`${file.fileName} deleted successfully`);
        setSelectedFiles((prev) => prev.filter((id) => id !== file._id));
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(`Failed to delete ${file.fileName}`);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) {
      toast.warning("No files selected for deletion");
      return;
    }

    setBatchActionLoading(true);
    try {
      const success = await bulkDeleteFiles(selectedFiles);
      if (success) {
        toast.success(`Successfully deleted ${selectedFiles.length} file(s)`);
        setSelectedFiles([]);
      }
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast.error("Failed to delete selected files");
    } finally {
      setBatchActionLoading(false);
    }
  };

  // Handle bulk download
  const handleBulkDownload = async () => {
    if (selectedFiles.length === 0) {
      toast.warning("No files selected for download");
      return;
    }

    setBatchActionLoading(true);
    try {
      // Download each file individually
      for (const fileId of selectedFiles) {
        const file = files.find((f) => f._id === fileId);
        if (file) {
          await downloadFile(file);
        }
      }
      toast.success(`Downloading ${selectedFiles.length} file(s)...`);
    } catch (error) {
      console.error("Bulk download failed:", error);
      toast.error("Failed to download selected files");
    } finally {
      setBatchActionLoading(false);
    }
  };

  // Open file preview
  const openPreview = (file) => {
    setSelectedFile(file);
    setPreviewModalVisible(true);
  };

  // Handle file selection
  const handleFileSelect = (fileId) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map((file) => file._id));
    }
  };

  // Filter files based on search, category, and date
  // Filter files based on search, category, and date
  const filteredFiles = useMemo(() => {
    let result = files.filter((file) => !file.isDeleted);

    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        (file) =>
          file.fileName?.toLowerCase().includes(searchLower) ||
          file.description?.toLowerCase().includes(searchLower) ||
          file.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) ||
          file.uploadedBy?.firstName?.toLowerCase().includes(searchLower) ||
          file.uploadedBy?.lastName?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter((file) => file.category === categoryFilter);
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();

      switch (dateFilter) {
        case "today":
          result = result.filter((file) => {
            const fileDate = new Date(file.createdAt);
            return fileDate.toDateString() === now.toDateString();
          });
          break;
        case "week":
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          result = result.filter((file) => {
            const fileDate = new Date(file.createdAt);
            return fileDate > weekAgo;
          });
          break;
        case "month":
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          result = result.filter((file) => {
            const fileDate = new Date(file.createdAt);
            return fileDate > monthAgo;
          });
          break;
        case "year":
          const yearAgo = new Date();
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          result = result.filter((file) => {
            const fileDate = new Date(file.createdAt);
            return fileDate > yearAgo;
          });
          break;
        default:
          break;
      }
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "fileName":
          aValue = a.fileName?.toLowerCase();
          bValue = b.fileName?.toLowerCase();
          break;
        case "fileSize":
          aValue = a.fileSize;
          bValue = b.fileSize;
          break;
        case "downloadCount":
          aValue = a.downloadCount || 0;
          bValue = b.downloadCount || 0;
          break;
        case "createdAt":
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [files, searchText, categoryFilter, dateFilter, sortBy, sortOrder]);

  // Table columns
  const columns = [
    {
      title: (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={
              selectedFiles.length === filteredFiles.length &&
              filteredFiles.length > 0
            }
            onChange={handleSelectAll}
            className="mr-2"
          />
          File
        </div>
      ),
      key: "fileName",
      render: (_, file) => (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedFiles.includes(file._id)}
            onChange={() => handleFileSelect(file._id)}
            className="mr-3"
          />
          <Space>
            {getFileIcon(file)}
            <div className="min-w-0">
              <div
                className="font-medium truncate max-w-xs cursor-pointer hover:text-blue-500"
                onClick={() => openPreview(file)}
                title={file.fileName}>
                {file.fileName}
              </div>
              {file.description && (
                <div className="text-xs text-gray-500 truncate max-w-xs">
                  {file.description}
                </div>
              )}
            </div>
          </Space>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (category) => {
        const categoryColors = {
          general: "default",
          legal: "blue",
          contract: "green",
          court: "purple",
          correspondence: "orange",
          client: "cyan",
          internal: "geekblue",
          report: "volcano",
          "case-document": "magenta",
          "task-document": "gold",
          other: "gray",
        };
        return (
          <Tag
            color={categoryColors[category] || "default"}
            className="capitalize whitespace-nowrap">
            {category?.replace("-", " ") || "general"}
          </Tag>
        );
      },
    },
    {
      title: "Uploaded By",
      key: "uploadedBy",
      width: 150,
      render: (_, file) => (
        <div className="min-w-0">
          <div className="font-medium truncate">
            {file.uploadedBy?.firstName || "Unknown"}{" "}
            {file.uploadedBy?.lastName || ""}
          </div>
          <div className="text-xs text-gray-500">
            {file.createdAt ? formatDate(file.createdAt, "MMM D, YYYY") : "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Size",
      key: "fileSize",
      width: 100,
      render: (_, file) => (
        <div>
          <div>{file.fileSizeMB || "0"} MB</div>
          <div className="text-xs text-gray-500">
            {file.downloadCount || 0} download
            {file.downloadCount !== 1 ? "s" : ""}
          </div>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, file) => {
        const isDownloading = operationInProgress === `download-${file._id}`;
        const isDeleting = operationInProgress === `delete-${file._id}`;

        const menu = (
          <Menu>
            <Menu.Item
              key="preview"
              icon={<EyeOutlined />}
              onClick={() => openPreview(file)}>
              Preview
            </Menu.Item>
            <Menu.Item
              key="download"
              icon={<DownloadOutlined />}
              onClick={(e) => handleDownload(file, e)}
              disabled={isDownloading || isDeleting}>
              Download
            </Menu.Item>
            {canDeleteFile(file) && (
              <Menu.Item
                key="delete"
                icon={<DeleteOutlined />}
                danger
                onClick={(e) => {
                  e.domEvent.stopPropagation();
                  handleDelete(file, e);
                }}
                disabled={isDownloading || isDeleting}>
                Delete
              </Menu.Item>
            )}
          </Menu>
        );

        return (
          <Space>
            <Tooltip title="Preview">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => openPreview(file)}
              />
            </Tooltip>
            <Tooltip title="Download">
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                loading={isDownloading}
                onClick={(e) => handleDownload(file, e)}
                disabled={isDeleting}
              />
            </Tooltip>
            <Dropdown overlay={menu} trigger={["click"]}>
              <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  // File Preview Modal Component
  const FilePreviewModal = () => {
    if (!selectedFile) return null;

    const isImage = selectedFile.mimeType?.startsWith("image/");
    const isPDF =
      selectedFile.fileType === "pdf" || selectedFile.mimeType?.includes("pdf");

    return (
      <Modal
        title={
          <Space>
            {getFileIcon(selectedFile)}
            <span className="truncate max-w-md" title={selectedFile.fileName}>
              {selectedFile.fileName}
            </span>
          </Space>
        }
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={(e) => handleDownload(selectedFile, e)}>
            Download
          </Button>,
          canDeleteFile(selectedFile) && (
            <Popconfirm
              key="delete"
              title="Delete File"
              description="Are you sure you want to delete this file?"
              onConfirm={(e) => handleDelete(selectedFile, e)}
              okText="Delete"
              cancelText="Cancel"
              okType="danger">
              <Button danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          ),
        ].filter(Boolean)}
        width={800}
        className="file-preview-modal">
        <div className="space-y-6">
          {/* File Preview */}
          {isImage ? (
            <div className="text-center">
              <img
                src={selectedFile.fileUrl}
                alt={selectedFile.fileName}
                className="max-w-full max-h-96 mx-auto rounded shadow"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://via.placeholder.com/400x300?text=Image+Not+Available";
                }}
              />
            </div>
          ) : isPDF ? (
            <div className="h-96">
              <iframe
                src={`${selectedFile.fileUrl}#view=fitH`}
                title={selectedFile.fileName}
                className="w-full h-full border rounded"
                frameBorder="0"
              />
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded">
              <FileOutlined style={{ fontSize: "64px", color: "#8c8c8c" }} />
              <div className="mt-4 text-gray-600">
                Preview not available for this file type
              </div>
              <Button
                type="link"
                onClick={(e) => handleDownload(selectedFile, e)}
                className="mt-2">
                Download to view
              </Button>
            </div>
          )}

          {/* File Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Text strong className="block mb-1">
                  File Information
                </Text>
                <div className="bg-gray-50 p-3 rounded space-y-2">
                  <div className="flex justify-between">
                    <Text type="secondary">Name:</Text>
                    <Text>{selectedFile.fileName}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text type="secondary">Size:</Text>
                    <Text>{selectedFile.fileSizeMB || "0"} MB</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text type="secondary">Type:</Text>
                    <Text className="uppercase">
                      {selectedFile.fileType || "Unknown"}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text type="secondary">MIME Type:</Text>
                    <Text>{selectedFile.mimeType || "Unknown"}</Text>
                  </div>
                </div>
              </div>

              {selectedFile.description && (
                <div>
                  <Text strong className="block mb-1">
                    Description
                  </Text>
                  <div className="bg-gray-50 p-3 rounded">
                    <Text className="whitespace-pre-wrap">
                      {selectedFile.description}
                    </Text>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Text strong className="block mb-1">
                  Upload Information
                </Text>
                <div className="bg-gray-50 p-3 rounded space-y-2">
                  <div className="flex justify-between">
                    <Text type="secondary">Uploaded By:</Text>
                    <Text>
                      {selectedFile.uploadedBy?.firstName || "Unknown"}{" "}
                      {selectedFile.uploadedBy?.lastName || ""}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text type="secondary">Upload Date:</Text>
                    <Text>
                      {selectedFile.createdAt
                        ? formatDate(selectedFile.createdAt)
                        : "N/A"}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text type="secondary">Downloads:</Text>
                    <Text>{selectedFile.downloadCount || 0}</Text>
                  </div>
                  {selectedFile.lastDownloadedAt && (
                    <div className="flex justify-between">
                      <Text type="secondary">Last Downloaded:</Text>
                      <Text>{formatDate(selectedFile.lastDownloadedAt)}</Text>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Text strong className="block mb-1">
                  Categories & Tags
                </Text>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="mb-2">
                    <Tag color="blue" className="capitalize">
                      {selectedFile.category?.replace("-", " ") || "general"}
                    </Tag>
                  </div>
                  {selectedFile.tags && selectedFile.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedFile.tags.map((tag, index) => (
                        <Tag key={index} color="geekblue">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  // Calculate statistics
  const totalStorageMB = statistics.totalSizeMB || 0;
  const totalFiles = statistics.totalFiles || 0;
  const selectedFilesTotalSize = filteredFiles
    .filter((file) => selectedFiles.includes(file._id))
    .reduce((sum, file) => sum + parseFloat(file.fileSizeMB || 0), 0)
    .toFixed(2);

  // Sort options menu
  const sortMenu = (
    <Menu>
      <Menu.Item
        key="name-asc"
        onClick={() => {
          setSortBy("fileName");
          setSortOrder("asc");
        }}>
        Name (A-Z)
      </Menu.Item>
      <Menu.Item
        key="name-desc"
        onClick={() => {
          setSortBy("fileName");
          setSortOrder("desc");
        }}>
        Name (Z-A)
      </Menu.Item>
      <Menu.Item
        key="size-asc"
        onClick={() => {
          setSortBy("fileSize");
          setSortOrder("asc");
        }}>
        Size (Smallest)
      </Menu.Item>
      <Menu.Item
        key="size-desc"
        onClick={() => {
          setSortBy("fileSize");
          setSortOrder("desc");
        }}>
        Size (Largest)
      </Menu.Item>
      <Menu.Item
        key="date-asc"
        onClick={() => {
          setSortBy("createdAt");
          setSortOrder("asc");
        }}>
        Date (Oldest)
      </Menu.Item>
      <Menu.Item
        key="date-desc"
        onClick={() => {
          setSortBy("createdAt");
          setSortOrder("desc");
        }}>
        Date (Newest)
      </Menu.Item>
      <Menu.Item
        key="downloads-desc"
        onClick={() => {
          setSortBy("downloadCount");
          setSortOrder("desc");
        }}>
        Downloads (Most)
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="documents-list">
      {/* Header Section */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24}>
          <Card>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <Title level={4} className="mb-2">
                  <FolderOutlined className="mr-2" />
                  {title}
                </Title>
                <div className="flex items-center gap-4">
                  <Badge
                    count={totalFiles}
                    showZero
                    style={{ backgroundColor: "#1890ff" }}
                  />
                  <span className="text-gray-600">{totalFiles} files</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-600">
                    {totalStorageMB.toFixed(2)} MB total storage
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {showUploader && (
                  <FileUploader
                    entityType={entityType || "General"}
                    entityId={entityId}
                    category="general"
                    buttonText="Upload Documents"
                    buttonProps={{ type: "primary" }}
                    multiple={true}
                    onUploadSuccess={() => {
                      fetchFiles();
                      toast.success("Files uploaded successfully");
                    }}
                    onUploadError={(error) => {
                      toast.error(error.message || "Upload failed");
                    }}
                    {...uploaderProps}
                  />
                )}
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchFiles}
                  loading={loading}>
                  Refresh
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Files"
              value={totalFiles}
              prefix={<FileOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Storage Used"
              value={totalStorageMB.toFixed(2)}
              suffix="MB"
              prefix={<FolderOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Categories"
              value={statistics.categories?.length || 0}
              prefix={<FolderOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Average Size"
              value={(totalStorageMB / (totalFiles || 1)).toFixed(2)}
              suffix="MB"
              prefix={<FileOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Batch Actions */}
      {selectedFiles.length > 0 && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <Badge
                count={selectedFiles.length}
                showZero
                style={{ backgroundColor: "#1890ff" }}
              />
              <div>
                <Text strong>{selectedFiles.length} file(s) selected</Text>
                <div className="text-sm text-gray-600">
                  Total size: {selectedFilesTotalSize} MB
                </div>
              </div>
            </div>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleBulkDownload}
                loading={batchActionLoading}>
                Download Selected
              </Button>
              <Popconfirm
                title="Delete Selected Files"
                description={`Are you sure you want to delete ${selectedFiles.length} file(s)?`}
                onConfirm={handleBulkDelete}
                okText="Delete"
                cancelText="Cancel"
                okType="danger">
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  loading={batchActionLoading}>
                  Delete Selected
                </Button>
              </Popconfirm>
              <Button onClick={() => setSelectedFiles([])}>
                Clear Selection
              </Button>
            </Space>
          </div>
        </Card>
      )}

      {/* Filters Section */}
      <Card className="mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input
              placeholder="Search files by name, description, or tags..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
            />
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select
              placeholder="Category"
              prefix={<FilterOutlined />}
              allowClear
              value={categoryFilter === "all" ? undefined : categoryFilter}
              onChange={(value) => setCategoryFilter(value || "all")}
              style={{ width: "100%" }}
              size="large">
              <Option value="all">All Categories</Option>
              {statistics.categories?.map((category) => (
                <Option key={category} value={category}>
                  {category.charAt(0).toUpperCase() +
                    category.slice(1).replace("-", " ")}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select
              placeholder="Date"
              allowClear
              value={dateFilter === "all" ? undefined : dateFilter}
              onChange={(value) => setDateFilter(value || "all")}
              style={{ width: "100%" }}
              size="large">
              <Option value="all">All Time</Option>
              <Option value="today">Today</Option>
              <Option value="week">Last 7 Days</Option>
              <Option value="month">Last 30 Days</Option>
              <Option value="year">Last Year</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <div className="flex justify-end">
              <Dropdown overlay={sortMenu} trigger={["click"]}>
                <Button icon={<SortAscendingOutlined />} size="large">
                  Sort By
                </Button>
              </Dropdown>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Files Table */}
      <Card>
        {filteredFiles.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <div className="text-lg mb-2">No documents found</div>
                <div className="text-gray-500">
                  {searchText ||
                  categoryFilter !== "all" ||
                  dateFilter !== "all"
                    ? "Try changing your search or filters"
                    : "Upload your first document to get started"}
                </div>
              </div>
            }>
            {showUploader && (
              <FileUploader
                entityType={entityType || "General"}
                entityId={entityId}
                buttonProps={{ type: "primary", size: "large" }}
                buttonText="Upload Files"
                onUploadSuccess={() => {
                  fetchFiles();
                  toast.success("Files uploaded successfully");
                }}
              />
            )}
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredFiles}
            rowKey="_id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => (
                <div className="flex items-center gap-2">
                  Showing {range[0]}-{range[1]} of {total} files
                  {selectedFiles.length > 0 && (
                    <Tag color="blue">{selectedFiles.length} selected</Tag>
                  )}
                </div>
              ),
            }}
            scroll={{ x: 1000 }}
            rowClassName={(record) =>
              selectedFiles.includes(record._id) ? "bg-blue-50" : ""
            }
            onRow={(record) => ({
              onClick: (event) => {
                // Only handle row click if not clicking on buttons or checkboxes
                if (
                  !event.target.closest("button") &&
                  !event.target.closest('input[type="checkbox"]')
                ) {
                  openPreview(record);
                }
              },
            })}
          />
        )}
      </Card>

      {/* File Preview Modal */}
      <FilePreviewModal />
    </div>
  );
};

DocumentsList.propTypes = {
  entityType: PropTypes.string,
  entityId: PropTypes.string,
  showUploader: PropTypes.bool,
  uploaderProps: PropTypes.object,
  title: PropTypes.string,
};

DocumentsList.defaultProps = {
  entityType: null,
  showUploader: true,
  uploaderProps: {},
  title: "Documents",
};

export default DocumentsList;
