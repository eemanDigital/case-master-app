import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Alert,
  Timeline,
  Divider,
  Avatar,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import { useAdminHook } from "../hooks/useAdminHook";
import LoadingSpinner from "../components/LoadingSpinner";
import LeaveResponseForm from "../components/LeaveResponseForm";
import { formatDate } from "../utils/formatDate";
import avatar from "../assets/avatar.png";

const LeaveApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdminOrHr } = useAdminHook();
  const { dataFetcher } = useDataFetch();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      const response = await dataFetcher(`leaves/applications/${id}`, "GET");
      if (response?.data) {
        setApplication(response.data.leaveApplication);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch application details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <ClockCircleOutlined />,
      approved: <CheckCircleOutlined />,
      rejected: <CloseCircleOutlined />,
      cancelled: <CloseCircleOutlined />,
    };
    return icons[status];
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      approved: "success",
      rejected: "error",
      cancelled: "default",
    };
    return colors[status];
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-4">
        <Alert message="Error" description={error} type="error" showIcon />
        <Button
          className="mt-4"
          onClick={() => navigate(-1)}
          icon={<ArrowLeftOutlined />}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-4">
        <Alert
          message="Not Found"
          description="Leave application not found"
          type="warning"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Button onClick={() => navigate(-1)} icon={<ArrowLeftOutlined />}>
          Back to List
        </Button>

        <Space>
          {isAdminOrHr && application.status === "pending" && (
            <LeaveResponseForm
              application={application}
              onSuccess={fetchApplicationDetails}
            />
          )}
        </Space>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Application Status */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Application Status</h2>
              <Tag
                icon={getStatusIcon(application.status)}
                color={getStatusColor(application.status)}
                className="text-base px-4 py-1 capitalize">
                {application.status}
              </Tag>
            </div>

            {application.status !== "pending" && (
              <Alert
                message={
                  application.status === "approved"
                    ? "Application Approved"
                    : application.status === "rejected"
                    ? "Application Rejected"
                    : "Application Cancelled"
                }
                description={
                  application.responseMessage ||
                  application.cancellationReason ||
                  "No additional comments"
                }
                type={application.status === "approved" ? "success" : "error"}
                showIcon
              />
            )}
          </Card>

          {/* Leave Details */}
          <Card title="Leave Details" extra={<FileTextOutlined />}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Leave Type">
                <Tag className="capitalize">{application.typeOfLeave}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Start Date">
                {formatDate(application.startDate)}
              </Descriptions.Item>
              <Descriptions.Item label="End Date">
                {formatDate(application.endDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Days Applied">
                <strong>{application.daysAppliedFor} days</strong>
              </Descriptions.Item>
              {application.status === "approved" && (
                <Descriptions.Item label="Days Approved">
                  <strong className="text-green-600">
                    {application.daysApproved} days
                  </strong>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Reason">
                {application.reason}
              </Descriptions.Item>
              <Descriptions.Item label="Applied To">
                {application.applyTo}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Timeline */}
          <Card title="Application Timeline">
            <Timeline
              items={[
                {
                  color: "blue",
                  children: (
                    <>
                      <strong>Application Submitted</strong>
                      <div className="text-gray-500 text-sm">
                        {formatDate(application.createdAt)}
                      </div>
                    </>
                  ),
                },
                application.reviewedAt && {
                  color: application.status === "approved" ? "green" : "red",
                  children: (
                    <>
                      <strong>
                        {application.status === "approved"
                          ? "Application Approved"
                          : "Application Rejected"}
                      </strong>
                      <div className="text-gray-500 text-sm">
                        {formatDate(application.reviewedAt)}
                      </div>
                      {application.reviewedBy && (
                        <div className="text-sm mt-1">
                          By: {application.reviewedBy.firstName}{" "}
                          {application.reviewedBy.lastName}
                        </div>
                      )}
                    </>
                  ),
                },
                application.cancelledAt && {
                  color: "gray",
                  children: (
                    <>
                      <strong>Application Cancelled</strong>
                      <div className="text-gray-500 text-sm">
                        {formatDate(application.cancelledAt)}
                      </div>
                    </>
                  ),
                },
              ].filter(Boolean)}
            />
          </Card>
        </div>

        {/* Sidebar - Employee Info */}
        <div className="space-y-6">
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>Employee Information</span>
              </Space>
            }>
            <div className="text-center mb-4">
              <Avatar
                size={80}
                src={application.employee?.photo || avatar}
                icon={<UserOutlined />}
              />
              <h3 className="text-lg font-semibold mt-2 capitalize">
                {`${application.employee?.firstName} ${application.employee?.lastName}`}
              </h3>
              <p className="text-gray-500">{application.employee?.email}</p>
            </div>

            <Divider />

            <Descriptions column={1} size="small">
              <Descriptions.Item label="Employee ID">
                {application.employee?.employeeId || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {application.employee?.department || "N/A"}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Quick Actions */}
          {isAdminOrHr && application.status === "pending" && (
            <Card title="Quick Actions">
              <Space direction="vertical" style={{ width: "100%" }}>
                <LeaveResponseForm
                  application={application}
                  onSuccess={fetchApplicationDetails}
                />
              </Space>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveApplicationDetails;
