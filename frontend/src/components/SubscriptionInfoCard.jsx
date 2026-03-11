import { useState } from "react";
import { Card, Tag, Progress, Typography, Button, Alert, Collapse, Modal, List, Divider, message } from "antd";
import {
  CrownOutlined,
  UserOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  StarOutlined,
  CheckOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { requestPlanUpgrade } from "../redux/features/auth/authService";

const { Text, Title } = Typography;
const { Panel } = Collapse;

const planNames = {
  FREE: "Free Trial",
  BASIC: "Basic",
  PRO: "Professional",
  ENTERPRISE: "Enterprise",
};

const PLANS = [
  {
    key: "BASIC",
    name: "Basic",
    price: "₦5,000",
    period: "/month",
    features: [
      "Up to 3 users",
      "50 cases per month",
      "20GB storage",
      "Email support",
    ],
  },
  {
    key: "PRO",
    name: "Professional",
    price: "₦15,000",
    period: "/month",
    features: [
      "Up to 10 users",
      "Unlimited cases",
      "100GB storage",
      "Priority support",
      "Advanced reporting",
    ],
    popular: true,
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Unlimited users",
      "Unlimited cases",
      "Unlimited storage",
      "24/7 Dedicated support",
      "Custom integrations",
      "On-premise option",
    ],
  },
];

const SubscriptionInfoCard = ({ firmData, showUpgradeButton = true }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const navigate = useNavigate();

  if (!firmData) return null;

  const { subscription, limits, usage } = firmData;

  if (!subscription) return null;

  const plan = subscription.plan || "FREE";
  const status = subscription.status || "ACTIVE";

  const isActive = status === "ACTIVE" || status === "TRIAL";
  const isExpired = status === "EXPIRED" || status === "SUSPENDED";

  const daysRemaining = () => {
    if (status === "TRIAL" && subscription.trialEndsAt) {
      const days = Math.ceil(
        (new Date(subscription.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return days > 0 ? days : 0;
    }
    if (status === "ACTIVE" && subscription.expiresAt) {
      const days = Math.ceil(
        (new Date(subscription.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return days > 0 ? days : null;
    }
    return null;
  };

  const daysLeft = daysRemaining();

  const userLimit = limits?.users || 1;
  const currentUsers = usage?.currentUserCount || 0;
  const userPercentage = userLimit === 999999 ? 0 : (currentUsers / userLimit) * 100;

  const storageLimit = limits?.storageGB || 5;
  const currentStorage = usage?.storageUsedGB || 0;
  const storagePercentage = storageLimit === 999999 ? 0 : (currentStorage / storageLimit) * 100;

  const casesLimit = limits?.casesPerMonth || 10;
  const currentCases = usage?.casesThisMonth || 0;
  const casesPercentage = casesLimit === 999999 ? 0 : (currentCases / casesLimit) * 100;

  const formatLimit = (value) => (value === 999999 ? "Unlimited" : value);

  const handleUpgrade = async (planKey) => {
    try {
      await requestPlanUpgrade(planKey);
      message.success(`Upgrade request for ${planNames[planKey]} plan submitted! We'll contact you shortly.`);
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to submit upgrade request");
    }
    setUpgradeModalOpen(false);
  };

  const handleRenew = () => {
    message.success("Renewal request submitted! We'll contact you shortly.");
  };

  const headerContent = (
    <div className="flex items-center justify-between w-full pr-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <CrownOutlined className="text-xl text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Title level={5} className="!mb-0 !text-white">
              {planNames[plan]} Plan
            </Title>
            <Tag
              color={isActive ? "green" : isExpired ? "red" : "orange"}
              className="!text-xs"
            >
              {status}
            </Tag>
          </div>
          {daysLeft !== null && (
            <Text className="text-white/80 text-xs">
              <ClockCircleOutlined className="mr-1" />
              {daysLeft > 0
                ? `${daysLeft} days remaining`
                : status === "TRIAL"
                ? "Trial expired"
                : "Subscription expired"}
            </Text>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card
      className="mb-4"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        border: "none",
      }}
    >
      <Collapse
        ghost
        activeKey={collapsed ? [] : ["subscription"]}
        onChange={() => setCollapsed(!collapsed)}
        className="subscription-collapse"
      >
        <Panel key="subscription" header={headerContent}>
          <div className="mt-4">
            {isExpired && (
              <Alert
                message="Subscription Expired"
                description="Your subscription has expired. Please renew to continue using all features."
                type="warning"
                showIcon
                className="mb-4"
                action={
                  <Button size="small" type="primary" onClick={handleRenew}>
                    Renew Now
                  </Button>
                }
              />
            )}

            {showUpgradeButton && plan === "FREE" && (
              <div className="mb-4">
                <Button
                  type="primary"
                  icon={<StarOutlined />}
                  className="bg-white text-purple-600 hover:bg-gray-100"
                  onClick={() => setUpgradeModalOpen(true)}
                >
                  Upgrade Plan
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Text className="text-white/90">
                    <UserOutlined className="mr-1" /> Users
                  </Text>
                  <Text className="text-white font-semibold">
                    {currentUsers} / {formatLimit(userLimit)}
                  </Text>
                </div>
                <Progress
                  percent={Math.min(userPercentage, 100)}
                  showInfo={false}
                  strokeColor="white"
                  trailColor="rgba(255,255,255,0.2)"
                  size="small"
                />
                {userPercentage >= 80 && (
                  <Text className="text-yellow-300 text-xs">
                    <WarningOutlined /> Approaching limit
                  </Text>
                )}
              </div>

              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Text className="text-white/90">
                    <DatabaseOutlined className="mr-1" /> Storage
                  </Text>
                  <Text className="text-white font-semibold">
                    {currentStorage.toFixed(1)}GB / {formatLimit(storageLimit)}GB
                  </Text>
                </div>
                <Progress
                  percent={Math.min(storagePercentage, 100)}
                  showInfo={false}
                  strokeColor="white"
                  trailColor="rgba(255,255,255,0.2)"
                  size="small"
                />
                {storagePercentage >= 80 && (
                  <Text className="text-yellow-300 text-xs">
                    <WarningOutlined /> Approaching limit
                  </Text>
                )}
              </div>

              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Text className="text-white/90">
                    <FileTextOutlined className="mr-1" /> Cases/Month
                  </Text>
                  <Text className="text-white font-semibold">
                    {currentCases} / {formatLimit(casesLimit)}
                  </Text>
                </div>
                <Progress
                  percent={Math.min(casesPercentage, 100)}
                  showInfo={false}
                  strokeColor="white"
                  trailColor="rgba(255,255,255,0.2)"
                  size="small"
                />
                {casesPercentage >= 80 && (
                  <Text className="text-yellow-300 text-xs">
                    <WarningOutlined /> Approaching limit
                  </Text>
                )}
              </div>
            </div>
          </div>
        </Panel>
      </Collapse>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <CrownOutlined className="text-purple-600" />
            <span>Upgrade Your Plan</span>
          </div>
        }
        open={upgradeModalOpen}
        onCancel={() => setUpgradeModalOpen(false)}
        footer={null}
        width={800}
        className="upgrade-modal"
      >
        <p className="text-gray-600 mb-4">
          Choose a plan that best fits your needs. All plans include full access to all features.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((p) => (
            <div
              key={p.key}
              className={`border-2 rounded-lg p-4 ${
                p.popular 
                  ? "border-purple-500 bg-purple-50" 
                  : plan === p.key
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200"
              }`}
            >
              {p.popular && (
                <div className="text-center mb-2">
                  <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-lg font-bold text-center mb-2">{p.name}</h3>
              <div className="text-center mb-4">
                <span className="text-2xl font-bold">{p.price}</span>
                <span className="text-gray-500">{p.period}</span>
              </div>
              <Divider className="my-2" />
              <ul className="space-y-2 mb-4">
                {p.features.map((feature, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <CheckOutlined className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                type={p.popular ? "primary" : "default"}
                block
                disabled={plan === p.key}
                onClick={() => handleUpgrade(p.key)}
                className={p.popular ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                {plan === p.key ? "Current Plan" : "Select Plan"}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <Button type="link" onClick={() => { setUpgradeModalOpen(false); message.info("Contact us at support@lawmaster.ng for custom Enterprise solutions"); }}>
            Contact us for custom Enterprise solutions <RightOutlined />
          </Button>
        </div>
      </Modal>

      <style>{`
        .subscription-collapse .ant-collapse-header {
          padding: 0 !important;
        }
        .subscription-collapse .ant-collapse-content-box {
          padding: 0 !important;
        }
      `}</style>
    </Card>
  );
};

export default SubscriptionInfoCard;
