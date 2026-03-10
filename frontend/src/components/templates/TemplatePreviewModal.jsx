import { useState } from "react";
import { Modal, Tabs, Tag, Table, Typography, Space, Button, Descriptions } from "antd";
import { FileAddOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text, Title } = Typography;

const categoryLabels = {
  contract: "Contract",
  "court-process": "Court Process",
  correspondence: "Correspondence",
  corporate: "Corporate",
  conveyancing: "Conveyancing",
  custom: "Custom",
};

const categoryColors = {
  contract: "blue",
  "court-process": "red",
  correspondence: "cyan",
  corporate: "purple",
  conveyancing: "orange",
  custom: "green",
};

const TemplatePreviewModal = ({ visible, template, onClose, onUse }) => {
  if (!template) return null;

  const placeholderColumns = [
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: "Label",
      dataIndex: "label",
      key: "label",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => <Tag>{type}</Tag>,
    },
    {
      title: "Required",
      dataIndex: "required",
      key: "required",
      render: (required) => (required ? <Tag color="red">Yes</Tag> : <Tag>No</Tag>),
    },
    {
      title: "Hint",
      dataIndex: "hint",
      key: "hint",
      render: (hint) => <Text type="secondary">{hint || "-"}</Text>,
    },
  ];

  const renderContentPreview = () => {
    const content = template.content || "";
    const highlightedContent = content.replace(
      /\{\{([A-Z_][A-Z0-9_]*)\}\}/g,
      '<span style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px; font-family: monospace;">{{$1}}</span>'
    );

    return (
      <div
        style={{
          background: "#fff",
          padding: 40,
          minHeight: 500,
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: 14,
          lineHeight: 1.8,
          whiteSpace: "pre-wrap",
          border: "1px solid #e8e8e8",
          borderRadius: 4,
        }}
        dangerouslySetInnerHTML={{ __html: highlightedContent }}
      />
    );
  };

  const renderPlaceholdersTab = () => (
    <Table
      columns={placeholderColumns}
      dataSource={template.placeholders || []}
      rowKey="key"
      pagination={{ pageSize: 10 }}
      size="small"
    />
  );

  const renderDetailsTab = () => (
    <Descriptions column={1} bordered size="small">
      <Descriptions.Item label="Description">
        {template.description || "No description"}
      </Descriptions.Item>
      <Descriptions.Item label="Category">
        <Tag color={categoryColors[template.category]}>
          {categoryLabels[template.category]}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Practice Area">
        {template.practiceArea || "General"}
      </Descriptions.Item>
      <Descriptions.Item label="Governing Law">
        {template.governingLaw || "Nigerian Law"}
      </Descriptions.Item>
      <Descriptions.Item label="Tags">
        <Space>
          {template.tags?.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      </Descriptions.Item>
      <Descriptions.Item label="Version">{template.version || "1.0"}</Descriptions.Item>
      <Descriptions.Item label="Usage Count">{template.usageCount || 0}</Descriptions.Item>
      <Descriptions.Item label="Created">
        {template.createdAt ? dayjs(template.createdAt).format("DD/MM/YYYY") : "-"}
      </Descriptions.Item>
      <Descriptions.Item label="Last Updated">
        {template.updatedAt ? dayjs(template.updatedAt).format("DD/MM/YYYY") : "-"}
      </Descriptions.Item>
      {template.courtDetails && (
        <>
          <Descriptions.Item label="Applicable Courts">
            {template.courtDetails.applicableCourts?.join(", ")}
          </Descriptions.Item>
          <Descriptions.Item label="Document Type">
            {template.courtDetails.documentType}
          </Descriptions.Item>
          <Descriptions.Item label="Jurisdiction">
            {template.courtDetails.jurisdiction}
          </Descriptions.Item>
        </>
      )}
    </Descriptions>
  );

  const tabItems = [
    {
      key: "preview",
      label: "Preview",
      children: renderContentPreview(),
    },
    {
      key: "placeholders",
      label: `Placeholders (${template.placeholders?.length || 0})`,
      children: renderPlaceholdersTab(),
    },
    {
      key: "details",
      label: "Details",
      children: renderDetailsTab(),
    },
  ];

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <div key="instructions" style={{ float: "left", textAlign: "left" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Yellow highlighted text like <Text code>{`{{PLACEHOLDER}}`}</Text> needs to be filled when generating the document
          </Text>
        </div>,
        <Button key="close" icon={<CloseOutlined />} onClick={onClose}>
          Close
        </Button>,
        <Button key="use" type="primary" icon={<FileAddOutlined />} onClick={onUse}>
          Use This Template →
        </Button>,
      ]}
      title={
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            {template.title}
          </Title>
          <Tag color={categoryColors[template.category]}>
            {categoryLabels[template.category]}
          </Tag>
          {template.isSystemTemplate ? (
            <Tag color="blue">System</Tag>
          ) : (
            <Tag color="green">Firm</Tag>
          )}
        </Space>
      }
    >
      <Tabs items={tabItems} />
    </Modal>
  );
};

export default TemplatePreviewModal;
