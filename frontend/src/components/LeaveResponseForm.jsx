import PrpTypes from "prop-types";
import { useState } from "react";
import { Modal, Button, Form, Input, Select } from "antd";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";

const LeaveResponseForm = ({ appId }) => {
  const [open, setOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const { data, loading, error: dataError, dataFetcher } = useDataFetch();
  const dispatch = useDispatch();

  const [form] = Form.useForm();

  const showModal = () => {
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const statusOptions = [
    { label: "Select response type", value: "" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  // Function to handle form submission
  const handleFinish = async (values) => {
    try {
      // Email data
      const emailData = {
        subject: "Leave Application Response- A.T. Lukman & Co.",
        send_to: data?.data?.employee?.email,
        // send_from: user?.data?.email,
        reply_to: "noreply@gmail.com",
        template: "leaveResponse",
        url: "dashboard/staff",
        context: {
          applicationDate: formatDate(data?.data?.createdAt),
          typeOfLeave: data?.data?.typeOfLeave,
          startDate: values.startDate || data?.data.startDate,
          endDate: values.endDate || data?.data.endDate,
          status: values.status,
          daysApproved: data?.data?.daysApproved,
          responseMessage: values.responseMessage,
          approvedBy: user?.data?.firstName,
        },
      };
      // Submit response
      await dataFetcher(`leaves/applications/${appId}`, "put", values);

      if (data?.message === "success") {
        toast.success("Response submitted successfully");
      }
      // Send email
      await dispatch(sendAutomatedCustomEmail(emailData));

      form.resetFields();
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while submitting the response");
    }
  };

  if (dataError) return toast.error("Failed to submit response");

  return (
    <>
      <Button onClick={showModal} className="blue-btn">
        Respond To Leave Application
      </Button>
      <Modal
        title="Leave Application Response"
        open={open}
        footer={null}
        confirmLoading={loading}
        onCancel={handleCancel}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            startDate: data?.data?.startDate,
            endDate: data?.data?.endDate,
            status: "",
            responseMessage: data?.data?.responseMessage || "",
          }}>
          <Form.Item
            name="startDate"
            label="Start Date"
            // rules={[{ required: true, message: "Please select start date" }]}
          >
            <Input type="date" />
          </Form.Item>
          <Form.Item
            name="endDate"
            label="End Date"
            // rules={[{ required: true, message: "Please select end date" }]}
          >
            <Input type="date" />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[
              { required: true, message: "Please select response status" },
            ]}>
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item
            name="responseMessage"
            label="Response Message"
            rules={[
              { required: true, message: "Please provide a response message" },
            ]}>
            <Input.TextArea placeholder="Your message..." />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="blue-btn"
              loading={loading}>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

// Typechecking for props
LeaveResponseForm.propTypes = { appId: PrpTypes.string.isRequired };

export default LeaveResponseForm;
