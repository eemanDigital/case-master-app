import React, { useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Alert,
  Space,
  message,
} from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import dayjs from "dayjs";
import {
  updateNBAStamp,
  fetchRetainerDetails,
} from "../../../redux/features/retainer/retainerSlice";

const NBAStampModal = ({
  visible,
  onCancel,
  matterId,
  currentStampDetails,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (visible && currentStampDetails) {
      form.setFieldsValue({
        stampNumber: currentStampDetails.stampNumber,
        stampValue: currentStampDetails.stampValue,
        stampDate: currentStampDetails.stampDate
          ? dayjs(currentStampDetails.stampDate)
          : dayjs(),
      });
    }
  }, [visible, currentStampDetails, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      await dispatch(
        updateNBAStamp({
          matterId,
          data: {
            stampNumber: values.stampNumber,
            stampValue: values.stampValue,
            stampDate: values.stampDate.toISOString(),
          },
        }),
      ).unwrap();
      message.success("NBA stamp details updated successfully");
      dispatch(fetchRetainerDetails(matterId));
      onCancel();
    } catch (error) {
      message.error(error.message || "Failed to update NBA stamp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SafetyCertificateOutlined className="text-green-600" />
          <span>NBA Stamp Details</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Update Stamp Details"
      cancelText="Cancel"
      width={600}>
      <Alert
        message="NBA Stamp Compliance"
        description="Nigerian Bar Association stamp is required for certain legal agreements. Ensure all details are accurate for compliance purposes."
        type="info"
        showIcon
        className="mb-4"
      />
      <Form form={form} layout="vertical">
        <Form.Item
          name="stampNumber"
          label="NBA Stamp Number"
          rules={[
            { required: true, message: "Please enter stamp number" },
            {
              pattern: /^[A-Z0-9\-\/]+$/i,
              message: "Invalid stamp number format",
            },
          ]}>
          <Input placeholder="e.g., NBA/LAG/2024/001234" size="large" />
        </Form.Item>

        <Form.Item
          name="stampDate"
          label="Stamp Date"
          rules={[{ required: true, message: "Please select stamp date" }]}>
          <DatePicker
            format="DD/MM/YYYY"
            className="w-full"
            size="large"
            disabledDate={(current) => current && current > dayjs()}
          />
        </Form.Item>

        <Form.Item
          name="stampValue"
          label="Stamp Value"
          rules={[
            { required: true, message: "Please enter stamp value" },
            { type: "number", min: 0, message: "Value must be positive" },
          ]}>
          <InputNumber
            min={0}
            className="w-full"
            prefix="₦"
            placeholder="0.00"
            size="large"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NBAStampModal;
