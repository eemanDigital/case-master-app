import React, { useEffect } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Typography,
} from "antd";
import { MATTER_CONFIG } from "../../../config/matterConfig";

const { TextArea } = Input;
const { Text } = Typography;

const MatterTypeSpecificForm = ({ matterType, initialValues = {}, form }) => {
  // Set initial values when matter type changes
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      form?.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  // Litigation Form
  const renderLitigationForm = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="suitNo"
            label="Suit Number"
            rules={[{ required: true, message: "Suit number is required" }]}>
            <Input placeholder="e.g., CV/2024/123" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="courtName"
            label="Court Name"
            rules={[{ required: true, message: "Court name is required" }]}>
            <Input placeholder="e.g., High Court Lagos" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="judgeName" label="Judge Name">
            <Input placeholder="Name of presiding judge" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="caseStage" label="Case Stage">
            <Select
              placeholder="Select case stage"
              options={MATTER_CONFIG.LITIGATION_STAGES}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="filingDate" label="Filing Date">
            <DatePicker className="w-full" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="nextHearingDate" label="Next Hearing Date">
            <DatePicker className="w-full" />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item name="litigationNotes" label="Case Notes">
            <TextArea rows={3} placeholder="Additional case notes..." />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  // Corporate Form
  const renderCorporateForm = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="companyName"
            label="Company Name"
            rules={[{ required: true, message: "Company name is required" }]}>
            <Input placeholder="e.g., ABC Corporation Ltd" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="registrationNumber"
            label="Registration Number"
            rules={[
              { required: true, message: "Registration number is required" },
            ]}>
            <Input placeholder="e.g., RC 123456" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="transactionType" label="Transaction Type">
            <Select
              placeholder="Select transaction type"
              options={MATTER_CONFIG.CORPORATE_TRANSACTIONS}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="transactionValue" label="Transaction Value">
            <InputNumber
              placeholder="0.00"
              style={{ width: "100%" }}
              min={0}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="regulatoryBody" label="Regulatory Body">
            <Input placeholder="e.g., CAC, SEC, NSE" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="filingDeadline" label="Filing Deadline">
            <DatePicker className="w-full" />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item name="corporateNotes" label="Corporate Notes">
            <TextArea rows={3} placeholder="Additional corporate notes..." />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  // Advisory Form
  const renderAdvisoryForm = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="advisoryType"
            label="Advisory Type"
            rules={[{ required: true, message: "Advisory type is required" }]}>
            <Select
              placeholder="Select advisory type"
              options={MATTER_CONFIG.ADVISORY_TYPES}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="clientType"
            label="Client Type"
            rules={[{ required: true, message: "Client type is required" }]}>
            <Select
              placeholder="Select client type"
              options={MATTER_CONFIG.CLIENT_TYPES}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="jurisdiction" label="Jurisdiction">
            <Input placeholder="e.g., Nigeria, International" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="opinionDeadline" label="Opinion Deadline">
            <DatePicker className="w-full" />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item name="advisoryNotes" label="Advisory Notes">
            <TextArea rows={3} placeholder="Detailed advisory notes..." />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item name="legalIssues" label="Legal Issues">
            <TextArea rows={3} placeholder="Key legal issues addressed..." />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  // Property Form
  const renderPropertyForm = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="propertyAddress"
            label="Property Address"
            rules={[
              { required: true, message: "Property address is required" },
            ]}>
            <Input placeholder="Full property address" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="propertyType"
            label="Property Type"
            rules={[{ required: true, message: "Property type is required" }]}>
            <Select
              placeholder="Select property type"
              options={MATTER_CONFIG.PROPERTY_TYPES}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="transactionType"
            label="Transaction Type"
            rules={[
              { required: true, message: "Transaction type is required" },
            ]}>
            <Select
              placeholder="Select transaction type"
              options={MATTER_CONFIG.PROPERTY_TRANSACTIONS}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="propertyValue" label="Property Value">
            <InputNumber
              placeholder="0.00"
              style={{ width: "100%" }}
              min={0}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="titleNo" label="Title Number">
            <Input placeholder="e.g., LA/123/2024" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="surveyPlanNo" label="Survey Plan Number">
            <Input placeholder="Survey plan number" />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item name="propertyNotes" label="Property Notes">
            <TextArea rows={3} placeholder="Additional property notes..." />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  // Retainer Form
  const renderRetainerForm = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="retainerType"
            label="Retainer Type"
            rules={[{ required: true, message: "Retainer type is required" }]}>
            <Select
              placeholder="Select retainer type"
              options={MATTER_CONFIG.RETAINER_TYPES}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="retainerPeriod"
            label="Retainer Period"
            rules={[
              { required: true, message: "Retainer period is required" },
            ]}>
            <Select
              placeholder="Select period"
              options={[
                { value: "monthly", label: "Monthly" },
                { value: "quarterly", label: "Quarterly" },
                { value: "semi-annual", label: "Semi-Annual" },
                { value: "annual", label: "Annual" },
              ]}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="retainerAmount" label="Retainer Amount">
            <InputNumber
              placeholder="0.00"
              style={{ width: "100%" }}
              min={0}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="retainerStartDate" label="Start Date">
            <DatePicker className="w-full" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="retainerEndDate" label="End Date">
            <DatePicker className="w-full" />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item name="scopeOfWork" label="Scope of Work">
            <TextArea rows={3} placeholder="Detailed scope of work..." />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  // General Form (for general legal matters)
  const renderGeneralForm = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="matterCategory"
            label="General Category"
            rules={[{ required: true, message: "Category is required" }]}>
            <Select
              placeholder="Select category"
              options={
                MATTER_CONFIG.GENERAL_CATEGORIES || [
                  { value: "legal-opinion", label: "Legal Opinion" },
                  { value: "document-review", label: "Document Review" },
                  { value: "negotiation", label: "Negotiation" },
                  { value: "compliance", label: "Compliance" },
                  { value: "other", label: "Other" },
                ]
              }
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="jurisdiction" label="Jurisdiction">
            <Input placeholder="Applicable jurisdiction" />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="serviceType" label="Service Type">
            <Select
              placeholder="Select service type"
              options={[
                { value: "consultation", label: "Consultation" },
                { value: "drafting", label: "Drafting" },
                { value: "review", label: "Review" },
                { value: "representation", label: "Representation" },
              ]}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item name="deliveryDate" label="Delivery Date">
            <DatePicker className="w-full" />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item name="specialInstructions" label="Special Instructions">
            <TextArea rows={3} placeholder="Any special instructions..." />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item name="expectedOutcome" label="Expected Outcome">
            <TextArea rows={3} placeholder="Describe expected outcome..." />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  // Render the appropriate form based on matter type
  const renderFormByType = () => {
    switch (matterType) {
      case "litigation":
        return renderLitigationForm();
      case "corporate":
        return renderCorporateForm();
      case "advisory":
        return renderAdvisoryForm();
      case "property":
        return renderPropertyForm();
      case "retainer":
        return renderRetainerForm();
      case "general":
        return renderGeneralForm();
      default:
        return (
          <div className="text-center py-6">
            <Text type="secondary">
              Select a matter type to see specific fields
            </Text>
          </div>
        );
    }
  };

  return <div className="matter-type-specific-form">{renderFormByType()}</div>;
};

export default MatterTypeSpecificForm;
