import PropTypes from "prop-types";
import { useState, useMemo, useCallback, memo } from "react";
import {
  Tag,
  Avatar,
  Space,
  Typography,
  Tooltip,
  Button,
  Empty,
  Badge,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  BankOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { decode } from "html-entities";

const { Title, Text, Paragraph } = Typography;

// Memoized detail item component
const DetailItem = memo(({ icon, label, value }) => (
  <div className="flex items-start gap-2 min-w-0">
    <div className="mt-1 flex-shrink-0">{icon}</div>
    <div className="min-w-0 flex-1 overflow-hidden">
      <Text className="text-xs text-gray-500 block truncate">{label}</Text>
      <Text className="text-sm font-medium block break-words leading-tight">
        {value}
      </Text>
    </div>
  </div>
));

DetailItem.displayName = "DetailItem";

// Memoized legal team member component
const LegalTeamMember = memo(({ officer, idx }) => (
  <div
    key={idx}
    className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 cursor-pointer">
    <Avatar
      src={officer.photo}
      size="default"
      className="border-2 border-white shadow-sm flex-shrink-0">
      {officer.firstName?.[0]}
      {officer.lastName?.[0]}
    </Avatar>
    <div className="flex-1 min-w-0">
      <Text strong className="block truncate text-sm">
        {officer.firstName} {officer.lastName}
      </Text>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
        {officer.email && (
          <Tooltip title={officer.email}>
            <div className="flex items-center gap-1 min-w-0">
              <MailOutlined className="text-gray-400 text-xs flex-shrink-0" />
              <Text className="text-xs text-gray-600 truncate max-w-[120px] sm:max-w-xs">
                {officer.email}
              </Text>
            </div>
          </Tooltip>
        )}
        {officer.phone && (
          <Tooltip title={officer.phone}>
            <div className="flex items-center gap-1 min-w-0">
              <PhoneOutlined className="text-gray-400 text-xs flex-shrink-0" />
              <Text className="text-xs text-gray-600 whitespace-nowrap">
                {officer.phone}
              </Text>
            </div>
          </Tooltip>
        )}
      </div>
    </div>
    {officer.role && (
      <Tag color="blue" size="small" className="flex-shrink-0 mt-2 sm:mt-0">
        {officer.role}
      </Tag>
    )}
  </div>
));

LegalTeamMember.displayName = "LegalTeamMember";

const UpcomingCasesComponent = ({
  cases,
  compact = false,
  highlightToday = false,
  showTime = true,
}) => {
  const [expandedCase, setExpandedCase] = useState(null);

  // Optimized utility functions with useCallback
  const formatContent = useCallback((html) => {
    if (!html) return "";
    const decoded = decode(html);
    return decoded.replace(/<[^>]*>/g, " ").substring(0, 150) + "...";
  }, []);

  const getPartyNames = useCallback((caseItem) => {
    const firstParty = caseItem?.caseReported?.firstParty?.name || [];
    const secondParty = caseItem?.caseReported?.secondParty?.name || [];

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

  // FIXED: Time formatting logic
  const formatDate = useCallback((dateString) => {
    if (!dateString) return { date: "N/A", time: "", fullDate: "N/A" };

    try {
      const date = new Date(dateString);

      // Check if time is midnight (00:00:00), if so, force 9:00 AM
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const isMidnight = hours === 0 && minutes === 0;

      if (isMidnight) {
        date.setHours(9, 0, 0, 0); // Set to 9 AM Court time
      }

      return {
        date: date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        time: date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        fullDate: date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };
    } catch {
      return { date: "Invalid Date", time: "", fullDate: "N/A" };
    }
  }, []);

  // FIXED: Date comparison logic (strips time to ensure accuracy)
  const isToday = useCallback((dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const caseDate = new Date(dateString);
      caseDate.setHours(0, 0, 0, 0);
      return today.getTime() === caseDate.getTime();
    } catch {
      return false;
    }
  }, []);

  // FIXED: Logic for "Past" vs "Upcoming"
  const getTimeRemaining = useCallback((dateString) => {
    if (!dateString) return "";

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset today's time to midnight

      const caseDate = new Date(dateString);
      caseDate.setHours(0, 0, 0, 0); // Reset case time to midnight

      const diffMs = caseDate.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Tomorrow";
      if (diffDays < 0) return "Past"; // Handle past dates
      if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
      if (diffDays > 7) return `In ${Math.ceil(diffDays / 7)} weeks`;

      return "";
    } catch {
      return "";
    }
  }, []);

  // Sort cases by date with memoization
  const sortedCases = useMemo(() => {
    return [...cases].sort((a, b) => {
      const dateA = new Date(a.adjournedDate || 0);
      const dateB = new Date(b.adjournedDate || 0);
      return dateA - dateB;
    });
  }, [cases]);

  // Toggle expand handler
  const toggleExpand = useCallback((caseId) => {
    setExpandedCase((prev) => (prev === caseId ? null : caseId));
  }, []);

  if (!cases || cases.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No upcoming cases scheduled"
        className="py-12"
      />
    );
  }

  return (
    <div className="space-y-3">
      {sortedCases.map((caseItem, index) => {
        const dateInfo = formatDate(caseItem.adjournedDate);
        const todayCase = isToday(caseItem.adjournedDate);
        const timeRemaining = getTimeRemaining(caseItem.adjournedDate);
        const { caseTitle } = getPartyNames(caseItem);
        const formattedContent = formatContent(caseItem.update);
        const caseId = caseItem._id || `case-${index}`;
        const isExpanded = expandedCase === caseId;

        return (
          <motion.div
            key={caseId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}>
            <div
              className={`
                rounded-xl border transition-all duration-200
                ${
                  isExpanded
                    ? "bg-blue-50 border-blue-300 shadow-md"
                    : "bg-white border-gray-200 hover:border-blue-200 hover:shadow-sm"
                }
                ${
                  todayCase && highlightToday
                    ? "border-l-4 border-l-red-500"
                    : ""
                }
                ${compact ? "p-3" : "p-4"}
              `}>
              {/* Main Case Info - Clickable */}
              <div
                className="cursor-pointer"
                onClick={() => toggleExpand(caseId)}>
                <div className="flex flex-row items-start justify-between gap-3">
                  {/* Left side - Case Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      {/* Date Box */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          todayCase ? "bg-red-100" : "bg-blue-100"
                        }`}>
                        {todayCase ? (
                          <ClockCircleOutlined className="text-red-600" />
                        ) : (
                          <CalendarOutlined className="text-blue-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Tags and Title */}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Title
                            level={compact ? 5 : 4}
                            className="m-0 text-gray-900 whitespace-nowrap">
                            {caseItem.caseReported?.suitNo ||
                              `Case #${index + 1}`}
                          </Title>
                          <Space size={4} wrap>
                            {todayCase && (
                              <Tag
                                color="red"
                                className="text-xs font-semibold">
                                TODAY
                              </Tag>
                            )}
                            {timeRemaining && !todayCase && (
                              <Tag color="blue" className="text-xs font-medium">
                                {timeRemaining}
                              </Tag>
                            )}
                          </Space>
                        </div>
                        <Text className="text-gray-700 font-medium block truncate">
                          {caseTitle}
                        </Text>
                      </div>
                    </div>

                    {/* Details Grid - Responsive Fixes */}
                    <div
                      className={`grid ${
                        compact
                          ? "grid-cols-1 sm:grid-cols-2"
                          : "grid-cols-1 xs:grid-cols-2 md:grid-cols-4"
                      } gap-y-3 gap-x-4`}>
                      <DetailItem
                        icon={
                          <CalendarOutlined className="text-gray-400 text-sm" />
                        }
                        label="Date"
                        value={dateInfo.date}
                      />
                      {showTime && (
                        <DetailItem
                          icon={
                            <ClockCircleOutlined className="text-gray-400 text-sm" />
                          }
                          label="Time"
                          value={dateInfo.time}
                        />
                      )}
                      <DetailItem
                        icon={
                          <BankOutlined className="text-gray-400 text-sm" />
                        }
                        label="Court"
                        value={
                          caseItem.caseReported?.courtName || "Not specified"
                        }
                      />
                      <DetailItem
                        icon={
                          <FileTextOutlined className="text-gray-400 text-sm" />
                        }
                        label="Purpose"
                        value={caseItem.adjournedFor || "Hearing"}
                      />
                    </div>
                  </div>

                  {/* Right side - Expand/Collapse Icon */}
                  <div className="flex flex-col items-center flex-shrink-0 pl-2">
                    <Button
                      type="text"
                      size="small"
                      icon={
                        isExpanded ? (
                          <UpOutlined className="text-gray-600" />
                        ) : (
                          <DownOutlined className="text-gray-400" />
                        )
                      }
                      className="hover:bg-blue-50"
                    />
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 pt-4 border-t border-gray-200 overflow-hidden">
                    <div className="space-y-4">
                      {/* Case Details Section */}
                      <div>
                        <Text
                          strong
                          className="text-gray-700 text-sm mb-3 block">
                          Case Details
                        </Text>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <Text className="text-xs text-gray-500 block">
                                Case Type
                              </Text>
                              <Text className="text-sm font-medium">
                                {caseItem.caseReported?.caseType || "Civil"}
                              </Text>
                            </div>
                            <div>
                              <Text className="text-xs text-gray-500 block">
                                Location
                              </Text>
                              <div className="flex items-center gap-1">
                                <EnvironmentOutlined className="text-gray-400 text-xs" />
                                <Text className="text-sm font-medium">
                                  {caseItem.caseReported?.location || "N/A"}
                                </Text>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <Text className="text-xs text-gray-500 block">
                                Court Number
                              </Text>
                              <Text className="text-sm font-medium">
                                {caseItem.caseReported?.courtNo || "N/A"}
                              </Text>
                            </div>
                            <div>
                              <Text className="text-xs text-gray-500 block">
                                State
                              </Text>
                              <Text className="text-sm font-medium">
                                {caseItem.caseReported?.state || "N/A"}
                              </Text>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Case Update Preview */}
                      {caseItem.update && (
                        <div>
                          <Text
                            strong
                            className="text-gray-700 text-sm mb-2 block">
                            Latest Update
                          </Text>
                          <Paragraph className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto mb-0">
                            {formattedContent}
                          </Paragraph>
                        </div>
                      )}

                      {/* Legal Team */}
                      {caseItem.caseReported?.accountOfficer?.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <Text strong className="text-gray-700 text-sm">
                              Assigned Legal Team
                            </Text>
                            <Badge
                              count={
                                caseItem.caseReported.accountOfficer.length
                              }
                              color="blue"
                              showZero
                            />
                          </div>
                          <div className="space-y-2">
                            {caseItem.caseReported.accountOfficer.map(
                              (officer, idx) => (
                                <LegalTeamMember
                                  key={officer._id || idx}
                                  officer={officer}
                                  idx={idx}
                                />
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

UpcomingCasesComponent.propTypes = {
  cases: PropTypes.array.isRequired,
  compact: PropTypes.bool,
  highlightToday: PropTypes.bool,
  showTime: PropTypes.bool,
};

UpcomingCasesComponent.defaultProps = {
  compact: false,
  highlightToday: false,
  showTime: true,
};

export default memo(UpcomingCasesComponent);
