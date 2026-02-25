import React, { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Modal,
  Form,
  Select,
  List,
  Tag,
  Space,
  Popconfirm,
  message,
  Empty,
  Typography,
  Badge,
} from "antd";
import {
  LinkOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";

import {
  fetchDependencies,
  addDependency,
  removeDependency,
  fetchAvailableDependencies,
  selectDependencies,
  selectAvailableDependencies,
  selectTaskActionLoading,
} from "../redux/features/task/taskSlice";
import { formatDate } from "../../utils/formatDate";

const { Text } = Typography;

const getStatusTag = (status) => {
  const config = {
    pending: { color: "default", icon: <ClockCircleOutlined /> },
    "in-progress": { color: "processing", icon: <SyncOutlined spin /> },
    "under-review": { color: "warning", icon: <ClockCircleOutlined /> },
    completed: { color: "success", icon: <CheckCircleOutlined /> },
    overdue: { color: "error", icon: <ClockCircleOutlined /> },
    cancelled: { color: "default", icon: <DeleteOutlined /> },
  };
  const c = config[status] || config.pending;
  return <Tag color={c.color} icon={c.icon}>{status?.toUpperCase()}</Tag>;
};

const getPriorityTag = (priority) => {
  const colors = {
    urgent: "red",
    high: "orange",
    medium: "blue",
    low: "green",
  };
  return <Tag color={colors[priority] || "default"}>{priority?.toUpperCase()}</Tag>;
};

const DependencyManager = ({ taskId, onSuccess }) => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dependencies = useSelector(selectDependencies);
  const availableDependencies = useSelector(selectAvailableDependencies);
  const actionLoading = useSelector(selectTaskActionLoading);

  const fetchDependencyData = useCallback(() => {
    if (taskId) {
      dispatch(fetchDependencies(taskId));
      dispatch(fetchAvailableDependencies(taskId));
    }
  }, [dispatch, taskId]);

  useEffect(() => {
    fetchDependencyData();
  }, [fetchDependencyData]);

  const handleAddDependency = useCallback(
    async (values) => {
      try {
        setLoading(true);
        await dispatch(
          addDependency({
            taskId,
            dependentTaskId: values.dependentTask,
          })
        ).unwrap();

        message.success("Dependency added successfully");
        form.resetFields();
        setOpen(false);
        fetchDependencyData();
        onSuccess?.();
      } catch (error) {
        message.error(error?.message || "Failed to add dependency");
      } finally {
        setLoading(false);
      }
    },
    [dispatch, taskId, fetchDependencyData, onSuccess]
  );

  const handleRemoveDependency = useCallback(
    async (dependencyId) => {
      try {
        await dispatch(
          removeDependency({ taskId, dependencyId })
        ).unwrap();

        message.success("Dependency removed successfully");
        fetchDependencyData();
      } catch (error) {
        message.error(error?.message || "Failed to remove dependency");
      }
    },
    [dispatch, taskId, fetchDependencyData]
  );

  const [form] = Form.useForm();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Space>
          <LinkOutlined />
          <Text strong>Task Dependencies</Text>
          {dependencies.length > 0 && (
            <Badge count={dependencies.length} style={{ backgroundColor: "#1890ff" }} />
          )}
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="small"
          onClick={() => setOpen(true)}>
          Link Task
        </Button>
      </div>

      {dependencies.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No dependencies linked"
        />
      ) : (
        <List
          size="small"
          dataSource={dependencies}
          renderItem={(dep) => (
            <List.Item
              className="bg-gray-50 rounded px-3 py-2"
              actions={[
                <Popconfirm
                  key="remove"
                  title="Remove this dependency?"
                  onConfirm={() => handleRemoveDependency(dep._id)}>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                  />
                </Popconfirm>,
              ]}>
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{dep.title}</Text>
                    {getStatusTag(dep.status)}
                    {getPriorityTag(dep.taskPriority)}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary" className="text-xs">
                      Due: {formatDate(dep.dueDate)}
                    </Text>
                    {dep.matter && (
                      <Text type="secondary" className="text-xs">
                        Matter: {dep.matter?.matterNumber || dep.matter?.title}
                      </Text>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}

      <Modal
        title="Link Task Dependency"
        open={open}
        onCancel={() => {
          form.resetFields();
          setOpen(false);
        }}
        footer={null}
        destroyOnClose
        width={500}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddDependency}>
          <Form.Item
            name="dependentTask"
            label="Select Task to Link"
            rules={[
              { required: true, message: "Please select a task" },
            ]}>
            <Select
              showSearch
              placeholder="Search tasks..."
              loading={actionLoading}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              className="w-full">
              {availableDependencies.map((task) => (
                <Select.Option
                  key={task._id}
                  value={task._id}
                  label={task.title}>
                  <Space direction="vertical" size={0} className="w-full">
                    <Text strong>{task.title}</Text>
                    <Space>
                      {getStatusTag(task.status)}
                      {getPriorityTag(task.taskPriority)}
                    </Space>
                    <Text type="secondary" className="text-xs">
                      Due: {formatDate(task.dueDate)}
                      {task.matter && ` | Matter: ${task.matter?.matterNumber}`}
                    </Text>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Alert
            type="info"
            message="Dependency Info"
            description="The linked task must be completed before this task can be marked as complete. This helps maintain proper task workflow."
            className="mb-4"
          />

          <div className="flex justify-end gap-3">
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={availableDependencies.length === 0}>
              Link Task
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default DependencyManager;
