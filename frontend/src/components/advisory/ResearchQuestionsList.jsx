import React, { useState, useMemo } from "react";
import {
  Card,
  List,
  Button,
  Tag,
  Input,
  Form,
  Space,
  Typography,
  Modal,
  message,
  Empty,
  Select,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCurrentAdvisoryDetail,
  selectResearchQuestions,
  addResearchQuestion,
  updateResearchQuestion,
  deleteResearchQuestion,
  optimisticallyUpdateResearchQuestion,
} from "../../redux/features/advisory/advisorySlice";

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "researching", label: "Researching" },
  { value: "answered", label: "Answered" },
];

const ResearchQuestionsPanel = ({ advisoryId }) => {
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form] = Form.useForm();

  const advisory = useSelector(selectCurrentAdvisoryDetail);
  const researchQuestions = useSelector(selectResearchQuestions) || [];

  const filteredQuestions = useMemo(() => {
    if (!searchTerm) return researchQuestions;
    const term = searchTerm.toLowerCase();
    return researchQuestions.filter(
      (q) =>
        q.question?.toLowerCase().includes(term) ||
        q.answer?.toLowerCase().includes(term)
    );
  }, [researchQuestions, searchTerm]);

  const handleAdd = () => {
    setEditingQuestion(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    form.setFieldsValue({
      question: question.question,
      answer: question.answer || "",
      status: question.status || "pending",
    });
    setModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      if (editingQuestion) {
        // Optimistic update for immediate UI feedback
        dispatch(
          optimisticallyUpdateResearchQuestion({
            questionId: editingQuestion._id,
            updates: {
              question: values.question,
              answer: values.answer,
              status: values.status,
            },
          })
        );
        
        // Then call API
        await dispatch(
          updateResearchQuestion({
            matterId: advisory.matterId,
            questionId: editingQuestion._id,
            data: {
              question: values.question,
              answer: values.answer,
              status: values.status,
            },
          })
        ).unwrap();
        message.success("Question updated successfully");
      } else {
        await dispatch(
          addResearchQuestion({
            matterId: advisory.matterId,
            data: {
              question: values.question,
              status: values.status || "pending",
            },
          })
        ).unwrap();
        message.success("Question added successfully");
      }
      setModalVisible(false);
      setEditingQuestion(null);
      form.resetFields();
    } catch (error) {
      message.error(editingQuestion ? "Failed to update question" : "Failed to add question");
    }
  };

  const handleDelete = async (questionId) => {
    try {
      await dispatch(
        deleteResearchQuestion({
          matterId: advisory.matterId,
          questionId,
        })
      ).unwrap();
      message.success("Question deleted successfully");
    } catch (error) {
      message.error("Failed to delete question");
    }
  };

  const handleStatusUpdate = async (questionId, newStatus) => {
    try {
      // Optimistic update
      dispatch(
        optimisticallyUpdateResearchQuestion({
          questionId,
          updates: { status: newStatus },
        })
      );
      
      // Then call API
      await dispatch(
        updateResearchQuestion({
          matterId: advisory.matterId,
          questionId,
          data: { status: newStatus },
        })
      ).unwrap();
    } catch (error) {
      message.error("Failed to update status");
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

  const stats = useMemo(() => ({
    total: researchQuestions.length,
    answered: researchQuestions.filter((q) => q.status === "answered").length,
    researching: researchQuestions.filter((q) => q.status === "researching").length,
    pending: researchQuestions.filter((q) => q.status === "pending").length,
  }), [researchQuestions]);

  return (
    <Card
      title={
        <Space>
          <QuestionCircleOutlined />
          <span>Research Questions</span>
        </Space>
      }
      extra={
        <Space>
          <Input
            placeholder="Search questions..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Question
          </Button>
        </Space>
      }>
      <div style={{ marginBottom: 16, display: "flex", gap: 16 }}>
        <Tag color="blue">Total: {stats.total}</Tag>
        <Tag color="green">
          <CheckCircleOutlined /> Answered: {stats.answered}
        </Tag>
        <Tag color="processing">Researching: {stats.researching}</Tag>
        <Tag>Pending: {stats.pending}</Tag>
      </div>

      {filteredQuestions.length > 0 ? (
        <List
          dataSource={filteredQuestions}
          renderItem={(question) => (
            <List.Item
              actions={[
                <Select
                  key="status"
                  value={question.status}
                  onChange={(value) => handleStatusUpdate(question._id, value)}
                  style={{ width: 120 }}
                  size="small">
                  {STATUS_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>,
                <Button
                  key="edit"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(question)}
                />,
                <Button
                  key="delete"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(question._id)}
                />,
              ]}>
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background:
                        question.status === "answered"
                          ? "#f6ffed"
                          : question.status === "researching"
                            ? "#e6f7ff"
                            : "#f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                    <QuestionCircleOutlined
                      style={{
                        color:
                          question.status === "answered"
                            ? "#52c41a"
                            : question.status === "researching"
                              ? "#1890ff"
                              : "#999",
                      }}
                    />
                  </div>
                }
                title={
                  <Space>
                    <Text strong>{question.question || "Untitled Question"}</Text>
                    <Tag color={getStatusColor(question.status)}>
                      {question.status}
                    </Tag>
                  </Space>
                }
                description={
                  <div style={{ marginTop: 8 }}>
                    {question.answer ? (
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Answer:
                        </Text>
                        <div style={{ marginTop: 4 }}>{question.answer}</div>
                      </div>
                    ) : (
                      <Text type="secondary" italic>
                        No answer yet - Click edit to add answer
                      </Text>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty
          description={
            searchTerm
              ? "No questions match your search"
              : "No research questions added yet"
          }
          style={{ margin: "40px 0" }}
        />
      )}

      <Modal
        title={editingQuestion ? "Edit Research Question" : "Add Research Question"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingQuestion(null);
          form.resetFields();
        }}
        footer={null}
        width={600}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}>
          <Form.Item
            name="question"
            label="Question"
            rules={[{ required: true, message: "Please enter your question" }]}>
            <TextArea
              rows={3}
              placeholder="What legal question needs to be researched?"
            />
          </Form.Item>

          <Form.Item
            name="answer"
            label="Answer"
            rules={[{ required: editingQuestion, message: "Please provide an answer" }]}>
            <TextArea
              rows={6}
              placeholder="Provide detailed answer to the research question..."
              disabled={!editingQuestion}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            initialValue="pending">
            <Select>
              {STATUS_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingQuestion(null);
                  form.resetFields();
                }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingQuestion ? "Update" : "Add"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ResearchQuestionsPanel;
