import React, { useState, useMemo } from "react";
import {
  Card,
  List,
  Button,
  Input,
  Form,
  Space,
  Typography,
  Modal,
  message,
  Empty,
  Tag,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  selectCurrentAdvisoryDetail,
  selectKeyFindings,
  updateAdvisoryDetails,
} from "../../redux/features/advisory/advisorySlice";

const { Text } = Typography;
const { TextArea } = Input;

const KeyFindingsPanel = () => {
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFinding, setEditingFinding] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form] = Form.useForm();

  const advisory = useSelector(selectCurrentAdvisoryDetail);
  const keyFindings = useSelector(selectKeyFindings) || [];

  const filteredFindings = useMemo(() => {
    if (!searchTerm) return keyFindings;
    const term = searchTerm.toLowerCase();
    return keyFindings.filter(
      (finding) =>
        finding.finding?.toLowerCase().includes(term) ||
        finding.source?.toLowerCase().includes(term) ||
        finding.relevance?.toLowerCase().includes(term)
    );
  }, [keyFindings, searchTerm]);

  const handleAdd = () => {
    setEditingFinding(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (finding) => {
    setEditingFinding(finding);
    form.setFieldsValue({
      finding: finding.finding,
      source: finding.source || "",
      relevance: finding.relevance || "",
    });
    setModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      let updatedFindings;

      if (editingFinding?._id) {
        updatedFindings = keyFindings.map((finding) =>
          finding._id === editingFinding._id
            ? { ...finding, ...values }
            : finding
        );
      } else {
        const newFinding = {
          _id: `temp_${Date.now()}`,
          ...values,
        };
        updatedFindings = [...keyFindings, newFinding];
      }

      await dispatch(updateAdvisoryDetails({
        matterId: advisory.matterId,
        data: { keyFindings: updatedFindings },
      })).unwrap();

      setModalVisible(false);
      setEditingFinding(null);
      form.resetFields();
      message.success(editingFinding?._id ? "Finding updated" : "Finding added");
    } catch (error) {
      message.error("Failed to save finding");
    }
  };

  const handleDelete = async (findingId) => {
    try {
      const updatedFindings = keyFindings.filter((f) => f._id !== findingId);

      await dispatch(updateAdvisoryDetails({
        matterId: advisory.matterId,
        data: { keyFindings: updatedFindings },
      })).unwrap();

      message.success("Finding deleted");
    } catch (error) {
      message.error("Failed to delete finding");
    }
  };

  return (
    <Card
      title={
        <Space>
          <BulbOutlined style={{ color: "#faad14" }} />
          <span>Key Findings</span>
        </Space>
      }
      extra={
        <Space wrap>
          <Input
            placeholder="Search findings..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 180, marginRight: 8 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Finding
          </Button>
        </Space>
      }
      styles={{ body: { padding: 0 } }}>
      {filteredFindings.length > 0 ? (
        <List
          dataSource={filteredFindings}
          renderItem={(finding, index) => (
            <List.Item
              style={{
                padding: "16px 24px",
                borderBottom: index < filteredFindings.length - 1 ? "1px solid #f0f0f0" : "none",
              }}
              actions={[
                <Button
                  key="edit"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(finding)}
                />,
                <Button
                  key="delete"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(finding._id)}
                />,
              ]}>
              <div style={{ width: "100%" }}>
                <Row gutter={[16, 8]} align="middle">
                  <Col xs={24} sm={24} md={20}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <Tag color="orange" style={{ marginTop: 2, flexShrink: 0 }}>
                        #{index + 1}
                      </Tag>
                      <Text strong style={{ fontSize: 15, lineHeight: 1.4 }}>
                        {finding.finding || "Untitled Finding"}
                      </Text>
                    </div>
                  </Col>
                </Row>

                <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
                  {finding.source && (
                    <Col xs={24} sm={12}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Source
                        </Text>
                        <div style={{ marginTop: 2 }}>
                          <Text style={{ fontSize: 13, color: "#1890ff" }}>
                            {finding.source}
                          </Text>
                        </div>
                      </div>
                    </Col>
                  )}
                  {finding.relevance && (
                    <Col xs={24} sm={finding.source ? 12 : 24}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Relevance
                        </Text>
                        <div style={{ marginTop: 2 }}>
                          <Tag color="purple" style={{ marginTop: 4 }}>{finding.relevance}</Tag>
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>

                {finding.addedAt && (
                  <Text type="secondary" style={{ fontSize: 11, marginTop: 8, display: "block" }}>
                    Added on {dayjs(finding.addedAt).format("DD MMM YYYY")}
                  </Text>
                )}
              </div>
            </List.Item>
          )}
        />
      ) : (
        <Empty
          description={
            searchTerm
              ? "No findings match your search"
              : "No key findings added yet"
          }
          style={{ margin: "40px 0" }}
        />
      )}

      <Modal
        title={
          <Space>
            <BulbOutlined style={{ color: "#faad14" }} />
            <span>{editingFinding?._id ? "Edit Key Finding" : "Add Key Finding"}</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingFinding(null);
          form.resetFields();
        }}
        footer={null}
        width={600}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="finding"
            label="Finding"
            rules={[{ required: true, message: "Please enter finding" }]}>
            <TextArea rows={4} placeholder="Enter the key finding..." />
          </Form.Item>

          <Form.Item name="source" label="Source">
            <Input placeholder="e.g., Section 5.2 of Regulation XYZ" />
          </Form.Item>

          <Form.Item name="relevance" label="Relevance to this Matter">
            <Input placeholder="e.g., Critical for compliance timeline" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingFinding(null);
                  form.resetFields();
                }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingFinding?._id ? "Update" : "Add"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default KeyFindingsPanel;
