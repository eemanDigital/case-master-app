import { useEffect, useState, useCallback, memo } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import {
  Card,
  Typography,
  Pagination,
  Button,
  Modal,
  Tooltip,
  Spin,
  Alert,
  Badge,
  Avatar,
  Empty,
  Dropdown,
  Menu,
} from "antd";
import {
  DownloadOutlined,
  DeleteOutlined,
  PlusOutlined,
  EditOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  MoreOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { formatDate } from "../utils/formatDate";
import UpdateCaseReportForm from "../pages/UpdateCaseReportForm";
import CaseReportSearchBar from "./CaseReportSearchBar";
import { useAdminHook } from "../hooks/useAdminHook";
import useTextShorten from "../hooks/useTextShorten";
import { useDispatch, useSelector } from "react-redux";
import { useAdvancedSearch } from "../hooks/useAdvancedSearch";
import { deleteData, RESET } from "../redux/features/delete/deleteSlice";
import { toast } from "react-toastify";
import AddEventToCalender from "./AddEventToCalender";
import { useDownloadPdfHandler } from "../hooks/useDownloadPdfHandler";
import SendCaseReport from "./SendCaseReport";
import { ShowStaff } from "./protect/Protect";
import ArchiveIcon from "./ArchiveIcon";
import { decode } from "html-entities";
import DOMPurify from "dompurify";

const { Title, Text } = Typography;
const downloadURL = import.meta.env.VITE_BASE_URL;

// Memoized Report Card Component
const ReportCard = memo(
  ({
    report,
    onEdit,
    onDelete,
    onDownload,
    canEdit,
    canDelete,
    hideButtons,
    shortenText,
    loadingPdf,
  }) => {
    const [expanded, setExpanded] = useState(false);

    // Add this helper function
    const sanitizeAndDecodeContent = (html) => {
      if (!html) return "";
      const decoded = decode(html); // Decode HTML entities
      return DOMPurify.sanitize(decoded, {
        ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "u", "span"],
        ALLOWED_ATTR: ["style"],
      });
    };

    // Create action menu for mobile
    const actionMenu = (
      <Menu>
        {canEdit && (
          <Menu.Item
            key="edit"
            icon={<EditOutlined />}
            onClick={() => onEdit(report._id)}>
            Edit Report
          </Menu.Item>
        )}
        <Menu.Item
          key="download"
          icon={<DownloadOutlined />}
          onClick={() => onDownload(report)}>
          Download PDF
        </Menu.Item>
        {canDelete && (
          <Menu.Item
            key="delete"
            icon={<DeleteOutlined />}
            danger
            onClick={() => onDelete(report._id)}>
            Delete Report
          </Menu.Item>
        )}
      </Menu>
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}>
        <Card
          className="shadow-sm hover:shadow-md transition-all duration-300 border-0 rounded-xl overflow-hidden"
          bodyStyle={{ padding: 0 }}>
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 border-b border-blue-100">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Link
                  to={`/dashboard/cases/${report.caseReported?._id}/casedetails`}
                  className="group">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                    {`${
                      report?.caseReported?.firstParty?.name?.[0]?.name || "N/A"
                    } vs ${
                      report?.caseReported?.secondParty?.name?.[0]?.name ||
                      "N/A"
                    }`}
                  </h3>
                </Link>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Badge
                    count={report?.caseReported?.suitNo || "N/A"}
                    style={{
                      backgroundColor: "#3b82f6",
                      fontSize: "12px",
                      height: "24px",
                      lineHeight: "24px",
                    }}
                  />
                  <Text className="text-xs sm:text-sm text-gray-600">
                    <CalendarOutlined className="mr-1" />
                    {formatDate(report?.date)}
                  </Text>
                </div>
              </div>

              {/* Mobile Actions Menu */}
              {!hideButtons && (
                <Dropdown
                  overlay={actionMenu}
                  trigger={["click"]}
                  className="sm:hidden">
                  <Button
                    icon={<MoreOutlined />}
                    size="large"
                    className="flex-shrink-0"
                  />
                </Dropdown>
              )}
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4 sm:p-6">
            {/* Report Content */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileTextOutlined className="text-gray-400" />
                <Text strong className="text-sm text-gray-700">
                  Report Details
                </Text>
              </div>
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                {shortenText(report?.update, 400, report._id)}
              </p>
              {report?.update?.length > 200 && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => setExpanded(!expanded)}
                  className="p-0 h-auto mt-1">
                  {expanded ? "Show less" : "Read more"}
                </Button>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-rose-50 p-3 rounded-lg border border-rose-200">
                <div className="flex items-center gap-2 mb-1">
                  <ClockCircleOutlined className="text-rose-500" />
                  <Text className="text-xs font-medium text-gray-600">
                    Adjourned For
                  </Text>
                </div>
                <Text strong className="text-sm text-rose-600 block">
                  {report?.adjournedFor || "Not specified"}
                </Text>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarOutlined className="text-blue-500" />
                  <Text className="text-xs font-medium text-gray-600">
                    Adjourned Date
                  </Text>
                </div>
                <Text strong className="text-sm text-blue-600 block">
                  {report?.adjournedDate
                    ? formatDate(report.adjournedDate)
                    : "Not set"}
                </Text>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <UserOutlined className="text-gray-500" />
                  <Text className="text-xs font-medium text-gray-600">
                    Reported By
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar size="small" icon={<UserOutlined />} />
                  <Text strong className="text-sm text-gray-700 truncate">
                    {report?.reportedBy
                      ? `${report.reportedBy.firstName} ${report.reportedBy.lastName}`
                      : "Unknown"}
                  </Text>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {!hideButtons && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                {/* Left Actions */}
                <div className="flex flex-wrap gap-2 sm:flex-1">
                  <AddEventToCalender
                    title={`Case: ${
                      report.caseReported?.firstParty?.name?.[0]?.name || "N/A"
                    } vs ${
                      report.caseReported?.secondParty?.name?.[0]?.name || "N/A"
                    }`}
                    description={`Adjourned For: ${
                      report.adjournedFor || "Not specified"
                    }`}
                    startDate={report.date}
                    endDate={report.adjournedDate}
                  />
                  <ShowStaff>
                    <SendCaseReport report={report} />
                  </ShowStaff>
                  <Link
                    to={`/dashboard/cases/${report.caseReported?._id}/casedetails`}>
                    <Button
                      icon={<EyeOutlined />}
                      className="hidden sm:inline-flex">
                      View Case
                    </Button>
                  </Link>
                </div>

                {/* Right Actions - Desktop Only */}
                <div className="hidden sm:flex flex-wrap gap-2 justify-end">
                  {canEdit && (
                    <Tooltip title="Edit Report">
                      <Button
                        onClick={() => onEdit(report._id)}
                        icon={<EditOutlined />}
                        className="bg-yellow-500 text-white hover:bg-yellow-600 border-none"
                      />
                    </Tooltip>
                  )}
                  <Tooltip title="Download Report">
                    <Button
                      loading={loadingPdf}
                      icon={<DownloadOutlined />}
                      onClick={() => onDownload(report)}
                    />
                  </Tooltip>
                  {canDelete && (
                    <Tooltip title="Delete Report">
                      <Button
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => onDelete(report._id)}
                      />
                    </Tooltip>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    );
  }
);

ReportCard.displayName = "ReportCard";

// Main Component
const CaseReportList = ({
  title,
  showFilter,
  hideButtons,
  titleStyle,
  nameStyle,
  endpoint = "reports",
}) => {
  const { isStaff, isSuperAdmin } = useAdminHook();
  const { user } = useSelector((state) => state.auth);
  const clientId = user?.data?._id;
  const [editingReportId, setEditingReportId] = useState(null);

  const {
    isError: deleteError,
    isSuccess: deleteSuccess,
    message: deleteMsg,
  } = useSelector((state) => state.delete);

  const { shortenText } = useTextShorten();
  const dispatch = useDispatch();
  const {
    loading: loadingPdf,
    error: pdfError,
    handleDownloadPdf,
  } = useDownloadPdfHandler();

  const {
    data: reports,
    pagination,
    filters,
    loading,
    error,
    updateFilters,
    updatePagination,
    resetSearch,
  } = useAdvancedSearch(endpoint, {
    sort: "-date",
    limit: 10,
  });

  // Handlers
  const handleResetFilters = useCallback(() => {
    resetSearch();
  }, [resetSearch]);

  const handleEditClose = useCallback(
    (wasUpdated = false) => {
      setEditingReportId(null);
      if (wasUpdated) {
        updateFilters({ ...filters });
      }
    },
    [filters, updateFilters]
  );

  const handleEdit = useCallback((reportId) => {
    setEditingReportId(reportId);
  }, []);

  const handleDownload = useCallback(
    (report) => {
      handleDownloadPdf(
        null,
        `${downloadURL}/reports/pdf/${report?._id}`,
        "report.pdf"
      );
    },
    [handleDownloadPdf]
  );

  const handleDelete = useCallback(
    (reportId) => {
      Modal.confirm({
        title: "Delete Report",
        content: "Are you sure you want to delete this report?",
        okText: "Yes, Delete",
        okType: "danger",
        cancelText: "Cancel",
        onOk: async () => {
          try {
            await dispatch(deleteData(`reports/soft-delete/${reportId}`));
          } catch (error) {
            toast.error("Failed to delete report");
          }
        },
      });
    },
    [dispatch]
  );

  const handlePageChange = useCallback(
    (page, pageSize) => {
      updatePagination({
        current: page,
        limit: pageSize,
      });
    },
    [updatePagination]
  );

  const handleFiltersChange = useCallback(
    (newFilters) => {
      updateFilters(newFilters);
    },
    [updateFilters]
  );

  // Effects
  useEffect(() => {
    if (deleteSuccess) {
      toast.success(deleteMsg);
      dispatch(RESET());
      updateFilters({ ...filters });
    }
    if (deleteError) {
      toast.error(deleteMsg);
      dispatch(RESET());
    }
  }, [deleteSuccess, deleteError, deleteMsg, dispatch, updateFilters, filters]);

  useEffect(() => {
    if (pdfError) {
      toast.error(pdfError || "Failed to download document");
    }
  }, [pdfError]);

  // Filter reports for client
  const filterReportForClient = useCallback((reports, id) => {
    if (!reports || !Array.isArray(reports)) return [];
    return reports.filter(
      (reportItem) => reportItem?.caseReported?.client === id
    );
  }, []);

  const currentReports = isStaff
    ? reports
    : filterReportForClient(reports, clientId);

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center justify-between">
            <Title
              level={2}
              className="text-2xl sm:text-3xl font-bold text-gray-900 m-0">
              {title}
            </Title>
            <ArchiveIcon
              toolTipName="View Deleted Reports"
              link="soft-deleted-items"
            />
          </div>

          {!hideButtons && isStaff && (
            <Link to="add-report" className="w-full sm:w-auto">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                className="w-full sm:w-auto shadow-sm">
                Add New Report
              </Button>
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <CaseReportSearchBar
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
          filters={filters}
          loading={loading}
          searchPlaceholder="Search reports or filter by case..."
          showCaseSearch={true}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Spin size="large" />
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert
            message="Error Loading Reports"
            description={error}
            type="error"
            showIcon
            className="mb-6 rounded-lg"
          />
        )}

        {/* Reports List */}
        {!loading && !error && (
          <>
            {currentReports?.length > 0 ? (
              <div className="space-y-4">
                {currentReports.map((report) => {
                  const canEdit =
                    isSuperAdmin || report?.reportedBy?._id === user?.data?._id;
                  const canDelete = canEdit;

                  return (
                    <ReportCard
                      key={report._id}
                      report={report}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDownload={handleDownload}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      hideButtons={hideButtons}
                      shortenText={shortenText}
                      loadingPdf={loadingPdf}
                    />
                  );
                })}
              </div>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="py-8">
                    <p className="text-lg text-gray-600 mb-2">
                      No reports found
                    </p>
                    <p className="text-sm text-gray-500">
                      {filters?.search
                        ? "Try adjusting your search filters"
                        : "Start by creating your first report"}
                    </p>
                    {!hideButtons && isStaff && (
                      <Link to="add-report">
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          className="mt-4">
                          Add New Report
                        </Button>
                      </Link>
                    )}
                  </div>
                }
                className="py-12"
              />
            )}

            {/* Pagination */}
            {!hideButtons && currentReports?.length > 0 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  current={pagination.current}
                  total={pagination.totalRecords}
                  pageSize={pagination.limit}
                  onChange={handlePageChange}
                  showSizeChanger
                  showTotal={(total, range) =>
                    `Showing ${range[0]}-${range[1]} of ${total} reports`
                  }
                  pageSizeOptions={["5", "10", "20", "50"]}
                  responsive
                  className="bg-white p-4 rounded-lg shadow-sm"
                />
              </div>
            )}
          </>
        )}

        {/* Edit Modal */}
        {editingReportId && (
          <UpdateCaseReportForm
            reportId={editingReportId}
            onClose={handleEditClose}
          />
        )}
      </div>
    </div>
  );
};

CaseReportList.propTypes = {
  title: PropTypes.string,
  showFilter: PropTypes.bool,
  hideButtons: PropTypes.bool,
  titleStyle: PropTypes.string,
  nameStyle: PropTypes.string,
  endpoint: PropTypes.string,
};

CaseReportList.defaultProps = {
  hideButtons: false,
  showFilter: false,
  title: "Case Reports",
  titleStyle: "",
  nameStyle: "",
  endpoint: "reports",
};

export default CaseReportList;
