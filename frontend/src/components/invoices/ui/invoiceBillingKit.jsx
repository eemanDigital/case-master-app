/* eslint-disable react/prop-types, react-refresh/only-export-components */
import {
  CalendarOutlined,
  CalculatorOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  FileTextOutlined,
  TagOutlined,
} from "@ant-design/icons";
import {
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";

const { Text } = Typography;

export const BILLING_METHODS = [
  {
    value: "hourly",
    label: "Hourly",
    icon: <ClockCircleOutlined />,
    description: "Charge per hour of work. Amount = hours × rate per hour.",
    fields: [{ key: "hours", label: "Hours", type: "number" }, { key: "rate", label: "Rate (₦/hr)", type: "currency" }],
    color: "blue",
  },
  {
    value: "fixed_fee",
    label: "Fixed Fee",
    icon: <DollarOutlined />,
    description:
      "A single flat price for the whole service. No hours, rates or quantities needed — what you type is what the client pays.",
    callout: "Billed at a single flat rate — no hourly tracking.",
    fields: [{ key: "fixedAmount", label: "Fixed Fee Amount (₦)", type: "currency" }],
    color: "amber",
    highlight: true,
  },
  {
    value: "item",
    label: "Item-based",
    icon: <TagOutlined />,
    description: "Bill by quantity × unit price, e.g. court fees, filings or copies.",
    fields: [{ key: "quantity", label: "Quantity", type: "number" }, { key: "unitPrice", label: "Unit Price (₦)", type: "currency" }],
    color: "green",
  },
  {
    value: "retainer",
    label: "Retainer",
    icon: <CalendarOutlined />,
    description: "A fixed periodic amount (e.g. monthly) covered by an existing retainer.",
    fields: [{ key: "fixedAmount", label: "Retainer Amount (₦)", type: "currency" }],
    color: "purple",
  },
  {
    value: "contingency",
    label: "Contingency",
    icon: <FileTextOutlined />,
    description: "An agreed flat amount tied to a successful outcome for the service.",
    fields: [{ key: "fixedAmount", label: "Contingency Amount (₦)", type: "currency" }],
    color: "cyan",
  },
];

export const BILLING_METHOD_SELECT_OPTIONS = BILLING_METHODS.map((m) => ({
  value: m.value,
  label: m.label,
}));

export const getBillingMethodInfo = (value) =>
  BILLING_METHODS.find((m) => m.value === value) || BILLING_METHODS[0];

export const formatNaira = (amount) => {
  const value = Number(amount || 0);
  return `₦${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const nairaFormatter = (value) =>
  `₦ ${value ?? ""}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const nairaParser = (value) => String(value || "").replace(/₦\s?|(,*)/g, "");

export const SERVICE_CATEGORY_OPTIONS = [
  { value: "consultation", label: "Consultation" },
  { value: "court_appearance", label: "Court Appearance" },
  { value: "document_preparation", label: "Document Preparation" },
  { value: "research", label: "Research" },
  { value: "negotiation", label: "Negotiation" },
  { value: "filing", label: "Filing" },
  { value: "other", label: "Other" },
];

export const EXPENSE_CATEGORY_OPTIONS = [
  { value: "court_fees", label: "Court Fees" },
  { value: "filing_fees", label: "Filing Fees" },
  { value: "travel", label: "Travel" },
  { value: "accommodation", label: "Accommodation" },
  { value: "expert_witness", label: "Expert Witness" },
  { value: "process_server", label: "Process Server" },
  { value: "printing", label: "Printing" },
  { value: "other", label: "Other" },
];

export const computeServiceAmount = (service) => {
  if (!service) return 0;
  switch (service.billingMethod) {
    case "hourly":
      return service.hours > 0
        ? (service.hours || 0) * (service.rate || 0)
        : service.fixedAmount > 0
          ? service.fixedAmount
          : 0;
    case "item":
      return (service.quantity || 0) * (service.unitPrice || 0);
    case "fixed_fee":
    case "retainer":
    case "contingency":
    default:
      return service.fixedAmount || 0;
  }
};

export const computeInvoiceTotals = (values = {}) => {
  const servicesTotal = (values.services || []).reduce(
    (sum, s) => sum + computeServiceAmount(s),
    0,
  );
  const expensesTotal = (values.expenses || []).reduce(
    (sum, e) => sum + (e.amount || 0),
    0,
  );
  const currentCharges = servicesTotal + expensesTotal;
  const previousBalance = values.previousBalance || 0;
  const subtotal = currentCharges + previousBalance;

  let discountAmount = 0;
  if (values.discount && values.discount > 0 && values.discountType !== "none") {
    if (values.discountType === "percentage") {
      discountAmount = currentCharges * (values.discount / 100);
    } else if (values.discountType === "fixed") {
      discountAmount = Math.min(values.discount, currentCharges);
    }
    discountAmount = Math.min(discountAmount, currentCharges);
  }

  const taxableAmount = currentCharges - discountAmount;
  const taxAmount = taxableAmount * ((values.taxRate || 0) / 100);
  const total = taxableAmount + taxAmount + previousBalance;

  return {
    servicesTotal,
    expensesTotal,
    currentCharges,
    previousBalance,
    subtotal,
    discountAmount,
    taxAmount,
    total,
  };
};

const METHOD_COLORS = {
  blue: "border-blue-200 text-blue-700 bg-blue-50 hover:border-blue-400",
  amber: "border-amber-300 text-amber-800 bg-amber-50 hover:border-amber-500",
  green: "border-green-200 text-green-700 bg-green-50 hover:border-green-400",
  purple: "border-purple-200 text-purple-700 bg-purple-50 hover:border-purple-400",
  cyan: "border-cyan-200 text-cyan-700 bg-cyan-50 hover:border-cyan-400",
};

const METHOD_ACTIVE_COLORS = {
  blue: "border-blue-500 bg-blue-600 text-white shadow-sm",
  amber: "border-amber-500 bg-amber-500 text-white shadow-sm",
  green: "border-green-500 bg-green-600 text-white shadow-sm",
  purple: "border-purple-500 bg-purple-600 text-white shadow-sm",
  cyan: "border-cyan-500 bg-cyan-600 text-white shadow-sm",
};

export const BillingMethodPicker = ({ value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {BILLING_METHODS.map((m) => {
      const active = value === m.value;
      return (
        <button
          type="button"
          key={m.value}
          onClick={() => onChange?.(m.value)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
            active ? METHOD_ACTIVE_COLORS[m.color] : METHOD_COLORS[m.color]
          }`}>
          <span className="flex items-center gap-1.5">{m.icon}{m.label}</span>
        </button>
      );
    })}
  </div>
);

export const ServiceBillingCard = ({ form, field, title, required, onRemove }) => {
  const services = Form.useWatch("services", form) || [];
  const service = services?.[field.name];
  const method = service?.billingMethod || "hourly";
  const methodInfo = getBillingMethodInfo(method);
  const amount = computeServiceAmount(service);

  const renderInput = (cfg) => {
    if (cfg.type === "currency") {
      return (
        <InputNumber
          className="w-full"
          min={0}
          formatter={nairaFormatter}
          parser={nairaParser}
        />
      );
    }
    return <InputNumber className="w-full" min={cfg.key === "quantity" ? 1 : 0} />;
  };

  return (
    <Card
      size="small"
      title={title}
      extra={
        <Space size={8}>
          <Text className="text-sm text-gray-500">Amount</Text>
          <Text strong className="text-green-600">{formatNaira(amount)}</Text>
          {typeof onRemove === "function" && (
            <DeleteOutlined className="text-red-700 ml-2" onClick={onRemove} />
          )}
        </Space>
      }>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Form.Item
            label="Service Description"
            name={[field.name, "description"]}
            rules={[
              { required: !!required, message: "Service description is required" },
            ]}>
            <Input placeholder="e.g., Court Appearance, Document Preparation" />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            label="How will this service be billed?"
            name={[field.name, "billingMethod"]}
            rules={[
              { required: true, message: "Billing method is required" },
            ]}
            style={{ marginBottom: 8 }}>
            <BillingMethodPicker />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {methodInfo.description}
          </Text>
          {methodInfo.highlight && (
            <Tag color="gold" className="mt-2">
              {methodInfo.callout}
            </Tag>
          )}
        </Col>

        <Col xs={24}>
          <Row gutter={[16, 16]}>
            {methodInfo.fields.map((cfg) => (
              <Col xs={24} md={12} key={cfg.key}>
                <Form.Item label={cfg.label} name={[field.name, cfg.key]}>
                  {renderInput(cfg)}
                </Form.Item>
              </Col>
            ))}
          </Row>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item label="Category" name={[field.name, "category"]}>
            <Select options={SERVICE_CATEGORY_OPTIONS} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="Date of Service" name={[field.name, "date"]}>
            <DatePicker className="w-full" />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export const InvoiceSummary = ({ form }) => {
  const values = Form.useWatch([], form) || {};
  const totals = computeInvoiceTotals(values);
  const discountLabel =
    totals.discountAmount > 0
      ? `Discount (${values.discountType === "percentage" ? `${values.discount}%` : "fixed"})`
      : "Discount";

  const rows = [
    { label: "Services", value: totals.servicesTotal, color: "text-gray-900" },
    { label: "Expenses", value: totals.expensesTotal, color: "text-gray-900" },
    { label: "Subtotal", value: totals.subtotal, color: "text-blue-600" },
    totals.discountAmount > 0
      ? { label: discountLabel, value: -totals.discountAmount, color: "text-orange-600" }
      : null,
    { label: `Tax (${values.taxRate || 0}%)`, value: totals.taxAmount, color: "text-gray-900" },
  ].filter(Boolean);

  return (
    <Card
      size="small"
      className="bg-gray-50"
      title={
        <Space>
          <CalculatorOutlined className="text-blue-600" />
          <Text strong>Live Summary</Text>
        </Space>
      }>
      <Descriptions column={1} size="small" labelStyle={{ color: "#6b7280" }}>
        {rows.map((r) => (
          <Descriptions.Item key={r.label} label={r.label}>
            <Text strong className={r.color}>
              {formatNaira(r.value)}
            </Text>
          </Descriptions.Item>
        ))}
        <Descriptions.Item label="Previous Balance">
          <Text strong className="text-gray-900">{formatNaira(totals.previousBalance)}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Grand Total">
          <Text strong className="text-green-600 text-base">{formatNaira(totals.total)}</Text>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export const ExpenseCard = ({ field, title, onRemove }) => (
  <Card
    size="small"
    title={title}
    extra={
      <DeleteOutlined
        className="text-red-700"
        onClick={() => onRemove?.()}
      />
    }>
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Form.Item
          label="Expense Description"
          name={[field.name, "description"]}
          rules={[{ required: true, message: "Expense description is required" }]}>
          <Input placeholder="e.g., Court Filing Fees, Process Server" />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item
          label="Amount (₦)"
          name={[field.name, "amount"]}
          rules={[{ required: true, message: "Expense amount is required" }]}>
          <InputNumber
            className="w-full"
            min={0}
            formatter={nairaFormatter}
            parser={nairaParser}
          />
        </Form.Item>
      </Col>
    </Row>
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Form.Item label="Category" name={[field.name, "category"]}>
          <Select options={EXPENSE_CATEGORY_OPTIONS} />
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item label="Receipt Number" name={[field.name, "receiptNumber"]}>
          <Input placeholder="e.g., CT-2024-001" />
        </Form.Item>
      </Col>
      <Col xs={24} md={8}>
        <Form.Item
          label="Reimbursable"
          name={[field.name, "isReimbursable"]}
          valuePropName="checked"
          tooltip="Include this amount in the client's total bill">
          <Switch checkedChildren="Yes" unCheckedChildren="No" />
        </Form.Item>
      </Col>
    </Row>
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Form.Item label="Date" name={[field.name, "date"]}>
          <DatePicker className="w-full" />
        </Form.Item>
      </Col>
    </Row>
  </Card>
);

export const ServiceDeleteButton = ({ onRemove }) => (
  <DeleteOutlined className="text-red-700" onClick={onRemove} />
);