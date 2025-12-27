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
  Drawer,
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
  FilterOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { decode } from "html-entities";
import DOMPurify from "dompurify";
import { capitalizeWords } from "../../utils/capitalise";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Memoized report card with mobile-first design
const ReportCard = memo(({ report, index, compact, onViewDetails }) => {
  const sanitizeContent = (html) => {
    if (!html) return "";
    const decoded = decode(html);
    return DOMPurify.sanitize(decoded, {
      ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "u"],
      ALLOWED_ATTR: [],
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
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
      transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.3) }}>
      <Card
        className="hover:shadow-xl transition-all duration-300 border-0 rounded-2xl mb-4 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          borderLeft: "4px solid #3b82f6",
        }}
        hoverable>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <FileTextOutlined className="text-white text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <Text strong className="text-base text-gray-900 font-bold">
                    {report.caseReported?.suitNo || `Report #${index + 1}`}
                  </Text>
                  {report.reportedBy && (
                    <Tag
                      color="blue"
                      className="text-xs m-0"
                      style={{ borderRadius: "6px" }}>
                      {report.reportedBy.firstName} {report.reportedBy.lastName}
                    </Tag>
                  )}
                </div>
                <Text className="text-sm text-gray-600 block font-medium">
                  {caseTitle}
                </Text>
              </div>
            </div>

            <div className="text-left sm:text-right flex-shrink-0">
              <Text className="text-xs text-gray-500 block">Reported</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {formattedDate}
              </Text>
            </div>
          </div>

          {/* Key Details - Mobile Optimized Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-100">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined className="text-blue-500" />
                  <Text className="text-xs text-gray-600">Next Hearing</Text>
                </div>
                <Text strong className="text-sm text-gray-900 block">
                  {report.adjournedFor || "Not specified"}
                </Text>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-xl border border-green-100">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarOutlined className="text-green-500" />
                  <Text className="text-xs text-gray-600">Date</Text>
                </div>
                <Text strong className="text-sm text-gray-900 block">
                  {report.adjournedDate
                    ? new Date(report.adjournedDate).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )
                    : "N/A"}
                </Text>
              </div>
            </div>
          </div>

          {/* Court Info */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
            <BankOutlined className="text-gray-400" />
            <Text className="text-sm">
              <span className="text-gray-500">Court: </span>
              <span className="font-semibold text-gray-900">
                {capitalizeWords(report.caseReported?.courtName) || "N/A"}
              </span>
            </Text>
          </div>

          {/* Update Preview */}
          {report.update && !compact && (
            <div>
              <Text
                strong
                className="text-xs text-gray-600 uppercase tracking-wide block mb-2">
                Case Update
              </Text>
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 max-h-24 overflow-y-auto">
                <Paragraph
                  className="text-sm text-gray-700 mb-0"
                  ellipsis={{ rows: 2, expandable: false }}>
                  <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
                </Paragraph>
              </div>
            </div>
          )}

          {/* Lawyers Present */}
          {report.lawyersInCourt?.length > 0 && !compact && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Text
                  strong
                  className="text-xs text-gray-600 uppercase tracking-wide">
                  Lawyers Present
                </Text>
                <Badge
                  count={report.lawyersInCourt.length}
                  style={{ backgroundColor: "#3b82f6" }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {report.lawyersInCourt.slice(0, 4).map((lawyer, idx) => (
                  <Tooltip
                    key={lawyer._id || idx}
                    title={`${lawyer.firstName} ${lawyer.lastName}`}>
                    <Tag
                      color="blue"
                      className="cursor-pointer m-0 px-3 py-1 rounded-lg"
                      style={{ border: "1px solid #bfdbfe" }}>
                      {lawyer.firstName?.charAt(0)}. {lawyer.lastName}
                    </Tag>
                  </Tooltip>
                ))}
                {report.lawyersInCourt.length > 4 && (
                  <Tag className="m-0 px-3 py-1 rounded-lg bg-gray-100 text-gray-600 border-gray-200">
                    +{report.lawyersInCourt.length - 4} more
                  </Tag>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
            <Button
              icon={<EyeOutlined />}
              size="middle"
              type="primary"
              onClick={() => onViewDetails(report)}
              className="flex-1 sm:flex-none h-9 rounded-lg font-medium"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
              }}>
              View Details
            </Button>
            <Button
              icon={<DownloadOutlined />}
              size="middle"
              className="h-9 rounded-lg">
              Download
            </Button>
            <Button
              icon={<ShareAltOutlined />}
              size="middle"
              className="h-9 rounded-lg">
              Share
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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const containerRef = useRef(null);

  // Sanitize content
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
      ],
      ALLOWED_ATTR: [],
    });
  }, []);

  // Filter reports
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

  // Calculate pagination
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

  const handlePageChange = useCallback(
    (page, newPageSize) => {
      setCurrentPage(page);
      if (newPageSize && newPageSize !== currentPageSize) {
        setCurrentPageSize(newPageSize);
        setCurrentPage(1);
      }
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

  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setDateRange([]);
    setCurrentPage(1);
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
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

  // Report stats
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
        className="py-16"
      />
    );
  }

  // Filter content for mobile drawer
  const FilterContent = () => (
    <div className="space-y-4">
      <div>
        <Text className="text-sm font-medium text-gray-700 block mb-2">
          Search
        </Text>
        <Input
          placeholder="Search reports..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={handleSearchChange}
          size="large"
          allowClear
        />
      </div>

      <div>
        <Text className="text-sm font-medium text-gray-700 block mb-2">
          Date Range
        </Text>
        <RangePicker
          onChange={handleDateRangeChange}
          className="w-full"
          size="large"
          allowClear
          value={dateRange}
        />
      </div>

      <div>
        <Text className="text-sm font-medium text-gray-700 block mb-2">
          Sort Order
        </Text>
        <Select
          value={sortOrder}
          onChange={handleSortOrderChange}
          className="w-full"
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
      </div>

      {(searchTerm || dateRange.length > 0) && (
        <Button
          onClick={() => {
            clearAllFilters();
            setFilterDrawerOpen(false);
          }}
          block
          size="large"
          className="mt-4">
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6" ref={containerRef}>
      {/* Filters */}
      {showFilters && (
        <>
          {/* Desktop Filters */}
          <Card className="shadow-sm border-0 rounded-2xl hidden md:block">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Search by case number, parties, or details..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="flex-1"
                  size="large"
                  allowClear
                />
                <RangePicker
                  onChange={handleDateRangeChange}
                  className="w-full md:w-auto md:min-w-[280px]"
                  size="large"
                  allowClear
                  value={dateRange}
                />
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <Space size="middle">
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

                  {(searchTerm || dateRange.length > 0) && (
                    <Button onClick={clearAllFilters} size="large">
                      Clear Filters
                    </Button>
                  )}
                </Space>

                <div className="flex items-center gap-3">
                  <Text className="text-sm text-gray-600">
                    Showing {reportStats.showing} of {reportStats.total}
                  </Text>
                  <Badge
                    count={reportStats.filtered}
                    overflowCount={999}
                    showZero
                    style={{ backgroundColor: "#3b82f6" }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Mobile Filter Button */}
          <div className="md:hidden">
            <Button
              size="large"
              icon={<FilterOutlined />}
              onClick={() => setFilterDrawerOpen(true)}
              className="w-full h-12 rounded-xl font-medium"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
              }}>
              Filters & Sort ({reportStats.filtered}/{reportStats.total})
            </Button>
          </div>
        </>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
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

              {/* Pagination */}
              {pagination && totalPages > 1 && (
                <div className="flex flex-col items-center gap-4 mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl">
                  <Text className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages} • Showing{" "}
                    {Math.min(
                      (currentPage - 1) * currentPageSize + 1,
                      filteredReports.length
                    )}
                    -
                    {Math.min(
                      currentPage * currentPageSize,
                      filteredReports.length
                    )}{" "}
                    of {filteredReports.length}
                  </Text>

                  <Pagination
                    current={currentPage}
                    total={filteredReports.length}
                    pageSize={currentPageSize}
                    onChange={handlePageChange}
                    onShowSizeChange={handlePageChange}
                    showSizeChanger
                    showQuickJumper
                    responsive
                    pageSizeOptions={["10", "20", "50"]}
                    className="flex-wrap justify-center"
                  />
                </div>
              )}
            </>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="space-y-3 py-8">
                  <p className="text-gray-600 text-base">
                    No reports match your filters
                  </p>
                  <Button
                    type="primary"
                    onClick={clearAllFilters}
                    className="rounded-lg">
                    Clear all filters
                  </Button>
                </div>
              }
              className="py-16"
            />
          )}
        </>
      )}

      {/* Mobile Filter Drawer */}
      <Drawer
        title="Filters & Sort"
        placement="right"
        onClose={() => setFilterDrawerOpen(false)}
        open={filterDrawerOpen}
        closeIcon={<CloseOutlined />}
        width={320}>
        <FilterContent />
      </Drawer>

      {/* Report Details Modal */}
      <Modal
        title={null}
        open={showReportModal}
        onCancel={closeModal}
        width={800}
        footer={null}
        closeIcon={<CloseOutlined />}
        className="report-modal-modern"
        style={{ top: 20 }}>
        {selectedReport && (
          <div className="space-y-6 p-4">
            {/* Modal Header */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <Title level={3} className="m-0 text-gray-900">
                  {selectedReport.caseReported?.suitNo || "Case Report"}
                </Title>
                <Tag color="blue" className="text-sm px-3 py-1">
                  {formatDate(selectedReport.date || selectedReport.createdAt)}
                </Tag>
              </div>
              <Text className="text-gray-600 text-base">
                {getPartyNames(selectedReport).caseTitle}
              </Text>
            </div>

            <Divider />

            {/* Report Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                  <Text strong className="text-sm text-gray-700 block mb-3">
                    Case Information
                  </Text>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <Text className="text-xs text-gray-500">Court:</Text>
                      <Text strong className="text-sm text-right">
                        {selectedReport.caseReported?.courtName || "N/A"}
                      </Text>
                    </div>
                    <div className="flex justify-between items-start">
                      <Text className="text-xs text-gray-500">Court No:</Text>
                      <Text strong className="text-sm">
                        {selectedReport.caseReported?.courtNo || "N/A"}
                      </Text>
                    </div>
                    <div className="flex justify-between items-start">
                      <Text className="text-xs text-gray-500">Location:</Text>
                      <Text strong className="text-sm text-right">
                        {selectedReport.caseReported?.location || "N/A"}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                  <Text strong className="text-sm text-gray-700 block mb-3">
                    Next Hearing
                  </Text>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <Text className="text-xs text-gray-500">Purpose:</Text>
                      <Text strong className="text-sm text-right">
                        {selectedReport.adjournedFor || "N/A"}
                      </Text>
                    </div>
                    <div className="flex justify-between items-start">
                      <Text className="text-xs text-gray-500">Date:</Text>
                      <Text strong className="text-sm">
                        {selectedReport.adjournedDate
                          ? formatDate(selectedReport.adjournedDate)
                          : "N/A"}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                  <Text strong className="text-sm text-gray-700 block mb-3">
                    Reported By
                  </Text>
                  <div className="flex items-center gap-3">
                    <Avatar size={48} src={selectedReport.reportedBy?.photo}>
                      {selectedReport.reportedBy?.firstName?.[0]}
                    </Avatar>
                    <div>
                      <Text strong className="block text-sm">
                        {selectedReport.reportedBy?.firstName}{" "}
                        {selectedReport.reportedBy?.lastName}
                      </Text>
                      <Text className="text-xs text-gray-600">
                        {selectedReport.reportedBy?.position || "Legal Officer"}
                      </Text>
                    </div>
                  </div>
                </div>

                {selectedReport.lawyersInCourt?.length > 0 && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                    <div className="flex items-center justify-between mb-3">
                      <Text strong className="text-sm text-gray-700">
                        Lawyers Present
                      </Text>
                      <Badge
                        count={selectedReport.lawyersInCourt.length}
                        style={{ backgroundColor: "#f59e0b" }}
                      />
                    </div>
                    <div className="space-y-2">
                      {selectedReport.lawyersInCourt.map((lawyer, idx) => (
                        <div
                          key={lawyer._id || idx}
                          className="flex items-center gap-2 p-2 hover:bg-white/50 rounded-lg transition-colors">
                          <Avatar size="small" src={lawyer.photo}>
                            {lawyer.firstName?.[0]}
                          </Avatar>
                          <Text className="text-sm">
                            {lawyer.firstName} {lawyer.lastName}
                          </Text>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Case Update */}
            {selectedReport.update && (
              <>
                <Divider />
                <div>
                  <Text strong className="text-sm text-gray-700 block mb-3">
                    Case Update Details
                  </Text>
                  <div
                    className="bg-gray-50 border border-gray-200 p-4 rounded-xl max-h-80 overflow-y-auto prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeContent(selectedReport.update),
                    }}
                  />
                </div>
              </>
            )}

            {/* Modal Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                size="large"
                className="flex-1 h-12 rounded-xl font-medium"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                }}>
                Download Report
              </Button>
              <Button
                size="large"
                onClick={closeModal}
                className="h-12 px-6 rounded-xl">
                Close
              </Button>
            </div>
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
