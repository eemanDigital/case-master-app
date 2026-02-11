// components/advisory/panels/RiskAssessmentPanel.jsx
import React from "react";
import { Card, Table, Tag, Progress, Typography, Row, Col } from "antd";
import { WarningOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

const RiskAssessmentPanel = ({ advisoryId }) => {
  // Mock data
  const riskAssessment = {
    overallRisk: "medium",
    risks: [
      {
        _id: "1",
        risk: "Regulatory non-compliance",
        likelihood: "high",
        impact: "high",
        mitigation: "Implement regular compliance audits",
        status: "mitigated",
      },
      {
        _id: "2",
        risk: "Contractual disputes",
        likelihood: "medium",
        impact: "medium",
        mitigation: "Include clear dispute resolution clauses",
        status: "pending",
      },
    ],
  };

  const columns = [
    {
      title: "Risk",
      dataIndex: "risk",
      key: "risk",
      width: "30%",
    },
    {
      title: "Likelihood",
      dataIndex: "likelihood",
      key: "likelihood",
      render: (likelihood) => {
        const colors = {
          high: "red",
          medium: "orange",
          low: "green",
        };
        return <Tag color={colors[likelihood]}>{likelihood.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Impact",
      dataIndex: "impact",
      key: "impact",
      render: (impact) => {
        const colors = {
          high: "red",
          medium: "orange",
          low: "green",
        };
        return <Tag color={colors[impact]}>{impact.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Mitigation",
      dataIndex: "mitigation",
      key: "mitigation",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "mitigated" ? "success" : "warning"}>
          {status === "mitigated" ? (
            <CheckCircleOutlined />
          ) : (
            <WarningOutlined />
          )}
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  const calculateRiskScore = () => {
    let totalScore = 0;
    let maxScore = 0;

    riskAssessment.risks.forEach((risk) => {
      const likelihoodScore =
        { low: 1, medium: 2, high: 3 }[risk.likelihood] || 0;
      const impactScore = { low: 1, medium: 2, high: 3 }[risk.impact] || 0;
      totalScore += likelihoodScore * impactScore;
      maxScore += 9; // 3 * 3
    });

    return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  };

  const riskScore = calculateRiskScore();
  const riskLevel =
    riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";

  return (
    <div>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title="Risk Overview">
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              <div>
                <Text type="secondary">Overall Risk Level</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag
                    color={
                      riskAssessment.overallRisk === "high"
                        ? "red"
                        : riskAssessment.overallRisk === "medium"
                          ? "orange"
                          : "green"
                    }
                    style={{ fontSize: 16, padding: "8px 16px" }}>
                    {riskAssessment.overallRisk.toUpperCase()}
                  </Tag>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <Text type="secondary">Risk Score</Text>
                <div style={{ marginTop: 8 }}>
                  <Progress
                    percent={riskScore}
                    status={
                      riskLevel === "high"
                        ? "exception"
                        : riskLevel === "medium"
                          ? "active"
                          : "success"
                    }
                    strokeColor={
                      riskLevel === "high"
                        ? "#ff4d4f"
                        : riskLevel === "medium"
                          ? "#faad14"
                          : "#52c41a"
                    }
                    format={(percent) => `${percent}%`}
                  />
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Risk Details">
            <Table
              columns={columns}
              dataSource={riskAssessment.risks}
              rowKey="_id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RiskAssessmentPanel;
