import React from "react";
import { Card, Statistic, Typography, Tooltip } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
const { Text } = Typography;

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = "#1890ff",
  description,
  trend,
  prefix,
  suffix,
  formattedValue,
  subValue,
  loading = false,
  onClick,
  isActive = false,
}) => {
  const getGradient = () => {
    const colors = {
      "#1890ff": "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)",
      "#52c41a": "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)",
      "#faad14": "linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%)",
      "#722ed1": "linear-gradient(135deg, #f9f0ff 0%, #d3adf7 100%)",
      "#13c2c2": "linear-gradient(135deg, #e6fffa 0%, #87e8de 100%)",
      "#eb2f96": "linear-gradient(135deg, #fff0f6 0%, #ffadd2 100%)",
      "#fa8c16": "linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)",
    };
    return colors[color] || colors["#1890ff"];
  };

  return (
    <Card
      hoverable
      onClick={onClick}
      loading={loading}
      className={`stat-card ${isActive ? "stat-card-active" : ""}`}
      bodyStyle={{ padding: 0 }}
      style={{
        height: "180px",
        borderRadius: "16px",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: isActive
          ? "0 12px 40px rgba(0,0,0,0.15)"
          : "0 4px 20px rgba(0,0,0,0.08)",
        transform: isActive ? "translateY(-6px)" : "none",
        border: "none",
        cursor: onClick ? "pointer" : "default",
      }}>
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: getGradient(),
        }}>
        <div
          style={{
            padding: "20px 20px 12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}>
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.7)",
              borderRadius: "12px",
              padding: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(10px)",
            }}>
            {Icon && <Icon style={{ color, fontSize: 22 }} />}
          </div>
          {trend && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                borderRadius: "20px",
                backgroundColor:
                  trend === "up"
                    ? "rgba(82, 196, 26, 0.15)"
                    : "rgba(245, 34, 45, 0.15)",
                color: trend === "up" ? "#52c41a" : "#f5222d",
                fontSize: "12px",
                fontWeight: 600,
              }}>
              {trend === "up" ? (
                <ArrowUpOutlined style={{ fontSize: 10 }} />
              ) : (
                <ArrowDownOutlined style={{ fontSize: 10 }} />
              )}
              {trend === "up" ? "Up" : "Down"}
            </div>
          )}
        </div>

        <div style={{ padding: "0 20px 20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <Text
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "rgba(0,0,0,0.45)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "4px",
            }}>
            {title}
          </Text>

          <div style={{ marginBottom: "6px" }}>
            {formattedValue ? (
              <Text
                strong
                style={{
                  fontSize: "32px",
                  color: "#1f1f1f",
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}>
                {formattedValue}
              </Text>
            ) : (
              <Statistic
                value={value}
                prefix={prefix}
                suffix={suffix}
                valueStyle={{
                  fontSize: "32px",
                  fontWeight: 700,
                  color: "#1f1f1f",
                  lineHeight: 1.2,
                }}
              />
            )}
          </div>

          {description && (
            <Tooltip title={description}>
              <Text
                style={{
                  fontSize: "12px",
                  color: "rgba(0,0,0,0.45)",
                  display: "block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                {description}
              </Text>
            </Tooltip>
          )}

          {subValue && (
            <div
              style={{
                marginTop: "8px",
                padding: "4px 10px",
                backgroundColor:
                  subValue.includes("overdue") || subValue.includes("missing")
                    ? "rgba(245, 34, 45, 0.1)"
                    : "rgba(250, 173, 20, 0.1)",
                borderRadius: "6px",
                display: "inline-flex",
                alignSelf: "flex-start",
              }}>
              <Text
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color:
                    subValue.includes("overdue") || subValue.includes("missing")
                      ? "#f5222d"
                      : "#faad14",
                }}>
                {subValue}
              </Text>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
