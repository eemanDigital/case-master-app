import { useCallback, useEffect, useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { PlusOutlined, TagOutlined } from "@ant-design/icons";
import { taskPriorityOptions, taskStatusOptions } from "./../data/options";
import {
  Button,
  Input,
  Form,
  Modal,
  Select,
  DatePicker,
  Typography,
  InputNumber,
  Tag,
  Space,
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
import ButtonWithIcon from "../components/ButtonWithIcon";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Title } = Typography;

const CreateTaskForm = () => {
  const { casesOptions } = useCaseSelectOptions();
  const { userData } = useUserSelectOptions();
  const { clientOptions } = useClientSelectOptions();
  const { fetchData } = useDataGetterHook();
  const dispatch = useDispatch();
  const { users, user } = useSelector((state) => state.auth);
  const { emailSent, msg } = useSelector((state) => state.email);

  // Modal hooks
  const { open, confirmLoading, showModal, handleOk, handleCancel } =
    useModal();
  const [form] = Form.useForm();
  const [tags, setTags] = useState([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [tagInputValue, setTagInputValue] = useState("");

  const {
    dataFetcher,
    loading: loadingData,
    error: dataError,
  } = useDataFetch();

  // Handle form submission
  const handleSubmission = useCallback(
    (result) => {
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Task created successfully!");
        form.resetFields();
        setTags([]);
        handleCancel();
      }
    },
    [form, handleCancel]
  );

  // Fetch users
  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (values) => {
      try {
        // Prepare payload according to backend model
        const payload = {
          title: values.title,
          instruction: values.instruction,
          taskPriority: values.taskPriority,
          dueDate: values.dueDate.format("YYYY-MM-DD"),
          assignedBy: user?.data?._id, // Current user as assigner
          ...(values.caseToWorkOn && { caseToWorkOn: [values.caseToWorkOn] }), // Array of case IDs
          ...(values.assignedTo && { assignedTo: values.assignedTo }), // Array of staff IDs
          ...(values.assignedToClient && {
            assignedToClient: values.assignedToClient,
          }), // Single client ID
          ...(tags.length > 0 && {
            tags: tags.map((tag) => tag.toLowerCase().trim()),
          }), // Lowercase tags
          ...(values.completionPercentage && {
            completionPercentage: values.completionPercentage,
          }),
          ...(values.status && { status: values.status }),
        };

        // Validate assignment (must have staff or client assignment)
        if (
          (!payload.assignedTo || payload.assignedTo.length === 0) &&
          !payload.assignedToClient
        ) {
          toast.error(
            "Task must be assigned to at least one staff member or client"
          );
          return;
        }

        // Validate dates
        const dueDate = dayjs(values.dueDate);
        const today = dayjs().startOf("day");

        if (dueDate.isBefore(today)) {
          toast.error("Due date must be in the future");
          return;
        }

        // Post data
        const result = await dataFetcher("tasks", "POST", payload);

        // Send email notification if task was created successfully
        if (result?.status === "success") {
          // Prepare email data for assigned users
          const assignedUserIds = payload.assignedTo || [];
          const assignedUsers = users?.data?.filter((user) =>
            assignedUserIds.includes(user._id)
          );

          if (assignedUsers && assignedUsers.length > 0) {
            const sendToEmails = assignedUsers.map((user) => user.email);
            const emailData = {
              subject: "New Task Assigned - A.T. Lukman & Co.",
              send_to: sendToEmails,
              reply_to: "noreply@atlukman.com",
              template: "taskAssignment",
              url: "/dashboard/tasks",
              context: {
                sendersName: `${user?.data?.firstName} ${user?.data?.lastName}`,
                sendersPosition: user?.data?.position,
                title: payload.title,
                dueDate: formatDate(payload.dueDate),
                instruction: payload.instruction,
                taskPriority: payload.taskPriority,
                assignedTo: assignedUsers
                  .map((u) => `${u.firstName} ${u.lastName}`)
                  .join(", "),
              },
            };

            await dispatch(sendAutomatedCustomEmail(emailData));
          }

          await fetchData("tasks", "tasks");
          handleSubmission(result);
        }
      } catch (err) {
        console.error("Task creation error:", err);
        toast.error(err.message || "Failed to create task");
      }
    },
    [
      dataFetcher,
      fetchData,
      form,
      handleSubmission,
      user,
      users,
      dispatch,
      tags,
    ]
  );

  // Form submission
  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields();
      await handleSubmit(values);
    } catch (errorInfo) {
      console.error("Form validation error:", errorInfo);
      return;
    }
  }, [form, handleSubmit]);

  // Email success
  useEffect(() => {
    if (emailSent) {
      toast.success(msg);
    }
  }, [emailSent, msg]);

  // DataFetcher error
  useEffect(() => {
    if (dataError) {
      toast.error(dataError || "An error occurred");
    }
  }, [dataError]);

  // Tag handling functions
  const handleTagClose = (removedTag) => {
    const newTags = tags.filter((tag) => tag !== removedTag);
    setTags(newTags);
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleTagInputChange = (e) => {
    setTagInputValue(e.target.value);
  };

  const handleTagInputConfirm = () => {
    if (tagInputValue && tags.indexOf(tagInputValue) === -1) {
      setTags([...tags, tagInputValue]);
    }
    setInputVisible(false);
    setTagInputValue("");
  };

  const forMap = (tag) => (
    <span key={tag} style={{ display: "inline-block" }}>
      <Tag
        closable
        onClose={() => handleTagClose(tag)}
        style={{ marginBottom: "4px" }}>
        {tag}
      </Tag>
    </span>
  );

  const tagChild = tags.map(forMap);

  // Disable past dates for due date
  const disabledDate = (current) => {
    return current && current < dayjs().startOf("day");
  };

  return (
    <>
      <ButtonWithIcon
        onClick={showModal}
        icon={<PlusOutlined className="mr-2" />}
        text="Create Task"
      />
      <Modal
        width="80%"
        title={<Title level={3}>Create New Task</Title>}
        open={open}
        onOk={handleOk}
        footer={null}
        onCancel={handleCancel}
        confirmLoading={confirmLoading}
        className="modal-container"
        style={{ maxWidth: "900px" }}>
        <Form
          layout="vertical"
          form={form}
          name="create_task_form"
          className="flex flex-col gap-4"
          initialValues={{
            taskPriority: "medium",
            status: "pending",
          }}>
          {/* Basic Task Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Task Title"
              name="title"
              rules={[
                {
                  required: true,
                  message: "Please provide a title for the task!",
                },
                {
                  min: 3,
                  message: "Title must be at least 3 characters",
                },
                {
                  max: 200,
                  message: "Title cannot exceed 200 characters",
                },
              ]}>
              <Input placeholder="Enter task title" showCount maxLength={200} />
            </Form.Item>

            <Form.Item
              name="taskPriority"
              label="Task Priority"
              rules={[
                {
                  required: true,
                  message: "Please specify task priority",
                },
              ]}>
              <Select
                placeholder="Select priority level"
                options={taskPriorityOptions}
                className="w-full"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="instruction"
            label="Instructions"
            rules={[
              {
                required: true,
                message: "Please provide instructions for the task!",
              },
              {
                min: 10,
                message: "Instructions must be at least 10 characters",
              },
              {
                max: 5000,
                message: "Instructions cannot exceed 5000 characters",
              },
            ]}>
            <TextArea
              rows={4}
              placeholder="Enter detailed instructions for the task..."
              showCount
              maxLength={5000}
            />
          </Form.Item>

          {/* Assignment Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="caseToWorkOn" label="Related Case (Optional)">
              <Select
                placeholder="Select a related case"
                options={casesOptions}
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
                  message: "Please specify the due date for the task",
                },
              ]}>
              <DatePicker
                className="w-full"
                disabledDate={disabledDate}
                placeholder="Select due date"
              />
            </Form.Item>
          </div>

          {/* Assignment Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="assignedTo"
              label="Assign to Staff"
              dependencies={["assignedToClient"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (
                      value &&
                      value.length > 0 &&
                      getFieldValue("assignedToClient")
                    ) {
                      return Promise.reject(
                        new Error(
                          "Task cannot be assigned to both staff and client"
                        )
                      );
                    }
                    return Promise.resolve();
                  },
                }),
              ]}>
              <Select
                mode="multiple"
                placeholder="Select staff members"
                options={userData}
                allowClear
                className="w-full"
                maxTagCount={3}
              />
            </Form.Item>

            <Form.Item
              name="assignedToClient"
              label="Assign to Client"
              dependencies={["assignedTo"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (
                      value &&
                      getFieldValue("assignedTo") &&
                      getFieldValue("assignedTo").length > 0
                    ) {
                      return Promise.reject(
                        new Error(
                          "Task cannot be assigned to both staff and client"
                        )
                      );
                    }
                    return Promise.resolve();
                  },
                }),
              ]}>
              <Select
                placeholder="Select a client"
                options={clientOptions}
                allowClear
                className="w-full"
              />
            </Form.Item>
          </div>

          {/* Additional Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="completionPercentage"
              label="Initial Completion % (Optional)">
              <InputNumber
                min={0}
                max={100}
                placeholder="0-100"
                className="w-full"
                addonAfter="%"
              />
            </Form.Item>

            <Form.Item name="status" label="Initial Status">
              <Select
                placeholder="Select status"
                options={taskStatusOptions}
                className="w-full"
              />
            </Form.Item>
          </div>

          {/* Tags Section */}
          <Form.Item label="Tags (Optional)">
            <div className="border border-dashed border-gray-300 rounded-lg p-3">
              <div className="mb-2">
                <Space size={[0, 8]} wrap>
                  {tagChild}
                </Space>
              </div>
              {inputVisible ? (
                <Input
                  type="text"
                  size="small"
                  style={{ width: 150 }}
                  value={tagInputValue}
                  onChange={handleTagInputChange}
                  onBlur={handleTagInputConfirm}
                  onPressEnter={handleTagInputConfirm}
                  placeholder="Enter tag"
                />
              ) : (
                <Button
                  size="small"
                  type="dashed"
                  icon={<TagOutlined />}
                  onClick={showInput}>
                  Add Tag
                </Button>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Add tags to categorize and search tasks (e.g., 'urgent',
              'research', 'draft')
            </div>
          </Form.Item>

          {/* Validation Summary */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-700">
              <strong>Validation Rules:</strong>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Title: 3-200 characters</li>
                <li>Instructions: 10-5000 characters</li>
                <li>Due date must be in the future</li>
                <li>Must assign to staff OR client (not both)</li>
                <li>Completion %: 0-100</li>
              </ul>
            </div>
          </div>

          <Form.Item className="mb-0">
            <Button
              onClick={onSubmit}
              loading={loadingData}
              htmlType="submit"
              type="primary"
              size="large"
              className="w-full blue-btn">
              Create Task
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CreateTaskForm;
