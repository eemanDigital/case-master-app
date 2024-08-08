import { useState } from "react";
import { Modal, Form, Input, Select, Button } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import { toast } from "react-toastify";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import { useDispatch, useSelector } from "react-redux";

const LeaveAppForm = () => {
  const leaveType = [
    { label: "Select leave type", value: "" },
    { label: "Annual", value: "annual" },
    { label: "Casual", value: "casual" },
    { label: "Maternity", value: "maternity" },
    { label: "Sick", value: "sick" },
    { label: "Others", value: "others" },
  ];
  const { user } = useSelector((state) => state.auth);
  const { data, loading, error: dataError, dataFetcher } = useDataFetch();
  const { adminOptions } = useUserSelectOptions();
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const showModal = () => {
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handleSubmit = async (values) => {
    console.log("Submitting Leave Application:", values);
    try {
      // prepare email data
      const emailData = {
        subject: "Employee's Leave Application- A.T. Lukman & Co.",
        send_to: values.applyTo,
        send_from: user?.data?.email,
        reply_to: "noreply@gmail.com",
        template: "leaveApplication",
        url: "dashboard/staff",
        context: {
          leaveType: values.typeOfLeave,
          startDate: values.startDate,
          daysAppliedFor: data?.data?.daysAppliedFor,
          endDate: values.endDate,
          applicantName: user?.data?.firstName,
        },
      };
      // post data
      await dataFetcher("leaves/applications", "POST", values);
      // if (data?.message === "success" && emailData) {
      if (!dataError && emailData) {
        await dispatch(sendAutomatedCustomEmail(emailData)); // Send email if emailData is provided
      }
      form.resetFields();
      setVisible(false);
    } catch (err) {
      console.log(err);
    }
  };

  // send success message
  if (data?.message === "success") {
    toast.success("Leave Balance Created");
  }

  // send error message
  if (dataError) {
    toast.error(dataError);
  }

  console.log(data, "data");
  return (
    <>
      <Button className="blue-btn" onClick={showModal}>
        Apply for Leave
      </Button>
      <Modal
        title="Leave Application"
        open={visible}
        onCancel={handleCancel}
        footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: "Please select start date" }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item
            name="endDate"
            label="End Date"
            rules={[{ required: true, message: "Please select end date" }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item
            name="typeOfLeave"
            label="Leave Type"
            rules={[{ required: true, message: "Please select leave type" }]}>
            <Select options={leaveType} />
          </Form.Item>
          <Form.Item name="reason" label="Reason for Leave">
            <Input.TextArea placeholder="Your reason..." />
          </Form.Item>
          <Form.Item
            name="applyTo"
            label="Application To"
            rules={[
              {
                required: true,
                message: "Please select the approving authority",
              },
            ]}>
            <Select
              placeholder="Select"
              options={adminOptions}
              allowClear
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item>
            <Button className="blue-btn" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default LeaveAppForm;
