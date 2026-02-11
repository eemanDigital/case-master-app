// components/advisory/panels/ResearchQuestionsPanel.jsx
import React, { useState } from "react";
import {
  Card,
  List,
  Button,
  Tag,
  Input,
  Form,
  Space,
  Typography,
  Tooltip,
  Modal,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { updateResearchQuestion } from "../../redux/features/advisory/advisorySlice";

const { Text } = Typography;
const { TextArea } = Input;

const ResearchQuestionsPanel = ({ advisoryId }) => {
  const dispatch = useDispatch();
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form] = Form.useForm();

  // Mock data - replace with actual data fetching
  const researchQuestions = [
    {
      _id: "1",
      question: "What are the legal requirements for...",
      answer: "The requirements include...",
      status: "answered",
    },
    {
      _id: "2",
      question: "What precedent cases exist?",
      answer: "",
      status: "researching",
    },
    {
      _id: "3",
      question: "What are the compliance risks?",
      answer: "",
      status: "pending",
    },
  ];

  const filteredQuestions = researchQuestions.filter(
    (q) =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleStatusUpdate = async (questionId, newStatus) => {
    try {
      await dispatch(
        updateResearchQuestion({
          advisoryId,
          questionId,
          data: { status: newStatus },
        }),
      );
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleSaveAnswer = async (values) => {
    if (!editingQuestion) return;

    try {
      await dispatch(
        updateResearchQuestion({
          advisoryId,
          questionId: editingQuestion._id,
          data: { answer: values.answer },
        }),
      );
      setEditingQuestion(null);
    } catch (error) {
      console.error("Failed to save answer:", error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      answered: "success",
      researching: "processing",
      pending: "default",
    };
    return colors[status] || "default";
  };

  return (
    <Card
      title="Research Questions"
      extra={
        <Space>
          <Input
            placeholder="Search questions..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
          />
          <Button type="primary" icon={<PlusOutlined />}>
            Add Question
          </Button>
        </Space>
      }>
      <List
        dataSource={filteredQuestions}
        renderItem={(question) => (
          <List.Item
            actions={[
              <Button
                key="btn2"
                type="text"
                icon={<EditOutlined />}
                onClick={() => setEditingQuestion(question)}
              />,
              <Button
                key="btn1"
                type="text"
                danger
                icon={<DeleteOutlined />}
              />,
            ]}>
            <List.Item.Meta
              title={
                <Space>
                  <Text strong>{question.question}</Text>
                  <Tag color={getStatusColor(question.status)}>
                    {question.status}
                  </Tag>
                </Space>
              }
              description={
                question.answer ? (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">Answer:</Text>
                    <div style={{ marginTop: 4 }}>{question.answer}</div>
                  </div>
                ) : (
                  <Text type="secondary">No answer yet</Text>
                )
              }
            />
          </List.Item>
        )}
      />

      {/* Edit Modal */}
      <Modal
        title="Edit Research Question"
        open={!!editingQuestion}
        onCancel={() => setEditingQuestion(null)}
        footer={null}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ answer: editingQuestion?.answer }}
          onFinish={handleSaveAnswer}>
          <Form.Item
            name="answer"
            label="Answer"
            rules={[{ required: true, message: "Please provide an answer" }]}>
            <TextArea rows={6} placeholder="Provide detailed answer..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setEditingQuestion(null)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Save Answer
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ResearchQuestionsPanel;
