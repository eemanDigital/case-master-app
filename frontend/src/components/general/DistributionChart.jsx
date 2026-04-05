import React from "react";
import { Card, List, Progress, Tag, Button, Typography, Empty } from "antd";
import { RightOutlined } from "@ant-design/icons";

const { Text } = Typography;

const DistributionChart = ({
  title,
  data = [],
  loading = false,
  onItemClick,
  onViewAll,
  renderExtra,
  emptyMessage = "No data available",
}) => {
  const colors = [
    "#1890ff",
    "#52c41a",
    "#faad14",
    "#722ed1",
    "#13c2c2",
    "#eb2f96",
    "#fa8c16",
    "#f5222d",
  ];

  return (
    <Card
      title={
        <span style={{ fontSize: "16px", fontWeight: 600, color: "#1f1f1f" }}>
          {title}
        </span>
      }
      extra={
        renderExtra ||
        (onViewAll && (
          <Button
            type="link"
            size="small"
            onClick={onViewAll}
            style={{ fontWeight: 500 }}>
            View All <RightOutlined />
          </Button>
        ))
      }
      bodyStyle={{ padding: "8px 16px 16px" }}
      headStyle={{
        borderBottom: "1px solid #f0f0f0",
        padding: "16px 20px",
      }}
      style={{
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "none",
      }}>
      {data.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<Text type="secondary">{emptyMessage}</Text>}
          style={{ padding: "40px 0" }}
        />
      ) : (
        <List
          loading={loading}
          dataSource={data}
          split={false}
          renderItem={(item, index) => (
            <List.Item
              style={{
                padding: "14px 12px",
                borderBottom:
                  index < data.length - 1 ? "1px solid #f5f5f5" : "none",
                cursor: onItemClick ? "pointer" : "default",
                transition: "all 0.2s ease",
                borderRadius: "8px",
                marginBottom: "4px",
              }}
              className="distribution-item"
              onClick={() => onItemClick && onItemClick(item)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: colors[index % colors.length],
                      }}
                    />
                    <Text strong style={{ fontSize: "14px", color: "#262626" }}>
                      {item.name}
                    </Text>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <Tag
                      style={{
                        borderRadius: "6px",
                        fontWeight: 600,
                        fontSize: "12px",
                        border: "none",
                        backgroundColor: `${colors[index % colors.length]}15`,
                        color: colors[index % colors.length],
                      }}>
                      {item.count}
                    </Tag>
                    {item.formattedAvgFee && (
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        {item.formattedAvgFee}
                      </Text>
                    )}
                  </div>
                </div>

                {item.percentage !== undefined && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}>
                    <Progress
                      percent={Math.round(item.percentage)}
                      size="small"
                      strokeColor={{
                        "0%": colors[index % colors.length],
                        "100%": colors[(index + 1) % colors.length],
                      }}
                      trailColor="#f0f0f0"
                      style={{ flex: 1, margin: 0 }}
                      showInfo={false}
                    />
                    <Text
                      strong
                      style={{
                        fontSize: "12px",
                        minWidth: "40px",
                        textAlign: "right",
                        color: "#8c8c8c",
                      }}>
                      {Math.round(item.percentage)}%
                    </Text>
                  </div>
                )}

                {item.description && (
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "12px",
                      display: "block",
                      marginTop: "6px",
                    }}>
                    {item.description}
                  </Text>
                )}
              </div>
            </List.Item>
          )}
        />
      )}

      <style jsx>{`
        .distribution-item:hover {
          background-color: #fafafa;
          margin-left: -4px;
          margin-right: -4px;
          padding-left: 16px !important;
          padding-right: 16px !important;
        }
      `}</style>
    </Card>
  );
};

export default DistributionChart;
