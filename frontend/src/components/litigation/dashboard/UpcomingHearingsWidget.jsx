// components/litigation/dashboard/UpcomingHearingsWidget.jsx
import { Card, List, Button, Tag, Avatar, Tooltip, Empty, Badge } from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  RightOutlined,
  BankOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { getRelativeTime, formatName } from "../../../utils/formatters";

const UpcomingHearingsWidget = ({ hearings = [], loading, onViewAll }) => {
  // Process hearings - supports both old format (nested) and new format (flat)
  const processUpcomingHearings = () => {
    const upcoming = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    hearings.forEach((item) => {
      if (!item) return;

      // Check if it's the new flat format (has matterId directly)
      const isNewFormat = item.matterId && item.suitNo;
      
      if (isNewFormat) {
        // New flat format from getUpcomingHearings API
        const displayDate = item.nextHearingDate || item.date;
        if (!displayDate) return;

        const displayDateObj = new Date(displayDate);
        displayDateObj.setHours(0, 0, 0, 0);

        // Only include future hearings
        if (displayDateObj >= today) {
          upcoming.push({
            id: item._id || `hearing-${Date.now()}-${Math.random()}`,
            suitNo: item.suitNo || "—",
            courtName: item.courtName || "",
            courtNo: item.courtNo || "",
            courtLocation: item.courtLocation || "",
            state: item.state || "",
            nextHearingDate: displayDate,
            lastHearingDate: null,
            currentStage: item.currentStage || "unknown",
            matterId: item.matterId || null,
            matterNumber: item.matter?.matterNumber || "—",
            matterTitle: item.matter?.title || item.matterTitle || "Untitled Matter",
            client: item.matter?.client || item.client || null,
            accountOfficer: item.matter?.accountOfficer || [],
            assignedLawyers: [],
            status: item.matter?.status || "unknown",
            priority: item.matter?.priority || "medium",
            lawyersPresent: item.lawyerPresent || [],
            purpose: item.purpose || "",
            outcome: item.outcome || null,
          });
        }
      } else {
        // Old nested format
        const litigationDetail = { ...item };
        const hearingsList = litigationDetail?.hearings
          ? [...litigationDetail.hearings]
          : [];

        const matterDetails = litigationDetail?.matter
          ? { ...litigationDetail.matter }
          : {};

        if (litigationDetail.nextHearingDate) {
          const hearingWithNextDate = hearingsList.find(
            (h) =>
              h.nextHearingDate &&
              new Date(h.nextHearingDate).getTime() ===
                new Date(litigationDetail.nextHearingDate).getTime(),
          );

          const upcomingHearing = {
            id: litigationDetail._id || `hearing-${Date.now()}-${Math.random()}`,
            suitNo: litigationDetail.suitNo || "—",
            courtName: litigationDetail.courtName || "",
            courtNo: litigationDetail.courtNo || "",
            courtLocation: litigationDetail.courtLocation || "",
            state: litigationDetail.state || "",
            nextHearingDate: litigationDetail.nextHearingDate,
            lastHearingDate: litigationDetail.lastHearingDate || null,
            currentStage: litigationDetail.currentStage || "unknown",
            matterId: matterDetails._id || null,
            matterNumber: matterDetails.matterNumber || "—",
            matterTitle: matterDetails.title || "Untitled Matter",
            client: matterDetails.client || null,
            accountOfficer: matterDetails.accountOfficer || [],
            assignedLawyers: matterDetails.assignedLawyers || [],
            status: matterDetails.status || "unknown",
            priority: matterDetails.priority || "medium",
            lawyersPresent: hearingWithNextDate?.lawyerPresent || [],
            purpose: hearingWithNextDate?.purpose || "",
            latestHearing:
              hearingsList.length > 0
                ? {
                    ...hearingsList.sort(
                      (a, b) => new Date(b.date || 0) - new Date(a.date || 0),
                    )[0],
                  }
                : null,
          };

          upcoming.push(upcomingHearing);
        }
      }
    });

    return [...upcoming].sort((a, b) => {
      const dateA = new Date(a.nextHearingDate || 0).getTime();
      const dateB = new Date(b.nextHearingDate || 0).getTime();
      return dateA - dateB;
    });
  };

  const upcomingHearings = processUpcomingHearings();
  const displayLimit = 5; // Show 5 items by default (increased from 3)
  const hasMore = upcomingHearings.length > displayLimit;

  // Get court label (shorter version)
  const getCourtLabel = (courtName) => {
    if (!courtName) return "Court";

    const courtMap = {
      "high court": "HC",
      "magistrate court": "MC",
      "court of appeal": "CA",
      "supreme court": "SC",
      "federal high court": "FHC",
      "sharia court of appeal": "SCA",
      "customary court of appeal": "CCA",
      "national industrial court": "NIC",
    };
    return (
      courtMap[courtName] ||
      courtName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    );
  };

  // Get stage color
  const getStageColor = (stage) => {
    if (!stage) return "default";

    const colors = {
      filing: "blue",
      "pre-trial": "orange",
      trial: "purple",
      "post-trial": "cyan",
      judgment: "green",
      appeal: "gold",
      settled: "emerald",
      enforcement: "magenta",
    };
    return colors[stage] || "default";
  };

  if (loading) {
    return (
      <Card
        title={
          <div className="flex items-center gap-2">
            <CalendarOutlined className="text-indigo-600" />
            <span className="font-semibold text-gray-800">
              Upcoming Hearings
            </span>
          </div>
        }
        className="h-[420px] rounded-xl border-gray-200 shadow-sm"
        bodyStyle={{ padding: "16px", height: "calc(100% - 57px)" }}>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-2 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-2 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <CalendarOutlined className="text-indigo-600" />
          <span className="font-semibold text-gray-800">Upcoming Hearings</span>
        </div>
      }
      className="h-[420px] rounded-xl border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
      bodyStyle={{
        padding: "16px",
        height: "calc(100% - 57px)",
        display: "flex",
        flexDirection: "column",
      }}
      extra={
        <Badge
          count={upcomingHearings.length}
          showZero
          style={{
            backgroundColor:
              upcomingHearings.length > 0 ? "#4f46e5" : "#9ca3af",
            color: "white",
            fontSize: "11px",
            fontWeight: 600,
          }}
        />
      }>
      {/* Fixed height container with scrollable content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {upcomingHearings.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <List
                itemLayout="horizontal"
                dataSource={upcomingHearings.slice(0, displayLimit)}
                split={false}
                renderItem={(hearing) => {
                  const hearingDate = hearing.nextHearingDate
                    ? new Date(hearing.nextHearingDate)
                    : new Date();
                  const isValidDate = !isNaN(hearingDate.getTime());
                  const isUrgent =
                    isValidDate &&
                    hearingDate - new Date() < 3 * 24 * 60 * 60 * 1000;

                  const hasLawyers =
                    hearing.lawyersPresent && hearing.lawyersPresent.length > 0;

                  return (
                    <List.Item className="!px-0 !py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors rounded-lg">
                      <div className="flex items-start gap-2 w-full">
                        {/* Compact Date Badge */}
                        <div className="flex-shrink-0">
                          <div
                            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center ${
                              isUrgent ? "bg-red-50" : "bg-indigo-50"
                            }`}>
                            <span
                              className={`text-base font-bold leading-none ${
                                isUrgent ? "text-red-700" : "text-indigo-700"
                              }`}>
                              {isValidDate ? hearingDate.getDate() : "-"}
                            </span>
                            <span
                              className={`text-[9px] ${
                                isUrgent ? "text-red-600" : "text-indigo-600"
                              }`}>
                              {isValidDate
                                ? hearingDate.toLocaleString("default", {
                                    month: "short",
                                  })
                                : "TBD"}
                            </span>
                          </div>
                        </div>

                        {/* Hearing Details - Compact */}
                        <div className="flex-1 min-w-0">
                          {/* Header row with tags */}
                          <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                            <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {hearing.matterNumber || "N/A"}
                            </span>
                            <Tag
                              color={getStageColor(hearing.currentStage)}
                              className="rounded-full text-[9px] px-1.5 py-0 m-0 capitalize leading-tight">
                              {hearing.currentStage?.replace(/-/g, " ") ||
                                "Case"}
                            </Tag>
                            {isUrgent && (
                              <Tag
                                color="red"
                                className="rounded-full text-[9px] px-1.5 py-0 m-0 leading-tight">
                                Urgent
                              </Tag>
                            )}
                            {hearing.priority === "high" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            )}
                          </div>

                          {/* Suit number - single line */}
                          <Tooltip title={hearing.suitNo}>
                            <h4 className="text-xs font-semibold text-gray-900 truncate leading-tight mb-0.5">
                              {hearing.suitNo}
                            </h4>
                          </Tooltip>

                          {/* Purpose if available */}
                          {hearing.purpose && (
                            <div className="text-[10px] text-gray-500 truncate mb-1">
                              {hearing.purpose}
                            </div>
                          )}

                          {/* Compact metadata row */}
                          <div className="flex items-center gap-2 text-[10px] text-gray-500">
                            {/* Date and time */}
                            <span className="flex items-center gap-0.5 truncate">
                              <ClockCircleOutlined className="text-[9px]" />
                              {isValidDate
                                ? getRelativeTime(hearing.nextHearingDate)
                                : "TBD"}
                            </span>

                            {/* Court info */}
                            {hearing.courtName && (
                              <span className="flex items-center gap-0.5">
                                <BankOutlined className="text-[9px]" />
                                {getCourtLabel(hearing.courtName)}
                                {hearing.courtNo && ` ${hearing.courtNo}`}
                              </span>
                            )}
                          </div>

                          {/* Assigned Lawyers Row */}
                          {hasLawyers ? (
                            <div className="flex items-center gap-1 mt-1.5 p-1.5 bg-purple-50 rounded border border-purple-100">
                              <TeamOutlined className="text-purple-600 text-[10px]" />
                              <span className="text-[10px] text-purple-700 font-medium">
                                Lawyers:
                              </span>
                              <div className="flex-1 flex items-center gap-1 overflow-hidden">
                                <Avatar.Group
                                  maxCount={3}
                                  size={16}
                                  maxStyle={{
                                    backgroundColor: "#f3e8ff",
                                    color: "#7c3aed",
                                    fontSize: "8px",
                                    fontWeight: 600,
                                    border: "1px solid white",
                                  }}>
                                  {hearing.lawyersPresent.map((lawyer, idx) => (
                                    <Tooltip
                                      key={idx}
                                      title={
                                        lawyer.firstName && lawyer.lastName
                                          ? formatName(
                                              lawyer.firstName,
                                              lawyer.lastName,
                                            )
                                          : lawyer.name || "Lawyer"
                                      }
                                      placement="top">
                                      <Avatar
                                        size={16}
                                        src={lawyer.photo}
                                        icon={<UserOutlined />}
                                        style={{
                                          backgroundColor: "#f3e8ff",
                                          color: "#7c3aed",
                                          border: "1px solid white",
                                          fontSize: "8px",
                                          fontWeight: 600,
                                        }}>
                                        {!lawyer.photo &&
                                        lawyer.firstName &&
                                        lawyer.lastName
                                          ? `${lawyer.firstName[0]}${lawyer.lastName[0]}`
                                          : !lawyer.photo && lawyer.name
                                            ? lawyer.name[0]
                                            : "L"}
                                      </Avatar>
                                    </Tooltip>
                                  ))}
                                </Avatar.Group>
                                <span className="text-[9px] text-purple-600 truncate">
                                  {hearing.lawyersPresent.length === 1
                                    ? hearing.lawyersPresent[0].firstName
                                      ? formatName(
                                          hearing.lawyersPresent[0].firstName,
                                          hearing.lawyersPresent[0].lastName,
                                        )
                                      : hearing.lawyersPresent[0].name
                                    : `${hearing.lawyersPresent.length} assigned`}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 mt-1.5 p-1.5 bg-orange-50 rounded border border-orange-100">
                              <TeamOutlined className="text-orange-600 text-[10px]" />
                              <span className="text-[10px] text-orange-700 font-medium">
                                No lawyers assigned
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Account Officer Avatar - Compact */}
                        {hearing.accountOfficer?.length > 0 && (
                          <div className="flex-shrink-0">
                            <Tooltip
                              title={
                                hearing.accountOfficer[0].firstName &&
                                hearing.accountOfficer[0].lastName
                                  ? formatName(
                                      hearing.accountOfficer[0].firstName,
                                      hearing.accountOfficer[0].lastName,
                                    )
                                  : "Account Officer"
                              }
                              placement="top">
                              <Avatar
                                size={18}
                                src={hearing.accountOfficer[0].photo}
                                style={{
                                  backgroundColor: "#e0e7ff",
                                  color: "#4f46e5",
                                  border: "2px solid white",
                                  fontSize: "8px",
                                  fontWeight: 600,
                                }}>
                                {!hearing.accountOfficer[0].photo &&
                                hearing.accountOfficer[0].firstName &&
                                hearing.accountOfficer[0].lastName
                                  ? `${hearing.accountOfficer[0].firstName[0]}${hearing.accountOfficer[0].lastName[0]}`
                                  : "AO"}
                              </Avatar>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    </List.Item>
                  );
                }}
              />
            </div>

            {/* Show More Indicator - Fixed at bottom */}
            {hasMore && (
              <div className="mt-2 pt-2 border-t border-gray-100 text-center">
                <Button
                  type="link"
                  onClick={onViewAll}
                  className="text-indigo-600 hover:text-indigo-700 text-xs font-medium"
                  size="small">
                  + {upcomingHearings.length - displayLimit} more hearings
                  <RightOutlined className="ml-1 text-[10px]" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="py-4">
                  <div className="text-3xl mb-2">📅</div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    No upcoming hearings
                  </p>
                  <p className="text-xs text-gray-500">
                    Schedule hearings to track them here
                  </p>
                </div>
              }
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default UpcomingHearingsWidget;
