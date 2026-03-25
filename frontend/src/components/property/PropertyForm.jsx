import { useState, useEffect, memo, useMemo } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Divider,
  Switch,
  Tabs,
  Alert,
} from "antd";
const { TabPane } = Tabs;
import { SaveOutlined, WarningOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import MatterContextCard from "../common/MatterContextCard";
import {
  TRANSACTION_TYPES,
  PAYMENT_TERMS,
  CURRENCIES,
  RENT_FREQUENCIES,
  DATE_FORMAT,
} from "../../utils/propertyConstants";

const { Option } = Select;
const { TextArea } = Input;

const PropertyForm = memo(
  ({
    initialValues,
    onSubmit,
    loading = false,
    mode = "create",
    matterData,
  }) => {
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState("basic");
    const [showOtherTransactionType, setShowOtherTransactionType] =
      useState(false);
    const [hasDevelopment, setHasDevelopment] = useState(false);

    // Format initial values
    useEffect(() => {
      if (initialValues) {
        const formattedValues = {
          // Transaction
          transactionType: initialValues.transactionType,
          otherTransactionType: initialValues.otherTransactionType,
          paymentTerms: initialValues.paymentTerms,

          // Parties
          vendorName: initialValues.vendor?.name,
          vendorContact: initialValues.vendor?.contact,
          purchaserName: initialValues.purchaser?.name,
          purchaserContact: initialValues.purchaser?.contact,
          landlordName: initialValues.landlord?.name,
          landlordContact: initialValues.landlord?.contact,
          tenantName: initialValues.tenant?.name,
          tenantContact: initialValues.tenant?.contact,

          // Financial
          purchasePriceAmount: initialValues.purchasePrice?.amount,
          purchasePriceCurrency: initialValues.purchasePrice?.currency || "NGN",
          rentAmountAmount: initialValues.rentAmount?.amount,
          rentAmountCurrency: initialValues.rentAmount?.currency || "NGN",
          rentAmountFrequency: initialValues.rentAmount?.frequency,
          securityDepositAmount: initialValues.securityDeposit?.amount,
          securityDepositCurrency:
            initialValues.securityDeposit?.currency || "NGN",

          // Contract of Sale
          contractOfSaleStatus: initialValues.contractOfSale?.status,
          contractOfSaleExecutionDate: initialValues.contractOfSale
            ?.executionDate
            ? dayjs(initialValues.contractOfSale.executionDate)
            : null,
          contractOfSaleCompletionDate: initialValues.contractOfSale
            ?.completionDate
            ? dayjs(initialValues.contractOfSale.completionDate)
            : null,

          // Lease Agreement
          leaseStatus: initialValues.leaseAgreement?.status,
          leaseCommencementDate: initialValues.leaseAgreement?.commencementDate
            ? dayjs(initialValues.leaseAgreement.commencementDate)
            : null,
          leaseExpiryDate: initialValues.leaseAgreement?.expiryDate
            ? dayjs(initialValues.leaseAgreement.expiryDate)
            : null,
          leaseDurationYears: initialValues.leaseAgreement?.duration?.years,
          leaseDurationMonths: initialValues.leaseAgreement?.duration?.months,
          leaseRenewalOption: initialValues.leaseAgreement?.renewalOption,

          // Deed of Assignment
          deedStatus: initialValues.deedOfAssignment?.status,
          deedExecutionDate: initialValues.deedOfAssignment?.executionDate
            ? dayjs(initialValues.deedOfAssignment.executionDate)
            : null,
          deedRegistrationDate: initialValues.deedOfAssignment?.registrationDate
            ? dayjs(initialValues.deedOfAssignment.registrationDate)
            : null,
          deedRegistrationNumber:
            initialValues.deedOfAssignment?.registrationNumber,

          // Governor's Consent
          consentRequired: initialValues.governorsConsent?.isRequired || false,
          consentStatus:
            initialValues.governorsConsent?.status || "not-required",
          consentApplicationDate: initialValues.governorsConsent
            ?.applicationDate
            ? dayjs(initialValues.governorsConsent.applicationDate)
            : null,
          consentApprovalDate: initialValues.governorsConsent?.approvalDate
            ? dayjs(initialValues.governorsConsent.approvalDate)
            : null,
          consentReferenceNumber:
            initialValues.governorsConsent?.referenceNumber,

          // Title Search
          titleSearchCompleted: initialValues.titleSearch?.isCompleted || false,
          titleSearchDate: initialValues.titleSearch?.searchDate
            ? dayjs(initialValues.titleSearch.searchDate)
            : null,
          titleSearchFindings: initialValues.titleSearch?.findings,
          titleSearchEncumbrances:
            initialValues.titleSearch?.encumbrances?.join(", "),

          // Physical Inspection
          inspectionCompleted:
            initialValues.physicalInspection?.isCompleted || false,
          inspectionDate: initialValues.physicalInspection?.inspectionDate
            ? dayjs(initialValues.physicalInspection.inspectionDate)
            : null,
          inspectionFindings: initialValues.physicalInspection?.findings,

          // Development
          developmentApplicable:
            initialValues.development?.isApplicable || false,
          developmentCostAmount:
            initialValues.development?.estimatedCost?.amount,
          developmentCostCurrency:
            initialValues.development?.estimatedCost?.currency || "NGN",
          developmentCompletionDate: initialValues.development
            ?.expectedCompletion
            ? dayjs(initialValues.development.expectedCompletion)
            : null,
          planningPermitStatus:
            initialValues.development?.planningPermit?.status,
          planningPermitDate: initialValues.development?.planningPermit
            ?.approvalDate
            ? dayjs(initialValues.development.planningPermit.approvalDate)
            : null,
          buildingPermitStatus:
            initialValues.development?.buildingPermit?.status,
          buildingPermitDate: initialValues.development?.buildingPermit
            ?.approvalDate
            ? dayjs(initialValues.development.buildingPermit.approvalDate)
            : null,
        };

        form.setFieldsValue(formattedValues);
        setShowOtherTransactionType(initialValues.transactionType === "other");
        setHasDevelopment(initialValues.development?.isApplicable || false);
      } else {
        form.resetFields();
        setShowOtherTransactionType(false);
        setHasDevelopment(false);
      }
    }, [initialValues, form]);

    const handleSubmit = (values) => {
      const formattedValues = {
        transactionType: values.transactionType,
        ...(values.transactionType === "other" && {
          otherTransactionType: values.otherTransactionType,
        }),
        paymentTerms: values.paymentTerms,

        // Vendor
        ...(values.vendorName || values.vendorContact
          ? {
              vendor: {
                name: values.vendorName,
                contact: values.vendorContact,
              },
            }
          : {}),

        // Purchaser
        ...(values.purchaserName || values.purchaserContact
          ? {
              purchaser: {
                name: values.purchaserName,
                contact: values.purchaserContact,
              },
            }
          : {}),

        // Landlord
        ...(values.landlordName || values.landlordContact
          ? {
              landlord: {
                name: values.landlordName,
                contact: values.landlordContact,
              },
            }
          : {}),

        // Tenant
        ...(values.tenantName || values.tenantContact
          ? {
              tenant: {
                name: values.tenantName,
                contact: values.tenantContact,
              },
            }
          : {}),

        // Financial
        ...(values.purchasePriceAmount !== undefined &&
        values.purchasePriceAmount !== null
          ? {
              purchasePrice: {
                amount: values.purchasePriceAmount,
                currency: values.purchasePriceCurrency || "NGN",
              },
            }
          : {}),

        ...(values.rentAmountAmount !== undefined &&
        values.rentAmountAmount !== null
          ? {
              rentAmount: {
                amount: values.rentAmountAmount,
                currency: values.rentAmountCurrency || "NGN",
                frequency: values.rentAmountFrequency,
              },
            }
          : {}),

        ...(values.securityDepositAmount !== undefined &&
        values.securityDepositAmount !== null
          ? {
              securityDeposit: {
                amount: values.securityDepositAmount,
                currency: values.securityDepositCurrency || "NGN",
              },
            }
          : {}),

        // Contract of Sale
        ...(values.contractOfSaleStatus || values.contractOfSaleExecutionDate
          ? {
              contractOfSale: {
                status: values.contractOfSaleStatus,
                ...(values.contractOfSaleExecutionDate && {
                  executionDate:
                    values.contractOfSaleExecutionDate.toISOString(),
                }),
                ...(values.contractOfSaleCompletionDate && {
                  completionDate:
                    values.contractOfSaleCompletionDate.toISOString(),
                }),
              },
            }
          : {}),

        // Lease Agreement
        ...(values.leaseStatus || values.leaseCommencementDate
          ? {
              leaseAgreement: {
                status: values.leaseStatus,
                ...(values.leaseCommencementDate && {
                  commencementDate: values.leaseCommencementDate.toISOString(),
                }),
                ...(values.leaseExpiryDate && {
                  expiryDate: values.leaseExpiryDate.toISOString(),
                }),
                ...((values.leaseDurationYears ||
                  values.leaseDurationMonths) && {
                  duration: {
                    years: values.leaseDurationYears || 0,
                    months: values.leaseDurationMonths || 0,
                  },
                }),
                renewalOption: values.leaseRenewalOption || false,
              },
            }
          : {}),

        // Deed of Assignment
        ...(values.deedStatus || values.deedExecutionDate
          ? {
              deedOfAssignment: {
                status: values.deedStatus,
                ...(values.deedExecutionDate && {
                  executionDate: values.deedExecutionDate.toISOString(),
                }),
                ...(values.deedRegistrationDate && {
                  registrationDate: values.deedRegistrationDate.toISOString(),
                }),
                registrationNumber: values.deedRegistrationNumber,
              },
            }
          : {}),

        // Governor's Consent
        governorsConsent: {
          isRequired: values.consentRequired || false,
          status: values.consentStatus || "not-required",
          ...(values.consentApplicationDate && {
            applicationDate: values.consentApplicationDate.toISOString(),
          }),
          ...(values.consentApprovalDate && {
            approvalDate: values.consentApprovalDate.toISOString(),
          }),
          referenceNumber: values.consentReferenceNumber,
        },

        // Title Search
        titleSearch: {
          isCompleted: values.titleSearchCompleted || false,
          ...(values.titleSearchDate && {
            searchDate: values.titleSearchDate.toISOString(),
          }),
          findings: values.titleSearchFindings,
          ...(values.titleSearchEncumbrances && {
            encumbrances: values.titleSearchEncumbrances
              .split(",")
              .map((e) => e.trim())
              .filter((e) => e),
          }),
        },

        // Physical Inspection
        physicalInspection: {
          isCompleted: values.inspectionCompleted || false,
          ...(values.inspectionDate && {
            inspectionDate: values.inspectionDate.toISOString(),
          }),
          findings: values.inspectionFindings,
        },

        // Development
        development: {
          isApplicable: values.developmentApplicable || false,
          ...(values.developmentApplicable && {
            planningPermit: {
              status: values.planningPermitStatus,
              ...(values.planningPermitDate && {
                approvalDate: values.planningPermitDate.toISOString(),
              }),
            },
            buildingPermit: {
              status: values.buildingPermitStatus,
              ...(values.buildingPermitDate && {
                approvalDate: values.buildingPermitDate.toISOString(),
              }),
            },
            ...(values.developmentCostAmount !== undefined &&
              values.developmentCostAmount !== null && {
                estimatedCost: {
                  amount: values.developmentCostAmount,
                  currency: values.developmentCostCurrency || "NGN",
                },
              }),
            ...(values.developmentCompletionDate && {
              expectedCompletion:
                values.developmentCompletionDate.toISOString(),
            }),
          }),
        },
      };

      onSubmit(formattedValues);
    };

    const handleTransactionTypeChange = (value) => {
      setShowOtherTransactionType(value === "other");
      if (value !== "other") {
        form.setFieldValue("otherTransactionType", undefined);
      }

      // Auto-switch tabs
      if (value === "lease" || value === "sublease") {
        setActiveTab("legal");
      } else if (value === "property_development") {
        setActiveTab("development");
      }
    };

    return (
      <>
        {matterData && <MatterContextCard matter={matterData} />}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          scrollToFirstError
          className="property-form">
          {mode === "edit" && (
            <Alert
              message="Editing Property Details"
              description="You are editing existing property details. Changes will be saved immediately."
              type="info"
              showIcon
              icon={<WarningOutlined />}
              className="mb-6"
            />
          )}

          <Tabs activeKey={activeTab} onChange={setActiveTab} className="mb-6">
            {/* BASIC INFORMATION TAB */}
            <TabPane tab="Basic Information" key="basic">
              <Card className="mb-6">
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="transactionType"
                      label="Transaction Type"
                      rules={[
                        {
                          required: true,
                          message: "Transaction type is required",
                        },
                      ]}>
                      <Select
                        placeholder="Select transaction type"
                        showSearch
                        onChange={handleTransactionTypeChange}
                        size="large">
                        {TRANSACTION_TYPES.map((type) => (
                          <Option key={type.value} value={type.value}>
                            <span className="mr-2">{type.icon}</span>
                            {type.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  {showOtherTransactionType && (
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="otherTransactionType"
                        label="Specify Other Transaction Type"
                        rules={[
                          {
                            required: true,
                            message: "Please specify the transaction type",
                          },
                        ]}>
                        <Input
                          placeholder="Enter transaction type"
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                  )}

                  <Col xs={24} md={12}>
                    <Form.Item name="paymentTerms" label="Payment Terms">
                      <Select placeholder="Select payment terms" size="large">
                        {PAYMENT_TERMS.map((term) => (
                          <Option key={term.value} value={term.value}>
                            <span className="mr-2">{term.icon}</span>
                            {term.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* FINANCIAL INFORMATION */}
              <Card title="Financial Information" className="mb-6">
                <Tabs type="card">
                  <TabPane tab="Purchase Price" key="purchase">
                    <Row gutter={16}>
                      <Col xs={24} md={16}>
                        <Form.Item name="purchasePriceAmount" label="Amount">
                          <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value?.replace(/,/g, "")}
                            placeholder="0.00"
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="purchasePriceCurrency"
                          label="Currency"
                          initialValue="NGN">
                          <Select size="large">
                            {CURRENCIES.map((curr) => (
                              <Option key={curr.value} value={curr.value}>
                                {curr.symbol} {curr.value}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </TabPane>

                  <TabPane tab="Rent Amount" key="rent">
                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item name="rentAmountAmount" label="Amount">
                          <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value?.replace(/,/g, "")}
                            placeholder="0.00"
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item
                          name="rentAmountCurrency"
                          label="Currency"
                          initialValue="NGN">
                          <Select size="large">
                            {CURRENCIES.map((curr) => (
                              <Option key={curr.value} value={curr.value}>
                                {curr.symbol} {curr.value}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item name="rentAmountFrequency" label="Frequency">
                          <Select size="large">
                            {RENT_FREQUENCIES.map((freq) => (
                              <Option key={freq.value} value={freq.value}>
                                {freq.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </TabPane>

                  <TabPane tab="Security Deposit" key="deposit">
                    <Row gutter={16}>
                      <Col xs={24} md={16}>
                        <Form.Item name="securityDepositAmount" label="Amount">
                          <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value?.replace(/,/g, "")}
                            placeholder="0.00"
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="securityDepositCurrency"
                          label="Currency"
                          initialValue="NGN">
                          <Select size="large">
                            {CURRENCIES.map((curr) => (
                              <Option key={curr.value} value={curr.value}>
                                {curr.symbol} {curr.value}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                  </TabPane>
                </Tabs>
              </Card>
            </TabPane>

            {/* PARTIES TAB */}
            <TabPane tab="Parties" key="parties">
              <Card title="Vendor/Owner" className="mb-6">
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="vendorName" label="Vendor Name">
                      <Input
                        placeholder="Enter vendor/owner name"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="vendorContact" label="Contact Information">
                      <Input
                        placeholder="Phone, email, or address"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title="Purchaser/Buyer" className="mb-6">
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="purchaserName" label="Purchaser Name">
                      <Input
                        placeholder="Enter purchaser/buyer name"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="purchaserContact"
                      label="Contact Information">
                      <Input
                        placeholder="Phone, email, or address"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title="Lease Parties (If Applicable)" className="mb-6">
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="landlordName" label="Landlord Name">
                      <Input placeholder="Enter landlord name" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="landlordContact"
                      label="Contact Information">
                      <Input
                        placeholder="Phone, email, or address"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="tenantName" label="Tenant Name">
                      <Input placeholder="Enter tenant name" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="tenantContact" label="Contact Information">
                      <Input
                        placeholder="Phone, email, or address"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </TabPane>

            {/* LEGAL DOCUMENTS TAB */}
            <TabPane tab="Legal Documents" key="legal">
              <Card title="Contract of Sale" className="mb-6">
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item name="contractOfSaleStatus" label="Status">
                      <Select placeholder="Select status" size="large">
                        <Option value="draft">Draft</Option>
                        <Option value="executed">Executed</Option>
                        <Option value="completed">Completed</Option>
                        <Option value="terminated">Terminated</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="contractOfSaleExecutionDate"
                      label="Execution Date">
                      <DatePicker
                        style={{ width: "100%" }}
                        format={DATE_FORMAT}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="contractOfSaleCompletionDate"
                      label="Completion Date">
                      <DatePicker
                        style={{ width: "100%" }}
                        format={DATE_FORMAT}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title="Lease Agreement" className="mb-6">
                <Row gutter={16}>
                  <Col xs={24} md={6}>
                    <Form.Item name="leaseStatus" label="Status">
                      <Select placeholder="Select status" size="large">
                        <Option value="draft">Draft</Option>
                        <Option value="executed">Executed</Option>
                        <Option value="active">Active</Option>
                        <Option value="expired">Expired</Option>
                        <Option value="terminated">Terminated</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="leaseCommencementDate"
                      label="Commencement Date">
                      <DatePicker
                        style={{ width: "100%" }}
                        format={DATE_FORMAT}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="leaseExpiryDate" label="Expiry Date">
                      <DatePicker
                        style={{ width: "100%" }}
                        format={DATE_FORMAT}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="leaseRenewalOption"
                      label="Renewal Option"
                      valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="leaseDurationYears"
                      label="Duration (Years)">
                      <InputNumber
                        min={0}
                        style={{ width: "100%" }}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="leaseDurationMonths"
                      label="Duration (Months)">
                      <InputNumber
                        min={0}
                        max={11}
                        style={{ width: "100%" }}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title="Deed of Assignment" className="mb-6">
                <Row gutter={16}>
                  <Col xs={24} md={6}>
                    <Form.Item name="deedStatus" label="Status">
                      <Select placeholder="Select status" size="large">
                        <Option value="pending">Pending</Option>
                        <Option value="executed">Executed</Option>
                        <Option value="registered">Registered</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="deedExecutionDate" label="Execution Date">
                      <DatePicker
                        style={{ width: "100%" }}
                        format={DATE_FORMAT}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="deedRegistrationDate"
                      label="Registration Date">
                      <DatePicker
                        style={{ width: "100%" }}
                        format={DATE_FORMAT}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="deedRegistrationNumber"
                      label="Registration Number">
                      <Input
                        placeholder="Enter registration number"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </TabPane>

            {/* REGULATORY TAB */}
            <TabPane tab="Regulatory" key="regulatory">
              <Card title="Governor's Consent" className="mb-6">
                <Row gutter={16}>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="consentRequired"
                      label="Required"
                      valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="consentStatus" label="Status">
                      <Select placeholder="Select status" size="large">
                        <Option value="not-required">Not Required</Option>
                        <Option value="pending">Pending</Option>
                        <Option value="approved">Approved</Option>
                        <Option value="rejected">Rejected</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="consentApplicationDate"
                      label="Application Date">
                      <DatePicker
                        style={{ width: "100%" }}
                        format={DATE_FORMAT}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="consentApprovalDate" label="Approval Date">
                      <DatePicker
                        style={{ width: "100%" }}
                        format={DATE_FORMAT}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="consentReferenceNumber"
                      label="Reference Number">
                      <Input
                        placeholder="Enter reference number"
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </TabPane>

            {/* DUE DILIGENCE TAB */}
            <TabPane tab="Due Diligence" key="diligence">
              <Card title="Title Search" className="mb-6">
                <Row gutter={16}>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="titleSearchCompleted"
                      label="Completed"
                      valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="titleSearchDate" label="Search Date">
                      <DatePicker
                        style={{ width: "100%" }}
                        format={DATE_FORMAT}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item name="titleSearchFindings" label="Findings">
                      <TextArea
                        rows={3}
                        placeholder="Enter findings from title search"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      name="titleSearchEncumbrances"
                      label="Encumbrances (comma separated)">
                      <Input placeholder="e.g., Mortgage, Lien, Easement" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title="Physical Inspection" className="mb-6">
                <Row gutter={16}>
                  <Col xs={24} md={6}>
                    <Form.Item
                      name="inspectionCompleted"
                      label="Completed"
                      valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item name="inspectionDate" label="Inspection Date">
                      <DatePicker
                        style={{ width: "100%" }}
                        format={DATE_FORMAT}
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item name="inspectionFindings" label="Findings">
                      <TextArea
                        rows={3}
                        placeholder="Enter findings from physical inspection"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </TabPane>

            {/* DEVELOPMENT TAB */}
            <TabPane tab="Development" key="development">
              <Card title="Development Information" className="mb-6">
                <Row gutter={16}>
                  <Col xs={24}>
                    <Form.Item
                      name="developmentApplicable"
                      label="Development Applicable"
                      valuePropName="checked">
                      <Switch onChange={setHasDevelopment} />
                    </Form.Item>
                  </Col>
                </Row>

                {hasDevelopment && (
                  <>
                    <Row gutter={16}>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="developmentCostAmount"
                          label="Estimated Cost">
                          <InputNumber
                            style={{ width: "100%" }}
                            min={0}
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value?.replace(/,/g, "")}
                            placeholder="0.00"
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="developmentCostCurrency"
                          label="Currency"
                          initialValue="NGN">
                          <Select size="large">
                            {CURRENCIES.map((curr) => (
                              <Option key={curr.value} value={curr.value}>
                                {curr.symbol} {curr.value}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="developmentCompletionDate"
                          label="Expected Completion">
                          <DatePicker
                            style={{ width: "100%" }}
                            format={DATE_FORMAT}
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider orientation="left">Permits</Divider>

                    <Row gutter={16}>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="planningPermitStatus"
                          label="Planning Permit Status">
                          <Select placeholder="Select status" size="large">
                            <Option value="not-required">Not Required</Option>
                            <Option value="pending">Pending</Option>
                            <Option value="approved">Approved</Option>
                            <Option value="rejected">Rejected</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="planningPermitDate"
                          label="Approval Date">
                          <DatePicker
                            style={{ width: "100%" }}
                            format={DATE_FORMAT}
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="buildingPermitStatus"
                          label="Building Permit Status">
                          <Select placeholder="Select status" size="large">
                            <Option value="not-required">Not Required</Option>
                            <Option value="pending">Pending</Option>
                            <Option value="approved">Approved</Option>
                            <Option value="rejected">Rejected</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="buildingPermitDate"
                          label="Approval Date">
                          <DatePicker
                            style={{ width: "100%" }}
                            format={DATE_FORMAT}
                            size="large"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                )}
              </Card>
            </TabPane>
          </Tabs>

          {/* FORM ACTIONS */}
          <div className="flex justify-end gap-4 mt-6">
            <Button size="large" onClick={() => form.resetFields()}>
              Reset
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}>
              {mode === "create"
                ? "Create Property Details"
                : "Update Property Details"}
            </Button>
          </div>
        </Form>
      </>
    );
  },
);

PropertyForm.displayName = "PropertyForm";

export default PropertyForm;
