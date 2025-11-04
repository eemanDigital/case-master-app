import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { Link } from "react-router-dom";
import {
  Space,
  Table,
  Button,
  Modal,
  Tooltip,
  Select,
  DatePicker,
  Tag,
  Input,
} from "antd";
import { formatDate } from "../utils/formatDate";
import {
  DeleteOutlined,
  PlusOutlined,
  FilterOutlined,
  ReloadOutlined,
  EyeOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import LoadingSpinner from "../components/LoadingSpinner";
import { useEffect, useState, useRef } from "react"; // Added useRef
import { toast } from "react-toastify";
import { deleteData } from "../redux/features/delete/deleteSlice";
import PageErrorAlert from "../components/PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import ButtonWithIcon from "../components/ButtonWithIcon";

const { RangePicker } = DatePicker;
const { Option } = Select;

const DocumentRecordList = () => {
  const {
    documentRecord,
    loading: loadingDocumentRecord,
    error: errorDocumentRecord,
    fetchData,
  } = useDataGetterHook();

  const [filters, setFilters] = useState({
    search: "",
    documentType: "",
    sender: "",
    startDate: "",
    endDate: "",
    sort: "-dateReceived",
    page: 1,
    limit: 10,
  });

  const [showFilters, setShowFilters] = useState(false);
  const { Column } = Table;
  const dispatch = useDispatch();
  const isInitialMount = useRef(true); // Add this ref

  useRedirectLogoutUser("/users/login");

  // Initial data fetch
  useEffect(() => {
    fetchDocumentRecords();
  }, []);

  // Fetch data when filters change (pagination, sort)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    fetchDocumentRecords();
  }, [filters.page, filters.limit, filters.sort]); // Watch these for changes

  // Fetch data with current filters
  const fetchDocumentRecords = () => {
    const queryString = buildQueryString(filters);
    fetchData(`documentRecord?${queryString}`, "documentRecord");
  };

  // Build query string from filters
  const buildQueryString = (filters) => {
    const params = new URLSearchParams();

    Object.keys(filters).forEach((key) => {
      if (filters[key] && filters[key] !== "") {
        params.append(key, filters[key]);
      }
    });

    return params.toString();
  };

  // Handle filter changes (UI only, no API call)
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle date range filter
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setFilters((prev) => ({
        ...prev,
        startDate: dates[0].format("YYYY-MM-DD"),
        endDate: dates[1].format("YYYY-MM-DD"),
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        startDate: "",
        endDate: "",
      }));
    }
  };

  // CORRECTED: Apply filters (triggers API call)
  const applyFilters = () => {
    const newFilters = {
      ...filters,
      page: 1, // Reset to first page
    };

    setFilters(newFilters);

    // Immediate API call with new filters
    const queryString = buildQueryString(newFilters);
    fetchData(`documentRecord?${queryString}`, "documentRecord");

    // Close the filter panel
    setShowFilters(false);
  };

  // Handle pagination change
  const handlePageChange = (page, pageSize) => {
    setFilters((prev) => ({
      ...prev,
      page: page,
      limit: pageSize,
    }));
  };

  // CORRECTED: Reset all filters with API call
  const resetFilters = () => {
    const defaultFilters = {
      search: "",
      documentType: "",
      sender: "",
      startDate: "",
      endDate: "",
      sort: "-dateReceived",
      page: 1,
      limit: 10,
    };

    setFilters(defaultFilters);

    // Fetch with reset filters
    const queryString = buildQueryString(defaultFilters);
    fetchData(`documentRecord?${queryString}`, "documentRecord");
  };

  // Delete record
  const removeRecord = async (id) => {
    try {
      await dispatch(deleteData(`documentRecord/${id}`));
      fetchDocumentRecords();
      toast.success("Document record deleted successfully");
    } catch (error) {
      toast.error("Failed to delete document record");
    }
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.search ||
    filters.documentType ||
    filters.sender ||
    filters.startDate;

  // Remove the hasUnsavedFilters check - Apply should always work
  // const hasUnsavedFilters = hasActiveFilters;

  if (loadingDocumentRecord?.documentRecord) {
    return <LoadingSpinner />;
  }

  const paginationConfig = documentRecord?.pagination
    ? {
        current: documentRecord?.pagination.current,
        pageSize: documentRecord?.pagination.limit,
        total: documentRecord?.pagination.totalRecords,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} of ${total} records`,
        onChange: handlePageChange,
        onShowSizeChange: handlePageChange,
      }
    : false;

  // Get document type color
  const getDocumentTypeColor = (type) => {
    switch (type) {
      case "Court Process":
        return "blue";
      case "Client Document":
        return "green";
      case "Official Correspondence":
        return "orange";
      case "Others":
        return "gray";
      default:
        return "default";
    }
  };

  return (
    <>
      {errorDocumentRecord.documentRecord ? (
        <PageErrorAlert
          errorCondition={errorDocumentRecord.documentRecord}
          errorMessage={errorDocumentRecord.documentRecord}
        />
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Document Records
              </h1>
              {documentRecord?.pagination && (
                <p className="text-sm text-gray-600 mt-1">
                  {documentRecord?.pagination?.totalRecords} records found
                </p>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-center">
              <Link to="/dashboard/record-documents">
                <ButtonWithIcon
                  onClick={() => {}}
                  icon={<PlusOutlined />}
                  text="Create Record"
                />
              </Link>

              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
                type={showFilters ? "primary" : "default"}>
                Filters {hasActiveFilters && "•"}
              </Button>

              {hasActiveFilters && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={resetFilters}
                  type="default">
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Search Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <Input
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    placeholder="Search documents..."
                    prefix={<SearchOutlined />}
                    allowClear
                  />
                </div>

                {/* Document Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type
                  </label>
                  <Select
                    value={filters.documentType || undefined}
                    onChange={(value) =>
                      handleFilterChange("documentType", value)
                    }
                    placeholder="All types"
                    style={{ width: "100%" }}
                    allowClear>
                    <Option value="Court Process">Court Process</Option>
                    <Option value="Client Document">Client Document</Option>
                    <Option value="Official Correspondence">
                      Official Correspondence
                    </Option>
                    <Option value="Others">Others</Option>
                  </Select>
                </div>

                {/* Sender Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sender
                  </label>
                  <Input
                    value={filters.sender}
                    onChange={(e) =>
                      handleFilterChange("sender", e.target.value)
                    }
                    placeholder="Filter by sender"
                    allowClear
                  />
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Received Range
                  </label>
                  <RangePicker
                    onChange={handleDateRangeChange}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Sort and Action Buttons */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <Select
                    value={filters.sort}
                    onChange={(value) => handleFilterChange("sort", value)}
                    style={{ width: "100%", maxWidth: "200px" }}>
                    <Option value="-dateReceived">Newest First</Option>
                    <Option value="dateReceived">Oldest First</Option>
                    <Option value="documentName">Name A-Z</Option>
                    <Option value="-documentName">Name Z-A</Option>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={resetFilters} disabled={!hasActiveFilters}>
                    Reset
                  </Button>
                  <Button
                    type="primary"
                    onClick={applyFilters}
                    loading={loadingDocumentRecord?.documentRecord}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Simplified Table */}
          <div className="bg-white rounded-lg shadow">
            <Table
              dataSource={documentRecord?.data || []}
              scroll={{ x: 800 }}
              pagination={paginationConfig}
              loading={loadingDocumentRecord?.documentRecord}
              rowKey="_id">
              <Column
                title="Document"
                key="document"
                render={(text, record) => (
                  <div className="min-w-[200px]">
                    <Link
                      to={`/dashboard/record-document-list/${record._id}/details`}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline block">
                      {record.documentName}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <Tag color={getDocumentTypeColor(record.documentType)}>
                        {record.documentType}
                      </Tag>
                      {record.docRef && (
                        <span className="text-xs text-gray-500">
                          Ref: {record.docRef}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              />

              <Column
                title="Sender"
                dataIndex="sender"
                key="sender"
                render={(sender) => (
                  <span className="font-medium">{sender}</span>
                )}
              />

              <Column
                title="Date Received"
                dataIndex="dateReceived"
                key="dateReceived"
                render={(date) => (
                  <div className="text-sm">{formatDate(date || null)}</div>
                )}
              />

              <Column
                title="Note Preview"
                dataIndex="note"
                key="note"
                render={(note) => (
                  <Tooltip title={note} placement="topLeft">
                    <span className="text-sm text-gray-600 cursor-help">
                      {note
                        ? note.length > 40
                          ? `${note.substring(0, 40)}...`
                          : note
                        : "No note"}
                    </span>
                  </Tooltip>
                )}
              />

              <Column
                title="Actions"
                key="actions"
                fixed="right"
                width={120}
                render={(text, record) => (
                  <Space size="small">
                    <Tooltip title="View Details">
                      <Link
                        to={`/dashboard/record-document-list/${record._id}/details`}>
                        <Button
                          icon={<EyeOutlined />}
                          size="small"
                          type="text"
                          className="text-blue-600 hover:text-blue-800"
                        />
                      </Link>
                    </Tooltip>

                    <Tooltip title="Delete Record">
                      <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        type="text"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          Modal.confirm({
                            title: "Delete Document Record",
                            content:
                              "Are you sure you want to delete this record? This action cannot be undone.",
                            okText: "Delete",
                            okType: "danger",
                            cancelText: "Cancel",
                            onOk: () => removeRecord(record?._id),
                          });
                        }}
                      />
                    </Tooltip>
                  </Space>
                )}
              />
            </Table>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-gray-700">
                Active filters:
              </span>
              {filters.search && (
                <Tag closable onClose={() => handleFilterChange("search", "")}>
                  Search: {filters.search}
                </Tag>
              )}
              {filters.documentType && (
                <Tag
                  closable
                  onClose={() => handleFilterChange("documentType", "")}>
                  Type: {filters.documentType}
                </Tag>
              )}
              {filters.sender && (
                <Tag closable onClose={() => handleFilterChange("sender", "")}>
                  Sender: {filters.sender}
                </Tag>
              )}
              {filters.startDate && filters.endDate && (
                <Tag closable onClose={() => handleDateRangeChange(null)}>
                  Date: {filters.startDate} to {filters.endDate}
                </Tag>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default DocumentRecordList;
