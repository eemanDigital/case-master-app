import React, { useState } from "react";
import {
  Modal,
  Form,
  Select,
  Radio,
  Space,
  Typography,
  Alert,
  Progress,
  message,
} from "antd";
import {
  WarningOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { bulkUpdateRetainerMatters } from "../../redux/features/retainer/retainerSlice";

const { Text, Title } = Typography;
const { Option } = Select;

/**
 * BulkOperationsModal Component
 * Perform bulk operations on selected retainers
 */
const BulkOperationsModal = ({
  visible,
  onCancel,
  selectedRetainers,
  onSuccess,
}) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const operations = [
    {
      value: "update-status",
      label: "Update Status",
      icon: <CheckCircleOutlined />,
      description: "Change status of selected retainers",
    },
    {
      value: "renew",
      label: "Bulk Renewal",
      icon: <SyncOutlined />,
      description: "Renew all selected retainers",
      warning: true,
    },
    {
      value: "terminate",
      label: "Bulk Termination",
      icon: <StopOutlined />,
      description: "Terminate all selected retainers",
      danger: true,
    },
  ];

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setProgress(0);

      const bulkData = {
        retainerIds: selectedRetainers,
        operation: values.operation,
        data: {},
      };

      // Add operation-specific data
      if (values.operation === "update-status") {
        bulkData.data.status = values.newStatus;
      } else if (values.operation === "renew") {
        bulkData.data.renewalPeriod = values.renewalPeriod;
      } else if (values.operation === "terminate") {
        bulkData.data.reason = values.terminationReason;
      }

      // Simulate progress (in real app, backend should send progress)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await dispatch(bulkUpdateRetainerMatters(bulkData)).unwrap();

      clearInterval(interval);
      setProgress(100);

      message.success(
        `Successfully performed ${values.operation} on ${selectedRetainers.length} retainer(s)`,
      );

      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        form.resetFields();
        onCancel();
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (error) {
      setLoading(false);
      setProgress(0);
      message.error(error.message || "Failed to perform bulk operation");
    }
  };

  return (
    <Modal
      title={
        <Space>
          <WarningOutlined className="text-orange-500" />
          <Title level={4} className="!mb-0">
            Bulk Operations
          </Title>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Execute"
      cancelText="Cancel"
      okButtonProps={{
        danger: form.getFieldValue("operation") === "terminate",
      }}
      width={600}>
      <Alert
        message={`${selectedRetainers?.length || 0} retainer(s) selected`}
        type="info"
        showIcon
        className="mb-4"
      />

      {loading && (
        <div className="mb-4">
          <Progress percent={progress} status="active" />
          <Text type="secondary" className="text-xs">
            Processing... Please wait
          </Text>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={loading}>
        <Form.Item
          name="operation"
          label="Select Operation"
          rules={[{ required: true, message: "Please select an operation" }]}>
          <Radio.Group className="w-full">
            <Space direction="vertical" className="w-full">
              {operations.map((op) => (
                <Radio value={op.value} key={op.value}>
                  <Space>
                    {op.icon}
                    <div>
                      <Text strong={op.danger || op.warning}>{op.label}</Text>
                      <br />
                      <Text type="secondary" className="text-xs">
                        {op.description}
                      </Text>
                    </div>
                  </Space>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </Form.Item>

        <Form.Item noStyle shouldUpdate>
          {({ getFieldValue }) => {
            const operation = getFieldValue("operation");

            if (operation === "update-status") {
              return (
                <Form.Item
                  name="newStatus"
                  label="New Status"
                  rules={[
                    { required: true, message: "Please select new status" },
                  ]}>
                  <Select placeholder="Select new status">
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                    <Option value="pending">Pending</Option>
                  </Select>
                </Form.Item>
              );
            }

            if (operation === "renew") {
              return (
                <>
                  <Form.Item
                    name="renewalPeriod"
                    label="Renewal Period"
                    rules={[
                      {
                        required: true,
                        message: "Please select renewal period",
                      },
                    ]}>
                    <Select placeholder="Select renewal period">
                      <Option value="6-months">6 Months</Option>
                      <Option value="1-year">1 Year</Option>
                      <Option value="2-years">2 Years</Option>
                    </Select>
                  </Form.Item>
                  <Alert
                    message="Warning"
                    description="All selected retainers will be renewed with the same period. Ensure this is appropriate for all retainers."
                    type="warning"
                    showIcon
                    className="mb-4"
                  />
                </>
              );
            }

            if (operation === "terminate") {
              return (
                <>
                  <Form.Item
                    name="terminationReason"
                    label="Termination Reason"
                    rules={[
                      {
                        required: true,
                        message: "Please select termination reason",
                      },
                    ]}>
                    <Select placeholder="Select reason">
                      <Option value="completed">Service Completed</Option>
                      <Option value="client-request">Client Request</Option>
                      <Option value="non-payment">Non-Payment</Option>
                      <Option value="other">Other</Option>
                    </Select>
                  </Form.Item>
                  <Alert
                    message="Danger"
                    description="This will terminate all selected retainers. This action cannot be undone."
                    type="error"
                    showIcon
                    className="mb-4"
                  />
                </>
              );
            }

            return null;
          }}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BulkOperationsModal;
