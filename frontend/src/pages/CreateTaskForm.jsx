import { useCallback, useEffect, useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { PlusOutlined, TagOutlined, UserOutlined } from "@ant-design/icons";
import {
  taskPriorityOptions,
  taskStatusOptions,
  taskCategoryOptions,
} from "./../data/options";
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
  Row,
  Col,
  Avatar,
} from "antd";
import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import useModal from "../hooks/useModal";
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
  const { userData, allUsers } = useUserSelectOptions(); // Get userData from hook
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
  const [selectedStaff, setSelectedStaff] = useState([]);

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
        setSelectedStaff([]);
        handleCancel();
      }
    },
    [form, handleCancel]
  );

  // Fetch users on component mount
  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  // Handle staff selection change
  const handleStaffChange = (values) => {
    setSelectedStaff(values || []);
  };

  // Custom staff option renderer with user details
  const staffOptionRenderer = (staffId) => {
    const staff = users?.data?.find((user) => user._id === staffId);
    if (!staff) return null;

    return {
      value: staff._id,
      label: (
        <div className="flex items-center gap-2">
          <Avatar size="small" src={staff.photo} icon={<UserOutlined />}>
            {staff.firstName?.[0]}
          </Avatar>
          <div>
            <div className="font-medium">
              {staff.firstName} {staff.lastName}
            </div>
            <div className="text-xs text-gray-500">
              {staff.position} • {staff.role}
            </div>
          </div>
        </div>
      ),
    };
  };

  // Get staff options with enhanced display
  const staffOptions =
    userData?.map((staff) => {
      const user = users?.data?.find((u) => u._id === staff.value);
      return {
        value: staff.value,
        label: (
          <div className="flex items-center gap-2">
            <Avatar size="small" src={user?.photo} icon={<UserOutlined />}>
              {user?.firstName?.[0]}
            </Avatar>
            <div>
              <div className="font-medium">{staff.label}</div>
              {user?.position && (
                <div className="text-xs text-gray-500">
                  {user.position} • {user.role}
                </div>
              )}
            </div>
          </div>
        ),
      };
    }) || [];

  // Handle form submission
  const handleSubmit = useCallback(
    async (values) => {
      try {
        // Prepare assignedTo array with proper structure for new model
        const assignedTo = selectedStaff.map((staffId) => ({
          user: staffId,
          role: "primary",
        }));

        // Prepare payload according to new backend model
        const payload = {
          title: values.title,
          description: values.description || "",
          instruction: values.instruction,
          priority: values.priority,
          category: values.category,
          dueDate: values.dueDate.format("YYYY-MM-DD"),
          case: values.case,
          assignedBy: user?.data?._id,
          assignedTo: assignedTo,
          ...(values.estimatedHours && {
            estimatedHours: values.estimatedHours,
          }),
          ...(tags.length > 0 && {
            tags: tags.map((tag) => tag.toLowerCase().trim()),
          }),
          ...(values.status && { status: values.status }),
        };

        console.log("Creating task with payload:", payload);

        // Validate assignment (must have staff assignment)
        if (!payload.assignedTo || payload.assignedTo.length === 0) {
          toast.error("Task must be assigned to at least one staff member");
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
          const assignedUserIds = selectedStaff;
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
                priority: payload.priority,
                category: payload.category,
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
      selectedStaff,
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
            priority: "medium",
            status: "pending",
            category: "other",
          }}>
          {/* Basic Task Information */}
          <Row gutter={16}>
            <Col span={12}>
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
                <Input
                  placeholder="Enter task title"
                  showCount
                  maxLength={200}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Task Category"
                rules={[
                  {
                    required: true,
                    message: "Please select task category",
                  },
                ]}>
                <Select
                  placeholder="Select category"
                  options={taskCategoryOptions}
                  className="w-full"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description (Optional)">
            <TextArea
              rows={2}
              placeholder="Brief description of the task..."
              showCount
              maxLength={500}
            />
          </Form.Item>

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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="case"
                label="Related Case"
                rules={[
                  {
                    required: true,
                    message: "Please select a related case",
                  },
                ]}>
                <Select
                  placeholder="Select a related case"
                  options={casesOptions}
                  className="w-full"
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
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
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Priority and Estimation */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="priority"
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
            </Col>
            <Col span={12}>
              <Form.Item
                name="estimatedHours"
                label="Estimated Hours (Optional)">
                <InputNumber
                  min={0}
                  max={1000}
                  placeholder="Estimated hours"
                  className="w-full"
                  addonAfter="hours"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Staff Assignment */}
          <Form.Item
            name="assignedTo"
            label="Assign to Staff"
            rules={[
              {
                required: true,
                message: "Please assign task to at least one staff member",
              },
            ]}>
            <Select
              mode="multiple"
              placeholder="Select staff members"
              options={staffOptions}
              onChange={handleStaffChange}
              className="w-full"
              maxTagCount={3}
              optionLabelProp="label"
              showSearch
              filterOption={(input, option) =>
                option.label.props.children[1].props.children[0].props.children
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>

          {/* Additional Options */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Initial Status">
                <Select
                  placeholder="Select status"
                  options={taskStatusOptions}
                  className="w-full"
                />
              </Form.Item>
            </Col>
          </Row>

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
                <li>Must assign to at least one staff member</li>
                <li>Case selection is required</li>
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
