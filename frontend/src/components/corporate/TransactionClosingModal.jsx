import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Modal,
  Form,
  DatePicker,
  Input,
  Select,
  Button,
  message,
  Alert,
  Space,
  Tag,
} from "antd";
import {
  CheckCircleOutlined,
  FileTextOutlined,
  DollarOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { recordClosing } from "../../redux/features/corporate/corporateSlice";
import { DATE_FORMAT, formatCurrency } from "../../utils/corporateConstants";

const { TextArea } = Input;
const { Option } = Select;

const TransactionClosingModal = ({
  matterId,
  visible,
  onClose,
  corporateDetails,
}) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await dispatch(
        recordClosing({
          matterId,
          data: {
            actualClosingDate: values.actualClosingDate.toISOString(),
            closingNotes: values.closingNotes,
            closingStatus: values.closingStatus,
            finalDealValue: values.finalDealValue,
          },
        }),
      );
      message.success("Transaction closed successfully!");
      onClose();
      form.resetFields();
    } catch (error) {
      message.error("Failed to close transaction");
    } finally {
      setLoading(false);
    }
  };

  // Calculate days difference
  const getDaysDifference = () => {
    if (
      !corporateDetails?.expectedClosingDate ||
      !form.getFieldValue("actualClosingDate")
    ) {
      return null;
    }

    const expected = dayjs(corporateDetails.expectedClosingDate);
    const actual = dayjs(form.getFieldValue("actualClosingDate"));
    const diff = actual.diff(expected, "day");

    return diff;
  };

  const daysDiff = getDaysDifference();

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined style={{ color: "#52c41a" }} />
          Close Transaction
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      centered>
      <Alert
        message="Closing the Transaction"
        description="This will mark the transaction as completed. Make sure all requirements are met."
        type="info"
        showIcon
        className="mb-4"
      />

      <div className="mb-6 p-4 bg-gray-50 rounded">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">Expected Closing</div>
            <div className="font-medium">
              {corporateDetails?.expectedClosingDate
                ? dayjs(corporateDetails.expectedClosingDate).format(
                    "DD MMM YYYY",
                  )
                : "Not set"}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Deal Value</div>
            <div className="font-medium">
              {corporateDetails?.dealValue
                ? formatCurrency(
                    corporateDetails.dealValue.amount,
                    corporateDetails.dealValue.currency,
                  )
                : "Not set"}
            </div>
          </div>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="actualClosingDate"
          label="Actual Closing Date"
          rules={[{ required: true, message: "Closing date is required" }]}>
          <DatePicker
            style={{ width: "100%" }}
            format={DATE_FORMAT}
            placeholder="Select actual closing date"
            suffixIcon={<CalendarOutlined />}
          />
        </Form.Item>

        {daysDiff !== null && (
          <div className="mb-4">
            <Tag color={daysDiff <= 0 ? "green" : "orange"}>
              {daysDiff === 0
                ? "Closed on schedule"
                : daysDiff < 0
                  ? `Closed ${Math.abs(daysDiff)} days early`
                  : `Closed ${daysDiff} days late`}
            </Tag>
          </div>
        )}

        <Form.Item
          name="closingStatus"
          label="Closing Status"
          rules={[{ required: true, message: "Please select closing status" }]}>
          <Select placeholder="Select closing status">
            <Option value="successful">Successful Completion</Option>
            <Option value="partially_successful">Partially Successful</Option>
            <Option value="terminated">Terminated</Option>
            <Option value="delayed">Delayed Completion</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="finalDealValue"
          label="Final Deal Value (if different)">
          <Input
            placeholder="Enter final deal value"
            prefix={<DollarOutlined />}
            suffix={corporateDetails?.dealValue?.currency || "NGN"}
          />
        </Form.Item>

        <Form.Item
          name="closingNotes"
          label="Closing Notes & Summary"
          rules={[{ required: true, message: "Please provide closing notes" }]}>
          <TextArea
            rows={4}
            placeholder="Provide a summary of the transaction closing, key achievements, and any important notes..."
            showCount
            maxLength={2000}
          />
        </Form.Item>

        <Alert
          message="Before Closing"
          description="Ensure all regulatory approvals are obtained, documents are executed, and post-completion obligations are documented."
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
            icon={<CheckCircleOutlined />}>
            Close Transaction
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default TransactionClosingModal;
