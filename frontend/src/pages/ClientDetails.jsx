import { useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Typography,
  Descriptions,
  Tag,
  Divider,
  Space,
  Row,
  Col,
  Statistic,
  Avatar,
  Badge,
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
} from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import { useAdminHook } from "../hooks/useAdminHook";
import UpdateClientInfo from "./UpdateClientInfo";
import UpdateClientStatus from "./UpDateClientStatus";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";
import GoBackButton from "../components/GoBackButton";

const { Title, Text } = Typography;

const ClientDetails = () => {
  const { id } = useParams();
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { isClient, isSuperOrAdmin } = useAdminHook();

  useEffect(() => {
    dataFetcher(`users/${id}`, "GET");
  }, [id, dataFetcher]);

  if (loading) return <LoadingSpinner />;
  if (error)
    return <PageErrorAlert errorCondition={error} errorMessage={error} />;

  const clientData = data?.data;

  // Calculate client statistics
  const clientStats = {
    totalCases: clientData?.case?.length || 0,
    activeCases: clientData?.case?.filter((c) => c.active)?.length || 0,
    completedCases:
      clientData?.case?.filter((c) => c.caseStatus === "completed")?.length ||
      0,
  };

  const getStatusTag = (isActive, isVerified) => {
    if (!isActive) {
      return (
        <Tag color="red" icon={<ClockCircleOutlined />}>
          Inactive
        </Tag>
      );
    }
    if (isVerified) {
      return (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          Active & Verified
        </Tag>
      );
    }
    return (
      <Tag color="orange" icon={<ClockCircleOutlined />}>
        Pending Verification
      </Tag>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <GoBackButton />
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mt-4">
            <div className="flex items-center gap-4">
              <Badge
                count={clientData?.isActive ? "Active" : "Inactive"}
                color={clientData?.isActive ? "green" : "red"}
                offset={[-20, 60]}>
                <Avatar
                  size={80}
                  src={clientData?.photo}
                  icon={<UserOutlined />}
                  className="border-2 border-white shadow-md"
                />
              </Badge>
              <div>
                <Title level={2} className="mb-1">
                  {clientData?.firstName} {clientData?.secondName}
                </Title>
                <Text type="secondary" className="text-lg">
                  Client ID: {clientData?._id?.substring(0, 8)}...
                </Text>
              </div>
            </div>

            <Space wrap>
              {isClient && (
                <UpdateClientInfo
                  clientData={clientData}
                  buttonProps={{
                    icon: <EditOutlined />,
                    type: "primary",
                    size: "large",
                  }}
                />
              )}
              {isSuperOrAdmin && (
                <UpdateClientStatus
                  clientId={id}
                  clientData={clientData}
                  buttonProps={{
                    size: "large",
                  }}
                />
              )}
            </Space>
          </div>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={8}>
            <Card className="text-center shadow-sm hover:shadow-md transition-shadow">
              <Statistic
                title="Total Cases"
                value={clientStats.totalCases}
                prefix={<FileTextOutlined className="text-blue-500" />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="text-center shadow-sm hover:shadow-md transition-shadow">
              <Statistic
                title="Active Cases"
                value={clientStats.activeCases}
                prefix={<CheckCircleOutlined className="text-green-500" />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="text-center shadow-sm hover:shadow-md transition-shadow">
              <Statistic
                title="Completed Cases"
                value={clientStats.completedCases}
                prefix={
                  <SafetyCertificateOutlined className="text-purple-500" />
                }
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          {/* Personal Information */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <IdcardOutlined className="text-blue-500" />
                  Personal Information
                </span>
              }
              className="shadow-sm h-full">
              <Descriptions column={1} size="middle">
                <Descriptions.Item
                  label={
                    <span className="font-semibold flex items-center gap-2">
                      <UserOutlined /> Full Name
                    </span>
                  }>
                  <Text strong>
                    {clientData?.firstName} {clientData?.secondName || ""}
                  </Text>
                </Descriptions.Item>

                <Descriptions.Item
                  label={
                    <span className="font-semibold flex items-center gap-2">
                      <MailOutlined /> Email Address
                    </span>
                  }>
                  <div className="flex items-center gap-2">
                    {clientData?.email}
                    {clientData?.isVerified && (
                      <Tag
                        color="green"
                        icon={<SafetyCertificateOutlined />}
                        size="small">
                        Verified
                      </Tag>
                    )}
                  </div>
                </Descriptions.Item>

                <Descriptions.Item
                  label={
                    <span className="font-semibold flex items-center gap-2">
                      <PhoneOutlined /> Phone Number
                    </span>
                  }>
                  {clientData?.phone || "Not provided"}
                </Descriptions.Item>

                <Descriptions.Item
                  label={
                    <span className="font-semibold flex items-center gap-2">
                      <EnvironmentOutlined /> Address
                    </span>
                  }>
                  {clientData?.address || "Not provided"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Account & Status Information */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <SafetyCertificateOutlined className="text-green-500" />
                  Account Information
                </span>
              }
              className="shadow-sm h-full">
              <Descriptions column={1} size="middle">
                <Descriptions.Item label="Account Status">
                  {getStatusTag(clientData?.isActive, clientData?.isVerified)}
                </Descriptions.Item>

                <Descriptions.Item label="Member Since">
                  <Text>
                    {clientData?.createdAt
                      ? new Date(clientData.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "N/A"}
                  </Text>
                </Descriptions.Item>

                <Descriptions.Item label="Last Updated">
                  <Text>
                    {clientData?.updatedAt
                      ? new Date(clientData.updatedAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "N/A"}
                  </Text>
                </Descriptions.Item>

                <Descriptions.Item label="Client ID">
                  <Text code className="text-xs">
                    {clientData?._id}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        {/* Cases Section - Uncomment if you have case data */}
        {/* {clientStats.totalCases > 0 && (
          <>
            <Divider />
            <Card
              title={
                <span className="flex items-center gap-2">
                  <FileTextOutlined className="text-purple-500" />
                  Associated Cases ({clientStats.totalCases})
                </span>
              }
              className="shadow-sm mt-6"
            >
              <Row gutter={[16, 16]}>
                {clientData?.case?.map((c, index) => (
                  <Col xs={24} md={12} key={c._id || index}>
                    <Card 
                      size="small" 
                      className="border-l-4 border-blue-500 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <Text strong className="block">
                            {c.caseNumber || `Case ${index + 1}`}
                          </Text>
                          <Text type="secondary" className="text-sm">
                            {c.firstParty?.name[0]?.name} vs {c.secondParty?.name[0]?.name}
                          </Text>
                        </div>
                        <Tag color={c.active ? "blue" : "default"}>
                          {c.caseStatus || 'Active'}
                        </Tag>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </>
        )} */}
      </div>
    </div>
  );
};

export default ClientDetails;
