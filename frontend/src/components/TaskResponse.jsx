import React, { useState, useEffect, useCallback } from "react";
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
  Row,
  Col,
  Empty,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  FileOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { formatDate } from "../utils/formatDate";
import { downloadFile } from "../utils/fileDownloadHandler";

const { Title, Text } = Typography;

const TaskResponse = ({
  task,
  isAssignedToCurrentUser = false,
  isAssignedToCurrentClientUser = false,
  onResponseUpdate,
}) => {
  const baseURL = import.meta.env.VITE_BASE_URL;
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [downloadingIds, setDownloadingIds] = useState(new Set());

  const responses = task?.taskResponse || [];

  // Check if user can delete a response
  const canDeleteResponse = useCallback(
    (response) => {
      const currentUser = JSON.parse(localStorage.getItem("user"))?.data;
      if (!currentUser) return false;

      const isResponseOwner = response.submittedBy?._id === currentUser._id;
      const isTaskOwner = task.assignedBy?._id === currentUser._id;
      const isAdmin = ["super-admin", "admin", "hr"].includes(currentUser.role);

      return isResponseOwner || isTaskOwner || isAdmin;
    },
    [task.assignedBy]
  );

  // Handle response deletion
  const handleDeleteResponse = async (taskId, responseId) => {
    setDeletingIds((prev) => new Set(prev).add(responseId));

    try {
      const response = await fetch(
        `${baseURL}/tasks/${taskId}/response/${responseId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete response");
      }

      const data = await response.json();
      toast.success(data.message || "Response deleted successfully");

      // Trigger parent update
      if (onResponseUpdate) {
        onResponseUpdate();
      }
    } catch (error) {
      console.error("Error deleting response:", error);
      toast.error(error.message || "Failed to delete response");
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(responseId);
        return newSet;
      });
    }
  };

  // Handle document download
  const handleDownload = async (event, response) => {
    const responseId = response._id;
    setDownloadingIds((prev) => new Set(prev).add(responseId));

    try {
      await downloadFile(
        event,
        `${baseURL}/tasks/${task._id}/response/${responseId}/download`,
        `response_${response.submittedBy?.firstName || "user"}_${
          response.timestamp
        }`
      );
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download document");
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(responseId);
        return newSet;
      });
    }
  };

  // Format filename for display
  const formatFileName = (url) => {
    if (!url) return "Document";

    try {
      const fileName = url.split("/").pop();
      return (
        fileName
          .replace(/^\d+_[\w]{12,}_/, "") // Remove timestamp and hash
          .replace(/_/g, " ")
          .replace(/\.[^/.]+$/, "") // Remove extension
          .substring(0, 40)
          .trim() || "Document"
      );
    } catch {
      return "Document";
    }
  };

  // Get status tag component
  const getStatusTag = (completed) => {
    return completed ? (
      <Tag
        color="success"
        icon={<CheckCircleOutlined />}
        className="text-xs font-medium">
        Completed
      </Tag>
    ) : (
      <Tag
        color="warning"
        icon={<CloseCircleOutlined />}
        className="text-xs font-medium">
        In Progress
      </Tag>
    );
  };

  // Empty state
  if (responses.length === 0) {
    return (
      <Card className="border-0 rounded-2xl shadow-sm">
        <Empty
          image={<PaperClipOutlined className="text-6xl text-gray-300" />}
          description={
            <div className="text-center py-4">
              <Text type="secondary" className="block text-lg mb-2">
                No responses yet
              </Text>
              {(isAssignedToCurrentUser || isAssignedToCurrentClientUser) && (
                <Text type="secondary" className="text-sm">
                  Be the first to submit a response
                </Text>
              )}
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <Card className="border-0 rounded-2xl shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <PaperClipOutlined className="text-blue-600 text-lg" />
          <Title level={4} className="m-0">
            Task Responses
          </Title>
        </div>
        <Tag color="blue" className="text-sm font-medium">
          {responses.length} {responses.length === 1 ? "response" : "responses"}
        </Tag>
      </div>

      {/* Response List */}
      <List
        dataSource={responses}
        renderItem={(response) => (
          <List.Item className="!px-0 !py-3 !border-0">
            <Card
              className="w-full shadow-sm hover:shadow-md transition-all duration-200 rounded-xl border border-gray-200"
              bodyStyle={{ padding: "24px" }}>
              {/* Response Header */}
              <Row gutter={[16, 12]} align="middle" className="mb-4">
                <Col xs={24} md={16}>
                  <Space size="middle">
                    <Avatar
                      size={48}
                      icon={<UserOutlined />}
                      src={response.submittedBy?.photo}
                      className="bg-gradient-to-br from-blue-400 to-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <Text
                        strong
                        className="block text-gray-900 text-base truncate">
                        {response.submittedBy?.firstName || "Unknown"}{" "}
                        {response.submittedBy?.lastName || "User"}
                      </Text>
                      <Text type="secondary" className="text-xs">
                        {formatDate(response.timestamp) || "Unknown date"}
                      </Text>
                    </div>
                  </Space>
                </Col>

                <Col xs={24} md={8}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-2">
                    {getStatusTag(response.completed)}

                    <Space size="small" className="flex justify-end">
                      {/* Download Button */}
                      {response.doc && (
                        <Tooltip title="Download document">
                          <Button
                            type="text"
                            size="middle"
                            icon={<DownloadOutlined />}
                            onClick={(event) => handleDownload(event, response)}
                            loading={downloadingIds.has(response._id)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          />
                        </Tooltip>
                      )}

                      {/* Delete Button */}
                      {canDeleteResponse(response) && (
                        <Popconfirm
                          title="Delete Response"
                          description={
                            <div className="max-w-xs">
                              <p className="mb-2">
                                Are you sure you want to delete this response?
                              </p>
                              <p className="text-xs text-gray-500">
                                This action cannot be undone.
                              </p>
                            </div>
                          }
                          onConfirm={() =>
                            handleDeleteResponse(task._id, response._id)
                          }
                          okText="Delete"
                          cancelText="Cancel"
                          okType="danger"
                          placement="topRight">
                          <Tooltip title="Delete response">
                            <Button
                              type="text"
                              size="middle"
                              danger
                              icon={<DeleteOutlined />}
                              loading={deletingIds.has(response._id)}
                              className="hover:bg-red-50"
                            />
                          </Tooltip>
                        </Popconfirm>
                      )}
                    </Space>
                  </div>
                </Col>
              </Row>

              {/* Comment Section */}
              {response.comment && (
                <div className="mb-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <Text className="text-gray-800 whitespace-pre-line leading-relaxed text-sm">
                      {response.comment}
                    </Text>
                  </div>
                </div>
              )}

              {/* Document Attachment */}
              {response.doc && (
                <div className="mb-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg flex-shrink-0">
                      <FileOutlined className="text-blue-600 text-lg" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <Text className="text-sm font-semibold text-gray-900 block truncate mb-1">
                        {formatFileName(response.doc)}
                      </Text>
                      <Text
                        type="secondary"
                        className="text-xs block truncate font-mono">
                        {response.doc.split("/").pop()}
                      </Text>
                    </div>

                    <Button
                      type="primary"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={(event) => handleDownload(event, response)}
                      loading={downloadingIds.has(response._id)}
                      className="flex-shrink-0">
                      Download
                    </Button>
                  </div>
                </div>
              )}

              <Divider className="my-4" />

              {/* Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Text className="text-xs">
                    Submitted{" "}
                    {formatDate(response.timestamp, "relative") || "recently"}
                  </Text>
                </div>

                {response.completed && (
                  <div className="flex items-center gap-2">
                    <CheckCircleOutlined className="text-green-500" />
                    <Text type="success" className="text-xs font-medium">
                      Task marked as completed
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          </List.Item>
        )}
        className="response-list"
      />
    </Card>
  );
};

TaskResponse.propTypes = {
  task: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    assignedBy: PropTypes.shape({
      _id: PropTypes.string,
    }),
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
