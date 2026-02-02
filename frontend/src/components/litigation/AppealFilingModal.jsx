import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Space,
  message,
} from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  fileAppeal,
  selectActionLoading,
} from "../../redux/features/litigation/litigationSlice";
import { DATE_FORMAT, COURT_TYPES } from "../../utils/litigationConstants";

const { Option } = Select;

const APPEAL_STATUS = [
  { value: "pending", label: "Pending", color: "blue" },
  { value: "admitted", label: "Admitted", color: "green" },
  { value: "dismissed", label: "Dismissed", color: "red" },
  { value: "withdrawn", label: "Withdrawn", color: "orange" },
  { value: "decided", label: "Decided", color: "purple" },
];

const AppealFilingModal = ({ visible, onCancel, matterId, initialValues }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const loading = useSelector(selectActionLoading);

  const handleSubmit = async (values) => {
    try {
      const appealData = {
        isAppealed: true,
        appealDate: values.appealDate.toISOString(),
        appealCourt: values.appealCourt,
        appealSuitNo: values.appealSuitNo,
        appealStatus: values.appealStatus || "pending",
      };

      await dispatch(fileAppeal({ matterId, appealData })).unwrap();
      message.success("Appeal filed successfully");
      form.resetFields();
      onCancel();
    } catch (error) {
      message.error(error?.message || "Failed to file appeal");
    }
  };

  // Format initial values if editing
  const formInitialValues = initialValues
    ? {
        ...initialValues,
        appealDate: initialValues.appealDate
          ? dayjs(initialValues.appealDate)
          : null,
      }
    : {
        appealStatus: "pending",
      };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <TrophyOutlined />
          <span>{initialValues ? "Edit" : "File"} Appeal</span>
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
          name="appealDate"
          label="Appeal Date"
          rules={[{ required: true, message: "Appeal date is required" }]}>
          <DatePicker
            style={{ width: "100%" }}
            format={DATE_FORMAT}
            placeholder="Select appeal date"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="appealCourt"
          label="Appeal Court"
          rules={[{ required: true, message: "Appeal court is required" }]}>
          <Select
            size="large"
            placeholder="Select appeal court"
            showSearch
            optionFilterProp="children">
            {COURT_TYPES.filter((court) =>
              ["court of appeal", "supreme court"].includes(court.value),
            ).map((court) => (
              <Option key={court.value} value={court.value}>
                {court.label}
              </Option>
            ))}
            {/* Allow other courts too */}
            {COURT_TYPES.map((court) => (
              <Option key={court.value} value={court.value}>
                {court.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="appealSuitNo"
          label="Appeal Suit Number"
          rules={[
            { required: true, message: "Appeal suit number is required" },
            { min: 3, message: "Suit number must be at least 3 characters" },
          ]}>
          <Input size="large" placeholder="e.g., CA/L/123/2024" />
        </Form.Item>

        <Form.Item
          name="appealStatus"
          label="Appeal Status"
          rules={[{ required: true, message: "Status is required" }]}>
          <Select size="large" placeholder="Select status">
            {APPEAL_STATUS.map((status) => (
              <Option key={status.value} value={status.value}>
                {status.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Space className="w-full justify-end">
            <Button onClick={onCancel}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large">
              File Appeal
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AppealFilingModal;
