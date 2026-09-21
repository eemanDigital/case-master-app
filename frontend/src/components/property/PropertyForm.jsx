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
  Typography,
} from "antd";
import {
  SaveOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  SwapOutlined,
  HomeOutlined,
  TeamOutlined,
  DollarOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  ToolOutlined,
  CalendarOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import MatterContextCard from "../common/MatterContextCard";
import {
  TRANSACTION_TYPES,
  PROPERTY_TYPES,
  TITLE_DOCUMENTS,
  LAND_SIZE_UNITS,
  PAYMENT_TERMS,
  CURRENCIES,
  RENT_FREQUENCIES,
  NIGERIAN_STATES,
  DATE_FORMAT,
} from "../../utils/propertyConstants";

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

// ============================================
// TRANSACTION FAMILIES
// Every transaction type belongs to one family which decides which sections of
// the form are relevant. This is what keeps the form focused instead of showing
// purchase, lease and development fields all at once.
// ============================================

const FAMILY_CONFIG = {
  acquisition: {
    label: "Acquisition & Transfer",
    color: "blue",
    description:
      "Buying, selling, transferring or perfecting title to a property.",
    needs:
      "Property details, vendor & purchaser, consideration, contract of sale, deed of assignment and Governor's consent.",
  },
  leasing: {
    label: "Leasing & Tenancy",
    color: "purple",
    description:
      "Granting or taking a lease, tenancy or managing a property for another party.",
    needs:
      "Property details, landlord & tenant, rent & deposit, lease terms and renewal tracking.",
  },
  development: {
    label: "Property Development",
    color: "magenta",
    description:
      "Developing or redeveloping land, including planning and construction.",
    needs:
      "Land details, landowner & developer, estimated cost, planning and building permits.",
  },
  dispute: {
    label: "Disputes & Encumbrances",
    color: "red",
    description:
      "Contentious property matters such as boundary disputes, partition, easements, rights of way and foreclosure.",
    needs:
      "Property details, the parties, title search findings and the nature of the dispute.",
  },
};

// Per-type behaviour. `pricing` drives the financial section:
//   "purchase" -> purchase price, "rent" -> rent + deposit, "none" -> no financials
const TRANSACTION_META = {
  purchase: { family: "acquisition", pricing: "purchase", parties: ["vendor", "purchaser"], contractOfSale: true, deed: true, consent: true },
  sale: { family: "acquisition", pricing: "purchase", parties: ["vendor", "purchaser"], contractOfSale: true, deed: true, consent: true },
  land_acquisition: { family: "acquisition", pricing: "purchase", parties: ["vendor", "purchaser"], contractOfSale: true, deed: true, consent: true, survey: true },
  title_perfection: { family: "acquisition", pricing: "purchase", parties: ["vendor", "purchaser"], deed: true, consent: true, survey: true },
  mortgage: { family: "acquisition", pricing: "purchase", parties: ["vendor", "purchaser"], deed: true },
  lease: { family: "leasing", pricing: "rent", parties: ["landlord", "tenant"], lease: true },
  sublease: { family: "leasing", pricing: "rent", parties: ["landlord", "tenant"], lease: true },
  tenancy_matter: { family: "leasing", pricing: "rent", parties: ["landlord", "tenant"], lease: true },
  property_management: { family: "leasing", pricing: "rent", parties: ["landlord", "tenant"], lease: true },
  property_development: { family: "development", pricing: "purchase", parties: ["vendor", "purchaser"], contractOfSale: true, consent: true, development: true },
  boundary_dispute: { family: "dispute", pricing: "none", parties: ["vendor", "purchaser"], survey: true },
  partition: { family: "dispute", pricing: "none", parties: ["vendor", "purchaser"], survey: true },
  right_of_way: { family: "dispute", pricing: "none", parties: ["vendor", "purchaser"], survey: true },
  easement: { family: "dispute", pricing: "none", parties: ["vendor", "purchaser"], survey: true },
  foreclosure: { family: "dispute", pricing: "purchase", parties: ["vendor", "purchaser"], deed: true },
  other: { family: "acquisition", pricing: "purchase", parties: ["vendor", "purchaser"], contractOfSale: true, deed: true, consent: true },
};

const DEFAULT_META = TRANSACTION_META.other;

// Grouped options make the transaction picker scannable by family
const TRANSACTION_GROUPS = [
  { label: "Acquisition & Transfer", types: ["purchase", "sale", "land_acquisition", "title_perfection", "mortgage"] },
  { label: "Leasing & Tenancy", types: ["lease", "sublease", "tenancy_matter", "property_management"] },
  { label: "Property Development", types: ["property_development"] },
  { label: "Disputes & Encumbrances", types: ["boundary_dispute", "partition", "right_of_way", "easement", "foreclosure"] },
  { label: "Other", types: ["other"] },
];

const transactionOptions = TRANSACTION_GROUPS.map((group) => ({
  label: group.label,
  options: group.types
    .map((value) => TRANSACTION_TYPES.find((t) => t.value === value))
    .filter(Boolean)
    .map((t) => ({ value: t.value, label: `${t.icon}  ${t.label}` })),
}));

// Party labels change with the family (vendor/purchaser vs landlord/tenant vs owner/other)
const PARTY_LABELS = {
  acquisition: {
    vendor: { name: "Vendor / Seller", contact: "Vendor contact (phone, email or address)" },
    purchaser: { name: "Purchaser / Buyer", contact: "Purchaser contact (phone, email or address)" },
  },
  development: {
    vendor: { name: "Landowner / Vendor", contact: "Landowner contact" },
    purchaser: { name: "Developer / Purchaser", contact: "Developer contact" },
  },
  dispute: {
    vendor: { name: "Owner / Claimant (our client)", contact: "Owner contact" },
    purchaser: { name: "Other Party / Adjoining Owner", contact: "Other party contact" },
  },
  leasing: {
    landlord: { name: "Landlord / Lessor", contact: "Landlord contact (phone, email or address)" },
    tenant: { name: "Tenant / Lessee", contact: "Tenant contact (phone, email or address)" },
  },
};

const getPartyLabel = (family, key) =>
  PARTY_LABELS[family]?.[key] || PARTY_LABELS.acquisition[key] || { name: key, contact: `${key} contact` };

// ============================================
// HELPERS
// ============================================

const iso = (d) => (d ? d.toISOString() : undefined);

const clean = (obj) => {
  const out = { ...obj };
  Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
  return out;
};

const mapInitialValues = (initialValues) => {
  const property = initialValues.properties?.[0] || {};
  const lease = initialValues.leaseAgreement || {};
  const consent = initialValues.governorsConsent || {};
  const survey = initialValues.surveyPlan || {};
  const titleSearch = initialValues.titleSearch || {};
  const inspection = initialValues.physicalInspection || {};
  const development = initialValues.development || {};
  const renewal = initialValues.renewalTracking || {};
  const alerts = initialValues.leaseAlertSettings || {};

  return {
    // Transaction
    transactionType: initialValues.transactionType,
    otherTransactionType: initialValues.otherTransactionType,
    paymentTerms: initialValues.paymentTerms,

    // Property information
    propertyType: property.propertyType,
    propertyAddress: property.address,
    propertyState: property.state,
    propertyLga: property.lga,
    landSizeValue: property.landSize?.value,
    landSizeUnit: property.landSize?.unit,
    titleDocument: property.titleDocument,
    titleNumber: property.titleNumber,

    // Parties
    vendorName: initialValues.vendor?.name,
    vendorContact: initialValues.vendor?.contact,
    purchaserName: initialValues.purchaser?.name,
    purchaserContact: initialValues.purchaser?.contact,
    landlordName: initialValues.landlord?.name,
    landlordContact: initialValues.landlord?.contact,
    tenantName: initialValues.tenant?.name,
    tenantContact: initialValues.tenant?.contact,

    // Financials
    purchasePriceAmount: initialValues.purchasePrice?.amount,
    purchasePriceCurrency: initialValues.purchasePrice?.currency || "NGN",
    rentAmountAmount: initialValues.rentAmount?.amount,
    rentAmountCurrency: initialValues.rentAmount?.currency || "NGN",
    rentAmountFrequency: initialValues.rentAmount?.frequency,
    securityDepositAmount: initialValues.securityDeposit?.amount,
    securityDepositCurrency: initialValues.securityDeposit?.currency || "NGN",

    // Contract of sale
    contractOfSaleStatus: initialValues.contractOfSale?.status,
    contractOfSaleExecutionDate: initialValues.contractOfSale?.executionDate
      ? dayjs(initialValues.contractOfSale.executionDate)
      : null,
    contractOfSaleCompletionDate: initialValues.contractOfSale?.completionDate
      ? dayjs(initialValues.contractOfSale.completionDate)
      : null,

    // Lease agreement
    leaseStatus: lease.status,
    leaseCommencementDate: lease.commencementDate ? dayjs(lease.commencementDate) : null,
    leaseExpiryDate: lease.expiryDate ? dayjs(lease.expiryDate) : null,
    leaseDurationYears: lease.duration?.years,
    leaseDurationMonths: lease.duration?.months,
    leaseRenewalOption: lease.renewalOption,

    // Deed of assignment
    deedStatus: initialValues.deedOfAssignment?.status,
    deedExecutionDate: initialValues.deedOfAssignment?.executionDate
      ? dayjs(initialValues.deedOfAssignment.executionDate)
      : null,
    deedRegistrationDate: initialValues.deedOfAssignment?.registrationDate
      ? dayjs(initialValues.deedOfAssignment.registrationDate)
      : null,
    deedRegistrationNumber: initialValues.deedOfAssignment?.registrationNumber,

    // Governor's consent
    consentRequired: consent.isRequired || false,
    consentStatus: consent.status || "not-required",
    consentApplicationDate: consent.applicationDate ? dayjs(consent.applicationDate) : null,
    consentApprovalDate: consent.approvalDate ? dayjs(consent.approvalDate) : null,
    consentReferenceNumber: consent.referenceNumber,

    // Survey plan
    surveyAvailable: survey.isAvailable || false,
    surveyNumber: survey.surveyNumber,
    surveyDate: survey.surveyDate ? dayjs(survey.surveyDate) : null,

    // Title search
    titleSearchCompleted: titleSearch.isCompleted || false,
    titleSearchDate: titleSearch.searchDate ? dayjs(titleSearch.searchDate) : null,
    titleSearchFindings: titleSearch.findings,
    titleSearchEncumbrances: titleSearch.encumbrances?.join(", "),

    // Physical inspection
    inspectionCompleted: inspection.isCompleted || false,
    inspectionDate: inspection.inspectionDate ? dayjs(inspection.inspectionDate) : null,
    inspectionFindings: inspection.findings,

    // Development
    developmentApplicable: development.isApplicable || false,
    developmentCostAmount: development.estimatedCost?.amount,
    developmentCostCurrency: development.estimatedCost?.currency || "NGN",
    developmentCompletionDate: development.expectedCompletion
      ? dayjs(development.expectedCompletion)
      : null,
    planningPermitStatus: development.planningPermit?.status,
    planningPermitDate: development.planningPermit?.approvalDate
      ? dayjs(development.planningPermit.approvalDate)
      : null,
    buildingPermitStatus: development.buildingPermit?.status,
    buildingPermitDate: development.buildingPermit?.approvalDate
      ? dayjs(development.buildingPermit.approvalDate)
      : null,

    // Lease management
    renewalStatus: renewal.renewalStatus || "not-initiated",
    renewalInitiated: renewal.renewalInitiated || false,
    renewalDeadline: renewal.renewalDeadline ? dayjs(renewal.renewalDeadline) : null,
    renewalNoticePeriod: renewal.renewalNoticePeriod ?? 90,
    rentIncreasePercentage: renewal.rentIncreasePercentage ?? 0,
    renewalTerms: renewal.renewalTerms,
    alertsEnabled: alerts.enabled ?? true,
    emailNotification: alerts.emailNotification ?? true,
    smsNotification: alerts.smsNotification ?? false,
    notifyLandlord: alerts.notifyLandlord ?? true,
    notifyTenant: alerts.notifyTenant ?? true,
    leaseMilestones: (initialValues.leaseMilestones || []).map((m) => ({
      title: m.title,
      description: m.description,
      targetDate: m.targetDate ? dayjs(m.targetDate) : null,
      completedDate: m.completedDate ? dayjs(m.completedDate) : null,
      status: m.status || "pending",
      reminderDays: m.reminderDays ?? 7,
    })),
  };
};

// ============================================
// FORM
// ============================================

const PropertyForm = memo(
  ({ initialValues, onSubmit, loading = false, mode = "create", matterData }) => {
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState("transaction");

    const watchedType = Form.useWatch("transactionType", form);
    const developmentApplicable = Form.useWatch("developmentApplicable", form);
    const transactionType =
      watchedType ?? initialValues?.transactionType ?? undefined;

    const meta = useMemo(
      () => TRANSACTION_META[transactionType] || DEFAULT_META,
      [transactionType],
    );
    const family = meta.family;
    const familyConfig = FAMILY_CONFIG[family];

    // Hydrate the form when editing
    useEffect(() => {
      if (initialValues) {
        form.setFieldsValue(mapInitialValues(initialValues));
      } else {
        form.resetFields();
      }
    }, [initialValues, form]);

    // If the selected transaction makes the current tab irrelevant, return home
    useEffect(() => {
      const validKeys = [
        "transaction",
        "property",
        "parties",
        meta.pricing !== "none" && "financials",
        (meta.contractOfSale || meta.deed || meta.lease) && "documents",
        "compliance",
        meta.development && "development",
        meta.lease && "lease",
      ].filter(Boolean);
      if (!validKeys.includes(activeTab)) setActiveTab("transaction");
    }, [transactionType, activeTab, meta]);

    const handleReset = () => {
      if (initialValues) {
        form.setFieldsValue(mapInitialValues(initialValues));
      } else {
        form.resetFields();
      }
      setActiveTab("transaction");
    };

    const handleSubmit = (values) => {
      const typeMeta = TRANSACTION_META[values.transactionType] || DEFAULT_META;

      const propertyInfo = clean({
        propertyType: values.propertyType,
        address: values.propertyAddress,
        state: values.propertyState,
        lga: values.propertyLga,
        landSize:
          values.landSizeValue !== undefined && values.landSizeValue !== null
            ? { value: values.landSizeValue, unit: values.landSizeUnit }
            : undefined,
        titleDocument: values.titleDocument,
        titleNumber: values.titleNumber,
      });

      const formattedValues = {
        transactionType: values.transactionType,
        ...(values.transactionType === "other" && {
          otherTransactionType: values.otherTransactionType,
        }),
        paymentTerms: values.paymentTerms,

        // Property
        ...(Object.keys(propertyInfo).length > 0 && { properties: [propertyInfo] }),

        // Parties
        ...(values.vendorName || values.vendorContact
          ? { vendor: { name: values.vendorName, contact: values.vendorContact } }
          : {}),
        ...(values.purchaserName || values.purchaserContact
          ? { purchaser: { name: values.purchaserName, contact: values.purchaserContact } }
          : {}),
        ...(values.landlordName || values.landlordContact
          ? { landlord: { name: values.landlordName, contact: values.landlordContact } }
          : {}),
        ...(values.tenantName || values.tenantContact
          ? { tenant: { name: values.tenantName, contact: values.tenantContact } }
          : {}),

        // Financials
        ...(values.purchasePriceAmount !== undefined && values.purchasePriceAmount !== null
          ? { purchasePrice: { amount: values.purchasePriceAmount, currency: values.purchasePriceCurrency || "NGN" } }
          : {}),
        ...(values.rentAmountAmount !== undefined && values.rentAmountAmount !== null
          ? { rentAmount: { amount: values.rentAmountAmount, currency: values.rentAmountCurrency || "NGN", frequency: values.rentAmountFrequency } }
          : {}),
        ...(values.securityDepositAmount !== undefined && values.securityDepositAmount !== null
          ? { securityDeposit: { amount: values.securityDepositAmount, currency: values.securityDepositCurrency || "NGN" } }
          : {}),

        // Contract of sale
        ...(values.contractOfSaleStatus || values.contractOfSaleExecutionDate
          ? {
              contractOfSale: clean({
                status: values.contractOfSaleStatus,
                executionDate: iso(values.contractOfSaleExecutionDate),
                completionDate: iso(values.contractOfSaleCompletionDate),
              }),
            }
          : {}),

        // Lease agreement
        ...(values.leaseStatus || values.leaseCommencementDate
          ? {
              leaseAgreement: clean({
                status: values.leaseStatus,
                commencementDate: iso(values.leaseCommencementDate),
                expiryDate: iso(values.leaseExpiryDate),
                duration:
                  values.leaseDurationYears || values.leaseDurationMonths
                    ? { years: values.leaseDurationYears || 0, months: values.leaseDurationMonths || 0 }
                    : undefined,
                renewalOption: values.leaseRenewalOption || false,
              }),
            }
          : {}),

        // Deed of assignment
        ...(values.deedStatus || values.deedExecutionDate
          ? {
              deedOfAssignment: clean({
                status: values.deedStatus,
                executionDate: iso(values.deedExecutionDate),
                registrationDate: iso(values.deedRegistrationDate),
                registrationNumber: values.deedRegistrationNumber,
              }),
            }
          : {}),

        // Governor's consent
        governorsConsent: clean({
          isRequired: values.consentRequired || false,
          status: values.consentStatus || "not-required",
          applicationDate: iso(values.consentApplicationDate),
          approvalDate: iso(values.consentApprovalDate),
          referenceNumber: values.consentReferenceNumber,
        }),

        // Survey plan
        surveyPlan: clean({
          isAvailable: values.surveyAvailable || false,
          surveyNumber: values.surveyNumber,
          surveyDate: iso(values.surveyDate),
        }),

        // Due diligence
        titleSearch: clean({
          isCompleted: values.titleSearchCompleted || false,
          searchDate: iso(values.titleSearchDate),
          findings: values.titleSearchFindings,
          encumbrances: values.titleSearchEncumbrances
            ? values.titleSearchEncumbrances.split(",").map((e) => e.trim()).filter(Boolean)
            : undefined,
        }),
        physicalInspection: clean({
          isCompleted: values.inspectionCompleted || false,
          inspectionDate: iso(values.inspectionDate),
          findings: values.inspectionFindings,
        }),

        // Development
        development: typeMeta.development
          ? clean({
              isApplicable: values.developmentApplicable || false,
              ...(values.developmentApplicable && {
                planningPermit: clean({
                  status: values.planningPermitStatus,
                  approvalDate: iso(values.planningPermitDate),
                }),
                buildingPermit: clean({
                  status: values.buildingPermitStatus,
                  approvalDate: iso(values.buildingPermitDate),
                }),
                estimatedCost:
                  values.developmentCostAmount !== undefined && values.developmentCostAmount !== null
                    ? { amount: values.developmentCostAmount, currency: values.developmentCostCurrency || "NGN" }
                    : undefined,
                expectedCompletion: iso(values.developmentCompletionDate),
              }),
            })
          : { isApplicable: false },
      };

      // Lease management (only meaningful for the leasing family)
      if (typeMeta.lease) {
        formattedValues.leaseAlertSettings = {
          enabled: values.alertsEnabled ?? true,
          alertThresholds: [
            { days: 7, label: "critical", isActive: true },
            { days: 14, label: "warning", isActive: true },
            { days: 30, label: "notice", isActive: true },
            { days: 90, label: "notice", isActive: true },
          ],
          defaultAlerts: true,
          emailNotification: values.emailNotification ?? true,
          smsNotification: values.smsNotification ?? false,
          notifyLandlord: values.notifyLandlord ?? true,
          notifyTenant: values.notifyTenant ?? true,
        };
        formattedValues.renewalTracking = clean({
          renewalInitiated: values.renewalInitiated || false,
          renewalStatus: values.renewalStatus || "not-initiated",
          renewalDeadline: iso(values.renewalDeadline),
          renewalNoticePeriod: values.renewalNoticePeriod ?? 90,
          rentIncreasePercentage: values.rentIncreasePercentage ?? 0,
          renewalTerms: values.renewalTerms,
        });
        formattedValues.leaseMilestones = (values.leaseMilestones || []).map((m) =>
          clean({
            title: m.title,
            description: m.description,
            targetDate: iso(m.targetDate),
            completedDate: iso(m.completedDate),
            status: m.status || "pending",
            reminderDays: m.reminderDays ?? 7,
          }),
        );
      }

      onSubmit(formattedValues);
    };

    // ---- Shared option renderers ----
    const currencyOptions = CURRENCIES.map((c) => (
      <Option key={c.value} value={c.value}>
        {c.symbol} {c.value}
      </Option>
    ));

    const amountField = (name, label) => (
      <Form.Item name={name} label={label}>
        <InputNumber
          style={{ width: "100%" }}
          min={0}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          parser={(value) => value?.replace(/,/g, "")}
          placeholder="0.00"
          size="large"
        />
      </Form.Item>
    );

    // ---- Tab: Transaction ----
    const transactionTab = (
      <>
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          className="mb-4"
          message={`${familyConfig.label} transaction`}
          description={
            <div className="space-y-1">
              <div>{familyConfig.description}</div>
              <div>
                <Text strong>You will be asked for: </Text>
                {familyConfig.needs}
              </div>
            </div>
          }
        />
        <Card title="Transaction Type">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="transactionType"
                label="What type of property transaction is this?"
                rules={[{ required: true, message: "Transaction type is required" }]}>
                <Select
                  placeholder="Select transaction type"
                  showSearch
                  optionFilterProp="label"
                  options={transactionOptions}
                  size="large"
                />
              </Form.Item>
            </Col>
            {transactionType === "other" && (
              <Col xs={24} md={12}>
                <Form.Item
                  name="otherTransactionType"
                  label="Specify transaction type"
                  rules={[{ required: true, message: "Please specify the transaction type" }]}>
                  <Input placeholder="Enter transaction type" size="large" />
                </Form.Item>
              </Col>
            )}
          </Row>
          <Text type="secondary">
            Changing the transaction type updates the sections and fields shown in this form.
          </Text>
        </Card>
      </>
    );

    // ---- Tab: Property ----
    const propertyTab = (
      <Card title="Property Information">
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="propertyType" label="Property Type">
              <Select placeholder="Select property type" size="large">
                {PROPERTY_TYPES.map((p) => (
                  <Option key={p.value} value={p.value}>
                    {p.icon} {p.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={16}>
            <Form.Item name="propertyAddress" label="Address">
              <Input placeholder="Street, plot number, estate, city" size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="propertyState" label="State">
              <Select placeholder="Select state" showSearch optionFilterProp="label" size="large">
                {NIGERIAN_STATES.map((s) => (
                  <Option key={s.value} value={s.label}>
                    {s.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="propertyLga" label="Local Government Area">
              <Input placeholder="LGA" size="large" />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item name="landSizeValue" label="Land Size">
              <InputNumber style={{ width: "100%" }} min={0} placeholder="0" size="large" />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item name="landSizeUnit" label="Unit">
              <Select placeholder="Unit" size="large">
                {LAND_SIZE_UNITS.map((u) => (
                  <Option key={u.value} value={u.value}>
                    {u.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="titleDocument" label="Title Document">
              <Select placeholder="Select title document" size="large">
                {TITLE_DOCUMENTS.map((d) => (
                  <Option key={d.value} value={d.value}>
                    {d.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="titleNumber" label="Title Number">
              <Input placeholder="e.g. LA/CO/2019/0451" size="large" />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    );

    // ---- Tab: Parties ----
    const partyCard = (key) => {
      const label = getPartyLabel(family, key);
      return (
        <Card title={label.name} className="mb-6" key={key}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name={`${key}Name`} label={`${label.name} name`}>
                <Input placeholder={`Enter ${label.name.toLowerCase()}`} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={`${key}Contact`} label="Contact information">
                <Input placeholder={label.contact} size="large" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      );
    };

    const partiesTab = <>{meta.parties.map((key) => partyCard(key))}</>;

    // ---- Tab: Financials ----
    const financialsTab = (
      <>
        {meta.pricing === "purchase" && (
          <Card title="Consideration" className="mb-6">
            <Row gutter={16}>
              <Col xs={24} md={16}>
                {amountField("purchasePriceAmount", "Purchase price")}
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="purchasePriceCurrency" label="Currency" initialValue="NGN">
                  <Select size="large">{currencyOptions}</Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>
        )}
        {meta.pricing === "rent" && (
          <>
            <Card title="Rent" className="mb-6">
              <Row gutter={16}>
                <Col xs={24} md={10}>
                  {amountField("rentAmountAmount", "Rent amount")}
                </Col>
                <Col xs={24} md={7}>
                  <Form.Item name="rentAmountCurrency" label="Currency" initialValue="NGN">
                    <Select size="large">{currencyOptions}</Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={7}>
                  <Form.Item name="rentAmountFrequency" label="Frequency">
                    <Select placeholder="Frequency" size="large">
                      {RENT_FREQUENCIES.map((f) => (
                        <Option key={f.value} value={f.value}>
                          {f.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
            <Card title="Security Deposit" className="mb-6">
              <Row gutter={16}>
                <Col xs={24} md={16}>
                  {amountField("securityDepositAmount", "Deposit amount")}
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="securityDepositCurrency" label="Currency" initialValue="NGN">
                    <Select size="large">{currencyOptions}</Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </>
        )}
        <Card title="Payment Terms">
          <Form.Item name="paymentTerms" label="Payment terms">
            <Select placeholder="Select payment terms" size="large">
              {PAYMENT_TERMS.map((term) => (
                <Option key={term.value} value={term.value}>
                  {term.icon} {term.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Card>
      </>
    );

    // ---- Tab: Documents ----
    const documentsTab = (
      <>
        {meta.contractOfSale && (
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
                <Form.Item name="contractOfSaleExecutionDate" label="Execution date">
                  <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="contractOfSaleCompletionDate" label="Completion date">
                  <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} size="large" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        )}

        {meta.lease && (
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
                <Form.Item name="leaseCommencementDate" label="Commencement date">
                  <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item name="leaseExpiryDate" label="Expiry date">
                  <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item name="leaseRenewalOption" label="Renewal option" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item name="leaseDurationYears" label="Duration (years)">
                  <InputNumber min={0} style={{ width: "100%" }} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item name="leaseDurationMonths" label="Duration (months)">
                  <InputNumber min={0} max={11} style={{ width: "100%" }} size="large" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        )}

        {meta.deed && (
          <Card title="Deed of Assignment">
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
                <Form.Item name="deedExecutionDate" label="Execution date">
                  <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item name="deedRegistrationDate" label="Registration date">
                  <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item name="deedRegistrationNumber" label="Registration number">
                  <Input placeholder="Enter registration number" size="large" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        )}
      </>
    );

    // ---- Tab: Compliance & Due Diligence ----
    const complianceTab = (
      <>
        {meta.consent && (
          <Card title="Governor's Consent" className="mb-6">
            <Row gutter={16}>
              <Col xs={24} md={6}>
                <Form.Item name="consentRequired" label="Required" valuePropName="checked">
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
                <Form.Item name="consentApplicationDate" label="Application date">
                  <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item name="consentApprovalDate" label="Approval date">
                  <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="consentReferenceNumber" label="Reference number">
                  <Input placeholder="Enter reference number" size="large" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        )}

        {meta.survey && (
          <Card title="Survey Plan" className="mb-6">
            <Row gutter={16}>
              <Col xs={24} md={6}>
                <Form.Item name="surveyAvailable" label="Available" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={9}>
                <Form.Item name="surveyNumber" label="Survey number">
                  <Input placeholder="e.g. SUR/2024/001" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={9}>
                <Form.Item name="surveyDate" label="Survey date">
                  <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} size="large" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        )}

        <Card title="Title Search" className="mb-6">
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item name="titleSearchCompleted" label="Completed" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="titleSearchDate" label="Search date">
                <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="titleSearchFindings" label="Findings">
                <TextArea rows={3} placeholder="Enter findings from the title search" />
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

        <Card title="Physical Inspection">
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item name="inspectionCompleted" label="Completed" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="inspectionDate" label="Inspection date">
                <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="inspectionFindings" label="Findings">
                <TextArea rows={3} placeholder="Enter findings from the physical inspection" />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </>
    );

    // ---- Tab: Development ----
    const developmentTab = (
      <Card title="Development Information">
        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item name="developmentApplicable" label="Development applicable" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        {developmentApplicable && (
          <>
            <Row gutter={16}>
              <Col xs={24} md={8}>
                {amountField("developmentCostAmount", "Estimated cost")}
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="developmentCostCurrency" label="Currency" initialValue="NGN">
                  <Select size="large">{currencyOptions}</Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="developmentCompletionDate" label="Expected completion">
                  <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Planning Permit</Divider>
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item name="planningPermitStatus" label="Status">
                  <Select placeholder="Select status" size="large">
                    <Option value="not-required">Not Required</Option>
                    <Option value="pending">Pending</Option>
                    <Option value="approved">Approved</Option>
                    <Option value="rejected">Rejected</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="planningPermitDate" label="Approval date">
                  <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Building Permit</Divider>
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item name="buildingPermitStatus" label="Status">
                  <Select placeholder="Select status" size="large">
                    <Option value="not-required">Not Required</Option>
                    <Option value="pending">Pending</Option>
                    <Option value="approved">Approved</Option>
                    <Option value="rejected">Rejected</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="buildingPermitDate" label="Approval date">
                  <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} size="large" />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
      </Card>
    );

    // ---- Tab: Lease Management ----
    const leaseTab = (
      <>
        <Card title="Renewal Tracking" className="mb-6">
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item name="renewalStatus" label="Renewal status">
                <Select size="large">
                  <Option value="not-initiated">Not Initiated</Option>
                  <Option value="in-progress">In Progress</Option>
                  <Option value="agreed">Agreed</Option>
                  <Option value="disputed">Disputed</Option>
                  <Option value="declined">Declined</Option>
                  <Option value="completed">Completed</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="renewalInitiated" label="Renewal initiated" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="renewalDeadline" label="Renewal deadline">
                <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="renewalNoticePeriod" label="Notice period (days)">
                <InputNumber min={0} style={{ width: "100%" }} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="rentIncreasePercentage" label="Rent increase (%)">
                <InputNumber min={0} max={100} style={{ width: "100%" }} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={18}>
              <Form.Item name="renewalTerms" label="Renewal terms">
                <Input placeholder="e.g. Renewal subject to a rent review of not more than 10%" size="large" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="Lease Alerts" className="mb-6">
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item name="alertsEnabled" label="Alerts enabled" valuePropName="checked" initialValue={true}>
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="emailNotification" label="Email notifications" valuePropName="checked" initialValue={true}>
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="smsNotification" label="SMS notifications" valuePropName="checked" initialValue={false}>
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item name="notifyLandlord" label="Notify landlord" valuePropName="checked" initialValue={true}>
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="notifyTenant" label="Notify tenant" valuePropName="checked" initialValue={true}>
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Text type="secondary">
            Alerts are raised at 90, 30, 14 and 7 days before the lease expiry or renewal deadline.
          </Text>
        </Card>

        <Card title="Lease Milestones">
          <Form.List name="leaseMilestones">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row gutter={16} key={key} align="middle" className="mb-2">
                    <Col xs={24} md={7}>
                      <Form.Item
                        {...restField}
                        name={[name, "title"]}
                        label="Milestone"
                        rules={[{ required: true, message: "Milestone title is required" }]}>
                        <Input placeholder="e.g. Serve renewal notice" />
                      </Form.Item>
                    </Col>
                    <Col xs={12} md={4}>
                      <Form.Item {...restField} name={[name, "targetDate"]} label="Target date">
                        <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} />
                      </Form.Item>
                    </Col>
                    <Col xs={12} md={4}>
                      <Form.Item {...restField} name={[name, "status"]} label="Status">
                        <Select>
                          <Option value="pending">Pending</Option>
                          <Option value="completed">Completed</Option>
                          <Option value="skipped">Skipped</Option>
                          <Option value="overdue">Overdue</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={12} md={4}>
                      <Form.Item {...restField} name={[name, "reminderDays"]} label="Remind (days)">
                        <InputNumber min={0} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={12} md={5}>
                      <Button
                        danger
                        block
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}>
                        Remove
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => add({ status: "pending", reminderDays: 7 })}>
                  Add milestone
                </Button>
              </>
            )}
          </Form.List>
        </Card>
      </>
    );

    // ---- Assemble tabs based on the selected transaction ----
    // Until a transaction type is chosen there is nothing else worth showing.
    const transactionTabOnly = [
      { key: "transaction", label: "Transaction", icon: <SwapOutlined />, children: transactionTab },
    ];

    const fullTabItems = [
      { key: "transaction", label: "Transaction", icon: <SwapOutlined />, children: transactionTab },
      { key: "property", label: "Property", icon: <HomeOutlined />, children: propertyTab },
      { key: "parties", label: "Parties", icon: <TeamOutlined />, children: partiesTab },
      meta.pricing !== "none" && {
        key: "financials",
        label: "Financials",
        icon: <DollarOutlined />,
        children: financialsTab,
      },
      (meta.contractOfSale || meta.deed || meta.lease) && {
        key: "documents",
        label: "Documents",
        icon: <FileTextOutlined />,
        children: documentsTab,
      },
      {
        key: "compliance",
        label: "Compliance & Diligence",
        icon: <SafetyCertificateOutlined />,
        children: complianceTab,
      },
      meta.development && {
        key: "development",
        label: "Development",
        icon: <ToolOutlined />,
        children: developmentTab,
      },
      meta.lease && {
        key: "lease",
        label: "Lease Management",
        icon: <CalendarOutlined />,
        children: leaseTab,
      },
    ].filter(Boolean);

    const tabItems = transactionType ? fullTabItems : transactionTabOnly;

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

          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="mb-6" />

          <div className="flex justify-end gap-4 mt-6">
            <Button size="large" onClick={handleReset}>
              Reset
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}>
              {mode === "create" ? "Create Property Details" : "Update Property Details"}
            </Button>
          </div>
        </Form>
      </>
    );
  },
);

PropertyForm.displayName = "PropertyForm";

export default PropertyForm;
