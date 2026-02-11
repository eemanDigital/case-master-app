import React from "react";
import { Card, Row, Col, Progress, Typography, Tag, Empty } from "antd";
import {
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
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
      : 0;

  return (
    <Card
      title={
        <span style={{ fontSize: "16px", fontWeight: 600 }}>
          Compliance Overview
        </span>
      }
      bodyStyle={{ padding: "20px" }}
      headStyle={{
        borderBottom: "2px solid #f0f0f0",
        padding: "16px 20px",
      }}>
      <Row gutter={[16, 16]}>
        {/* Requirements Section */}
        <Col xs={24} md={12}>
          <div
            style={{
              padding: "16px",
              backgroundColor: "#f6ffed",
              borderRadius: "8px",
              border: "1px solid #b7eb8f",
              height: "100%",
            }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "12px",
              }}>
              <CheckCircleOutlined
                style={{ fontSize: 20, color: "#52c41a", marginRight: "8px" }}
              />
              <Title level={5} style={{ margin: 0 }}>
                Requirements
              </Title>
            </div>

            {requirementsData && requirementsData.length > 0 ? (
              <>
                <Progress
                  percent={requirementsProgress}
                  status="active"
                  strokeColor="#52c41a"
                  style={{ marginBottom: "16px" }}
                />

                <Row gutter={8}>
                  {requirementsData.map((req) => (
                    <Col span={12} key={req._id}>
                      <div
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          backgroundColor: "white",
                          borderRadius: "6px",
                        }}>
                        <div
                          style={{
                            fontSize: "28px",
                            fontWeight: "bold",
                            color: req.color,
                            marginBottom: "4px",
                          }}>
                          {req.count}
                        </div>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
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

        {/* Deliverables Section */}
        <Col xs={24} md={12}>
          <div
            style={{
              padding: "16px",
              backgroundColor: "#fff7e6",
              borderRadius: "8px",
              border: "1px solid #ffd591",
              height: "100%",
            }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "12px",
              }}>
              <ClockCircleOutlined
                style={{ fontSize: 20, color: "#fa8c16", marginRight: "8px" }}
              />
              <Title level={5} style={{ margin: 0 }}>
                Deliverables
              </Title>
            </div>

            {deliverablesData && deliverablesData.length > 0 ? (
              <>
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px",
                    backgroundColor: "white",
                    borderRadius: "6px",
                  }}>
                  <Row gutter={8}>
                    <Col span={12}>
                      <Text
                        strong
                        style={{ display: "block", fontSize: "18px" }}>
                        {stats?.deliverables?.pending || 0}
                      </Text>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Pending
                      </Text>
                    </Col>
                    <Col span={12}>
                      <Text
                        type="danger"
                        strong
                        style={{ display: "block", fontSize: "18px" }}>
                        {stats?.deliverables?.overdue || 0}
                      </Text>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
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
                        padding: "8px 12px",
                        backgroundColor: "white",
                        borderRadius: "6px",
                      }}>
                      <Tag color={del.color}>{del.name}</Tag>
                      <Text strong style={{ fontSize: "16px" }}>
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
