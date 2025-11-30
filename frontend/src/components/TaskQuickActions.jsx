// components/TaskQuickActions.js
import React, { useState } from "react";
import {
  Card,
  Button,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
} from "antd";
import {
  TeamOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import moment from "moment";

const { Option } = Select;
const { TextArea } = Input;

const TaskQuickActions = ({ task, onUpdate, canModifyTask }) => {
  const [updateAssignmentModal, setUpdateAssignmentModal] = useState(false);
  const [extendDeadlineModal, setExtendDeadlineModal] = useState(false);
  const [cancelTaskModal, setCancelTaskModal] = useState(false);
  const [assignmentForm] = Form.useForm();
  const [deadlineForm] = Form.useForm();
  const [cancelForm] = Form.useForm();

  const { dataFetcher } = useDataFetch();
  const { userData, allUsers } = useUserSelectOptions();

  // Filter clients from allUsers (users with role 'client')
  const clientOptions = allUsers.filter((user) => {
    const userRole = user.label.toLowerCase();
    return userRole.includes("client") || user.value.includes("client");
  });

  // Get staff options (non-clients)
  const staffOptions = userData;

  const handleUpdateAssignment = async (values) => {
    try {
      // Prepare the update data according to your backend structure
      const updateData = {
        assignedTo: values.assignedTo || [], // Array of staff IDs
        assignedToClient: values.assignedToClient || null, // Single client ID or null
      };

      await dataFetcher(`tasks/${task._id}`, "PATCH", updateData);
      message.success("Task assignment updated successfully");
      setUpdateAssignmentModal(false);
      assignmentForm.resetFields();
      onUpdate?.();
    } catch (error) {
      console.error("Update assignment error:", error);
      message.error(
        error.response?.data?.message || "Failed to update assignment"
      );
    }
  };

  const handleExtendDeadline = async (values) => {
    try {
      await dataFetcher(`tasks/${task._id}`, "PATCH", {
        dueDate: values.newDueDate,
      });
      message.success("Deadline extended successfully");
      setExtendDeadlineModal(false);
      deadlineForm.resetFields();
      onUpdate?.();
    } catch (error) {
      console.error("Extend deadline error:", error);
      message.error(
        error.response?.data?.message || "Failed to extend deadline"
      );
    }
  };

  const handleCancelTask = async (values) => {
    try {
      await dataFetcher(`tasks/${task._id}/cancel`, "PATCH", {
        cancellationReason: values.reason,
      });
      message.success("Task cancelled successfully");
      setCancelTaskModal(false);
      cancelForm.resetFields();
      onUpdate?.();
    } catch (error) {
      console.error("Cancel task error:", error);
      message.error(error.response?.data?.message || "Failed to cancel task");
    }
  };

  const handleMarkComplete = async () => {
    try {
      await dataFetcher(`tasks/${task._id}/response`, "POST", {
        completed: true,
        comment: "Marked as complete by task manager",
      });
      message.success("Task marked as complete");
      onUpdate?.();
    } catch (error) {
      console.error("Mark complete error:", error);
      message.error(
        error.response?.data?.message || "Failed to mark task as complete"
      );
    }
  };

  // Set form initial values when modal opens
  const handleUpdateAssignmentClick = () => {
    setUpdateAssignmentModal(true);
    // Set initial values after a brief delay to ensure modal is open
    setTimeout(() => {
      assignmentForm.setFieldsValue({
        assignedTo: task?.assignedTo?.map((user) => user._id) || [],
        assignedToClient: task?.assignedToClient?._id || undefined,
      });
    }, 100);
  };

  if (!canModifyTask) return null;

  return (
    <>
      <Card
        className="border-0 rounded-2xl shadow-sm bg-gradient-to-br from-white to-purple-50/50"
        bodyStyle={{ padding: "16px" }}>
        <h4 className="mb-4 font-semibold text-gray-900">Quick Actions</h4>
        <Space direction="vertical" className="w-full">
          <Button
            block
            icon={<TeamOutlined />}
            onClick={handleUpdateAssignmentClick}>
            Update Assignment
          </Button>

          <Button
            block
            icon={<ClockCircleOutlined />}
            onClick={() => setExtendDeadlineModal(true)}>
            Extend Deadline
          </Button>

          {task?.status !== "completed" && task?.status !== "cancelled" && (
            <Button
              block
              icon={<EditOutlined />}
              type="primary"
              onClick={handleMarkComplete}>
              Mark as Complete
            </Button>
          )}

          {task?.status !== "completed" && task?.status !== "cancelled" && (
            <Button
              block
              danger
              icon={<ExclamationCircleOutlined />}
              onClick={() => setCancelTaskModal(true)}>
              Cancel Task
            </Button>
          )}
        </Space>
      </Card>

      {/* Update Assignment Modal */}
      <Modal
        title="Update Task Assignment"
        open={updateAssignmentModal}
        onCancel={() => {
          setUpdateAssignmentModal(false);
          assignmentForm.resetFields();
        }}
        footer={null}
        width={600}>
        <Form
          form={assignmentForm}
          layout="vertical"
          onFinish={handleUpdateAssignment}>
          <Form.Item
            name="assignedTo"
            label="Assign to Staff"
            rules={[
              {
                validator: (_, value) => {
                  if (!value || value.length === 0) {
                    if (!assignmentForm.getFieldValue("assignedToClient")) {
                      return Promise.reject(
                        new Error(
                          "Please assign to at least one staff member or a client"
                        )
                      );
                    }
                  }
                  return Promise.resolve();
                },
              },
            ]}>
            <Select
              mode="multiple"
              placeholder="Select staff members"
              optionLabelProp="label"
              allowClear
              options={userData}
            />
          </Form.Item>

          <Form.Item
            name="assignedToClient"
            label="Assign to Client"
            rules={[
              {
                validator: (_, value) => {
                  if (!value) {
                    const assignedTo =
                      assignmentForm.getFieldValue("assignedTo");
                    if (!assignedTo || assignedTo.length === 0) {
                      return Promise.reject(
                        new Error(
                          "Please assign to at least one staff member or a client"
                        )
                      );
                    }
                  }
                  return Promise.resolve();
                },
              },
            ]}>
            <Select
              placeholder="Select a client"
              optionLabelProp="label"
              allowClear>
              {clientOptions.map((client) => (
                <Option
                  key={client.value}
                  value={client.value}
                  label={client.label}>
                  {client.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">
              <strong>Note:</strong>
            </p>
            <ul className="text-xs text-blue-600 list-disc list-inside space-y-1">
              <li>
                Task can be assigned to multiple staff members OR one client
              </li>
              <li>Cannot assign to both staff and client simultaneously</li>
              <li>At least one assignment (staff or client) is required</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              onClick={() => {
                setUpdateAssignmentModal(false);
                assignmentForm.resetFields();
              }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Update Assignment
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Extend Deadline Modal */}
      <Modal
        title="Extend Task Deadline"
        open={extendDeadlineModal}
        onCancel={() => {
          setExtendDeadlineModal(false);
          deadlineForm.resetFields();
        }}
        footer={null}>
        <Form
          form={deadlineForm}
          layout="vertical"
          onFinish={handleExtendDeadline}>
          <Form.Item
            name="newDueDate"
            label="New Due Date"
            rules={[
              {
                required: true,
                message: "Please select a new due date",
              },
              {
                validator: (_, value) => {
                  if (value && value.isBefore(moment())) {
                    return Promise.reject("Due date must be in the future");
                  }
                  return Promise.resolve();
                },
              },
            ]}>
            <DatePicker
              style={{ width: "100%" }}
              showTime
              format="YYYY-MM-DD HH:mm"
              disabledDate={(current) =>
                current && current < moment().startOf("day")
              }
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setExtendDeadlineModal(false);
                deadlineForm.resetFields();
              }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Extend Deadline
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Cancel Task Modal */}
      <Modal
        title="Cancel Task"
        open={cancelTaskModal}
        onCancel={() => {
          setCancelTaskModal(false);
          cancelForm.resetFields();
        }}
        footer={null}>
        <Form form={cancelForm} layout="vertical" onFinish={handleCancelTask}>
          <Form.Item
            name="reason"
            label="Cancellation Reason"
            rules={[
              {
                required: true,
                message: "Please provide a cancellation reason",
              },
              {
                min: 10,
                message: "Reason must be at least 10 characters",
              },
            ]}>
            <TextArea
              rows={4}
              placeholder="Explain why this task is being cancelled..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setCancelTaskModal(false);
                cancelForm.resetFields();
              }}>
              Keep Task
            </Button>
            <Button type="primary" danger htmlType="submit">
              Cancel Task
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default TaskQuickActions;
