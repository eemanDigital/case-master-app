import PropTypes from "prop-types";
import { useState, useCallback } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { MdNotificationsNone } from "react-icons/md";
import { Button, Input, Form, Modal, Card, Tooltip } from "antd";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const { TextArea } = Input;

const TaskReminderForm = ({ id }) => {
  const [open, setOpen] = useState(false);
  const { dataFetcher, loading } = useDataFetch();

  const showModal = () => {
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const [form] = Form.useForm();

  const handleSubmission = useCallback(
    (result) => {
      if (result?.error) {
        toast.error("Failed to send the reminder! Please try again.");
      } else {
        toast.success("Reminder sent successfully!");
        form.resetFields();
        setOpen(false);
      }
    },
    [form]
  );

  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (errorInfo) {
      toast.error("Please correct the form errors before submitting.");
      return;
    }
    const result = await dataFetcher(`tasks/${id}`, "patch", values);
    handleSubmission(result);
  }, [form, handleSubmission, dataFetcher, id]);

  return (
    <>
      <Tooltip title="Send Reminder">
        <Button
          icon={<MdNotificationsNone size={20} />}
          onClick={showModal}
          className="bg-blue-200 text-blue-600"
        />
      </Tooltip>
      <Modal
        title="Send Reminder on Task"
        open={open}
        footer={null}
        confirmLoading={loading}
        onCancel={handleCancel}>
        <section className="flex justify-center sm:justify-between gap-8">
          <Form
            layout="vertical"
            form={form}
            name="dynamic_form_complex"
            className="w-full max-w-lg"
            onFinish={onSubmit}>
            <Card bordered={false} className="w-full">
              <Form.Item
                name={["reminder", "message"]}
                label="Write your message here..."
                initialValue=""
                rules={[
                  {
                    required: true,
                    message: "Please, provide your message!",
                  },
                ]}>
                <TextArea rows={5} placeholder="Your text here..." />
              </Form.Item>

              <Form.Item>
                <Button
                  loading={loading}
                  className="blue-btn"
                  htmlType="submit">
                  Save
                </Button>
              </Form.Item>
            </Card>
          </Form>
        </section>
      </Modal>
    </>
  );
};
// Prop types validation
TaskReminderForm.propTypes = {
  id: PropTypes.string.isRequired,
};
export default TaskReminderForm;
