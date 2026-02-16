import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Card,
  Tag,
  Empty,
  Typography,
  Badge,
  Space,
  Button,
  Avatar,
  Tooltip,
  Spin,
  Row,
  Col,
  Divider,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  BankOutlined,
  RightOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  fetchUpcomingHearings,
  selectUpcomingHearings,
  selectLitigationLoading,
  selectLitigationError,
} from "../../redux/features/litigation/litigationSlice";
import { formatName } from "../../utils/formatters";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(relativeTime);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { Text } = Typography;

// ============================================
// CONSTANTS
// ============================================
const VIEW_TYPES = {
  ALL: "all",
  TODAY: "today",
  URGENT: "urgent",
};

const COURT_NAMES_MAP = {
  "high court": "HC",
  "federal high court": "FHC",
  "court of appeal": "CA",
  "supreme court": "SC",
  "magistrate court": "MC",
  "national industrial court": "NIC",
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const formatCourtName = (courtName) => {
  return COURT_NAMES_MAP[courtName?.toLowerCase()] || courtName || "Court";
};

const getHearingTime = (date) => {
  return dayjs(date).format("HH:mm");
};

const getRelativeTime = (date) => {
  const days = dayjs(date).diff(dayjs(), "day");
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `In ${days} days`;
  return dayjs(date).format("MMM DD");
};

const getAssignedLawyers = (hearing) => {
  const lawyers = new Map(); // Use Map to avoid duplicates by ID

  // Add account officers
  if (hearing.matter?.accountOfficer) {
    hearing.matter.accountOfficer.forEach((officer) => {
      if (officer._id && !lawyers.has(officer._id)) {
        lawyers.set(officer._id, {
          ...officer,
          role: "Account Officer",
        });
      }
    });
  }

  // Find the specific hearing with next date and get assigned lawyers
  if (hearing.hearings) {
    const currentHearing = hearing.hearings.find((h) =>
      dayjs(h.nextHearingDate).isSame(dayjs(hearing.nextHearingDate), "day"),
    );

    if (currentHearing?.lawyerPresent) {
      currentHearing.lawyerPresent.forEach((lawyer) => {
        if (lawyer._id && !lawyers.has(lawyer._id)) {
          lawyers.set(lawyer._id, {
            ...lawyer,
            role: "Appearing Lawyer",
          });
        }
      });
    }
  }

  return Array.from(lawyers.values());
};

// ============================================
// STATISTIC CARD COMPONENT
// ============================================
const StatCard = ({
  icon,
  title,
  value,
  variant = "default",
  onClick,
  isActive,
}) => {
  const variants = {
    blue: {
      bg: "bg-blue-50 hover:bg-blue-100",
      text: "text-blue-600",
      badge: "#3b82f6",
    },
    orange: {
      bg: "bg-orange-50 hover:bg-orange-100",
      text: "text-orange-600",
      badge: "#f97316",
    },
    purple: {
      bg: "bg-purple-50 hover:bg-purple-100",
      text: "text-purple-600",
      badge: "#8b5cf6",
    },
    green: {
      bg: "bg-green-50 hover:bg-green-100",
      text: "text-green-600",
      badge: "#10b981",
    },
  };

  const style = variants[variant] || variants.default;

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-3 rounded-lg border-2 transition-all duration-200
        ${style.bg}
        ${isActive ? "border-current shadow-md scale-105" : "border-transparent"}
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${variant}-500
      `}>
      <div className="flex items-center justify-between mb-1">
        <div className={`${style.text} text-lg`}>{icon}</div>
        <Badge
          count={value}
          overflowCount={99}
          style={{ backgroundColor: style.badge }}
          showZero
        />
      </div>
      <Text className="text-xs font-medium text-gray-700 block text-left">
        {title}
      </Text>
    </button>
  );
};

// ============================================
// HEARING CARD COMPONENT
// ============================================
const HearingCard = React.memo(({ hearing, type = "upcoming" }) => {
  const navigate = useNavigate();
  const isUrgent = type === "urgent";
  const isToday = type === "today";

  const assignedLawyers = useMemo(() => getAssignedLawyers(hearing), [hearing]);

  const handleClick = useCallback(() => {
    navigate(`/dashboard/litigation/${hearing.matterId}`, {
      state: { highlightDate: hearing.nextHearingDate },
    });
  }, [navigate, hearing.matterId, hearing.nextHearingDate]);

  const getMatterTitle = () => {
    if (hearing.matter?.title) return hearing.matter.title;

    const firstParty = hearing.firstParty?.name?.[0]?.name || "Party";
    const secondParty = hearing.secondParty?.name?.[0]?.name || "Party";
    return `${firstParty} v. ${secondParty}`;
  };

  return (
    <Card
      size="small"
      hoverable
      className={`
        mb-2 transition-all duration-200 hover:shadow-md cursor-pointer
        ${isUrgent ? "border-l-4 border-l-red-500 bg-red-50/30" : ""}
        ${isToday ? "border-l-4 border-l-blue-500 bg-blue-50/30" : ""}
      `}
      onClick={handleClick}
      bodyStyle={{ padding: "12px" }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Text strong className="text-sm truncate">
              {hearing.suitNo || hearing.matter?.matterNumber || "N/A"}
            </Text>
            {isUrgent && (
              <Tag
                color="red"
                className="!text-[10px] !px-1.5 !py-0 !leading-tight">
                URGENT
              </Tag>
            )}
            {isToday && (
              <Tag
                color="blue"
                className="!text-[10px] !px-1.5 !py-0 !leading-tight">
                TODAY
              </Tag>
            )}
          </div>
          <Text className="text-xs text-gray-600 line-clamp-1">
            {getMatterTitle()}
          </Text>
        </div>

        {/* Time */}
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-semibold text-gray-900">
            {getHearingTime(hearing.nextHearingDate)}
          </div>
          <Text className="text-[10px] text-gray-500">
            {getRelativeTime(hearing.nextHearingDate)}
          </Text>
        </div>
      </div>

      {/* Court Information */}
      <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2 flex-wrap">
        <div className="flex items-center gap-1">
          <BankOutlined className="text-gray-400" />
          <span className="capitalize">
            {formatCourtName(hearing.courtName)}
            {hearing.courtNo && ` ${hearing.courtNo}`}
          </span>
        </div>

        {hearing.courtLocation && (
          <>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1">
              <EnvironmentOutlined className="text-gray-400" />
              <span className="truncate">{hearing.courtLocation}</span>
            </div>
          </>
        )}
      </div>

      {/* Assigned Lawyers */}
      {assignedLawyers.length > 0 ? (
        <div className="flex items-center gap-2 p-2 bg-purple-50 rounded border border-purple-100">
          <TeamOutlined className="text-purple-600 text-xs flex-shrink-0" />
          <Avatar.Group
            maxCount={3}
            size={20}
            maxStyle={{
              backgroundColor: "#f3e8ff",
              color: "#7c3aed",
              fontSize: "9px",
              cursor: "pointer",
            }}>
            {assignedLawyers.map((lawyer) => (
              <Tooltip
                key={lawyer._id}
                title={`${formatName(lawyer.firstName, lawyer.lastName)} (${lawyer.role})`}
                placement="top">
                <Avatar
                  size={20}
                  src={lawyer.photo}
                  style={{
                    backgroundColor: "#f3e8ff",
                    color: "#7c3aed",
                    fontSize: "9px",
                  }}>
                  {lawyer.firstName?.[0]}
                  {lawyer.lastName?.[0]}
                </Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
          <Text className="text-[10px] text-purple-700 flex-1 truncate">
            {assignedLawyers.length === 1
              ? formatName(
                  assignedLawyers[0].firstName,
                  assignedLawyers[0].lastName,
                )
              : `${assignedLawyers.length} lawyers assigned`}
          </Text>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-2 bg-orange-50 rounded border border-orange-100">
          <WarningOutlined className="text-orange-600 text-xs" />
          <Text className="text-[10px] text-orange-700 font-medium">
            No lawyers assigned
          </Text>
        </div>
      )}

      {/* Judge */}
      {hearing.judge?.[0]?.name && (
        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
          <UserOutlined className="text-gray-400 text-[10px]" />
          <span className="truncate">Justice {hearing.judge[0].name}</span>
        </div>
      )}
    </Card>
  );
});

HearingCard.displayName = "HearingCard";

// ============================================
// MAIN WIDGET COMPONENT
// ============================================
const CourtHearingsWidget = ({ limit = 5 }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const hearingsData = useSelector(selectUpcomingHearings) || [];
  const loading = useSelector(selectLitigationLoading);
  const error = useSelector(selectLitigationError);

  const [activeView, setActiveView] = useState(VIEW_TYPES.ALL);

  // Fetch data on mount
  useEffect(() => {
    dispatch(
      fetchUpcomingHearings({
        limit: 50,
        days: 30,
      }),
    );
  }, [dispatch]);

  // Process and categorize hearings
  const { todayHearings, urgentHearings, upcomingHearings, statistics } =
    useMemo(() => {
      const now = dayjs();
      const today = now.startOf("day");
      const threeDaysFromNow = now.add(3, "day");
      const sevenDaysFromNow = now.add(7, "day");

      const categorized = {
        today: [],
        urgent: [],
        upcoming: [],
      };

      // Categorize hearings
      hearingsData.forEach((hearing) => {
        if (!hearing.nextHearingDate) return;

        const hearingDate = dayjs(hearing.nextHearingDate);

        if (hearingDate.isSame(today, "day")) {
          categorized.today.push({ ...hearing, type: "today" });
        } else if (
          hearingDate.isAfter(today) &&
          hearingDate.isSameOrBefore(threeDaysFromNow)
        ) {
          categorized.urgent.push({ ...hearing, type: "urgent" });
        } else if (hearingDate.isAfter(today)) {
          categorized.upcoming.push({ ...hearing, type: "upcoming" });
        }
      });

      // Sort all categories by date
      const sortByDate = (a, b) =>
        dayjs(a.nextHearingDate).diff(dayjs(b.nextHearingDate));

      categorized.today.sort(sortByDate);
      categorized.urgent.sort(sortByDate);
      categorized.upcoming.sort(sortByDate);

      // Calculate statistics
      const stats = {
        today: categorized.today.length,
        urgent: categorized.urgent.length,
        thisWeek: hearingsData.filter((h) =>
          dayjs(h.nextHearingDate).isSameOrBefore(sevenDaysFromNow),
        ).length,
        total: hearingsData.length,
      };

      return {
        todayHearings: categorized.today,
        urgentHearings: categorized.urgent,
        upcomingHearings: categorized.upcoming,
        statistics: stats,
      };
    }, [hearingsData]);

  // Get hearings to display based on active view
  const displayedHearings = useMemo(() => {
    const getHearings = () => {
      switch (activeView) {
        case VIEW_TYPES.TODAY:
          return todayHearings;
        case VIEW_TYPES.URGENT:
          return urgentHearings;
        case VIEW_TYPES.ALL:
        default:
          // Smart mix: prioritize today, then urgent, then upcoming
          return [...todayHearings, ...urgentHearings, ...upcomingHearings];
      }
    };

    return getHearings().slice(0, limit);
  }, [activeView, todayHearings, urgentHearings, upcomingHearings, limit]);

  // Handle view change
  const handleViewChange = useCallback((view) => {
    setActiveView(view);
  }, []);

  // Handle view all click
  const handleViewAll = useCallback(() => {
    navigate("/dashboard/calendar", { state: { filter: "hearings" } });
  }, [navigate]);

  // Loading state
  if (loading && hearingsData.length === 0) {
    return (
      <Card className="shadow-sm">
        <div className="flex justify-center items-center py-20">
          <Spin size="large" tip="Loading hearings..." />
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="shadow-sm">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="py-4">
              <Text className="text-red-600 block mb-2">
                Failed to load hearings
              </Text>
              <Button
                size="small"
                onClick={() =>
                  dispatch(fetchUpcomingHearings({ limit: 50, days: 30 }))
                }>
                Retry
              </Button>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      className="shadow-sm"
      title={
        <div className="flex items-center justify-between">
          <Space size="middle">
            <CalendarOutlined className="text-blue-600 text-lg" />
            <span className="font-semibold">Court Hearings</span>
            {statistics.today > 0 && (
              <Badge
                count={statistics.today}
                style={{ backgroundColor: "#3b82f6" }}
              />
            )}
          </Space>
          <Button
            type="link"
            size="small"
            onClick={handleViewAll}
            icon={<RightOutlined />}
            iconPosition="end">
            View All
          </Button>
        </div>
      }
      bodyStyle={{ padding: "16px" }}>
      {/* Statistics Row */}
      <Row gutter={[8, 8]} className="mb-4">
        <Col xs={12} sm={6}>
          <StatCard
            icon={<CalendarOutlined />}
            title="Today"
            value={statistics.today}
            variant="blue"
            onClick={() => handleViewChange(VIEW_TYPES.TODAY)}
            isActive={activeView === VIEW_TYPES.TODAY}
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            icon={<ExclamationCircleOutlined />}
            title="Urgent"
            value={statistics.urgent}
            variant="orange"
            onClick={() => handleViewChange(VIEW_TYPES.URGENT)}
            isActive={activeView === VIEW_TYPES.URGENT}
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            icon={<ClockCircleOutlined />}
            title="This Week"
            value={statistics.thisWeek}
            variant="purple"
            onClick={() => handleViewChange(VIEW_TYPES.ALL)}
            isActive={activeView === VIEW_TYPES.ALL}
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            icon={<FileTextOutlined />}
            title="Total"
            value={statistics.total}
            variant="green"
            onClick={() => handleViewChange(VIEW_TYPES.ALL)}
            isActive={activeView === VIEW_TYPES.ALL}
          />
        </Col>
      </Row>

      <Divider className="!my-3" />

      {/* Hearings List */}
      {displayedHearings.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="py-8">
              <div className="text-4xl mb-3">📅</div>
              <Text className="text-gray-500 block mb-1 font-medium">
                No court hearings scheduled
              </Text>
              <Text className="text-xs text-gray-400">
                {activeView === VIEW_TYPES.TODAY
                  ? "No hearings scheduled for today"
                  : activeView === VIEW_TYPES.URGENT
                    ? "No urgent hearings in the next 3 days"
                    : "Your hearing schedule is clear"}
              </Text>
            </div>
          }
        />
      ) : (
        <>
          <div className="max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
            {displayedHearings.map((hearing) => (
              <HearingCard
                key={hearing._id}
                hearing={hearing}
                type={hearing.type}
              />
            ))}
          </div>

          {/* Footer */}
          {statistics.total > displayedHearings.length && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-center">
              <Text className="text-xs text-gray-500">
                Showing {displayedHearings.length} of {statistics.total}{" "}
                upcoming hearings
              </Text>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default CourtHearingsWidget;
