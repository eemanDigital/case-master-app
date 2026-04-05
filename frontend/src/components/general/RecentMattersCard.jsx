import React from "react";
import { Card, List, Avatar, Tag, Typography, Button, Empty } from "antd";
import { RightOutlined, FolderOutlined, ClockCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

const RecentMattersCard = ({
  recentMatters = [],
  loading = false,
  onViewMatter,
  onViewAll,
}) => {
  const statusColors = {
    active: { bg: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)", border: "#52c41a", text: "#389e0d", dot: "#52c41a" },
    pending: { bg: "linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%)", border: "#faad14", text: "#d48806", dot: "#faad14" },
    completed: { bg: "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)", border: "#1890ff", text: "#096dd9", dot: "#1890ff" },
    closed: { bg: "linear-gradient(135deg, #f5f5f5 0%, #d9d9d9 100%)", border: "#8c8c8c", text: "#595959", dot: "#8c8c8c" },
  };

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              backgroundColor: "#e6f7ff",
              borderRadius: "8px",
              padding: "6px",
              display: "flex",
            }}>
            <FolderOutlined style={{ color: "#1890ff", fontSize: 16 }} />
          </div>
          <span style={{ fontSize: "16px", fontWeight: 600, color: "#1f1f1f" }}>
            Recent Matters
          </span>
        </div>
      }
      extra={
        onViewAll && (
          <Button
            type="link"
            size="small"
            onClick={onViewAll}
            style={{ fontWeight: 500 }}>
            View All <RightOutlined />
          </Button>
        )
      }
      bodyStyle={{ padding: 0 }}
      headStyle={{
        borderBottom: "1px solid #f0f0f0",
        padding: "16px 20px",
      }}
      style={{
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "none",
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
            const statusConfig = statusColors[item.status] || statusColors.closed;

            return (
              <List.Item
                style={{
                  padding: "16px 20px",
                  borderBottom:
                    index < recentMatters.length - 1
                      ? "1px solid #f5f5f5"
                      : "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                className="recent-matter-item"
                onClick={() => onViewMatter && onViewMatter(item)}>
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "12px",
                        background: statusConfig.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}>
                      <Text
                        strong
                        style={{
                          color: statusConfig.text,
                          fontSize: "13px",
                          fontWeight: 700,
                        }}>
                        {item.matterNumber?.split("/")[0] || "GEN"}
                      </Text>
                    </div>
                  }
                  title={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
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
                      <div
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: statusConfig.dot,
                        }}
                      />
                      <Tag
                        style={{
                          margin: 0,
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 600,
                          border: "none",
                          backgroundColor: `${statusConfig.border}15`,
                          color: statusConfig.text,
                        }}>
                        {item.status?.toUpperCase()}
                      </Tag>
                    </div>
                  }
                  description={
                    <div style={{ marginTop: "6px" }}>
                      <Text
                        style={{
                          fontSize: "13px",
                          color: "#595959",
                          display: "block",
                          marginBottom: "6px",
                        }}>
                        {item.title}
                      </Text>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}>
                        <ClockCircleOutlined
                          style={{ fontSize: 11, color: "#8c8c8c" }}
                        />
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Opened: {item.formattedDate}
                        </Text>
                      </div>
                    </div>
                  }
                />
                <Button
                  type="text"
                  size="small"
                  icon={<RightOutlined />}
                  style={{
                    color: "#8c8c8c",
                    transition: "all 0.2s",
                  }}
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
        .recent-matter-item:hover Button {
          color: #1890ff !important;
        }
      `}</style>
    </Card>
  );
};

export default RecentMattersCard;
