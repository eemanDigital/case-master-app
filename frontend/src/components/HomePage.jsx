import React, { useState } from "react";
import {
  Button,
  Card,
  Row,
  Col,
  Input,
  Form,
  Tag,
  Progress,
  Space,
  Grid,
} from "antd";
import {
  SafetyCertificateOutlined,
  FileTextOutlined,
  TeamOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  LockOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  // BriefcaseOutlined,
  EyeOutlined,
  RightOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  SecurityScanOutlined,
  FolderOpenOutlined,
  AuditOutlined,
  ScheduleOutlined,
  UserSwitchOutlined,
  StarOutlined,
  RocketOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import caseMasterLogo from "../assets/case-master-logo.svg";

const { useBreakpoint } = Grid;

const HomePage = () => {
  const [email, setEmail] = useState("");
  const screens = useBreakpoint();

  const coreFeatures = [
    {
      icon: <FileTextOutlined className="text-2xl" />,
      title: "Case Management",
      description:
        "Centralized case files, tracking, and complete matter histories in a unified legal workflow system.",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: <TeamOutlined className="text-2xl" />,
      title: "Client Dashboard",
      description:
        "Secure client portal for real-time case updates, documents, and communication tracking.",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: <CalendarOutlined className="text-2xl" />,
      title: "Automated Cause List",
      description:
        "Dynamic tracking of upcoming hearings and court appearances with automatic updates.",
      color: "from-green-500 to-green-600",
    },
    {
      icon: <BarChartOutlined className="text-2xl" />,
      title: "Case Analytics",
      description:
        "Comprehensive reporting and statistics for case progress and outcome analysis.",
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: <ScheduleOutlined className="text-2xl" />,
      title: "Task Management",
      description:
        "Assign, track, and manage legal tasks with priority settings and deadline management.",
      color: "from-cyan-500 to-cyan-600",
    },
    {
      icon: <UserSwitchOutlined className="text-2xl" />,
      title: "Leave Management",
      description:
        "Coordinate team schedules, manage leave requests, and ensure optimal resource allocation.",
      color: "from-pink-500 to-pink-600",
    },
  ];

  const securityFeatures = [
    {
      icon: <LockOutlined />,
      text: "End-to-end encryption for all client data",
    },
    {
      icon: <SecurityScanOutlined />,
      text: "Role-based access controls with granular permissions",
    },
    {
      icon: <AuditOutlined />,
      text: "Complete audit trails and activity logging",
    },
    { icon: <GlobalOutlined />, text: "ISO 27001 compliant infrastructure" },
    {
      icon: <CloudServerOutlined />,
      text: "Regular security assessments and compliance checks",
    },
    { icon: <DatabaseOutlined />, text: "GDPR and data privacy compliant" },
  ];

  const workflowSteps = [
    {
      step: "01",
      title: "Case Intake",
      description: "Streamlined case creation with automated client onboarding",
      icon: <FolderOpenOutlined />,
    },
    {
      step: "02",
      title: "Activity Tracking",
      description: "Real-time updates on case progress and communications",
      icon: <EyeOutlined />,
    },
    {
      step: "03",
      title: "Reporting",
      description: "Generate comprehensive case reports automatically",
      icon: <FileTextOutlined />,
    },
    {
      step: "04",
      title: "Client Collaboration",
      description: "Secure portal for client access and feedback",
      icon: <TeamOutlined />,
    },
  ];

  const stats = [
    {
      value: "95%",
      label: "Reduced Admin Time",
      icon: <ThunderboltOutlined />,
    },
    {
      value: "100%",
      label: "Deadline Compliance",
      icon: <CheckCircleOutlined />,
    },
    { value: "3x", label: "Faster Case Resolution", icon: <RocketOutlined /> },
    { value: "500+", label: "Law Firms Trust Us", icon: <StarOutlined /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-white/10 py-4">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                <img
                  src={caseMasterLogo}
                  alt="case master logo"
                  className="text-white text-lg"
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                CaseMaster
              </span>
            </div>

            <div className="hidden lg:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-300 hover:text-white transition-colors font-medium">
                Features
              </a>
              <a
                href="#security"
                className="text-gray-300 hover:text-white transition-colors font-medium">
                Security
              </a>
              <a
                href="#workflow"
                className="text-gray-300 hover:text-white transition-colors font-medium">
                Workflow
              </a>
              <Button
                type="primary"
                className="bg-gradient-to-r from-blue-600 to-blue-700 border-none h-10 px-6 font-medium">
                Request Demo
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Tag
              icon={<SafetyCertificateOutlined />}
              className="bg-blue-500/10 border-blue-500/30 text-blue-300 px-4 py-2 rounded-full mb-8 text-base">
              Trusted by 500+ Law Firms
            </Tag>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Legal Case Management
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Reimagined
              </span>
            </h1>

            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              A monolithic platform that unifies case management, client
              collaboration, and firm operations in one secure, powerful system
              designed exclusively for legal professionals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                type="primary"
                size="large"
                className="bg-gradient-to-r from-blue-600 to-blue-700 border-none h-12 px-8 font-semibold text-base flex items-center gap-2"
                icon={<RightOutlined />}>
                Start Free Trial
              </Button>
              <Button
                size="large"
                className="bg-white/5 border-white/10 text-white h-12 px-8 font-semibold text-base hover:bg-white/10">
                Schedule Demo
              </Button>
            </div>

            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Preview */}
      <div className="py-20 bg-gradient-to-b from-transparent to-gray-900/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Everything You Need, In One Place
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Experience the power of a truly unified legal management
                platform
              </p>
            </div>

            {/* Dashboard Mockup */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Dashboard Header */}
              <div className="bg-gray-900/50 border-b border-white/10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-sm text-gray-500">
                  CaseMaster Dashboard
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6">
                <Row gutter={[16, 16]} className="mb-6">
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="bg-gray-800/50 border-gray-700 h-full">
                      <div className="text-gray-400 text-sm mb-2">
                        Active Cases
                      </div>
                      <div className="text-2xl font-bold text-white">142</div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="bg-gray-800/50 border-gray-700 h-full">
                      <div className="text-gray-400 text-sm mb-2">
                        Upcoming Hearings
                      </div>
                      <div className="text-2xl font-bold text-white">23</div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="bg-gray-800/50 border-gray-700 h-full">
                      <div className="text-gray-400 text-sm mb-2">
                        Pending Tasks
                      </div>
                      <div className="text-2xl font-bold text-white">18</div>
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card className="bg-gray-800/50 border-gray-700 h-full">
                      <div className="text-gray-400 text-sm mb-2">
                        Today's Reports
                      </div>
                      <div className="text-2xl font-bold text-white">7</div>
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={16}>
                    <Card
                      title={
                        <span className="text-white">Recent Case Activity</span>
                      }
                      className="bg-gray-800/50 border-gray-700 h-full">
                      <Space direction="vertical" className="w-full">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-gray-300">
                                Case #{i}2345 - Status Updated
                              </span>
                            </div>
                            <span className="text-gray-500 text-sm">
                              2h ago
                            </span>
                          </div>
                        ))}
                      </Space>
                    </Card>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card
                      title={<span className="text-white">Quick Actions</span>}
                      className="bg-gray-800/50 border-gray-700 h-full">
                      <Space direction="vertical" className="w-full">
                        <Button
                          block
                          className="bg-blue-600/20 border-blue-500/30 text-blue-300">
                          New Case Report
                        </Button>
                        <Button
                          block
                          className="bg-purple-600/20 border-purple-500/30 text-purple-300">
                          Update Cause List
                        </Button>
                        <Button
                          block
                          className="bg-green-600/20 border-green-500/30 text-green-300">
                          Assign Tasks
                        </Button>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Comprehensive Legal Management Suite
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              All the tools your firm needs in a single, integrated platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((feature, index) => (
              <div
                key={index}
                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-white/[0.08] transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
                <RightOutlined className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute top-6 right-6 text-blue-400" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section
        id="workflow"
        className="py-20 bg-gradient-to-b from-gray-900/50 to-gray-950">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Streamlined Legal Workflow
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              From case intake to resolution, manage everything efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflowSteps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mx-auto">
                    <span className="text-2xl font-bold text-white">
                      {step.step}
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Tag
                icon={<SecurityScanOutlined />}
                className="bg-green-500/10 border-green-500/30 text-green-300 px-4 py-2 rounded-full mb-6 text-base">
                Enterprise Security
              </Tag>

              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Built with Security at Its Core
              </h2>

              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                We understand the sensitivity of legal data. Our platform is
                engineered with the highest security standards to protect your
                firm and client information.
              </p>

              <div className="space-y-4">
                {securityFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircleOutlined className="text-green-500 text-lg mt-1 flex-shrink-0" />
                    <span className="text-gray-300">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <LockOutlined className="text-blue-400 text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Data Protection
                    </h3>
                    <p className="text-gray-400">
                      Multi-layered security architecture
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-gray-400 text-sm mb-2">
                      <span>Encryption Level</span>
                      <span className="text-white font-semibold">AES-256</span>
                    </div>
                    <Progress
                      percent={100}
                      showInfo={false}
                      strokeColor="linear-gradient(90deg, #1890ff 0%, #52c41a 100%)"
                      className="custom-progress"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-gray-400 text-sm mb-2">
                      <span>Compliance Coverage</span>
                      <span className="text-white font-semibold">100%</span>
                    </div>
                    <Progress
                      percent={100}
                      showInfo={false}
                      strokeColor="linear-gradient(90deg, #52c41a 0%, #1890ff 100%)"
                      className="custom-progress"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-gray-400 text-sm mb-2">
                      <span>Uptime SLA</span>
                      <span className="text-white font-semibold">99.9%</span>
                    </div>
                    <Progress
                      percent={99.9}
                      showInfo={false}
                      strokeColor="linear-gradient(90deg, #1890ff 0%, #722ed1 100%)"
                      className="custom-progress"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900/10 via-gray-900/20 to-purple-900/10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 rounded-3xl p-8 lg:p-12 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ready to Transform Your Legal Practice?
              </h2>
              <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
                Join forward-thinking law firms already using CaseMaster to
                streamline their operations and enhance client service.
              </p>

              <Form className="max-w-md mx-auto">
                <Space.Compact className="w-full">
                  <Input
                    size="large"
                    placeholder="Enter your work email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder-gray-500"
                  />
                  <Button
                    type="primary"
                    size="large"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 border-none">
                    Start Free Trial
                  </Button>
                </Space.Compact>
              </Form>

              <p className="text-gray-500 text-sm mt-4">
                <CheckCircleOutlined className="mr-2" />
                No credit card required • 14-day free trial • Full access to all
                features
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                <img
                  src={caseMasterLogo}
                  alt="case master logo"
                  className="text-white text-lg"
                />
              </div>
              <span className="text-xl font-bold text-white">CaseMaster</span>
            </div>

            <div className="flex items-center gap-6 text-gray-400 mb-6 md:mb-0">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Support
              </a>
            </div>

            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} CaseMaster. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .custom-progress .ant-progress-bg {
          height: 8px !important;
          border-radius: 4px;
        }

        .custom-progress .ant-progress-outer {
          height: 8px;
        }

        .ant-card {
          background: transparent;
        }

        .ant-card-head {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .ant-card-head-title {
          color: white;
        }

        .ant-btn {
          border-radius: 8px;
        }

        .ant-input {
          border-radius: 8px;
        }

        .ant-space-compact {
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
