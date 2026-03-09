import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Tag,
  Table,
  message,
  Divider,
  Alert,
  Tabs,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  createTemplate,
  getAllTemplates,
} from "../../redux/features/templates/templateSlice";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const categoryOptions = [
  { value: "contract", label: "Contract" },
  { value: "court-process", label: "Court Process" },
  { value: "correspondence", label: "Correspondence" },
  { value: "corporate", label: "Corporate" },
  { value: "conveyancing", label: "Conveyancing" },
  { value: "custom", label: "Custom" },
];

const practiceAreaOptions = [
  { value: "corporate-commercial", label: "Corporate/Commercial" },
  { value: "litigation", label: "Litigation" },
  { value: "property-conveyancing", label: "Property/Conveyancing" },
  { value: "employment-labour", label: "Employment/Labour" },
  { value: "family", label: "Family" },
  { value: "intellectual-property", label: "Intellectual Property" },
  { value: "banking-finance", label: "Banking/Finance" },
  { value: "oil-gas", label: "Oil & Gas" },
  { value: "tax", label: "Tax" },
  { value: "criminal", label: "Criminal" },
  { value: "general", label: "General" },
];

const commonPlaceholders = [
  { key: "PARTY_A_NAME", label: "Party A Name" },
  { key: "PARTY_B_NAME", label: "Party B Name" },
  { key: "PARTY_A_ADDRESS", label: "Party A Address" },
  { key: "PARTY_B_ADDRESS", label: "Party B Address" },
  { key: "DATE", label: "Date" },
  { key: "EFFECTIVE_DATE", label: "Effective Date" },
  { key: "TERM", label: "Term" },
  { key: "AMOUNT", label: "Amount" },
  { key: "GOVERNING_LAW", label: "Governing Law" },
  { key: "SIGNATORY_NAME", label: "Signatory Name" },
  { key: "WITNESS_NAME", label: "Witness Name" },
  { key: "COURT_NAME", label: "Court Name" },
  { key: "SUIT_NUMBER", label: "Suit Number" },
  { key: "PLAINTIFF_NAME", label: "Plaintiff Name" },
  { key: "DEFENDANT_NAME", label: "Defendant Name" },
];

const CreateTemplateModal = ({ visible, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [content, setContent] = useState("");
  const [detectedPlaceholders, setDetectedPlaceholders] = useState([]);
  const [placeholderMetadata, setPlaceholderMetadata] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setContent("");
      setDetectedPlaceholders([]);
      setPlaceholderMetadata([]);
    }
  }, [visible]);

  useEffect(() => {
    const regex = /\{\{([A-Z_][A-Z0-9_]*)\}\}/g;
    const found = new Set();
    let match;
    while ((match = regex.exec(content)) !== null) {
      found.add(match[1]);
    }
    const placeholderKeys = Array.from(found);
    setDetectedPlaceholders(placeholderKeys);

    setPlaceholderMetadata((prev) => {
      const updated = [...prev];
      placeholderKeys.forEach((key) => {
        if (!updated.find((p) => p.key === key)) {
          updated.push({
            key,
            label: key.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
            type: "text",
            required: true,
            hint: "",
          });
        }
      });
      return updated.filter((p) => placeholderKeys.includes(p.key));
    });
  }, [content]);

  const handleInsertPlaceholder = (key) => {
    setContent(content + `{{${key}}}`);
  };

  const handleUpdatePlaceholderMeta = (key, field, value) => {
    setPlaceholderMetadata((prev) =>
      prev.map((p) => (p.key === key ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = async () => {
    try {
      if (!content || content.trim() === "") {
        message.error("Please enter template content");
        return;
      }
      
      const values = await form.validateFields();
      setIsSubmitting(true);

      await dispatch(
        createTemplate({
          ...values,
          content,
          placeholders: placeholderMetadata,
        })
      ).unwrap();

      message.success("Template created successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error || "Failed to create template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const placeholderColumns = [
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      render: (text) => <Text code>{text}</Text>,
      width: 150,
    },
    {
      title: "Label",
      dataIndex: "label",
      key: "label",
      render: (text, record) => (
        <Input
          size="small"
          value={text}
          onChange={(e) => handleUpdatePlaceholderMeta(record.key, "label", e.target.value)}
        />
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type, record) => (
        <Select
          size="small"
          value={type}
          onChange={(value) => handleUpdatePlaceholderMeta(record.key, "type", value)}
          style={{ width: 100 }}
        >
          <Select.Option value="text">Text</Select.Option>
          <Select.Option value="textarea">TextArea</Select.Option>
          <Select.Option value="date">Date</Select.Option>
          <Select.Option value="number">Number</Select.Option>
          <Select.Option value="currency">Currency</Select.Option>
        </Select>
      ),
    },
    {
      title: "Required",
      dataIndex: "required",
      key: "required",
      render: (required, record) => (
        <Select
          size="small"
          value={required ? "true" : "false"}
          onChange={(value) => handleUpdatePlaceholderMeta(record.key, "required", value === "true")}
          style={{ width: 80 }}
        >
          <Select.Option value="true">Yes</Select.Option>
          <Select.Option value="false">No</Select.Option>
        </Select>
      ),
    },
    {
      title: "Hint",
      dataIndex: "hint",
      key: "hint",
      render: (hint, record) => (
        <Input
          size="small"
          value={hint}
          onChange={(e) => handleUpdatePlaceholderMeta(record.key, "hint", e.target.value)}
          placeholder="Helper text"
        />
      ),
    },
  ];

  const renderContentTab = () => (
    <div>
      <TextArea
        rows={20}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter your template content here. Use {{PLACEHOLDER_NAME}} for dynamic fields."
        style={{ fontFamily: "monospace" }}
      />

      <Alert
        message={`Placeholders detected: ${detectedPlaceholders.length}`}
        type="info"
        showIcon
        style={{ marginBottom: 16, marginTop: 16 }}
      />

      <Divider>Quick Insert</Divider>
      <Space wrap>
        {commonPlaceholders.map((ph) => (
          <Button
            key={ph.key}
            size="small"
            onClick={() => handleInsertPlaceholder(ph.key)}
          >
            {`{{${ph.key}}}`}
          </Button>
        ))}
      </Space>
    </div>
  );

  const renderMetadataTab = () => (
    <Table
      columns={placeholderColumns}
      dataSource={placeholderMetadata}
      rowKey="key"
      pagination={false}
      size="small"
    />
  );

  const renderPreviewTab = () => {
    let preview = content;
    placeholderMetadata.forEach((ph) => {
      const regex = new RegExp(`\\{\\{${ph.key}\\}\\}`, "g");
      preview = preview.replace(
        regex,
        `<span style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px;">[${ph.label}]</span>`
      );
    });

    return (
      <div
        style={{
          background: "#fff",
          padding: 40,
          minHeight: 400,
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: 14,
          lineHeight: 1.8,
          border: "1px solid #e8e8e8",
        }}
        dangerouslySetInnerHTML={{ __html: preview }}
      />
    );
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={900}
      title="Create Custom Template"
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} loading={isSubmitting}>
          Create Template
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: "Please enter template title" }]}
            >
              <Input placeholder="Enter template title" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: "Please select category" }]}
            >
              <Select placeholder="Select category" options={categoryOptions} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="subcategory" label="Subcategory">
              <Input placeholder="e.g., employment, property" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="practiceArea" label="Practice Area">
              <Select placeholder="Select practice area" options={practiceAreaOptions} allowClear />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="Description">
          <TextArea rows={2} placeholder="Brief description of the template" />
        </Form.Item>

        <Form.Item name="governingLaw" label="Governing Law">
          <Input placeholder="e.g., Laws of Lagos State, CAMA 2020" />
        </Form.Item>

        <Form.Item name="tags" label="Tags">
          <Select mode="tags" placeholder="Add tags" />
        </Form.Item>

        <Tabs
          items={[
            {
              key: "content",
              label: `Content (${detectedPlaceholders.length} placeholders)`,
              children: renderContentTab(),
            },
            {
              key: "metadata",
              label: "Placeholder Metadata",
              children: renderMetadataTab(),
            },
            {
              key: "preview",
              label: "Preview",
              children: renderPreviewTab(),
            },
          ]}
        />
      </Form>
    </Modal>
  );
};

export default CreateTemplateModal;
