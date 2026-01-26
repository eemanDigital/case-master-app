import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Descriptions,
  Tabs,
  Timeline,
  Avatar,
  Typography,
  Divider,
  Badge,
  Spin,
  Alert,
  Modal,
  Grid,
  Input,
  Statistic,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PrinterOutlined,
  ShareAltOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
  TeamOutlined,
  EyeOutlined,
  PaperClipOutlined,
  FolderOutlined,
  ClockCircleOutlined,
  SafetyOutlined,

  CheckCircleOutlined,
  CloseCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "../../providers/ThemeProvider";
import {
  getMatter,
  deleteMatter,
} from "../../redux/features/matter/matterSlice";
import { format } from "date-fns";
import {
  MATTER_CONFIG,
  formatCurrency,
  getStatusColor,
} from "../../config/matterConfig";

const {TextArea} = Input;

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

const MatterDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme();
  const screens = useBreakpoint();

  const {
    matter: matterDetails,
    isLoading,
    isError,
    message: errorMessage,
  } = useSelector((state) => state.matter);

  const matter = matterDetails?.matter;

  const [activeTab, setActiveTab] = useState("overview");
  const [showMoreActions, setShowMoreActions] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(getMatter(id));
    }
  }, [id, dispatch]);

  const handleDelete = () => {
    Modal.confirm({
      title: "Delete Matter",
      content:
        "Are you sure you want to delete this matter? This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await dispatch(deleteMatter(id)).unwrap();
          navigate("/dashboard/matters");
        } catch (error) {
          console.error("Failed to delete matter:", error);
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !matter) {
    return (
      <div className="p-4 md:p-6">
        <Alert
          message="Error"
          description={errorMessage || "Failed to load matter details"}
          type="error"
          showIcon
          action={
            <Button
              type="primary"
              onClick={() => navigate("/dashboard/matters")}
              size={screens.xs ? "middle" : "default"}>
              Back to Matters
            </Button>
          }
        />
      </div>
    );
  }

  const getPriorityBadge = (priority) => {
    const priorityConfig = MATTER_CONFIG.PRIORITY_OPTIONS.find(
      (p) => p.value === priority,
    );
    return (
      <Badge
        color={priorityConfig?.color}
        text={
          <span className="capitalize font-medium">
            {priorityConfig?.label || priority}
          </span>
        }
      />
    );
  };

  const getStatusBadge = (status) => {
    return (
      <Tag
        color={getStatusColor(status)}
        className="capitalize font-medium px-2 py-1 text-xs md:text-sm">
        {status}
      </Tag>
    );
  };

  const getDaysDifference = (date) => {
    if (!date) return null;
    const today = new Date();
    const targetDate = new Date(date);
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysToClosure = matter.expectedClosureDate
    ? getDaysDifference(matter.expectedClosureDate)
    : null;
  const isOverdue = daysToClosure !== null && daysToClosure < 0;

  // Responsive action buttons
  const renderActionButtons = () => {
    if (screens.xs || screens.sm) {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/dashboard/matters/${id}/edit`)}
              block
              size="small">
              Edit
            </Button>
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={handleDelete}
              block
              size="small">
              Delete
            </Button>
          </div>
          <Button
            type="text"
            icon={<MoreOutlined />}
            onClick={() => setShowMoreActions(!showMoreActions)}
            className="text-xs">
            More Actions
          </Button>
          {showMoreActions && (
            <div className="flex flex-wrap gap-2 mt-2">
              <Button icon={<DownloadOutlined />} size="small">
                Export
              </Button>
              <Button icon={<PrinterOutlined />} size="small">
                Print
              </Button>
              <Button icon={<ShareAltOutlined />} size="small">
                Share
              </Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <Space wrap>
        <Button
          icon={<EditOutlined />}
          onClick={() => navigate(`/dashboard/matters/${id}/edit`)}>
          Edit
        </Button>
        <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>
          Delete
        </Button>
        <Button icon={<DownloadOutlined />}>Export</Button>
        <Button icon={<PrinterOutlined />}>Print</Button>
        <Button icon={<ShareAltOutlined />}>Share</Button>
      </Space>
    );
  };

  // Responsive description columns
  const getDescriptionColumns = () => {
    if (screens.xs) return 1;
    if (screens.sm) return 2;
    return 2;
  };

  return (
    <div className={`p-2 sm:p-4 md:p-6 ${isDarkMode ? "dark" : ""}`}>
      {/* Header with Actions - Mobile Optimized */}
      <Card
        className={`mb-4 sm:mb-6 ${
          isDarkMode ? "dark:bg-gray-800 dark:border-gray-700" : ""
        }`}
        bodyStyle={{ padding: screens.xs ? "16px 12px" : "24px" }}>
        <div className="flex flex-col gap-4">
          {/* Back button and title row */}
          <div className="flex items-center gap-3">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/dashboard/matters")}
              type="text"
              size={screens.xs ? "small" : "default"}
              className="flex-shrink-0">
              {screens.xs ? "" : "Back"}
            </Button>
            <div className="flex-1 min-w-0">
              <Title
                level={screens.xs ? 4 : 2}
                className={`mb-1 truncate ${
                  isDarkMode ? "dark:text-gray-100" : ""
                }`}>
                {matter.title}
              </Title>
              <div className="flex flex-wrap items-center gap-2">
                <Text
                  type="secondary"
                  className={`text-xs sm:text-sm ${
                    isDarkMode ? "dark:text-gray-400" : ""
                  }`}>
                  <code className="font-mono">{matter.matterNumber}</code>
                </Text>
                <Tag
                  color={
                    MATTER_CONFIG.MATTER_TYPES.find(
                      (t) => t.value === matter.matterType,
                    )?.color
                  }
                  className="px-2 py-0.5 text-xs">
                  {matter.matterType}
                </Tag>
                {getStatusBadge(matter.status)}
                {screens.xs ? null : getPriorityBadge(matter.priority)}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="border-t pt-4 dark:border-gray-700">
            {renderActionButtons()}
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <Row gutter={[12, 12]}>
        {/* Left Column - Main Details */}
        <Col xs={24} lg={16}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size={screens.xs ? "small" : "default"}
            className={`${isDarkMode ? "dark-tabs" : ""}`}
            tabPosition={screens.xs ? "top" : "top"}
            type={screens.xs ? "line" : "card"}>
            <TabPane
              tab={
                <span className="flex items-center gap-1">
                  <EyeOutlined className="text-xs sm:text-base" />
                  {screens.xs ? "Overview" : "Overview"}
                </span>
              }
              key="overview">
              {/* Case Information Card - Mobile Optimized */}
              <Card
                className={`mb-4 sm:mb-6 ${
                  isDarkMode ? "dark:bg-gray-800 dark:border-gray-700" : ""
                }`}
                title={
                  <span className="text-sm sm:text-base">Case Information</span>
                }
                bodyStyle={{ padding: screens.xs ? "12px" : "24px" }}>
                {/* Mobile-friendly responsive layout for case info */}
                {screens.xs ? (
                  // Mobile view: Vertical list
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Text strong className="block text-sm">
                        Title
                      </Text>
                      <Text className={isDarkMode ? "dark:text-gray-300" : ""}>
                        {matter.title}
                      </Text>
                    </div>

                    {matter.description && (
                      <div className="space-y-2">
                        <Text strong className="block text-sm">
                          Description
                        </Text>
                        <Paragraph
                          className={`mb-0 text-sm ${
                            isDarkMode ? "dark:text-gray-300" : ""
                          }`}>
                          {matter.description}
                        </Paragraph>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Text strong className="block text-sm">
                          Nature
                        </Text>
                        <Text
                          className={isDarkMode ? "dark:text-gray-300" : ""}>
                          {matter.natureOfMatter}
                        </Text>
                      </div>

                      {matter.category && matter.category !== "n/a" && (
                        <div className="space-y-2">
                          <Text strong className="block text-sm">
                            Category
                          </Text>
                          <Tag color="blue" className="text-xs">
                            {matter.category}
                          </Tag>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Text strong className="text-sm">
                          <CalendarOutlined className="mr-2" />
                          Date Opened
                        </Text>
                        <Text className="text-sm">
                          {matter?.dateOpened
                            ? format(
                                new Date(matter.dateOpened),
                                "MMM dd, yyyy",
                              )
                            : "N/A"}
                        </Text>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <ClockCircleOutlined
                            className={`mr-2 ${
                              isOverdue
                                ? "text-red-500"
                                : daysToClosure <= 7
                                  ? "text-orange-500"
                                  : ""
                            }`}
                          />
                          <Text strong className="text-sm">
                            Expected Closure
                          </Text>
                        </div>
                        <div className="flex flex-col items-end">
                          {matter.expectedClosureDate ? (
                            <>
                              <Text className="text-sm">
                                {format(
                                  new Date(matter.expectedClosureDate),
                                  "MMM dd, yyyy",
                                )}
                              </Text>
                              <Tag
                                color={
                                  isOverdue
                                    ? "red"
                                    : daysToClosure <= 7
                                      ? "orange"
                                      : "green"
                                }
                                className="text-xs mt-1">
                                {isOverdue
                                  ? `Overdue ${Math.abs(daysToClosure)}d`
                                  : `${daysToClosure}d left`}
                              </Tag>
                            </>
                          ) : (
                            <Text className="text-sm">Not set</Text>
                          )}
                        </div>
                      </div>

                      {matter.actualClosureDate && (
                        <div className="flex items-center justify-between">
                          <Text strong className="text-sm">
                            <CalendarOutlined className="mr-2" />
                            Actual Closure
                          </Text>
                          <Text className="text-sm">
                            {format(
                              new Date(matter.actualClosureDate),
                              "MMM dd, yyyy",
                            )}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Desktop/Tablet view: Descriptions component
                  <Descriptions
                    column={getDescriptionColumns()}
                    bordered
                    size="small"
                    labelStyle={{
                      fontWeight: 600,
                      width: screens.sm ? "140px" : "160px",
                    }}
                    className="custom-descriptions">
                    <Descriptions.Item
                      label="Title"
                      span={getDescriptionColumns()}>
                      <Text className={isDarkMode ? "dark:text-gray-300" : ""}>
                        {matter.title}
                      </Text>
                    </Descriptions.Item>

                    {matter.description && (
                      <Descriptions.Item
                        label="Description"
                        span={getDescriptionColumns()}>
                        <Paragraph className="mb-0">
                          {matter.description}
                        </Paragraph>
                      </Descriptions.Item>
                    )}

                    <Descriptions.Item label="Nature of Matter">
                      {matter.natureOfMatter}
                    </Descriptions.Item>

                    {matter.category && matter.category !== "n/a" && (
                      <Descriptions.Item label="Category">
                        <Tag color="blue">{matter.category}</Tag>
                      </Descriptions.Item>
                    )}

                    <Descriptions.Item label="Date Opened">
                      <Space>
                        <CalendarOutlined />
                        {matter?.dateOpened
                          ? format(new Date(matter.dateOpened), "MMMM dd, yyyy")
                          : "N/A"}
                      </Space>
                    </Descriptions.Item>

                    <Descriptions.Item label="Expected Closure">
                      <Space
                        direction={screens.sm ? "vertical" : "horizontal"}
                        align={screens.sm ? "start" : "center"}>
                        <div className="flex items-center gap-2">
                          <ClockCircleOutlined
                            className={
                              isOverdue
                                ? "text-red-500"
                                : daysToClosure <= 7
                                  ? "text-orange-500"
                                  : ""
                            }
                          />
                          {matter.expectedClosureDate
                            ? format(
                                new Date(matter.expectedClosureDate),
                                "MMMM dd, yyyy",
                              )
                            : "Not set"}
                        </div>
                        {matter.expectedClosureDate && (
                          <Tag
                            color={
                              isOverdue
                                ? "red"
                                : daysToClosure <= 7
                                  ? "orange"
                                  : "green"
                            }>
                            {isOverdue
                              ? `Overdue ${Math.abs(daysToClosure)} days`
                              : `${daysToClosure} days remaining`}
                          </Tag>
                        )}
                      </Space>
                    </Descriptions.Item>

                    {matter.actualClosureDate && (
                      <Descriptions.Item label="Actual Closure">
                        <Space>
                          <CalendarOutlined />
                          {format(
                            new Date(matter.actualClosureDate),
                            "MMMM dd, yyyy",
                          )}
                        </Space>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                )}
              </Card>

              {/* Financial Information */}
              {(matter.billingType || matter.estimatedValue) && (
                <Card
                  className={`mb-4 sm:mb-6 ${
                    isDarkMode ? "dark:bg-gray-800 dark:border-gray-700" : ""
                  }`}
                  title={
                    <span className="text-sm sm:text-base">
                      Financial Information
                    </span>
                  }
                  bodyStyle={{ padding: screens.xs ? "12px" : "24px" }}>
                  {screens.xs ? (
                    <div className="space-y-3">
                      {matter.billingType && (
                        <div className="flex justify-between items-center">
                          <Text strong className="text-sm">
                            Billing Type
                          </Text>
                          <Tag color="purple">{matter.billingType}</Tag>
                        </div>
                      )}
                      {matter.estimatedValue && (
                        <div className="flex justify-between items-center">
                          <Text strong className="text-sm">
                            Estimated Value
                          </Text>
                          <Text
                            strong
                            className={
                              isDarkMode
                                ? "dark:text-green-400 text-sm"
                                : "text-green-600 text-sm"
                            }>
                            {formatCurrency(
                              matter.estimatedValue,
                              matter.currency,
                            )}
                          </Text>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Descriptions
                      column={getDescriptionColumns()}
                      bordered
                      size="small">
                      {matter.billingType && (
                        <Descriptions.Item label="Billing Type">
                          <Tag color="purple">{matter.billingType}</Tag>
                        </Descriptions.Item>
                      )}
                      {matter.estimatedValue && (
                        <Descriptions.Item label="Estimated Value">
                          <Space>
                            <DollarOutlined />
                            <Text
                              strong
                              className={
                                isDarkMode
                                  ? "dark:text-green-400"
                                  : "text-green-600"
                              }>
                              {formatCurrency(
                                matter.estimatedValue,
                                matter.currency,
                              )}
                            </Text>
                          </Space>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  )}
                </Card>
              )}

              {/* Objectives & Strategy - Mobile Optimized */}
              {(matter.objectives?.length > 0 ||
                matter.stepsToBeTaken?.length > 0) && (
                <Card
                  className={`mb-4 sm:mb-6 ${
                    isDarkMode ? "dark:bg-gray-800 dark:border-gray-700" : ""
                  }`}
                  title={
                    <span className="text-sm sm:text-base">
                      Strategy & Objectives
                    </span>
                  }
                  bodyStyle={{ padding: screens.xs ? "12px" : "24px" }}>
                  {matter.objectives?.length > 0 && (
                    <div className="mb-4 sm:mb-6">
                      <Title
                        level={screens.xs ? 5 : 4}
                        className={`mb-2 sm:mb-3 ${
                          isDarkMode ? "dark:text-gray-100" : ""
                        }`}>
                        Objectives
                      </Title>
                      <ul className="space-y-1 sm:space-y-2 pl-4">
                        {matter.objectives.map((obj, index) => (
                          <li
                            key={index}
                            className={`${
                              isDarkMode ? "text-gray-300" : ""
                            } text-sm sm:text-base`}>
                            • {obj.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {matter.stepsToBeTaken?.length > 0 && (
                    <div>
                      <Title
                        level={screens.xs ? 5 : 4}
                        className={`mb-2 sm:mb-3 ${
                          isDarkMode ? "dark:text-gray-100" : ""
                        }`}>
                        Steps to be Taken
                      </Title>
                      <Timeline
                        mode={screens.xs ? "left" : "alternate"}
                        pending={screens.xs ? false : undefined}>
                        {matter.stepsToBeTaken.map((step, index) => (
                          <Timeline.Item
                            key={index}
                            dot={<ClockCircleOutlined />}>
                            <Text
                              className={`${
                                isDarkMode ? "text-gray-300" : ""
                              } text-sm sm:text-base`}>
                              {step.name}
                            </Text>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    </div>
                  )}
                </Card>
              )}

              {/* SWOT Analysis - Mobile Optimized */}
              {(matter.strengths?.length > 0 ||
                matter.weaknesses?.length > 0 ||
                matter.risks?.length > 0) && (
                <Card
                  className={`${
                    isDarkMode ? "dark:bg-gray-800 dark:border-gray-700" : ""
                  }`}
                  title={
                    <span className="text-sm sm:text-base">SWOT Analysis</span>
                  }
                  bodyStyle={{ padding: screens.xs ? "12px" : "24px" }}>
                  <Row gutter={[8, 8]}>
                    {matter.strengths?.length > 0 && (
                      <Col xs={24} md={12}>
                        <div className="p-3 sm:p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                          <Title
                            level={screens.xs ? 5 : 4}
                            className="text-green-700 dark:text-green-300 mb-2 text-sm sm:text-base">
                            <CheckCircleOutlined className="mr-2" />
                            Strengths
                          </Title>
                          <ul className="space-y-1">
                            {matter.strengths.map((strength, index) => (
                              <li
                                key={index}
                                className="text-green-600 dark:text-green-400 text-xs sm:text-sm">
                                • {strength.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Col>
                    )}

                    {matter.weaknesses?.length > 0 && (
                      <Col xs={24} md={12}>
                        <div className="p-3 sm:p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                          <Title
                            level={screens.xs ? 5 : 4}
                            className="text-red-700 dark:text-red-300 mb-2 text-sm sm:text-base">
                            <CloseCircleOutlined className="mr-2" />
                            Weaknesses
                          </Title>
                          <ul className="space-y-1">
                            {matter.weaknesses.map((weakness, index) => (
                              <li
                                key={index}
                                className="text-red-600 dark:text-red-400 text-xs sm:text-sm">
                                • {weakness.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Col>
                    )}

                    {matter.risks?.length > 0 && (
                      <Col xs={24}>
                        <div className="p-3 sm:p-4 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                          <Title
                            level={screens.xs ? 5 : 4}
                            className="text-yellow-700 dark:text-yellow-300 mb-2 text-sm sm:text-base">
                            <SafetyOutlined className="mr-2" />
                            Risks
                          </Title>
                          <ul className="space-y-1">
                            {matter.risks.map((risk, index) => (
                              <li
                                key={index}
                                className="text-yellow-600 dark:text-yellow-400 text-xs sm:text-sm">
                                • {risk.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Col>
                    )}
                  </Row>
                </Card>
              )}
            </TabPane>

            {/* Other tabs remain mostly the same but with responsive improvements */}
            <TabPane
              tab={
                <span className="flex items-center gap-1">
                  <TeamOutlined className="text-xs sm:text-base" />
                  {screens.xs ? "Parties" : "Parties"}
                </span>
              }
              key="parties">
              {/* Parties content - make it responsive */}
              <Card
                className={`${
                  isDarkMode ? "dark:bg-gray-800 dark:border-gray-700" : ""
                }`}
                bodyStyle={{ padding: screens.xs ? "12px" : "24px" }}>
                {/* Client Information */}
                <div className="mb-6">
                  <Title
                    level={screens.xs ? 5 : 4}
                    className={`mb-3 ${isDarkMode ? "dark:text-gray-100" : ""}`}>
                    Client
                  </Title>
                  <Card
                    className={`${
                      isDarkMode ? "dark:bg-gray-700" : "bg-gray-50"
                    }`}
                    bodyStyle={{ padding: screens.xs ? "12px" : "16px" }}>
                    <div className="flex items-center gap-3">
                      <Avatar
                        size={screens.xs ? 48 : 64}
                        src={matter.client?.photo}
                        icon={<UserOutlined />}
                        className={isDarkMode ? "bg-blue-900" : "bg-blue-100"}>
                        {matter.client?.firstName?.[0]}
                        {matter.client?.lastName?.[0]}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <Title
                          level={screens.xs ? 5 : 4}
                          className={`mb-1 truncate ${
                            isDarkMode ? "dark:text-gray-100" : ""
                          }`}>
                          {matter.client?.firstName} {matter.client?.lastName}
                        </Title>
                        <Space direction="vertical" size={2}>
                          {matter.client?.email && (
                            <Text
                              type="secondary"
                              className={`flex items-center gap-1 text-xs sm:text-sm ${
                                isDarkMode ? "dark:text-gray-400" : ""
                              }`}>
                              <MailOutlined />
                              {matter.client?.email}
                            </Text>
                          )}
                          {matter.client?.phone && (
                            <Text
                              type="secondary"
                              className={`flex items-center gap-1 text-xs sm:text-sm ${
                                isDarkMode ? "dark:text-gray-400" : ""
                              }`}>
                              <PhoneOutlined />
                              {matter.client?.phone}
                            </Text>
                          )}
                        </Space>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Rest of the parties content with similar responsive adjustments */}
              </Card>
            </TabPane>

            <TabPane
              tab={
                <span className="flex items-center gap-1">
                  <FileTextOutlined className="text-xs sm:text-base" />
                  {screens.xs ? "Docs" : "Documents & Notes"}
                </span>
              }
              key="documents">
              <Card
                className={`${
                  isDarkMode ? "dark:bg-gray-800 dark:border-gray-700" : ""
                }`}
                bodyStyle={{ padding: screens.xs ? "16px" : "24px" }}>
                {/* Upload/View Documents Section */}
                <div className="text-center py-6 sm:py-8 md:py-12">
                  <FileTextOutlined
                    className={`${
                      screens.xs
                        ? "text-3xl"
                        : screens.sm
                          ? "text-4xl"
                          : "text-5xl"
                    } text-gray-400 dark:text-gray-500 mb-3 sm:mb-4`}
                  />
                  <Title
                    level={screens.xs ? 5 : 4}
                    type="secondary"
                    className={`mb-2 sm:mb-3 ${
                      isDarkMode ? "dark:text-gray-300" : ""
                    }`}>
                    Documents Management
                  </Title>
                  <Text
                    type="secondary"
                    className={`mb-4 sm:mb-6 block ${
                      screens.xs ? "text-sm" : ""
                    } ${isDarkMode ? "dark:text-gray-400" : ""}`}>
                    Upload, manage, and organize case documents
                  </Text>
                  <Space
                    direction={screens.xs ? "vertical" : "horizontal"}
                    size={screens.xs ? "small" : "middle"}
                    className="w-full sm:w-auto">
                    <Button
                      type="primary"
                      icon={screens.xs ? <FileTextOutlined /> : null}
                      block={screens.xs}
                      size={screens.xs ? "middle" : "default"}>
                      {screens.xs ? "Upload" : "Upload Document"}
                    </Button>
                    <Button
                      icon={screens.xs ? <EyeOutlined /> : null}
                      block={screens.xs}
                      size={screens.xs ? "middle" : "default"}>
                      {screens.xs ? "View All" : "View All Documents"}
                    </Button>
                  </Space>
                </div>

                {/* Documents List Section - Empty State Example */}
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <Title
                      level={5}
                      className={`m-0 ${isDarkMode ? "dark:text-gray-100" : ""}`}>
                      Recent Documents
                    </Title>
                    <Text
                      type="secondary"
                      className="text-xs sm:text-sm cursor-pointer hover:text-primary">
                      View all
                    </Text>
                  </div>

                  {matter.documents?.length > 0 ? (
                    // Document list when documents exist
                    <Row gutter={[12, 12]}>
                      {matter.documents.slice(0, 3).map((doc, index) => (
                        <Col xs={24} sm={12} md={8} key={index}>
                          <Card
                            size="small"
                            className={`hover:shadow-md transition-shadow cursor-pointer ${
                              isDarkMode
                                ? "dark:bg-gray-700 dark:border-gray-600"
                                : ""
                            }`}
                            bodyStyle={{
                              padding: screens.xs ? "12px" : "16px",
                            }}>
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2 rounded ${
                                  isDarkMode
                                    ? "dark:bg-gray-600"
                                    : "bg-gray-100"
                                }`}>
                                <FileTextOutlined className="text-lg" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Text
                                  strong
                                  className={`block truncate text-sm sm:text-base ${
                                    isDarkMode ? "dark:text-gray-100" : ""
                                  }`}>
                                  {doc.name}
                                </Text>
                                <Text
                                  type="secondary"
                                  className="text-xs sm:text-sm">
                                  {doc.size} • {doc.modified}
                                </Text>
                              </div>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    // Empty document state
                    <Card
                      className={`text-center ${
                        isDarkMode
                          ? "dark:bg-gray-700 dark:border-gray-600"
                          : "bg-gray-50"
                      }`}
                      bodyStyle={{ padding: screens.xs ? "20px" : "40px" }}>
                      <FileTextOutlined className="text-2xl text-gray-300 dark:text-gray-600 mb-3" />
                      <Text type="secondary" className="block mb-4">
                        No documents uploaded yet
                      </Text>
                      <Button
                        type="dashed"
                        size={screens.xs ? "small" : "default"}
                        icon={<FileTextOutlined />}
                        onClick={() => {
                          /* Handle upload */
                        }}>
                        Upload First Document
                      </Button>
                    </Card>
                  )}
                </div>

                {/* General Comment */}
                {matter.generalComment && (
                  <div className="mt-6 sm:mt-8">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <Title
                        level={5}
                        className={`m-0 ${isDarkMode ? "dark:text-gray-100" : ""}`}>
                        General Comment
                      </Title>
                      <Text type="secondary" className="text-xs sm:text-sm">
                        Client-facing
                      </Text>
                    </div>
                    <Card
                      className={`${
                        isDarkMode
                          ? "dark:bg-gray-700 dark:border-gray-600"
                          : "bg-gray-50"
                      }`}
                      bodyStyle={{ padding: screens.xs ? "12px" : "16px" }}>
                      <Paragraph
                        className={`mb-0 ${
                          screens.xs ? "text-sm" : ""
                        } ${isDarkMode ? "dark:text-gray-300" : ""}`}>
                        {matter.generalComment}
                      </Paragraph>
                      {matter.generalCommentUpdatedAt && (
                        <Text
                          type="secondary"
                          className={`block mt-3 ${
                            screens.xs ? "text-xs" : "text-sm"
                          }`}>
                          Last updated:{" "}
                          {format(
                            new Date(matter.generalCommentUpdatedAt),
                            "MMM dd, yyyy",
                          )}
                        </Text>
                      )}
                    </Card>
                  </div>
                )}

                {/* Internal Notes */}
                {matter.internalNotes && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <Title
                        level={5}
                        className={`m-0 ${isDarkMode ? "dark:text-gray-100" : ""}`}>
                        Internal Notes
                      </Title>
                      <Badge
                        count="Internal"
                        size={screens.xs ? "small" : "default"}
                        style={{
                          backgroundColor: isDarkMode ? "#374151" : "#e5e7eb",
                        }}
                        className={isDarkMode ? "dark:text-gray-700" : ""}
                      />
                    </div>
                    <Card
                      className={`${
                        isDarkMode
                          ? "dark:bg-gray-700 dark:border-gray-600"
                          : "bg-gray-50"
                      }`}
                      bodyStyle={{ padding: screens.xs ? "12px" : "16px" }}>
                      <Paragraph
                        className={`mb-0 ${
                          screens.xs ? "text-sm" : ""
                        } ${isDarkMode ? "dark:text-gray-300" : ""}`}>
                        {matter.internalNotes}
                      </Paragraph>
                      <div className="flex items-center justify-between mt-3 sm:mt-4">
                        <Text
                          type="secondary"
                          className={`${screens.xs ? "text-xs" : "text-sm"}`}>
                          Last updated:{" "}
                          {format(
                            new Date(matter.updatedAt),
                            "MMM dd, yyyy HH:mm",
                          )}
                        </Text>
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => {
                            /* Handle edit notes */
                          }}
                          className="text-xs">
                          {screens.xs ? "" : "Edit"}
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Add New Note Section */}
                <div className="mt-6 sm:mt-8 pt-6 border-t dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <Title
                      level={5}
                      className={`m-0 ${isDarkMode ? "dark:text-gray-100" : ""}`}>
                      Add New Note
                    </Title>
                    <Space size="small">
                      <Button
                        size={screens.xs ? "small" : "default"}
                        type={matter.internalNotes ? "default" : "primary"}
                        onClick={() => {
                          /* Handle add internal note */
                        }}>
                        Internal Note
                      </Button>
                      <Button
                        size={screens.xs ? "small" : "default"}
                        type={matter.generalComment ? "default" : "primary"}
                        onClick={() => {
                          /* Handle add general comment */
                        }}>
                        General Comment
                      </Button>
                    </Space>
                  </div>
                  <Card
                    className={`${
                      isDarkMode
                        ? "dark:bg-gray-700 dark:border-gray-600"
                        : "bg-gray-50"
                    }`}
                    bodyStyle={{ padding: screens.xs ? "12px" : "16px" }}>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <div className="flex-1">
                        <TextArea
                          placeholder={
                            screens.xs
                              ? "Type your note here..."
                              : "Type your note here. Markdown is supported..."
                          }
                          rows={screens.xs ? 2 : 3}
                          className={
                            isDarkMode
                              ? "dark:bg-gray-800 dark:text-gray-100"
                              : ""
                          }
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Button
                          type="primary"
                          size={screens.xs ? "middle" : "default"}
                          icon={<FileTextOutlined />}
                          disabled>
                          {screens.xs ? "Save" : "Save Note"}
                        </Button>
                        <Button
                          size={screens.xs ? "middle" : "default"}
                          icon={<PaperClipOutlined />}>
                          {screens.xs ? "Attach" : "Attach File"}
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Tag color="blue" className="text-xs">
                        Internal
                      </Tag>
                      <Tag color="green" className="text-xs">
                        Important
                      </Tag>
                      <Tag color="orange" className="text-xs">
                        Follow-up
                      </Tag>
                      <Tag color="purple" className="text-xs">
                        TODO
                      </Tag>
                    </div>
                  </Card>
                </div>

                {/* Document Statistics (Hidden on mobile) */}
                {!screens.xs && (
                  <div className="mt-8">
                    <Title
                      level={5}
                      className={`mb-4 ${isDarkMode ? "dark:text-gray-100" : ""}`}>
                      Document Statistics
                    </Title>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Total Files"
                          value={matter.documents?.length || 0}
                          prefix={<FileTextOutlined />}
                          className={isDarkMode ? "dark:text-gray-100" : ""}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Total Size"
                          value="15.2 MB"
                          prefix={<FolderOutlined />}
                          className={isDarkMode ? "dark:text-gray-100" : ""}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Last Updated"
                          value="2 days ago"
                          prefix={<ClockCircleOutlined />}
                          className={isDarkMode ? "dark:text-gray-100" : ""}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="Notes"
                          value={2}
                          prefix={<EditOutlined />}
                          className={isDarkMode ? "dark:text-gray-100" : ""}
                        />
                      </Col>
                    </Row>
                  </div>
                )}
              </Card>
            </TabPane>
          </Tabs>
        </Col>

        {/* Right Column - Sidebar - Mobile Optimized */}
        <Col xs={24} lg={8}>
          {/* Quick Stats - Mobile Optimized */}
          <Card
            className={`mb-4 sm:mb-6 ${
              isDarkMode ? "dark:bg-gray-800 dark:border-gray-700" : ""
            }`}
            title={<span className="text-sm sm:text-base">Quick Stats</span>}
            bodyStyle={{ padding: screens.xs ? "12px" : "16px" }}>
            <Space direction="vertical" className="w-full">
              <div className="flex justify-between items-center">
                <Text type="secondary" className="text-xs sm:text-sm">
                  Age
                </Text>
                <Text strong className="text-xs sm:text-sm">
                  {Math.floor(
                    (new Date() - new Date(matter.dateOpened)) /
                      (1000 * 60 * 60 * 24),
                  )}{" "}
                  days
                </Text>
              </div>
              <div className="flex justify-between items-center">
                <Text type="secondary" className="text-xs sm:text-sm">
                  Last Activity
                </Text>
                <Text strong className="text-xs sm:text-sm">
                  {matter.lastActivityDate
                    ? format(new Date(matter.lastActivityDate), "MMM dd")
                    : "None"}
                </Text>
              </div>
              <Divider className="my-2" />
              <div className="flex justify-between items-center">
                <Text type="secondary" className="text-xs sm:text-sm">
                  Confidential
                </Text>
                <Badge
                  status={matter.isConfidential ? "error" : "success"}
                  text={
                    <span className="text-xs sm:text-sm">
                      {matter.isConfidential ? "Yes" : "No"}
                    </span>
                  }
                />
              </div>
              <div className="flex justify-between items-center">
                <Text type="secondary" className="text-xs sm:text-sm">
                  Filed by Office
                </Text>
                <Badge
                  status={matter.isFiledByTheOffice ? "processing" : "default"}
                  text={
                    <span className="text-xs sm:text-sm">
                      {matter.isFiledByTheOffice ? "Yes" : "No"}
                    </span>
                  }
                />
              </div>
              <div className="flex justify-between items-center">
                <Text type="secondary" className="text-xs sm:text-sm">
                  Conflict Checked
                </Text>
                <Badge
                  status={matter.conflictChecked ? "success" : "warning"}
                  text={
                    <span className="text-xs sm:text-sm">
                      {matter.conflictChecked ? "Yes" : "No"}
                    </span>
                  }
                />
              </div>
            </Space>
          </Card>

          {/* Tags - Mobile Optimized */}
          {matter.tags?.length > 0 && (
            <Card
              className={`mb-4 sm:mb-6 ${
                isDarkMode ? "dark:bg-gray-800 dark:border-gray-700" : ""
              }`}
              title={<span className="text-sm sm:text-base">Tags</span>}
              bodyStyle={{ padding: screens.xs ? "12px" : "16px" }}>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {matter.tags.map((tag, index) => (
                  <Tag
                    key={index}
                    color="blue"
                    className="text-xs px-2 py-0.5 mb-1">
                    {tag}
                  </Tag>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Activity - Mobile Optimized */}
          <Card
            className={`${
              isDarkMode ? "dark:bg-gray-800 dark:border-gray-700" : ""
            }`}
            title={
              <span className="text-sm sm:text-base">Recent Activity</span>
            }
            bodyStyle={{ padding: screens.xs ? "12px" : "16px" }}>
            <Timeline>
              <Timeline.Item color="green">
                <Text className="text-xs">Matter created</Text>
                <Text type="secondary" className="text-xs block">
                  {matter?.createdAt
                    ? format(new Date(matter.createdAt), "MMM dd, yyyy HH:mm")
                    : "N/A"}
                </Text>
              </Timeline.Item>
              {matter.updatedAt && matter.updatedAt !== matter.createdAt && (
                <Timeline.Item color="blue">
                  <Text className="text-xs">Last updated</Text>
                  <Text type="secondary" className="text-xs block">
                    {format(new Date(matter.updatedAt), "MMM dd, yyyy HH:mm")}
                  </Text>
                </Timeline.Item>
              )}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MatterDetails;
