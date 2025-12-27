import PropTypes from "prop-types";
import { useState, useMemo, useCallback, memo } from "react";
import {
  Tag,
  Avatar,
  Typography,
  Tooltip,
  Button,
  Empty,
  Badge,
  Collapse,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  BankOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { decode } from "html-entities";
import { capitalizeWords } from "../../utils/capitalise";

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

// Memoized detail item with improved mobile layout
const DetailItem = memo(({ icon, label, value, fullWidth = false }) => (
  <div
    className={`flex items-start gap-2 ${
      fullWidth ? "col-span-2" : ""
    } min-w-0`}>
    <div className="mt-1 flex-shrink-0 text-gray-400">{icon}</div>
    <div className="min-w-0 flex-1">
      <Text className="text-xs text-gray-500 block mb-0.5">{label}</Text>
      <Text className="text-sm font-semibold text-gray-900 block break-words leading-snug">
        {value || "N/A"}
      </Text>
    </div>
  </div>
));

DetailItem.displayName = "DetailItem";

// Memoized legal team member with mobile-optimized layout
const LegalTeamMember = memo(({ officer }) => (
  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:shadow-sm transition-all">
    <Avatar
      src={officer.photo}
      size={40}
      className="border-2 border-white shadow-sm flex-shrink-0">
      {officer.firstName?.[0]}
      {officer.lastName?.[0]}
    </Avatar>
    <div className="flex-1 min-w-0">
      <Text strong className="block truncate text-sm text-gray-900">
        {officer.firstName} {officer.lastName}
      </Text>
      <div className="flex items-center gap-2 mt-1">
        {officer.email && (
          <Tooltip title={officer.email}>
            <MailOutlined className="text-gray-400 text-xs" />
          </Tooltip>
        )}
        {officer.phone && (
          <Tooltip title={officer.phone}>
            <PhoneOutlined className="text-gray-400 text-xs" />
          </Tooltip>
        )}
      </div>
    </div>
    {officer.role && (
      <Tag color="blue" className="flex-shrink-0 m-0">
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
  const [activeKey, setActiveKey] = useState([]);

  // Utility functions
  const formatContent = useCallback((html) => {
    if (!html) return "";
    const decoded = decode(html);
    return decoded.replace(/<[^>]*>/g, " ").substring(0, 120) + "...";
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

  const formatDate = useCallback((dateString) => {
    if (!dateString) return { date: "N/A", time: "", fullDate: "N/A" };

    try {
      const date = new Date(dateString);
      const hours = date.getHours();
      const minutes = date.getMinutes();

      // Default to 9:00 AM if midnight
      if (hours === 0 && minutes === 0) {
        date.setHours(9, 0, 0, 0);
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

  const getTimeRemaining = useCallback((dateString) => {
    if (!dateString) return "";

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const caseDate = new Date(dateString);
      caseDate.setHours(0, 0, 0, 0);

      const diffMs = caseDate.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Tomorrow";
      if (diffDays < 0) return "Past";
      if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
      if (diffDays > 7) return `In ${Math.ceil(diffDays / 7)} weeks`;

      return "";
    } catch {
      return "";
    }
  }, []);

  // Sort cases by date
  const sortedCases = useMemo(() => {
    return [...cases].sort((a, b) => {
      const dateA = new Date(a.adjournedDate || 0);
      const dateB = new Date(b.adjournedDate || 0);
      return dateA - dateB;
    });
  }, [cases]);

  if (!cases || cases.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No upcoming cases"
        className="py-8"
      />
    );
  }

  return (
    <div className="space-y-3">
      <Collapse
        activeKey={activeKey}
        onChange={setActiveKey}
        ghost
        expandIconPosition="end"
        className="case-collapse-modern">
        {sortedCases.map((caseItem, index) => {
          const dateInfo = formatDate(caseItem.adjournedDate);
          const todayCase = isToday(caseItem.adjournedDate);
          const timeRemaining = getTimeRemaining(caseItem.adjournedDate);
          const { caseTitle } = getPartyNames(caseItem);
          const formattedContent = formatContent(caseItem.update);
          const caseId = caseItem._id || `case-${index}`;

          return (
            <Panel
              key={caseId}
              header={
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    todayCase && highlightToday
                      ? "border-red-300 bg-gradient-to-r from-red-50 to-pink-50"
                      : "border-gray-100 bg-white hover:border-blue-200"
                  }`}>
                  {/* Header Content */}
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        todayCase
                          ? "bg-red-500 text-white"
                          : "bg-blue-500 text-white"
                      }`}>
                      {todayCase ? (
                        <ClockCircleOutlined className="text-lg" />
                      ) : (
                        <CalendarOutlined className="text-lg" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title Row */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Text
                          strong
                          className="text-base text-gray-900 font-bold">
                          {caseItem.caseReported?.suitNo ||
                            `Case #${index + 1}`}
                        </Text>
                        {todayCase && (
                          <Tag
                            color="red"
                            className="m-0 text-xs font-bold animate-pulse">
                            TODAY
                          </Tag>
                        )}
                        {timeRemaining && !todayCase && (
                          <Tag color="blue" className="m-0 text-xs font-medium">
                            {timeRemaining}
                          </Tag>
                        )}
                      </div>

                      {/* Case Title */}
                      <Text className="text-sm text-gray-700 block mb-3 font-medium">
                        {caseTitle}
                      </Text>

                      {/* Quick Info Grid - Mobile Optimized */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <CalendarOutlined className="text-gray-400" />
                          <span className="text-gray-700 font-medium">
                            {dateInfo.date}
                          </span>
                        </div>
                        {showTime && (
                          <div className="flex items-center gap-2">
                            <ClockCircleOutlined className="text-gray-400" />
                            <span className="text-gray-700 font-medium">
                              {dateInfo.time}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 col-span-2">
                          <BankOutlined className="text-gray-400" />
                          <span className="text-gray-700 font-medium truncate">
                            {capitalizeWords(
                              caseItem.caseReported?.courtName
                            ) || "Not specified"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              }
              className="mb-3"
              style={{
                border: "none",
                background: "transparent",
              }}>
              {/* Expanded Content */}
              <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 mt-2">
                <div className="space-y-5">
                  {/* Case Details Grid */}
                  <div>
                    <Text strong className="text-sm text-gray-700 block mb-3">
                      Case Information
                    </Text>
                    <div className="grid grid-cols-2 gap-4">
                      <DetailItem
                        icon={<FileTextOutlined />}
                        label="Purpose"
                        value={caseItem.adjournedFor || "Hearing"}
                      />
                      <DetailItem
                        icon={<BankOutlined />}
                        label="Court No."
                        value={caseItem.caseReported?.courtNo}
                      />
                      <DetailItem
                        icon={<EnvironmentOutlined />}
                        label="Location"
                        value={caseItem.caseReported?.location}
                      />
                      <DetailItem
                        icon={<CalendarOutlined />}
                        label="State"
                        value={caseItem.caseReported?.state}
                      />
                    </div>
                  </div>

                  {/* Latest Update */}
                  {caseItem.update && (
                    <div>
                      <Text strong className="text-sm text-gray-700 block mb-2">
                        Latest Update
                      </Text>
                      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3">
                        <Paragraph className="text-sm text-gray-700 mb-0">
                          {formattedContent}
                        </Paragraph>
                      </div>
                    </div>
                  )}

                  {/* Legal Team */}
                  {caseItem.caseReported?.accountOfficer?.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Text strong className="text-sm text-gray-700">
                          Legal Team
                        </Text>
                        <Badge
                          count={caseItem.caseReported.accountOfficer.length}
                          style={{
                            backgroundColor: "#3b82f6",
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        {caseItem.caseReported.accountOfficer.map(
                          (officer, idx) => (
                            <LegalTeamMember
                              key={officer._id || idx}
                              officer={officer}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <Button
                      type="primary"
                      size="small"
                      className="flex-1 h-9 rounded-lg font-medium"
                      style={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        border: "none",
                      }}>
                      View Full Details
                    </Button>
                    <Button
                      size="small"
                      className="h-9 rounded-lg font-medium"
                      icon={<PhoneOutlined />}>
                      Contact
                    </Button>
                  </div>
                </div>
              </div>
            </Panel>
          );
        })}
      </Collapse>
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
