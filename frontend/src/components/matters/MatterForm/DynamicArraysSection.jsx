import React, { memo } from "react";
import { Form, Input, Button, Space, Card } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const DynamicArraysSection = memo(
  ({
    fieldName,
    label,
    placeholder = "Enter item",
    rules = [],
    initialValue = [],
  }) => {
    return (
      <Form.List name={fieldName} initialValue={initialValue}>
        {(fields, { add, remove }) => (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">
                {label}
              </label>
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                size="small">
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <Card
                  key={field.key}
                  size="small"
                  className="bg-gray-50"
                  bodyStyle={{ padding: "12px" }}>
                  <Space.Compact className="w-full">
                    <Form.Item
                      {...field}
                      name={[field.name, "name"]}
                      rules={rules}
                      noStyle>
                      <Input placeholder={placeholder} className="flex-grow" />
                    </Form.Item>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                      disabled={fields.length === 1}
                    />
                  </Space.Compact>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Form.List>
    );
  },
);

DynamicArraysSection.displayName = "DynamicArraysSection";

export default DynamicArraysSection;
