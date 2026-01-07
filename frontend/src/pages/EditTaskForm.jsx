import { useCallback, useEffect, useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { MailOutlined } from "@ant-design/icons";
import {
  taskPriorityOptions,
  taskCategoryOptions,
  taskStatusOptions,
} from "./../data/options";
import {
  Button,
  Input,
  Form,
  Select,
  DatePicker,
  Typography,
  Card,
  Space,
  Tag,
  InputNumber,
  Divider,
  Alert,
  Collapse,
  Checkbox,
  message,
} from "antd";
import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import { SelectInputs } from "../components/DynamicInputs";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useDispatch, useSelector } from "react-redux";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import { getUsers } from "../redux/features/auth/authSlice";
import { formatDate } from "../utils/formatDate";
import { toast } from "react-toastify";
import moment from "moment";
import GoBackButton from "../components/GoBackButton";
import useInitialDataFetcher from "../hooks/useInitialDataFetcher";
import { useParams } from "react-router-dom";

const { TextArea } = Input;
const { Title } = Typography;
const { Panel } = Collapse;

const EditTaskForm = () => {
  const { casesOptions } = useCaseSelectOptions();
  const { data: userData } = useUserSelectOptions();
  const { fetchData } = useDataGetterHook();
  const dispatch = useDispatch();
  const { users, user } = useSelector((state) => state.auth);
  const { id } = useParams();

  const [form] = Form.useForm();
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [referenceDocuments, setReferenceDocuments] = useState([]);

  const {
    dataFetcher,
    loading: loadingData,
    error: dataError,
  } = useDataFetch();

  const { formData, loading } = useInitialDataFetcher("tasks", id);

  // Fetch users
  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  // Handle assignee selection change
  const handleAssigneeChange = (value) => {
    setSelectedAssignees(value || []);
  };

  // Extract existing assignees from formData
  useEffect(() => {
    if (formData?.assignees) {
      // Filter out the primary assignee (creator)
      const collaboratorIds = formData.assignees
        .filter((assignee) => assignee.role === "collaborator")
        .map((assignee) => assignee.user?._id || assignee.user);

      setSelectedAssignees(collaboratorIds);
    }
  }, [formData]);

  // Set initial form values when formData is available
  useEffect(() => {
    if (formData) {
      const initialValues = {
        title: formData.title,
        description: formData.description || "",
        instruction: formData.instruction,
        category: formData.category || "other",
        taskPriority: formData.taskPriority || "medium",
        status: formData.status || "pending",
        // Handle case reference
        ...(formData.caseToWorkOn?.[0]?._id && {
          caseToWorkOn: formData.caseToWorkOn[0]._id,
        }),
        ...(formData.customCaseReference && {
          customCaseReference: formData.customCaseReference,
        }),
        // Dates
        ...(formData.startDate && { startDate: moment(formData.startDate) }),
        ...(formData.dueDate && { dueDate: moment(formData.dueDate) }),
        // Other fields
        estimatedEffort: formData.estimatedEffort || 0,
        tags: formData.tags || [],
        dependencies: formData.dependencies || [],
        isTemplate: formData.isTemplate || false,
        templateName: formData.templateName || "",
        // Recurrence
        ...(formData.recurrence && {
          recurrencePattern: formData.recurrence.pattern || "none",
          ...(formData.recurrence.endAfter && {
            recurrenceEndDate: moment(formData.recurrence.endAfter),
          }),
          recurrenceOccurrences: formData.recurrence.occurrences,
        }),
      };

      form.setFieldsValue(initialValues);
    }
  }, [formData, form]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (values) => {
      try {
        // Prepare task data with updated structure
        const taskData = {
          title: values.title,
          description: values.description || "",
          instruction: values.instruction,
          // Only include caseToWorkOn if a case is selected
          ...(values.caseToWorkOn && { caseToWorkOn: [values.caseToWorkOn] }),
          // Only include customCaseReference if provided
          ...(values.customCaseReference && {
            customCaseReference: values.customCaseReference,
          }),
          startDate: values.startDate ? values.startDate.toDate() : null,
          dueDate: values.dueDate ? values.dueDate.toDate() : new Date(),
          taskPriority: values.taskPriority || "medium",
          status: values.status || "pending",
          category: values.category || "other",
          estimatedEffort: values.estimatedEffort || 0,
          tags:
            values.tags && Array.isArray(values.tags)
              ? values.tags.map((tag) => tag.trim())
              : [],
          dependencies: values.dependencies || [],
          isTemplate: values.isTemplate || false,
          templateName: values.templateName || "",
          referenceDocuments: referenceDocuments || [],
          // Add recurrence if specified
          ...(values.recurrencePattern &&
            values.recurrencePattern !== "none" && {
              recurrence: {
                pattern: values.recurrencePattern,
                ...(values.recurrenceEndDate && {
                  endAfter: values.recurrenceEndDate.toDate(),
                }),
                ...(values.recurrenceOccurrences && {
                  occurrences: values.recurrenceOccurrences,
                }),
              },
            }),
          // Updated assignees structure
          assignees: [
            // Keep existing primary assignee or use current user
            {
              user:
                formData?.assignees?.find((a) => a.role === "primary")?.user
                  ?._id ||
                formData?.assignees?.find((a) => a.role === "primary")?.user ||
                user?.data?._id ||
                user?._id,
              role: "primary",
              assignedBy: user?.data?._id || user?._id,
              isClient: false,
            },
            // Add selected assignees as collaborators
            ...(selectedAssignees || []).map((userId) => {
              const userObj = users?.data?.find((u) => u._id === userId);
              return {
                user: userId,
                role: "collaborator",
                assignedBy: user?.data?._id || user?._id,
                isClient: userObj?.role === "client",
              };
            }),
          ],
        };

        // Update task
        const result = await dataFetcher(`tasks/${id}`, "PATCH", taskData);

        if (result?.error) {
          toast.error(result.error || "Failed to update task");
          return;
        }

        // Refresh tasks list
        await fetchData("tasks", "tasks");

        // Send email notification if checkbox was checked
        if (values.sendEmailNotification && selectedAssignees.length > 0) {
          try {
            // Get all assigned users for email notification (excluding primary)
            const assignedUserIds = selectedAssignees || [];

            const assignedUsers = users?.data?.filter((user) =>
              assignedUserIds.includes(user._id)
            );
            const sendToEmails = assignedUsers?.map((user) => user.email) || [];

            // Prepare email data
            const emailData = {
              subject: "Task Updated - A.T. Lukman & Co.",
              send_to: sendToEmails,
              send_from: user?.data?.email || user?.email,
              reply_to: "noreply@atlukman.com",
              template: "taskUpdate", // Changed to taskUpdate template
              url: "/dashboard/tasks",
              context: {
                sendersName: `${user?.data?.firstName || user?.firstName} ${
                  user?.data?.lastName || user?.lastName
                }`,
                sendersPosition: user?.data?.position || user?.position || "",
                title: values.title,
                dueDate: formatDate(values.dueDate),
                instruction: values.instruction,
                taskPriority: values.taskPriority,
                category: values.category,
                estimatedEffort: values.estimatedEffort,
                recipients: assignedUsers
                  .map((u) => `${u.firstName} ${u.lastName}`)
                  .join(", "),
              },
            };

            // Send email notification
            if (sendToEmails.length > 0) {
              await dispatch(sendAutomatedCustomEmail(emailData));
              toast.success("Task updated and email notifications sent!");
            }
          } catch (emailError) {
            console.error("Email sending error:", emailError);
            toast.warning("Task updated but email notification failed.");
          }
        } else {
          // Show success message without email
          toast.success("Task updated successfully!");
        }
      } catch (err) {
        console.error("Task update error:", err);
        toast.error("Failed to update task. Please try again.");
      }
    },
    [
      dataFetcher,
      fetchData,
      formData,
      user,
      users,
      dispatch,
      selectedAssignees,
      referenceDocuments,
      id,
    ]
  );

  // Form submission
  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (errorInfo) {
      console.log("Validation failed:", errorInfo);
      toast.error("Please fill in all required fields");
      return;
    }
    await handleSubmit(values);
  }, [form, handleSubmit]);

  // DataFetcher error
  useEffect(() => {
    if (dataError) {
      toast.error(dataError || "An error occurred");
    }
  }, [dataError]);

  // Get role badge for user display
  const getRoleBadge = (userId) => {
    const userObj = users?.data?.find((u) => u._id === userId);
    if (!userObj) return null;

    const roleColors = {
      admin: "red",
      "super-admin": "red",
      lawyer: "blue",
      "para-legal": "cyan",
      secretary: "purple",
      client: "green",
    };

    return (
      <Tag
        color={roleColors[userObj.role] || "default"}
        className="text-xs capitalize">
        {userObj.role.replace("-", " ")}
      </Tag>
    );
  };

  // Get user display name
  const getUserDisplayName = (userId) => {
    const userObj = users?.data?.find((u) => u._id === userId);
    console.log("Form Data:", userObj);

    return userObj
      ? `${userObj.firstName} ${userObj.lastName}`
      : "Unknown User";
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <GoBackButton />
      <Card
        width="80%"
        title={<Title level={3}>Edit Task</Title>}
        className="modal-container">
        <Form
          layout="vertical"
          form={form}
          name="edit_task_form"
          className="flex flex-col gap-4">
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
          <Collapse ghost size="small" defaultActiveKey={["assignment"]}>
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
                  name="assignee"
                  label="Assign to Users"
                  rules={[
                    {
                      required: true,
                      message: "Please select at least one assignee!",
                    },
                  ]}>
                  <Select
                    mode="multiple"
                    placeholder="Select users to assign this task to"
                    options={userData}
                    allowClear
                    className="w-full"
                    onChange={handleAssigneeChange}
                    value={selectedAssignees}
                    optionRender={(option) => (
                      <Space>
                        <span>{option.label}</span>
                        <Tag
                          color={
                            option.data.role === "client" ? "green" : "blue"
                          }
                          className="text-xs capitalize">
                          {option.data.role === "client" ? "Client" : "Staff"}
                        </Tag>
                      </Space>
                    )}
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
                <>
                  <Alert
                    message={`Assigned to ${selectedAssignees.length} user(s)`}
                    description={
                      <Space wrap>
                        {selectedAssignees.map((userId) => (
                          <Tag key={userId}>
                            {getUserDisplayName(userId)}
                            {getRoleBadge(userId)}
                          </Tag>
                        ))}
                      </Space>
                    }
                    type="info"
                    showIcon
                    className="mb-4"
                  />

                  {/* Email Notification Checkbox */}
                  <Form.Item
                    name="sendEmailNotification"
                    valuePropName="checked"
                    initialValue={false}>
                    <Checkbox>
                      <Space>
                        <MailOutlined />
                        <span>
                          Send email notification to all assigned users
                        </span>
                      </Space>
                    </Checkbox>
                  </Form.Item>
                </>
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

                <Form.Item name="status" label="Status">
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

          <Form.Item>
            <Button
              type="primary"
              loading={loadingData}
              onClick={onSubmit}
              className="w-full blue-btn"
              size="large">
              Update Task
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
};

export default EditTaskForm;
