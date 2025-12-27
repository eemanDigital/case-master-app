import PropTypes from "prop-types";
import { useState, useMemo, useCallback, memo } from "react";
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
  Badge,
  Drawer,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  BankOutlined,
  DownloadOutlined,
  SearchOutlined,
  EyeOutlined,
  TeamOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Memoized timeline dot with gradient design
const TimelineDot = memo(({ color }) => {
  const gradients = {
    red: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    orange: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    blue: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    green: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    gray: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
        style={{ background: gradients[color] || gradients.gray }}>
        <CalendarOutlined className="text-white text-base" />
      </div>
    </motion.div>
  );
});

TimelineDot.displayName = "TimelineDot";

// Memoized case card with modern design
const CaseCard = memo(
  ({ caseItem, index, dateInfo, timelineColor, isPast }) => {
    const formatNigeriaTime = (dateString) => {
      try {
        const date = new Date(dateString);
        const hours = date.getHours();
        const minutes = date.getMinutes();

        // Default to 9:00 AM if midnight
        if (hours === 0 && minutes === 0) {
          date.setHours(9, 0, 0, 0);
        }

        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Africa/Lagos",
        });
      } catch {
        return "9:00 AM";
      }
    };

    const nigeriaTime = formatNigeriaTime(caseItem.adjournedDate);

    const gradients = {
      red: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
      orange: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
      blue: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
      green: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
      gray: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
    };

    const borderColors = {
      red: "#ef4444",
      orange: "#f97316",
      blue: "#3b82f6",
      green: "#10b981",
      gray: "#6b7280",
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: isPast ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}>
        <Card
          className={`hover:shadow-2xl transition-all duration-300 border-0 rounded-2xl overflow-hidden ${
            isPast ? "opacity-70" : ""
          }`}
          style={{
            background: gradients[timelineColor],
            borderLeft: `4px solid ${borderColors[timelineColor]}`,
          }}>
          <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Title level={5} className="m-0 text-gray-900 font-bold">
                    {caseItem.caseReported?.suitNo || `Case #${index + 1}`}
                  </Title>
                  <Tag
                    color={timelineColor}
                    className="m-0 px-3 py-1 rounded-lg font-semibold">
                    {dateInfo.relative}
                  </Tag>
                </div>
                <Text className="text-sm text-gray-700 block font-medium">
                  {caseItem.caseReported?.firstParty?.name?.[0]?.name ||
                    "Plaintiff"}{" "}
                  <span className="text-gray-500">vs</span>{" "}
                  {caseItem.caseReported?.secondParty?.name?.[0]?.name ||
                    "Defendant"}
                </Text>
              </div>
            </div>

            {/* Date and Time - Mobile Optimized */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-white/40">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarOutlined
                    style={{ color: borderColors[timelineColor] }}
                  />
                  <Text className="text-xs text-gray-500">Date</Text>
                </div>
                <Text strong className="text-sm text-gray-900 block">
                  {dateInfo.date}
                </Text>
              </div>
              <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-white/40">
                <div className="flex items-center gap-2 mb-1">
                  <ClockCircleOutlined
                    style={{ color: borderColors[timelineColor] }}
                  />
                  <Text className="text-xs text-gray-500">Time</Text>
                </div>
                <Text strong className="text-sm text-gray-900 block">
                  {nigeriaTime}
                </Text>
              </div>
            </div>

            {/* Case Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-white/40">
                <div className="flex items-start gap-2">
                  <BankOutlined
                    className="text-base mt-0.5"
                    style={{ color: borderColors[timelineColor] }}
                  />
                  <div className="flex-1 min-w-0">
                    <Text className="text-xs text-gray-500 block">Court</Text>
                    <Text
                      strong
                      className="text-sm text-gray-900 block break-words">
                      {caseItem.caseReported?.courtName || "N/A"}
                    </Text>
                  </div>
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-white/40">
                <div className="flex items-start gap-2">
                  <EyeOutlined
                    className="text-base mt-0.5"
                    style={{ color: borderColors[timelineColor] }}
                  />
                  <div className="flex-1 min-w-0">
                    <Text className="text-xs text-gray-500 block">Purpose</Text>
                    <Text
                      strong
                      className="text-sm text-gray-900 block break-words">
                      {caseItem.adjournedFor || "Hearing"}
                    </Text>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Team Preview */}
            {caseItem.caseReported?.accountOfficer?.length > 0 && (
              <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-white/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TeamOutlined
                      style={{ color: borderColors[timelineColor] }}
                    />
                    <Text className="text-xs text-gray-500 font-medium">
                      Legal Team
                    </Text>
                  </div>
                  <Badge
                    count={caseItem.caseReported.accountOfficer.length}
                    style={{
                      backgroundColor: borderColors[timelineColor],
                    }}
                  />
                </div>
                <div className="flex items-center -space-x-2">
                  {caseItem.caseReported.accountOfficer
                    .slice(0, 4)
                    .map((officer, idx) => (
                      <Avatar
                        key={officer._id || idx}
                        src={officer.photo}
                        size={32}
                        className="border-2 border-white shadow-md">
                        {officer.firstName?.[0]}
                        {officer.lastName?.[0]}
                      </Avatar>
                    ))}
                  {caseItem.caseReported.accountOfficer.length > 4 && (
                    <Avatar
                      size={32}
                      className="bg-gray-600 text-white border-2 border-white shadow-md">
                      +{caseItem.caseReported.accountOfficer.length - 4}
                    </Avatar>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-white/40">
              <Button
                type="primary"
                className="flex-1 h-10 rounded-xl font-medium"
                style={{
                  background: `linear-gradient(135deg, ${borderColors[timelineColor]} 0%, ${borderColors[timelineColor]}dd 100%)`,
                  border: "none",
                }}>
                View Details
              </Button>
              <Button
                icon={<DownloadOutlined />}
                className="h-10 px-4 rounded-xl">
                Export
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
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const pageSize = 10;

  // Utility functions
  const getTimelineColor = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    const nigeriaDate = new Date(
      date.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
    );
    const nigeriaNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
    );

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

  // Filtered and sorted cases
  const { filteredCases, totalPages, totalCases } = useMemo(() => {
    if (isLoading) return { filteredCases: [], totalPages: 0, totalCases: 0 };

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

    // Court filter
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

    // View mode filter
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

    const totalCases = filtered.length;
    const totalPages = Math.ceil(totalCases / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedCases = filtered.slice(startIndex, startIndex + pageSize);

    return {
      filteredCases: paginatedCases,
      totalPages,
      totalCases,
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

  // Get unique courts
  const courtOptions = useMemo(() => {
    const courts = new Set(
      cases.map((c) => c.caseReported?.courtName).filter(Boolean)
    );
    return Array.from(courts);
  }, [cases]);

  // Handlers
  const handleViewModeChange = useCallback((value) => {
    setViewMode(value);
    setCurrentPage(1);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!cases || cases.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No scheduled cases"
        className="py-16"
      />
    );
  }

  // Filter content component
  const FilterContent = () => (
    <div className="space-y-4">
      <div>
        <Text className="text-sm font-medium text-gray-700 block mb-2">
          Search
        </Text>
        <Input
          placeholder="Search cases..."
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
        />
      </div>

      <div>
        <Text className="text-sm font-medium text-gray-700 block mb-2">
          View Mode
        </Text>
        <Select
          value={viewMode}
          onChange={handleViewModeChange}
          className="w-full"
          size="large">
          <Option value="upcoming">Upcoming Cases</Option>
          <Option value="past">Past Cases</Option>
          <Option value="all">All Cases</Option>
        </Select>
      </div>

      <div>
        <Text className="text-sm font-medium text-gray-700 block mb-2">
          Court
        </Text>
        <Select
          value={courtFilter}
          onChange={handleCourtFilterChange}
          className="w-full"
          size="large">
          <Option value="all">All Courts</Option>
          {courtOptions.map((court, index) => (
            <Option key={index} value={court}>
              {court}
            </Option>
          ))}
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <>
          {/* Desktop Filters */}
          <Card className="shadow-sm border-0 rounded-2xl hidden md:block">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Search by case number, parties, or purpose..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="flex-1"
                  size="large"
                  allowClear
                />
                <RangePicker
                  onChange={handleDateRangeChange}
                  className="min-w-[280px]"
                  size="large"
                  allowClear
                />
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <Space size="middle" className="flex-wrap">
                  <Select
                    value={viewMode}
                    onChange={handleViewModeChange}
                    className="w-[160px]"
                    size="large">
                    <Option value="upcoming">Upcoming</Option>
                    <Option value="past">Past Cases</Option>
                    <Option value="all">All Cases</Option>
                  </Select>

                  <Select
                    value={courtFilter}
                    onChange={handleCourtFilterChange}
                    placeholder="Filter by Court"
                    className="w-[200px]"
                    size="large">
                    <Option value="all">All Courts</Option>
                    {courtOptions.map((court, index) => (
                      <Option key={index} value={court}>
                        {court}
                      </Option>
                    ))}
                  </Select>
                </Space>

                <div className="flex items-center gap-3">
                  <Button
                    icon={<DownloadOutlined />}
                    size="large"
                    className="h-10 rounded-xl">
                    Export Schedule
                  </Button>
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
              Filters ({totalCases} cases)
            </Button>
          </div>
        </>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Spin size="large" tip="Loading cases..." />
        </div>
      ) : (
        <>
          {/* Timeline */}
          {filteredCases.length > 0 ? (
            <>
              <div className="relative">
                <Timeline mode="alternate" className="case-timeline-modern">
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
                <div className="flex flex-col items-center gap-4 mt-8 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl">
                  <Text className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages} • Showing{" "}
                    {(currentPage - 1) * pageSize + 1}-
                    {Math.min(currentPage * pageSize, totalCases)} of{" "}
                    {totalCases} cases
                  </Text>
                  <Pagination
                    current={currentPage}
                    total={totalCases}
                    pageSize={pageSize}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    showQuickJumper
                    responsive
                    className="flex-wrap justify-center"
                  />
                </div>
              )}
            </>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="py-8">
                  <p className="text-gray-600 text-base mb-3">
                    No cases match your filters
                  </p>
                  <Button
                    type="primary"
                    onClick={() => {
                      setSearchTerm("");
                      setDateRange([]);
                      setCourtFilter("all");
                      setViewMode("upcoming");
                    }}
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
