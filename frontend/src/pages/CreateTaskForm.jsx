import { useCallback, useEffect, useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import {
  PlusOutlined,
  UserAddOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import {
  taskPriorityOptions,
  taskCategoryOptions,
  taskStatusOptions,
} from "./../data/options";
import {
  Button,
  Input,
  Form,
  Modal,
  Select,
  DatePicker,
  Typography,
  Space,
  Tag,
  InputNumber,
  Divider,
  Alert,
  Collapse,
  Upload,
  message,
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
import TaskFileUploader from "../components/TaskFileUploader";

const { TextArea } = Input;
const { Title } = Typography;
const { Panel } = Collapse;

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
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [referenceDocuments, setReferenceDocuments] = useState([]);
  const {
    dataFetcher,
    loading: loadingData,
    error: dataError,
  } = useDataFetch();

  // Handle form submission
  const handleSubmission = useCallback(
    (result) => {
      if (result?.error) {
        // Handle Error here
      } else {
        // Handle Success here
        form.resetFields();
        setSelectedAssignees([]);
        setReferenceDocuments([]);
      }
    },
    [form]
  );

  // Fetch users
  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  // Handle assignee selection change
  const handleAssigneeChange = (value) => {
    setSelectedAssignees(value || []);
  };

  // Handle document upload success
  const handleDocumentUploadSuccess = (uploadedFiles) => {
    const newDocIds = uploadedFiles.files.map((file) => file._id);
    setReferenceDocuments((prev) => [...prev, ...newDocIds]);
    toast.success(`Added ${uploadedFiles.files.length} reference document(s)`);
  };

  // Handle form submission
  const handleSubmit = useCallback(
    async (values) => {
      try {
        // Prepare task data with new fields
        const taskData = {
          ...values,
          dateAssigned: values.dateAssigned || new Date(),
          dueDate: values.dueDate,
          startDate: values.startDate,
          assignedBy: user?.data?._id,
          // Use new assignees structure
          assignees: selectedAssignees.map((userId) => ({
            user: userId,
            role: "primary", // Default role, can be enhanced with role selection
            assignedBy: user?.data?._id,
          })),
          // Include reference documents
          referenceDocuments: referenceDocuments,
          // Set default status
          status: values.status || "pending",
          // Include new fields
          category: values.category || "other",
          estimatedEffort: values.estimatedEffort,
          tags: values.tags
            ? values.tags.split(",").map((tag) => tag.trim())
            : [],
          dependencies: values.dependencies || [],
          isTemplate: values.isTemplate || false,
          templateName: values.templateName,
          recurrence: values.recurrencePattern
            ? {
                pattern: values.recurrencePattern,
                endAfter: values.recurrenceEndDate,
                occurrences: values.recurrenceOccurrences,
              }
            : { pattern: "none" },
        };

        // Remove legacy fields if using new structure
        delete taskData.assignedTo; // Using assignees instead

        // Extract user IDs for email
        const assignedUserIds = selectedAssignees;
        const assignedUsers = users?.data?.filter((user) =>
          assignedUserIds.includes(user._id)
        );
        const sendToEmails = assignedUsers?.map((user) => user.email);

        // Include client email if assigned
        if (values.assignedToClient) {
          const clientUser = users?.data?.find(
            (user) => user._id === values.assignedToClient
          );
          if (clientUser?.email) {
            sendToEmails.push(clientUser.email);
          }
        }

        // Prepare email data
        const emailData = {
          subject: "New Task Assigned - A.T. Lukman & Co.",
          send_to: sendToEmails,
          send_from: user?.data?.email,
          reply_to: "noreply@gmail.com",
          template: "taskAssignment",
          url: "dashboard/tasks",
          context: {
            sendersName: user?.data?.firstName,
            sendersPosition: user?.data?.position,
            title: values.title,
            dueDate: formatDate(values.dueDate),
            instruction: values.instruction,
            taskPriority: values.taskPriority,
            category: values.category,
            estimatedEffort: values.estimatedEffort,
          },
        };

        // Post data
        const result = await dataFetcher("tasks", "POST", taskData);
        await fetchData("tasks", "tasks");
        handleSubmission(result);

        // Send email if emailData is provided
        if (!result?.error && emailData && sendToEmails.length > 0) {
          await dispatch(sendAutomatedCustomEmail(emailData));
        }

        form.resetFields();
        setSelectedAssignees([]);
        setReferenceDocuments([]);
        handleCancel();
      } catch (err) {
        console.error("Task creation error:", err);
        toast.error("Failed to create task. Please try again.");
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
      selectedAssignees,
      referenceDocuments,
      handleCancel,
    ]
  );

  // Form submission
  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (errorInfo) {
      console.log("Validation failed:", errorInfo);
      return;
    }
    await handleSubmit(values);
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

  const getRoleBadge = (userId) => {
    const userObj = users?.data?.find((u) => u._id === userId);
    return userObj ? (
      <Tag
        color={userObj.role === "client" ? "green" : "blue"}
        className="text-xs">
        {userObj.role}
      </Tag>
    ) : null;
  };

  return (
    <>
      <ButtonWithIcon
        onClick={showModal}
        icon={<PlusOutlined className="mr-2" />}
        text="Create Task"
      />
      <Modal
        width="90%"
        style={{ top: 20 }}
        title={<Title level={3}>Create New Task</Title>}
        open={open}
        onCancel={handleCancel}
        confirmLoading={confirmLoading}
        className="modal-container"
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loadingData}
            onClick={onSubmit}
            className="blue-btn">
            Create Task
          </Button>,
        ]}>
        <Form
          layout="vertical"
          form={form}
          name="create_task_form"
          className="flex flex-col gap-4"
          initialValues={{
            taskPriority: "medium",
            status: "pending",
            category: "other",
          }}>
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Form.Item
              label="Task Title"
              name="title"
              rules={[
                {
                  required: true,
                  message: "Please provide title for the task!",
                },
              ]}>
              <Input placeholder="Enter task title" />
            </Form.Item>

            <Form.Item
              label="Task Category"
              name="category"
              rules={[
                {
                  required: true,
                  message: "Please select task category!",
                },
              ]}>
              <Select
                placeholder="Select category"
                options={taskCategoryOptions}
                className="w-full"
              />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Description">
            <TextArea
              rows={2}
              placeholder="Enter task description (optional)"
              maxLength={2000}
              showCount
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
            ]}>
            <TextArea
              rows={4}
              placeholder="Enter detailed instructions"
              maxLength={5000}
              showCount
            />
          </Form.Item>

          {/* Assignment Section */}
          <Collapse ghost size="small">
            <Panel header="Assignment & Scheduling" key="assignment">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Form.Item name="caseToWorkOn" label="Related Case">
                  <Select
                    placeholder="Select a case (optional)"
                    options={casesOptions}
                    allowClear
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item
                  name="customCaseReference"
                  label="Custom Case Reference">
                  <Input placeholder="Or enter custom case reference" />
                </Form.Item>

                <Form.Item
                  name="assignedTo"
                  label="Assign to Staff"
                  dependencies={["assignedToClient"]}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (
                          value?.length > 0 ||
                          getFieldValue("assignedToClient")
                        ) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error(
                            'Task must be assigned to "Staff" or "Client".'
                          )
                        );
                      },
                    }),
                  ]}>
                  <Select
                    mode="multiple"
                    placeholder="Select staff members"
                    options={userData?.filter((user) => user.role !== "client")}
                    allowClear
                    className="w-full"
                    onChange={handleAssigneeChange}
                    optionRender={(option) => (
                      <Space>
                        <span>{option.label}</span>
                        {getRoleBadge(option.value)}
                      </Space>
                    )}
                  />
                </Form.Item>

                <Form.Item
                  name="assignedToClient"
                  label="Assign to Client"
                  dependencies={["assignedTo"]}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (value || getFieldValue("assignedTo")?.length > 0) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error(
                            'Task must be assigned to "Staff" or "Client".'
                          )
                        );
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

                <Form.Item name="startDate" label="Start Date">
                  <DatePicker
                    className="w-full"
                    placeholder="Select start date (optional)"
                    showTime
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
                  <DatePicker
                    className="w-full"
                    placeholder="Select due date"
                    showTime
                  />
                </Form.Item>
              </div>

              {/* Selected Assignees Preview */}
              {selectedAssignees.length > 0 && (
                <Alert
                  message={`Assigned to ${selectedAssignees.length} staff member(s)`}
                  description={
                    <Space wrap>
                      {selectedAssignees.map((userId) => {
                        const user = users?.data?.find((u) => u._id === userId);
                        return user ? (
                          <Tag key={userId} icon={<UserAddOutlined />}>
                            {user.firstName} {user.lastName}
                          </Tag>
                        ) : null;
                      })}
                    </Space>
                  }
                  type="info"
                  showIcon
                  className="mb-4"
                />
              )}
            </Panel>
          </Collapse>

          {/* Advanced Options */}
          <Collapse ghost size="small">
            <Panel header="Advanced Options" key="advanced">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <SelectInputs
                  fieldName="taskPriority"
                  label="Task Priority"
                  rules={[
                    {
                      required: true,
                      message: "Specify task priority",
                    },
                  ]}
                  options={taskPriorityOptions}
                />

                <Form.Item name="status" label="Initial Status">
                  <Select
                    placeholder="Select status"
                    options={taskStatusOptions}
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item
                  name="estimatedEffort"
                  label="Estimated Effort (hours)">
                  <InputNumber
                    min={0}
                    max={500}
                    placeholder="e.g., 8"
                    className="w-full"
                    addonAfter="hours"
                  />
                </Form.Item>

                <Form.Item name="tags" label="Tags">
                  <Select
                    mode="tags"
                    placeholder="Add tags (press Enter)"
                    className="w-full"
                    tokenSeparators={[","]}
                  />
                </Form.Item>

                <Form.Item
                  name="isTemplate"
                  label="Save as Template"
                  valuePropName="checked">
                  <Select
                    placeholder="Save as template?"
                    options={[
                      { value: false, label: "No" },
                      { value: true, label: "Yes" },
                    ]}
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item
                  name="templateName"
                  label="Template Name"
                  dependencies={["isTemplate"]}>
                  <Input
                    placeholder="Enter template name"
                    disabled={!form.getFieldValue("isTemplate")}
                  />
                </Form.Item>
              </div>

              {/* Recurrence Settings */}
              <Divider orientation="left">Recurrence (Optional)</Divider>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Form.Item name="recurrencePattern" label="Repeat">
                  <Select
                    placeholder="Select recurrence"
                    options={[
                      { value: "none", label: "No Repeat" },
                      { value: "daily", label: "Daily" },
                      { value: "weekly", label: "Weekly" },
                      { value: "monthly", label: "Monthly" },
                      { value: "yearly", label: "Yearly" },
                    ]}
                    className="w-full"
                  />
                </Form.Item>

                <Form.Item
                  name="recurrenceEndDate"
                  label="End Date"
                  dependencies={["recurrencePattern"]}>
                  <DatePicker
                    className="w-full"
                    placeholder="Select end date"
                    disabled={
                      form.getFieldValue("recurrencePattern") === "none"
                    }
                  />
                </Form.Item>

                <Form.Item
                  name="recurrenceOccurrences"
                  label="Number of Occurrences"
                  dependencies={["recurrencePattern"]}>
                  <InputNumber
                    min={1}
                    placeholder="e.g., 5"
                    className="w-full"
                    disabled={
                      form.getFieldValue("recurrencePattern") === "none"
                    }
                  />
                </Form.Item>
              </div>
            </Panel>
          </Collapse>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={handleCancel}>Cancel</Button>
            <Button
              type="primary"
              loading={loadingData}
              onClick={onSubmit}
              className="blue-btn"
              icon={<PlusOutlined />}>
              Create Task
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default CreateTaskForm;
