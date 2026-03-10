import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Modal,
  Steps,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Space,
  Typography,
  Card,
  Tag,
  message,
  Spin,
  Alert,
  Row,
  Col,
} from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  generateDocument,
  selectIsGenerating,
  selectSelectedDocument,
  selectSelectedTemplate,
} from "../../redux/features/templates/templateSlice";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const categoryLabels = {
  contract: "Contract",
  "court-process": "Court Process",
  correspondence: "Correspondence",
  corporate: "Corporate",
  conveyancing: "Conveyancing",
  custom: "Custom",
};

const GenerateDocumentModal = ({ visible, template, onClose }) => {
  const dispatch = useDispatch();
  const isGenerating = useSelector(selectIsGenerating);
  const generatedDoc = useSelector(selectSelectedDocument);
  const { matters } = useSelector((state) => state.matter);
  const { users: clients } = useSelector((state) => state.auth);
  const [form] = Form.useForm();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMatter, setSelectedMatter] = useState(null);
  const [filledData, setFilledData] = useState({});

  useEffect(() => {
    if (visible && template) {
      setFilledData({});
      setCurrentStep(0);
      form.resetFields();
    }
  }, [visible, template]);

  useEffect(() => {
    if (generatedDoc && currentStep === 2) {
    }
  }, [generatedDoc, currentStep]);

  if (!template) return null;

  const placeholderFields = template.placeholders || [];

  const renderStep1 = () => (
    <Form form={form} layout="vertical">
      <Form.Item
        name="title"
        label="Document Title"
        rules={[{ required: true, message: "Please enter document title" }]}
        initialValue={`${template.title} - ${dayjs().format("DD/MM/YYYY")}`}
      >
        <Input placeholder="Enter document title" />
      </Form.Item>

      <Form.Item name="matterId" label="Link to Matter (Optional)">
        <Select
          placeholder="Select a matter"
          showSearch
          optionFilterProp="children"
          allowClear
          onChange={(value) => {
            const matter = matters?.find((m) => m._id === value);
            setSelectedMatter(matter);
          }}
        >
          {matters?.map((matter) => (
            <Select.Option key={matter._id} value={matter._id}>
              {matter.matterNumber} - {matter.title || matter.matterType}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="clientId" label="Link to Client (Optional)">
        <Select
          placeholder="Select a client"
          showSearch
          optionFilterProp="children"
          allowClear
        >
          {clients?.map((client) => (
            <Select.Option key={client._id} value={client._id}>
              {client.firstName} {client.lastName}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  );

  const renderStep2 = () => {
    const partyFields = placeholderFields.filter((p) =>
      ["NAME", "ADDRESS"].some((suffix) => p.key.includes(suffix))
    );
    const courtFields = placeholderFields.filter((p) =>
      ["COURT", "SUIT", "CASE"].some((suffix) => p.key.includes(suffix))
    );
    const dateFields = placeholderFields.filter((p) => p.key.includes("DATE") || p.type === "date");
    const financialFields = placeholderFields.filter(
      (p) => p.type === "currency" || p.key.includes("AMOUNT") || p.key.includes("FEE") || p.key.includes("RATE")
    );
    const otherFields = placeholderFields.filter(
      (p) =>
        !partyFields.includes(p) &&
        !courtFields.includes(p) &&
        !dateFields.includes(p) &&
        !financialFields.includes(p)
    );

    const renderField = (field) => {
      const commonProps = {
        key: field.key,
        name: ["filledData", field.key],
        label: field.label,
        rules: field.required ? [{ required: true, message: `${field.label} is required` }] : [],
        tooltip: field.hint,
      };

      if (field.type === "textarea") {
        return (
          <Form.Item {...commonProps}>
            <TextArea rows={3} placeholder={field.hint} />
          </Form.Item>
        );
      }

      if (field.type === "date") {
        return (
          <Form.Item {...commonProps}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
        );
      }

      if (field.type === "number") {
        return (
          <Form.Item {...commonProps}>
            <InputNumber style={{ width: "100%" }} placeholder={field.hint} />
          </Form.Item>
        );
      }

      if (field.type === "currency") {
        return (
          <Form.Item {...commonProps}>
            <InputNumber
              style={{ width: "100%" }}
              formatter={(value) => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
              placeholder={field.hint}
            />
          </Form.Item>
        );
      }

      if (field.type === "select" && field.options) {
        return (
          <Form.Item {...commonProps}>
            <Select placeholder={field.hint}>
              {field.options.map((opt) => (
                <Select.Option key={opt} value={opt}>
                  {opt}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        );
      }

      return (
        <Form.Item {...commonProps}>
          <Input placeholder={field.hint} />
        </Form.Item>
      );
    };

    const renderFieldGroup = (fields, title) => (
      fields.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ display: "block", marginBottom: 12, color: "#1890ff" }}>
            {title}
          </Text>
          <Row gutter={16}>
            {fields.map((field) => (
              <Col span={12} key={field.key}>
                {renderField(field)}
              </Col>
            ))}
          </Row>
        </div>
      )
    );

    return (
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={24}>
            <Button
              type="link"
              onClick={() => {
                if (selectedMatter) {
                  const matterData = {
                    ...filledData,
                    SUIT_NUMBER: selectedMatter.matterNumber || "",
                    COURT_NAME: selectedMatter.courtName || "High Court of Lagos State",
                    PLAINTIFF_NAME: selectedMatter.parties?.plaintiff || "",
                    DEFENDANT_NAME: selectedMatter.parties?.defendant || "",
                  };
                  setFilledData(matterData);
                  form.setFieldsValue({ filledData: matterData });
                }
              }}
              disabled={!selectedMatter}
            >
              Auto-fill from Matter
            </Button>
          </Col>
        </Row>
        {renderFieldGroup(partyFields, "Party Details")}
        {renderFieldGroup(courtFields, "Court/Case Details")}
        {renderFieldGroup(dateFields, "Dates")}
        {renderFieldGroup(financialFields, "Financial Details")}
        {renderFieldGroup(otherFields, "Other Information")}
      </Form>
    );
  };

  const renderStep3 = () => {
    const formValues = form.getFieldsValue(true);
    const filledData = formValues.filledData || {};
    const data = { ...filledData };

    let content = template.content;
    placeholderFields.forEach((field) => {
      let value = data[field.key] || "";
      if (field.type === "date" && value) {
        value = dayjs(value).format("DD MMMM, YYYY");
      }
      const regex = new RegExp(`\\{\\{${field.key}\\}\\}`, "g");
      content = content.replace(regex, value || `{{${field.key}}}`);
    });

    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const pageCount = Math.ceil(wordCount / 250);

    const unfilledCount = placeholderFields.filter(
      (p) => p.required && !data[p.key]
    ).length;

    return (
      <div>
        <Alert
          message={
            <span>
              Document Preview - {wordCount} words (approx. {pageCount} page(s))
              {unfilledCount > 0 && (
                <Text type="warning" style={{ marginLeft: 8 }}>
                  • {unfilledCount} required field(s) not filled
                </Text>
              )}
            </span>
          }
          type={unfilledCount > 0 ? "warning" : "info"}
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
          Review your document below. Orange highlighted text indicates unfilled optional fields.
        </Text>
        <div
          style={{
            background: "#fff",
            padding: 40,
            minHeight: 400,
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: 14,
            lineHeight: 1.8,
            whiteSpace: "pre-wrap",
            border: "1px solid #e8e8e8",
            maxHeight: 500,
            overflow: "auto",
          }}
        >
          {content}
        </div>
      </div>
    );
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      try {
        await form.validateFields();
        setCurrentStep(1);
      } catch (error) {
        console.error("Validation failed:", error);
      }
    } else if (currentStep === 1) {
      try {
        await form.validateFields();
        setCurrentStep(2);
      } catch (error) {
        console.error("Validation failed:", error);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async (status = "draft") => {
    try {
      // Validate form first
      await form.validateFields();
      
      const values = form.getFieldsValue(true);
      const filledData = values.filledData || {};
      
      await dispatch(
        generateDocument({
          templateId: template._id,
          data: {
            title: values.title,
            matterId: values.matterId,
            clientId: values.clientId,
            filledData: filledData,
            status,
          },
        })
      ).unwrap();
      message.success("Document generated successfully!");
    } catch (error) {
      console.error("Generate error:", error);
      message.error(error?.message || error || "Failed to generate document - please fill all required fields");
    }
  };

  const steps = [
    { 
      title: "Document Setup", 
      description: "Give your document a title and optionally link to a matter or client"
    },
    { 
      title: "Fill Placeholders", 
      description: "Enter the required information for each field"
    },
    { 
      title: "Preview & Generate", 
      description: "Review your completed document and generate it"
    },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={900}
      footer={null}
      title={
        <Space>
          <FileTextOutlined />
          <span>Generate Document from: {template.title}</span>
          <Tag color="blue">{categoryLabels[template.category]}</Tag>
        </Space>
      }
    >
      <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />

      {currentStep === 0 && renderStep1()}
      {currentStep === 1 && renderStep2()}
      {currentStep === 2 && renderStep3()}

      <div style={{ marginTop: 24, textAlign: "right" }}>
        <Space>
          {currentStep > 0 && (
            <Button onClick={handleBack}>Back</Button>
          )}
          {currentStep < 2 ? (
            <Button type="primary" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <>
              <Button onClick={handleBack}>Back</Button>
              <Button onClick={() => handleGenerate("draft")} loading={isGenerating}>
                Save as Draft
              </Button>
              <Button type="primary" onClick={() => handleGenerate("final")} loading={isGenerating}>
                Generate Final Document
              </Button>
            </>
          )}
        </Space>
      </div>
    </Modal>
  );
};

export default GenerateDocumentModal;
