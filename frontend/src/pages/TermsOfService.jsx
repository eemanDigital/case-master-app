import React from "react";
import { Card, Typography, Divider, Row, Col } from "antd";
import { Link } from "react-router-dom";
import { 
  SafetyCertificateOutlined, 
  TeamOutlined, 
  DollarOutlined, 
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined
} from "@ant-design/icons";
import caseMasterLogo from "../assets/case-master-logo.svg";

const { Title, Paragraph, Text } = Typography;

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h--br from-blue-10 bg-gradient-to500 to-purple-600 rounded-xl flex items-center justify-center">
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <SafetyCertificateOutlined className="text-3xl text-blue-600" />
            </div>
            <Title level={1} className="!mb-2">Terms of Service</Title>
            <Text type="secondary" className="text-lg">
              Last Updated: March 2026
            </Text>
          </div>

          <Divider />

          <div className="prose max-w-none">
            <Title level={4}>1. Acceptance of Terms</Title>
            <Paragraph>
              By accessing and using LawMaster ("the Service"), you accept and agree to be bound by 
              the terms and provision of this agreement. If you do not agree to abide by these terms, 
              please do not use this service.
            </Paragraph>

            <Title level={4}>2. Description of Service</Title>
            <Paragraph>
              LawMaster is a cloud-based legal practice management software designed for law firms 
              in Nigeria. The Service provides matter management, client portal, invoicing, task 
              management, and calendar functionality.
            </Paragraph>

            <Title level={4}>3. User Eligibility</Title>
            <Paragraph>
              The Service is available to:
            </Paragraph>
            <ul className="list-disc pl-6 space-y-2">
              <li>Registered law firms in Nigeria</li>
              <li>Legal practitioners with valid practising licenses</li>
              <li>Corporate organizations with legal departments</li>
              <li>Clients of registered law firms</li>
            </ul>

            <Title level={4}>4. Account Registration</Title>
            <Paragraph>
              <Text strong>4.1</Text> You must provide accurate and complete registration information.
              <br />
              <Text strong>4.2</Text> You are responsible for maintaining the confidentiality of your account credentials.
              <br />
              <Text strong>4.3</Text> You must be at least 18 years of age to use this service.
              <br />
              <Text strong>4.4</Text> Each account is for a single law firm or organization.
            </Paragraph>

            <Title level={4}>5. Subscription and Payment</Title>
            <Paragraph>
              <Text strong>5.1</Text> Subscription fees are billed monthly in Nigerian Naira (NGN).
              <br />
              <Text strong>5.2</Text> All fees are non-refundable unless otherwise specified.
              <br />
              <Text strong>5.3</Text> Prices are subject to change with 30 days notice.
              <br />
              <Text strong>5.4</Text> Failed payments may result in service suspension.
            </Paragraph>

            <Title level={4}>6. Data Ownership and Security</Title>
            <Paragraph>
              <Text strong>6.1</Text> All client data remains the property of the law firm.
              <br />
              <Text strong>6.2</Text> We implement industry-standard encryption (AES-256) to protect your data.
              <br />
              <Text strong>6.3</Text> We comply with the Nigeria Data Protection Regulation (NDPR).
              <br />
              <Text strong>6.4</Text> Data is stored on secure servers within Nigeria.
            </Paragraph>

            <Title level={4}>7. Acceptable Use</Title>
            <Paragraph>
              You agree not to:
            </Paragraph>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Introduce viruses, malware, or other harmful code</li>
              <li>Share your account credentials with unauthorized persons</li>
              <li>Resell or redistribute the Service without authorization</li>
            </ul>

            <Title level={4}>8. Limitation of Liability</Title>
            <Paragraph>
              LawMaster shall not be liable for any indirect, incidental, special, consequential, 
              or punitive damages resulting from your use of or inability to use the Service. 
              We do not guarantee the Service will be error-free or uninterrupted.
            </Paragraph>

            <Title level={4}>9. Intellectual Property</Title>
            <Paragraph>
              The Service, including all content, features, and functionality, is owned by LawMaster 
              and is protected by Nigerian and international copyright, trademark, and other 
              intellectual property laws.
            </Paragraph>

            <Title level={4}>10. Termination</Title>
            <Paragraph>
              <Text strong>10.1</Text> Either party may terminate this agreement with 30 days written notice.
              <br />
              <Text strong>10.2</Text> Upon termination, your access to the Service will be immediately revoked.
              <br />
              <Text strong>10.3</Text> Data export will be available for 30 days after termination.
            </Paragraph>

            <Title level={4}>11. Governing Law</Title>
            <Paragraph>
              These Terms shall be governed by and construed in accordance with the laws of the 
              Federal Republic of Nigeria. Any disputes shall be resolved in Nigerian courts.
            </Paragraph>

            <Title level={4}>12. Contact Information</Title>
            <Paragraph>
              For questions about these Terms, please contact us:
            </Paragraph>
            <Row gutter={[16, 16]} className="mt-4">
              <Col xs={24} sm={12}>
                <div className="flex items-center gap-3">
                  <MailOutlined className="text-blue-600 text-xl" />
                  <div>
                    <Text strong>Email</Text>
                    <br />
                    <Text>legal@lawmaster.ng</Text>
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
                    <Text strong>Address</Text>
                    <br />
                    <Text>Lagos, Nigeria</Text>
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          <Divider />

          <div className="text-center mt-8">
            <Link to="/register">
              <Text className="text-blue-600 hover:underline">
                Create an Account
              </Text>
            </Link>
            <Text type="secondary" className="mx-2">|</Text>
            <Link to="/privacy-policy">
              <Text className="text-blue-600 hover:underline">
                Privacy Policy
              </Text>
            </Link>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <Text type="secondary">
            © 2026 LawMaster. All rights reserved. Registered in Nigeria.
          </Text>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
