// components/litigation/dashboard/HearingsTimeline.jsx
import { Card, Timeline, Badge, Typography } from "antd";
import { CalendarOutlined } from "@ant-design/icons";

const { Text } = Typography;

const HearingsTimeline = ({ data }) => {
  // Sort hearings by date (most recent first)
  const sortedHearings = [...data]
    .sort((a, b) => {
      const dateA = new Date(a._id.year, a._id.month - 1);
      const dateB = new Date(b._id.year, b._id.month - 1);
      return dateB - dateA;
    })
    .slice(0, 6);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <Card
      title="Hearings Activity"
      className="rounded-xl border-gray-200"
      bodyStyle={{ padding: "20px" }}
      extra={
        <Badge
          count={`${data.reduce((sum, item) => sum + item.count, 0)} total`}
          style={{
            backgroundColor: "#e0e7ff",
            color: "#4f46e5",
            fontSize: "11px",
          }}
        />
      }>
      {sortedHearings.length > 0 ? (
        <Timeline
          mode="left"
          className="[&_.ant-timeline-item]:pb-4"
          items={sortedHearings.map((hearing) => ({
            color: "#4f46e5",
            dot: <CalendarOutlined className="text-indigo-600" />,
            children: (
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-sm font-medium text-gray-700">
                    {monthNames[hearing._id.month - 1]} {hearing._id.year}
                  </Text>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {hearing.count}{" "}
                    {hearing.count === 1 ? "hearing" : "hearings"}
                  </div>
                </div>
                <Badge
                  count={hearing.count}
                  style={{
                    backgroundColor: "#4f46e5",
                    fontSize: "11px",
                    fontWeight: 500,
                  }}
                />
              </div>
            ),
          }))}
        />
      ) : (
        <div className="py-8 text-center">
          <div className="text-3xl mb-2">📅</div>
          <p className="text-sm text-gray-500">No hearing data available</p>
          <p className="text-xs text-gray-400 mt-1">
            Schedule hearings to track activity
          </p>
        </div>
      )}
    </Card>
  );
};

export default HearingsTimeline;
