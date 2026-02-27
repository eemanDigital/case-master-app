import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Modal,
  Form,
  Input,
  Rate,
  Button,
  Card,
  Space,
  Tag,
  Typography,
  Divider,
  List,
  Avatar,
  Badge,
  Row,
  Col,
  Spin,
  Alert,
  Select,
} from "antd";
const { Option } = Select;

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  DownloadOutlined,
  StarOutlined,
  EyeOutlined,
  EditOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
} from "@ant-design/icons";

import {
  fetchTaskHistory,
  reviewTaskComplete,
  selectTaskHistory,
} from "../redux/features/task/taskSlice";

import { formatDate } from "../utils/formatDate";
import { toast } from "react-toastify";

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const TaskReviewModal = ({
  task,
  open,
  onClose,
  onReviewComplete,
  currentUserId,
}) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const taskHistory = useSelector(selectTaskHistory);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document preview state
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Edit response state
  const [editingResponse, setEditingResponse] = useState(null);
  const [editForm] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);

  const userIdStr = String(currentUserId || "");

  // Check if current user is an assignee
  const isAssignee = task?.assignees?.some(
    (assignee) =>
      (assignee.user?._id && String(assignee.user._id) === userIdStr) ||
      String(assignee.user) === userIdStr,
  );

  // Check if user can edit a specific response
  const canEditResponse = (response) => {
    if (!isAssignee || !response) return false;
    const responseUserId = response.submittedBy?._id || response.submittedBy;
    return (
      String(responseUserId) === userIdStr && task?.status !== "under-review"
    );
  };

  // Handle edit response
  const handleEditResponse = (response) => {
    setEditingResponse(response);
    editForm.setFieldsValue({
      comment: response.comment,
      status: response.status,
      completionPercentage: response.completionPercentage,
      timeSpent: response.timeSpent,
    });
    setIsEditing(true);
  };

  // Handle save edited response
  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      setIsSubmitting(true);

      const baseURL =
        import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";
      const response = await fetch(
        `${baseURL}/tasks/${task._id}/responses/${editingResponse._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(values),
        },
      );

      const data = await response.json();

      if (data.status === "success") {
        toast.success("Response updated successfully");
        setIsEditing(false);
        setEditingResponse(null);
        onReviewComplete && onReviewComplete();
      } else {
        throw new Error(data.message || "Failed to update response");
      }
    } catch (error) {
      console.error("Error updating response:", error);
      toast.error(error.message || "Failed to update response");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingResponse(null);
    editForm.resetFields();
  };

  // Get file icon based on type
  const getFileIcon = (file) => {
    const extension = file?.fileType?.toLowerCase();
    const mimeType = file?.mimeType?.toLowerCase();
    const iconStyle = { fontSize: 20 };

    if (extension === "pdf" || mimeType?.includes("pdf")) {
      return <FilePdfOutlined style={{ ...iconStyle, color: "#ff4d4f" }} />;
    }
    if (
      extension === "doc" ||
      extension === "docx" ||
      mimeType?.includes("word")
    ) {
      return <FileWordOutlined style={{ ...iconStyle, color: "#1890ff" }} />;
    }
    if (
      extension === "xls" ||
      extension === "xlsx" ||
      mimeType?.includes("excel")
    ) {
      return <FileExcelOutlined style={{ ...iconStyle, color: "#52c41a" }} />;
    }
    if (
      ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(extension) ||
      mimeType?.includes("image")
    ) {
      return <FileImageOutlined style={{ ...iconStyle, color: "#faad14" }} />;
    }
    return <FileOutlined style={{ ...iconStyle, color: "#13c2c2" }} />;
  };

  // Fetch preview URL for office documents
  useEffect(() => {
    const fetchPreviewUrl = async () => {
      if (!previewFile || !previewModalVisible) {
        setPreviewUrl(null);
        return;
      }

      const isOfficeDoc =
        ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(
          previewFile.fileType?.toLowerCase(),
        ) ||
        previewFile.mimeType?.includes("word") ||
        previewFile.mimeType?.includes("excel") ||
        previewFile.mimeType?.includes("powerpoint");

      if (!isOfficeDoc) {
        setPreviewUrl(null);
        return;
      }

      setPreviewLoading(true);
      try {
        const baseURL =
          import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";
        const response = await fetch(
          `${baseURL}/files/${previewFile._id}/preview`,
          { credentials: "include" },
        );
        const data = await response.json();
        if (data.status === "success" && data.data.previewUrl) {
          setPreviewUrl(data.data.previewUrl);
        }
      } catch (error) {
        console.error("Error fetching preview URL:", error);
      } finally {
        setPreviewLoading(false);
      }
    };

    fetchPreviewUrl();
  }, [previewFile, previewModalVisible]);

  // Download file
  const handleDownload = async (file) => {
    try {
      const baseURL =
        import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";
      const response = await fetch(`${baseURL}/files/${file._id}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.status === "success" && data.data.downloadUrl) {
        const link = document.createElement("a");
        link.href = data.data.downloadUrl;
        link.download = file.fileName || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(file.fileUrl, "_blank");
      }
    } catch (error) {
      console.error("Download error:", error);
      window.open(file.fileUrl, "_blank");
    }
  };

  // Open document preview
  const openPreview = (file) => {
    setPreviewFile(file);
    setPreviewModalVisible(true);
  };

  // Fetch task history when modal opens
  useEffect(() => {
    if (!open || !task?._id) return;

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        await dispatch(fetchTaskHistory(task._id)).unwrap();
      } catch (err) {
        console.warn("Failed to load task history:", err);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [dispatch, open, task?._id]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleReviewSubmit = useCallback(
    async (values) => {
      if (!task?._id) return;
      setIsSubmitting(true);
      try {
        await dispatch(
          reviewTaskComplete({
            taskId: task._id,
            data: {
              approve: values.approve,
              reviewComment: values.reviewComment,
              rating: values.rating,
              sendNotification: values.sendNotification !== false,
            },
          }),
        ).unwrap();

        form.resetFields();
        onReviewComplete && onReviewComplete();
        onClose();
      } catch (error) {
        console.error("Review submission failed:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, task, onClose, onReviewComplete, form],
  );

  const isCreator = task?.createdBy?._id
    ? String(task.createdBy._id) === userIdStr
    : String(task?.createdBy) === userIdStr;

  const isAssignedBy = task?.assignees?.some((assignee) => {
    const assignedById = assignee.assignedBy?._id
      ? String(assignee.assignedBy._id)
      : String(assignee.assignedBy);
    return assignedById === userIdStr;
  });

  const canReview = isCreator || isAssignedBy;

  if (!task) return null;

  const taskResponses = task.taskResponses || [];

  // ─── Render helpers ──────────────────────────────────────────────────────────

  const renderDocumentList = (documents) => (
    <List
      size="small"
      dataSource={documents}
      renderItem={(doc, docIndex) => (
        <List.Item
          key={doc._id || docIndex}
          className="border rounded px-3 py-2 mb-2 hover:bg-gray-50"
          actions={[
            <Button
              key="preview"
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openPreview(doc)}
              title="Preview"
            />,
            <Button
              key="download"
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(doc)}
              title="Download"
            />,
          ]}>
          <Space>
            {getFileIcon(doc)}
            <div>
              <Text className="block">{doc.fileName}</Text>
              <Text type="secondary" className="text-xs">
                {doc.fileSizeMB ? `${doc.fileSizeMB} MB` : ""} {doc.fileType}
              </Text>
            </div>
          </Space>
        </List.Item>
      )}
    />
  );

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined className="text-green-500" />
          <Title level={4} className="!mb-0">
            Review Task Submission
          </Title>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={900}
      footer={null}
      destroyOnClose
      closable={!isSubmitting}>
      <Divider className="!my-4" />

      {/* Permission warning */}
      {!canReview && (
        <Alert
          type="warning"
          showIcon
          message="You don't have permission to review this task"
          description="Only the task creator or the person who assigned it can approve or reject."
          className="mb-4"
        />
      )}

      {/* ── Task Overview ───────────────────────────────────────────────────── */}
      <Card size="small" className="mb-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="flex-1">
            <Title level={5} className="!mt-0">
              {task.title}
            </Title>
            <Text type="secondary">{task.description}</Text>
          </div>
          <Tag color="orange" className="shrink-0">
            Under Review
          </Tag>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Text strong className="block text-xs text-gray-500">
              Due Date
            </Text>
            <Text>{formatDate(task.dueDate)}</Text>
          </div>
          <div>
            <Text strong className="block text-xs text-gray-500">
              Assignee
            </Text>
            <Text>
              {task.assignees?.[0]?.user?.firstName
                ? `${task.assignees[0].user.firstName} ${task.assignees[0].user.lastName}`
                : "N/A"}
            </Text>
          </div>
          <div>
            <Text strong className="block text-xs text-gray-500">
              Priority
            </Text>
            <Tag
              color={
                task.taskPriority === "high" || task.taskPriority === "urgent"
                  ? "red"
                  : task.taskPriority === "medium"
                    ? "orange"
                    : "green"
              }>
              {task.taskPriority || "medium"}
            </Tag>
          </div>
          <div>
            <Text strong className="block text-xs text-gray-500">
              Category
            </Text>
            <Text className="capitalize">
              {task.category?.replace(/-/g, " ") || "N/A"}
            </Text>
          </div>
        </div>

        {task.matter && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Text strong className="block text-xs text-gray-500 mb-1">
              Related Matter
            </Text>
            <Space>
              <FileTextOutlined />
              <Text>{task.matter.title || task.matter.matterNumber}</Text>
              <Tag>{task.matterType}</Tag>
            </Space>
          </div>
        )}

        {/* Reference Documents */}
        {task.referenceDocuments?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Text strong className="block text-xs text-gray-500 mb-2">
              Reference Documents
            </Text>
            {renderDocumentList(task.referenceDocuments)}
          </div>
        )}
      </Card>

      {/* ── Task Responses ──────────────────────────────────────────────────── */}
      {taskResponses.length > 0 && (
        <Card
          size="small"
          title={
            <Space>
              <FileTextOutlined />
              <Text strong>Submitted Responses</Text>
              <Badge count={taskResponses.length} />
            </Space>
          }
          className="mb-4">
          <List
            dataSource={taskResponses}
            renderItem={(response, index) => (
              <List.Item
                key={response._id || index}
                extra={
                  canEditResponse(response) && !isEditing ? (
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEditResponse(response)}
                      title="Edit Response"
                    />
                  ) : null
                }>
                <Card className="w-full" size="small">
                  {/* Edit Form */}
                  {isEditing && editingResponse?._id === response._id ? (
                    <Form form={editForm} layout="vertical">
                      <Form.Item name="comment" label="Comment">
                        <TextArea rows={3} />
                      </Form.Item>
                      <Row gutter={16}>
                        <Col span={8}>
                          <Form.Item
                            name="completionPercentage"
                            label="Completion %">
                            <Input type="number" min={0} max={100} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="timeSpent" label="Time Spent (min)">
                            <Input type="number" min={0} />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="status" label="Status">
                            <Select>
                              <Option value="pending">Pending</Option>
                              <Option value="in-progress">In Progress</Option>
                              <Option value="completed">Completed</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                      <Space>
                        <Button
                          type="primary"
                          onClick={handleSaveEdit}
                          loading={isSubmitting}>
                          Save Changes
                        </Button>
                        <Button onClick={handleCancelEdit}>Cancel</Button>
                      </Space>
                    </Form>
                  ) : (
                    /* View Mode */
                    <div className="flex items-start gap-3">
                      <Avatar icon={<UserOutlined />} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <Text strong>
                            {response.submittedBy?.firstName
                              ? `${response.submittedBy.firstName} ${response.submittedBy.lastName}`
                              : "Anonymous"}
                          </Text>
                          <Text type="secondary" className="text-xs">
                            {formatDate(response.submittedAt)}
                          </Text>
                        </div>

                        <Paragraph className="mb-2">
                          {response.comment}
                        </Paragraph>

                        <div className="flex flex-wrap gap-4 mb-3">
                          <div>
                            <Text
                              strong
                              className="block text-xs text-gray-500">
                              Completion
                            </Text>
                            <Text>{response.completionPercentage}%</Text>
                          </div>
                          <div>
                            <Text
                              strong
                              className="block text-xs text-gray-500">
                              Time Spent
                            </Text>
                            <Text>{response.timeSpent || 0} minutes</Text>
                          </div>
                          <div>
                            <Text
                              strong
                              className="block text-xs text-gray-500">
                              Status
                            </Text>
                            <Tag
                              color={
                                response.status === "completed"
                                  ? "green"
                                  : "blue"
                              }>
                              {response.status}
                            </Tag>
                          </div>
                        </div>

                        {response.documents?.length > 0 && (
                          <div className="mt-3">
                            <Text
                              strong
                              className="block text-xs text-gray-500 mb-2">
                              Attached Documents ({response.documents.length})
                            </Text>
                            {renderDocumentList(response.documents)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* ── Review Form (approve / reject) ─────────────────────────────────── */}
      {canReview && (
        <Card
          size="small"
          title={
            <Space>
              <StarOutlined />
              <Text strong>Submit Review</Text>
            </Space>
          }
          className="mb-4">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleReviewSubmit}
            initialValues={{ approve: true, sendNotification: true }}>
            {/* Approve / Reject */}
            <Form.Item
              name="approve"
              label="Decision"
              rules={[{ required: true, message: "Please select a decision" }]}>
              <Select placeholder="Select decision">
                <Option value={true}>
                  <Space>
                    <CheckCircleOutlined style={{ color: "#52c41a" }} />
                    Approve
                  </Space>
                </Option>
                <Option value={false}>
                  <Space>
                    <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                    Reject
                  </Space>
                </Option>
              </Select>
            </Form.Item>

            {/* Rating */}
            <Form.Item name="rating" label="Rating (optional)">
              <Rate allowHalf />
            </Form.Item>

            {/* Comment */}
            <Form.Item name="reviewComment" label="Review Comment (optional)">
              <TextArea
                rows={3}
                placeholder="Add any feedback or notes for the assignee…"
              />
            </Form.Item>

            {/* Notification toggle */}
            <Form.Item name="sendNotification" valuePropName="checked">
              <Select defaultValue={true}>
                <Option value={true}>Notify assignee</Option>
                <Option value={false}>Do not notify assignee</Option>
              </Select>
            </Form.Item>

            <Form.Item className="!mb-0">
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting}>
                  Submit Review
                </Button>
                <Button onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* ── Document Preview Modal ──────────────────────────────────────────── */}
      <Modal
        title={
          <Space>
            {previewFile && getFileIcon(previewFile)}
            <span>{previewFile?.fileName}</span>
          </Space>
        }
        open={previewModalVisible}
        onCancel={() => {
          setPreviewModalVisible(false);
          setPreviewFile(null);
          setPreviewUrl(null);
        }}
        width={900}
        footer={[
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => previewFile && handleDownload(previewFile)}>
            Download
          </Button>,
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            Close
          </Button>,
        ]}
        style={{ top: 20 }}>
        <div style={{ height: "60vh" }}>
          {previewLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spin tip="Loading preview..." />
            </div>
          ) : (
            <>
              {/* Image */}
              {previewFile?.mimeType?.startsWith("image/") && (
                <div className="text-center">
                  <img
                    src={previewFile.fileUrl}
                    alt={previewFile.fileName}
                    className="max-w-full max-h-[60vh] mx-auto rounded"
                  />
                </div>
              )}

              {/* PDF */}
              {(previewFile?.fileType === "pdf" ||
                previewFile?.mimeType?.includes("pdf")) && (
                <iframe
                  src={`${previewFile.fileUrl}#view=fitH`}
                  title={previewFile.fileName}
                  className="w-full h-full border rounded"
                  frameBorder="0"
                />
              )}

              {/* Office documents */}
              {(["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(
                previewFile?.fileType?.toLowerCase(),
              ) ||
                previewFile?.mimeType?.includes("word") ||
                previewFile?.mimeType?.includes("excel") ||
                previewFile?.mimeType?.includes("powerpoint")) &&
                (previewUrl ? (
                  <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`}
                    title={previewFile.fileName}
                    className="w-full h-full border rounded"
                    frameBorder="0"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded">
                    <FileTextOutlined
                      style={{ fontSize: 64, color: "#8c8c8c" }}
                    />
                    <Text className="mt-4">Preview not available</Text>
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownload(previewFile)}
                      className="mt-2">
                      Download to view
                    </Button>
                  </div>
                ))}

              {/* Unsupported types */}
              {!previewFile?.mimeType?.startsWith("image/") &&
                !previewFile?.fileType?.toLowerCase().includes("pdf") &&
                !["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(
                  previewFile?.fileType?.toLowerCase(),
                ) && (
                  <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded">
                    {getFileIcon(previewFile || {})}
                    <Text className="mt-4">
                      Preview not available for this file type
                    </Text>
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownload(previewFile)}
                      className="mt-2">
                      Download to view
                    </Button>
                  </div>
                )}
            </>
          )}
        </div>
      </Modal>
    </Modal>
  );
};

export default TaskReviewModal;
