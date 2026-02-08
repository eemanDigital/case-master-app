import React, { useState } from "react";
import {
  Modal,
  Timeline,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  Typography,
  Empty,
  Button,
  Card,
} from "antd";
import {
  HistoryOutlined,
  SearchOutlined,
  DownloadOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Text } = Typography;
const { RangePicker } = DatePicker;

const ActivityLogModal = ({ visible, onCancel, matterId }) => {
  const details = useSelector((state) => state.retainer.selectedDetails);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState(null);

  const activityLog = details?.activityLog || [];

  const activityTypes = [
    { value: "all", label: "All Activities" },
    { value: "service", label: "Service Updates" },
    { value: "request", label: "Requests" },
    { value: "disbursement", label: "Disbursements" },
    { value: "billing", label: "Billing" },
    { value: "document", label: "Documents" },
    { value: "meeting", label: "Meetings" },
    { value: "communication", label: "Communications" },
  ];

  const filterActivities = () => {
    let filtered = activityLog;

    if (searchTerm) {
      filtered = filtered.filter((activity) =>
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((activity) =>
        activity.serviceType?.toLowerCase().includes(filterType.toLowerCase()),
      );
    }

    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter((activity) => {
        const activityDate = dayjs(activity.actionDate);
        return (
          activityDate.isAfter(dateRange[0]) &&
          activityDate.isBefore(dateRange[1])
        );
      });
    }

    return filtered.sort(
      (a, b) => dayjs(b.actionDate).unix() - dayjs(a.actionDate).unix(),
    );
  };

  const filteredActivities = filterActivities();

  const getActivityColor = (activity) => {
    const type = activity.serviceType?.toLowerCase() || "";
    if (type.includes("service")) return "blue";
    if (type.includes("request")) return "green";
    if (type.includes("disbursement")) return "orange";
    if (type.includes("billing")) return "purple";
    if (type.includes("document")) return "cyan";
    return "default";
  };

  const handleExport = () => {
    const csvContent = [
      ["Date", "Action", "Performed By", "Units Consumed", "Service Type"],
      ...filteredActivities.map((activity) => [
        dayjs(activity.actionDate).format("YYYY-MM-DD HH:mm"),
        activity.description,
        activity.performedBy?.firstName +
          " " +
          activity.performedBy?.lastName || "System",
        activity.unitsConsumed || 0,
        activity.serviceType || "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-log-${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
  };

  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined />
          <span>Activity Log</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="export" icon={<DownloadOutlined />} onClick={handleExport}>
          Export CSV
        </Button>,
        <Button key="close" type="primary" onClick={onCancel}>
          Close
        </Button>,
      ]}
      width={800}>
      <Card size="small" className="mb-4">
        <Space direction="vertical" className="w-full" size="middle">
          <Input
            placeholder="Search activities..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
          <Space className="w-full" wrap>
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: 200 }}
              suffixIcon={<FilterOutlined />}>
              {activityTypes.map((type) => (
                <Select.Option key={type.value} value={type.value}>
                  {type.label}
                </Select.Option>
              ))}
            </Select>
            <RangePicker
              format="DD/MM/YYYY"
              onChange={setDateRange}
              style={{ width: 280 }}
            />
            {(searchTerm || filterType !== "all" || dateRange) && (
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                  setDateRange(null);
                }}>
                Clear Filters
              </Button>
            )}
          </Space>
        </Space>
      </Card>

      <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
        {filteredActivities.length > 0 ? (
          <Timeline>
            {filteredActivities.map((activity, index) => (
              <Timeline.Item key={index} color={getActivityColor(activity)}>
                <Space direction="vertical" size={0}>
                  <Text strong>{activity.description}</Text>
                  <Text type="secondary" className="text-xs">
                    {dayjs(activity.actionDate).format("DD MMM YYYY, HH:mm")} •{" "}
                    {dayjs(activity.actionDate).fromNow()}
                  </Text>
                  <Space size={4} className="mt-1">
                    {activity.performedBy && (
                      <Tag color="blue" className="text-xs">
                        By: {activity.performedBy.firstName}{" "}
                        {activity.performedBy.lastName}
                      </Tag>
                    )}
                    {activity.serviceType && (
                      <Tag color="green" className="text-xs">
                        {activity.serviceType}
                      </Tag>
                    )}
                    {activity.unitsConsumed > 0 && (
                      <Tag color="orange" className="text-xs">
                        {activity.unitsConsumed} unit(s)
                      </Tag>
                    )}
                  </Space>
                </Space>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Empty
            description={
              searchTerm || filterType !== "all" || dateRange
                ? "No activities match your filters"
                : "No activities recorded yet"
            }
          />
        )}
      </div>
    </Modal>
  );
};

export default ActivityLogModal;
