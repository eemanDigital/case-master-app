import { FaGavel, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa";
import { Typography, Button, Empty, Card, List, Avatar } from "antd";
import { InboxOutlined, UserOutlined } from "@ant-design/icons";
import { useDataGetterHook } from "../hooks/useDataGetterHook";

const { Text } = Typography;

const CurrentDayCauseList = () => {
  const {
    loading: getterLoading,
    error: getterError,
    causeList,
  } = useDataGetterHook(); // Fetch cause list data

  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // transform cause list data
  const transformedCauseListData = causeList.data?.reportsToday.map(
    (report) => ({
      case: `${report?.caseReported?.firstParty?.name[0]?.name} vs ${report?.caseReported?.secondParty?.name[0]?.name}`,
      adjournedFor: report?.adjournedFor,
      adjournedDate: formatDate(report?.adjournedDate),
      lawyersInCourt: report?.lawyersInCourt || [],
      suitNo: report?.caseReported?.suitNo,
      court: report?.caseReported?.courtName,
      courtLocation: report?.caseReported?.location,
      courtNo: report?.caseReported?.courtNo,
      state: report?.caseReported?.state,
    })
  );

  // Render lawyers in court
  // / Render lawyers in court
  const renderLawyers = (lawyers) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {lawyers.length > 0 ? (
        lawyers.map((lawyer, index) => (
          <div
            key={index}
            className="flex items-center bg-gray-100 rounded-full px-2 py-1">
            <Avatar size="small" icon={<UserOutlined />} className="mr-1" />
            <Text className="text-xs">
              {lawyer.firstName} {lawyer.lastName}
            </Text>
          </div>
        ))
      ) : (
        <Text className="text-xs text-rose-500">No lawyer assigned yet</Text>
      )}
    </div>
  );
  return (
    <Card
      className="bg-white rounded-lg shadow-lg w-full lg:w-[48%] m-4 lg:m-0 h-[386px] overflow-y-scroll custom-scrollbar"
      bodyStyle={{ padding: 0 }}>
      <h2 className="bg-gradient-to-r from-rose-600 to-rose-800 text-white text-lg sm:text-xl md:text-2xl font-semibold py-3 px-4 text-center">
        Today's Cause List
      </h2>
      <div className="p-4 h-full overflow-y-auto custom-scrollbar">
        {getterLoading.causeList ? (
          <div className="flex justify-center items-center h-full">
            <Text className="text-gray-500">Loading...</Text>
          </div>
        ) : getterError.causeList ? (
          <div className="flex justify-center items-center h-full">
            <Text className="text-red-500">
              Error loading data. Please try again.
            </Text>
          </div>
        ) : !(causeList.data?.todayResult > 0) ? (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg p-6">
            <Empty
              image={
                <InboxOutlined style={{ fontSize: 64, color: "#1890ff" }} />
              }
              description={
                <div className="text-center">
                  <Text className="text-lg font-semibold text-gray-700">
                    No Court Matters Today
                  </Text>
                  <Text className="text-sm text-gray-500 mt-2 block">
                    There are no scheduled court matters for today. Enjoy your
                    day!
                  </Text>
                </div>
              }
            />
            <Button
              type="primary"
              onClick={() => window.location.reload()}
              className="mt-4 bg-blue-500 hover:bg-blue-600">
              Refresh
            </Button>
          </div>
        ) : (
          <div>
            <Text className="text-lg text-gray-700 block mb-4">
              <span className="font-bold text-blue-600 text-2xl">
                {causeList.data?.todayResult}
              </span>{" "}
              matter(s) in court today
            </Text>
            <List
              dataSource={transformedCauseListData}
              renderItem={(item) => (
                <List.Item className="border-b last:border-b-0 py-4 font-medium font-poppins">
                  <div className="w-full p-4 bg-gray-200 shadow-sm rounded-lg border border-gray-200">
                    <p className="text-blue-600 text-md font-bold flex items-center">
                      <FaGavel className="mr-2 text-blue-500" /> {item.suitNo}
                    </p>
                    <p className="text-sm text-gray-600 font-medium mt-1">
                      {item.case}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 capitalize flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-blue-500" />{" "}
                      {item.court}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-blue-500" />{" "}
                      {item.courtLocation}, {item.state}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Court No: {item.courtNo}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-gray-500">
                      <p className="flex items-center">
                        <FaCalendarAlt className="mr-1 text-blue-500" />{" "}
                        Adjourned for:{" "}
                        <span className="font-semibold text-blue-700 ml-1">
                          {item.adjournedFor}
                        </span>
                      </p>
                      <p className="flex items-center">
                        <FaCalendarAlt className="mr-1 text-blue-500" /> Date:{" "}
                        <span className="font-semibold text-blue-700 ml-1">
                          {item.adjournedDate}
                        </span>
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 mb-1">
                      Lawyers in court:
                    </p>
                    {renderLawyers(item.lawyersInCourt)}
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}
      </div>
      <div className="scroll-indicator"></div>
    </Card>
  );
};

export default CurrentDayCauseList;
