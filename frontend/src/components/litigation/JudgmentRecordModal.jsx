import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Button,
  Space,
  message,
} from "antd";
// import { ScaleOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  recordJudgment,
  selectActionLoading,
} from "../../redux/features/litigation/litigationSlice";
import { DATE_FORMAT } from "../../utils/litigationConstants";

const { Option } = Select;
const { TextArea } = Input;

const JUDGMENT_OUTCOMES = [
  { value: "plaintiff-wins", label: "Plaintiff Wins", color: "green" },
  { value: "defendant-wins", label: "Defendant Wins", color: "red" },
  { value: "split-decision", label: "Split Decision", color: "orange" },
  { value: "dismissed", label: "Case Dismissed", color: "gray" },
  { value: "withdrawn", label: "Case Withdrawn", color: "blue" },
  { value: "settled", label: "Settled Out of Court", color: "purple" },
];

const JudgmentRecordModal = ({
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
      const judgmentData = {
        judgmentDate: values.judgmentDate.toISOString(),
        outcome: values.outcome,
        damages: values.damages || 0,
        costs: values.costs || 0,
        judgmentSummary: values.judgmentSummary,
      };

      await dispatch(recordJudgment({ matterId, judgmentData })).unwrap();
      message.success("Judgment recorded successfully");
      form.resetFields();
      onCancel();
    } catch (error) {
      message.error(error?.message || "Failed to record judgment");
    }
  };

  // Format initial values if editing
  const formInitialValues = initialValues
    ? {
        ...initialValues,
        judgmentDate: initialValues.judgmentDate
          ? dayjs(initialValues.judgmentDate)
          : null,
      }
    : {};

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          {/* <ScaleOutlined /> */}
          <span>{initialValues ? "Edit" : "Record"} Judgment</span>
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
          name="judgmentDate"
          label="Judgment Date"
          rules={[{ required: true, message: "Judgment date is required" }]}>
          <DatePicker
            style={{ width: "100%" }}
            format={DATE_FORMAT}
            placeholder="Select judgment date"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="outcome"
          label="Judgment Outcome"
          rules={[{ required: true, message: "Outcome is required" }]}>
          <Select size="large" placeholder="Select outcome">
            {JUDGMENT_OUTCOMES.map((outcome) => (
              <Option key={outcome.value} value={outcome.value}>
                {outcome.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="damages"
          label="Damages Awarded (NGN)"
          rules={[{ type: "number", min: 0, message: "Must be positive" }]}>
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
          name="costs"
          label="Costs Awarded (NGN)"
          rules={[{ type: "number", min: 0, message: "Must be positive" }]}>
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
          name="judgmentSummary"
          label="Judgment Summary"
          rules={[
            { required: true, message: "Summary is required" },
            { max: 5000, message: "Summary too long" },
          ]}>
          <TextArea
            rows={6}
            placeholder="Enter a summary of the judgment..."
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
              Record Judgment
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default JudgmentRecordModal;
