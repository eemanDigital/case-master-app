import { useCallback, useEffect, useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import {
  PlusOutlined,
  UserAddOutlined,
  MailOutlined,
  FileTextOutlined,
  BankOutlined,
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
  Alert,
  Collapse,
  Card,
  Row,
  Col,
  Checkbox,
} from "antd";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import useModal from "../hooks/useModal";
import { SelectInputs } from "../components/DynamicInputs";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useDispatch, useSelector } from "react-redux";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import { getUsers } from "../redux/features/auth/authSlice";
import { formatDate } from "../utils/formatDate";
import { toast } from "react-toastify";
import ButtonWithIcon from "../components/ButtonWithIcon";
import dayjs from "dayjs";
import useMattersSelectOptions from "../hooks/useMattersSelectOptions";

const { TextArea } = Input;
const { Title } = Typography;
const { Panel } = Collapse;

const MATTER_TYPE_OPTIONS = [
  { value: "litigation", label: "Litigation", icon: "⚖️" },
  { value: "corporate", label: "Corporate", icon: "🏢" },
  { value: "property", label: "Property", icon: "🏠" },
  { value: "advisory", label: "Advisory", icon: "💼" },
  { value: "retainer", label: "Retainer", icon: "📋" },
  { value: "general", label: "General", icon: "📁" },
];

const CreateTaskForm = () => {
  const { data: userData } = useUserSelectOptions({ type: "all" });
  const { fetchData } = useDataGetterHook();
  const dispatch = useDispatch();
  const { users, user } = useSelector((state) => state.auth);

  const { open, confirmLoading, showModal, handleCancel } = useModal();
  const [form] = Form.useForm();
  const [selectedAssignees, setSelectedAssignees] = useState([]);

  const {
    dataFetcher,
    loading: loadingData,
    error: dataError,
  } = useDataFetch();

  // ── Matter selection — powered by Redux via useMattersSelectOptions ─────────
  const {
    matters, // full mapped list from Redux state.matter.matters
    loading: matterSearchLoading,
    fetchMatters, // call with searchText to search; "" to reset
    getLitigationDetails,
  } = useMattersSelectOptions({
    status: "active",
    limit: 50,
    autoFetch: false, // don't auto-fetch on mount — only fetch when modal opens
  });

  // ── Litigation detail options (populated after a litigation matter is picked) ─
  const [litigationLoading, setLitigationLoading] = useState(false);
  const [litigationOptions, setLitigationOptions] = useState([]);

  // ── Tracks which matter type is currently selected ─────────────────────────
  const [selectedMatterType, setSelectedMatterType] = useState(null);

  // ── Fetch users on mount ───────────────────────────────────────────────────
  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  // ── When modal opens, fetch matters. When it closes, reset form. ───────────
  useEffect(() => {
    if (open) {
      // Kick off the initial list load when the modal first opens.
      fetchMatters("");
    } else {
      form.resetFields();
      setSelectedAssignees([]);
      setSelectedMatterType(null);
      setLitigationOptions([]);
    }
  }, [open]); // intentionally omit fetchMatters from deps

  // ── Search handler — delegates to Redux thunk via the hook ─────────────────
  const handleMatterSearch = useCallback(
    (searchText) => {
      fetchMatters(searchText || "");
    },
    [fetchMatters],
  );

  // ── When a matter is selected, auto-fill type and load litigation details ───
  const handleMatterChange = useCallback(
    async (matterId) => {
      if (!matterId) {
        // Cleared
        setSelectedMatterType(null);
        form.setFieldsValue({
          matterType: undefined,
          litigationDetailId: undefined,
        });
        setLitigationOptions([]);
        return;
      }

      const selectedMatter = matters.find((m) => m._id === matterId);
      if (!selectedMatter) return;

      setSelectedMatterType(selectedMatter.matterType);
      form.setFieldsValue({ matterType: selectedMatter.matterType });

      if (selectedMatter.matterType === "litigation") {
        setLitigationLoading(true);
        const details = await getLitigationDetails(matterId);
        if (details) {
          setLitigationOptions([
            {
              _id: details._id,
              value: details._id,
              label: `${details.suitNo || "N/A"} - ${details.courtName || "Unknown Court"}`,
              subtitle: `Next Hearing: ${
                details.nextHearingDate
                  ? dayjs(details.nextHearingDate).format("MMM D, YYYY")
                  : "Not set"
              }`,
            },
          ]);
        } else {
          setLitigationOptions([]);
        }
        setLitigationLoading(false);
      } else {
        form.setFieldsValue({ litigationDetailId: undefined });
        setLitigationOptions([]);
      }
    },
    [matters, form, getLitigationDetails],
  );

  // ── Matter type manually changed (overrides the auto-fill) ────────────────
  const handleMatterTypeChange = useCallback(
    (value) => {
      setSelectedMatterType(value);
      if (value !== "litigation") {
        form.setFieldsValue({ litigationDetailId: undefined });
        setLitigationOptions([]);
      }
    },
    [form],
  );

  const handleAssigneeChange = (value) => setSelectedAssignees(value || []);

  const resetFormAndState = useCallback(() => {
    form.resetFields();
    setSelectedAssignees([]);
    setSelectedMatterType(null);
    setLitigationOptions([]);
  }, [form]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (values) => {
      try {
        const taskData = {
          title: values.title,
          description: values.description || "",
          instruction: values.instruction,
          createdBy: user?.data?._id || user?._id,
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
          tags:
            values.tags && Array.isArray(values.tags)
              ? values.tags.map((tag) => tag.trim())
              : [],
          assignees: [
            {
              user: user?.data?._id || user?._id,
              role: "primary",
              assignedBy: user?.data?._id || user?._id,
              isClient: false,
            },
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

        const result = await dataFetcher("tasks", "POST", taskData);

        if (result?.error) {
          toast.error(result.error || "Failed to create task");
          return;
        }

        await fetchData("tasks", "tasks");

        // ── Optional email notification ───────────────────────────────────────
        if (values.sendEmailNotification && selectedAssignees.length > 0) {
          try {
            const assignedUserIds = [
              user?.data?._id || user?._id,
              ...(selectedAssignees || []),
            ];
            const assignedUsers = users?.data?.filter((u) =>
              assignedUserIds.includes(u._id),
            );
            const sendToEmails = assignedUsers?.map((u) => u.email) || [];

            if (sendToEmails.length > 0) {
              await dispatch(
                sendAutomatedCustomEmail({
                  subject: "New Task Assigned - A.T. Lukman & Co.",
                  send_to: sendToEmails,
                  send_from: user?.data?.email || user?.email,
                  reply_to: "noreply@atlukman.com",
                  template: "taskAssignment",
                  url: "/dashboard/tasks",
                  context: {
                    sendersName: `${user?.data?.firstName || user?.firstName} ${user?.data?.lastName || user?.lastName}`,
                    sendersPosition:
                      user?.data?.position || user?.position || "",
                    title: values.title,
                    dueDate: formatDate(values.dueDate),
                    instruction: values.instruction,
                    taskPriority: values.taskPriority,
                    category: values.category,
                    estimatedEffort: values.estimatedEffort,
                    recipients: assignedUsers
                      ?.filter((u) => u._id !== (user?.data?._id || user?._id))
                      .map((u) => `${u.firstName} ${u.lastName}`)
                      .join(", "),
                  },
                }),
              );
              toast.success("Task created and email notifications sent!");
            }
          } catch (emailError) {
            console.error("Email sending error:", emailError);
            toast.warning("Task created but email notification failed.");
          }
        } else {
          toast.success("Task created successfully!");
        }

        resetFormAndState();
        handleCancel();
      } catch (err) {
        console.error("Task creation error:", err);
        toast.error("Failed to create task. Please try again.");
      }
    },
    [
      dataFetcher,
      fetchData,
      user,
      users,
      dispatch,
      selectedAssignees,
      handleCancel,
      resetFormAndState,
    ],
  );

  const onSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      await handleSubmit(values);
    } catch {
      toast.error("Please fill in all required fields");
    }
  }, [form, handleSubmit]);

  useEffect(() => {
    if (dataError) toast.error(dataError || "An error occurred");
  }, [dataError]);

  // ── Helpers for assignee display ───────────────────────────────────────────
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

  const getUserDisplayName = (userId) => {
    const userObj = users?.data?.find((u) => u._id === userId);
    return userObj
      ? `${userObj.firstName} ${userObj.lastName}`
      : "Unknown User";
  };

  const handleModalCancel = () => {
    resetFormAndState();
    handleCancel();
  };

  // ============================================================
  // RENDER
  // ============================================================
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
        onCancel={handleModalCancel}
        confirmLoading={confirmLoading}
        className="modal-container"
        footer={[
          <Button key="cancel" onClick={handleModalCancel}>
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
          {/* ── Basic Information ─────────────────────────────────────── */}
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
                { required: true, message: "Please select task category!" },
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

          {/* ── Matter Linking ─────────────────────────────────────────── */}
          <Card
            size="small"
            className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <FileTextOutlined className="text-blue-500" />
              <span className="font-semibold text-sm">Link to Matter</span>
            </div>

            <Row gutter={[12, 12]}>
              {/* Matter search — driven by Redux via useMattersSelectOptions */}
              <Col xs={24} sm={12}>
                <Form.Item
                  name="matter"
                  label="Search Matter"
                  className="!mb-0">
                  <Select
                    showSearch
                    placeholder="Search by title or number..."
                    loading={matterSearchLoading}
                    onSearch={handleMatterSearch}
                    onChange={handleMatterChange}
                    filterOption={false} // server-side filtering via Redux thunk
                    allowClear
                    className="w-full">
                    {matters.map((matter) => (
                      <Select.Option
                        key={matter._id}
                        value={matter._id}
                        label={matter.label}>
                        <div className="py-1">
                          <div className="font-medium">{matter.label}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <Tag className="!text-xs !py-0">
                              {matter.matterType}
                            </Tag>
                            <span>{matter.subtitle}</span>
                          </div>
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {/* Matter type — auto-filled when a matter is selected */}
              <Col xs={24} sm={12}>
                <Form.Item
                  name="matterType"
                  label="Matter Type"
                  className="!mb-0">
                  <Select
                    placeholder="Select matter type"
                    allowClear
                    onChange={handleMatterTypeChange}>
                    {MATTER_TYPE_OPTIONS.map((opt) => (
                      <Select.Option key={opt.value} value={opt.value}>
                        <Space>
                          <span>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </Space>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {/* Litigation detail — visible only for litigation matters */}
              {selectedMatterType === "litigation" && (
                <Col xs={24}>
                  <Form.Item
                    name="litigationDetailId"
                    label="Litigation Details">
                    <Select
                      placeholder="Select litigation case details..."
                      loading={litigationLoading}
                      allowClear>
                      {litigationOptions.map((detail) => (
                        <Select.Option
                          key={detail._id}
                          value={detail._id}
                          label={detail.label}>
                          <div className="py-1">
                            <div className="font-medium flex items-center gap-2">
                              <BankOutlined className="text-purple-500" />
                              {detail.label}
                            </div>
                            <div className="text-xs text-gray-500">
                              {detail.subtitle}
                            </div>
                          </div>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              )}

              <Col xs={24}>
                <Form.Item
                  name="customCaseReference"
                  label="Or Custom Case Reference">
                  <Input placeholder="Enter external case reference (optional)" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* ── Assignment & Scheduling ───────────────────────────────── */}
          <Collapse ghost size="small">
            <Panel header="Assignment & Scheduling" key="assignment">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

              {selectedAssignees.length > 0 && (
                <>
                  <Alert
                    message={`Assigned to ${selectedAssignees.length} user(s)`}
                    description={
                      <Space wrap>
                        {selectedAssignees.map((userId) => (
                          <Tag key={userId} icon={<UserAddOutlined />}>
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

          {/* ── Advanced Options ──────────────────────────────────────── */}
          <Collapse ghost size="small">
            <Panel header="Advanced Options" key="advanced">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <SelectInputs
                  fieldName="taskPriority"
                  label="Task Priority"
                  rules={[{ required: true, message: "Specify task priority" }]}
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
              </div>
            </Panel>
          </Collapse>
        </Form>
      </Modal>
    </>
  );
};

export default CreateTaskForm;
