import PropTypes from "prop-types";
import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MdNotificationsNone } from "react-icons/md";
import { Button, Input, Form, Modal, Card, Tooltip, DatePicker } from "antd";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  createReminder,
  selectTaskActionLoading,
} from "../redux/features/task/taskSlice";

const { TextArea } = Input;

const TaskReminderForm = ({ taskId }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectTaskActionLoading);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const handleCancel = useCallback(() => {
    form.resetFields();
    setOpen(false);
  }, [form]);

  const onSubmit = useCallback(
    async (values) => {
      try {
        await dispatch(
          createReminder({
            taskId,
            data: {
              message: values.message,
              scheduledFor: values.scheduledFor.toISOString(),
            },
          }),
        ).unwrap();

        toast.success("Reminder created successfully!");
        form.resetFields();
        setOpen(false);
      } catch (error) {
        toast.error(
          error?.message || "Failed to create reminder. Please try again.",
        );
      }
    },
    [dispatch, form, taskId],
  );

  return (
    <>
      <Tooltip title="Send Reminder">
        <Button
          icon={<MdNotificationsNone size={20} />}
          onClick={() => setOpen(true)}
          className="bg-blue-200 text-blue-600"
        />
      </Tooltip>

      <Modal
        title="Add Task Reminder"
        open={open}
        footer={null}
        onCancel={handleCancel}
        destroyOnClose>
        <section className="flex justify-center sm:justify-between gap-8">
          <Form
            layout="vertical"
            form={form}
            name="task_reminder_form"
            className="w-full max-w-lg"
            onFinish={onSubmit}
            initialValues={{
              scheduledFor: dayjs().add(1, "hour").startOf("hour"),
            }}>
            <Card bordered={false} className="w-full">
              <Form.Item
                name="message"
                label="Reminder Message"
                rules={[
                  {
                    required: true,
                    message: "Please provide a reminder message!",
                  },
                  {
                    max: 150,
                    message: "Message should not exceed 150 characters",
                  },
                ]}>
                <TextArea
                  rows={4}
                  placeholder="Enter your reminder message here..."
                  showCount
                  maxLength={150}
                />
              </Form.Item>

              <Form.Item
                name="scheduledFor"
                label="Remind At"
                rules={[
                  {
                    required: true,
                    message: "Please select a date and time for the reminder",
                  },
                ]}>
                <DatePicker
                  showTime={{ format: "HH:mm" }}
                  format="YYYY-MM-DD HH:mm"
                  className="w-full"
                  disabledDate={(current) =>
                    current && current < dayjs().startOf("day")
                  }
                  placeholder="Select date and time"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  loading={loading}
                  className="blue-btn"
                  htmlType="submit">
                  Create Reminder
                </Button>
              </Form.Item>
            </Card>
          </Form>
        </section>
      </Modal>
    </>
  );
};

TaskReminderForm.propTypes = {
  taskId: PropTypes.string.isRequired,
};

export default TaskReminderForm;
