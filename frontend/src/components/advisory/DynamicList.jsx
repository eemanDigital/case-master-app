import React, { useCallback } from "react";
import {
  Card,
  Button,
  Input,
  Select,
  Form,
  Row,
  Col,
  Typography,
  DatePicker,
  Tag,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

// Generic Item Component
const DynamicListItem = React.memo(
  ({ item, index, fields, onUpdate, onRemove, readOnly }) => {
    const handleFieldChange = useCallback(
      (field, newValue) => {
        onUpdate(index, field, newValue);
      },
      [index, onUpdate],
    );

    const renderField = (field) => {
      const value = item[field.key];

      if (readOnly) {
        if (field.type === "select") {
          return <Tag color={field.getColor?.(value) || "blue"}>{value}</Tag>;
        }
        if (field.type === "date") {
          return (
            <Text>{value ? dayjs(value).format("DD/MM/YYYY") : "Not set"}</Text>
          );
        }
        return <Text>{value || field.emptyText || "N/A"}</Text>;
      }

      switch (field.type) {
        case "text":
          return (
            <Input
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          );

        case "textarea":
          return (
            <TextArea
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              rows={field.rows || 3}
              placeholder={field.placeholder}
            />
          );

        case "select":
          return (
            <Select
              value={value}
              onChange={(val) => handleFieldChange(field.key, val)}
              style={{ width: "100%" }}>
              {field.options?.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          );

        case "date":
          return (
            <DatePicker
              value={value ? dayjs(value) : null}
              onChange={(date) =>
                handleFieldChange(field.key, date?.toISOString())
              }
              style={{ width: "100%" }}
              disabled={field.disabled?.(item)}
            />
          );

        default:
          return null;
      }
    };

    return (
      <Card
        size="small"
        style={{
          marginBottom: 16,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          borderRadius: "8px",
        }}
        extra={
          !readOnly && (
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => onRemove(index)}
            />
          )
        }>
        <Row gutter={16}>
          {fields.map((field) => (
            <Col span={field.span || 24} key={field.key}>
              <Form.Item
                label={field.label}
                required={field.required}
                style={{ marginBottom: field.span === 24 ? 12 : 0 }}>
                {renderField(field)}
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Card>
    );
  },
);

DynamicListItem.displayName = "DynamicListItem";

// Main Dynamic List Component
const DynamicList = ({
  value = [],
  onChange,
  readOnly = false,
  fields = [],
  defaultItem = {},
  addButtonText = "Add Item",
  emptyText = "No items added",
}) => {
  const handleAdd = useCallback(() => {
    onChange([...value, defaultItem]);
  }, [value, onChange, defaultItem]);

  const handleUpdate = useCallback(
    (index, field, newValue) => {
      const updated = [...value];
      updated[index] = { ...updated[index], [field]: newValue };
      onChange(updated);
    },
    [value, onChange],
  );

  const handleRemove = useCallback(
    (index) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange],
  );

  if (readOnly && value.length === 0) {
    return <Text type="secondary">{emptyText}</Text>;
  }

  return (
    <div>
      {value.map((item, index) => (
        <DynamicListItem
          key={index}
          item={item}
          index={index}
          fields={fields}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
          readOnly={readOnly}
        />
      ))}

      {!readOnly && (
        <Button
          type="dashed"
          onClick={handleAdd}
          block
          icon={<PlusOutlined />}
          style={{ borderRadius: "8px" }}>
          {addButtonText}
        </Button>
      )}
    </div>
  );
};

export default React.memo(DynamicList);
