import React from "react";
import { Card, Typography, Divider, Row, Col, Table } from "antd";
import { Link } from "react-router-dom";
import { 
  SafetyCertificateOutlined, 
  LockOutlined,
  DatabaseOutlined,
  TeamOutlined,
  GlobalOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const PrivacyPolicy = () => {
  const dataCategories = [
    { category: "Personal Identification", examples: "Name, email, phone number, address", purpose: "Account creation, communication" },
    { category: "Financial Information", examples: "Bank details, payment records", purpose: "Invoice processing, payments" },
    { category: "Legal Case Data", examples: "Matter details, court documents, case notes", purpose: "Legal matter management" },
    { category: "Business Information", examples: "Company name, CAC number, industry", purpose: "Corporate client onboarding" },
    { category: "Technical Data", examples: "IP address, browser type, device info", purpose: "Security, analytics" },
  ];

  const rights = [
    { right: "Right to be Informed", description: "You have the right to know how we collect and use your data" },
    { right: "Right to Access", description: "You can request a copy of all personal data we hold about you" },
    { right: "Right to Rectification", description: "You can request correction of inaccurate personal data" },
    { right: "Right to Erasure", description: "You can request deletion of your personal data (subject to legal requirements)" },
    { right: "Right to Data Portability", description: "You can request your data in a machine-readable format" },
    { right: "Right to Object", description: "You can object to processing for direct marketing" },
    { right: "Right to Withdraw Consent", description: "You can withdraw consent at any time" },
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
            <Title level={1} className="!mb-2">Privacy Policy</Title>
            <Text type="secondary" className="text-lg">
              Nigeria Data Protection Regulation (NDPR) Compliant
            </Text>
            <div className="mt-4">
              <Text type="secondary">Last Updated: March 2026</Text>
            </div>
          </div>

          <Divider />

          {/* NDPR Compliance Badge */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 mb-10 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <SafetyCertificateOutlined className="text-3xl" />
                <div>
                  <Text strong className="text-white text-lg">NDPR Compliant</Text>
                  <br />
                  <Text className="text-white/80">Registered with Nigeria Data Protection Bureau</Text>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleOutlined />
                <span>Data stored in Nigeria</span>
              </div>
            </div>
          </div>

          <div className="prose max-w-none">
            <Title level={4}>1. Introduction</Title>
            <Paragraph>
              LawMaster ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our legal 
              practice management software in Nigeria.
            </Paragraph>
            <Paragraph>
              This policy complies with the Nigeria Data Protection Regulation (NDPR) 2019 and other applicable 
              Nigerian laws.
            </Paragraph>

            <Title level={4}>2. Data Controller Information</Title>
            <Card className="bg-gray-50 border-0 mb-6">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TeamOutlined className="text-blue-600" />
                    </div>
                    <div>
                      <Text strong>Data Controller</Text>
                      <br />
                      <Text>LawMaster Technologies Ltd</Text>
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DatabaseOutlined className="text-blue-600" />
                    </div>
                    <div>
                      <Text strong>Registration</Text>
                      <br />
                      <Text>RC 1234567 (Nigeria)</Text>
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
                { title: "Category", dataIndex: "category", key: "category", render: (text) => <Text strong>{text}</Text> },
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
              <li>To provide and maintain our legal practice management services</li>
              <li>To process transactions and send related information including purchase confirmations and invoices</li>
              <li>To send administrative information, such as updates, security alerts, and support messages</li>
              <li>To respond to your comments, questions, and provide customer service</li>
              <li>To comply with legal obligations and regulatory requirements</li>
              <li>To enforce our terms, conditions, and policies</li>
            </ul>

            <Title level={4}>5. Data Storage and Security</Title>
            <Paragraph>
              <Text strong>5.1 Storage Location:</Text> All personal data is stored on secure servers located 
              within Nigeria, complying with data localization requirements.
              <br /><br />
              <Text strong>5.2 Security Measures:</Text> We implement the following security measures:
            </Paragraph>
            <ul className="list-disc pl-6 space-y-2">
              <li>AES-256 encryption for data at rest</li>
              <li>TLS 1.3 encryption for data in transit</li>
              <li>Role-based access controls (RBAC)</li>
              <li>Multi-factor authentication</li>
              <li>Regular security audits and penetration testing</li>
              <li>Employee data protection training</li>
            </ul>

            <Title level={4}>6. Data Retention</Title>
            <Paragraph>
              We retain your personal data only for as long as necessary to fulfill the purposes outlined 
              in this policy:
            </Paragraph>
            <Table
              dataSource={[
                { dataType: "Account Data", retention: "Duration of account + 6 years (legal requirement)", legalBasis: "Tax & legal compliance" },
                { dataType: "Transaction Records", retention: "7 years", legalBasis: "Tax & legal compliance" },
                { dataType: "Marketing Data", retention: "Until consent withdrawn", legalBasis: "Consent" },
                { dataType: "Technical Logs", retention: "1 year", legalBasis: "Legitimate interest" },
              ]}
              columns={[
                { title: "Data Type", dataIndex: "dataType", key: "dataType", render: (text) => <Text strong>{text}</Text> },
                { title: "Retention Period", dataIndex: "retention", key: "retention" },
                { title: "Legal Basis", dataIndex: "legalBasis", key: "legalBasis" },
              ]}
              pagination={false}
              rowKey="dataType"
              size="small"
              className="mb-6"
            />

            <Title level={4}>7. Your Rights Under NDPR</Title>
            <Paragraph>
              Under the Nigeria Data Protection Regulation, you have the following rights:
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
            <Paragraph>
              We may share your personal data with:
            </Paragraph>
            <ul className="list-disc pl-6 space-y-2">
              <li><Text strong>Service Providers:</Text> Third-party vendors who assist us in operating our platform</li>
              <li><Text strong>Legal Authorities:</Text> When required by law or to protect our legal rights</li>
              <li><Text strong>Professional Advisors:</Text> Lawyers, accountants, and auditors</li>
            </ul>
            <Paragraph className="mt-4">
              We do NOT sell your personal data to third parties.
            </Paragraph>

            <Title level={4}>9. Cookies and Tracking Technologies</Title>
            <Paragraph>
              We use cookies and similar tracking technologies to enhance your experience. You can control 
              cookies through your browser settings. For details, see our Cookie Policy.
            </Paragraph>

            <Title level={4}>10. International Data Transfers</Title>
            <Paragraph>
              Your data is primarily stored and processed in Nigeria. If we transfer data outside Nigeria, 
              we ensure adequate protections are in place in compliance with NDPR.
            </Paragraph>

            <Title level={4}>11. Changes to This Policy</Title>
            <Paragraph>
              We may update this Privacy Policy from time to time. We will notify you of any material 
              changes by posting the new policy on this page and updating the "Last Updated" date.
            </Paragraph>

            <Title level={4}>12. Contact Us</Title>
            <Paragraph>
              To exercise your rights or for any privacy-related inquiries, please contact us:
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
                    <Text strong>Data Protection Officer</Text>
                    <br />
                    <Text>Lagos, Nigeria</Text>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="flex items-center gap-3">
                  <GlobalOutlined className="text-blue-600 text-xl" />
                  <div>
                    <Text strong>Nigeria Data Protection Bureau</Text>
                    <br />
                    <Text>complaints@ndpb.gov.ng</Text>
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
            <Text type="secondary" className="mx-2">|</Text>
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
          <Text type="secondary">
            © 2026 LawMaster. All rights reserved. NDPR Compliant.
          </Text>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
