// components/advisory/panels/KeyFindingsPanel.jsx
import React, { useState } from "react";
import {
  Card,
  List,
  Button,
  Input,
  Form,
  Space,
  Typography,
  Modal,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { updateKeyFinding } from "../../../redux/features/advisory/advisorySlice";

const { Text } = Typography;
const { TextArea } = Input;

const KeyFindingsPanel = ({ advisoryId }) => {
  const dispatch = useDispatch();
  const [editingFinding, setEditingFinding] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form] = Form.useForm();

  // Mock data
  const keyFindings = [
    {
      _id: "1",
      finding: "The regulation applies retroactively",
      source: "Regulation XYZ Section 5.2",
      relevance: "Critical for compliance timeline",
    },
  ];

  const handleSave = async (values) => {
    try {
      if (editingFinding) {
        await dispatch(
          updateKeyFinding({
            advisoryId,
            findingId: editingFinding._id,
            data: values,
          }),
        );
      }
      setEditingFinding(null);
      form.resetFields();
    } catch (error) {
      console.error("Failed to save finding:", error);
    }
  };

  return (
    <Card
      title="Key Findings"
      extra={
        <Space>
          <Input
            placeholder="Search findings..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingFinding({});
              form.resetFields();
            }}>
            Add Finding
          </Button>
        </Space>
      }>
      <List
        dataSource={keyFindings}
        renderItem={(finding) => (
          <List.Item
            actions={[
              <Button
                key="btn1"
                type="text"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingFinding(finding);
                  form.setFieldsValue(finding);
                }}
              />,
              <Button
                key="btn2"
                type="text"
                danger
                icon={<DeleteOutlined />}
              />,
            ]}>
            <List.Item.Meta
              title={<Text strong>{finding.finding}</Text>}
              description={
                <Space direction="vertical" size={0}>
                  {finding.source && (
                    <Text type="secondary">Source: {finding.source}</Text>
                  )}
                  {finding.relevance && (
                    <Text type="secondary">Relevance: {finding.relevance}</Text>
                  )}
                </Space>
              }
            />
          </List.Item>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal
        title={editingFinding?._id ? "Edit Key Finding" : "Add Key Finding"}
        open={!!editingFinding}
        onCancel={() => {
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
            <TextArea rows={3} placeholder="Enter key finding..." />
          </Form.Item>

          <Form.Item name="source" label="Source">
            <Input placeholder="Source reference (optional)" />
          </Form.Item>

          <Form.Item name="relevance" label="Relevance">
            <Input placeholder="Relevance to the matter (optional)" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
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
