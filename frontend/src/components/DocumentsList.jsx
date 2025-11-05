import { useState, useEffect, useCallback, useMemo } from "react";
import { formatDate } from "../utils/formatDate";
import {
  FaFileAlt,
  FaTrash,
  FaDownload,
  FaUserShield,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaFile,
} from "react-icons/fa";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useDataFetch } from "../hooks/useDataFetch";
import {
  Table,
  Button,
  Popconfirm,
  Tag,
  Tooltip,
  Select,
  Space,
  Badge,
} from "antd";
import { handleGeneralDownload } from "../utils/generalFileDownloadHandler";
import SearchBar from "./SearchBar";
import { toast } from "react-toastify";
import LoadingSpinner from "./LoadingSpinner";
import PageErrorAlert from "./PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const { Option } = Select;
const baseURL = import.meta.env.VITE_BASE_URL;

const DocumentsList = () => {
  const {
    documents,
    fetchData,
    error: errorDoc,
    loading: loadingDoc,
  } = useDataGetterHook();

  useRedirectLogoutUser("/users/login");

  const [searchResults, setSearchResults] = useState([]);
  const [filters, setFilters] = useState({
    category: "all",
    fileType: "all",
    sortBy: "-createdAt",
  });
  const { dataFetcher } = useDataFetch();

  // Fetch user's documents on component mount
  useEffect(() => {
    fetchData("documents", "documents");
  }, [fetchData]);

  // Apply filters and search to documents
  const filteredDocuments = useMemo(() => {
    if (!documents?.data?.files) return [];

    let filtered = [...documents.data.files];

    // Category filter
    if (filters.category !== "all") {
      filtered = filtered.filter((doc) => doc.category === filters.category);
    }

    // File type filter
    if (filters.fileType !== "all") {
      filtered = filtered.filter((doc) =>
        doc.fileType?.toLowerCase().includes(filters.fileType.toLowerCase())
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "-createdAt":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "createdAt":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "fileName":
          return a.fileName.localeCompare(b.fileName);
        case "-fileName":
          return b.fileName.localeCompare(a.fileName);
        case "-fileSize":
          return b.fileSize - a.fileSize;
        case "fileSize":
          return a.fileSize - b.fileSize;
        default:
          return 0;
      }
    });

    return filtered;
  }, [documents?.data?.files, filters]);

  // Update search results when filtered documents change
  useEffect(() => {
    setSearchResults(filteredDocuments);
  }, [filteredDocuments]);

  // Handle search
  const handleSearchChange = useCallback(
    (e) => {
      const searchTerm = e.target.value.trim().toLowerCase();
      if (!searchTerm) {
        setSearchResults(filteredDocuments);
        return;
      }

      const results = filteredDocuments.filter(
        (d) =>
          d.fileName?.toLowerCase().includes(searchTerm) ||
          d.originalName?.toLowerCase().includes(searchTerm) ||
          d.description?.toLowerCase().includes(searchTerm)
      );
      setSearchResults(results);
    },
    [filteredDocuments]
  );

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // Handle document deletion
  const deleteFile = async (id) => {
    try {
      const response = await dataFetcher(`documents/${id}`, "delete");

      if (response?.status === "success" || response?.message === "success") {
        console.log("Delete response:", response);
        // Refetch to get updated list
        await fetchData("documents", "documents");
        toast.success("Document deleted successfully");
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      toast.error(err.response?.data?.message || "Failed to delete document");
    }
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (!fileType) return <FaFile className="text-gray-500 text-lg" />;

    const type = fileType.toLowerCase();
    if (type.includes("pdf")) {
      return <FaFilePdf className="text-red-500 text-lg" />;
    }
    if (type.includes("word") || type.includes("document")) {
      return <FaFileWord className="text-blue-600 text-lg" />;
    }
    if (type.includes("sheet") || type.includes("excel")) {
      return <FaFileExcel className="text-green-600 text-lg" />;
    }
    if (type.includes("image")) {
      return <FaFileImage className="text-purple-500 text-lg" />;
    }
    return <FaFileAlt className="text-blue-500 text-lg" />;
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      legal: "blue",
      contract: "purple",
      court: "red",
      correspondence: "orange",
      client: "green",
      internal: "cyan",
      report: "magenta",
      general: "default",
      other: "gray",
    };
    return colors[category] || "default";
  };

  // Calculate storage statistics
  const storageStats = useMemo(() => {
    if (!documents?.data) return { totalFiles: 0, totalSize: 0 };

    const totalSize = documents?.data?.files?.reduce(
      (sum, doc) => sum + (doc.fileSize || 0),
      0
    );
    return {
      totalFiles: documents.data.length,
      totalSize: (totalSize / (1024 * 1024)).toFixed(2), // MB
    };
  }, [documents?.data]);

  // Define table columns
  const columns = [
    {
      title: "Document",
      dataIndex: "fileName",
      key: "fileName",
      render: (text, record) => (
        <div className="flex items-center space-x-3">
          {getFileIcon(record.fileType)}
          <div>
            <div className="font-medium text-gray-900">{text}</div>
            {record.originalName && record.originalName !== text && (
              <div className="text-xs text-gray-500">
                Original: {record.originalName}
              </div>
            )}
            {record.description && (
              <div className="text-xs text-gray-600 mt-1 max-w-md truncate">
                {record.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category) => (
        <Tag color={getCategoryColor(category)}>
          {category?.toUpperCase() || "GENERAL"}
        </Tag>
      ),
      width: 120,
    },
    {
      title: "Type",
      dataIndex: "fileType",
      key: "fileType",
      render: (type) => {
        const mimeMap = {
          "application/pdf": {
            label: "PDF",
            icon: <FaFilePdf color="#d32f2f" />,
          },
          "application/msword": {
            label: "DOC",
            icon: <FaFileWord color="#1976d2" />,
          },
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            {
              label: "DOCX",
              icon: <FaFileWord color="#1976d2" />,
            },
          "application/vnd.ms-excel": {
            label: "XLS",
            icon: <FaFileExcel color="#388e3c" />,
          },
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
            label: "XLSX",
            icon: <FaFileExcel color="#388e3c" />,
          },
          "image/jpeg": { label: "JPG", icon: <FaFileImage color="#fbc02d" /> },
          "image/png": { label: "PNG", icon: <FaFileImage color="#fbc02d" /> },
          "image/gif": { label: "GIF", icon: <FaFileImage color="#fbc02d" /> },
          "text/plain": { label: "TXT", icon: <FaFileAlt color="#616161" /> },
        };

        const fileInfo = mimeMap[type] || {
          label: type?.split("/")[1]?.toUpperCase() || "FILE",
          icon: <FaFile color="#9e9e9e" />,
        };

        return (
          <Tag
            color="blue"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Space size={4}>
              {fileInfo.icon}
              {fileInfo.label}
            </Space>
          </Tag>
        );
      },
      width: 120,
    },

    {
      title: "Upload Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => (
        <span className="text-gray-600">{formatDate(text)}</span>
      ),
      width: 150,
    },
    {
      title: "Size",
      dataIndex: "fileSize",
      key: "fileSize",
      render: (size) => (
        <span className="text-gray-500 text-sm">
          {size ? `${(size / 1024 / 1024).toFixed(2)} MB` : "N/A"}
        </span>
      ),
      width: 100,
      sorter: (a, b) => (a.fileSize || 0) - (b.fileSize || 0),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Download document">
            <Button
              type="primary"
              ghost
              size="small"
              onClick={(event) =>
                handleGeneralDownload(
                  event,
                  `${baseURL}/documents/${record._id}/download`,
                  record.fileName
                )
              }
              icon={<FaDownload />}>
              Download
            </Button>
          </Tooltip>

          <Popconfirm
            title="Delete Document"
            description="Are you sure? This will permanently delete the document from cloud storage."
            onConfirm={() => deleteFile(record._id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okType="danger">
            <Tooltip title="Delete document">
              <Button danger size="small" icon={<FaTrash />}>
                Delete
              </Button>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full p-4">
      {loadingDoc.documents && <LoadingSpinner />}

      {errorDoc.documents && (
        <PageErrorAlert
          errorCondition={errorDoc.documents}
          errorMessage={errorDoc.documents}
        />
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Documents</h2>
          <p className="text-gray-600 mt-1">
            Manage your uploaded documents securely
          </p>
          <div className="flex items-center space-x-4 mt-2">
            <Badge count={storageStats.totalFiles} showZero color="blue">
              <span className="text-sm text-gray-600">Total Files</span>
            </Badge>
            <span className="text-sm text-gray-600">
              Storage: {storageStats.totalSize} MB
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-green-600 mt-4 md:mt-0">
          <FaUserShield />
          <span className="text-sm font-medium">Private & Secure</span>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Documents
            </label>
            <SearchBar
              onSearch={handleSearchChange}
              placeholder="Search by name or description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <Select
              value={filters.category}
              onChange={(value) => handleFilterChange("category", value)}
              style={{ width: "100%" }}>
              <Option value="all">All Categories</Option>
              <Option value="general">General</Option>
              <Option value="legal">Legal</Option>
              <Option value="contract">Contract</Option>
              <Option value="court">Court</Option>
              <Option value="correspondence">Correspondence</Option>
              <Option value="client">Client</Option>
              <Option value="internal">Internal</Option>
              <Option value="report">Report</Option>
              <Option value="other">Other</Option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Type
            </label>
            <Select
              value={filters.fileType}
              onChange={(value) => handleFilterChange("fileType", value)}
              style={{ width: "100%" }}>
              <Option value="all">All Types</Option>
              <Option value="pdf">PDF</Option>
              <Option value="word">Word</Option>
              <Option value="excel">Excel</Option>
              <Option value="image">Image</Option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <Select
              value={filters.sortBy}
              onChange={(value) => handleFilterChange("sortBy", value)}
              style={{ width: "100%" }}>
              <Option value="-createdAt">Newest First</Option>
              <Option value="createdAt">Oldest First</Option>
              <Option value="fileName">Name A-Z</Option>
              <Option value="-fileName">Name Z-A</Option>
              <Option value="-fileSize">Largest First</Option>
              <Option value="fileSize">Smallest First</Option>
            </Select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      {searchResults.length > 0 ? (
        <div className="bg-white rounded-lg shadow">
          <Table
            dataSource={searchResults}
            columns={columns}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} documents`,
            }}
            scroll={{ x: 800 }}
          />
        </div>
      ) : (
        !loadingDoc.documents && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FaFileAlt className="text-4xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No documents found
            </h3>
            <p className="text-gray-500">
              {documents?.data?.length === 0
                ? "You haven't uploaded any documents yet."
                : "No documents match your current filters."}
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default DocumentsList;
