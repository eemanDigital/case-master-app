import React from "react";
import { Card, List, Avatar, Tag, Typography, Button, Empty } from "antd";
import { RightOutlined, FolderOutlined } from "@ant-design/icons";

const { Text } = Typography;

const RecentMattersCard = ({
  recentMatters = [],
  loading = false,
  onViewMatter,
  onViewAll,
}) => {
  const statusColors = {
    active: { bg: "#f6ffed", border: "#52c41a", text: "#52c41a" },
    pending: { bg: "#fffbe6", border: "#faad14", text: "#faad14" },
    completed: { bg: "#e6f7ff", border: "#1890ff", text: "#1890ff" },
    closed: { bg: "#f5f5f5", border: "#8c8c8c", text: "#8c8c8c" },
  };

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FolderOutlined style={{ color: "#1890ff" }} />
          <span style={{ fontSize: "16px", fontWeight: 600 }}>
            Recent Matters
          </span>
        </div>
      }
      extra={
        onViewAll && (
          <Button type="link" size="small" onClick={onViewAll}>
            View All <RightOutlined />
          </Button>
        )
      }
      bodyStyle={{ padding: "0" }}
      headStyle={{
        borderBottom: "2px solid #f0f0f0",
        padding: "16px 20px",
      }}>
      {recentMatters.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text type="secondary">No recent matters available</Text>
          }
          style={{ padding: "40px 0" }}
        />
      ) : (
        <List
          loading={loading}
          dataSource={recentMatters}
          split={false}
          renderItem={(item, index) => {
            const statusConfig =
              statusColors[item.status] || statusColors.closed;

            return (
              <List.Item
                style={{
                  padding: "16px 20px",
                  borderBottom:
                    index < recentMatters.length - 1
                      ? "1px solid #f0f0f0"
                      : "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                className="recent-matter-item"
                onClick={() => onViewMatter && onViewMatter(item)}>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={48}
                      style={{
                        backgroundColor: statusConfig.bg,
                        border: `2px solid ${statusConfig.border}`,
                        color: statusConfig.text,
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}>
                      {item.matterNumber?.split("/")[0] || "GEN"}
                    </Avatar>
                  }
                  title={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}>
                      <Text
                        strong
                        style={{
                          fontSize: "14px",
                          color: "#262626",
                        }}>
                        {item.matterNumber}
                      </Text>
                      <Tag
                        color={statusConfig.border}
                        style={{
                          margin: 0,
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 500,
                        }}>
                        {item.status.toUpperCase()}
                      </Tag>
                    </div>
                  }
                  description={
                    <div style={{ marginTop: "4px" }}>
                      <Text
                        style={{
                          fontSize: "13px",
                          color: "#595959",
                          display: "block",
                          marginBottom: "4px",
                        }}>
                        {item.title}
                      </Text>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Opened: {item.formattedDate}
                      </Text>
                    </div>
                  }
                />
                <Button
                  type="link"
                  size="small"
                  icon={<RightOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewMatter && onViewMatter(item);
                  }}
                />
              </List.Item>
            );
          }}
        />
      )}

      <style jsx>{`
        .recent-matter-item:hover {
          background-color: #fafafa;
        }
      `}</style>
    </Card>
  );
};

export default RecentMattersCard;
