import React, { useEffect, useState, memo, useCallback } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Card,
  Row,
  Col,
  Alert,
} from "antd";
import { BankOutlined, FileTextOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { MATTER_CONFIG } from "../../../config/matterConfig";
import {
  COURT_TYPES,
  CASE_STAGES,
  NIGERIAN_STATES,
  DATE_FORMAT,
} from "../../../utils/litigationConstants";
import {
  TRANSACTION_TYPES,
  COMPANY_TYPES,
  PAYMENT_STRUCTURES,
  CURRENCIES as CORPORATE_CURRENCIES,
} from "../../../utils/corporateConstants";

const { TextArea } = Input;
const { Option } = Select;

const MatterTypeSpecificForm = memo(({ matterType, initialValues = {}, form, onChange }) => {
  const handleChange = useCallback(() => {
    if (onChange) onChange();
  }, [onChange]);

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0 && form) {
      const formatted = { ...initialValues };
      const dateFields = ["filingDate", "nextHearingDate", "lastHearingDate", "registrationDate", "expectedClosingDate", "filingDeadline", "opinionDeadline", "retainerStartDate", "retainerEndDate", "deliveryDate"];
      dateFields.forEach((field) => {
        if (formatted[field]) formatted[field] = dayjs(formatted[field]);
      });
      form.setFieldsValue(formatted);
    }
  }, [initialValues, form]);

  const renderLitigationForm = () => (
    <Alert
      type="info"
      icon={<FileTextOutlined />}
      message="Litigation Details"
      description="All litigation information (court, parties, processes, judges, etc.) will be captured in the Litigation Details form after creating this matter."
    />
  );

  const renderCorporateForm = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Form.Item name="companyName" label="Company Name" rules={[{ required: true, message: "Company name is required" }]}>
          <Input placeholder="e.g., ABC Corporation Ltd" onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="registrationNumber" label="Registration Number" rules={[{ required: true, message: "Registration number is required" }]}>
          <Input placeholder="e.g., RC 123456" onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="companyType" label="Company Type">
          <Select placeholder="Select company type" onChange={handleChange}>
            {COMPANY_TYPES.map((type) => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="registrationDate" label="Registration Date">
          <DatePicker className="w-full" onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="transactionType" label="Transaction Type">
          <Select placeholder="Select transaction type" onChange={handleChange}>
            {TRANSACTION_TYPES.map((type) => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="incorporationJurisdiction" label="Jurisdiction">
          <Input placeholder="e.g., Nigeria" onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="regulatoryBody" label="Regulatory Body">
          <Input placeholder="e.g., CAC, SEC, NSE" onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="filingDeadline" label="Filing Deadline">
          <DatePicker className="w-full" onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24}>
        <Form.Item name="corporateNotes" label="Corporate Notes">
          <TextArea rows={3} placeholder="Additional corporate notes..." onChange={handleChange} />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderCorporateFinancial = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Form.Item name="dealValueAmount" label="Transaction/Deal Value">
          <InputNumber placeholder="0.00" style={{ width: "100%" }} min={0} onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="dealValueCurrency" label="Currency">
          <Select placeholder="Select currency" onChange={handleChange}>
            {CORPORATE_CURRENCIES.map((c) => (
              <Option key={c.value} value={c.value}>{c.label}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="paymentStructure" label="Payment Structure">
          <Select placeholder="Select payment structure" onChange={handleChange}>
            {PAYMENT_STRUCTURES.map((p) => (
              <Option key={p.value} value={p.value}>{p.label}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="expectedClosingDate" label="Expected Closing Date">
          <DatePicker className="w-full" onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24}>
        <Form.Item name="paymentTerms" label="Payment Terms">
          <TextArea rows={2} placeholder="Payment terms and conditions..." onChange={handleChange} />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderPropertyForm = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Form.Item name="propertyAddress" label="Property Address" rules={[{ required: true, message: "Property address is required" }]}>
          <Input placeholder="Full property address" onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="propertyType" label="Property Type" rules={[{ required: true, message: "Property type is required" }]}>
          <Select placeholder="Select property type" onChange={handleChange}>
            {MATTER_CONFIG.PROPERTY_TYPES.map((type) => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="transactionType" label="Transaction Type" rules={[{ required: true, message: "Transaction type is required" }]}>
          <Select placeholder="Select transaction type" onChange={handleChange}>
            {MATTER_CONFIG.PROPERTY_TRANSACTIONS.map((type) => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="propertyValue" label="Property Value">
          <InputNumber placeholder="0.00" style={{ width: "100%" }} min={0} onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="titleNo" label="Title Number">
          <Input placeholder="e.g., LA/123/2024" onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="surveyPlanNo" label="Survey Plan Number">
          <Input placeholder="Survey plan number" onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="propertyOwner" label="Property Owner">
          <Input placeholder="Name of property owner" onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="landSize" label="Land Size (sq meters)">
          <InputNumber placeholder="e.g., 500" style={{ width: "100%" }} min={0} onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24}>
        <Form.Item name="propertyNotes" label="Property Notes">
          <TextArea rows={3} placeholder="Additional property notes..." onChange={handleChange} />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderAdvisoryForm = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Form.Item name="advisoryType" label="Advisory Type" rules={[{ required: true, message: "Advisory type is required" }]}>
          <Select placeholder="Select advisory type" onChange={handleChange}>
            {MATTER_CONFIG.ADVISORY_TYPES?.map((type) => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            )) || [
              { value: "legal-opinion", label: "Legal Opinion" },
              { value: "regulatory-compliance", label: "Regulatory Compliance" },
              { value: "due-diligence", label: "Due Diligence" },
              { value: "contract-review", label: "Contract Review" },
              { value: "legal-research", label: "Legal Research" },
              { value: "policy-development", label: "Policy Development" },
              { value: "other", label: "Other" },
            ].map(type => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="clientType" label="Client Type" rules={[{ required: true, message: "Client type is required" }]}>
          <Select placeholder="Select client type" onChange={handleChange}>
            {MATTER_CONFIG.CLIENT_TYPES.map((type) => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="jurisdiction" label="Jurisdiction">
          <Input placeholder="e.g., Nigeria, International" onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="opinionDeadline" label="Opinion/Deliverable Deadline">
          <DatePicker className="w-full" onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24}>
        <Form.Item name="legalIssues" label="Legal Issues">
          <TextArea rows={3} placeholder="Key legal issues to be addressed..." onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24}>
        <Form.Item name="advisoryNotes" label="Advisory Notes">
          <TextArea rows={3} placeholder="Detailed advisory notes..." onChange={handleChange} />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderRetainerForm = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Form.Item name="retainerType" label="Retainer Type" rules={[{ required: true, message: "Retainer type is required" }]}>
          <Select placeholder="Select retainer type" onChange={handleChange}>
            {MATTER_CONFIG.RETAINER_TYPES?.map((type) => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            )) || [
              { value: "general-retainer", label: "General Retainer" },
              { value: "general-legal-services", label: "General Legal Services" },
              { value: "notarial-services", label: "Notarial Services" },
              { value: "documentation", label: "Documentation" },
              { value: "other", label: "Other" },
            ].map(type => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="retainerPeriod" label="Retainer Period" rules={[{ required: true, message: "Retainer period is required" }]}>
          <Select placeholder="Select period" onChange={handleChange}>
            <Option value="monthly">Monthly</Option>
            <Option value="quarterly">Quarterly</Option>
            <Option value="semi-annual">Semi-Annual</Option>
            <Option value="annual">Annual</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="retainerAmount" label="Retainer Amount">
          <InputNumber placeholder="0.00" style={{ width: "100%" }} min={0} onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="currency" label="Currency">
          <Select placeholder="Select currency" onChange={handleChange}>
            {MATTER_CONFIG.CURRENCIES.map((c) => (
              <Option key={c.value} value={c.value}>{c.label}</Option>
            ))}
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="retainerStartDate" label="Start Date">
          <DatePicker className="w-full" onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="retainerEndDate" label="End Date">
          <DatePicker className="w-full" onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24}>
        <Form.Item name="scopeOfWork" label="Scope of Work">
          <TextArea rows={3} placeholder="Detailed scope of work..." onChange={handleChange} />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderGeneralForm = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Form.Item name="matterCategory" label="General Category" rules={[{ required: true, message: "Category is required" }]}>
          <Select placeholder="Select category" onChange={handleChange}>
            <Option value="legal-opinion">Legal Opinion</Option>
            <Option value="document-review">Document Review</Option>
            <Option value="negotiation">Negotiation</Option>
            <Option value="compliance">Compliance</Option>
            <Option value="other">Other</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="jurisdiction" label="Jurisdiction">
          <Input placeholder="Applicable jurisdiction" onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="serviceType" label="Service Type">
          <Select placeholder="Select service type" onChange={handleChange}>
            <Option value="consultation">Consultation</Option>
            <Option value="drafting">Drafting</Option>
            <Option value="review">Review</Option>
            <Option value="representation">Representation</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="deliveryDate" label="Delivery Date">
          <DatePicker className="w-full" onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24}>
        <Form.Item name="specialInstructions" label="Special Instructions">
          <TextArea rows={3} placeholder="Any special instructions..." onChange={handleChange} />
        </Form.Item>
      </Col>
      <Col xs={24}>
        <Form.Item name="expectedOutcome" label="Expected Outcome">
          <TextArea rows={3} placeholder="Describe expected outcome..." onChange={handleChange} />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderFormByType = useCallback(() => {
    switch (matterType) {
      case "litigation": return renderLitigationForm();
      case "corporate": return renderCorporateForm();
      case "property": return renderPropertyForm();
      case "advisory": return renderAdvisoryForm();
      case "retainer": return renderRetainerForm();
      case "general": return renderGeneralForm();
      default:
        return (
          <div className="text-center py-6">
            <span className="text-gray-500">Select a matter type to see specific fields</span>
          </div>
        );
    }
  }, [matterType, handleChange]);

  return <div className="matter-type-specific-form">{renderFormByType()}</div>;
});

MatterTypeSpecificForm.displayName = "MatterTypeSpecificForm";

export default MatterTypeSpecificForm;
