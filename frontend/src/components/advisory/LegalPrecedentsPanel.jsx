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
  BookOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCurrentAdvisoryDetail,
  updateAdvisoryDetails,
} from "../../redux/features/advisory/advisorySlice";

const { Text } = Typography;
const { TextArea } = Input;

const LegalPrecedentsPanel = () => {
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPrecedent, setEditingPrecedent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form] = Form.useForm();

  const advisory = useSelector(selectCurrentAdvisoryDetail);
  const legalPrecedents = advisory?.legalPrecedents || [];

  const filteredPrecedents = useMemo(() => {
    if (!searchTerm) return legalPrecedents;
    const term = searchTerm.toLowerCase();
    return legalPrecedents.filter(
      (p) =>
        p.caseName?.toLowerCase().includes(term) ||
        p.citation?.toLowerCase().includes(term) ||
        p.summary?.toLowerCase().includes(term)
    );
  }, [legalPrecedents, searchTerm]);

  const handleAdd = () => {
    setEditingPrecedent(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (precedent) => {
    setEditingPrecedent(precedent);
    form.setFieldsValue({
      caseName: precedent.caseName,
      citation: precedent.citation || "",
      summary: precedent.summary || "",
      relevance: precedent.relevance || "",
    });
    setModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      let updatedPrecedents;

      if (editingPrecedent?._id) {
        updatedPrecedents = legalPrecedents.map((p) =>
          p._id === editingPrecedent._id ? { ...p, ...values } : p
        );
      } else {
        const newPrecedent = {
          _id: `temp_${Date.now()}`,
          ...values,
        };
        updatedPrecedents = [...legalPrecedents, newPrecedent];
      }

      await dispatch(updateAdvisoryDetails({
        matterId: advisory.matterId,
        data: { legalPrecedents: updatedPrecedents },
      })).unwrap();

      setModalVisible(false);
      setEditingPrecedent(null);
      form.resetFields();
      message.success(editingPrecedent?._id ? "Precedent updated" : "Precedent added");
    } catch (error) {
      message.error("Failed to save precedent");
    }
  };

  const handleDelete = async (precedentId) => {
    try {
      const updatedPrecedents = legalPrecedents.filter((p) => p._id !== precedentId);

      await dispatch(updateAdvisoryDetails({
        matterId: advisory.matterId,
        data: { legalPrecedents: updatedPrecedents },
      })).unwrap();

      message.success("Precedent deleted");
    } catch (error) {
      message.error("Failed to delete precedent");
    }
  };

  return (
    <Card
      title={
        <Space>
          <BookOutlined style={{ color: "#1890ff" }} />
          <span>Legal Precedents</span>
        </Space>
      }
      extra={
        <Space wrap>
          <Input
            placeholder="Search precedents..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 180, marginRight: 8 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Precedent
          </Button>
        </Space>
      }
      styles={{ body: { padding: 0 } }}>
      {filteredPrecedents.length > 0 ? (
        <List
          dataSource={filteredPrecedents}
          renderItem={(precedent, index) => (
            <List.Item
              style={{
                padding: "16px 24px",
                borderBottom: index < filteredPrecedents.length - 1 ? "1px solid #f0f0f0" : "none",
              }}
              actions={[
                <Button
                  key="edit"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(precedent)}
                />,
                <Button
                  key="delete"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(precedent._id)}
                />,
              ]}>
              <div style={{ width: "100%" }}>
                <Row gutter={[16, 8]} align="top">
                  <Col xs={22} sm={23}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <Tag color="blue" style={{ marginTop: 2, flexShrink: 0, fontSize: 11 }}>
                        #{index + 1}
                      </Tag>
                      <Text strong style={{ fontSize: 16, lineHeight: 1.4, color: "#1f1f1f" }}>
                        {precedent.caseName || "Untitled Precedent"}
                      </Text>
                    </div>
                  </Col>
                </Row>

                <Row gutter={[24, 8]} style={{ marginTop: 10 }}>
                  {precedent.citation && (
                    <Col xs={24} sm={12}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Citation
                        </Text>
                        <div style={{ marginTop: 2 }}>
                          <Text style={{ fontSize: 13, color: "#1890ff" }}>
                            {precedent.citation}
                          </Text>
                        </div>
                      </div>
                    </Col>
                  )}
                  {precedent.relevance && (
                    <Col xs={24} sm={precedent.citation ? 12 : 24}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Relevance
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color="cyan">{precedent.relevance}</Tag>
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>

                {precedent.summary && (
                  <Row style={{ marginTop: 12 }}>
                    <Col span={24}>
                      <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Summary
                      </Text>
                      <div style={{ marginTop: 4 }}>
                        <Text style={{ fontSize: 14, color: "#262626", lineHeight: 1.6 }}>
                          {precedent.summary.length > 300
                            ? `${precedent.summary.substring(0, 300)}...`
                            : precedent.summary}
                        </Text>
                      </div>
                    </Col>
                  </Row>
                )}
              </div>
            </List.Item>
          )}
        />
      ) : (
        <Empty
          description={
            searchTerm
              ? "No precedents match your search"
              : "No legal precedents added yet"
          }
          style={{ margin: "40px 0" }}
        />
      )}

      <Modal
        title={
          <Space>
            <BookOutlined style={{ color: "#1890ff" }} />
            <span>{editingPrecedent?._id ? "Edit Legal Precedent" : "Add Legal Precedent"}</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingPrecedent(null);
          form.resetFields();
        }}
        footer={null}
        width={600}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="caseName"
            label="Case Name"
            rules={[{ required: true, message: "Please enter case name" }]}>
            <Input placeholder="e.g., Donoghue v Stevenson [1932] AC 562" />
          </Form.Item>

          <Form.Item name="citation" label="Citation">
            <Input placeholder="Full citation reference (e.g., [1932] AC 562)" />
          </Form.Item>

          <Form.Item name="summary" label="Summary">
            <TextArea rows={4} placeholder="Brief summary of the precedent and its relevance..." />
          </Form.Item>

          <Form.Item name="relevance" label="Relevance to this Matter">
            <Input placeholder="e.g., Establishes duty of care principle" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingPrecedent(null);
                  form.resetFields();
                }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingPrecedent?._id ? "Update" : "Add"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default LegalPrecedentsPanel;
