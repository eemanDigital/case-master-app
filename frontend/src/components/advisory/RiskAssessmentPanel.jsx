import React, { useState } from "react";
import { Card, Table, Tag, Progress, Typography, Row, Col, Empty, Button, Space, Modal, Form, Input, Select, message } from "antd";
import { WarningOutlined, CheckCircleOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import dayjs from "dayjs";
import {
  selectRiskAssessment,
  updateRiskAssessment,
  addRiskItem,
  updateRiskItem,
  deleteRiskItem,
} from "../../redux/features/advisory/advisorySlice";

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const RISK_FIELDS = [
  {
    key: "risk",
    label: "Risk",
    type: "text",
    required: true,
  },
  {
    key: "likelihood",
    label: "Likelihood",
    type: "select",
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
    ],
  },
  {
    key: "impact",
    label: "Impact",
    type: "select",
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
    ],
  },
  {
    key: "mitigation",
    label: "Mitigation",
    type: "textarea",
  },
];

const RiskAssessmentPanel = () => {
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);
  const [form] = Form.useForm();

  const riskAssessment = useSelector(selectRiskAssessment);

  const handleOverallRiskChange = async (value) => {
    try {
      await dispatch(
        updateRiskAssessment({
          matterId: riskAssessment?.matterId,
          data: { overallRisk: value },
        })
      ).unwrap();
      message.success("Overall risk level updated");
    } catch (error) {
      message.error("Failed to update overall risk level");
    }
  };

  const handleSave = async (values) => {
    try {
      if (editingRisk) {
        const updatedRisks = (riskAssessment?.risks || []).map((r) =>
          r._id === editingRisk._id ? { ...r, ...values } : r
        );
        await dispatch(
          updateRiskAssessment({
            matterId: riskAssessment?.matterId,
            data: { risks: updatedRisks },
          })
        ).unwrap();
        message.success("Risk item updated");
      } else {
        const newRisk = {
          ...values,
          _id: `temp_${Date.now()}`,
        };
        const updatedRisks = [...(riskAssessment?.risks || []), newRisk];
        await dispatch(
          updateRiskAssessment({
            matterId: riskAssessment?.matterId,
            data: { risks: updatedRisks },
          })
        ).unwrap();
        message.success("Risk item added");
      }
      setModalVisible(false);
      setEditingRisk(null);
      form.resetFields();
    } catch (error) {
      message.error("Failed to save risk item");
    }
  };

  const handleDelete = async (riskId) => {
    try {
      const updatedRisks = (riskAssessment?.risks || []).filter(
        (r) => r._id !== riskId
      );
      await dispatch(
        updateRiskAssessment({
          matterId: riskAssessment?.matterId,
          data: { risks: updatedRisks },
        })
      ).unwrap();
      message.success("Risk item deleted");
    } catch (error) {
      message.error("Failed to delete risk item");
    }
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
        return <Tag color={colors[likelihood] || "default"}>{likelihood?.toUpperCase() || "N/A"}</Tag>;
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
        return <Tag color={colors[impact] || "default"}>{impact?.toUpperCase() || "N/A"}</Tag>;
      },
    },
    {
      title: "Mitigation",
      dataIndex: "mitigation",
      key: "mitigation",
      render: (mitigation) => mitigation || "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRisk(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          />
        </Space>
      ),
    },
  ];

  const calculateRiskScore = () => {
    if (!riskAssessment?.risks || riskAssessment.risks.length === 0) return 0;
    
    let totalScore = 0;
    let maxScore = 0;

    riskAssessment.risks.forEach((risk) => {
      const likelihoodScore =
        { low: 1, medium: 2, high: 3 }[risk.likelihood] || 0;
      const impactScore = { low: 1, medium: 2, high: 3 }[risk.impact] || 0;
      totalScore += likelihoodScore * impactScore;
      maxScore += 9;
    });

    return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  };

  const riskScore = calculateRiskScore();
  const riskLevel =
    riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";

  const getOverallRiskColor = (level) => {
    const colors = {
      high: "red",
      medium: "orange",
      low: "green",
      critical: "purple",
    };
    return colors[level] || "default";
  };

  if (!riskAssessment) {
    return (
      <Card title="Risk Assessment">
        <Empty description="No risk assessment data available" />
      </Card>
    );
  }

  return (
    <div>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title="Risk Overview">
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              <div>
                <Text type="secondary">Overall Risk Level</Text>
                <div style={{ marginTop: 8 }}>
                  <Select
                    value={riskAssessment.overallRisk || "medium"}
                    onChange={handleOverallRiskChange}
                    style={{ width: 180 }}
                    size="large">
                    <Option value="low">
                      <Tag color="green" style={{ width: "100%", textAlign: "center" }}>LOW</Tag>
                    </Option>
                    <Option value="medium">
                      <Tag color="orange" style={{ width: "100%", textAlign: "center" }}>MEDIUM</Tag>
                    </Option>
                    <Option value="high">
                      <Tag color="red" style={{ width: "100%", textAlign: "center" }}>HIGH</Tag>
                    </Option>
                    <Option value="critical">
                      <Tag color="purple" style={{ width: "100%", textAlign: "center" }}>CRITICAL</Tag>
                    </Option>
                  </Select>
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
          <Card 
            title="Risk Details"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingRisk(null);
                  form.resetFields();
                  setModalVisible(true);
                }}>
                Add Risk
              </Button>
            }
          >
            {riskAssessment.risks && riskAssessment.risks.length > 0 ? (
              <Table
                columns={columns}
                dataSource={riskAssessment.risks}
                rowKey="_id"
                pagination={false}
              />
            ) : (
              <Empty description="No risk items added yet" />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingRisk ? "Edit Risk Item" : "Add Risk Item"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRisk(null);
          form.resetFields();
        }}
        footer={null}
        width={600}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="risk"
            label="Risk Description"
            rules={[{ required: true, message: "Please enter risk description" }]}
            initialValue={editingRisk?.risk}>
            <TextArea rows={3} placeholder="Describe the risk..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="likelihood"
                label="Likelihood"
                initialValue={editingRisk?.likelihood || "medium"}>
                <Select>
                  <Option value="low">Low</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="high">High</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="impact"
                label="Impact"
                initialValue={editingRisk?.impact || "medium"}>
                <Select>
                  <Option value="low">Low</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="high">High</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="mitigation"
            label="Mitigation Strategy"
            initialValue={editingRisk?.mitigation}>
            <TextArea rows={3} placeholder="Describe mitigation strategy..." />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingRisk(null);
                  form.resetFields();
                }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRisk ? "Update" : "Add"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RiskAssessmentPanel;
