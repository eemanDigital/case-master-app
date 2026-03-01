import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { Link, useNavigate } from "react-router-dom";
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
  Card,
  Row,
  Col,
  Statistic,
  Dropdown,
  Menu,
  message,
  Popconfirm,
  Badge,
  Tabs,
  Typography,
} from "antd";
import { formatDate } from "../utils/formatDate";
import {
  DeleteOutlined,
  PlusOutlined,
  FilterOutlined,
  ReloadOutlined,
  EyeOutlined,
  SearchOutlined,
  DownloadOutlined,
  MoreOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  HistoryOutlined,
  FileExcelOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import LoadingSpinner from "../components/LoadingSpinner";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { deleteData, postData, putData } from "../redux/features/delete/deleteSlice";
import PageErrorAlert from "../components/PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import ButtonWithIcon from "../components/ButtonWithIcon";
import useUserSelectOptions from "../hooks/useUserSelectOptions";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;
const { TabPane } = Tabs;

const STATUS_CONFIG = {
  received: { color: "default", label: "Received", icon: <InboxOutlined /> },
  acknowledged: { color: "blue", label: "Acknowledged", icon: <CheckOutlined /> },
  under_review: { color: "processing", label: "Under Review", icon: <EyeOutlined /> },
  in_progress: { color: "cyan", label: "In Progress", icon: <ClockCircleOutlined /> },
  pending_action: { color: "orange", label: "Pending Action", icon: <ExclamationCircleOutlined /> },
  completed: { color: "green", label: "Completed", icon: <CheckOutlined /> },
  archived: { color: "gold", label: "Archived", icon: <InboxOutlined /> },
};

const PRIORITY_CONFIG = {
  low: { color: "default", label: "Low" },
  medium: { color: "blue", label: "Medium" },
  high: { color: "orange", label: "High" },
  urgent: { color: "red", label: "Urgent" },
};

const DocumentRecordList = () => {
  const navigate = useNavigate();
  const {
    documentRecord,
    loading: loadingDocumentRecord,
    error: errorDocumentRecord,
    fetchData,
  } = useDataGetterHook();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    documentType: "",
    sender: "",
    status: "",
    priority: "",
    isUrgent: "",
    startDate: "",
    endDate: "",
    sort: "-dateReceived",
    page: 1,
    limit: 10,
  });

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { Column } = Table;
  const dispatch = useDispatch();
  const isInitialMount = useRef(true);
  const { staff: userData } = useUserSelectOptions({ fetchAll: true });

  useRedirectLogoutUser("/users/login");

  useEffect(() => {
    fetchDocumentRecords();
    fetchStats();
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchDocumentRecords();
  }, [filters.page, filters.limit, filters.sort]);

  useEffect(() => {
    if (isInitialMount.current) return;
    handleTabChange(activeTab);
  }, [activeTab]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch(`/api/v1/documentRecord/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const result = await response.json();
      if (result.status === "success") {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchDocumentRecords = () => {
    let queryFilters = { ...filters };
    
    if (activeTab === "all") {
      queryFilters.isDeleted = false;
    } else if (activeTab === "trash") {
      queryFilters.isDeleted = true;
    } else if (activeTab === "urgent") {
      queryFilters.isUrgent = true;
    } else if (activeTab === "due") {
      queryFilters.responseRequired = true;
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      queryFilters.dueDate = today.toISOString();
    }

    const queryString = buildQueryString(queryFilters);
    fetchData(`documentRecord?${queryString}`, "documentRecord");
  };

  const buildQueryString = (filters) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] && filters[key] !== "") {
        params.append(key, filters[key]);
      }
    });
    return params.toString();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

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

  const applyFilters = () => {
    const newFilters = {
      ...filters,
      page: 1,
    };
    setFilters(newFilters);
    const queryString = buildQueryString(newFilters);
    fetchData(`documentRecord?${queryString}`, "documentRecord");
    setShowFilters(false);
  };

  const handlePageChange = (page, pageSize) => {
    setFilters((prev) => ({
      ...prev,
      page: page,
      limit: pageSize,
    }));
  };

  const resetFilters = () => {
    const defaultFilters = {
      search: "",
      documentType: "",
      sender: "",
      status: "",
      priority: "",
      isUrgent: "",
      startDate: "",
      endDate: "",
      sort: "-dateReceived",
      page: 1,
      limit: 10,
    };
    setFilters(defaultFilters);
    const queryString = buildQueryString(defaultFilters);
    fetchData(`documentRecord?${queryString}`, "documentRecord");
  };

  const handleTabChange = (key) => {
    setSelectedRowKeys([]);
    if (key === "all") {
      handleFilterChange("isDeleted", "");
    } else if (key === "trash") {
      handleFilterChange("isDeleted", true);
    } else if (key === "urgent") {
      handleFilterChange("isUrgent", true);
    }
  };

  const removeRecord = async (id, permanent = false) => {
    try {
      const endpoint = permanent 
        ? `documentRecord/${id}?permanent=true`
        : `documentRecord/${id}`;
      await dispatch(deleteData(endpoint));
      toast.success(permanent ? "Document permanently deleted" : "Document moved to trash");
      fetchDocumentRecords();
      fetchStats();
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  const restoreRecord = async (id) => {
    try {
      await dispatch(putData({ endpoint: `documentRecord/${id}/restore`, data: {} }));
      toast.success("Document restored successfully");
      fetchDocumentRecords();
      fetchStats();
    } catch (error) {
      toast.error("Failed to restore document");
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select documents to update");
      return;
    }
    try {
      await dispatch(postData({
        endpoint: "documentRecord/bulk-update-status",
        data: { documentIds: selectedRowKeys, status }
      }));
      toast.success(`${selectedRowKeys.length} document(s) updated to "${status}"`);
      setSelectedRowKeys([]);
      fetchDocumentRecords();
      fetchStats();
    } catch (error) {
      toast.error("Failed to update documents");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select documents to delete");
      return;
    }
    try {
      await dispatch(postData({
        endpoint: "documentRecord/bulk-delete",
        data: { documentIds: selectedRowKeys }
      }));
      toast.success(`${selectedRowKeys.length} document(s) moved to trash`);
      setSelectedRowKeys([]);
      fetchDocumentRecords();
      fetchStats();
    } catch (error) {
      toast.error("Failed to delete documents");
    }
  };

  const handleExport = async (format) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/v1/documentRecord/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (format === "csv") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `document-records-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        toast.success("Export completed");
      } else {
        const result = await response.json();
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `document-records-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        toast.success("Export completed");
      }
    } catch (error) {
      toast.error("Export failed");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await dispatch(putData({ 
        endpoint: `documentRecord/${id}/status`, 
        data: { status: newStatus } 
      }));
      toast.success(`Status updated to "${newStatus}"`);
      fetchDocumentRecords();
      fetchStats();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const hasActiveFilters =
    filters.search ||
    filters.documentType ||
    filters.sender ||
    filters.status ||
    filters.priority ||
    filters.startDate;

  const bulkMenu = (
    <Menu>
      <Menu.Item key="acknowledged" onClick={() => handleBulkStatusUpdate("acknowledged")}>
        Mark as Acknowledged
      </Menu.Item>
      <Menu.Item key="in_progress" onClick={() => handleBulkStatusUpdate("in_progress")}>
        Mark as In Progress
      </Menu.Item>
      <Menu.Item key="completed" onClick={() => handleBulkStatusUpdate("completed")}>
        Mark as Completed
      </Menu.Item>
      <Menu.Item key="archived" onClick={() => handleBulkStatusUpdate("archived")}>
        Archive
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="delete" danger onClick={handleBulkDelete}>
        Move to Trash
      </Menu.Item>
    </Menu>
  );

  const exportMenu = (
    <Menu>
      <Menu.Item key="csv" onClick={() => handleExport("csv")}>
        <FileExcelOutlined /> Export as CSV
      </Menu.Item>
      <Menu.Item key="json" onClick={() => handleExport("json")}>
        <DownloadOutlined /> Export as JSON
      </Menu.Item>
    </Menu>
  );

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
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} records`,
        onChange: handlePageChange,
        onShowSizeChange: handlePageChange,
      }
    : false;

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
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
          <div className="mb-6">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Card loading={statsLoading} className="shadow-md">
                  <Statistic
                    title="Total Documents"
                    value={stats?.stats?.total || 0}
                    prefix={<InboxOutlined className="text-blue-500" />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card loading={statsLoading} className="shadow-md">
                  <Statistic
                    title="Pending Action"
                    value={stats?.stats?.pending_action || 0}
                    prefix={<ClockCircleOutlined className="text-orange-500" />}
                    valueStyle={{ color: "#fa8c16" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card loading={statsLoading} className="shadow-md">
                  <Statistic
                    title="Completed"
                    value={stats?.stats?.completed || 0}
                    prefix={<CheckOutlined className="text-green-500" />}
                    valueStyle={{ color: "#52c41a" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card loading={statsLoading} className="shadow-md">
                  <Statistic
                    title="Urgent"
                    value={stats?.stats?.urgent || 0}
                    prefix={<WarningOutlined className="text-red-500" />}
                    valueStyle={{ color: "#ff4d4f" }}
                  />
                </Card>
              </Col>
            </Row>
          </div>

          <div className="bg-white rounded-lg shadow mb-6">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              className="px-4 pt-2"
              items={[
                {
                  key: "all",
                  label: (
                    <span>
                      <InboxOutlined /> All Documents
                    </span>
                  ),
                },
                {
                  key: "urgent",
                  label: (
                    <span>
                      <WarningOutlined /> Urgent
                      {stats?.stats?.urgent > 0 && (
                        <Badge count={stats.stats.urgent} size="small" className="ml-2" />
                      )}
                    </span>
                  ),
                },
                {
                  key: "due",
                  label: (
                    <span>
                      <ClockCircleOutlined /> Due Today
                      {stats?.stats?.dueToday > 0 && (
                        <Badge count={stats.stats.dueToday} size="small" className="ml-2" />
                      )}
                    </span>
                  ),
                },
                {
                  key: "trash",
                  label: (
                    <span>
                      <DeleteOutlined /> Trash
                    </span>
                  ),
                },
              ]}
            />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {activeTab === "trash" ? "Trash" : "Document Records"}
              </h1>
              {documentRecord?.pagination && (
                <p className="text-sm text-gray-600 mt-1">
                  {documentRecord?.pagination?.totalRecords} records found
                </p>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-center">
              {selectedRowKeys.length > 0 && activeTab !== "trash" && (
                <Dropdown overlay={bulkMenu} trigger={["click"]}>
                  <Button>
                    Bulk Actions ({selectedRowKeys.length})
                  </Button>
                </Dropdown>
              )}

              <Dropdown overlay={exportMenu} trigger={["click"]}>
                <Button icon={<DownloadOutlined />}>Export</Button>
              </Dropdown>

              <Link to="/dashboard/record-documents">
                <ButtonWithIcon
                  onClick={() => {}}
                  icon={<PlusOutlined />}
                  text={activeTab === "trash" ? "Create New" : "Create Record"}
                />
              </Link>

              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
                type={showFilters ? "primary" : "default"}>
                Filters {hasActiveFilters && "•"}
              </Button>

              {hasActiveFilters && (
                <Button icon={<ReloadOutlined />} onClick={resetFilters}>
                  Reset
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <Input
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    placeholder="Search documents..."
                    prefix={<SearchOutlined />}
                    allowClear
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                  <Select
                    value={filters.documentType || undefined}
                    onChange={(value) => handleFilterChange("documentType", value)}
                    placeholder="All types"
                    style={{ width: "100%" }}
                    allowClear>
                    {Object.keys(STATUS_CONFIG).length === 0 && (
                      <>
                        <Option value="Court Process">Court Process</Option>
                        <Option value="Client Document">Client Document</Option>
                        <Option value="Official Correspondence">Official Correspondence</Option>
                        <Option value="Legal Notice">Legal Notice</Option>
                        <Option value="Contract/Agreement">Contract/Agreement</Option>
                        <Option value="Affidavit">Affidavit</Option>
                        <Option value="Power of Attorney">Power of Attorney</Option>
                        <Option value="Judgement/Order">Judgement/Order</Option>
                        <Option value="Petition">Petition</Option>
                        <Option value="Correspondence">Correspondence</Option>
                        <Option value="Others">Others</Option>
                      </>
                    )}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Select
                    value={filters.status || undefined}
                    onChange={(value) => handleFilterChange("status", value)}
                    placeholder="All statuses"
                    style={{ width: "100%" }}
                    allowClear>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <Option key={key} value={key}>
                        {config.label}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <Select
                    value={filters.priority || undefined}
                    onChange={(value) => handleFilterChange("priority", value)}
                    placeholder="All priorities"
                    style={{ width: "100%" }}
                    allowClear>
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                      <Option key={key} value={key}>
                        {config.label}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sender</label>
                  <Input
                    value={filters.sender}
                    onChange={(e) => handleFilterChange("sender", e.target.value)}
                    placeholder="Filter by sender"
                    allowClear
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
                  <RangePicker onChange={handleDateRangeChange} style={{ width: "100%" }} />
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <Select
                    value={filters.sort}
                    onChange={(value) => handleFilterChange("sort", value)}
                    style={{ width: "100%", maxWidth: "200px" }}>
                    <Option value="-dateReceived">Newest First</Option>
                    <Option value="dateReceived">Oldest First</Option>
                    <Option value="-createdAt">Recently Created</Option>
                    <Option value="documentName">Name A-Z</Option>
                    <Option value="-documentName">Name Z-A</Option>
                    <Option value="priority">Priority (Low to High)</Option>
                    <Option value="-priority">Priority (High to Low)</Option>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button onClick={resetFilters} disabled={!hasActiveFilters}>
                    Reset
                  </Button>
                  <Button type="primary" onClick={applyFilters} loading={loadingDocumentRecord?.documentRecord}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <Table
              dataSource={documentRecord?.data || []}
              scroll={{ x: 1200 }}
              pagination={paginationConfig}
              loading={loadingDocumentRecord?.documentRecord}
              rowKey="_id"
              rowSelection={activeTab !== "trash" ? rowSelection : undefined}
              onRow={(record) => ({
                onClick: () => navigate(`/dashboard/record-document-list/${record._id}/details`),
                style: { cursor: "pointer" },
              })}>
              <Column
                title="Document"
                key="document"
                width={250}
                render={(text, record) => (
                  <div className="min-w-[200px]">
                    <Link
                      to={`/dashboard/record-document-list/${record._id}/details`}
                      className="font-medium text-blue-600 hover:text-blue-800 hover:underline block">
                      {record.documentName}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Tag color={STATUS_CONFIG[record.status]?.color || "default"}>
                        {STATUS_CONFIG[record.status]?.label || record.status}
                      </Tag>
                      {record.isUrgent && (
                        <Tag color="red" icon={<WarningOutlined />}>
                          Urgent
                        </Tag>
                      )}
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
                title="Type"
                dataIndex="documentType"
                key="documentType"
                width={120}
                render={(type) => (
                  <Tag color="blue">{type}</Tag>
                )}
              />

              <Column
                title="Sender"
                dataIndex="sender"
                key="sender"
                width={150}
                render={(sender, record) => (
                  <div>
                    <div className="font-medium">{sender}</div>
                    {record.senderContact && (
                      <div className="text-xs text-gray-500">{record.senderContact}</div>
                    )}
                  </div>
                )}
              />

              <Column
                title="Priority"
                dataIndex="priority"
                key="priority"
                width={100}
                render={(priority) => (
                  <Tag color={PRIORITY_CONFIG[priority]?.color || "default"}>
                    {PRIORITY_CONFIG[priority]?.label || priority}
                  </Tag>
                )}
              />

              <Column
                title="Date Received"
                dataIndex="dateReceived"
                key="dateReceived"
                width={120}
                render={(date) => (
                  <div className="text-sm">
                    <div>{formatDate(date || null)}</div>
                    {date && (
                      <div className="text-xs text-gray-500">
                        {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                )}
              />

              <Column
                title="Due Date"
                dataIndex="dueDate"
                key="dueDate"
                width={120}
                render={(dueDate, record) => {
                  if (!dueDate || !record.responseRequired) return <Text type="secondary">-</Text>;
                  const isOverdue = new Date(dueDate) < new Date();
                  const isDueToday = new Date(dueDate).toDateString() === new Date().toDateString();
                  return (
                    <div className="text-sm">
                      <Tag color={isOverdue ? "red" : isDueToday ? "orange" : "default"}>
                        {isOverdue ? "Overdue: " : isDueToday ? "Due Today: " : ""}
                        {formatDate(dueDate)}
                      </Tag>
                    </div>
                  );
                }}
              />

              <Column
                title="Forwarded To"
                dataIndex="forwardedTo"
                key="forwardedTo"
                width={130}
                render={(forwardedTo) => (
                  forwardedTo ? (
                    <div className="text-sm">
                      {forwardedTo.firstName} {forwardedTo.lastName}
                    </div>
                  ) : (
                    <Text type="secondary">Not forwarded</Text>
                  )
                )}
              />

              <Column
                title="Actions"
                key="actions"
                fixed="right"
                width={150}
                render={(text, record) => (
                  <Space size="small" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="View Details">
                      <Link to={`/dashboard/record-document-list/${record._id}/details`}>
                        <Button icon={<EyeOutlined />} size="small" type="text" className="text-blue-600" />
                      </Link>
                    </Tooltip>

                    {activeTab === "trash" ? (
                      <>
                        <Tooltip title="Restore">
                          <Popconfirm
                            title="Restore this document?"
                            onConfirm={() => restoreRecord(record._id)}
                          >
                            <Button icon={<ReloadOutlined />} size="small" type="text" className="text-green-600" />
                          </Popconfirm>
                        </Tooltip>
                        <Tooltip title="Delete Permanently">
                          <Popconfirm
                            title="Permanently delete this document? This cannot be undone."
                            onConfirm={() => removeRecord(record._id, true)}
                          >
                            <Button icon={<DeleteOutlined />} size="small" type="text" danger />
                          </Popconfirm>
                        </Tooltip>
                      </>
                    ) : (
                      <Dropdown
                        overlay={
                          <Menu>
                            <Menu.Item
                              key="edit"
                              icon={<EditOutlined />}
                              onClick={() => navigate(`/dashboard/record-documents/${record._id}/edit`)}
                            >
                              Edit
                            </Menu.Item>
                            <Menu.Item
                              key="history"
                              icon={<HistoryOutlined />}
                              onClick={() => navigate(`/dashboard/record-document-list/${record._id}/details?tab=activity`)}
                            >
                              View History
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.SubMenu title="Change Status">
                              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <Menu.Item
                                  key={key}
                                  onClick={() => handleStatusChange(record._id, key)}
                                  disabled={record.status === key}
                                >
                                  {config.label}
                                </Menu.Item>
                              ))}
                            </Menu.SubMenu>
                            <Menu.Divider />
                            <Menu.Item
                              key="delete"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                Modal.confirm({
                                  title: "Move to Trash",
                                  content: "Are you sure you want to move this document to trash?",
                                  okText: "Move to Trash",
                                  okType: "danger",
                                  onOk: () => removeRecord(record._id),
                                });
                              }}
                            >
                              Move to Trash
                            </Menu.Item>
                          </Menu>
                        }
                        trigger={["click"]}
                      >
                        <Button icon={<MoreOutlined />} size="small" type="text" />
                      </Dropdown>
                    )}
                  </Space>
                )}
              />
            </Table>
          </div>

          {hasActiveFilters && activeTab !== "trash" && (
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>
              {filters.search && (
                <Tag closable onClose={() => handleFilterChange("search", "")}>
                  Search: {filters.search}
                </Tag>
              )}
              {filters.documentType && (
                <Tag closable onClose={() => handleFilterChange("documentType", "")}>
                  Type: {filters.documentType}
                </Tag>
              )}
              {filters.status && (
                <Tag closable onClose={() => handleFilterChange("status", "")}>
                  Status: {STATUS_CONFIG[filters.status]?.label}
                </Tag>
              )}
              {filters.priority && (
                <Tag closable onClose={() => handleFilterChange("priority", "")}>
                  Priority: {PRIORITY_CONFIG[filters.priority]?.label}
                </Tag>
              )}
              {filters.sender && (
                <Tag closable onClose={() => handleFilterChange("sender", "")}>
                  Sender: {filters.sender}
                </Tag>
              )}
              {filters.startDate && filters.endDate && (
                <Tag closable onClose={handleDateRangeChange}>
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
