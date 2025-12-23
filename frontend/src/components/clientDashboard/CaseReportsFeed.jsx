import PropTypes from "prop-types";
import { useState, useMemo, useCallback, memo, useRef } from "react";
import {
  Card,
  Avatar,
  Tag,
  Typography,
  Input,
  DatePicker,
  Button,
  Empty,
  Pagination,
  Tooltip,
  Badge,
  Modal,
  Divider,
  Select,
  Space,
  Spin,
} from "antd";
import {
  SearchOutlined,
  FileTextOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  BankOutlined,
  TeamOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  EyeOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { decode } from "html-entities";
import DOMPurify from "dompurify";
import { capitalizeWords } from "../../utils/capitalise";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Memoized report card component
const ReportCard = memo(({ report, index, compact, onViewDetails }) => {
  const sanitizeContent = (html) => {
    if (!html) return "";
    const decoded = decode(html);
    return DOMPurify.sanitize(decoded, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "ul",
        "ol",
        "li",
        "span",
      ],
      ALLOWED_ATTR: ["style", "class"],
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const getPartyNames = (report) => {
    const firstParty = report?.caseReported?.firstParty?.name || [];
    const secondParty = report?.caseReported?.secondParty?.name || [];

    const firstNames = firstParty
      .map((p) => p.name)
      .filter(Boolean)
      .join(", ");
    const secondNames = secondParty
      .map((p) => p.name)
      .filter(Boolean)
      .join(", ");

    return `${firstNames || "Plaintiff"} vs ${secondNames || "Defendant"}`;
  };

  const formattedDate = formatDate(report.date || report.createdAt);
  const caseTitle = getPartyNames(report);
  const sanitizedContent = sanitizeContent(report.update);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.5) }}>
      <Card
        className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 mb-4"
        hoverable>
        <div className={compact ? "p-2" : "p-1"}>
          {/* Report Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className={`${
                  compact ? "w-10 h-10" : "w-12 h-12"
                } bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                <FileTextOutlined className="text-blue-600 text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <Title
                    level={compact ? 5 : 4}
                    className="m-0 text-gray-900 truncate">
                    {report.caseReported?.suitNo || `Report #${index + 1}`}
                  </Title>
                  {report.reportedBy && (
                    <Badge
                      count={`By: ${report.reportedBy.firstName} ${report.reportedBy.lastName}`}
                      style={{
                        backgroundColor: "#f0f9ff",
                        color: "#0369a1",
                        borderColor: "#bae6fd",
                      }}
                    />
                  )}
                </div>
                <Text className="text-gray-700 font-medium block truncate">
                  {caseTitle}
                </Text>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <Text className="text-xs text-gray-500 block">Reported on</Text>
              <Text className="text-sm font-semibold whitespace-nowrap">
                {formattedDate}
              </Text>
            </div>
          </div>

          {/* Report Details */}
          <div
            className={`grid ${
              compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
            } gap-4 mb-4`}>
            <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-gray-400" />
                <Text className="text-sm">
                  <strong>Next Hearing:</strong>{" "}
                  {report.adjournedFor || "Not specified"}
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <CalendarOutlined className="text-gray-400" />
                <Text className="text-sm">
                  <strong>Adjourned Date:</strong>{" "}
                  {report.adjournedDate
                    ? new Date(report.adjournedDate).toLocaleDateString()
                    : "N/A"}
                </Text>
              </div>
            </div>
            <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <BankOutlined className="text-gray-400" />
                <Text className="text-sm">
                  <strong>Court:</strong>{" "}
                  {capitalizeWords(report.caseReported?.courtName) || "N/A"}
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <TeamOutlined className="text-gray-400" />
                <Text className="text-sm">
                  <strong>Reported by:</strong>{" "}
                  {report.reportedBy
                    ? `${report.reportedBy.firstName} ${report.reportedBy.lastName}`
                    : "N/A"}
                </Text>
              </div>
            </div>
          </div>

          {/* Update Content Preview */}
          {report.update && !compact && (
            <div className="mb-4">
              <Text strong className="text-gray-700 mb-2 block">
                Update
              </Text>
              <Paragraph
                className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto mb-0"
                ellipsis={{
                  rows: 3,
                  expandable: true,
                  symbol: "more",
                }}>
                <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
              </Paragraph>
            </div>
          )}

          {/* Lawyers in Court */}
          {report.lawyersInCourt?.length > 0 && !compact && (
            <div className="mb-4">
              <Text strong className="text-gray-700 mb-2 block">
                Lawyers Present
              </Text>
              <div className="flex flex-wrap gap-2">
                {report.lawyersInCourt.map((lawyer, idx) => (
                  <Tooltip
                    key={lawyer._id || idx}
                    title={`${lawyer.firstName} ${lawyer.lastName}`}>
                    <Tag color="blue" className="cursor-pointer">
                      {lawyer.firstName?.charAt(0)}. {lawyer.lastName}
                    </Tag>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-gray-200">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => onViewDetails(report)}>
              {compact ? "" : "Details"}
            </Button>
            <Button icon={<DownloadOutlined />} size="small">
              {compact ? "" : "Download"}
            </Button>
            <Button icon={<ShareAltOutlined />} size="small">
              {compact ? "" : "Share"}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

ReportCard.displayName = "ReportCard";

const CaseReportsFeed = ({
  reports,
  maxItems = null,
  showFilters = false,
  pagination = false,
  pageSize = 10,
  compact = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const containerRef = useRef(null);

  // Sanitize and decode HTML content
  const sanitizeContent = useCallback((html) => {
    if (!html) return "";
    const decoded = decode(html);
    return DOMPurify.sanitize(decoded, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "ul",
        "ol",
        "li",
        "span",
      ],
      ALLOWED_ATTR: ["style", "class"],
    });
  }, []);

  // Filter reports with performance optimization
  const filteredReports = useMemo(() => {
    setIsLoading(true);
    let filtered = [...reports];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((report) => {
        const suitNo = report.caseReported?.suitNo || "";
        const adjournedFor = report.adjournedFor || "";
        const update = report.update || "";
        const firstName =
          report.caseReported?.firstParty?.name?.[0]?.name || "";
        const secondName =
          report.caseReported?.secondParty?.name?.[0]?.name || "";
        const caseTitle = `${firstName} vs ${secondName}`;

        return (
          suitNo.toLowerCase().includes(term) ||
          adjournedFor.toLowerCase().includes(term) ||
          update.toLowerCase().includes(term) ||
          caseTitle.toLowerCase().includes(term)
        );
      });
    }

    // Date range filter
    if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((report) => {
        const reportDate = new Date(report.date || report.createdAt);
        return (
          reportDate >= dateRange[0].toDate() &&
          reportDate <= dateRange[1].toDate()
        );
      });
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0);
      const dateB = new Date(b.date || b.createdAt || 0);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    setIsLoading(false);
    return filtered;
  }, [reports, searchTerm, dateRange, sortOrder]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredReports.length / currentPageSize);
  }, [filteredReports.length, currentPageSize]);

  // Get paginated results
  const paginatedReports = useMemo(() => {
    if (!pagination && !maxItems) {
      return filteredReports;
    }

    if (maxItems && !pagination) {
      return filteredReports.slice(0, maxItems);
    }

    const startIndex = (currentPage - 1) * currentPageSize;
    return filteredReports.slice(startIndex, startIndex + currentPageSize);
  }, [filteredReports, currentPage, pagination, maxItems, currentPageSize]);

  // Handlers
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleDateRangeChange = useCallback((dates) => {
    setDateRange(dates || []);
    setCurrentPage(1);
  }, []);

  const handleSortOrderChange = useCallback((value) => {
    setSortOrder(value);
  }, []);

  const handleStatusFilterChange = useCallback((value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback(
    (page, newPageSize) => {
      setCurrentPage(page);
      if (newPageSize && newPageSize !== currentPageSize) {
        setCurrentPageSize(newPageSize);
        setCurrentPage(1);
      }
      // Scroll to top when page changes
      if (containerRef.current) {
        containerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    },
    [currentPageSize]
  );

  const viewReportDetails = useCallback((report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowReportModal(false);
    setSelectedReport(null);
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  }, []);

  const getPartyNames = useCallback((report) => {
    const firstParty = report?.caseReported?.firstParty?.name || [];
    const secondParty = report?.caseReported?.secondParty?.name || [];

    const firstNames = firstParty
      .map((p) => p.name)
      .filter(Boolean)
      .join(", ");
    const secondNames = secondParty
      .map((p) => p.name)
      .filter(Boolean)
      .join(", ");

    return {
      firstParty: firstNames || "Plaintiff",
      secondParty: secondNames || "Defendant",
      caseTitle: `${firstNames || "Plaintiff"} vs ${
        secondNames || "Defendant"
      }`,
    };
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setDateRange([]);
    setStatusFilter("all");
    setCurrentPage(1);
  }, []);

  // Calculate report stats
  const reportStats = useMemo(() => {
    return {
      total: reports.length,
      filtered: filteredReports.length,
      showing: paginatedReports.length,
    };
  }, [reports.length, filteredReports.length, paginatedReports.length]);

  if (!reports || reports.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No case reports available"
        className="py-12"
      />
    );
  }

  return (
    <div className="space-y-6" ref={containerRef}>
      {/* Filters */}
      {showFilters && (
        <Card className="shadow-sm">
          <div className="space-y-4">
            {/* Top row: Search and date range */}
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search reports by case number, parties, or details..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={handleSearchChange}
                className="flex-1"
                size="large"
                allowClear
              />
              <RangePicker
                onChange={handleDateRangeChange}
                className="w-full md:w-auto md:min-w-[250px]"
                size="large"
                allowClear
                value={dateRange}
              />
            </div>

            {/* Bottom row: Sort and status filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <Space size="middle" className="flex-wrap">
                <Select
                  value={sortOrder}
                  onChange={handleSortOrderChange}
                  className="w-[180px]"
                  size="large">
                  <Option value="desc">
                    <Space>
                      <SortDescendingOutlined />
                      Newest First
                    </Space>
                  </Option>
                  <Option value="asc">
                    <Space>
                      <SortAscendingOutlined />
                      Oldest First
                    </Space>
                  </Option>
                </Select>

                {(searchTerm ||
                  dateRange.length > 0 ||
                  statusFilter !== "all") && (
                  <Button onClick={clearAllFilters} size="large">
                    Clear Filters
                  </Button>
                )}
              </Space>

              <div className="flex items-center gap-2">
                <Text className="text-gray-600 text-sm">
                  Showing {reportStats.showing} of {reportStats.total}
                </Text>
                <Badge
                  count={reportStats.filtered}
                  overflowCount={999}
                  showZero
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Spin size="large" tip="Loading reports..." />
        </div>
      ) : (
        <>
          {/* Reports List */}
          {filteredReports.length > 0 ? (
            <>
              <div className="space-y-4">
                {paginatedReports.map((report, index) => (
                  <ReportCard
                    key={report._id || index}
                    report={report}
                    index={index}
                    compact={compact}
                    onViewDetails={viewReportDetails}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination && totalPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1 text-center md:text-left">
                    <Text className="text-gray-600 text-sm block">
                      Page {currentPage} of {totalPages}
                    </Text>
                    <Text className="text-gray-500 text-xs block">
                      Showing{" "}
                      {Math.min(
                        (currentPage - 1) * currentPageSize + 1,
                        filteredReports.length
                      )}
                      {" - "}
                      {Math.min(
                        currentPage * currentPageSize,
                        filteredReports.length
                      )}{" "}
                      of {filteredReports.length} reports
                    </Text>
                  </div>

                  <Pagination
                    current={currentPage}
                    total={filteredReports.length}
                    pageSize={currentPageSize}
                    onChange={handlePageChange}
                    onShowSizeChange={handlePageChange}
                    showSizeChanger
                    showQuickJumper
                    responsive
                    pageSizeOptions={["10", "20", "50", "100"]}
                    showTotal={(total, range) =>
                      `${range[0]}-${range[1]} of ${total}`
                    }
                  />
                </div>
              )}

              {/* View All Link for limited view */}
              {maxItems && filteredReports.length > maxItems && !pagination && (
                <div className="text-center pt-4">
                  {/* <Button
                    type="link"
                    className="text-blue-600 font-medium"
                    size="large">
                    View All Reports ({filteredReports.length})
                    <EyeOutlined className="ml-2" />
                  </Button> */}
                </div>
              )}
            </>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="space-y-2">
                  <p className="text-gray-600">
                    No reports match your search criteria
                  </p>
                  <Button type="primary" size="small" onClick={clearAllFilters}>
                    Clear all filters
                  </Button>
                </div>
              }
              className="py-12"
            />
          )}
        </>
      )}

      {/* Report Details Modal */}
      <Modal
        title="Case Report Details"
        open={showReportModal}
        onCancel={closeModal}
        width={800}
        footer={[
          <Button key="close" onClick={closeModal}>
            Close
          </Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />}>
            Download Report
          </Button>,
        ]}
        className="report-modal">
        {selectedReport && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <Title level={3} className="m-0">
                  {selectedReport.caseReported?.suitNo || "Case Report"}
                </Title>
                <Text className="text-gray-600">
                  {getPartyNames(selectedReport).caseTitle}
                </Text>
              </div>
              <div className="text-right">
                <Text className="text-gray-500 block">Reported on</Text>
                <Text strong>
                  {formatDate(selectedReport.date || selectedReport.createdAt)}
                </Text>
              </div>
            </div>

            <Divider />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Text strong className="text-gray-700 block mb-2">
                    Case Information
                  </Text>
                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <Text className="text-gray-600">Court:</Text>
                      <Text strong>
                        {selectedReport.caseReported?.courtName || "N/A"}
                      </Text>
                    </div>
                    <div className="flex justify-between">
                      <Text className="text-gray-600">Court No:</Text>
                      <Text strong>
                        {selectedReport.caseReported?.courtNo || "N/A"}
                      </Text>
                    </div>
                    <div className="flex justify-between">
                      <Text className="text-gray-600">Location:</Text>
                      <Text strong>
                        {selectedReport.caseReported?.location || "N/A"}
                      </Text>
                    </div>
                  </div>
                </div>

                <div>
                  <Text strong className="text-gray-700 block mb-2">
                    Next Hearing
                  </Text>
                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <Text className="text-gray-600">Purpose:</Text>
                      <Text strong>{selectedReport.adjournedFor || "N/A"}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text className="text-gray-600">Date:</Text>
                      <Text strong>
                        {selectedReport.adjournedDate
                          ? new Date(
                              selectedReport.adjournedDate
                            ).toLocaleDateString()
                          : "N/A"}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Text strong className="text-gray-700 block mb-2">
                    Reported By
                  </Text>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar size="large" src={selectedReport.reportedBy?.photo}>
                      {selectedReport.reportedBy?.firstName?.[0]}
                    </Avatar>
                    <div>
                      <Text strong className="block">
                        {selectedReport.reportedBy?.firstName}{" "}
                        {selectedReport.reportedBy?.lastName}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        {selectedReport.reportedBy?.position || "Legal Officer"}
                      </Text>
                    </div>
                  </div>
                </div>

                {selectedReport.lawyersInCourt?.length > 0 && (
                  <div>
                    <Text strong className="text-gray-700 block mb-2">
                      Lawyers Present
                    </Text>
                    <div className="space-y-2">
                      {selectedReport.lawyersInCourt.map((lawyer, idx) => (
                        <div
                          key={lawyer._id || idx}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded transition-colors">
                          <Avatar size="small" src={lawyer.photo}>
                            {lawyer.firstName?.[0]}
                          </Avatar>
                          <Text>
                            {lawyer.firstName} {lawyer.lastName}
                          </Text>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedReport.update && (
              <>
                <Divider />
                <div>
                  <Text strong className="text-gray-700 block mb-3">
                    Case Update
                  </Text>
                  <div
                    className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeContent(selectedReport.update),
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

CaseReportsFeed.propTypes = {
  reports: PropTypes.array.isRequired,
  maxItems: PropTypes.number,
  showFilters: PropTypes.bool,
  pagination: PropTypes.bool,
  pageSize: PropTypes.number,
  compact: PropTypes.bool,
};

CaseReportsFeed.defaultProps = {
  maxItems: null,
  showFilters: false,
  pagination: false,
  pageSize: 10,
  compact: false,
};

export default memo(CaseReportsFeed);
