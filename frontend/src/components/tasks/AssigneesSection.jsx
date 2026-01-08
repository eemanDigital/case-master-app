import React from "react";
import {
  Collapse,
  Space,
  Badge,
  Row,
  Col,
  Card,
  List,
  Tag,
  Avatar,
  Tooltip,
  Button,
  Typography,
} from "antd";
import {
  TeamOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EyeOutlined,
} from "@ant-design/icons";

const { Panel } = Collapse;
const { Text } = Typography;

const AssigneesSection = ({ task, currentUser, screens }) => {
  const teamAssignees = task?.assignees?.filter((a) => !a.isClient) || [];
  const clientAssignees = task?.assignees?.filter((a) => a.isClient) || [];

  const getRoleConfig = (role) => {
    const configs = {
      primary: { color: "gold", label: "Primary", icon: <UserOutlined /> },
      collaborator: {
        color: "blue",
        label: "Collaborator",
        icon: <TeamOutlined />,
      },
      reviewer: { color: "purple", label: "Reviewer", icon: <EyeOutlined /> },
      viewer: { color: "green", label: "Viewer", icon: <UserOutlined /> },
    };
    return configs[role] || configs.collaborator;
  };

  return (
    <Collapse ghost className="mb-6" defaultActiveKey={["assignees"]}>
      <Panel
        header={
          <Space className="w-full">
            <TeamOutlined />
            <Text strong className="truncate">
              Assignees & Roles
            </Text>
            <Badge
              count={teamAssignees.length + clientAssignees.length}
              style={{ backgroundColor: "#1890ff" }}
              className="flex-shrink-0"
            />
          </Space>
        }
        key="assignees">
        <Row gutter={[16, 16]}>
          {/* Team Assignees */}
          <Col xs={24} lg={12}>
            <Card
              size="small"
              title={
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    Team Members
                  </span>
                  <Badge count={teamAssignees.length} size="small" />
                </div>
              }
              bodyStyle={{ padding: "12px 0" }}>
              <List
                size="small"
                dataSource={teamAssignees}
                renderItem={(assignee) => {
                  const user = assignee.user;
                  const roleConfig = getRoleConfig(assignee.role);
                  return (
                    <List.Item
                      className="px-4 hover:bg-gray-50 transition-colors"
                      style={{ padding: "8px 16px" }}>
                      <div className="flex items-start w-full">
                        {/* Avatar */}
                        <div className="flex-shrink-0 mr-3">
                          <Avatar
                            size={32}
                            src={user?.photo}
                            className="border border-gray-200">
                            {user?.firstName?.[0]}
                            {user?.lastName?.[0]}
                          </Avatar>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Name and Role - Mobile optimized */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <Text
                              strong
                              className="truncate text-sm sm:text-base"
                              title={`${user?.firstName} ${user?.lastName}`}>
                              {user?.firstName} {user?.lastName}
                            </Text>

                            <div className="flex flex-wrap gap-1">
                              <Tag
                                size="small"
                                color={roleConfig.color}
                                icon={roleConfig.icon}
                                className="text-xs px-1.5 py-0.5 truncate max-w-[120px]">
                                <span className="truncate inline-block max-w-full">
                                  {roleConfig.label}
                                </span>
                              </Tag>

                              {/* Mobile-only role badge */}
                              <div className="sm:hidden inline-flex">
                                <Text
                                  type="secondary"
                                  className="text-xs px-2 py-0.5 bg-gray-100 rounded truncate max-w-[80px]"
                                  title={user?.position || user?.role}>
                                  {user?.position?.substring(0, 10) ||
                                    user?.role?.substring(0, 10)}
                                  {user?.position?.length > 10 ||
                                  user?.role?.length > 10
                                    ? "..."
                                    : ""}
                                </Text>
                              </div>
                            </div>
                          </div>

                          {/* Position/Description */}
                          <div className="hidden sm:block">
                            <Text
                              type="secondary"
                              className="text-xs truncate block"
                              title={user?.position || user?.role}>
                              {user?.position || user?.role}
                            </Text>
                          </div>

                          {/* Assigned By - Responsive */}
                          <div className="mt-1">
                            <Text
                              type="secondary"
                              className="text-xs truncate block"
                              title={`Assigned by: ${
                                assignee.assignedBy?.firstName || "Unknown"
                              }`}>
                              Assigned by:{" "}
                              <span className="font-medium">
                                {assignee.assignedBy?.firstName || "Unknown"}
                              </span>
                            </Text>
                          </div>

                          {/* Email on mobile */}
                          <div className="sm:hidden mt-1">
                            {user?.email && (
                              <Text
                                type="secondary"
                                className="text-xs truncate block"
                                title={user.email}>
                                {user.email}
                              </Text>
                            )}
                          </div>
                        </div>

                        {/* Email on desktop */}
                        <div className="hidden sm:block flex-shrink-0 ml-3">
                          {user?.email && (
                            <Tooltip title={user.email}>
                              <Text
                                type="secondary"
                                className="text-xs truncate block max-w-[120px]">
                                {user.email}
                              </Text>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </Card>
          </Col>

          {/* Client Assignees */}
          {clientAssignees.length > 0 && (
            <Col xs={24} lg={12}>
              <Card
                size="small"
                title={
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      Client Contacts
                    </span>
                    <Badge
                      count={clientAssignees.length}
                      size="small"
                      color="green"
                    />
                  </div>
                }
                bodyStyle={{ padding: "12px 0" }}>
                <List
                  size="small"
                  dataSource={clientAssignees}
                  renderItem={(assignee) => {
                    const user = assignee.user;
                    return (
                      <List.Item
                        className="px-4 hover:bg-gray-50 transition-colors"
                        style={{ padding: "8px 16px" }}>
                        <div className="flex items-start w-full">
                          {/* Avatar */}
                          <div className="flex-shrink-0 mr-3">
                            <Avatar
                              size={32}
                              src={user?.photo}
                              className="border border-gray-200 bg-green-50">
                              {user?.firstName?.[0]}
                              {user?.lastName?.[0]}
                            </Avatar>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Name and Client Tag - Mobile optimized */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                              <Text
                                strong
                                className="truncate text-sm sm:text-base"
                                title={`${user?.firstName} ${user?.lastName}`}>
                                {user?.firstName} {user?.lastName}
                              </Text>

                              <Tag
                                size="small"
                                color="green"
                                className="text-xs px-1.5 py-0.5 truncate max-w-[80px]">
                                <span className="truncate inline-block max-w-full">
                                  Client
                                </span>
                              </Tag>
                            </div>

                            {/* Email - Always visible but layout differs */}
                            <div className="flex items-center gap-2">
                              <Text
                                type="secondary"
                                className="text-xs truncate flex-1 min-w-0"
                                title={user?.email}>
                                {user?.email}
                              </Text>

                              {/* Quick actions on mobile */}
                              <div className="sm:hidden flex gap-1">
                                {user?.phone && (
                                  <Tooltip title="Call">
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<PhoneOutlined />}
                                      className="text-blue-500"
                                      onClick={() =>
                                        (window.location.href = `tel:${user.phone}`)
                                      }
                                    />
                                  </Tooltip>
                                )}
                                {user?.email && (
                                  <Tooltip title="Email">
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<MailOutlined />}
                                      className="text-green-500"
                                      onClick={() =>
                                        (window.location.href = `mailto:${user.email}`)
                                      }
                                    />
                                  </Tooltip>
                                )}
                              </div>
                            </div>

                            {/* Phone on desktop */}
                            {user?.phone && (
                              <div className="hidden sm:block mt-1">
                                <Text
                                  type="secondary"
                                  className="text-xs truncate block"
                                  title={user.phone}>
                                  <PhoneOutlined className="mr-1" />
                                  {user.phone}
                                </Text>
                              </div>
                            )}
                          </div>

                          {/* Actions on desktop */}
                          <div className="hidden sm:flex flex-shrink-0 ml-3 gap-1">
                            {user?.phone && (
                              <Tooltip title="Call">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<PhoneOutlined />}
                                  className="text-blue-500"
                                  onClick={() =>
                                    (window.location.href = `tel:${user.phone}`)
                                  }
                                />
                              </Tooltip>
                            )}
                            {user?.email && (
                              <Tooltip title="Email">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<MailOutlined />}
                                  className="text-green-500"
                                  onClick={() =>
                                    (window.location.href = `mailto:${user.email}`)
                                  }
                                />
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </List.Item>
                    );
                  }}
                />
              </Card>
            </Col>
          )}
        </Row>
      </Panel>
    </Collapse>
  );
};

export default AssigneesSection;
