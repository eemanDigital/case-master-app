import React, { useEffect } from "react";
import {
  Card,
  List,
  Typography,
  Badge,
  Space,
  Button,
  Empty,
  Spin,
  Tag,
} from "antd";
import {
  WarningOutlined,
  CalendarOutlined,
  EyeOutlined,
  SyncOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { fetchExpiringRetainers } from "../../redux/features/retainer/retainerSlice";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

/**
 * ExpiringRetainersWidget Component - FIXED
 * Shows retainers expiring soon
 * Fixed to match actual API data structure
 */
const ExpiringRetainersWidget = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const expiringRetainers = useSelector(
    (state) => state.retainer.expiringRetainers,
  );
  const loading = useSelector((state) => state.retainer.loading);

  useEffect(() => {
    dispatch(fetchExpiringRetainers({ days: 60 }));
  }, [dispatch]);

  const getDaysColor = (days) => {
    if (days < 0) return "#cf1322"; // Red - Expired
    if (days <= 7) return "#faad14"; // Orange - Critical
    if (days <= 30) return "#1890ff"; // Blue - Warning
    return "#52c41a"; // Green - OK
  };

  const getDaysText = (days) => {
    if (days < 0) return "Expired";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days}d`;
  };

  const formatRetainerType = (type) => {
    if (!type) return "N/A";
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Card
      title={
        <Space>
          <WarningOutlined className="text-orange-500" />
          <Title level={5} className="!mb-0">
            Expiring Retainers
          </Title>
        </Space>
      }
      extra={
        <Button
          type="text"
          icon={<SyncOutlined />}
          onClick={() => dispatch(fetchExpiringRetainers({ days: 60 }))}
          size="small"
        />
      }
      className="shadow-lg"
      style={{ height: "100%" }}>
      {loading ? (
        <div
          className="flex justify-center items-center"
          style={{ minHeight: 200 }}>
          <Spin />
        </div>
      ) : !expiringRetainers || expiringRetainers.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No expiring retainers"
          style={{ padding: "40px 0" }}
        />
      ) : (
        <List
          dataSource={expiringRetainers}
          renderItem={(item) => {
            const endDate = item.retainerDetail?.agreementEndDate;
            const daysRemaining = endDate
              ? dayjs(endDate).diff(dayjs(), "day")
              : null;
            const client = item.client;

            // Display name with fallback
            const displayName =
              client?.companyName ||
              `${client?.firstName || ""} ${client?.lastName || ""}`.trim() ||
              "N/A";

            return (
              <List.Item
                key={item._id}
                className="hover:bg-gray-50 transition-colors px-2 -mx-2 rounded cursor-pointer"
                onClick={() =>
                  navigate(`/dashboard/matters/retainers/${item._id}/details`)
                }
                actions={[
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(
                        `/dashboard/matters/retainers/${item._id}/details`,
                      );
                    }}
                  />,
                ]}>
                <List.Item.Meta
                  avatar={
                    daysRemaining !== null ? (
                      <Badge
                        count={getDaysText(daysRemaining)}
                        style={{
                          backgroundColor: getDaysColor(daysRemaining),
                          minWidth: 45,
                        }}
                      />
                    ) : (
                      <Badge
                        count="N/A"
                        style={{ backgroundColor: "#d9d9d9" }}
                      />
                    )
                  }
                  title={
                    <Space direction="vertical" size={0}>
                      <Text strong className="block text-sm">
                        {displayName}
                      </Text>
                      <Text type="secondary" className="text-xs">
                        {item.matterNumber || "N/A"}
                      </Text>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={2} className="w-full">
                      {item.title && (
                        <Text
                          type="secondary"
                          className="text-xs block"
                          ellipsis>
                          {item.title}
                        </Text>
                      )}
                      {endDate && (
                        <Text type="secondary" className="text-xs">
                          <CalendarOutlined className="mr-1" />
                          {dayjs(endDate).format("DD MMM YYYY")}
                        </Text>
                      )}
                      {item.retainerDetail?.retainerType && (
                        <Tag
                          size="small"
                          color={
                            item.retainerDetail.retainerType === "general-legal"
                              ? "blue"
                              : item.retainerDetail.retainerType ===
                                  "company-secretarial"
                                ? "purple"
                                : "green"
                          }>
                          {formatRetainerType(item.retainerDetail.retainerType)}
                        </Tag>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
          size="small"
          style={{ maxHeight: 500, overflowY: "auto" }}
        />
      )}

      {expiringRetainers && expiringRetainers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Text type="secondary" className="text-xs">
            Showing retainers expiring in next 60 days
          </Text>
        </div>
      )}
    </Card>
  );
};

export default ExpiringRetainersWidget;
