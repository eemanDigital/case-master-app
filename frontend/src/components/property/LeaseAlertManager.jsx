import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Card,
  Switch,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Divider,
  message,
  Popconfirm,
} from "antd";
import {
  BellOutlined,
  MailOutlined,
  MessageOutlined,
  SaveOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  updateLeaseAlertSettings,
} from "../../redux/features/property/propertySlice";
import {
  LEASE_ALERT_THRESHOLDS,
  getDefaultAlertThresholds,
} from "../../utils/propertyConstants";

const { Option } = Select;
const { TextArea } = Input;

const LeaseAlertManager = ({ matterId, alertSettings }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const currentSettings = alertSettings || {};
  const alertThresholds = currentSettings.alertThresholds || getDefaultAlertThresholds();

  const handleSave = async (values) => {
    setLoading(true);
    try {
      await dispatch(
        updateLeaseAlertSettings({
          matterId,
          data: {
            ...values,
            alertThresholds: alertThresholds.map((threshold) => ({
              days: threshold.days,
              label: threshold.label,
              isActive: threshold.isActive,
            })),
          },
        }),
      ).unwrap();
      message.success("Alert settings updated successfully");
    } catch (error) {
      message.error(error?.message || "Failed to update alert settings");
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdToggle = (index) => {
    alertThresholds[index].isActive = !alertThresholds[index].isActive;
    form.setFieldsValue({
      alertThresholds: [...alertThresholds],
    });
  };

  const handleResetDefaults = () => {
    form.setFieldsValue({
      alertThresholds: getDefaultAlertThresholds(),
    });
    message.info("Alert thresholds reset to defaults");
  };

  return (
    <Card
      title={
        <Space>
          <BellOutlined />
          <span>Lease Alert Settings</span>
        </Space>
      }
      extra={
        <Popconfirm
          title="Reset to defaults?"
          description="This will reset all alert thresholds to default values."
          onConfirm={handleResetDefaults}
          okText="Yes"
          cancelText="No"
        >
          <Button icon={<ReloadOutlined />} size="small">
            Reset Defaults
          </Button>
        </Popconfirm>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          enabled: currentSettings.enabled ?? true,
          defaultAlerts: currentSettings.defaultAlerts ?? true,
          emailNotification: currentSettings.emailNotification ?? true,
          smsNotification: currentSettings.smsNotification ?? false,
          notifyLandlord: currentSettings.notifyLandlord ?? true,
          notifyTenant: currentSettings.notifyTenant ?? true,
          customMessage: currentSettings.customMessage || "",
          alertThresholds,
        }}
        onFinish={handleSave}
      >
        <Divider orientation="left">Alert Configuration</Divider>

        <Form.Item
          name="enabled"
          label="Enable Lease Expiration Alerts"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="defaultAlerts"
          label="Use Default Alert Thresholds"
          valuePropName="checked"
          extra="Use recommended alert intervals (7, 14, 30, 60, 90 days)"
        >
          <Switch />
        </Form.Item>

        <Divider orientation="left">Notification Methods</Divider>

        <Form.Item
          name="emailNotification"
          label="Email Notifications"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="smsNotification"
          label="SMS Notifications"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Divider orientation="left">Notify Parties</Divider>

        <Form.Item
          name="notifyLandlord"
          label="Notify Landlord"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="notifyTenant"
          label="Notify Tenant"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Divider orientation="left">Alert Thresholds</Divider>

        <div className="mb-4">
          <p className="text-gray-500 mb-4">
            Configure when alerts should be triggered before lease expiration.
          </p>

          <Form.List name="alertThresholds">
            {() => (
              <div className="space-y-3">
                {alertThresholds.map((threshold, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded"
                    style={{
                      backgroundColor: threshold.isActive ? "#f6ffed" : "#fafafa",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={threshold.isActive}
                        onChange={() => handleThresholdToggle(index)}
                        size="small"
                      />
                      <div>
                        <div className="font-medium">{threshold.label}</div>
                        <div className="text-sm text-gray-500">
                          {threshold.days} days before expiration
                        </div>
                      </div>
                    </div>
                    <Tag
                      color={
                        threshold.label === "critical"
                          ? "error"
                          : threshold.label === "warning"
                            ? "warning"
                            : "processing"
                      }
                    >
                      {threshold.label.toUpperCase()}
                    </Tag>
                  </div>
                ))}
              </div>
            )}
          </Form.List>
        </div>

        <Divider orientation="left">Custom Message</Divider>

        <Form.Item
          name="customMessage"
          label="Custom Alert Message"
          extra="This message will be included in all lease expiration alerts"
        >
          <TextArea
            rows={3}
            placeholder="e.g., Lease renewal required - please contact property manager immediately."
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <div className="flex justify-end">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              Save Alert Settings
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default LeaseAlertManager;
