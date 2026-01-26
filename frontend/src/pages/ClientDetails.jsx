// pages/ClientDetails.jsx - MOBILE-FIRST REFACTOR
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Avatar,
  Badge,
  Button,
  Descriptions,
  Alert,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import { useAdminHook } from "../hooks/useAdminHook";
import UpdateClientInfo from "../components/UpdateClientInfo";
import UpdateClientStatus from "../components/UpDateClientStatus";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";

const { Title, Text } = Typography;

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { isClient, isSuperOrAdmin, isAdminOrHr } = useAdminHook();

  useEffect(() => {
    if (id) {
      dataFetcher(`users/${id}`, "GET");
    }
  }, [id]);

  const clientData = data?.data;

  // Calculate client statistics
  const clientStats = {
    totalCases: clientData?.case?.length || 0,
    activeCases:
      clientData?.case?.filter((c) => c.active)?.length || 0,
    completedCases:
      clientData?.case?.filter((c) => c.caseStatus === "completed")
        ?.length || 0,
  };

  const getStatusTag = (isActive, isVerified) => {
    if (!isActive) {
      return (
        <Tag color="red" icon={<ClockCircleOutlined />} className="text-xs sm:text-sm">
          Inactive
        </Tag>
      );
    }
    if (isVerified) {
      return (
        <Tag color="green" icon={<CheckCircleOutlined />} className="text-xs sm:text-sm">
          Active & Verified
        </Tag>
      );
    }
    return (
      <Tag color="orange" icon={<ClockCircleOutlined />} className="text-xs sm:text-sm">
        Pending Verification
      </Tag>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <PageErrorAlert errorCondition={error} errorMessage={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <Card className="mb-4 sm:mb-6 shadow-md">
          <div className="p-2 sm:p-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              className="mb-4"
              type="text"
            >
              <span className="hidden sm:inline ml-1">Back</span>
            </Button>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <Badge
                count={clientData?.isActive ? "Active" : "Inactive"}
                color={clientData?.isActive ? "green" : "red"}
                className="flex-shrink-0"
              >
                <Avatar
                  size={window.innerWidth < 640 ? 80 : 100}
                  src={clientData?.photo}
                  icon={<UserOutlined />}
                  className="border-2 border-white shadow-lg"
                />
              </Badge>

              <div className="flex-1 text-center sm:text-left min-w-0 w-full">
                <Title
                  level={window.innerWidth < 640 ? 3 : 2}
                  className="!mb-2 truncate"
                >
                  {clientData?.firstName} {clientData?.lastName || clientData?.secondName}
                </Title>
                <Text type="secondary" className="text-xs sm:text-sm block mb-3">
                  Client ID: {clientData?._id?.substring(0, 12)}...
                </Text>

                {getStatusTag(clientData?.isActive, clientData?.isVerified)}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  {isClient && (
                    <UpdateClientInfo clientData={clientData} />
                  )}
                  {(isSuperOrAdmin || isAdminOrHr) && (
                    <UpdateClientStatus
                      clientId={id}
                      clientData={clientData}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        <Row gutter={[8, 8]} className="mb-4 sm:mb-6">
          <Col xs={24} sm={8}>
            <Card size="small" className="text-center shadow-sm">
              <Statistic
                title={<span className="text-xs sm:text-sm">Total Cases</span>}
                value={clientStats.totalCases}
                prefix={<FileTextOutlined className="text-blue-500" />}
                valueStyle={{
                  color: "#1890ff",
                  fontSize: window.innerWidth < 640 ? "1.25rem" : "1.5rem",
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" className="text-center shadow-sm">
              <Statistic
                title={<span className="text-xs sm:text-sm">Active Cases</span>}
                value={clientStats.activeCases}
                prefix={<CheckCircleOutlined className="text-green-500" />}
                valueStyle={{
                  color: "#52c41a",
                  fontSize: window.innerWidth < 640 ? "1.25rem" : "1.5rem",
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" className="text-center shadow-sm">
              <Statistic
                title={<span className="text-xs sm:text-sm">Completed</span>}
                value={clientStats.completedCases}
                prefix={<SafetyCertificateOutlined className="text-purple-500" />}
                valueStyle={{
                  color: "#722ed1",
                  fontSize: window.innerWidth < 640 ? "1.25rem" : "1.5rem",
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* Personal Information */}
        <Card
          title={
            <Space className="text-sm sm:text-base">
              <IdcardOutlined className="text-blue-500" />
              <span>Personal Information</span>
            </Space>
          }
          className="mb-4 sm:mb-6 shadow-md"
        >
          <Descriptions
            column={{ xs: 1, sm: 1, md: 2 }}
            size={window.innerWidth < 640 ? "small" : "middle"}
            labelStyle={{ fontWeight: 600 }}
          >
            <Descriptions.Item
              label={
                <Space size="small">
                  <UserOutlined />
                  <span className="text-xs sm:text-sm">Full Name</span>
                </Space>
              }
            >
              <Text strong className="text-xs sm:text-sm">
                {clientData?.firstName} {clientData?.lastName || clientData?.secondName}
              </Text>
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <Space size="small">
                  <MailOutlined />
                  <span className="text-xs sm:text-sm">Email</span>
                </Space>
              }
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Text className="text-xs sm:text-sm break-all">
                  {clientData?.email}
                </Text>
                {clientData?.isVerified && (
                  <Tag
                    color="green"
                    icon={<SafetyCertificateOutlined />}
                    size="small"
                    className="text-xs"
                  >
                    Verified
                  </Tag>
                )}
              </div>
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <Space size="small">
                  <PhoneOutlined />
                  <span className="text-xs sm:text-sm">Phone</span>
                </Space>
              }
            >
              <Text className="text-xs sm:text-sm">
                {clientData?.phone || "Not provided"}
              </Text>
            </Descriptions.Item>

            <Descriptions.Item
              label={
                <Space size="small">
                  <EnvironmentOutlined />
                  <span className="text-xs sm:text-sm">Address</span>
                </Space>
              }
              span={2}
            >
              <Text className="text-xs sm:text-sm">
                {clientData?.address || "Not provided"}
              </Text>
            </Descriptions.Item>
          </Descriptions>

          {/* Client Details */}
          {clientData?.clientDetails && (
            <>
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mt-4">
                <Space className="mb-3">
                  <BankOutlined className="text-blue-600 text-lg" />
                  <Text strong className="text-sm sm:text-base">
                    Business Information
                  </Text>
                </Space>

                <Descriptions
                  column={{ xs: 1, sm: 2 }}
                  size={window.innerWidth < 640 ? "small" : "middle"}
                >
                  {clientData.clientDetails.company && (
                    <Descriptions.Item
                      label={<span className="text-xs sm:text-sm">Company</span>}
                    >
                      <Text className="text-xs sm:text-sm">
                        {clientData.clientDetails.company}
                      </Text>
                    </Descriptions.Item>
                  )}

                  {clientData.clientDetails.industry && (
                    <Descriptions.Item
                      label={<span className="text-xs sm:text-sm">Industry</span>}
                    >
                      <Text className="text-xs sm:text-sm">
                        {clientData.clientDetails.industry}
                      </Text>
                    </Descriptions.Item>
                  )}

                  {clientData.clientDetails.clientCategory && (
                    <Descriptions.Item
                      label={<span className="text-xs sm:text-sm">Category</span>}
                    >
                      <Tag color="blue" className="text-xs capitalize">
                        {clientData.clientDetails.clientCategory}
                      </Tag>
                    </Descriptions.Item>
                  )}

                  {clientData.clientDetails.preferredContactMethod && (
                    <Descriptions.Item
                      label={<span className="text-xs sm:text-sm">Preferred Contact</span>}
                    >
                      <Tag color="green" className="text-xs capitalize">
                        {clientData.clientDetails.preferredContactMethod}
                      </Tag>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            </>
          )}
        </Card>

        {/* Account Information */}
        <Card
          title={
            <Space className="text-sm sm:text-base">
              <SafetyCertificateOutlined className="text-green-500" />
              <span>Account Information</span>
            </Space>
          }
          className="shadow-md"
        >
          <Descriptions
            column={{ xs: 1, sm: 2 }}
            size={window.innerWidth < 640 ? "small" : "middle"}
            labelStyle={{ fontWeight: 600 }}
          >
            <Descriptions.Item label={<span className="text-xs sm:text-sm">Status</span>}>
              {getStatusTag(clientData?.isActive, clientData?.isVerified)}
            </Descriptions.Item>

            <Descriptions.Item label={<span className="text-xs sm:text-sm">Member Since</span>}>
              <Text className="text-xs sm:text-sm">
                {clientData?.createdAt
                  ? new Date(clientData.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </Text>
            </Descriptions.Item>

            <Descriptions.Item label={<span className="text-xs sm:text-sm">Last Updated</span>}>
              <Text className="text-xs sm:text-sm">
                {clientData?.updatedAt
                  ? new Date(clientData.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </Text>
            </Descriptions.Item>

            <Descriptions.Item label={<span className="text-xs sm:text-sm">Client ID</span>}>
              <Text code className="text-xs">
                {clientData?._id}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </div>
  );
};

export default ClientDetails;