import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal, Form, message } from "antd";
import { EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import TaskFormBase from "./TaskFormBase";
import {
  updateTaskEnhanced,
  selectTaskActionLoading,
  clearSelectedTask, // Use existing action
  clearTaskError, // Use existing action
} from "../../redux/features/task/taskSlice";

const TaskEditModal = ({ open, onClose, task, onSuccess }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const loading = useSelector(selectTaskActionLoading);
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open && task) {
      form.setFieldsValue({
        title: task.title,
        description: task.description,
        instruction: task.instruction,
        dueDate: task.dueDate ? dayjs(task.dueDate) : null,
        startDate: task.startDate ? dayjs(task.startDate) : null,
        taskPriority: task.taskPriority,
        category: task.category,
        matter: task.matter?._id || task.matter,
        matterType: task.matterType,
        litigationDetailId:
          task.litigationDetailId?._id || task.litigationDetailId,
        customCaseReference: task.customCaseReference,
        estimatedEffort: task.estimatedEffort,
        tags: task.tags || [],
        status: task.status || "pending",
        // Add assignee if it exists in the task structure
        assignee: task.assignees
          ?.map((a) => a.user?._id || a.user)
          .filter(Boolean),
      });
    } else if (!open) {
      form.resetFields();
      // Reset loading states
      setSubmitting(false);
      dispatch(clearSelectedTask()); // Use existing action
      dispatch(clearTaskError()); // Use existing action
    }
  }, [open, task, form, dispatch]);

  const handleSubmit = useCallback(
    async (values) => {
      // Prevent double submission
      if (submitting) return;

      setSubmitting(true);

      try {
        // Validate required fields
        if (!values.title || !values.instruction || !values.dueDate) {
          message.error("Please fill in all required fields");
          setSubmitting(false);
          return;
        }

        // Prepare update data
        const updateData = {
          title: values.title,
          description: values.description || "",
          instruction: values.instruction,
          dueDate: values.dueDate?.toISOString(),
          startDate: values.startDate?.toISOString() || null,
          taskPriority: values.taskPriority || "medium",
          category: values.category || "other",
          matter: values.matter || null,
          matterType: values.matterType,
          litigationDetailId: values.litigationDetailId || null,
          customCaseReference: values.customCaseReference,
          estimatedEffort: values.estimatedEffort || 0,
          tags: values.tags || [],
          status: values.status || "pending",
          // Update assignees if changed
          ...(values.assignee && {
            assignees: values.assignee.map((userId) => ({
              user: userId,
              role: "collaborator",
              assignedBy: task.createdBy,
            })),
          }),
        };

        // Dispatch update action
        await dispatch(
          updateTaskEnhanced({ taskId: task._id, data: updateData }),
        ).unwrap();

        message.success("Task updated successfully");

        // Call success callback and close modal
        onSuccess?.();
        onClose();

        // Reset form after successful update
        form.resetFields();
      } catch (error) {
        console.error("Task update error:", error);
        message.error(error?.message || "Failed to update task");
      } finally {
        setSubmitting(false);
      }
    },
    [dispatch, task, onClose, onSuccess, form, submitting],
  );

  const handleCancel = useCallback(() => {
    form.resetFields();
    setSubmitting(false);
    dispatch(clearSelectedTask()); // Use existing action
    dispatch(clearTaskError()); // Use existing action
    onClose();
  }, [form, dispatch, onClose]);

  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <EditOutlined className="text-blue-500" />
          Edit Task: {task?.title}
        </span>
      }
      open={open}
      onCancel={handleCancel}
      width={800}
      footer={null}
      destroyOnClose
      maskClosable={false}
      className="task-edit-modal">
      <TaskFormBase
        form={form}
        isEdit={true}
        onSubmit={handleSubmit}
        loading={loading || submitting}
        submitText="Save Changes"
      />
    </Modal>
  );
};

export default TaskEditModal;
