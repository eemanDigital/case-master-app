import {
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Button,
  Space,
  message,
  Switch,
} from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  recordSettlement,
  selectActionLoading,
} from "../../redux/features/litigation/litigationSlice";
import { DATE_FORMAT } from "../../utils/litigationConstants";

const { TextArea } = Input;

const SettlementRecordModal = ({
  visible,
  onCancel,
  matterId,
  initialValues,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const loading = useSelector(selectActionLoading);

  const handleSubmit = async (values) => {
    try {
      const settlementData = {
        isSettled: true,
        settlementDate: values.settlementDate.toISOString(),
        settlementAmount: values.settlementAmount || 0,
        settlementTerms: values.settlementTerms,
      };

      await dispatch(recordSettlement({ matterId, settlementData })).unwrap();
      message.success("Settlement recorded successfully");
      form.resetFields();
      onCancel();
    } catch (error) {
      message.error(error?.message || "Failed to record settlement");
    }
  };

  // Format initial values if editing
  const formInitialValues = initialValues
    ? {
        ...initialValues,
        settlementDate: initialValues.settlementDate
          ? dayjs(initialValues.settlementDate)
          : null,
      }
    : {};

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <CheckCircleOutlined />
          <span>{initialValues ? "Edit" : "Record"} Settlement</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={formInitialValues}>
        <Form.Item
          name="settlementDate"
          label="Settlement Date"
          rules={[{ required: true, message: "Settlement date is required" }]}>
          <DatePicker
            style={{ width: "100%" }}
            format={DATE_FORMAT}
            placeholder="Select settlement date"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="settlementAmount"
          label="Settlement Amount (NGN)"
          rules={[
            { required: true, message: "Amount is required" },
            { type: "number", min: 0, message: "Must be positive" },
          ]}>
          <InputNumber
            style={{ width: "100%" }}
            size="large"
            formatter={(value) =>
              `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
            placeholder="0.00"
          />
        </Form.Item>

        <Form.Item
          name="settlementTerms"
          label="Settlement Terms"
          rules={[
            { required: true, message: "Terms are required" },
            { max: 5000, message: "Terms too long" },
          ]}>
          <TextArea
            rows={8}
            placeholder="Enter the terms and conditions of the settlement..."
            maxLength={5000}
            showCount
          />
        </Form.Item>

        <Form.Item>
          <Space className="w-full justify-end">
            <Button onClick={onCancel}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large">
              Record Settlement
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SettlementRecordModal;
