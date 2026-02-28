import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Select,
  Typography,
  Empty,
  Spin,
  Badge,
  Modal,
} from "antd";
import {
  CalendarOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDataFetch } from "../../hooks/useDataFetch";

const { Title, Text } = Typography;
const { Option } = Select;

const CauseList = () => {
  const { dataFetcher, data, loading, error } = useDataFetch();
  const [selectedRange, setSelectedRange] = useState("this-week");
  const [selectedTab, setSelectedTab] = useState("today");
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [calendarData, setCalendarData] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    fetchCauseList();
  }, [selectedRange]);

  const fetchCauseList = () => {
    dataFetcher(`litigation/cause-list?range=${selectedRange}`, "GET");
  };

  const fetchCalendar = async () => {
    setCalendarLoading(true);
    try {
      const result = await dataFetcher(
        `litigation/hearings-calendar?month=${dayjs().month() + 1}&year=${dayjs().year()}`,
        "GET",
      );
      setCalendarData(result?.data?.data);
    } catch (err) {
      console.error("Failed to fetch calendar:", err);
    }
    setCalendarLoading(false);
  };

  const openCalendarModal = () => {
    fetchCalendar();
    setCalendarModalVisible(true);
  };

  const causeListData = data?.data?.causeList || {};
  const counts = data?.data?.counts || {};

  console.log("Cause List Data:", causeListData);

  const columns = [
    {
      title: "Date",
      dataIndex: "hearingDate",
      key: "hearingDate",
      width: 120,
      render: (date) => (
        <div>
          <div className="font-semibold">
            {date ? dayjs(date).format("DD/MM/YYYY") : "N/A"}
          </div>
          <Text type="secondary" className="text-xs">
            {date ? dayjs(date).format("hh:mm A") : ""}
          </Text>
        </div>
      ),
      sorter: (a, b) => new Date(a.hearingDate) - new Date(b.hearingDate),
    },
    {
      title: "Suit No",
      dataIndex: "suitNo",
      key: "suitNo",
      width: 150,
      render: (suitNo, record) => (
        <Link to={`/dashboard/matters/litigation/${record.matterId}`}>
          <Text className="text-blue-600 font-medium">{suitNo || "N/A"}</Text>
        </Link>
      ),
    },
    {
      title: "Court",
      dataIndex: "courtName",
      key: "courtName",
      width: 150,
    },
    {
      title: "Judge",
      dataIndex: "judge",
      key: "judge",
      width: 120,
    },
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      width: 150,
      render: (client) =>
        client ? (
          <div>
            <div>
              {client.firstName} {client.lastName}
            </div>
          </div>
        ) : (
          "N/A"
        ),
    },
    {
      title: "Purpose",
      dataIndex: "hearingPurpose",
      key: "hearingPurpose",
      width: 200,
    },
    {
      title: "Lawyers",
      dataIndex: "lawyerPresent",
      key: "lawyerPresent",
      width: 150,
      render: (lawyers) =>
        lawyers && lawyers.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {lawyers.map((lawyer, idx) => (
              <Tag key={idx} color="blue">
                {lawyer.firstName} {lawyer.lastName}
              </Tag>
            ))}
          </div>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Link to={`/dashboard/matters/litigation/${record.matterId}`}>
          <Button type="link" size="small">
            View Matter
          </Button>
        </Link>
      ),
    },
  ];

  const getActiveData = () => {
    switch (selectedTab) {
      case "today":
        return causeListData.today || [];
      case "thisWeek":
        return causeListData.thisWeek || [];
      case "nextWeek":
        return causeListData.nextWeek || [];
      case "overdue":
        return causeListData.overdue || [];
      case "thisMonth":
        return causeListData.thisMonth || [];
      default:
        return [];
    }
  };

  const tabs = [
    { key: "today", label: "Today", count: counts.today || 0, color: "red" },
    {
      key: "thisWeek",
      label: "This Week",
      count: counts.thisWeek || 0,
      color: "blue",
    },
    {
      key: "nextWeek",
      label: "Next Week",
      count: counts.nextWeek || 0,
      color: "purple",
    },
    {
      key: "overdue",
      label: "Overdue",
      count: counts.overdue || 0,
      color: "orange",
    },
    {
      key: "thisMonth",
      label: "This Month",
      count: counts.thisMonth || 0,
      color: "green",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading cause list..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <Title level={3} className="m-0">
              <CalendarOutlined className="mr-2" />
              Cause List
            </Title>
            <Text type="secondary">Upcoming court hearings and matters</Text>
          </div>
          <div className="flex gap-2">
            <Button icon={<CalendarOutlined />} onClick={openCalendarModal}>
              Calendar View
            </Button>
            <Select
              value={selectedRange}
              onChange={setSelectedRange}
              style={{ width: 160 }}>
              <Option value="this-week">This Week</Option>
              <Option value="next-week">Next Week</Option>
              <Option value="this-month">This Month</Option>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          {tabs.map((tab) => (
            <Col xs={12} sm={6} key={tab.key}>
              <Card
                className={`cursor-pointer transition-all ${
                  selectedTab === tab.key
                    ? "ring-2 ring-blue-500 shadow-lg"
                    : "hover:shadow-md"
                }`}
                onClick={() => setSelectedTab(tab.key)}>
                <div className="text-center">
                  <div
                    className="text-2xl font-bold"
                    style={{
                      color:
                        tab.color === "red"
                          ? "#ef4444"
                          : tab.color === "blue"
                            ? "#3b82f6"
                            : tab.color === "purple"
                              ? "#8b5cf6"
                              : tab.color === "orange"
                                ? "#f97316"
                                : "#22c55e",
                    }}>
                    {tab.count}
                  </div>
                  <div className="text-gray-600 text-sm">{tab.label}</div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Tabs */}
        <Card>
          <div className="flex border-b mb-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`px-4 py-2 whitespace-nowrap border-b-2 transition-colors ${
                  selectedTab === tab.key
                    ? "border-blue-500 text-blue-600 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                {tab.label}
                <Badge
                  count={tab.count}
                  className="ml-2"
                  style={{
                    backgroundColor:
                      tab.key === "overdue" ? "#fee2e2" : "#e0f2fe",
                    color: tab.key === "overdue" ? "#991b1b" : "#1e40af",
                  }}
                />
              </button>
            ))}
          </div>

          {/* Table */}
          {getActiveData().length > 0 ? (
            <Table
              columns={columns}
              dataSource={getActiveData()}
              rowKey={(record) => `${record.matterId}-${record.hearingDate}`}
              pagination={{ pageSize: 20 }}
              size="middle"
              scroll={{ x: 1000 }}
            />
          ) : (
            <Empty
              description={`No hearings scheduled for ${tabs.find((t) => t.key === selectedTab)?.label.toLowerCase()}`}
            />
          )}
        </Card>
      </div>

      {/* Calendar Modal */}
      <Modal
        title={
          <div className="flex items-center justify-between">
            <span>Hearings Calendar - {dayjs().format("MMMM YYYY")}</span>
            <div className="flex gap-2">
              <Button icon={<LeftOutlined />} size="small" />
              <Button icon={<RightOutlined />} size="small" />
            </div>
          </div>
        }
        open={calendarModalVisible}
        onCancel={() => setCalendarModalVisible(false)}
        width={900}
        footer={null}>
        {calendarLoading ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : calendarData?.events?.length > 0 ? (
          <div className="space-y-2">
            {calendarData.events.map((event, idx) => (
              <Card key={idx} size="small" className="hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-blue-600">
                      {dayjs(event.date).format("ddd, DD MMM YYYY - hh:mm A")}
                    </div>
                    <div className="font-medium">
                      {event.suitNo} - {event.courtName}
                    </div>
                    <div className="text-sm text-gray-600">{event.purpose}</div>
                    {event.client && (
                      <div className="text-sm text-gray-500">
                        Client: {event.client.firstName} {event.client.lastName}
                      </div>
                    )}
                  </div>
                  <Tag color={event.status === "completed" ? "green" : "blue"}>
                    {event.status === "completed" ? "Completed" : "Upcoming"}
                  </Tag>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Empty description="No hearings this month" />
        )}
      </Modal>
    </div>
  );
};

export default CauseList;
