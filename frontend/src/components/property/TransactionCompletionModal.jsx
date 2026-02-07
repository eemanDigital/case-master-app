import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Modal,
  Form,
  DatePicker,
  Input,
  Button,
  message,
  Alert,
  Space,
  Tag,
  Descriptions,
  Divider,
  Checkbox,
  Card,
} from "antd";
import {
  CheckCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { recordCompletion } from "../../redux/features/property/propertySlice";
import { DATE_FORMAT, formatCurrency } from "../../utils/propertyConstants";

const { TextArea } = Input;

const TransactionCompletionModal = ({
  matterId,
  visible,
  onClose,
  propertyDetails,
}) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Pre-requisites checklist
  const prerequisites = [
    {
      key: "contract",
      label: "Contract of Sale Executed",
      met:
        propertyDetails?.contractOfSale?.status === "executed" ||
        propertyDetails?.contractOfSale?.status === "completed",
    },
    {
      key: "governor",
      label: "Governor's Consent Obtained",
      met:
        propertyDetails?.governorsConsent?.status === "approved" ||
        propertyDetails?.governorsConsent?.status === "not-required",
    },
    {
      key: "title",
      label: "Title Search Completed",
      met: propertyDetails?.titleSearch?.isCompleted === true,
    },
    {
      key: "inspection",
      label: "Physical Inspection Completed",
      met: propertyDetails?.physicalInspection?.isCompleted === true,
    },
    {
      key: "payments",
      label: "All Payments Made",
      met: !propertyDetails?.paymentSchedule?.some(
        (p) => p.status === "pending",
      ),
    },
    {
      key: "conditions",
      label: "All Conditions Met",
      met: !propertyDetails?.conditions?.some((c) => c.status === "pending"),
    },
  ];

  const allPrerequisitesMet = prerequisites.every((p) => p.met);

  // Handle form submission
  const handleSubmit = async (values) => {
    if (!confirmed) {
      message.warning("Please confirm that all prerequisites are met");
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        recordCompletion({
          matterId,
          data: {
            completionDate: values.completionDate.toISOString(),
            registrationNumber: values.registrationNumber,
            notes: values.notes,
          },
        }),
      ).unwrap();
      message.success("Transaction completed successfully!");
      onClose();
      form.resetFields();
      setConfirmed(false);
    } catch (error) {
      message.error("Failed to complete transaction");
    } finally {
      setLoading(false);
    }
  };

  // Get completion status
  const getCompletionStatus = () => {
    const metCount = prerequisites.filter((p) => p.met).length;
    const totalCount = prerequisites.length;
    const percentage = (metCount / totalCount) * 100;

    if (percentage === 100) {
      return {
        status: "ready",
        message: "Ready for completion",
        color: "success",
      };
    } else if (percentage >= 75) {
      return { status: "almost", message: "Almost ready", color: "warning" };
    } else {
      return { status: "not-ready", message: "Not ready", color: "error" };
    }
  };

  const completionStatus = getCompletionStatus();

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined style={{ color: "#52c41a" }} />
          Complete Property Transaction
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      centered>
      <Alert
        message="Transaction Completion"
        description="Completing this transaction will mark it as registered and update all relevant statuses."
        type="info"
        showIcon
        className="mb-4"
      />

      {/* Property Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <Descriptions title="Transaction Summary" column={2}>
          <Descriptions.Item label="Property">
            <Space>
              <HomeOutlined />
              {propertyDetails?.properties?.[0]?.address || "Property Address"}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Transaction Type">
            {propertyDetails?.transactionType
              ?.replace("_", " ")
              .toUpperCase() || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Purchase Price">
            {propertyDetails?.purchasePrice
              ? formatCurrency(
                  propertyDetails.purchasePrice.amount,
                  propertyDetails.purchasePrice.currency,
                )
              : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Current Status">
            <Tag
              color={
                propertyDetails?.deedOfAssignment?.status === "registered"
                  ? "success"
                  : "processing"
              }>
              {propertyDetails?.deedOfAssignment?.status?.toUpperCase() ||
                "IN PROGRESS"}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </div>

      {/* Prerequisites Checklist */}
      <Card title="Pre-requisites Checklist" className="mb-6">
        <div className="mb-4">
          <Tag color={completionStatus.color} className="text-lg">
            {completionStatus.message} (
            {prerequisites.filter((p) => p.met).length}/{prerequisites.length})
          </Tag>
        </div>

        <div className="space-y-2">
          {prerequisites.map((prereq) => (
            <div
              key={prereq.key}
              className={`flex items-center p-3 rounded ${
                prereq.met
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}>
              <Checkbox checked={prereq.met} disabled className="mr-3">
                <span
                  className={prereq.met ? "text-green-700" : "text-red-700"}>
                  {prereq.label}
                </span>
              </Checkbox>
              <Tag color={prereq.met ? "success" : "error"} className="ml-auto">
                {prereq.met ? "Met" : "Pending"}
              </Tag>
            </div>
          ))}
        </div>

        {!allPrerequisitesMet && (
          <Alert
            message="Warning"
            description="Not all prerequisites are met. Please ensure all requirements are fulfilled before completing the transaction."
            type="warning"
            showIcon
            className="mt-4"
          />
        )}
      </Card>

      {/* Completion Form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          completionDate: dayjs(),
        }}>
        <Form.Item
          name="completionDate"
          label="Completion/Registration Date"
          rules={[{ required: true, message: "Completion date is required" }]}>
          <DatePicker
            style={{ width: "100%" }}
            format={DATE_FORMAT}
            placeholder="Select completion date"
            suffixIcon={<CalendarOutlined />}
          />
        </Form.Item>

        <Form.Item
          name="registrationNumber"
          label="Registration Number"
          rules={[
            { required: true, message: "Registration number is required" },
          ]}>
          <Input
            placeholder="Enter deed registration number"
            prefix={<FileTextOutlined />}
          />
        </Form.Item>

        <Form.Item name="notes" label="Completion Notes">
          <TextArea
            rows={4}
            placeholder="Add any notes about the completion, registration process, or final observations..."
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Divider />

        <Form.Item>
          <Checkbox
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={!allPrerequisitesMet}>
            I confirm that:
            <ul className="mt-2 ml-6 list-disc text-sm text-gray-600">
              <li>All prerequisites listed above are met</li>
              <li>All documents are properly executed</li>
              <li>All payments have been made</li>
              <li>
                The deed has been registered with the appropriate authority
              </li>
            </ul>
          </Checkbox>
        </Form.Item>

        <Alert
          message="Final Warning"
          description="Completing this transaction cannot be undone. Please verify all information before proceeding."
          type="warning"
          showIcon
          className="mb-4"
        />

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={!confirmed || !allPrerequisitesMet}
            icon={<CheckCircleOutlined />}>
            Complete Transaction
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default TransactionCompletionModal;
