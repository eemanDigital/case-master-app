import { Card, Typography, Divider, Row, Col, Table } from "antd";
import { Link } from "react-router-dom";
import {
  LockOutlined,
  DatabaseOutlined,
  TeamOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const PrivacyPolicy = () => {
  const dataCategories = [
    {
      category: "Personal Identification",
      examples: "Name, email, phone number, address",
      purpose: "Account creation, communication",
    },
    {
      category: "Financial Information",
      examples: "Bank details, payment records",
      purpose: "Invoice processing, payments",
    },
    {
      category: "Legal Case Data",
      examples: "Matter details, court documents, case notes",
      purpose: "Legal matter management",
    },
    {
      category: "Business Information",
      examples: "Company name, CAC number, industry",
      purpose: "Corporate client onboarding",
    },
    {
      category: "Technical Data",
      examples: "IP address, browser type, device info",
      purpose: "Security, analytics",
    },
  ];

  const rights = [
    {
      right: "Right to be Informed",
      description:
        "You have the right to know how we collect and use your data",
    },
    {
      right: "Right to Access",
      description:
        "You can request a copy of all personal data we hold about you",
    },
    {
      right: "Right to Rectification",
      description: "You can request correction of inaccurate personal data",
    },
    {
      right: "Right to Erasure",
      description:
        "You can request deletion of your personal data (subject to legal requirements)",
    },
    {
      right: "Right to Data Portability",
      description: "You can request your data in a machine-readable format",
    },
    {
      right: "Right to Object",
      description: "You can object to processing for direct marketing",
    },
    {
      right: "Right to Withdraw Consent",
      description: "You can withdraw consent at any time",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              LawMaster
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        <Card className="shadow-lg border-0">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <LockOutlined className="text-3xl text-green-600" />
            </div>
            <Title level={1} className="!mb-2">
              Privacy Policy
            </Title>
            <Text type="secondary" className="text-lg">
              How LawMaster handles personal data
            </Text>
            <div className="mt-4">
              <Text type="secondary">Last Updated: September 2026</Text>
            </div>
          </div>

          <Divider />

          <div className="prose max-w-none">
            <Title level={4}>1. Introduction</Title>
            <Paragraph>
              LawMaster (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is
              committed to protecting your privacy. This Privacy Policy explains
              how we collect, use, disclose, and safeguard your information when
              you use our legal practice management software in Nigeria.
            </Paragraph>
            <Paragraph>
              This notice is intended to explain our data practices. It is not a
              certification of compliance. Our processing and the rights
              available to you depend on applicable data-protection law and, for
              law-firm client and matter records, the instructions and
              responsibilities agreed with your law firm.
            </Paragraph>

            <Title level={4}>2. Data Protection Roles</Title>
            <Card className="bg-gray-50 border-0 mb-6">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TeamOutlined className="text-blue-600" />
                    </div>
                    <div>
                      <Text strong>Law firm customer</Text>
                      <br />
                      <Text>
                        Usually determines how client and matter records are
                        used
                      </Text>
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DatabaseOutlined className="text-blue-600" />
                    </div>
                    <div>
                      <Text strong>LawMaster</Text>
                      <br />
                      <Text>
                        Provides and operates the software; roles depend on the
                        data and service agreement
                      </Text>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            <Title level={4}>3. Information We Collect</Title>
            <Paragraph>
              We collect the following categories of personal data:
            </Paragraph>
            <Table
              dataSource={dataCategories}
              columns={[
                {
                  title: "Category",
                  dataIndex: "category",
                  key: "category",
                  render: (text) => <Text strong>{text}</Text>,
                },
                { title: "Examples", dataIndex: "examples", key: "examples" },
                { title: "Purpose", dataIndex: "purpose", key: "purpose" },
              ]}
              pagination={false}
              rowKey="category"
              size="small"
              className="mb-6"
            />

            <Title level={4}>4. How We Use Your Data</Title>
            <Paragraph>
              We use your personal data for the following purposes:
            </Paragraph>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                To provide and maintain our legal practice management services
              </li>
              <li>
                To process transactions and send related information including
                purchase confirmations and invoices
              </li>
              <li>
                To send administrative information, such as updates, security
                alerts, and support messages
              </li>
              <li>
                To respond to your comments, questions, and provide customer
                service
              </li>
              <li>
                To comply with legal obligations and regulatory requirements
              </li>
              <li>To enforce our terms, conditions, and policies</li>
            </ul>

            <Title level={4}>5. Data Storage and Security</Title>
            <Paragraph>
              We use technical and organizational measures intended to protect
              information. The safeguards and storage locations depend on the
              service providers and deployment configured for the account. File
              objects uploaded through the standard S3 file service request
              provider-side AES-256 encryption; this does not establish that
              every data store or file flow uses the same encryption. We do not
              make a blanket claim of a particular transport-encryption version,
              independent security certification, or completed penetration
              testing through this notice.
            </Paragraph>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Authentication and role-based access controls are provided
                within the application.
              </li>
              <li>
                Some file-download links are time-limited; public
                document-sharing features may be accessible to anyone with the
                link.
              </li>
              <li>
                Customers should avoid uploading sensitive records until their
                deployment, access controls, and storage configuration have been
                reviewed.
              </li>
            </ul>

            <Title level={4}>6. Data Retention</Title>
            <Paragraph>
              We do not state fixed retention periods here. Retention depends on
              the type of information, the customer’s instructions and
              agreement, applicable legal obligations, and operational backup
              processes. Law firms should manage matter-record retention and
              deletion according to their professional and legal obligations.
              Contact us or your law firm to ask about a specific record.
            </Paragraph>

            <Title level={4}>7. Privacy Requests</Title>
            <Paragraph>
              Applicable data-protection laws may provide rights such as access,
              correction, deletion, portability, objection, or withdrawal of
              consent, subject to legal limits. For client or matter information
              held by a law firm, contact that firm first. For account
              information or questions about LawMaster’s processing, contact us
              using the details below.
            </Paragraph>
            <Row gutter={[16, 16]} className="mb-6">
              {rights.map((item) => (
                <Col xs={24} sm={12} key={item.right}>
                  <div className="bg-gray-50 p-4 rounded-lg h-full">
                    <div className="flex items-start gap-2">
                      <CheckCircleOutlined className="text-green-600 mt-1" />
                      <div>
                        <Text strong>{item.right}</Text>
                        <br />
                        <Text type="secondary">{item.description}</Text>
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>

            <Title level={4}>8. Data Sharing</Title>
            <Paragraph>We may share your personal data with:</Paragraph>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <Text strong>Service Providers:</Text> Third-party vendors who
                assist us in operating our platform
              </li>
              <li>
                <Text strong>Legal Authorities:</Text> When required by law or
                to protect our legal rights
              </li>
              <li>
                <Text strong>Professional Advisors:</Text> Lawyers, accountants,
                and auditors
              </li>
            </ul>
            <Paragraph className="mt-4">
              The service providers and data recipients used for a particular
              deployment should be confirmed with the law firm or account
              administrator.
            </Paragraph>

            <Title level={4}>9. Cookies and Tracking Technologies</Title>
            <Paragraph>
              The current consent control stores your selected preferences in
              browser local storage. Its analytics and marketing options record
              preferences only; they do not themselves enable tracking
              integrations. If the deployed service adds optional tracking
              technologies, their providers and purposes should be disclosed
              before they are used. See the{" "}
              <Link to="/cookie-policy">Cookie Policy</Link>.
            </Paragraph>

            <Title level={4}>10. International Data Transfers</Title>
            <Paragraph>
              We do not guarantee Nigeria-only storage or processing. Depending
              on the deployment and provider configuration, information may be
              stored or processed outside Nigeria. Customers should confirm the
              regions, subprocessors, and transfer safeguards applicable to
              their deployment before entering personal or confidential matter
              data.
            </Paragraph>

            <Title level={4}>11. Changes to This Policy</Title>
            <Paragraph>
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the new policy on
              this page and updating the &quot;Last Updated&quot; date.
            </Paragraph>

            <Title level={4}>12. Contact Us</Title>
            <Paragraph>
              To exercise your rights or for any privacy-related inquiries,
              please contact us:
            </Paragraph>
            <Row gutter={[16, 16]} className="mt-4">
              <Col xs={24} sm={12}>
                <div className="flex items-center gap-3">
                  <MailOutlined className="text-blue-600 text-xl" />
                  <div>
                    <Text strong>Email</Text>
                    <br />
                    <Text>privacy@lawmaster.ng</Text>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="flex items-center gap-3">
                  <PhoneOutlined className="text-blue-600 text-xl" />
                  <div>
                    <Text strong>Phone</Text>
                    <br />
                    <Text>+234 700 529 6674</Text>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="flex items-center gap-3">
                  <EnvironmentOutlined className="text-blue-600 text-xl" />
                  <div>
                    <Text strong>Privacy contact</Text>
                    <br />
                    <Text>privacy@lawmaster.ng</Text>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          <Divider />

          <div className="text-center mt-8">
            <Link to="/terms-of-service">
              <Text className="text-blue-600 hover:underline">
                Terms of Service
              </Text>
            </Link>
            <Text type="secondary" className="mx-2">
              |
            </Text>
            <Link to="/register">
              <Text className="text-blue-600 hover:underline">
                Create an Account
              </Text>
            </Link>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <Text type="secondary">© 2026 LawMaster. All rights reserved.</Text>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
