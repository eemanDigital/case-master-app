import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Typography,
  Card,
  DatePicker,
  Select,
  Row,
  Col,
  Divider,
  Switch,
  Space,
  Tag,
  Tabs,
} from "antd";
import { useParams, useNavigate } from "react-router-dom";
import useHandleSubmit from "../hooks/useHandleSubmit";
import createMaxLengthRule from "../utils/createMaxLengthRule";
import GoBackButton from "../components/GoBackButton";
import { useDataFetch } from "../hooks/useDataFetch";
import { toast } from "react-toastify";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  InboxOutlined,
  UserOutlined,
  FlagOutlined,
  CalendarOutlined,
  FileTextOutlined,
  LinkOutlined,
  WarningOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const DOCUMENT_TYPES = [
  { value: "Court Process", label: "Court Process" },
  { value: "Client Document", label: "Client Document" },
  { value: "Official Correspondence", label: "Official Correspondence" },
  { value: "Legal Notice", label: "Legal Notice" },
  { value: "Contract/Agreement", label: "Contract/Agreement" },
  { value: "Affidavit", label: "Affidavit" },
  { value: "Power of Attorney", label: "Power of Attorney" },
  { value: "Judgement/Order", label: "Judgement/Order" },
  { value: "Petition", label: "Petition" },
  { value: "Correspondence", label: "Correspondence" },
  { value: "Others", label: "Others" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "default" },
  { value: "medium", label: "Medium", color: "blue" },
  { value: "high", label: "High", color: "orange" },
  { value: "urgent", label: "Urgent", color: "red" },
];

const DocumentRecordForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [formData, setFormData] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [responseRequired, setResponseRequired] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  const { allUsers: userOptions, loading: userLoading } = useUserSelectOptions({
    fetchAll: true,
  });

  const { dataFetcher, data, loading, error, setLoading } = useDataFetch();

  useEffect(() => {
    if (isEditMode && id) {
      dataFetcher(`documentRecord/${id}`, "GET");
    }
  }, [id, isEditMode]);

  useEffect(() => {
    if (isEditMode && data?.data?.docRecord) {
      const doc = data.data.docRecord;
      setFormData({
        documentName: doc.documentName,
        documentType: doc.documentType,
        docRef: doc.docRef,
        sender: doc.sender,
        senderAddress: doc.senderAddress,
        senderContact: doc.senderContact,
        recipient: doc.recipient?._id,
        forwardedTo: doc.forwardedTo?._id,
        dateReceived: doc.dateReceived,
        dueDate: doc.dueDate,
        priority: doc.priority,
        tags: doc.tags,
        note: doc.note,
        relatedCase: doc.relatedCase?._id,
        relatedMatter: doc.relatedMatter?._id,
        responseRequired: doc.responseRequired,
        isUrgent: doc.isUrgent,
      });
      setSelectedTags(doc.tags || []);
      setResponseRequired(doc.responseRequired || false);
      setIsUrgent(doc.isUrgent || false);
    }
  }, [data, isEditMode]);

  const {
    form,
    onSubmit,
    loading: submitLoading,
  } = useHandleSubmit(
    isEditMode ? `documentRecord/${id}` : "documentRecord",
    isEditMode ? "patch" : "post",
    undefined,
    undefined,
    () => {
      toast.success(
        isEditMode
          ? "Document updated successfully"
          : "Document record created successfully",
      );
      navigate("/dashboard/record-document-list");
    },
  );

  const handleTagAdd = () => {
    if (tagInput.trim() && !selectedTags.includes(tagInput.trim())) {
      const newTags = [...selectedTags, tagInput.trim()];
      setSelectedTags(newTags);
      form.setFieldsValue({ tags: newTags });
      setTagInput("");
    }
  };

  const handleTagRemove = (tag) => {
    const newTags = selectedTags.filter((t) => t !== tag);
    setSelectedTags(newTags);
    form.setFieldsValue({ tags: newTags });
  };

  if (loading && isEditMode) {
    return <LoadingSpinner />;
  }

  return (
    <Card className="modal-container shadow-lg">
      <GoBackButton />
      <Title level={3} className="mb-6">
        <InboxOutlined className="mr-2" />
        {isEditMode ? "Edit Document Record" : "Add New Document"}
      </Title>

      <Form
        layout="vertical"
        form={form}
        name="document_record_form"
        className="flex flex-col gap-4"
        initialValues={formData}
        onFinish={onSubmit}>
        <Tabs
          defaultActiveKey="basic"
          items={[
            {
              key: "basic",
              label: (
                <span>
                  <FileTextOutlined /> Basic Information
                </span>
              ),
              children: (
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Document Name"
                      name="documentName"
                      rules={[
                        {
                          required: true,
                          message: "Please provide document name!",
                        },
                        createMaxLengthRule(
                          100,
                          "Name cannot exceed 100 characters",
                        ),
                      ]}>
                      <Input placeholder="Enter document title/name" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Document Type"
                      name="documentType"
                      rules={[
                        {
                          required: true,
                          message: "Please select document type!",
                        },
                      ]}>
                      <Select
                        placeholder="Select document type"
                        showSearch
                        options={DOCUMENT_TYPES}
                        allowClear
                        className="w-full"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Document Reference"
                      name="docRef"
                      rules={[
                        createMaxLengthRule(
                          100,
                          "Reference cannot exceed 100 characters",
                        ),
                      ]}>
                      <Input placeholder="Enter reference (e.g., Suit No., Case No.)" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Priority"
                      name="priority"
                      initialValue="medium">
                      <Select placeholder="Select priority level">
                        {PRIORITIES.map((p) => (
                          <Option key={p.value} value={p.value}>
                            {p.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Divider orientation="left">Sender Information</Divider>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Sender Name"
                      name="sender"
                      rules={[
                        {
                          required: true,
                          message: "Please provide sender name!",
                        },
                        createMaxLengthRule(
                          200,
                          "Sender name cannot exceed 200 characters",
                        ),
                      ]}>
                      <Input
                        placeholder="Enter sender's name/organization"
                        prefix={<UserOutlined />}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Sender Address"
                      name="senderAddress"
                      rules={[
                        createMaxLengthRule(
                          500,
                          "Address cannot exceed 500 characters",
                        ),
                      ]}>
                      <Input placeholder="Enter sender's address" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Sender Contact"
                      name="senderContact"
                      rules={[
                        createMaxLengthRule(
                          100,
                          "Contact cannot exceed 100 characters",
                        ),
                      ]}>
                      <Input
                        placeholder="Phone/Email"
                        prefix={<UserOutlined />}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Divider orientation="left">Routing Information</Divider>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Initial Recipient"
                      name="recipient"
                      rules={[
                        { required: true, message: "Please select recipient!" },
                      ]}>
                      <Select
                        placeholder="Select initial recipient"
                        options={userOptions}
                        allowClear
                        className="w-full"
                        loading={userLoading}
                        showSearch
                        filterOption={(input, option) =>
                          option.label.toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label="Forwarded To" name="forwardedTo">
                      <Select
                        placeholder="Select person to forward to"
                        options={userOptions}
                        allowClear
                        className="w-full"
                        loading={userLoading}
                        showSearch
                        filterOption={(input, option) =>
                          option.label.toLowerCase().includes(input.toLowerCase())
                        }
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={8}>
                    <Form.Item label="Forward Note" name="forwardNote">
                      <Input placeholder="Note for forwarding" />
                    </Form.Item>
                  </Col>
                </Row>
              ),
            },
            {
              key: "dates",
              label: (
                <span>
                  <CalendarOutlined /> Dates & Status
                </span>
              ),
              children: (
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Date Received"
                      name="dateReceived"
                      rules={[
                        {
                          required: true,
                          message: "Please select date received!",
                        },
                      ]}>
                      <DatePicker showTime style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Response Due Date" name="dueDate">
                      <DatePicker
                        showTime
                        style={{ width: "100%" }}
                        placeholder="Optional"
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Form.Item name="responseRequired" initialValue={false}>
                      <Space>
                        <Switch
                          checked={responseRequired}
                          onChange={(checked) => {
                            setResponseRequired(checked);
                            form.setFieldsValue({ responseRequired: checked });
                          }}
                        />
                        <Text>Response Required</Text>
                      </Space>
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Form.Item name="isUrgent" initialValue={false}>
                      <Space>
                        <Switch
                          checked={isUrgent}
                          onChange={(checked) => {
                            setIsUrgent(checked);
                            form.setFieldsValue({ isUrgent: checked });
                            if (checked) {
                              form.setFieldsValue({ priority: "urgent" });
                            }
                          }}
                        />
                        <Text type="danger">
                          <WarningOutlined className="mr-1" />
                          Mark as Urgent
                        </Text>
                      </Space>
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Divider orientation="left">Tags</Divider>
                  </Col>

                  <Col xs={24}>
                    <Form.Item label="Tags" name="tags">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedTags.map((tag) => (
                          <Tag
                            key={tag}
                            closable
                            onClose={() => handleTagRemove(tag)}
                            color="blue">
                            {tag}
                          </Tag>
                        ))}
                      </div>
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onPressEnter={handleTagAdd}
                        placeholder="Type and press Enter to add tags"
                        suffix={
                          <Button
                            type="link"
                            onClick={handleTagAdd}
                            size="small">
                            Add
                          </Button>
                        }
                      />
                    </Form.Item>
                  </Col>
                </Row>
              ),
            },
            {
              key: "case",
              label: (
                <span>
                  <LinkOutlined /> Related Case/Matter
                </span>
              ),
              children: (
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Related Case" name="relatedCase">
                      <Input placeholder="Enter related case ID (optional)" />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Related Matter" name="relatedMatter">
                      <Input placeholder="Enter related matter ID (optional)" />
                    </Form.Item>
                  </Col>
                </Row>
              ),
            },
            {
              key: "notes",
              label: (
                <span>
                  <FileTextOutlined /> Notes
                </span>
              ),
              children: (
                <Row gutter={[16, 0]}>
                  <Col xs={24}>
                    <Form.Item
                      label="Note"
                      name="note"
                      rules={[
                        createMaxLengthRule(
                          2000,
                          "Note cannot exceed 2000 characters",
                        ),
                      ]}>
                      <TextArea
                        rows={6}
                        placeholder="Enter any additional notes about this document..."
                        showCount
                        maxLength={2000}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              ),
            },
          ]}
        />

        <Divider />

        <Form.Item className="mb-0">
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitLoading}
              size="large">
              {isEditMode ? "Update Document" : "Save Document"}
            </Button>
            <Button
              size="large"
              onClick={() => navigate("/dashboard/record-document-list")}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default DocumentRecordForm;
