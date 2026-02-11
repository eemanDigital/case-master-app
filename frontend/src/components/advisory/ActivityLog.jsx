// components/advisory/ActivityLog.jsx
import React from "react";
import { Card, Timeline, Typography, Tag, Avatar, Space } from "antd";
import {
  UserOutlined,
  FileTextOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

const ActivityLog = ({ advisoryId }) => {
  // Mock activities
  const activities = [
    {
      id: "1",
      action: "created",
      entity: "advisory",
      user: { name: "John Doe", avatar: null },
      timestamp: "2024-12-01T10:30:00Z",
      details: "Created new advisory matter",
    },
    {
      id: "2",
      action: "updated",
      entity: "research_question",
      user: { name: "Jane Smith", avatar: null },
      timestamp: "2024-12-02T14:45:00Z",
      details: "Added research question",
    },
    {
      id: "3",
      action: "completed",
      entity: "deliverable",
      user: { name: "Bob Johnson", avatar: null },
      timestamp: "2024-12-03T09:15:00Z",
      details: "Delivered legal opinion document",
    },
  ];

  const getActionIcon = (action) => {
    const icons = {
      created: <FileTextOutlined />,
      updated: <EditOutlined />,
      completed: <CheckCircleOutlined />,
      default: <ClockCircleOutlined />,
    };
    return icons[action] || icons.default;
  };

  const getActionColor = (action) => {
    const colors = {
      created: "green",
      updated: "blue",
      completed: "purple",
      default: "gray",
    };
    return colors[action] || colors.default;
  };

  return (
    <Card title="Activity Log">
      <Timeline
        mode="left"
        items={activities.map((activity) => ({
          color: getActionColor(activity.action),
          children: (
            <div style={{ paddingLeft: 16 }}>
              <Space align="start" style={{ width: "100%" }}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  src={activity.user.avatar}
                />
                <div style={{ flex: 1 }}>
                  <Space size={4}>
                    <Text strong>{activity.user.name}</Text>
                    <Tag
                      color={getActionColor(activity.action)}
                      icon={getActionIcon(activity.action)}>
                      {activity.action}
                    </Tag>
                    <Text type="secondary">the {activity.entity}</Text>
                  </Space>
                  {activity.details && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary">{activity.details}</Text>
                    </div>
                  )}
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(activity.timestamp).format("DD MMM YYYY HH:mm")}
                    </Text>
                  </div>
                </div>
              </Space>
            </div>
          ),
        }))}
      />
    </Card>
  );
};

export default ActivityLog;
