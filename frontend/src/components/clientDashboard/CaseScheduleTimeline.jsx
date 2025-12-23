import PropTypes from "prop-types";
import { useState, useMemo, useCallback, memo, useEffect } from "react";
import {
  Timeline,
  Card,
  Tag,
  Typography,
  Select,
  Button,
  Empty,
  Space,
  Avatar,
  Pagination,
  Spin,
  Input,
  DatePicker,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  BankOutlined,
  DownloadOutlined,
  SearchOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Memoized timeline dot component
const TimelineDot = memo(({ color }) => {
  const bgColorClass =
    {
      red: "bg-red-500",
      orange: "bg-orange-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      gray: "bg-gray-500",
    }[color] || "bg-gray-500";

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md ${bgColorClass}`}>
        <CalendarOutlined className="text-white text-xs" />
      </div>
    </motion.div>
  );
});

TimelineDot.displayName = "TimelineDot";

// Memoized case card component
const CaseCard = memo(
  ({ caseItem, index, dateInfo, timelineColor, isPast }) => {
    // Format time to show Nigeria time (9am instead of 12am)
    const formatNigeriaTime = (dateString) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Africa/Lagos",
        });
      } catch {
        return "Invalid Time";
      }
    };

    const nigeriaTime = formatNigeriaTime(caseItem.adjournedDate);

    return (
      <motion.div
        initial={{ opacity: 0, x: isPast ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}>
        <Card
          className={`timeline-card ${
            isPast ? "bg-gray-50" : "bg-white"
          } hover:shadow-lg transition-all duration-200 border-l-4 ${
            timelineColor === "red"
              ? "border-l-red-500"
              : timelineColor === "orange"
              ? "border-l-orange-500"
              : timelineColor === "blue"
              ? "border-l-blue-500"
              : timelineColor === "green"
              ? "border-l-green-500"
              : "border-l-gray-500"
          }`}
          size="small">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <Title level={5} className="m-0 mb-1 truncate">
                  {caseItem.caseReported?.suitNo || `Case #${index + 1}`}
                </Title>
                <Text className="text-gray-600 text-sm block truncate">
                  {caseItem.caseReported?.firstParty?.name?.[0]?.name ||
                    "Plaintiff"}{" "}
                  vs{" "}
                  {caseItem.caseReported?.secondParty?.name?.[0]?.name ||
                    "Defendant"}
                </Text>
              </div>
              <Tag color={timelineColor} className="ml-2 flex-shrink-0">
                {dateInfo.relative}
              </Tag>
            </div>

            {/* Date and Time */}
            <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg">
              <div className="flex items-center gap-2">
                <CalendarOutlined className="text-gray-400" />
                <Text className="font-medium">{dateInfo.date}</Text>
              </div>
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-gray-400" />
                <Text className="font-medium">{nigeriaTime}</Text>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <Text className="text-gray-500 block mb-1">Court</Text>
                <div className="flex items-center gap-1">
                  <BankOutlined className="text-gray-400 text-xs" />
                  <Text strong className="truncate">
                    {caseItem.caseReported?.courtName || "N/A"}
                  </Text>
                </div>
              </div>
              <div>
                <Text className="text-gray-500 block mb-1">Purpose</Text>
                <Text strong className="truncate">
                  {caseItem.adjournedFor || "Hearing"}
                </Text>
              </div>
            </div>

            {/* Legal Team Preview */}
            {caseItem.caseReported?.accountOfficer?.length > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <Text className="text-gray-500 text-sm block mb-2">
                  Legal Team
                </Text>
                <div className="flex items-center -space-x-2">
                  {caseItem.caseReported.accountOfficer
                    .slice(0, 3)
                    .map((officer, idx) => (
                      <Avatar
                        key={officer._id || idx}
                        src={officer.photo}
                        size="small"
                        className="border-2 border-white shadow-sm">
                        {officer.firstName?.[0]}
                        {officer.lastName?.[0]}
                      </Avatar>
                    ))}
                  {caseItem.caseReported.accountOfficer.length > 3 && (
                    <Avatar
                      size="small"
                      className="bg-gray-200 text-gray-600 border-2 border-white">
                      +{caseItem.caseReported.accountOfficer.length - 3}
                    </Avatar>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button size="small" type="primary" className="flex-1">
                View Details
              </Button>
              <Button size="small" icon={<DownloadOutlined />}>
                Download
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }
);

CaseCard.displayName = "CaseCard";

const CaseScheduleTimeline = ({ cases, showFilters = false }) => {
  const [viewMode, setViewMode] = useState("upcoming");
  const [courtFilter, setCourtFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const pageSize = 10; // Show 10 cases per page

  // Utility functions with Nigeria timezone
  const getTimelineColor = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    // Convert to Nigeria timezone for accurate comparison
    const nigeriaDate = new Date(
      date.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
    );
    const nigeriaNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
    );

    // Set both dates to start of day for comparison
    nigeriaDate.setHours(0, 0, 0, 0);
    nigeriaNow.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
      (nigeriaDate - nigeriaNow) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return "gray";
    if (diffDays === 0) return "red";
    if (diffDays <= 3) return "orange";
    if (diffDays <= 7) return "blue";
    return "green";
  }, []);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const nigeriaDate = new Date(
      date.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
    );

    return {
      date: nigeriaDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "Africa/Lagos",
      }),
      time: nigeriaDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Lagos",
      }),
      relative: getRelativeTime(nigeriaDate),
    };
  }, []);

  const getRelativeTime = useCallback((date) => {
    const now = new Date();
    const nigeriaNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
    );

    // Set both dates to start of day
    date.setHours(0, 0, 0, 0);
    nigeriaNow.setHours(0, 0, 0, 0);

    const diffMs = date - nigeriaNow;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.floor(diffDays / 7)} weeks`;
    return `In ${Math.floor(diffDays / 30)} months`;
  }, []);

  // Filtered and sorted cases with pagination
  const { filteredCases, totalPages } = useMemo(() => {
    if (isLoading) return { filteredCases: [], totalPages: 0 };

    let filtered = [...cases];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((caseItem) => {
        const suitNo = caseItem.caseReported?.suitNo || "";
        const adjournedFor = caseItem.adjournedFor || "";
        const firstName =
          caseItem.caseReported?.firstParty?.name?.[0]?.name || "";
        const secondName =
          caseItem.caseReported?.secondParty?.name?.[0]?.name || "";
        const caseTitle = `${firstName} vs ${secondName}`;

        return (
          suitNo.toLowerCase().includes(term) ||
          adjournedFor.toLowerCase().includes(term) ||
          caseTitle.toLowerCase().includes(term)
        );
      });
    }

    // Filter by court
    if (courtFilter !== "all") {
      filtered = filtered.filter(
        (caseItem) => caseItem.caseReported?.courtName === courtFilter
      );
    }

    // Date range filter
    if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter((caseItem) => {
        const caseDate = new Date(caseItem.adjournedDate);
        return (
          caseDate >= dateRange[0].toDate() && caseDate <= dateRange[1].toDate()
        );
      });
    }

    // Filter by view mode
    const now = new Date();
    const nigeriaNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
    );
    nigeriaNow.setHours(0, 0, 0, 0);

    if (viewMode === "upcoming") {
      filtered = filtered.filter((caseItem) => {
        const caseDate = new Date(caseItem.adjournedDate);
        const nigeriaCaseDate = new Date(
          caseDate.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
        );
        nigeriaCaseDate.setHours(0, 0, 0, 0);
        return nigeriaCaseDate >= nigeriaNow;
      });
    } else if (viewMode === "past") {
      filtered = filtered.filter((caseItem) => {
        const caseDate = new Date(caseItem.adjournedDate);
        const nigeriaCaseDate = new Date(
          caseDate.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
        );
        nigeriaCaseDate.setHours(0, 0, 0, 0);
        return nigeriaCaseDate < nigeriaNow;
      });
    }

    // Sort by date
    filtered.sort(
      (a, b) => new Date(a.adjournedDate) - new Date(b.adjournedDate)
    );

    // Calculate pagination
    const totalPages = Math.ceil(filtered.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedCases = filtered.slice(startIndex, startIndex + pageSize);

    return {
      filteredCases: paginatedCases,
      totalPages,
      totalCases: filtered.length,
    };
  }, [
    cases,
    viewMode,
    courtFilter,
    searchTerm,
    dateRange,
    currentPage,
    isLoading,
  ]);

  // Get unique courts for filter
  const courtOptions = useMemo(() => {
    const courts = new Set(
      cases.map((c) => c.caseReported?.courtName).filter(Boolean)
    );
    return Array.from(courts);
  }, [cases]);

  // Handlers
  const handleViewModeChange = useCallback((value) => {
    setViewMode(value);
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  const handleCourtFilterChange = useCallback((value) => {
    setCourtFilter(value);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleDateRangeChange = useCallback((dates) => {
    setDateRange(dates || []);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Simulate loading for large datasets
  useEffect(() => {
    if (cases.length > 50) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cases]);

  if (!cases || cases.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No scheduled cases"
        className="py-12"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <Card className="shadow-sm">
          <div className="flex flex-col gap-4">
            {/* First row: Search and date range */}
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search cases by suit no, party names, or purpose..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={handleSearchChange}
                className="flex-1"
                size="large"
                allowClear
              />
              <RangePicker
                onChange={handleDateRangeChange}
                className="min-w-[250px]"
                size="large"
                allowClear
              />
            </div>

            {/* Second row: Mode and court filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <Space size="middle" className="flex-wrap">
                <Select
                  value={viewMode}
                  onChange={handleViewModeChange}
                  className="min-w-[140px]"
                  size="large">
                  <Option value="upcoming">
                    <Space>
                      <FilterOutlined />
                      Upcoming
                    </Space>
                  </Option>
                  <Option value="past">
                    <Space>
                      <FilterOutlined />
                      Past Cases
                    </Space>
                  </Option>
                  <Option value="all">
                    <Space>
                      <FilterOutlined />
                      All Cases
                    </Space>
                  </Option>
                </Select>

                <Select
                  value={courtFilter}
                  onChange={handleCourtFilterChange}
                  placeholder="Filter by Court"
                  className="min-w-[180px]"
                  size="large">
                  <Option value="all">All Courts</Option>
                  {courtOptions.map((court, index) => (
                    <Option key={index} value={court}>
                      {court}
                    </Option>
                  ))}
                </Select>
              </Space>

              <div className="flex gap-3">
                <Button
                  icon={<DownloadOutlined />}
                  size="large"
                  className="shadow-sm">
                  Export
                </Button>
                <Button
                  icon={<EyeOutlined />}
                  size="large"
                  type="primary"
                  className="shadow-sm">
                  Full Calendar View
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Spin size="large" tip="Loading cases..." />
        </div>
      ) : (
        <>
          {/* Timeline */}
          {filteredCases.length > 0 ? (
            <>
              <div className="relative">
                <Timeline mode="alternate" className="case-timeline">
                  {filteredCases.map((caseItem, index) => {
                    const dateInfo = formatDate(caseItem.adjournedDate);
                    const timelineColor = getTimelineColor(
                      caseItem.adjournedDate
                    );
                    const caseDate = new Date(caseItem.adjournedDate);
                    const nigeriaCaseDate = new Date(
                      caseDate.toLocaleString("en-US", {
                        timeZone: "Africa/Lagos",
                      })
                    );
                    nigeriaCaseDate.setHours(0, 0, 0, 0);

                    const now = new Date();
                    const nigeriaNow = new Date(
                      now.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
                    );
                    nigeriaNow.setHours(0, 0, 0, 0);

                    const isPast = nigeriaCaseDate < nigeriaNow;

                    return (
                      <Timeline.Item
                        key={caseItem._id || index}
                        color={timelineColor}
                        dot={<TimelineDot color={timelineColor} />}>
                        <CaseCard
                          caseItem={caseItem}
                          index={index}
                          dateInfo={dateInfo}
                          timelineColor={timelineColor}
                          isPast={isPast}
                        />
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
                  <Text className="text-gray-600">
                    Showing {(currentPage - 1) * pageSize + 1}-
                    {Math.min(currentPage * pageSize, filteredCases.totalCases)}{" "}
                    of {filteredCases.totalCases} cases
                  </Text>
                  <Pagination
                    current={currentPage}
                    total={filteredCases.totalCases}
                    pageSize={pageSize}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    showQuickJumper
                    responsive
                    showTotal={(total, range) =>
                      `${range[0]}-${range[1]} of ${total} cases`
                    }
                  />
                </div>
              )}
            </>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No cases match the selected filters"
              className="py-12"
            />
          )}
        </>
      )}
    </div>
  );
};

CaseScheduleTimeline.propTypes = {
  cases: PropTypes.array.isRequired,
  showFilters: PropTypes.bool,
};

CaseScheduleTimeline.defaultProps = {
  showFilters: false,
};

export default memo(CaseScheduleTimeline);
