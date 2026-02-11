// components/advisory/AdvisoryHeader.jsx
import React from "react";
import {
  PageHeader,
  Button,
  Space,
  Tag,
  Typography,
  Dropdown,
  Menu,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  PrinterOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  MoreOutlined,
  EyeOutlined,
  LockOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const AdvisoryHeader = ({
  advisory,
  onEdit,
  onDelete,
  onDuplicate,
  onExport,
}) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: "default",
      active: "processing",
      completed: "success",
      cancelled: "error",
      delivered: "green",
      approved: "blue",
    };
    return colors[status] || "default";
  };

  const moreMenu = (
    <Menu
      items={[
        {
          key: "duplicate",
          label: "Duplicate",
          icon: <CopyOutlined />,
          onClick: onDuplicate,
        },
        {
          key: "export",
          label: "Export as PDF",
          icon: <DownloadOutlined />,
          onClick: onExport,
        },
        {
          key: "print",
          label: "Print",
          icon: <PrinterOutlined />,
          onClick: () => window.print(),
        },
        {
          type: "divider",
        },
        {
          key: "share",
          label: "Share",
          icon: <ShareAltOutlined />,
          onClick: () => alert("Share functionality"),
        },
        {
          key: "viewHistory",
          label: "View History",
          icon: <EyeOutlined />,
          onClick: () => alert("View history"),
        },
      ]}
    />
  );

  return (
    <PageHeader
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Title level={2} style={{ margin: 0 }}>
            {advisory.matter?.title || "Untitled Advisory"}
          </Title>
          <Tag color={getStatusColor(advisory.status)}>
            {advisory.status?.toUpperCase()}
          </Tag>
          {advisory.isDeleted && (
            <Tag color="red" icon={<LockOutlined />}>
              Deleted
            </Tag>
          )}
        </div>
      }
      subTitle={
        <Space>
          <Text type="secondary">Matter #{advisory.matter?.matterNumber}</Text>
          {advisory.priority && (
            <Tag
              color={
                advisory.priority === "high"
                  ? "red"
                  : advisory.priority === "medium"
                    ? "orange"
                    : "green"
              }>
              {advisory.priority.toUpperCase()} PRIORITY
            </Tag>
          )}
        </Space>
      }
      extra={[
        <Button
          key="edit"
          type="primary"
          icon={<EditOutlined />}
          onClick={onEdit}
          disabled={advisory.isDeleted}>
          Edit
        </Button>,
        <Button
          key="delete"
          danger
          icon={<DeleteOutlined />}
          onClick={onDelete}
          disabled={advisory.isDeleted}>
          Delete
        </Button>,
        <Dropdown key="more" overlay={moreMenu} placement="bottomRight">
          <Button icon={<MoreOutlined />} />
        </Dropdown>,
      ]}
      style={{
        backgroundColor: "#fff",
        borderBottom: "1px solid #f0f0f0",
        marginBottom: 16,
      }}
    />
  );
};

export default AdvisoryHeader;
