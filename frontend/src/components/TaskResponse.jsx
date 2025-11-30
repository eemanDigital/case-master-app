import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import {
  FileOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  // ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Popconfirm,
  Tooltip,
  List,
  Tag,
  Space,
  Empty,
  Avatar,
  Progress,
  Dropdown,
  Modal,
  Typography,
  Divider,
  Badge,
} from "antd";
import { formatDate } from "../utils/formatDate";
import { useDispatch, useSelector } from "react-redux";
import { deleteData } from "../redux/features/delete/deleteSlice";
import { toast } from "react-toastify";
import { handleGeneralDownload } from "../utils/generalFileDownloadHandler";

const { Text, Paragraph } = Typography;

const TaskResponse = ({
  task,
  isAssignedToCurrentClientUser,
  isAssignedToCurrentUser,
  onResponseUpdate,
}) => {
  const baseURL = import.meta.env.VITE_BASE_URL;
  const { isError, isSuccess, message, loading } = useSelector(
    (state) => state.delete
  );
  const dispatch = useDispatch();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);

  // Handle toast notifications
  useEffect(() => {
    if (isSuccess) {
      toast.success("Response deleted successfully");
      if (onResponseUpdate) {
        onResponseUpdate();
      }
    }
    if (isError) {
      toast.error(message || "Failed to delete response");
    }
  }, [isSuccess, isError, message, onResponseUpdate]);

  // Remove/delete response
  const removeResponse = async (taskId, responseId) => {
    try {
      await dispatch(deleteData(`tasks/${taskId}/response/${responseId}`));
    } catch (error) {
      console.error("Error deleting response:", error);
      toast.error("Failed to delete response");
    }
  };

  // Handle file download
  const handleDownload = (response, event) => {
    event?.stopPropagation();
    handleGeneralDownload(
      event,
      response?.doc ||
        `${baseURL}/tasks/${task._id}/response/${response._id}/download`,
      "response"
    );
  };

  // Open response preview
  const openPreview = (response) => {
    setSelectedResponse(response);
    setPreviewVisible(true);
  };

  // Get status config
  const getStatusConfig = (completed) => {
    return completed
      ? { color: "success", icon: <CheckCircleOutlined />, text: "Completed" }
      : {
          color: "error",
          icon: <CloseCircleOutlined />,
          text: "Not Completed",
        };
  };

  // Get progress percentage based on completion status
  const getProgressPercent = (completed) => (completed ? 100 : 0);

  // Response card for mobile view
  const ResponseCard = ({ response }) => {
    const statusConfig = getStatusConfig(response.completed);

    return (
      <Card
        className="response-card hover:shadow-md transition-all duration-200 mb-4"
        size="small">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <Space>
            <Avatar
              size="small"
              icon={<UserOutlined />}
              className="bg-blue-100 text-blue-600"
            />
            <div>
              <Text strong className="text-sm block">
                {response.respondedBy?.firstName || "Unknown"}{" "}
                {response.respondedBy?.lastName || "User"}
              </Text>
              <Text type="secondary" className="text-xs">
                {formatDate(response.timestamp)}
              </Text>
            </div>
          </Space>
          <Tag
            color={statusConfig.color}
            icon={statusConfig.icon}
            className="m-0">
            {statusConfig.text}
          </Tag>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <Text type="secondary">Progress</Text>
            <Text strong>{getProgressPercent(response.completed)}%</Text>
          </div>
          <Progress
            percent={getProgressPercent(response.completed)}
            size="small"
            status={response.completed ? "success" : "active"}
            showInfo={false}
          />
        </div>

        {/* Comment */}
        {response.comment && (
          <div className="mb-3">
            <div className="flex items-center gap-1 mb-1">
              <MessageOutlined className="text-gray-400 text-xs" />
              <Text strong className="text-xs">
                Comment
              </Text>
            </div>
            <Paragraph
              ellipsis={{ rows: 2, expandable: true, symbol: "more" }}
              className="text-sm text-gray-600 mb-0">
              {response.comment}
            </Paragraph>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <Space size="small">
            <Tooltip title="View Details">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => openPreview(response)}
              />
            </Tooltip>

            {response.doc && (
              <Tooltip title="Download Document">
                <Button
                  type="text"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={(e) => handleDownload(response, e)}
                />
              </Tooltip>
            )}
          </Space>

          {(isAssignedToCurrentUser || isAssignedToCurrentClientUser) && (
            <Popconfirm
              title="Delete Response"
              description="Are you sure you want to delete this response? This action cannot be undone."
              onConfirm={() => removeResponse(task?._id, response?._id)}
              okText="Delete"
              cancelText="Cancel"
              okType="danger"
              disabled={loading}>
              <Tooltip title="Delete Response">
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={loading}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </div>
      </Card>
    );
  };

  // List item for desktop view
  const ResponseListItem = ({ response }) => {
    const statusConfig = getStatusConfig(response.completed);

    return (
      <List.Item
        className="response-list-item hover:bg-gray-50 transition-colors duration-200 px-4 py-3"
        actions={[
          <Tooltip title="View Details" key="view">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => openPreview(response)}
            />
          </Tooltip>,

          response.doc && (
            <Tooltip title="Download Document" key="download">
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={(e) => handleDownload(response, e)}
              />
            </Tooltip>
          ),

          (isAssignedToCurrentUser || isAssignedToCurrentClientUser) && (
            <Popconfirm
              title="Delete Response"
              description="Are you sure you want to delete this response?"
              onConfirm={() => removeResponse(task?._id, response?._id)}
              okText="Delete"
              cancelText="Cancel"
              okType="danger"
              key="delete"
              disabled={loading}>
              <Tooltip title="Delete Response">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  loading={loading}
                />
              </Tooltip>
            </Popconfirm>
          ),
        ].filter(Boolean)}>
        <List.Item.Meta
          avatar={
            <Avatar
              icon={<UserOutlined />}
              className="bg-blue-100 text-blue-600"
            />
          }
          title={
            <Space>
              <Text strong>
                {response.respondedBy?.firstName || "Unknown"}{" "}
                {response.respondedBy?.lastName || "User"}
              </Text>
              <Tag color={statusConfig.color} icon={statusConfig.icon}>
                {statusConfig.text}
              </Tag>
            </Space>
          }
          description={
            <Space direction="vertical" size={0} className="w-full">
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-gray-400" />
                <Text type="secondary">{formatDate(response.timestamp)}</Text>
              </div>

              {response.comment && (
                <Paragraph
                  ellipsis={{ rows: 2, expandable: true, symbol: "more" }}
                  className="mb-0 mt-1">
                  {response.comment}
                </Paragraph>
              )}

              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <Text type="secondary">Progress</Text>
                  <Text strong>{getProgressPercent(response.completed)}%</Text>
                </div>
                <Progress
                  percent={getProgressPercent(response.completed)}
                  size="small"
                  status={response.completed ? "success" : "active"}
                  showInfo={false}
                />
              </div>
            </Space>
          }
        />
      </List.Item>
    );
  };

  // Response Preview Modal
  const ResponsePreviewModal = () => (
    <Modal
      title="Response Details"
      open={previewVisible}
      onCancel={() => setPreviewVisible(false)}
      footer={[
        <Button key="close" onClick={() => setPreviewVisible(false)}>
          Close
        </Button>,
        selectedResponse?.doc && (
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={(e) => handleDownload(selectedResponse, e)}>
            Download Document
          </Button>
        ),
      ].filter(Boolean)}
      width={600}>
      {selectedResponse && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Space>
              <Avatar
                size="large"
                icon={<UserOutlined />}
                className="bg-blue-100 text-blue-600"
              />
              <div>
                <Text strong className="text-lg block">
                  {selectedResponse.respondedBy?.firstName || "Unknown"}{" "}
                  {selectedResponse.respondedBy?.lastName || "User"}
                </Text>
                <Text type="secondary">
                  {formatDate(selectedResponse.timestamp)}
                </Text>
              </div>
            </Space>
            <Tag
              color={getStatusConfig(selectedResponse.completed).color}
              icon={getStatusConfig(selectedResponse.completed).icon}>
              {getStatusConfig(selectedResponse.completed).text}
            </Tag>
          </div>

          <Divider />

          {/* Progress */}
          <div>
            <Text strong className="block mb-2">
              Completion Status
            </Text>
            <Progress
              percent={getProgressPercent(selectedResponse.completed)}
              status={selectedResponse.completed ? "success" : "active"}
            />
          </div>

          {/* Comment */}
          {selectedResponse.comment && (
            <div>
              <Text strong className="block mb-2">
                Comment
              </Text>
              <Card size="small" className="bg-gray-50">
                <Paragraph className="mb-0 whitespace-pre-wrap">
                  {selectedResponse.comment}
                </Paragraph>
              </Card>
            </div>
          )}

          {/* Document */}
          {selectedResponse.doc && (
            <div>
              <Text strong className="block mb-2">
                Attached Document
              </Text>
              <Button
                icon={<FileOutlined />}
                onClick={(e) => handleDownload(selectedResponse, e)}
                type="dashed"
                block>
                Download Document
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );

  return (
    <div className="task-response-container">
      <Card
        title={
          <Space>
            <MessageOutlined />
            <span>Task Responses</span>
            <Badge
              count={task?.taskResponses?.length || 0}
              showZero
              style={{ backgroundColor: "#1890ff" }}
            />
          </Space>
        }
        className="shadow-sm border-0"
        bodyStyle={{ padding: "16px" }}>
        {task?.taskResponses?.length > 0 ? (
          <>
            {/* Mobile View - Cards */}
            <div className="block md:hidden">
              {task.taskResponses.map((response) => (
                <ResponseCard key={response._id} response={response} />
              ))}
            </div>

            {/* Desktop View - List */}
            <div className="hidden md:block">
              <List
                dataSource={task.taskResponses}
                renderItem={(response) => (
                  <ResponseListItem key={response._id} response={response} />
                )}
                pagination={
                  task.taskResponses.length > 5
                    ? {
                        pageSize: 5,
                        showSizeChanger: false,
                        showQuickJumper: false,
                        size: "small",
                      }
                    : false
                }
              />
            </div>
          </>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="text-center">
                <Text type="secondary" className="block mb-2">
                  No responses yet
                </Text>
                <Text type="secondary" className="text-sm">
                  Be the first to submit a response
                </Text>
              </div>
            }
          />
        )}
      </Card>

      {/* Response Preview Modal */}
      <ResponsePreviewModal />
    </div>
  );
};

TaskResponse.propTypes = {
  task: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    taskResponses: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        completed: PropTypes.bool,
        comment: PropTypes.string,
        timestamp: PropTypes.string,
        doc: PropTypes.string,
        respondedBy: PropTypes.shape({
          firstName: PropTypes.string,
          lastName: PropTypes.string,
        }),
      })
    ),
  }).isRequired,
  isAssignedToCurrentClientUser: PropTypes.bool,
  isAssignedToCurrentUser: PropTypes.bool,
  onResponseUpdate: PropTypes.func,
};

export default TaskResponse;
