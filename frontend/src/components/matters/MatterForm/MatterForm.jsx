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
  message,
  Typography,
} from "antd";
import {
  SaveOutlined,
  LoadingOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { MATTER_CONFIG } from "../../../config/matterConfig";
import useUserSelectOptions from "../../../hooks/useUserSelectOptions";
import DynamicArraysSection from "./DynamicArraysSection";
import ContactPersonsSection from "./ContactPersonsSection";
import MatterTypeSpecificForm from "./MatterTypeSpecificForm";
import dayjs from "dayjs";
import { transformArrayField } from "../../../utils/transformArrayField";

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Step } = Steps;

const MatterForm = memo(
  ({
    initialValues = {},
    onSubmit,
    loading = false,
    mode = "create",
    onCancel = null,
    submitText = null,
    disableSteps = false,
    formRef = null,
    showCancelButton = true,
    apiErrors = {},
    enableAutoSave = false,
    onAutoSave = null,
  }) => {
    const [form] = Form.useForm();
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedMatterType, setSelectedMatterType] = useState(
      initialValues.matterType,
    );
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [autoSaveTimer, setAutoSaveTimer] = useState(null);

    // Use user select hook for clients
    const {
      data: clientOptions,
      loading: clientsLoading,
      error: clientsError,
      refresh: refreshClients,
    } = useUserSelectOptions({
      type: "clients",
      includeInactive: false,
      autoFetch: true,
    });

    // Use user select hook for account officers
    const {
      data: staffOptions,
      loading: staffLoading,
      error: staffError,
    } = useUserSelectOptions({
      type: "staff",
      includeInactive: false,
      autoFetch: true,
    });

    // Filter account officers
    const accountOfficerOptions = React.useMemo(() => {
      if (!staffOptions || !Array.isArray(staffOptions)) return [];

      return staffOptions
        .filter((user) => {
          const isLawyer = user.userType === "lawyer" || user.isLawyer === true;
          const isAdmin =
            user.userType === "admin" || user.userType === "super-admin";
          const hasAccountOfficerRole =
            (user.additionalRoles && user.additionalRoles.includes("admin")) ||
            (user.position &&
              (user.position.toLowerCase().includes("account") ||
                user.position.toLowerCase().includes("officer") ||
                user.position.toLowerCase().includes("partner") ||
                user.position.toLowerCase().includes("associate") ||
                user.position.toLowerCase().includes("principal")));

          return isLawyer || isAdmin || hasAccountOfficerRole;
        })
        .map((user) => ({
          ...user,
          displayText:
            user.userType === "lawyer" || user.isLawyer
              ? `${user.label} (Lawyer)`
              : user.userType === "admin" || user.userType === "super-admin"
                ? `${user.label} (Admin)`
                : user.userType === "staff"
                  ? `${user.label} (Staff${user.position ? ` - ${user.position}` : ""})`
                  : user.label,
        }));
    }, [staffOptions]);

    // Update form when initial values change
    useEffect(() => {
      if (initialValues && Object.keys(initialValues).length > 0) {
        const formattedValues = {
          ...initialValues,
          opposingParties: initialValues.opposingParties || [],
          objectives: initialValues.objectives || [],
          strengths: initialValues.strengths || [],
          weaknesses: initialValues.weaknesses || [],
          risks: initialValues.risks || [],
          stepsToBeTaken: initialValues.stepsToBeTaken || [],
          accountOfficer: Array.isArray(initialValues.accountOfficer)
            ? initialValues.accountOfficer
            : initialValues.accountOfficer
              ? [initialValues.accountOfficer]
              : [],
          dateOpened: initialValues.dateOpened
            ? dayjs(initialValues.dateOpened)
            : undefined,
          expectedClosureDate: initialValues.expectedClosureDate
            ? dayjs(initialValues.expectedClosureDate)
            : undefined,
          detailData: initialValues.detailData || {},
        };

        form.setFieldsValue(formattedValues);
        if (initialValues.matterType) {
          setSelectedMatterType(initialValues.matterType);
        }
      }
    }, [initialValues, form]);

    // Handle form submission with proper data transformation
    const handleFormSubmit = async () => {
      try {
        // Get ALL form values from ALL steps
        const allFormValues = form.getFieldsValue(true); // true = get all nested values

        console.log("=== ALL FORM VALUES ===");
        console.log("Full form data:", allFormValues);
        console.log("Selected matter type from state:", selectedMatterType);
        console.log("Has matterType in form:", allFormValues.matterType);

        // If matterType is missing from form values but exists in state, add it
        if (!allFormValues.matterType && selectedMatterType) {
          allFormValues.matterType = selectedMatterType;
        }

        // Validate that we have the required fields
        const requiredFields = [
          "title",
          "description",
          "matterType",
          "matterNumber",
          "natureOfMatter",
          "client",
          "accountOfficer",
        ];
        const missingFields = requiredFields.filter(
          (field) => !allFormValues[field],
        );

        if (missingFields.length > 0) {
          message.error(`Missing required fields: ${missingFields.join(", ")}`);

          // Go back to step 0 to show the errors
          if (!disableSteps) {
            setCurrentStep(0);
          }
          return;
        }

        // Process the data
        const transformedValues = {
          title: allFormValues.title?.trim(),
          description: allFormValues.description?.trim(),
          matterType: allFormValues.matterType,
          matterNumber: allFormValues.matterNumber?.trim(),
          natureOfMatter: allFormValues.natureOfMatter,
          category: allFormValues.category || "n/a",

          client: allFormValues.client,
          accountOfficer: Array.isArray(allFormValues.accountOfficer)
            ? allFormValues.accountOfficer.filter((id) => id)
            : allFormValues.accountOfficer
              ? [allFormValues.accountOfficer]
              : [],

          opposingParties: transformArrayField(allFormValues.opposingParties),
          objectives: transformArrayField(allFormValues.objectives),
          strengths: transformArrayField(allFormValues.strengths),
          weaknesses: transformArrayField(allFormValues.weaknesses),
          risks: transformArrayField(allFormValues.risks),
          stepsToBeTaken: transformArrayField(allFormValues.stepsToBeTaken),

          contactPersons: allFormValues.contactPersons || [],

          // Dates
          dateOpened: allFormValues.dateOpened
            ? allFormValues.dateOpened.toISOString()
            : new Date().toISOString(),
          expectedClosureDate: allFormValues.expectedClosureDate
            ? allFormValues.expectedClosureDate.toISOString()
            : undefined,

          // Financial
          billingType: allFormValues.billingType,
          estimatedValue: allFormValues.estimatedValue,
          currency: allFormValues.currency,

          // Status
          priority: allFormValues.priority,
          status: allFormValues.status,

          // Flags
          isConfidential: allFormValues.isConfidential || false,
          isFiledByTheOffice: allFormValues.isFiledByTheOffice || false,

          // Comments
          generalComment: allFormValues.generalComment?.trim(),
          internalNotes: allFormValues.internalNotes?.trim(),

          // Optional
          officeFileNo: allFormValues.officeFileNo?.trim(),

          // Matter type specific details
          ...(allFormValues.detailData && {
            detailData: allFormValues.detailData,
          }),
        };

        // Clean up
        Object.keys(transformedValues).forEach((key) => {
          if (
            transformedValues[key] === undefined ||
            transformedValues[key] === null ||
            transformedValues[key] === "" ||
            (Array.isArray(transformedValues[key]) &&
              transformedValues[key].length === 0)
          ) {
            delete transformedValues[key];
          }
        });

        console.log("=== FINAL TRANSFORMED VALUES ===");
        console.log("Matter Type:", transformedValues.matterType);
        console.log("All data:", transformedValues);

        // Validate matterType is present
        if (!transformedValues.matterType) {
          throw new Error(
            "Matter type is required. Please select a matter type.",
          );
        }

        // Call the onSubmit prop
        await onSubmit(transformedValues);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Form submission error:", error);
        message.error(error.message || "Failed to submit form");
        throw error;
      }
    };

    const handleMatterTypeChange = (value) => {
      setSelectedMatterType(value);
      form.setFieldValue("matterType", value);
      form.setFieldValue("natureOfMatter", undefined);
      form.setFieldValue("category", undefined);
      setHasUnsavedChanges(true);
    };

    const renderUserSelect = (
      options,
      loading,
      error,
      placeholder,
      mode = "default",
      fieldName,
    ) => {
      if (error) {
        return (
          <Select placeholder={placeholder} mode={mode} disabled options={[]} />
        );
      }

      return (
        <Select
          placeholder={placeholder}
          mode={mode}
          loading={loading}
          showSearch
          optionFilterProp="searchText"
          filterOption={(input, option) =>
            option?.searchText?.toLowerCase().includes(input.toLowerCase())
          }
          onChange={() => setHasUnsavedChanges(true)}
          options={
            options?.map((option) => ({
              value: option.value,
              label: (
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  {option.position && (
                    <span className="text-xs text-gray-500">
                      {option.position}
                      {option.userType &&
                        option.userType !== "client" &&
                        ` • ${option.userType}`}
                    </span>
                  )}
                </div>
              ),
              email: option.email,
              searchText: `${option.label} ${option.email || ""} ${option.position || ""}`,
            })) || []
          }
        />
      );
    };

    const next = async () => {
      try {
        // Determine which fields to validate based on current step
        const getFieldsToValidate = () => {
          switch (currentStep) {
            case 0: {
              const fields = [
                "title",
                "matterType",
                "matterNumber",
                "description",
                "client",
                "accountOfficer",
              ];

              const matterType = form.getFieldValue("matterType");
              if (matterType) {
                fields.push("natureOfMatter");
              }
              if (matterType === "litigation") {
                fields.push("category");
              }
              return fields;
            }

            case 1:
              // Step 2 doesn't require specific validation
              return [];

            case 2:
              return ["priority", "status"];

            default:
              return [];
          }
        };

        const fieldsToValidate = getFieldsToValidate();

        if (fieldsToValidate.length > 0) {
          await form.validateFields(fieldsToValidate);
        }

        setCurrentStep(currentStep + 1);
      } catch (errorInfo) {
        console.log("Step validation failed:", errorInfo);
        const errorFields = errorInfo.errorFields?.map((f) => f.name[0]);
        if (errorFields?.length > 0) {
          message.error(`Please fill in: ${errorFields.join(", ")}`);
        }
      }
    };

    const prev = () => {
      setCurrentStep(currentStep - 1);
    };

    const handleValuesChange = (changedValues, allValues) => {
      setHasUnsavedChanges(true);

      if (enableAutoSave && onAutoSave) {
        if (autoSaveTimer) {
          clearTimeout(autoSaveTimer);
        }

        const timer = setTimeout(() => {
          onAutoSave(allValues);
        }, 2000);

        setAutoSaveTimer(timer);
      }
    };

    useEffect(() => {
      return () => {
        if (autoSaveTimer) {
          clearTimeout(autoSaveTimer);
        }
      };
    }, [autoSaveTimer]);

    const renderApiErrors = () => {
      if (!apiErrors || Object.keys(apiErrors).length === 0) return null;

      return (
        <Alert
          message="Validation Error"
          type="error"
          showIcon
          className="mb-6"
          description={
            <ul className="list-disc pl-4">
              {Object.entries(apiErrors).map(([field, error]) => (
                <li key={field}>
                  <strong>{field}:</strong> {error}
                </li>
              ))}
            </ul>
          }
        />
      );
    };

    useEffect(() => {
      if (apiErrors && Object.keys(apiErrors).length > 0) {
        const formErrors = Object.entries(apiErrors).map(([field, error]) => ({
          name: field,
          errors: [error],
        }));
        form.setFields(formErrors);
      }
    }, [apiErrors, form]);

    const steps = [
      {
        title: "Basic Info",
        content: (
          <div className="space-y-6">
            {renderApiErrors()}
            {hasUnsavedChanges && mode === "edit" && (
              <Alert
                message="You have unsaved changes"
                type="warning"
                showIcon
                className="mb-4"
              />
            )}
            <Card title="Basic Information" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="matterNumber"
                    label="Matter Number"
                    rules={[
                      { required: true, message: "Matter Number is required" },
                    ]}>
                    <Input
                      placeholder="e.g., MR/CP/2003"
                      onChange={() => setHasUnsavedChanges(true)}
                    />
                  </Form.Item>
                </Col>

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
                    ]}>
                    <Input
                      placeholder="e.g., Jones v. State Corporation"
                      onChange={() => setHasUnsavedChanges(true)}
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
                      onChange={() => setHasUnsavedChanges(true)}
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
                        onChange={() => setHasUnsavedChanges(true)}
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
                        onChange={() => setHasUnsavedChanges(true)}
                      />
                    </Form.Item>
                  </Col>
                )}
              </Row>
            </Card>

            <Card title="Parties Involved" size="small">
              {clientsError && (
                <Alert
                  message="Error loading clients"
                  description={clientsError.message}
                  type="error"
                  className="mb-4"
                  action={
                    <Button size="small" onClick={refreshClients}>
                      Retry
                    </Button>
                  }
                />
              )}

              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="client"
                    label="Client"
                    rules={[{ required: true, message: "Client is required" }]}>
                    {renderUserSelect(
                      clientOptions,
                      clientsLoading,
                      clientsError,
                      "Select Client",
                      "default",
                      "client",
                    )}
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
                      {
                        type: "array",
                        min: 1,
                        message: "Please select at least one account officer",
                      },
                    ]}>
                    {renderUserSelect(
                      accountOfficerOptions,
                      staffLoading,
                      staffError,
                      "Select Account Officers",
                      "multiple",
                      "accountOfficer",
                    )}
                  </Form.Item>
                  <div className="text-xs text-gray-500 mt-1">
                    Select lawyers, admins, or staff with account officer
                    privileges
                  </div>
                </Col>
              </Row>

              <Divider orientation="left" plain>
                Opposing Parties
              </Divider>
              <DynamicArraysSection
                fieldName="opposingParties"
                label="Opposing Parties"
                placeholder="Enter opposing party name"
                onArrayChange={() => setHasUnsavedChanges(true)}
              />
            </Card>
          </div>
        ),
      },
      {
        title: "Details & Strategy",
        content: (
          <div className="space-y-6">
            {renderApiErrors()}
            <Card title="Strategic Analysis" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <DynamicArraysSection
                    fieldName="objectives"
                    label="Objectives"
                    placeholder="Enter objective"
                    rules={[
                      {
                        required: true,
                        message: "At least one objective is required",
                      },
                    ]}
                    onArrayChange={() => setHasUnsavedChanges(true)}
                  />
                </Col>

                <Col xs={24}>
                  <DynamicArraysSection
                    fieldName="strengths"
                    label="Strengths"
                    placeholder="Enter strength"
                    onArrayChange={() => setHasUnsavedChanges(true)}
                  />
                </Col>

                <Col xs={24}>
                  <DynamicArraysSection
                    fieldName="weaknesses"
                    label="Weaknesses"
                    placeholder="Enter weakness"
                    onArrayChange={() => setHasUnsavedChanges(true)}
                  />
                </Col>

                <Col xs={24}>
                  <DynamicArraysSection
                    fieldName="risks"
                    label="Risks"
                    placeholder="Enter risk"
                    onArrayChange={() => setHasUnsavedChanges(true)}
                  />
                </Col>

                <Col xs={24}>
                  <DynamicArraysSection
                    fieldName="stepsToBeTaken"
                    label="Steps to be Taken"
                    placeholder="Enter step"
                    onArrayChange={() => setHasUnsavedChanges(true)}
                  />
                </Col>
              </Row>
            </Card>

            <Card title="Contact Persons" size="small">
              <ContactPersonsSection
                onChange={() => setHasUnsavedChanges(true)}
              />
            </Card>

            {selectedMatterType && (
              <Card
                title={`${selectedMatterType.charAt(0).toUpperCase() + selectedMatterType.slice(1)} Details`}>
                <MatterTypeSpecificForm
                  matterType={selectedMatterType}
                  initialValues={initialValues.detailData}
                  form={form}
                  onChange={() => setHasUnsavedChanges(true)}
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
            {renderApiErrors()}
            <Card title="Financial Information" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item name="billingType" label="Billing Type">
                    <Select
                      placeholder="Select billing type"
                      options={MATTER_CONFIG.BILLING_TYPES}
                      onChange={() => setHasUnsavedChanges(true)}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="currency" label="Currency">
                    <Select
                      placeholder="Select currency"
                      options={MATTER_CONFIG.CURRENCIES}
                      onChange={() => setHasUnsavedChanges(true)}
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
                      onChange={() => setHasUnsavedChanges(true)}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card title="Dates & Timeline" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item name="dateOpened" label="Date Opened">
                    <DatePicker
                      className="w-full"
                      onChange={() => setHasUnsavedChanges(true)}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="expectedClosureDate"
                    label="Expected Closure Date">
                    <DatePicker
                      className="w-full"
                      onChange={() => setHasUnsavedChanges(true)}
                    />
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
                      onChange={() => setHasUnsavedChanges(true)}
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
                      onChange={() => setHasUnsavedChanges(true)}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="isConfidential"
                    label="Confidential"
                    valuePropName="checked">
                    <Switch onChange={() => setHasUnsavedChanges(true)} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="isFiledByTheOffice"
                    label="Filed by Office"
                    valuePropName="checked">
                    <Switch onChange={() => setHasUnsavedChanges(true)} />
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
                      onChange={() => setHasUnsavedChanges(true)}
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
                      onChange={() => setHasUnsavedChanges(true)}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </div>
        ),
      },
    ];

    useEffect(() => {
      if (formRef) {
        formRef.current = form;
      }
    }, [form, formRef]);

    const getSubmitButtonText = () => {
      if (submitText) return submitText;
      return mode === "create" ? "Create Matter" : "Update Matter";
    };

    useEffect(() => {
      const handleBeforeUnload = (e) => {
        if (hasUnsavedChanges) {
          e.preventDefault();
          e.returnValue =
            "You have unsaved changes. Are you sure you want to leave?";
        }
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }, [hasUnsavedChanges]);

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

        {!disableSteps && (
          <Steps current={currentStep} className="mb-8">
            {steps.map((step) => (
              <Step key={step.title} title={step.title} />
            ))}
          </Steps>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          onValuesChange={handleValuesChange}
          initialValues={{
            priority: "medium",
            status: "active",
            isConfidential: false,
            isFiledByTheOffice: false,
            currency: "NGN",
            billingType: "hourly",
            accountOfficer: [],
            opposingParties: [],
            objectives: [],
            strengths: [],
            weaknesses: [],
            risks: [],
            stepsToBeTaken: [],
            category: "n/a",
            ...initialValues,
          }}
          className="space-y-6">
          {disableSteps ? (
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index}>
                  <Title level={4} className="mb-4">
                    {step.title}
                  </Title>
                  {step.content}
                </div>
              ))}
            </div>
          ) : (
            steps[currentStep].content
          )}

          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div className="space-x-4">
              {showCancelButton && onCancel && (
                <Button
                  onClick={onCancel}
                  icon={<CloseOutlined />}
                  disabled={loading}>
                  Cancel
                </Button>
              )}

              {!disableSteps && currentStep > 0 && (
                <Button onClick={prev} disabled={loading}>
                  Previous
                </Button>
              )}
            </div>

            <div className="space-x-4">
              {!disableSteps && currentStep < steps.length - 1 && (
                <Button type="primary" onClick={next} disabled={loading}>
                  Next
                </Button>
              )}

              {(!disableSteps && currentStep === steps.length - 1) ||
              disableSteps ? (
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={loading ? <LoadingOutlined /> : <SaveOutlined />}
                  loading={loading}
                  size="large"
                  disabled={loading}>
                  {getSubmitButtonText()}
                </Button>
              ) : null}
            </div>
          </div>
        </Form>
      </div>
    );
  },
);

MatterForm.displayName = "MatterForm";

export default MatterForm;
