import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Card, Row, Col, Typography, Button } from "antd";
import {
  AuditOutlined,
  GlobalOutlined,
  UserAddOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useAdminHook } from "../hooks/useAdminHook";

const { Title, Text } = Typography;

const settingsItems = [
  {
    key: "audit-logs",
    title: "Audit Logs",
    description: "Track all user actions and system changes",
    icon: <AuditOutlined />,
    path: "/dashboard/settings/audit-logs",
    adminOnly: true,
  },
  {
    key: "webhooks",
    title: "Webhooks",
    description: "Manage webhook integrations and events",
    icon: <GlobalOutlined />,
    path: "/dashboard/settings/webhooks",
    adminOnly: true,
  },
  {
    key: "invitations",
    title: "Invitations",
    description: "Send and manage team invitations",
    icon: <UserAddOutlined />,
    path: "/dashboard/settings/invitations",
    adminOnly: true,
  },
];

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperOrAdmin } = useAdminHook();

  const visibleItems = settingsItems.filter(
    (item) => !item.adminOnly || isSuperOrAdmin
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={3} className="mb-1">
          <SettingOutlined className="mr-2" />
          Settings
        </Title>
        <Text type="secondary">
          Manage your account settings and integrations
        </Text>
      </div>

      {location.pathname === "/dashboard/settings" && (
        <Row gutter={[16, 16]}>
          {visibleItems.map((item) => (
            <Col xs={24} sm={12} lg={8} key={item.key}>
              <Card
                hoverable
                className="h-full cursor-pointer transition-all duration-200 hover:shadow-lg"
                onClick={() => navigate(item.path)}
                cover={
                  <div
                    style={{
                      fontSize: "48px",
                      height: "120px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "#fff",
                    }}
                  >
                    {item.icon}
                  </div>
                }
              >
                <Card.Meta
                  title={item.title}
                  description={item.description}
                />
                <Button
                  type="primary"
                  ghost
                  className="mt-3 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(item.path);
                  }}
                >
                  Open
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Outlet />
    </div>
  );
};

export default Settings;
