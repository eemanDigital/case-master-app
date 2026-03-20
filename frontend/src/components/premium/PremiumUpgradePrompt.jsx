import { Button, Card, Result, Typography, Space, Divider } from "antd";
import { CrownOutlined, RocketOutlined, CheckCircleOutlined, StarOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const { Title, Text, Paragraph } = Typography;

const FEATURES = [
  "Deadline Manager with Kanban Board",
  "Custom Deadline Engine with Escalation",
  "Automated Compliance & Annual Return Tracker",
  "Live Penalty Calculator",
  "CAC Inactive Status Watchdog",
  "No-Code Automation Builder",
  "Milestone-Based Fee Protector",
  "Document Watermarking",
  "Performance Analytics & Reports",
];

const PremiumUpgradePrompt = ({ 
  title = "Premium Feature", 
  description = "This feature is available on our Professional and Enterprise plans.",
  compact = false,
  showFeatures = true,
}) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);

  const plan = user?.firm?.subscription?.plan || "free";
  const isPremium = plan === "professional" || plan === "enterprise";

  if (isPremium) return null;

  if (compact) {
    return (
      <Card 
        bordered={false}
        style={{ 
          borderRadius: 12, 
          background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
          color: "white"
        }}
        bodyStyle={{ padding: 24 }}
      >
        <div style={{ textAlign: "center" }}>
          <CrownOutlined style={{ fontSize: 32, color: "#fbbf24", marginBottom: 12 }} />
          <Title level={4} style={{ color: "white", margin: "8px 0" }}>
            Upgrade to Access
          </Title>
          <Paragraph style={{ color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>
            {description}
          </Paragraph>
          <Space>
            <Button 
              type="primary" 
              icon={<RocketOutlined />}
              onClick={() => navigate("/dashboard/billings")}
              style={{ background: "#fbbf24", borderColor: "#fbbf24", color: "#000" }}
            >
              Upgrade Now
            </Button>
            <Button 
              ghost 
              style={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }}
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </Space>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      padding: 24,
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
    }}>
      <Card 
        bordered={false}
        style={{ 
          maxWidth: 600, 
          width: "100%",
          borderRadius: 16,
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
        }}
        bodyStyle={{ padding: 40 }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ 
            width: 80, 
            height: 80, 
            borderRadius: "50%", 
            background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 8px 24px rgba(251, 191, 36, 0.4)"
          }}>
            <CrownOutlined style={{ fontSize: 36, color: "white" }} />
          </div>
          
          <Title level={2} style={{ margin: "0 0 8px" }}>
            Premium Feature
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Unlock advanced tools to supercharge your law firm
          </Text>
        </div>

        {showFeatures && (
          <>
            <Divider>What's Included</Divider>
            <div style={{ marginBottom: 24 }}>
              {FEATURES.map((feature, index) => (
                <div 
                  key={index} 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 12, 
                    padding: "8px 0",
                    borderBottom: index < FEATURES.length - 1 ? "1px solid #f0f0f0" : "none"
                  }}
                >
                  <CheckCircleOutlined style={{ color: "#10b981", fontSize: 16 }} />
                  <Text>{feature}</Text>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ 
          background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
          textAlign: "center"
        }}>
          <StarOutlined style={{ color: "#3b82f6", fontSize: 24, marginBottom: 8 }} />
          <Title level={4} style={{ margin: "0 0 4px" }}>
            Current Plan: {plan.charAt(0).toUpperCase() + plan.slice(1)}
          </Title>
          <Text type="secondary">
            Upgrade to Professional or Enterprise to access all premium features
          </Text>
        </div>

        <Space style={{ width: "100%", justifyContent: "center" }} size="middle">
          <Button 
            type="primary" 
            size="large"
            icon={<RocketOutlined />}
            onClick={() => navigate("/dashboard/billings")}
            style={{ 
              height: 48, 
              paddingLeft: 32, 
              paddingRight: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              border: "none"
            }}
          >
            Upgrade Now
          </Button>
          <Button 
            size="large"
            onClick={() => navigate(-1)}
            style={{ height: 48, paddingLeft: 24, paddingRight: 24, borderRadius: 8 }}
          >
            Go Back
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default PremiumUpgradePrompt;
