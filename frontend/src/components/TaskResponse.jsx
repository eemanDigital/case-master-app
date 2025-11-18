import PropTypes from "prop-types";
import {
  Card,
  List,
  Tag,
  Space,
  Typography,
  Avatar,
  Divider,
  Button,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  FileOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { formatDate } from "../utils/formatDate";
import {
  handleGeneralDownload,
  handleTaskResponseDownload,
} from "../utils/generalFileDownloadHandler";
import { useDispatch, useSelector } from "react-redux";
import { deleteData } from "../redux/features/delete/deleteSlice";
import { toast } from "react-toastify";
import { useEffect } from "react";

const { Title, Text } = Typography;

const TaskResponse = ({
  task,
  isAssignedToCurrentUser,
  isAssignedToCurrentClientUser,
  onResponseUpdate,
}) => {
  const baseURL = import.meta.env.VITE_BASE_URL;
  const { isError, isSuccess, message, isLoading } = useSelector(
    (state) => state.delete
  );
  const dispatch = useDispatch();

  const responses = task?.taskResponse || [];

  console.log(responses, "RES");

  // Handle delete response
  const removeResponse = async (taskId, responseId) => {
    try {
      await dispatch(deleteData(`tasks/${taskId}/response/${responseId}`));
    } catch (error) {
      console.error("Error deleting response:", error);
      toast.error("Failed to delete response");
    }
  };

  // // Handle download response document
  // const handleDownloadResponse = (response, event) => {
  //   if (response.doc) {
  //     handleGeneralDownload(response.doc, `response_${response._id}`);
  //   } else if (baseURL && task?._id && response._id) {
  //     const downloadUrl = `${baseURL}/tasks/${task._id}/response/${response._id}/download`;
  //     handleGeneralDownload(downloadUrl, `response_${response._id}`);
  //   } else {
  //     console.error("Cannot determine download URL for response:", response);
  //     toast.error("Download URL not available");
  //   }
  // };

  // Show toast messages for delete operations
  useEffect(() => {
    if (isSuccess && message) {
      toast.success(message);
      // Trigger refresh after successful deletion
      if (onResponseUpdate) {
        onResponseUpdate();
      }
    }
  }, [isSuccess, message, onResponseUpdate]);

  useEffect(() => {
    if (isError && message) {
      toast.error(message);
    }
  }, [isError, message]);

  const getStatusIcon = (completed) => {
    return completed ? (
      <CheckCircleOutlined className="text-green-500" />
    ) : (
      <CloseCircleOutlined className="text-red-500" />
    );
  };

  const getStatusTag = (completed) => {
    return completed ? (
      <Tag color="green" icon={<CheckCircleOutlined />}>
        Completed
      </Tag>
    ) : (
      <Tag color="orange" icon={<CloseCircleOutlined />}>
        In Progress
      </Tag>
    );
  };

  if (responses.length === 0) {
    return (
      <div className="text-center py-6">
        <Text type="secondary">No responses yet</Text>
        {(isAssignedToCurrentUser || isAssignedToCurrentClientUser) && (
          <div className="mt-2">
            <Text type="secondary" className="text-sm">
              Be the first to respond to this task
            </Text>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Title level={5} className="mb-4">
        Responses ({responses.length})
      </Title>

      <List
        dataSource={responses}
        renderItem={(response, index) => (
          <List.Item
            className="border-0 px-0"
            actions={[
              // Download button for response document
              response.doc && (
                <Tooltip title="Download Document" key="download">
                  <Button
                    type="text"
                    icon={<DownloadOutlined />}
                    onClick={(event) =>
                      handleTaskResponseDownload(
                        event,
                        response?.doc ||
                          `${baseURL}/tasks/${task._id}/response/${response._id}/download`,
                        "response"
                      )
                    }
                    className="text-blue-500 hover:text-blue-700"
                    size="small">
                    Download
                  </Button>
                </Tooltip>
              ),
              // Delete button for assigned users
              (isAssignedToCurrentUser || isAssignedToCurrentClientUser) && (
                <Popconfirm
                  key="delete"
                  title="Delete Response"
                  description="Are you sure you want to delete this response?"
                  onConfirm={() => removeResponse(task._id, response._id)}
                  okText="Yes"
                  cancelText="No"
                  okType="danger">
                  <Tooltip title="Delete Response">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      loading={isLoading}
                      size="small">
                      Delete
                    </Button>
                  </Tooltip>
                </Popconfirm>
              ),
            ].filter(Boolean)}>
            <Card
              size="small"
              className="w-full border-l-4 border-l-blue-500 hover:shadow-sm transition-shadow"
              styles={{ body: { padding: "16px" } }}>
              <div className="flex items-start justify-between mb-3">
                <Space>
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    src={response.submittedBy?.photo}
                  />
                  <div>
                    <Text strong>
                      {response.submittedBy?.firstName}{" "}
                      {response.submittedBy?.lastName}
                    </Text>
                    <div className="text-xs text-gray-500">
                      {formatDate(response.timestamp)}
                    </div>
                  </div>
                </Space>
                {getStatusTag(response.completed)}
              </div>

              {response.comment && (
                <div className="mb-3">
                  <Text className="text-gray-700 whitespace-pre-line">
                    {response.comment}
                  </Text>
                </div>
              )}

              {response.doc && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded border">
                  <FileOutlined className="text-blue-500" />
                  <Text className="text-sm flex-1">
                    Document attached:{" "}
                    {response.doc.split("/").pop() || "response_document"}
                  </Text>
                  <Button
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={(e) => handleDownloadResponse(response, e)}
                    className="text-blue-500">
                    Download
                  </Button>
                </div>
              )}

              <Divider className="my-3" />

              <div className="flex justify-between items-center text-xs text-gray-500">
                <Space>
                  <Text>
                    Submitted: {formatDate(response.timestamp, "relative")}
                  </Text>
                </Space>
                {response.completed && (
                  <Text type="success" className="text-xs">
                    Marked as completed
                  </Text>
                )}
              </div>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
};

TaskResponse.propTypes = {
  task: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    taskResponse: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        completed: PropTypes.bool,
        comment: PropTypes.string,
        timestamp: PropTypes.string,
        doc: PropTypes.string,
        submittedBy: PropTypes.shape({
          _id: PropTypes.string,
          firstName: PropTypes.string,
          lastName: PropTypes.string,
          photo: PropTypes.string,
        }),
      })
    ),
  }).isRequired,
  isAssignedToCurrentUser: PropTypes.bool,
  isAssignedToCurrentClientUser: PropTypes.bool,
  onResponseUpdate: PropTypes.func,
};

export default TaskResponse;
