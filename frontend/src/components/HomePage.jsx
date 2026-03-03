import React, { useState, useEffect } from "react";
import { Button, Card, Row, Col, Tag, Space, Typography, Input } from "antd";
import { Link } from "react-router-dom";
import {
  SafetyCertificateOutlined,
  FileTextOutlined,
  TeamOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  LockOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  EyeOutlined,
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
  DollarOutlined,
  BellOutlined,
  LinkOutlined,
  MailOutlined,
  PhoneOutlined,
  MenuOutlined,
  CloseOutlined,
  ArrowRightOutlined,
  PlayCircleOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import caseMasterLogo from "../assets/case-master-logo.svg";

const { Title, Text, Paragraph } = Typography;

const HomePage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <FileTextOutlined />,
      title: "Matter Management",
      description: "Complete lifecycle management for legal matters with automated workflows",
      color: "from-blue-500 to-blue-600",
      details: ["Case intake & assignment", "Document management", "Deadline tracking", "Status updates"]
    },
    {
      icon: <TeamOutlined />,
      title: "Client Portal",
      description: "Secure self-service portal for clients to track matters and invoices",
      color: "from-purple-500 to-purple-600",
      details: ["Real-time updates", "Invoice payments", "Document access", "Communication hub"]
    },
    {
      icon: <DollarOutlined />,
      title: "Billing & Invoices",
      description: "Streamlined invoicing with multiple payment options and tracking",
      color: "from-emerald-500 to-emerald-600",
      details: ["Auto-generated invoices", "Payment tracking", "Online payments", "Financial reports"]
    },
    {
      icon: <CalendarOutlined />,
      title: "Calendar & Events",
      description: "Automated cause lists and court appearance scheduling",
      color: "from-amber-500 to-amber-600",
      details: ["Hearing reminders", "Court schedules", "Team calendars", "Auto-sync"]
    },
    {
      icon: <ScheduleOutlined />,
      title: "Task Management",
      description: "Assign, track and manage legal tasks with priority settings",
      color: "from-cyan-500 to-cyan-600",
      details: ["Task assignment", "Due date tracking", "Priority levels", "Progress monitoring"]
    },
    {
      icon: <AuditOutlined />,
      title: "Audit Logging",
      description: "Complete audit trail for compliance and security",
      color: "from-rose-500 to-rose-600",
      details: ["Activity tracking", "User actions", "System changes", "Compliance reports"]
    }
  ];

  const securityFeatures = [
    { icon: <LockOutlined />, title: "End-to-End Encryption", desc: "All data encrypted at rest and in transit" },
    { icon: <SecurityScanOutlined />, title: "Role-Based Access", desc: "Granular permissions for every user role" },
    { icon: <AuditOutlined />, title: "Complete Audit Trails", desc: "Full history of all system activities" },
    { icon: <CloudServerOutlined />, title: "Cloud Infrastructure", desc: "99.9% uptime with redundant backups" },
    { icon: <DatabaseOutlined />, title: "Data Privacy", desc: "GDPR & LGPD compliant data handling" },
    { icon: <GlobalOutlined />, title: "24/7 Security Monitoring", desc: "Continuous threat detection & response" }
  ];

  const stats = [
    { value: "500+", label: "Law Firms", suffix: "" },
    { value: "99.9%", label: "Uptime", suffix: "" },
    { value: "50K+", label: "Matters Managed", suffix: "" },
    { value: "24/7", label: "Support", suffix: "" }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "49",
      period: "/month",
      description: "Perfect for small law firms",
      features: [
        "Up to 5 users",
        "100 matters",
        "Client portal",
        "Basic reporting",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "149",
      period: "/month",
      description: "For growing practices",
      features: [
        "Up to 20 users",
        "Unlimited matters",
        "Client portal",
        "Advanced reporting",
        "API access",
        "Priority support",
        "Custom workflows"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations",
      features: [
        "Unlimited users",
        "Unlimited matters",
        "Dedicated instance",
        "Custom integrations",
        "SLA guarantee",
        "24/7 phone support",
        "On-premise option"
      ],
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Managing Partner",
      firm: "Johnson & Associates",
      quote: "LawMaster transformed how we manage our caseload. We've reduced administrative time by 60%.",
      avatar: "SJ"
    },
    {
      name: "Michael Chen",
      role: "Senior Partner",
      firm: "Chen Legal Group",
      quote: "The client portal alone has improved our client satisfaction significantly. Highly recommended.",
      avatar: "MC"
    },
    {
      name: "Emily Rodriguez",
      role: "Operations Manager",
      firm: "Rodriguez & Partners",
      quote: "Best investment we've made. The billing features alone have streamlined our entire finance workflow.",
      avatar: "ER"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent py-5"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                LawMaster
              </span>
            </Link>

            <div className="hidden lg:flex items-center space-x-8">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Features</a>
              <a href="#security" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Security</a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Pricing</a>
              <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Testimonials</a>
              <Link to="/login">
                <Button className="bg-white/10 border-white/10 text-white hover:bg-white/20 h-10 px-6 font-medium text-sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/login">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 border-none h-10 px-6 font-medium text-sm">
                  Get Started
                </Button>
              </Link>
            </div>

            <button className="lg:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0a0a0f]/98 backdrop-blur-xl border-b border-white/5 px-4 py-4">
            <div className="flex flex-col space-y-4">
              <a href="#features" className="text-gray-400 hover:text-white text-sm">Features</a>
              <a href="#security" className="text-gray-400 hover:text-white text-sm">Security</a>
              <a href="#pricing" className="text-gray-400 hover:text-white text-sm">Pricing</a>
              <a href="#testimonials" className="text-gray-400 hover:text-white text-sm">Testimonials</a>
              <Link to="/login">
                <Button block className="bg-white/10 border-white/10 text-white h-10">Sign In</Button>
              </Link>
              <Link to="/login">
                <Button block className="bg-gradient-to-r from-blue-600 to-purple-600 border-none h-10">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a0f] to-[#0a0a0f]"></div>
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '1s'}}></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-gray-300 text-sm">Trusted by 500+ law firms worldwide</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1]">
              The Modern Platform for
              <span className="block mt-2 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Legal Practice Management
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Streamline your entire legal practice with our all-in-one solution. 
              From matter management to client billing, everything you need to run a successful law firm.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link to="/login">
                <Button size="large" className="bg-gradient-to-r from-blue-600 to-purple-600 border-none h-14 px-8 font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all">
                  Start Free Trial <ArrowRightOutlined />
                </Button>
              </Link>
              <Button size="large" className="bg-white/5 border-white/10 text-white h-14 px-8 font-semibold text-base hover:bg-white/10 transition-all flex items-center gap-2">
                <PlayCircleOutlined /> Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto pt-8 border-t border-white/10">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-gray-500 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Tag className="bg-blue-500/10 border-blue-500/20 text-blue-400 px-4 py-1 rounded-full mb-4">
              FEATURES
            </Tag>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Everything You Need to Run Your Firm
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              A comprehensive suite of tools designed specifically for legal professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 hover:transform hover:-translate-y-1"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                  <span className="text-2xl text-white">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-500 text-sm">
                      <CheckOutlined className="text-green-400 text-xs" /> {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlight */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-transparent via-blue-900/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Tag className="bg-purple-500/10 border-purple-500/20 text-purple-400 px-4 py-1 rounded-full mb-4">
                CLIENT PORTAL
              </Tag>
              <h2 className="text-4xl font-bold mb-6">
                Empower Your Clients with Self-Service Access
              </h2>
              <p className="text-lg text-gray-400 mb-8">
                Give your clients a modern portal to track their matters, view invoices, 
                make payments, and communicate with your team—all in one place.
              </p>
              <div className="space-y-4">
                {[
                  "Real-time matter status updates",
                  "Secure document sharing",
                  "Online invoice payment",
                  "Two-way communication channel"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                      <CheckOutlined className="text-green-400 text-xs" />
                    </div>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-2xl opacity-30"></div>
              <div className="relative bg-gray-900 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <TeamOutlined className="text-white" />
                  </div>
                  <div>
                    <div className="font-medium">Client Portal</div>
                    <div className="text-xs text-gray-500">Welcome back, John</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Active Matters</div>
                    <div className="text-2xl font-bold">5</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Pending Invoices</div>
                    <div className="text-2xl font-bold text-amber-400">₦125,000</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-sm text-gray-400 mb-1">Recent Activity</div>
                    <div className="text-sm text-gray-300">Case #MAT-001 status updated</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Tag className="bg-green-500/10 border-green-500/20 text-green-400 px-4 py-1 rounded-full mb-4">
              SECURITY
            </Tag>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Enterprise-Grade Security
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Your data is protected with the same security standards used by major financial institutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-green-500/30 transition-all">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-xl text-green-400">{feature.icon}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Tag className="bg-amber-500/10 border-amber-500/20 text-amber-400 px-4 py-1 rounded-full mb-4">
              PRICING
            </Tag>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Choose the plan that fits your firm. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative bg-white/5 border rounded-2xl p-8 ${
                  plan.popular ? "border-purple-500/50 shadow-lg shadow-purple-500/20" : "border-white/10"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Tag className="bg-gradient-to-r from-purple-500 to-pink-500 border-none text-white px-4 py-1">
                      Most Popular
                    </Tag>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                </div>
                <div className="text-center mb-6">
                  <span className="text-5xl font-bold">${plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-300">
                      <CheckOutlined className="text-green-400" /> {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  block 
                  size="large" 
                  className={plan.popular 
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 border-none h-12 font-semibold" 
                    : "bg-white/10 border-white/10 text-white h-12 hover:bg-white/20"
                  }
                >
                  {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Tag className="bg-blue-500/10 border-blue-500/20 text-blue-400 px-4 py-1 rounded-full mb-4">
              TESTIMONIALS
            </Tag>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Trusted by Industry Leaders
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-xs text-gray-400">{testimonial.role}, {testimonial.firm}</div>
                  </div>
                </div>
                <p className="text-gray-300 italic">"{testimonial.quote}"</p>
                <div className="flex gap-1 mt-4">
                  {[1,2,3,4,5].map(i => (
                    <StarOutlined key={i} className="text-amber-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-3xl p-12 lg:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')]"></div>
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ready to Transform Your Practice?
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-xl mx-auto">
                Join 500+ law firms already using LawMaster to streamline their operations
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="large" className="bg-white text-purple-600 border-none h-14 px-8 font-semibold text-base hover:bg-gray-100">
                  Start Free Trial
                </Button>
                <Button size="large" className="bg-white/10 border-white/30 text-white h-14 px-8 font-semibold text-base hover:bg-white/20">
                  Schedule Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
                <span className="text-2xl font-bold">LawMaster</span>
              </div>
              <p className="text-gray-400 text-sm max-w-xs mb-6">
                The all-in-one legal practice management solution for modern law firms.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors">
                  <MailOutlined className="text-gray-400" />
                </div>
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors">
                  <PhoneOutlined className="text-gray-400" />
                </div>
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors">
                  <GlobalOutlined className="text-gray-400" />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 LawMaster. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
