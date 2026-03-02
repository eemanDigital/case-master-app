import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Card,
  Divider,
  Row,
  Col,
  Typography,
  Avatar,
  Space,
  Tag,
  Button,
  Timeline,
  Steps,
  Descriptions,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tabs,
  Empty,
  Badge,
} from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  SendOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  EditOutlined,
  HistoryOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PlusOutlined,
  FlagOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import PageErrorAlert from "../components/PageErrorAlert";
import LoadingSpinner from "../components/LoadingSpinner";
import GoBackButton from "../components/GoBackButton";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import { useDispatch } from "react-redux";
import { putData, postData, patchData } from "../redux/features/delete/deleteSlice";
import { toast } from "react-toastify";
import useUserSelectOptions from "../hooks/useUserSelectOptions";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const STATUS_CONFIG = {
  received: { color: "default", label: "Received", step: 0 },
  acknowledged: { color: "blue", label: "Acknowledged", step: 1 },
  under_review: { color: "processing", label: "Under Review", step: 2 },
  in_progress: { color: "cyan", label: "In Progress", step: 3 },
  pending_action: { color: "orange", label: "Pending Action", step: 3 },
  completed: { color: "green", label: "Completed", step: 4 },
  archived: { color: "gold", label: "Archived", step: 5 },
};

const PRIORITY_CONFIG = {
  low: { color: "default", label: "Low" },
  medium: { color: "blue", label: "Medium" },
  high: { color: "orange", label: "High" },
  urgent: { color: "red", label: "Urgent" },
};

const DocumentRecordDetails = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "details";
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { allUsers: userOptions } = useUserSelectOptions({ fetchAll: true });
  const dispatch = useDispatch();
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [forwardModalVisible, setForwardModalVisible] = useState(false);
  const [noteForm] = Form.useForm();
  const [forwardForm] = Form.useForm();
  const [activityData, setActivityData] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useRedirectLogoutUser("/users/login");

  useEffect(() => {
    if (id) {
      dataFetcher(`documentRecord/${id}`, "GET");
      if (activeTab === "activity") {
        fetchActivityLog();
      }
    }
  }, [id, activeTab]);

  const fetchActivityLog = async () => {
    setActivityLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/v1/documentRecord/${id}/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.status === "success") {
        setActivityData(result.data.activities || []);
      }
    } catch (error) {
      console.error("Failed to fetch activity:", error);
    } finally {
      setActivityLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <PageErrorAlert errorCondition={error} errorMessage={error} />;

  const documentData = data?.data?.docRecord;

  const handleStatusChange = async (newStatus) => {
    try {
      await dispatch(patchData({
        endpoint: `documentRecord/${id}/status`,
        data: { status: newStatus }
      }));
      message.success(`Status updated to ${STATUS_CONFIG[newStatus]?.label}`);
      dataFetcher(`documentRecord/${id}`, "GET");
      fetchActivityLog();
    } catch (error) {
      message.error("Failed to update status");
    }
  };

  const handleAddNote = async (values) => {
    try {
      await dispatch(postData({
        endpoint: `documentRecord/${id}/notes`,
        data: values
      }));
      message.success("Note added successfully");
      setNoteModalVisible(false);
      noteForm.resetFields();
      dataFetcher(`documentRecord/${id}`, "GET");
      fetchActivityLog();
    } catch (error) {
      message.error("Failed to add note");
    }
  };

  const handleForward = async (values) => {
    try {
      await dispatch(postData({
        endpoint: `documentRecord/${id}/forward`,
        data: values
      }));
      message.success("Document forwarded successfully");
      setForwardModalVisible(false);
      forwardForm.resetFields();
      dataFetcher(`documentRecord/${id}`, "GET");
      fetchActivityLog();
    } catch (error) {
      message.error("Failed to forward document");
    }
  };

  const handleRestore = async () => {
    try {
      await dispatch(patchData({ endpoint: `documentRecord/${id}/restore`, data: {} }));
      message.success("Document restored successfully");
      dataFetcher(`documentRecord/${id}`, "GET");
    } catch (error) {
      message.error("Failed to restore document");
    }
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case "created":
        return <PlusOutlined style={{ color: "#52c41a" }} />;
      case "updated":
        return <EditOutlined style={{ color: "#1890ff" }} />;
      case "deleted":
        return <DeleteOutlined style={{ color: "#ff4d4f" }} />;
      case "status_changed":
        return <CheckCircleOutlined style={{ color: "#faad14" }} />;
      case "forwarded":
        return <SendOutlined style={{ color: "#722ed1" }} />;
      case "note_added":
        return <FileTextOutlined style={{ color: "#13c2c2" }} />;
      case "restored":
        return <ReloadOutlined style={{ color: "#52c41a" }} />;
      case "priority_changed":
        return <FlagOutlined style={{ color: "#fa8c16" }} />;
      default:
        return <HistoryOutlined />;
    }
  };

  const renderActivityTimeline = () => {
    if (activityLoading) {
      return <LoadingSpinner />;
    }

    if (!activityData || activityData.length === 0) {
      return <Empty description="No activity recorded yet" />;
    }

    return (
      <Timeline
        mode="left"
        items={activityData.map((activity, index) => ({
          label: (
            <Text type="secondary" className="text-xs">
              {formatDate(activity.createdAt)}
            </Text>
          ),
          children: (
            <Card size="small" key={index} className="mb-2">
              <Space direction="vertical" size={0}>
                <Space>
                  {getActivityIcon(activity.action)}
                  <Text strong>{activity.description}</Text>
                </Space>
                <Text type="secondary" className="text-xs">
                  by {activity.performedBy}
                </Text>
              </Space>
            </Card>
          ),
        }))}
      />
    );
  };

  const renderDetailsTab = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={16}>
        <Card title="Document Information" className="shadow-md mb-4">
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
            <Descriptions.Item label="Document Name" span={2}>
              <Text strong>{documentData?.documentName}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color="blue">{documentData?.documentType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Reference">
              {documentData?.docRef || <Text type="secondary">-</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="Priority">
              <Tag color={PRIORITY_CONFIG[documentData?.priority]?.color}>
                {PRIORITY_CONFIG[documentData?.priority]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Urgent">
              {documentData?.isUrgent ? (
                <Tag color="red" icon={<WarningOutlined />}>Urgent</Tag>
              ) : (
                <Text type="secondary">No</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Tags" span={2}>
              {documentData?.tags?.length > 0 ? (
                <Space wrap>
                  {documentData.tags.map((tag) => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">No tags</Text>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Sender Information" className="shadow-md mb-4">
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
            <Descriptions.Item label="Sender">
              <Text strong>{documentData?.sender}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Contact">
              {documentData?.senderContact || <Text type="secondary">-</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="Address" span={2}>
              {documentData?.senderAddress || <Text type="secondary">-</Text>}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Routing Information" className="shadow-md mb-4">
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
            <Descriptions.Item label="Initial Recipient">
              {documentData?.recipient ? (
                `${documentData.recipient.firstName} ${documentData.recipient.lastName}`
              ) : (
                <Text type="secondary">-</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Forwarded To">
              {documentData?.forwardedTo ? (
                `${documentData.forwardedTo.firstName} ${documentData.forwardedTo.lastName}`
              ) : (
                <Text type="secondary">Not forwarded</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Forward Date" span={2}>
              {documentData?.forwardDate ? (
                formatDate(documentData.forwardDate)
              ) : (
                <Text type="secondary">-</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Forward Note" span={2}>
              {documentData?.forwardNote || <Text type="secondary">-</Text>}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {documentData?.note && (
          <Card title="Note" className="shadow-md mb-4">
            <Paragraph>{documentData.note}</Paragraph>
          </Card>
        )}

        {documentData?.internalNotes?.length > 0 && (
          <Card title="Internal Notes" className="shadow-md mb-4">
            {documentData.internalNotes.map((note, index) => (
              <div key={index} className="mb-3 pb-3 border-b border-gray-200 last:border-0">
                <Space>
                  <Text type="secondary">{formatDate(note.createdAt)}</Text>
                  {note.isPrivate && <Tag color="orange">Private</Tag>}
                </Space>
                <Paragraph className="mt-1 mb-0">{note.content}</Paragraph>
              </div>
            ))}
          </Card>
        )}

        {documentData?.attachments?.length > 0 && (
          <Card title="Attachments" className="shadow-md mb-4">
            {documentData.attachments.map((attachment, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded mb-2">
                <Space>
                  <FileTextOutlined />
                  <Text>{attachment.fileName}</Text>
                  {attachment.fileSize && (
                    <Text type="secondary">({(attachment.fileSize / 1024).toFixed(1)} KB)</Text>
                  )}
                </Space>
                <Button type="link" href={attachment.fileUrl} target="_blank">
                  Download
                </Button>
              </div>
            ))}
          </Card>
        )}
      </Col>

      <Col xs={24} lg={8}>
        <Card title="Status Workflow" className="shadow-md mb-4">
          <Steps
            current={STATUS_CONFIG[documentData?.status]?.step || 0}
            direction="vertical"
            size="small"
            items={[
              { title: "Received", icon: <InboxOutlined /> },
              { title: "Acknowledged", icon: <CheckCircleOutlined /> },
              { title: "Under Review", icon: <ClockCircleOutlined /> },
              { title: "In Progress", icon: <ClockCircleOutlined /> },
              { title: "Completed", icon: <CheckCircleOutlined /> },
            ]}
          />
          <Divider />
          <Space direction="vertical" style={{ width: "100%" }}>
            <Text strong>Change Status:</Text>
            <Select
              value={documentData?.status}
              onChange={handleStatusChange}
              style={{ width: "100%" }}
              options={Object.entries(STATUS_CONFIG).map(([key, config]) => ({
                value: key,
                label: config.label,
              }))}
            />
          </Space>
        </Card>

        <Card title="Dates" className="shadow-md mb-4">
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Date Received">
              {formatDate(documentData?.dateReceived)}
            </Descriptions.Item>
            <Descriptions.Item label="Due Date">
              {documentData?.dueDate ? (
                <Tag color={new Date(documentData.dueDate) < new Date() ? "red" : "default"}>
                  {formatDate(documentData.dueDate)}
                </Tag>
              ) : (
                <Text type="secondary">No due date</Text>
              )}
            </Descriptions.Item>
            {documentData?.acknowledgedAt && (
              <Descriptions.Item label="Acknowledged At">
                {formatDate(documentData.acknowledgedAt)}
              </Descriptions.Item>
            )}
            {documentData?.completedAt && (
              <Descriptions.Item label="Completed At">
                {formatDate(documentData.completedAt)}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Created">
              {formatDate(documentData?.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {formatDate(documentData?.updatedAt)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Actions" className="shadow-md">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Button
              icon={<EditOutlined />}
              onClick={() => setForwardModalVisible(true)}
              block
            >
              Forward Document
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={() => setNoteModalVisible(true)}
              block
            >
              Add Internal Note
            </Button>
            {documentData?.isDeleted && (
              <Popconfirm
                title="Restore this document?"
                onConfirm={handleRestore}
              >
                <Button icon={<ReloadOutlined />} type="primary" block>
                  Restore from Trash
                </Button>
              </Popconfirm>
            )}
          </Space>
        </Card>
      </Col>
    </Row>
  );

  return (
    <div className="p-4">
      <Card className="mb-6 shadow-lg">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <GoBackButton />
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} sm={8} md={6} className="text-center">
              <Avatar
                size={100}
                icon={<FileTextOutlined />}
                className="shadow-md"
                style={{ backgroundColor: documentData?.isUrgent ? "#ff4d4f" : "#1890ff" }}
              />
            </Col>
            <Col xs={24} sm={16} md={18}>
              <Space direction="vertical" size={0}>
                <Title level={2} className="mb-1">{documentData?.documentName}</Title>
                <Space>
                  <Tag color={STATUS_CONFIG[documentData?.status]?.color}>
                    {STATUS_CONFIG[documentData?.status]?.label}
                  </Tag>
                  <Tag color={PRIORITY_CONFIG[documentData?.priority]?.color}>
                    {PRIORITY_CONFIG[documentData?.priority]?.label} Priority
                  </Tag>
                  {documentData?.isUrgent && (
                    <Tag color="red" icon={<WarningOutlined />}>
                      URGENT
                    </Tag>
                  )}
                  {documentData?.isDeleted && (
                    <Tag color="gold">In Trash</Tag>
                  )}
                </Space>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card className="shadow-lg">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setSearchParams({ tab: key })}
          items={[
            {
              key: "details",
              label: (
                <span>
                  <InfoCircleOutlined /> Details
                </span>
              ),
              children: renderDetailsTab(),
            },
            {
              key: "activity",
              label: (
                <span>
                  <HistoryOutlined /> Activity Log
                  {activityData.length > 0 && (
                    <Badge count={activityData.length} size="small" className="ml-2" />
                  )}
                </span>
              ),
              children: renderActivityTimeline(),
            },
          ]}
        />
      </Card>

      <Modal
        title="Add Internal Note"
        open={noteModalVisible}
        onCancel={() => setNoteModalVisible(false)}
        footer={null}
      >
        <Form form={noteForm} layout="vertical" onFinish={handleAddNote}>
          <Form.Item
            name="content"
            label="Note"
            rules={[{ required: true, message: "Please enter a note" }]}
          >
            <TextArea rows={4} placeholder="Enter your note..." showCount maxLength={2000} />
          </Form.Item>
          <Form.Item name="isPrivate" valuePropName="checked" initialValue={true}>
            <Space>
              <input type="checkbox" checked={true} readOnly />
              <Text>Private (only visible to staff)</Text>
            </Space>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Add Note
              </Button>
              <Button onClick={() => setNoteModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Forward Document"
        open={forwardModalVisible}
        onCancel={() => setForwardModalVisible(false)}
        footer={null}
      >
        <Form form={forwardForm} layout="vertical" onFinish={handleForward}>
          <Form.Item
            name="forwardedTo"
            label="Forward To"
            rules={[{ required: true, message: "Please select a recipient" }]}
          >
            <Select
              placeholder="Select recipient"
              options={userOptions}
              showSearch
            />
          </Form.Item>
          <Form.Item name="forwardNote" label="Note (Optional)">
            <TextArea rows={3} placeholder="Add a note for the recipient..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Forward
              </Button>
              <Button onClick={() => setForwardModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentRecordDetails;
