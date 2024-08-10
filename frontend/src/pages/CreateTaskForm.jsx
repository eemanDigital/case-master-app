import { useCallback, useEffect } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { taskPriorityOptions } from "./../data/options";
import {
  Button,
  Input,
  Form,
  Modal,
  Select,
  DatePicker,
  Typography,
} from "antd";
import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import useModal from "../hooks/useModal";
import { SelectInputs } from "../components/DynamicInputs";
import useClientSelectOptions from "../hooks/useClientSelectOptions";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useDispatch, useSelector } from "react-redux";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import { getUsers } from "../redux/features/auth/authSlice";
import { formatDate } from "../utils/formatDate";
import { toast } from "react-toastify";

const { TextArea } = Input;
const { Title } = Typography;

const CreateTaskForm = () => {
  const { casesOptions } = useCaseSelectOptions();
  const { userData } = useUserSelectOptions();
  const { clientOptions } = useClientSelectOptions();
  const { fetchData } = useDataGetterHook();
  const dispatch = useDispatch();
  const { users, user } = useSelector((state) => state.auth);
  const { sendingEmail, emailSent, msg } = useSelector((state) => state.email);

  const { open, confirmLoading, showModal, handleOk, handleCancel } =
    useModal();
  const [form] = Form.useForm();
  const { dataFetcher } = useDataFetch();

  const handleSubmission = useCallback(
    (result) => {
      if (result?.error) {
        // Handle Error here
      } else {
        // Handle Success here
        form.resetFields();
      }
    },
    [form]
  );

  // / fetch users
  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  const handleSubmit = useCallback(
    async (values) => {
      try {
        // Extract user IDs from values.assignedTo
        const assignedUserIds = values.assignedTo || []; // Ensure it's an array

        // Find corresponding user objects from the users state
        const assignedUsers = users?.data?.filter((user) =>
          assignedUserIds.includes(user._id)
        );

        // Map user objects to their email addresses
        const sendToEmails = assignedUsers?.map((user) => user.email);
        // Prepare email data
        const emailData = {
          subject: "New Task Assigned - A.T. Lukman & Co.",
          send_to: sendToEmails,
          send_from: user?.data?.email,
          reply_to: "noreply@gmail.com",
          template: "taskAssignment",
          context: {
            sendersName: user?.data?.firstName,
            sendersPosition: user?.data?.position,
            title: values.title,
            dueDate: formatDate(values.dueDate),
            instruction: values.instruction,
            taskPriority: values.taskPriority,
            url: "dashboard/tasks",
          },
        };

        // Post data
        const result = await dataFetcher("tasks", "POST", values);
        await fetchData("tasks", "tasks");
        handleSubmission(result);

        // Send email if emailData is provided
        if (!result?.error && emailData) {
          await dispatch(sendAutomatedCustomEmail(emailData));
        }
        form.resetFields();
      } catch (err) {
        console.error(err);
      }
    },
    [dataFetcher, fetchData, form, handleSubmission, user, users, dispatch]
  );

  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (errorInfo) {
      return;
    }
    await handleSubmit(values);
  }, [form, handleSubmit]);

  useEffect(() => {
    if (emailSent) {
      toast.success(msg);
    }
  }, [emailSent, msg]);

  return (
    <>
      <Button
        onClick={showModal}
        className="blue-btn text-white rounded-lg shadow-md transition duration-300">
        Create Task
      </Button>
      <Modal
        width="80%"
        title={<Title level={3}>Assign Task</Title>}
        open={open}
        onOk={handleOk}
        footer={null}
        onCancel={handleCancel}
        confirmLoading={confirmLoading}
        className="modal-container">
        <Form
          layout="vertical"
          form={form}
          name="create_task_form"
          className="flex flex-col gap-6">
          <Form.Item label="Task Title" name="title">
            <Input placeholder="Enter task title" />
          </Form.Item>

          <Form.Item
            name="instruction"
            label="Instruction"
            rules={[
              {
                required: true,
                message: "Please provide instructions for the task!",
              },
            ]}>
            <TextArea rows={4} placeholder="Enter detailed instructions" />
          </Form.Item>

          <Form.Item name="caseToWorkOn" label="Case To Work On">
            <Select
              placeholder="Select a case"
              options={casesOptions}
              allowClear
              className="w-full"
            />
          </Form.Item>

          <Form.Item name="assignedTo" label="Assigned To">
            <Select
              mode="multiple"
              placeholder="Select staff members"
              options={userData}
              allowClear
              className="w-full"
            />
          </Form.Item>

          <Form.Item name="assignedToClient" label="Assigned To Client">
            <Select
              placeholder="Select a client"
              options={clientOptions}
              allowClear
              className="w-full"
            />
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Due Date"
            rules={[
              {
                required: true,
                message: "Specify the due date for the task",
              },
            ]}>
            <DatePicker className="w-full" />
          </Form.Item>

          <SelectInputs
            defaultValue="high"
            fieldName="taskPriority"
            label="Task Priority"
            options={taskPriorityOptions}
          />

          <Form.Item>
            <Button
              onClick={onSubmit}
              type="primary"
              htmlType="submit"
              className="w-full">
              Save
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CreateTaskForm;
