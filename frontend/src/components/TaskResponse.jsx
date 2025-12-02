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
  FileTextOutlined,
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
  Modal,
  Typography,
  Divider,
  Badge,
  Alert,
} from "antd";
import { formatDate } from "../utils/formatDate";
import { useDispatch, useSelector } from "react-redux";
import { deleteData } from "../redux/features/delete/deleteSlice";
import { toast } from "react-toastify";
import useFileManager from "../hooks/useFileManager";
import { RESET } from "../redux/features/delete/deleteSlice";

const { Text, Paragraph } = Typography;

const TaskResponse = ({
  task,
  isAssignedToCurrentClientUser,
  isAssignedToCurrentUser,
  onResponseUpdate,
}) => {
  const { isError, isSuccess, message, loading } = useSelector(
    (state) => state.delete
  );
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);

  // Initialize file manager for the current task
  const {
    files: taskFiles,
    downloadFile,
    deleteFile,
    operationInProgress,
    fetchFiles,
    isOperationInProgress,
  } = useFileManager("task", task?._id, {
    autoFetch: false, // We'll fetch manually for each response
    enableNotifications: false, // Disable default notifications, we'll use toast
  });

  // Handle toast notifications
  useEffect(() => {
    if (isSuccess) {
      toast.success("Response deleted successfully");

      if (onResponseUpdate) {
        onResponseUpdate();
      }

      dispatch(RESET());
    }

    if (isError) {
      toast.error(message || "Failed to delete response");
      dispatch(RESET());
    }
  }, [isSuccess, isError, dispatch]);

  // Check if user can delete response
  const canDeleteResponse = (response) => {
    if (!response) return false;

    const isSubmitter =
      response.submittedBy?._id?.toString() === user?.data?._id?.toString();
    const isCreator =
      task?.createdBy?._id?.toString() === user?.data?._id?.toString();
    const isAdmin = ["admin", "super-admin"].includes(user?.data?.role);

    return isSubmitter || isCreator || isAdmin;
  };

  // Check if user can delete file
  const canDeleteFile = (file, response) => {
    if (!file || !response) return false;

    const isResponseOwner = canDeleteResponse(response);
    const isAdmin = ["admin", "super-admin"].includes(user?.data?.role);
    const isFileOwner =
      file.uploadedBy?._id?.toString() === user?.data?._id?.toString();

    return isResponseOwner || isAdmin || isFileOwner;
  };

  // Remove/delete response
  const removeResponse = async (taskId, responseId) => {
    try {
      await dispatch(deleteData(`tasks/${taskId}/responses/${responseId}`));
    } catch (error) {
      console.error("Error deleting response:", error);
      toast.error("Failed to delete response");
    }
  };

  // Handle file download using file manager
  const handleDownload = async (file, response, event) => {
    event?.stopPropagation();

    try {
      await downloadFile(file);
      toast.success(`Downloading ${file.fileName}...`);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error(`Failed to download ${file.fileName}`);
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (file, response, event) => {
    event?.stopPropagation();

    try {
      const success = await deleteFile(file);
      if (success) {
        toast.success(`${file.fileName} deleted successfully`);

        // Optionally refresh the response data if needed
        if (onResponseUpdate) {
          onResponseUpdate();
        }
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(`Failed to delete ${file.fileName}`);
    }
  };

  // Open response preview
  const openPreview = (response) => {
    setSelectedResponse(response);
    setPreviewVisible(true);
  };

  // Get status config
  const getStatusConfig = (status) => {
    const statusConfigs = {
      completed: {
        color: "success",
        icon: <CheckCircleOutlined />,
        text: "Completed",
      },
      "in-progress": {
        color: "processing",
        icon: <ClockCircleOutlined />,
        text: "In Progress",
      },
      "needs-review": {
        color: "warning",
        icon: <EyeOutlined />,
        text: "Needs Review",
      },
      rejected: {
        color: "error",
        icon: <CloseCircleOutlined />,
        text: "Rejected",
      },
      "on-hold": {
        color: "default",
        icon: <ClockCircleOutlined />,
        text: "On Hold",
      },
    };

    return (
      statusConfigs[status] || {
        color: "default",
        icon: <ClockCircleOutlined />,
        text: "Unknown",
      }
    );
  };

  // Get progress percentage
  const getProgressPercent = (response) => {
    return response.completionPercentage || (response.completed ? 100 : 0);
  };

  // Get user display name
  const getUserDisplayName = (userObj) => {
    if (!userObj) return "Unknown User";
    return (
      `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() ||
      "Unknown User"
    );
  };

  // Format timestamp
  const getResponseTimestamp = (response) => {
    return response.submittedAt || response.timestamp;
  };

  // Enhanced file card component for displaying files with actions
  const FileItem = ({ file, response }) => {
    const isDownloading =
      isOperationInProgress(file) &&
      operationInProgress?.startsWith("download");
    const isDeleting =
      isOperationInProgress(file) && operationInProgress?.startsWith("delete");

    return (
      <div className="flex justify-between items-center p-2 bg-gray-50 rounded mb-1 hover:bg-gray-100">
        <Space className="flex-1 min-w-0">
          <FileTextOutlined className="text-blue-500" />
          <Tooltip title={file.fileName}>
            <Text ellipsis className="text-sm flex-1 min-w-0">
              {file.fileName}
            </Text>
          </Tooltip>
          {file.fileSizeMB && (
            <Text type="secondary" className="text-xs">
              {file.fileSizeMB} MB
            </Text>
          )}
        </Space>

        <Space size="small">
          <Tooltip title="Download">
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              loading={isDownloading}
              onClick={(e) => handleDownload(file, response, e)}
              disabled={isDeleting}
            />
          </Tooltip>

          {canDeleteFile(file, response) && (
            <Tooltip title="Delete">
              <Popconfirm
                title="Delete File"
                description="Are you sure you want to delete this file?"
                onConfirm={(e) => handleDeleteFile(file, response, e)}
                okText="Delete"
                cancelText="Cancel"
                okType="danger"
                disabled={isDownloading || isDeleting}>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={isDeleting}
                  disabled={isDownloading}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      </div>
    );
  };

  // Response card for mobile view
  const ResponseCard = ({ response }) => {
    const statusConfig = getStatusConfig(response.status);
    const progressPercent = getProgressPercent(response);
    const timestamp = getResponseTimestamp(response);
    const userDisplayName = getUserDisplayName(
      response.submittedBy || response.respondedBy
    );

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
                {userDisplayName}
              </Text>
              <Text type="secondary" className="text-xs">
                {formatDate(timestamp)}
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
            <Text strong>{progressPercent}%</Text>
          </div>
          <Progress
            percent={progressPercent}
            size="small"
            status={response.status === "completed" ? "success" : "active"}
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

        {/* Documents */}
        {response.documents && response.documents.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1 mb-1">
              <FileTextOutlined className="text-gray-400 text-xs" />
              <Text strong className="text-xs">
                Documents ({response.documents.length})
              </Text>
            </div>
            <div className="space-y-1">
              {response.documents.slice(0, 3).map((doc, index) => (
                <FileItem
                  key={doc._id || index}
                  file={doc}
                  response={response}
                />
              ))}
              {response.documents.length > 3 && (
                <div className="text-center pt-1">
                  <Text type="secondary" className="text-xs">
                    +{response.documents.length - 3} more files
                  </Text>
                </div>
              )}
            </div>
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
          </Space>

          {canDeleteResponse(response) && (
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
    const statusConfig = getStatusConfig(response.status);
    const progressPercent = getProgressPercent(response);
    const timestamp = getResponseTimestamp(response);
    const userDisplayName = getUserDisplayName(
      response.submittedBy || response.respondedBy
    );

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

          canDeleteResponse(response) && (
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
              <Text strong>{userDisplayName}</Text>
              <Tag color={statusConfig.color} icon={statusConfig.icon}>
                {statusConfig.text}
              </Tag>
              {response.reviewedBy && (
                <Tag color="green" icon={<CheckCircleOutlined />}>
                  Reviewed
                </Tag>
              )}
            </Space>
          }
          description={
            <Space direction="vertical" size={0} className="w-full">
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-gray-400" />
                <Text type="secondary">{formatDate(timestamp)}</Text>
                {response.timeSpent > 0 && (
                  <Text type="secondary" className="ml-2">
                    ⏱️ {response.timeSpent} min
                  </Text>
                )}
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
                  <Text strong>{progressPercent}%</Text>
                </div>
                <Progress
                  percent={progressPercent}
                  size="small"
                  status={
                    response.status === "completed" ? "success" : "active"
                  }
                  showInfo={false}
                />
              </div>

              {response.documents && response.documents.length > 0 && (
                <div className="mt-2">
                  <Space direction="vertical" size="small" className="w-full">
                    {response.documents.slice(0, 2).map((doc) => (
                      <FileItem key={doc._id} file={doc} response={response} />
                    ))}
                    {response.documents.length > 2 && (
                      <Text type="secondary" className="text-xs">
                        +{response.documents.length - 2} more files
                      </Text>
                    )}
                  </Space>
                </div>
              )}
            </Space>
          }
        />
      </List.Item>
    );
  };

  // Response Preview Modal
  const ResponsePreviewModal = () => {
    if (!selectedResponse) return null;

    const statusConfig = getStatusConfig(selectedResponse.status);
    const progressPercent = getProgressPercent(selectedResponse);
    const timestamp = getResponseTimestamp(selectedResponse);
    const userDisplayName = getUserDisplayName(
      selectedResponse.submittedBy || selectedResponse.respondedBy
    );

    return (
      <Modal
        title="Response Details"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}>
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
                  {userDisplayName}
                </Text>
                <Text type="secondary">{formatDate(timestamp)}</Text>
              </div>
            </Space>
            <Tag color={statusConfig.color} icon={statusConfig.icon}>
              {statusConfig.text}
            </Tag>
          </div>

          <Divider />

          {/* Progress */}
          <div>
            <Text strong className="block mb-2">
              Completion Status
            </Text>
            <Progress
              percent={progressPercent}
              status={
                selectedResponse.status === "completed" ? "success" : "active"
              }
            />
          </div>

          {/* Time Spent */}
          {selectedResponse.timeSpent > 0 && (
            <div>
              <Text strong className="block mb-2">
                Time Spent
              </Text>
              <Card size="small" className="bg-gray-50">
                <Text>{selectedResponse.timeSpent} minutes</Text>
              </Card>
            </div>
          )}

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

          {/* Review Info */}
          {selectedResponse.reviewedBy && (
            <div>
              <Text strong className="block mb-2">
                Review Details
              </Text>
              <Card size="small" className="bg-gray-50">
                <Space direction="vertical" size="small">
                  <Text>
                    Reviewed by:{" "}
                    {getUserDisplayName(selectedResponse.reviewedBy)}
                  </Text>
                  {selectedResponse.reviewedAt && (
                    <Text>
                      Review date: {formatDate(selectedResponse.reviewedAt)}
                    </Text>
                  )}
                  {selectedResponse.reviewComment && (
                    <Text>
                      Review comment: {selectedResponse.reviewComment}
                    </Text>
                  )}
                </Space>
              </Card>
            </div>
          )}

          {/* Documents */}
          {selectedResponse.documents &&
            selectedResponse.documents.length > 0 && (
              <div>
                <Text strong className="block mb-2">
                  Attached Documents ({selectedResponse.documents.length})
                </Text>
                <Card size="small" className="bg-gray-50">
                  <Space direction="vertical" size="small" className="w-full">
                    {selectedResponse.documents.map((doc, index) => (
                      <FileItem
                        key={doc._id || index}
                        file={doc}
                        response={selectedResponse}
                      />
                    ))}
                  </Space>
                </Card>
              </div>
            )}
        </div>
      </Modal>
    );
  };

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
        status: PropTypes.string,
        completed: PropTypes.bool,
        completionPercentage: PropTypes.number,
        comment: PropTypes.string,
        timestamp: PropTypes.string,
        submittedAt: PropTypes.string,
        submittedBy: PropTypes.shape({
          _id: PropTypes.string,
          firstName: PropTypes.string,
          lastName: PropTypes.string,
        }),
        respondedBy: PropTypes.shape({
          _id: PropTypes.string,
          firstName: PropTypes.string,
          lastName: PropTypes.string,
        }),
        timeSpent: PropTypes.number,
        documents: PropTypes.arrayOf(
          PropTypes.shape({
            _id: PropTypes.string,
            fileName: PropTypes.string,
            fileUrl: PropTypes.string,
            presignedUrl: PropTypes.string,
            fileSizeMB: PropTypes.number,
            uploadedBy: PropTypes.shape({
              _id: PropTypes.string,
              firstName: PropTypes.string,
              lastName: PropTypes.string,
            }),
          })
        ),
        reviewedBy: PropTypes.shape({
          _id: PropTypes.string,
          firstName: PropTypes.string,
          lastName: PropTypes.string,
        }),
        reviewedAt: PropTypes.string,
        reviewComment: PropTypes.string,
      })
    ),
    createdBy: PropTypes.shape({
      _id: PropTypes.string,
      firstName: PropTypes.string,
      lastName: PropTypes.string,
    }),
  }).isRequired,
  isAssignedToCurrentClientUser: PropTypes.bool,
  isAssignedToCurrentUser: PropTypes.bool,
  onResponseUpdate: PropTypes.func,
};

export default TaskResponse;
