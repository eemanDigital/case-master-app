// components/user-forms/sections/ClientFormSection.jsx
// Client accounts are either a person or an organisation. The field set
// changes accordingly, driven by `clientCategory` (individual | corporate |
// government | ngo). Every field rendered here exists on User.clientDetails,
// and the ones that differ per category are only shown when they apply.
import { Form, Input, Select, Row, Col, DatePicker, Alert, Radio } from "antd";
import {
  BankOutlined,
  UserOutlined,
  GlobalOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { contactMethodOptions } from "../../../data/options";

const ORG_CATEGORIES = ["corporate", "government", "ngo"];

const CATEGORY_OPTIONS = [
  {
    value: "individual",
    label: "Individual",
    icon: UserOutlined,
    description: "A private person acting on their own behalf",
    tone: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    value: "corporate",
    label: "Corporate",
    icon: BankOutlined,
    description: "A registered company or business entity",
    tone: "text-indigo-600 bg-indigo-50 border-indigo-200",
  },
  {
    value: "government",
    label: "Government",
    icon: GlobalOutlined,
    description: "A ministry, agency or public body",
    tone: "text-cyan-600 bg-cyan-50 border-cyan-200",
  },
  {
    value: "ngo",
    label: "NGO / Non-Profit",
    icon: TeamOutlined,
    description: "A charitable or non-governmental organisation",
    tone: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
];

const ClientFormSection = () => {
  const form = Form.useFormInstance();
  // Watching the category from inside the section keeps the field itself
  // mounted, so switching categories cannot loop the render.
  const category = Form.useWatch("clientCategory", form);
  const isOrganisation = ORG_CATEGORIES.includes(category);

  // Organisation-only fields must not linger when switching back to an
  // individual, otherwise stale data is sent to the API.
  const handleCategoryChange = (value) => {
    if (!ORG_CATEGORIES.includes(value)) {
      form.setFieldsValue({
        company: undefined,
        industry: undefined,
        taxId: undefined,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Alert
        message="Client Details"
        description="Tell us who this client is so we can tailor matters, documents and billing to them."
        type="info"
        showIcon
      />

      <Form.Item
        name="clientCategory"
        label="Client Type"
        rules={[{ required: true, message: "Please select a client type" }]}
        extra="Individual clients are natural persons; corporate, government and NGO clients are organisations."
      >
        <Radio.Group
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full"
        >
          <Row gutter={[12, 12]}>
            {CATEGORY_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <Col xs={24} sm={12} key={option.value}>
                  <Radio.Button
                    value={option.value}
                    className="!h-auto w-full rounded-lg border-2 !px-4 !py-3"
                    style={{ borderColor: "#f0f0f0" }}>
                    <span
                      className={`inline-flex h-full w-full items-start gap-3 text-left ${
                        option.value === category ? option.tone : ""
                      }`}>
                      <Icon className="mt-1 text-xl" />
                      <span className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-800">
                          {option.label}
                        </span>
                        <span className="text-xs font-normal text-gray-500">
                          {option.description}
                        </span>
                      </span>
                    </span>
                  </Radio.Button>
                </Col>
              );
            })}
          </Row>
        </Radio.Group>
      </Form.Item>

      {isOrganisation && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50/60 p-4">
          <h4 className="text-sm font-semibold text-gray-700">
            Organisation Information
          </h4>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="company"
                label="Registered Company / Organisation Name"
                rules={[
                  { required: true, message: "Company name is required" },
                  { min: 2, message: "Please provide the full legal name" },
                ]}>
                <Input placeholder="e.g. Lagos Holdings Ltd." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="industry"
                label="Industry / Sector"
                rules={[
                  { required: true, message: "Please select an industry" },
                ]}>
                <Input placeholder="e.g. Financial Services" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="taxId"
                label="Tax Identification Number"
                extra="Stored encrypted. Leave blank if the client is not registered for tax.">
                <Input placeholder="e.g. TIN-12345678" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="clientSince"
                label="Client Since"
                extra="Defaults to today when left blank.">
                <DatePicker
                  className="w-full"
                  placeholder="Select date"
                  disabledDate={(current) => current && current > new Date()}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      )}

      {!isOrganisation && (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="clientSince"
              label="Client Since"
              extra="Defaults to today when left blank.">
              <DatePicker
                className="w-full"
                placeholder="Select date"
                disabledDate={(current) => current && current > new Date()}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="referralSource" label="How did they find us?">
              <Input placeholder="e.g. Referral by an existing client" />
            </Form.Item>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="preferredContactMethod"
            label="Preferred Contact Method"
            rules={[
              { required: true, message: "Please select a contact method" },
            ]}
            initialValue="email">
            <Select options={contactMethodOptions} />
          </Form.Item>
        </Col>
        {isOrganisation && (
          <Col xs={24} md={12}>
            <Form.Item name="referralSource" label="How did they find us?">
              <Input placeholder="e.g. Tender invitation, referral" />
            </Form.Item>
          </Col>
        )}
      </Row>

      <Form.Item
        name="billingAddress"
        label="Billing Address"
        extra="Leave blank to bill to the contact address captured earlier.">
        <Input.TextArea
          placeholder="No. 2, Maitama Close, Abuja"
          rows={2}
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </Form.Item>

      <Form.Item
        name="clientNotes"
        label="Internal Notes"
        extra="Only visible to firm staff. Never shared with the client.">
        <Input.TextArea
          placeholder="e.g. Prefers email updates; billing handled by their finance team."
          rows={3}
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      </Form.Item>
    </div>
  );
};

export default ClientFormSection;
