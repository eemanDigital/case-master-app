import React from "react";
import { Card, Statistic, Typography, Badge } from "antd";
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
  return (
    <Badge.Ribbon
      text={trend === "up" ? "↑" : trend === "down" ? "↓" : null}
      color={
        trend === "up"
          ? "#52c41a"
          : trend === "down"
            ? "#f5222d"
            : "transparent"
      }>
      <Card
        hoverable
        onClick={onClick}
        loading={loading}
        className={`stat-card ${isActive ? "stat-card-active" : ""}`}
        bodyStyle={{ padding: "20px" }}
        style={{
          borderLeft: `4px solid ${color}`,
          height: "100%",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: isActive
            ? "0 8px 24px rgba(0,0,0,0.12)"
            : "0 2px 8px rgba(0,0,0,0.06)",
          transform: isActive ? "translateY(-4px)" : "none",
        }}>
        <div className="stat-card-content">
          {/* Icon Section */}
          <div
            className="stat-icon"
            style={{
              backgroundColor: `${color}15`,
              borderRadius: "12px",
              padding: "12px",
              display: "inline-flex",
              marginBottom: "12px",
            }}>
            {Icon && <Icon style={{ color, fontSize: 24 }} />}
          </div>

          {/* Title */}
          <Text
            type="secondary"
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
            {title}
          </Text>

          {/* Value */}
          <div style={{ marginBottom: "8px" }}>
            {formattedValue ? (
              <Text
                strong
                style={{
                  fontSize: "28px",
                  color: color,
                  fontWeight: 700,
                  lineHeight: 1,
                }}>
                {formattedValue}
              </Text>
            ) : (
              <Statistic
                value={value}
                prefix={prefix}
                suffix={suffix}
                valueStyle={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: color,
                  lineHeight: 1,
                }}
              />
            )}
          </div>

          {/* Description */}
          {description && (
            <Text
              type="secondary"
              style={{
                fontSize: "12px",
                display: "block",
                marginTop: "8px",
              }}>
              {description}
            </Text>
          )}

          {/* Sub Value (warnings/alerts) */}
          {subValue && (
            <div
              style={{
                marginTop: "8px",
                padding: "4px 8px",
                backgroundColor: "#fff7e6",
                borderRadius: "4px",
                display: "inline-block",
              }}>
              <Text
                type="warning"
                style={{ fontSize: "11px", fontWeight: 500 }}>
                {subValue}
              </Text>
            </div>
          )}
        </div>
      </Card>
    </Badge.Ribbon>
  );
};

export default StatCard;
