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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  selectCurrentAdvisoryDetail,
  updateAdvisoryDetails,
} from "../../redux/features/advisory/advisorySlice";

const { Text } = Typography;
const { TextArea } = Input;

const LegalPrecedentsPanel = () => {
  const dispatch = useDispatch();
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
      title="Legal Precedents"
      extra={
        <Space>
          <Input
            placeholder="Search precedents..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingPrecedent({});
              form.resetFields();
              Modal.confirm({
                title: "Add Legal Precedent",
                content: (
                  <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item
                      name="caseName"
                      label="Case Name"
                      rules={[{ required: true, message: "Please enter case name" }]}
                    >
                      <Input placeholder="e.g., Donoghue v Stevenson [1932] AC 562" />
                    </Form.Item>

                    <Form.Item name="citation" label="Citation">
                      <Input placeholder="Full citation reference" />
                    </Form.Item>

                    <Form.Item name="summary" label="Summary">
                      <TextArea rows={3} placeholder="Brief summary of the precedent" />
                    </Form.Item>

                    <Form.Item name="relevance" label="Relevance">
                      <Input placeholder="Relevance to this matter" />
                    </Form.Item>
                  </Form>
                ),
                onOk: () => {
                  form.validateFields().then(handleSave);
                },
                onCancel: () => {
                  form.resetFields();
                },
              });
            }}>
            Add Precedent
          </Button>
        </Space>
      }>
      {filteredPrecedents.length > 0 ? (
        <List
          dataSource={filteredPrecedents}
          renderItem={(precedent) => (
            <List.Item
              actions={[
                <Button
                  key="btn1"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingPrecedent(precedent);
                    form.setFieldsValue(precedent);
                    Modal.confirm({
                      title: "Edit Legal Precedent",
                      content: (
                        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                          <Form.Item
                            name="caseName"
                            label="Case Name"
                            rules={[{ required: true, message: "Please enter case name" }]}
                          >
                            <Input placeholder="e.g., Donoghue v Stevenson [1932] AC 562" />
                          </Form.Item>

                          <Form.Item name="citation" label="Citation">
                            <Input placeholder="Full citation reference" />
                          </Form.Item>

                          <Form.Item name="summary" label="Summary">
                            <TextArea rows={3} placeholder="Brief summary of the precedent" />
                          </Form.Item>

                          <Form.Item name="relevance" label="Relevance">
                            <Input placeholder="Relevance to this matter" />
                          </Form.Item>
                        </Form>
                      ),
                      onOk: () => {
                        form.validateFields().then(handleSave);
                      },
                      onCancel: () => {
                        form.resetFields();
                      },
                    });
                  }}
                />,
                <Button
                  key="btn2"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(precedent._id)}
                />,
              ]}>
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "#f0f5ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                    <BookOutlined style={{ color: "#1890ff" }} />
                  </div>
                }
                title={<Text strong>{precedent.caseName || "Untitled Precedent"}</Text>}
                description={
                  <Space direction="vertical" size={0}>
                    {precedent.citation && (
                      <Text type="secondary">
                        <Tag style={{ marginRight: 4 }}>Citation</Tag>
                        {precedent.citation}
                      </Text>
                    )}
                    {precedent.summary && (
                      <Text type="secondary" ellipsis={{ rows: 2 }}>
                        {precedent.summary}
                      </Text>
                    )}
                    {precedent.relevance && (
                      <Text type="secondary">
                        <Tag style={{ marginRight: 4 }}>Relevance</Tag>
                        {precedent.relevance}
                      </Text>
                    )}
                  </Space>
                }
              />
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
        />
      )}

      <Modal
        title={editingPrecedent?._id ? "Edit Legal Precedent" : "Add Legal Precedent"}
        open={!!editingPrecedent}
        onCancel={() => {
          setEditingPrecedent(null);
          form.resetFields();
        }}
        footer={null}
        width={600}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="caseName"
            label="Case Name"
            rules={[{ required: true, message: "Please enter case name" }]}
            initialValue={editingPrecedent?.caseName}>
            <Input placeholder="e.g., Donoghue v Stevenson [1932] AC 562" />
          </Form.Item>

          <Form.Item name="citation" label="Citation" initialValue={editingPrecedent?.citation}>
            <Input placeholder="Full citation reference" />
          </Form.Item>

          <Form.Item name="summary" label="Summary" initialValue={editingPrecedent?.summary}>
            <TextArea rows={3} placeholder="Brief summary of the precedent" />
          </Form.Item>

          <Form.Item name="relevance" label="Relevance" initialValue={editingPrecedent?.relevance}>
            <Input placeholder="Relevance to this matter" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
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
