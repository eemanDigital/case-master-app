import { useCallback, useEffect, useState } from "react";
import useModal from "../hooks/useModal";
import { Form } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  createTask,
  fetchTasks,
  selectTaskActionLoading,
} from "../redux/features/task/taskSlice";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import { getUsers, selectUsers } from "../redux/features/auth/authSlice";
import { formatDate } from "../utils/formatDate";
import { toast } from "react-toastify";
import { Modal, Typography, Space, Alert, Checkbox, Divider } from "antd";
import {
  PlusOutlined,
  MailOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

import ButtonWithIcon from "../components/ButtonWithIcon";
import TaskFormBase from "../components/tasks/TaskFormBase";

const { Title, Text } = Typography;

const CreateTaskForm = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const allUsers = useSelector(selectUsers);
  const loading = useSelector(selectTaskActionLoading);

  const { open, confirmLoading, showModal, handleCancel } = useModal();
  const [form] = Form.useForm();
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [sendEmailNotification, setSendEmailNotification] = useState(false);
  const [formValues, setFormValues] = useState(null);

  // Fetch users when modal opens
  useEffect(() => {
    if (open) {
      dispatch(getUsers());
    }
  }, [open, dispatch]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      form.resetFields();
      setSelectedAssignees([]);
      setSendEmailNotification(false);
      setFormValues(null);
    }
  }, [open, form]);

  // Track form values changes
  const handleFormValuesChange = useCallback((changedValues, allValues) => {
    setFormValues(allValues);
    // Track assignee changes from the form
    if (changedValues.assignee) {
      setSelectedAssignees(changedValues.assignee || []);
    }
  }, []);

  const resetFormAndState = useCallback(() => {
    form.resetFields();
    setSelectedAssignees([]);
    setSendEmailNotification(false);
    setFormValues(null);
  }, [form]);

  const handleSubmit = useCallback(
    async (values) => {
      try {
        // Validate required fields
        if (!values.title || !values.instruction || !values.dueDate) {
          toast.error("Please fill in all required fields");
          return;
        }

        // Get current user ID safely
        const currentUserId = user?.data?._id || user?._id;
        if (!currentUserId) {
          toast.error("User information not found");
          return;
        }

        // Prepare assignees array
        const assignees = [
          {
            user: currentUserId,
            role: "primary",
            assignedBy: currentUserId,
            isClient: user?.data?.role === "client" || user?.role === "client",
          },
        ];

        // Add selected assignees
        if (selectedAssignees?.length > 0) {
          const assigneeUsers =
            allUsers?.data?.filter((u) => selectedAssignees.includes(u._id)) ||
            [];

          assigneeUsers.forEach((userObj) => {
            if (userObj?._id) {
              assignees.push({
                user: userObj._id,
                role: "collaborator",
                assignedBy: currentUserId,
                isClient: userObj.role === "client",
              });
            }
          });
        }

        // Prepare task data
        const taskData = {
          title: values.title,
          description: values.description || "",
          instruction: values.instruction,
          createdBy: currentUserId,
          matter: values.matter,
          matterType: values.matterType,
          litigationDetailId: values.litigationDetailId,
          customCaseReference: values.customCaseReference,
          startDate: values.startDate ? values.startDate.toDate() : null,
          dueDate: values.dueDate ? values.dueDate.toDate() : new Date(),
          taskPriority: values.taskPriority || "medium",
          status: values.status || "pending",
          category: values.category || "other",
          estimatedEffort: values.estimatedEffort || 0,
          tags: values.tags
            ? values.tags.map((tag) => tag.trim()).filter(Boolean)
            : [],
          assignees: assignees,
        };

        // Create task - removed unused 'result' variable
        await dispatch(createTask(taskData)).unwrap();

        // Refresh tasks list
        await dispatch(fetchTasks());

        // Handle email notifications
        if (sendEmailNotification && selectedAssignees.length > 0) {
          try {
            const assignedUsers =
              allUsers?.data?.filter((u) =>
                selectedAssignees.includes(u._id),
              ) || [];

            const sendToEmails = assignedUsers
              .map((u) => u.email)
              .filter(Boolean);

            if (sendToEmails.length > 0) {
              const senderName =
                `${user?.data?.firstName || user?.firstName || ""} ${user?.data?.lastName || user?.lastName || ""}`.trim();
              const recipientsList = assignedUsers
                .map((u) => `${u.firstName || ""} ${u.lastName || ""}`.trim())
                .filter(Boolean)
                .join(", ");

              await dispatch(
                sendAutomatedCustomEmail({
                  subject: "New Task Assigned - A.T. Lukman & Co.",
                  send_to: sendToEmails,
                  send_from: user?.data?.email || user?.email || "",
                  reply_to: "noreply@atlukman.com",
                  template: "taskAssignment",
                  url: "/dashboard/tasks",
                  context: {
                    sendersName: senderName || "System",
                    sendersPosition:
                      user?.data?.position || user?.position || "",
                    title: values.title,
                    dueDate: formatDate(values.dueDate),
                    instruction: values.instruction,
                    taskPriority: values.taskPriority,
                    category: values.category,
                    estimatedEffort: values.estimatedEffort,
                    recipients: recipientsList,
                  },
                }),
              ).unwrap();

              toast.success("Task created and email notifications sent!");
            }
          } catch (emailError) {
            console.error("Email sending error:", emailError);
            toast.warning("Task created but email notification failed.");
          }
        } else {
          toast.success("Task created successfully!");
        }

        // Reset and close
        resetFormAndState();
        handleCancel();
      } catch (err) {
        console.error("Task creation error:", err);
        const errorMessage =
          err?.message || "Failed to create task. Please try again.";
        toast.error(errorMessage);
      }
    },
    [
      dispatch,
      user,
      allUsers,
      selectedAssignees,
      handleCancel,
      resetFormAndState,
      sendEmailNotification,
    ],
  );

  const onSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      await handleSubmit(values);
    } catch (error) {
      if (error.errorFields) {
        // Form validation error
        toast.error("Please fill in all required fields correctly");
      } else {
        console.error("Submission error:", error);
        toast.error("An error occurred while submitting the form");
      }
    }
  }, [form, handleSubmit]);

  const handleModalCancel = () => {
    resetFormAndState();
    handleCancel();
  };

  const getUserDisplayName = (userId) => {
    const userObj = allUsers?.data?.find((u) => u._id === userId);
    return userObj
      ? `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() ||
          "Unknown User"
      : "Unknown User";
  };

  // Get assignee names for display
  const getAssigneeNames = useCallback(() => {
    if (!selectedAssignees?.length) return "";

    return selectedAssignees
      .map((id) => getUserDisplayName(id))
      .filter((name) => name !== "Unknown User")
      .join(", ");
  }, [selectedAssignees, allUsers]);

  return (
    <>
      <ButtonWithIcon
        onClick={showModal}
        icon={<PlusOutlined className="mr-2" />}
        text="Create Task"
      />

      <Modal
        width="90%"
        style={{
          top: 20,
          maxWidth: "1000px",
        }}
        title={
          <Title level={4} className="m-0 flex items-center gap-2">
            <PlusOutlined className="text-blue-500" />
            Create New Task
          </Title>
        }
        open={open}
        onCancel={handleModalCancel}
        confirmLoading={confirmLoading}
        className="modal-container"
        footer={null}
        destroyOnClose
        maskClosable={false}>
        {/* Assignee Alert */}
        {selectedAssignees?.length > 0 && (
          <Alert
            message={
              <Space direction="vertical" size="small" className="w-full">
                <Space>
                  <InfoCircleOutlined />
                  <Text strong>
                    Assigned to {selectedAssignees.length} user(s):
                  </Text>
                </Space>
                <div className="text-sm">
                  {selectedAssignees.slice(0, 3).map((id) => (
                    <Tag key={id} className="mr-1 mb-1">
                      {getUserDisplayName(id)}
                    </Tag>
                  ))}
                  {selectedAssignees.length > 3 && (
                    <Tag className="mr-1 mb-1">
                      +{selectedAssignees.length - 3} more
                    </Tag>
                  )}
                </div>
              </Space>
            }
            type="info"
            showIcon
            icon={<UserOutlined />}
            className="mb-4"
          />
        )}

        {/* Main Form */}
        <TaskFormBase
          form={form}
          isEdit={false}
          onSubmit={onSubmit}
          loading={loading}
          submitText="Create Task"
          onValuesChange={handleFormValuesChange}
        />

        {/* Email Notification Option */}
        {selectedAssignees?.length > 0 && (
          <>
            <Divider className="my-4" />
            <div className="flex justify-between items-center">
              <Checkbox
                checked={sendEmailNotification}
                onChange={(e) => setSendEmailNotification(e.target.checked)}
                className="text-sm">
                <Space>
                  <MailOutlined
                    className={sendEmailNotification ? "text-blue-500" : ""}
                  />
                  <span>Send email notification to assigned users</span>
                </Space>
              </Checkbox>

              {sendEmailNotification && (
                <Text type="secondary" className="text-xs">
                  Recipients: {getAssigneeNames()}
                </Text>
              )}
            </div>
          </>
        )}
      </Modal>
    </>
  );
};

// Import missing components
import { Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";

export default CreateTaskForm;
