import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { Modal, Button, Form, Input, Checkbox, Upload } from "antd";
import useModal from "../hooks/useModal";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import { FaCheck, FaTimes } from "react-icons/fa";
import { UploadOutlined } from "@ant-design/icons";

const TaskResponseForm = ({ taskId }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { user } = useSelector((state) => state.auth);
  const { sendingEmail, emailSent, msg } = useSelector((state) => state.email);
  const [formData, setFormData] = useState({
    comment: "",
    doc: null,
    completed: false,
  });

  const { open, showModal, handleCancel } = useModal(); //custom hook

  const { dataFetcher, error: dataError } = useDataFetch();

  function handleChange(e) {
    const { name, value, files, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]:
        name === "doc"
          ? files.length > 0
            ? files[0]
            : null
          : name === "completed"
          ? checked
          : value,
    }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append("comment", formData.comment);
    if (formData.doc) {
      payload.append("doc", formData.doc);
    }
    payload.append("completed", formData.completed);

    try {
      const response = await dataFetcher(
        `tasks/${taskId}/response`,
        "post",
        payload
      );
      if (response?.message === "success") {
        toast.success("Task response submitted successfully!");
      }

      const emailData = {
        subject: "Task Response Submitted - A.T. Lukman & Co.",
        send_to: response?.data?.assignedBy?.email,
        send_from: user?.data?.email,
        reply_to: "noreply@atlukman.com",
        template: "taskResponse",
        url: "dashboard/tasks",

        context: {
          recipient: response?.data?.assignedBy?.firstName,
          position: response?.data?.assignedBy?.position,
          comment: formData?.comment,
          completed: formData?.completed ? <FaCheck /> : <FaTimes />,
        },
      };

      try {
        if (response?.message === "success") {
          await dispatch(sendAutomatedCustomEmail(emailData));
        }
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        toast.warning(
          "Task response submitted, but failed to send email notification."
        );
      }

      handleCancel(); // Close the modal on successful submission
    } catch (err) {
      console.error(err);
      toast.error(
        err.message || "Failed to submit task response. Please try again."
      );
    }
  };

  useEffect(() => {
    if (emailSent) {
      toast.success(msg);
    }
  }, [emailSent, msg]);

  if (dataError) {
    toast.error(dataError);
    return null;
  }

  return (
    <div className="max-w-md mx-auto">
      <Button
        onClick={showModal}
        className="w-full sm:w-auto px-6 py-2 text-sm sm:text-base font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md shadow-md transition duration-300 ease-in-out flex items-center justify-center"
        disabled={sendingEmail}>
        {sendingEmail ? "Sending..." : "Send Task Response"}
      </Button>

      <Modal
        title={
          <h2 className="text-lg sm:text-xl font-semibold">
            Task Response Form
          </h2>
        }
        open={open}
        onCancel={handleCancel}
        footer={[
          <Button
            key="cancel"
            onClick={handleCancel}
            className="px-4 py-1 text-sm sm:text-base">
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => form.submit()}
            disabled={sendingEmail}
            className="px-4 py-1 text-sm sm:text-base bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600">
            {sendingEmail ? "Sending..." : "Submit"}
          </Button>,
        ]}
        className="sm:min-w-[500px]">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4">
          <Form.Item
            name="doc"
            label={
              <span className="text-sm sm:text-base">
                Upload Document (optional)
              </span>
            }
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}>
            <Upload
              name="doc"
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              beforeUpload={() => false}
              onChange={handleChange}>
              <Button
                icon={<UploadOutlined />}
                className="text-sm sm:text-base">
                Click to Upload
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="completed"
            valuePropName="checked"
            initialValue={formData.completed}>
            <Checkbox onChange={handleChange} className="text-sm sm:text-base">
              Task Completed
            </Checkbox>
          </Form.Item>

          <Form.Item
            name="comment"
            label={
              <span className="text-sm sm:text-base">Your comment here...</span>
            }
            rules={[{ required: true, message: "Please provide a comment!" }]}>
            <Input.TextArea
              rows={4}
              placeholder="Your comment here..."
              value={formData.comment}
              onChange={handleChange}
              className="text-sm sm:text-base"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Prop types validation
TaskResponseForm.propTypes = {
  taskId: PropTypes.string.isRequired,
};
export default TaskResponseForm;
