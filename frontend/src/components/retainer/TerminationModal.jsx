import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Radio,
  Alert,
  Space,
  Typography,
  Divider,
  Card,
  message,
} from "antd";
import { ExclamationCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import dayjs from "dayjs";
import {
  terminateRetainer,
  fetchRetainerDetails,
} from "../../../redux/features/retainer/retainerSlice";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

/**
 * TerminationModal Component
 * Standalone modal for retainer termination
 * Handles all termination workflows with validation
 */
const TerminationModal = ({
  visible,
  onCancel,
  matterId,
  noticePeriodDays = 30,
  currentEndDate,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState(null);

  const terminationReasons = [
    { value: "completed", label: "Services Completed" },
    { value: "client-request", label: "Client Request" },
    { value: "mutual-agreement", label: "Mutual Agreement" },
    { value: "non-payment", label: "Non-Payment" },
    { value: "breach-of-contract", label: "Breach of Contract" },
    { value: "firm-decision", label: "Firm Decision" },
    { value: "other", label: "Other Reason" },
  ];

  const finalBillingOptions = [
    { value: "fully-paid", label: "Fully Paid" },
    { value: "pending-payment", label: "Pending Payment" },
    { value: "partial-payment", label: "Partial Payment" },
    { value: "waived", label: "Waived" },
    { value: "disputed", label: "Disputed" },
  ];

  useEffect(() => {
    if (visible) {
      const today = dayjs();
      const calculatedEffective = today.add(noticePeriodDays, "day");
      setEffectiveDate(calculatedEffective);

      form.setFieldsValue({
        terminationDate: today,
        effectiveDate: calculatedEffective,
        finalBilling: "fully-paid",
        handoverRequired: false,
      });
    }
  }, [visible, noticePeriodDays, form]);

  const handleTerminationDateChange = (date) => {
    if (date) {
      const newEffectiveDate = date.add(noticePeriodDays, "day");
      setEffectiveDate(newEffectiveDate);
      form.setFieldsValue({ effectiveDate: newEffectiveDate });
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const terminationData = {
        terminationDate: values.terminationDate.toISOString(),
        effectiveDate: values.effectiveDate.toISOString(),
        reason: values.reason,
        otherReason: values.otherReason,
        notes: values.notes,
        finalBilling: values.finalBilling,
        handoverRequired: values.handoverRequired,
        handoverNotes: values.handoverNotes,
      };

      await dispatch(
        terminateRetainer({ matterId, data: terminationData }),
      ).unwrap();
      message.success("Retainer terminated successfully");
      dispatch(fetchRetainerDetails(matterId));
      onCancel();
    } catch (error) {
      message.error(error.message || "Failed to terminate retainer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <WarningOutlined className="text-red-500" />
          <span>Terminate Retainer Agreement</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={700}
      okText="Terminate Retainer"
      cancelText="Cancel"
      okButtonProps={{
        danger: true,
        className: "bg-red-600 hover:bg-red-700",
      }}>
      <Alert
        message="Warning: Permanent Action"
        description="Terminating this retainer agreement is permanent and cannot be undone. All associated data will be archived. Please ensure all billing and documentation is complete before proceeding."
        type="error"
        showIcon
        icon={<ExclamationCircleOutlined />}
        className="mb-6"
      />

      <Form form={form} layout="vertical">
        <Card title="Termination Details" size="small" className="mb-4">
          <Form.Item
            name="reason"
            label="Termination Reason"
            rules={[{ required: true, message: "Please select a reason" }]}>
            <Select placeholder="Select termination reason" size="large">
              {terminationReasons.map((reason) => (
                <Option key={reason.value} value={reason.value}>
                  {reason.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate>
            {({ getFieldValue }) =>
              getFieldValue("reason") === "other" && (
                <Form.Item
                  name="otherReason"
                  label="Please Specify"
                  rules={[
                    { required: true, message: "Please specify the reason" },
                  ]}>
                  <Input
                    placeholder="Enter specific reason for termination"
                    size="large"
                  />
                </Form.Item>
              )
            }
          </Form.Item>

          <Form.Item
            name="terminationDate"
            label="Termination Notice Date"
            rules={[{ required: true, message: "Please select date" }]}>
            <DatePicker
              format="DD/MM/YYYY"
              className="w-full"
              size="large"
              onChange={handleTerminationDateChange}
              disabledDate={(current) => current && current > dayjs()}
            />
          </Form.Item>

          <Alert
            message={`Notice Period: ${noticePeriodDays} days (as per contract terms)`}
            type="info"
            showIcon
            className="mb-4"
          />

          <Form.Item
            name="effectiveDate"
            label="Effective Termination Date"
            rules={[
              { required: true, message: "Please select effective date" },
            ]}>
            <DatePicker
              format="DD/MM/YYYY"
              className="w-full"
              size="large"
              disabled
            />
          </Form.Item>

          {effectiveDate && currentEndDate && (
            <Alert
              message={
                dayjs(effectiveDate).isBefore(dayjs(currentEndDate))
                  ? "Early Termination: This retainer is being terminated before the original end date."
                  : "Normal Termination: Within the original agreement period."
              }
              type={
                dayjs(effectiveDate).isBefore(dayjs(currentEndDate))
                  ? "warning"
                  : "info"
              }
              showIcon
              className="mb-4"
            />
          )}
        </Card>

        <Card title="Final Billing Status" size="small" className="mb-4">
          <Form.Item
            name="finalBilling"
            label="Billing Status"
            rules={[
              { required: true, message: "Please select billing status" },
            ]}>
            <Select placeholder="Select final billing status" size="large">
              {finalBillingOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Card>

        <Card title="Document Handover" size="small" className="mb-4">
          <Form.Item
            name="handoverRequired"
            label="Document Handover Required"
            valuePropName="checked">
            <Radio.Group size="large">
              <Radio value={true}>Yes</Radio>
              <Radio value={false}>No</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item noStyle shouldUpdate>
            {({ getFieldValue }) =>
              getFieldValue("handoverRequired") && (
                <Form.Item
                  name="handoverNotes"
                  label="Handover Details"
                  rules={[
                    {
                      required: true,
                      message: "Please provide handover details",
                    },
                  ]}>
                  <TextArea
                    rows={3}
                    placeholder="List documents to be handed over and handover arrangements..."
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              )
            }
          </Form.Item>
        </Card>

        <Card title="Termination Notes" size="small">
          <Form.Item
            name="notes"
            label="Additional Notes"
            rules={[
              { required: true, message: "Please provide termination notes" },
              {
                min: 20,
                message:
                  "Please provide more detailed notes (min 20 characters)",
              },
            ]}>
            <TextArea
              rows={4}
              placeholder="Provide detailed notes about this termination, including any outstanding matters, final settlements, or transition arrangements..."
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Card>

        <Alert
          message="Final Confirmation"
          description="By proceeding, you confirm that all billing has been settled, necessary documents have been prepared for handover if required, and both parties agree to the termination terms outlined above."
          type="warning"
          showIcon
          className="mt-4"
        />
      </Form>
    </Modal>
  );
};

export default TerminationModal;
