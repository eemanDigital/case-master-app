import React, { memo, useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Row,
  Col,
  Divider,
  Switch,
  InputNumber,
  Alert,
  Steps,
  Space,
  Typography,
} from "antd";
import { SaveOutlined, LoadingOutlined } from "@ant-design/icons";
import { MATTER_CONFIG } from "../../../config/matterConfig";
import UserSelect from "../../UserSelect";
import DynamicArraysSection from "./DynamicArraysSection";
import ContactPersonsSection from "./ContactPersonsSection";
import MatterTypeSpecificForm from "./MatterTypeSpecificForm";
import { useMatterForm } from "../../../hooks/useMatters";

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Step } = Steps;

const MatterForm = memo(
  ({
    initialValues = {},
    onSubmit,
    loading = false,
    mode = "create", // 'create' or 'edit'
  }) => {
    const [form] = Form.useForm();
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedMatterType, setSelectedMatterType] = useState(
      initialValues.matterType,
    );

    const { formData, errors, handleChange, validate, reset } =
      useMatterForm(initialValues);

    // Update form when initial values change
    useEffect(() => {
      if (initialValues) {
        form.setFieldsValue(initialValues);
        setSelectedMatterType(initialValues.matterType);
      }
    }, [initialValues, form]);

    const handleFormSubmit = async (values) => {
      if (validate()) {
        await onSubmit(formData);
      }
    };

    const handleMatterTypeChange = (value) => {
      setSelectedMatterType(value);
      handleChange("matterType", value);
    };

    const steps = [
      {
        title: "Basic Info",
        content: (
          <div className="space-y-6">
            <Card title="Basic Information" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="title"
                    label="Matter Title"
                    rules={[
                      { required: true, message: "Title is required" },
                      {
                        max: 500,
                        message: "Title must be less than 500 characters",
                      },
                    ]}
                    validateStatus={errors.title ? "error" : ""}
                    help={errors.title}>
                    <Input
                      placeholder="e.g., Jones v. State Corporation"
                      onChange={(e) => handleChange("title", e.target.value)}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="matterType"
                    label="Matter Type"
                    rules={[
                      { required: true, message: "Matter type is required" },
                    ]}>
                    <Select
                      placeholder="Select matter type"
                      options={MATTER_CONFIG.MATTER_TYPES}
                      onChange={handleMatterTypeChange}
                      allowClear={false}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    name="description"
                    label="Description"
                    rules={[
                      { required: true, message: "Description is required" },
                      {
                        max: 5000,
                        message:
                          "Description must be less than 5000 characters",
                      },
                    ]}>
                    <TextArea
                      rows={4}
                      placeholder="Brief description of the matter..."
                      onChange={(e) =>
                        handleChange("description", e.target.value)
                      }
                    />
                  </Form.Item>
                </Col>

                {selectedMatterType && (
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="natureOfMatter"
                      label="Nature of Matter"
                      rules={[
                        {
                          required: true,
                          message: "Nature of matter is required",
                        },
                      ]}>
                      <Select
                        placeholder="Select nature"
                        options={
                          MATTER_CONFIG.NATURE_OF_MATTER[selectedMatterType] ||
                          []
                        }
                        showSearch
                        filterOption={(input, option) =>
                          option?.label
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                      />
                    </Form.Item>
                  </Col>
                )}

                {selectedMatterType === "litigation" && (
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="category"
                      label="Category"
                      rules={[
                        {
                          required: true,
                          message: "Category is required for litigation",
                        },
                      ]}>
                      <Select
                        placeholder="Select category"
                        options={MATTER_CONFIG.CATEGORIES}
                      />
                    </Form.Item>
                  </Col>
                )}
              </Row>
            </Card>

            <Card title="Parties Involved" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="client"
                    label="Client"
                    rules={[{ required: true, message: "Client is required" }]}>
                    <UserSelect placeholder="Select Client" userType="client" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="accountOfficer"
                    label="Account Officers"
                    rules={[
                      {
                        required: true,
                        message: "At least one account officer is required",
                      },
                    ]}>
                    <UserSelect
                      placeholder="Select Account Officers"
                      userType="staff"
                      mode="multiple"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left" plain>
                Opposing Parties
              </Divider>
              <DynamicArraysSection
                fieldName="opposingParties"
                label="Opposing Parties"
                placeholder="Enter opposing party name"
              />
            </Card>
          </div>
        ),
      },
      {
        title: "Details & Strategy",
        content: (
          <div className="space-y-6">
            <Card title="Strategic Analysis" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <DynamicArraysSection
                    fieldName="objectives"
                    label="Objectives"
                    placeholder="Enter objective"
                    rules={[
                      { required: true, message: "Objective is required" },
                    ]}
                  />
                </Col>

                <Col xs={24}>
                  <DynamicArraysSection
                    fieldName="strengths"
                    label="Strengths"
                    placeholder="Enter strength"
                  />
                </Col>

                <Col xs={24}>
                  <DynamicArraysSection
                    fieldName="weaknesses"
                    label="Weaknesses"
                    placeholder="Enter weakness"
                  />
                </Col>

                <Col xs={24}>
                  <DynamicArraysSection
                    fieldName="risks"
                    label="Risks"
                    placeholder="Enter risk"
                  />
                </Col>

                <Col xs={24}>
                  <DynamicArraysSection
                    fieldName="stepsToBeTaken"
                    label="Steps to be Taken"
                    placeholder="Enter step"
                  />
                </Col>
              </Row>
            </Card>

            <Card title="Contact Persons" size="small">
              <ContactPersonsSection />
            </Card>

            {selectedMatterType && (
              <Card
                title={`${selectedMatterType.charAt(0).toUpperCase() + selectedMatterType.slice(1)} Details`}>
                <MatterTypeSpecificForm
                  matterType={selectedMatterType}
                  initialValues={initialValues.detailData}
                />
              </Card>
            )}
          </div>
        ),
      },
      {
        title: "Financial & Settings",
        content: (
          <div className="space-y-6">
            <Card title="Financial Information" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item name="billingType" label="Billing Type">
                    <Select
                      placeholder="Select billing type"
                      options={MATTER_CONFIG.BILLING_TYPES}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="currency" label="Currency">
                    <Select
                      placeholder="Select currency"
                      options={MATTER_CONFIG.CURRENCIES}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="estimatedValue" label="Estimated Value">
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
              </Row>
            </Card>

            <Card title="Dates & Timeline" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item name="dateOpened" label="Date Opened">
                    <DatePicker className="w-full" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="expectedClosureDate"
                    label="Expected Closure Date">
                    <DatePicker className="w-full" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="Settings & Flags" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="priority"
                    label="Priority"
                    rules={[
                      { required: true, message: "Priority is required" },
                    ]}>
                    <Select
                      placeholder="Select priority"
                      options={MATTER_CONFIG.PRIORITY_OPTIONS}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="status"
                    label="Status"
                    rules={[{ required: true, message: "Status is required" }]}>
                    <Select
                      placeholder="Select status"
                      options={MATTER_CONFIG.STATUS_OPTIONS}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="isConfidential"
                    label="Confidential"
                    valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="isFiledByTheOffice"
                    label="Filed by Office"
                    valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="Additional Information" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Form.Item name="generalComment" label="General Comment">
                    <TextArea
                      rows={3}
                      placeholder="Any additional comments..."
                      maxLength={5000}
                      showCount
                    />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item name="internalNotes" label="Internal Notes">
                    <TextArea
                      rows={4}
                      placeholder="Internal notes for firm staff..."
                      maxLength={10000}
                      showCount
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </div>
        ),
      },
    ];

    const next = () => {
      setCurrentStep(currentStep + 1);
    };

    const prev = () => {
      setCurrentStep(currentStep - 1);
    };

    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-8">
          <Title level={2}>
            {mode === "create" ? "Create New Matter" : "Edit Matter"}
          </Title>
          <Text type="secondary">
            {mode === "create"
              ? "Fill in the details below to create a new legal matter"
              : "Update the matter details below"}
          </Text>
        </div>

        <Steps current={currentStep} className="mb-8">
          {steps.map((step) => (
            <Step key={step.title} title={step.title} />
          ))}
        </Steps>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          className="space-y-6">
          {steps[currentStep].content}

          <div className="flex justify-between pt-6 border-t border-gray-200">
            {currentStep > 0 && <Button onClick={prev}>Previous</Button>}

            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={next}>
                Next
              </Button>
            )}

            {currentStep === steps.length - 1 && (
              <Space>
                {currentStep > 0 && <Button onClick={prev}>Previous</Button>}
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={loading ? <LoadingOutlined /> : <SaveOutlined />}
                  loading={loading}
                  size="large">
                  {mode === "create" ? "Create Matter" : "Update Matter"}
                </Button>
              </Space>
            )}
          </div>
        </Form>
      </div>
    );
  },
);

MatterForm.displayName = "MatterForm";

export default MatterForm;
