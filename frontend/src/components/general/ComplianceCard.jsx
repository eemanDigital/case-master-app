import React from "react";
import { Card, Row, Col, Progress, Typography, Tag, Empty } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

const ComplianceCard = ({ requirementsData, deliverablesData, stats }) => {
  const requirementsProgress =
    stats?.requirements?.completed && stats?.requirements?.pending
      ? Math.round(
          (stats.requirements.completed /
            (stats.requirements.completed + stats.requirements.pending)) *
            100,
        )
      : 100;

  return (
    <Card
      title={
        <span style={{ fontSize: "16px", fontWeight: 600, color: "#1f1f1f" }}>
          Compliance Overview
        </span>
      }
      bodyStyle={{ padding: "20px" }}
      headStyle={{
        borderBottom: "1px solid #f0f0f0",
        padding: "16px 20px",
      }}
      style={{
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "none",
      }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <div
            style={{
              padding: "18px",
              background: "linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)",
              borderRadius: "12px",
              height: "100%",
            }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "16px",
              }}>
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.7)",
                  borderRadius: "10px",
                  padding: "8px",
                  display: "flex",
                  marginRight: "10px",
                }}>
                <CheckCircleOutlined
                  style={{ fontSize: 20, color: "#52c41a" }}
                />
              </div>
              <Title level={5} style={{ margin: 0, color: "#389e0d" }}>
                Requirements
              </Title>
            </div>

            {requirementsData && requirementsData.length > 0 ? (
              <>
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "14px",
                    backgroundColor: "rgba(255,255,255,0.7)",
                    borderRadius: "10px",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <Text strong style={{ fontSize: "13px", color: "#389e0d" }}>
                      Completion Rate
                    </Text>
                    <Text strong style={{ fontSize: "13px", color: "#389e0d" }}>
                      {requirementsProgress}%
                    </Text>
                  </div>
                  <Progress
                    percent={requirementsProgress}
                    status="active"
                    strokeColor="#52c41a"
                    trailColor="rgba(255,255,255,0.5)"
                    showInfo={false}
                  />
                </div>

                <Row gutter={8}>
                  {requirementsData.map((req) => (
                    <Col span={12} key={req._id}>
                      <div
                        style={{
                          textAlign: "center",
                          padding: "14px",
                          backgroundColor: "white",
                          borderRadius: "10px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}>
                        <div
                          style={{
                            fontSize: "26px",
                            fontWeight: "700",
                            color: req.color,
                            marginBottom: "4px",
                          }}>
                          {req.count}
                        </div>
                        <Text
                          strong
                          style={{
                            fontSize: "11px",
                            color: req.color,
                            textTransform: "uppercase",
                          }}>
                          {req.name}
                        </Text>
                      </div>
                    </Col>
                  ))}
                </Row>
              </>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No requirements"
              />
            )}
          </div>
        </Col>

        <Col xs={24} md={12}>
          <div
            style={{
              padding: "18px",
              background:
                stats?.deliverables?.overdue > 0
                  ? "linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)"
                  : "linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)",
              borderRadius: "12px",
              height: "100%",
            }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "16px",
              }}>
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.7)",
                  borderRadius: "10px",
                  padding: "8px",
                  display: "flex",
                  marginRight: "10px",
                }}>
                <ClockCircleOutlined
                  style={{
                    fontSize: 20,
                    color: stats?.deliverables?.overdue > 0 ? "#f5222d" : "#fa8c16",
                  }}
                />
              </div>
              <Title
                level={5}
                style={{
                  margin: 0,
                  color: stats?.deliverables?.overdue > 0 ? "#cf1322" : "#d46b08",
                }}>
                Deliverables
              </Title>
            </div>

            {deliverablesData && deliverablesData.length > 0 ? (
              <>
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "14px",
                    backgroundColor: "rgba(255,255,255,0.7)",
                    borderRadius: "10px",
                  }}>
                  <Row gutter={8}>
                    <Col span={12}>
                      <Text
                        strong
                        style={{
                          display: "block",
                          fontSize: "22px",
                          color: "#fa8c16",
                        }}>
                        {stats?.deliverables?.pending || 0}
                      </Text>
                      <Text
                        style={{
                          fontSize: "11px",
                          color: "#d46b08",
                          textTransform: "uppercase",
                          fontWeight: 500,
                        }}>
                        Pending
                      </Text>
                    </Col>
                    <Col span={12}>
                      <Text
                        strong
                        style={{
                          display: "block",
                          fontSize: "22px",
                          color: stats?.deliverables?.overdue > 0 ? "#f5222d" : "#8c8c8c",
                        }}>
                        {stats?.deliverables?.overdue || 0}
                      </Text>
                      <Text
                        style={{
                          fontSize: "11px",
                          color: stats?.deliverables?.overdue > 0 ? "#cf1322" : "#8c8c8c",
                          textTransform: "uppercase",
                          fontWeight: 500,
                        }}>
                        Overdue
                      </Text>
                    </Col>
                  </Row>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}>
                  {deliverablesData.map((del) => (
                    <div
                      key={del._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      }}>
                      <Tag
                        color={del.color}
                        style={{
                          margin: 0,
                          borderRadius: "6px",
                          fontWeight: 500,
                          fontSize: "11px",
                        }}>
                        {del.name}
                      </Tag>
                      <Text strong style={{ fontSize: "15px", color: "#262626" }}>
                        {del.count}
                      </Text>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No deliverables"
              />
            )}
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default ComplianceCard;
