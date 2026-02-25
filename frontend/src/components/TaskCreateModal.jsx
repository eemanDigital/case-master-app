import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal, message, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import TaskFormBase from "./tasks/TaskFormBase";
import {
  createTask,
  selectTaskActionLoading,
} from "../redux/features/task/taskSlice";

const TaskCreateModal = ({ open, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [form] = Modal.useForm();
  const loading = useSelector(selectTaskActionLoading);
  const [selectedAssignees, setSelectedAssignees] = useState([]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setSelectedAssignees([]);
    }
  }, [open, form]);

  const handleSubmit = async (values) => {
    try {
      const taskData = {
        title: values.title,
        description: values.description,
        instruction: values.instruction,
        dueDate: values.dueDate?.toISOString(),
        startDate: values.startDate?.toISOString(),
        taskPriority: values.taskPriority || values.priority || "medium",
        category: values.category,
        matter: values.matter,
        matterType: values.matterType,
        litigationDetailId: values.litigationDetailId,
        customCaseReference: values.customCaseReference,
        assignees: selectedAssignees.map((userId) => ({
          user: userId,
          role: "collaborator",
        })),
        tags: values.tags || [],
        estimatedEffort: values.estimatedEffort,
        status: values.status || "pending",
      };

      await dispatch(createTask(taskData)).unwrap();
      message.success("Task created successfully");
      onClose();
      onSuccess?.();
    } catch (error) {
      message.error(error?.message || "Failed to create task");
    }
  };

  return (
    <Modal
      title={
        <Space>
          <PlusOutlined className="text-blue-500" />
          <span>Create New Task</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={800}
      footer={null}
      destroyOnClose
      className="task-create-modal">
      <TaskFormBase
        form={form}
        isEdit={false}
        onSubmit={handleSubmit}
        loading={loading}
        submitText="Create Task"
      />
    </Modal>
  );
};

export default TaskCreateModal;
