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
  return (
    <Card
      title={<span style={{ fontSize: "16px", fontWeight: 600 }}>{title}</span>}
      extra={
        renderExtra ||
        (onViewAll && (
          <Button type="link" size="small" onClick={onViewAll}>
            View All <RightOutlined />
          </Button>
        ))
      }
      bodyStyle={{ padding: "16px" }}
      headStyle={{
        borderBottom: "2px solid #f0f0f0",
        padding: "16px 20px",
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
                padding: "12px 0",
                borderBottom:
                  index < data.length - 1 ? "1px solid #f0f0f0" : "none",
                cursor: onItemClick ? "pointer" : "default",
                transition: "background-color 0.2s",
              }}
              className="distribution-item"
              onClick={() => onItemClick && onItemClick(item)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Item Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}>
                  <Text strong style={{ fontSize: "14px" }}>
                    {item.name}
                  </Text>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Tag color="blue">{item.count}</Tag>
                    {item.formattedAvgFee && (
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        {item.formattedAvgFee}
                      </Text>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
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
                        "0%": "#1890ff",
                        "100%": "#52c41a",
                      }}
                      style={{ flex: 1, margin: 0 }}
                    />
                    <Text
                      type="secondary"
                      style={{
                        fontSize: "12px",
                        minWidth: "40px",
                        textAlign: "right",
                      }}>
                      {Math.round(item.percentage)}%
                    </Text>
                  </div>
                )}

                {/* Description */}
                {item.description && (
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "12px",
                      display: "block",
                      marginTop: "4px",
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
          border-radius: 4px;
          padding-left: 8px !important;
          padding-right: 8px !important;
        }
      `}</style>
    </Card>
  );
};

export default DistributionChart;
