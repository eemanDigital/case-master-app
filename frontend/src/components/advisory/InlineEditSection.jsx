// components/advisory/InlineEditSection.jsx
import React, { useState } from "react";
import {
  Card,
  Button,
  Space,
  Form,
  Input,
  Select,
  DatePicker,
  Typography,
  Tooltip,
  message,
} from "antd";
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;
const { TextArea } = Input;

const InlineEditSection = ({
  title,
  value,
  fieldName,
  fieldType = "text",
  options = [],
  placeholder = "",
  rules = [],
  onSave,
  readOnly = false,
  allowAdd = false,
  onAdd,
  children,
}) => {
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onSave(values[fieldName]);
      setEditing(false);
      message.success("Updated successfully");
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    form.resetFields();
  };

  const renderField = () => {
    if (fieldType === "textarea") {
      return (
        <TextArea
          rows={3}
          placeholder={placeholder}
          style={{ width: "100%" }}
        />
      );
    }

    if (fieldType === "select") {
      return (
        <Select
          placeholder={placeholder}
          options={options}
          style={{ width: "100%" }}
        />
      );
    }

    if (fieldType === "date") {
      return (
        <DatePicker
          placeholder={placeholder}
          style={{ width: "100%" }}
          format="DD/MM/YYYY"
        />
      );
    }

    return <Input placeholder={placeholder} style={{ width: "100%" }} />;
  };

  return (
    <Card
      size="small"
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <Text strong>{title}</Text>
          {!readOnly && !editing && (
            <Space>
              {allowAdd && onAdd && (
                <Tooltip title="Add new">
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={onAdd}
                  />
                </Tooltip>
              )}
              <Tooltip title="Edit">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => setEditing(true)}
                />
              </Tooltip>
            </Space>
          )}
        </div>
      }
      extra={
        editing && (
          <Space>
            <Button
              size="small"
              icon={<CloseOutlined />}
              onClick={handleCancel}
              disabled={loading}>
              Cancel
            </Button>
            <Button
              type="primary"
              size="small"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={loading}>
              Save
            </Button>
          </Space>
        )
      }>
      {editing ? (
        <Form form={form} layout="vertical">
          <Form.Item
            name={fieldName}
            initialValue={fieldType === "date" && value ? dayjs(value) : value}
            rules={rules}
            noStyle>
            {renderField()}
          </Form.Item>
        </Form>
      ) : children ? (
        children
      ) : (
        <Text type={value ? undefined : "secondary"}>
          {value || "Not specified"}
        </Text>
      )}
    </Card>
  );
};

export default InlineEditSection;
