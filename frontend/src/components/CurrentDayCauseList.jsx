import {
  FaGavel,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaLocationArrow,
} from "react-icons/fa";
import { Typography, Empty, Card, Avatar, Tag, Badge } from "antd";
import { InboxOutlined, UserOutlined } from "@ant-design/icons";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import {
  BuildingLibraryIcon,
  ClockIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const { Text, Title } = Typography;

const CurrentDayCauseList = () => {
  const {
    loading: loadingCauseList,
    error: causeListError,
    causeList,
  } = useDataGetterHook();

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const transformedCauseListData =
    causeList.data?.reportsToday?.map((report) => ({
      id: report._id,
      case: `${report?.caseReported?.firstParty?.name[0]?.name} vs ${report?.caseReported?.secondParty?.name[0]?.name}`,
      adjournedFor: report?.adjournedFor,
      adjournedDate: formatDate(report?.adjournedDate),
      lawyersInCourt: report?.lawyersInCourt || [],
      suitNo: report?.caseReported?.suitNo,
      court: report?.caseReported?.courtName,
      courtLocation: report?.caseReported?.location,
      courtNo: report?.caseReported?.courtNo,
      state: report?.caseReported?.state,
      isUrgent:
        report?.adjournedFor?.toLowerCase().includes("hearing") ||
        report?.adjournedFor?.toLowerCase().includes("judgment"),
    })) || [];

  const getStatusColor = (adjournedFor) => {
    const status = adjournedFor?.toLowerCase();
    if (status?.includes("hearing")) return "red";
    if (status?.includes("judgment")) return "purple";
    if (status?.includes("trial")) return "orange";
    if (status?.includes("settlement")) return "green";
    return "blue";
  };

  const renderLawyers = (lawyers) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {lawyers.length > 0 ? (
        lawyers.map((lawyer, index) => (
          <div
            key={index}
            className="flex items-center bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 border border-gray-200 shadow-sm">
            <Avatar
              size="small"
              icon={<UserOutlined />}
              className="mr-2 bg-blue-500"
            />
            <Text className="text-xs font-medium text-gray-700">
              {lawyer?.firstName} {lawyer?.lastName}
            </Text>
          </div>
        ))
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <Text className="text-xs text-amber-700 font-medium">
            ⚠️ No lawyer assigned yet
          </Text>
        </div>
      )}
    </div>
  );

  if (loadingCauseList.causeList) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-0 rounded-2xl h-[400px] animate-pulse">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <BuildingLibraryIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="text-gray-400">Loading today's cause list...</div>
          </div>
        </div>
      </Card>
    );
  }

  if (causeListError.causeList) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-0 rounded-2xl h-[400px]">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <BuildingLibraryIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-red-600">Failed to load cause list</div>
            <Text type="secondary" className="mt-2">
              {causeListError.causeList || "Please try again later"}
            </Text>
          </div>
        </div>
      </Card>
    );
  }

  const todayCount = causeList.data?.todayResult || 0;

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BuildingLibraryIcon className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-900">
              Today's Cause List
            </span>
            <Badge
              count={todayCount}
              showZero
              color="purple"
              className="ml-2"
            />
          </div>
          {todayCount > 0 && (
            <Tag color="purple">
              {todayCount} case{todayCount !== 1 ? "s" : ""}
            </Tag>
          )}
        </div>
      }
      className="bg-gradient-to-br from-white to-purple-50/50 border border-gray-200 rounded-2xl shadow-sm h-[400px] w-full flex flex-col"
      styles={{
        body: {
          padding: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden", // ensures scroll works properly
        },
      }}>
      {todayCount === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 p-6">
          <Empty
            image={
              <div className="text-purple-200">
                <InboxOutlined style={{ fontSize: 64 }} />
              </div>
            }
            description={
              <div className="text-center">
                <div className="text-gray-600 font-medium mb-2">
                  No Court Matters Today
                </div>
                <div className="text-gray-500 text-sm">
                  There are no scheduled court matters for today
                </div>
              </div>
            }
          />
          <div className="mt-4 text-center">
            <Text className="text-gray-400 text-sm">Enjoy your day! 🎉</Text>
          </div>
        </div>
      ) : (
        <>
          {/* Scrollable Cases List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {transformedCauseListData.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-purple-200 transition-all duration-200 group">
                {/* Case Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          item.isUrgent ? "bg-red-500" : "bg-purple-500"
                        }`}></div>
                      <Text className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {item.case}
                      </Text>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag
                        color={getStatusColor(item.adjournedFor)}
                        className="text-xs m-0">
                        {item.adjournedFor}
                      </Tag>
                      <Text className="text-xs text-gray-500 font-mono">
                        {item.suitNo}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Court Details */}
                <div className="grid grid-cols-1 gap-2 mb-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FaLocationArrow className="w-3 h-3 text-purple-500" />
                    <span className="font-medium">{item.court}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <FaMapMarkerAlt className="w-3 h-3 text-blue-500" />
                    <span>
                      {item.courtLocation}, {item.state} • Court {item.courtNo}
                    </span>
                  </div>
                </div>

                {/* Schedule */}
                <div className="flex items-center gap-4 text-xs mb-3">
                  <div className="flex items-center gap-1 text-gray-600">
                    <ClockIcon className="w-3 h-3 text-orange-500" />
                    <span>Adjourned for:</span>
                    <span className="font-medium text-gray-900 ml-1">
                      {item.adjournedFor}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-gray-600">
                    <FaCalendarAlt className="w-3 h-3 text-green-500" />
                    <span>Date:</span>
                    <span className="font-medium text-gray-900 ml-1">
                      {item.adjournedDate}
                    </span>
                  </div>
                </div>

                {/* Lawyers Section */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <UserGroupIcon className="w-3 h-3 text-gray-500" />
                    <Text className="text-xs font-medium text-gray-700">
                      Lawyers in Court:
                    </Text>
                  </div>
                  {renderLawyers(item.lawyersInCourt)}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-between">
              <Text className="text-gray-500 text-sm">
                {todayCount} case{todayCount !== 1 ? "s" : ""} scheduled today
              </Text>
              <div className="flex items-center gap-2">
                {transformedCauseListData.some((item) => item.isUrgent) && (
                  <Tag color="red" className="text-xs">
                    Urgent Matters
                  </Tag>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default CurrentDayCauseList;
