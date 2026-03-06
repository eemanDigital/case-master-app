import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Space,
  Tag,
  List,
  Dropdown,
  Menu,
  Empty,
  Spin,
  Tooltip,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  fetchLitigationSteps,
  deleteLitigationStep,
  updateLitigationStepStatus,
  selectLitigationSteps,
  selectStepsLoading,
  selectActionLoading,
} from "../../redux/features/litigation/litigationSlice";

import CreateEditStepModal from "./StepFormModal";
import DeleteStepModal from "./DeleteStepModal";
import UpdateStepStatusModal from "./UpdateStepStatusModal";

const STATUS_CONFIG = {
  pending: {
    color: "default",
    icon: <ClockCircleOutlined />,
    label: "Pending",
  },
  "in-progress": {
    color: "processing",
    icon: <SyncOutlined spin />,
    label: "In Progress",
  },
  completed: {
    color: "success",
    icon: <CheckCircleOutlined />,
    label: "Completed",
  },
  cancelled: {
    color: "error",
    icon: <CloseCircleOutlined />,
    label: "Cancelled",
  },
};

const PRIORITY_CONFIG = {
  low: { color: "green", label: "Low" },
  medium: { color: "gold", label: "Medium" },
  high: { color: "orange", label: "High" },
  urgent: { color: "red", label: "Urgent" },
};

const LitigationSteps = ({ matterId }) => {
  const dispatch = useDispatch();
  const steps = useSelector(selectLitigationSteps);
  const stepsLoading = useSelector(selectStepsLoading);
  const actionLoading = useSelector(selectActionLoading);

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [editingStep, setEditingStep] = useState(null);

  useEffect(() => {
    if (matterId) {
      dispatch(fetchLitigationSteps(matterId));
    }
  }, [dispatch, matterId]);

  const handleAddStep = () => {
    setEditingStep(null);
    setIsCreateModalVisible(true);
  };

  const handleEditStep = (step) => {
    setEditingStep(step);
    setIsEditModalVisible(true);
  };

  const handleDeleteStep = (step) => {
    setEditingStep(step);
    setIsDeleteModalVisible(true);
  };

  const handleStatusClick = (step) => {
    setEditingStep(step);
    setIsStatusModalVisible(true);
  };

  const getStatusMenu = (step) => (
    <Menu
      onClick={({ key }) => {
        setEditingStep(step);
        dispatch(
          updateLitigationStepStatus({
            matterId,
            stepId: step._id,
            status: key,
          }),
        )
          .unwrap()
          .then(() => {
            message.success(`Status updated to ${STATUS_CONFIG[key]?.label}`);
          });
      }}
      selectedKeys={[step.status]}>
      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
        <Menu.Item key={key} icon={config.icon}>
          {config.label}
        </Menu.Item>
      ))}
    </Menu>
  );

  const sortedSteps = [...steps].sort(
    (a, b) => (a.order || 0) - (b.order || 0),
  );

  return (
    <Card
      title={
        <Space>
          <span>Litigation Steps</span>
          <Tag color="blue">{sortedSteps.length}</Tag>
        </Space>
      }
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddStep}>
          Add Step
        </Button>
      }>
      {stepsLoading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
        </div>
      ) : sortedSteps.length === 0 ? (
        <Empty
          description="No steps added yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button type="primary" onClick={handleAddStep}>
            Add First Step
          </Button>
        </Empty>
      ) : (
        <List
          dataSource={sortedSteps}
          renderItem={(step, index) => {
            const statusConfig =
              STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
            const priorityConfig =
              PRIORITY_CONFIG[step.priority] || PRIORITY_CONFIG.medium;
            const isCompleted = step.status === "completed";
            const isOverdue =
              step.dueDate &&
              !isCompleted &&
              dayjs(step.dueDate).isBefore(dayjs(), "day");

            return (
              <List.Item
                style={{
                  opacity: step.status === "cancelled" ? 0.6 : 1,
                  background: isOverdue ? "#fff2f0" : undefined,
                  borderRadius: "8px",
                  marginBottom: "8px",
                  padding: "16px",
                  border: "1px solid #f0f0f0",
                }}
                actions={[
                  <Dropdown overlay={getStatusMenu(step)} trigger={["click"]}>
                    <Button type="text" size="small">
                      <Tag color={statusConfig.color} icon={statusConfig.icon}>
                        {statusConfig.label}
                      </Tag>
                    </Button>
                  </Dropdown>,
                  <Tooltip title="Edit">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEditStep(step)}
                    />
                  </Tooltip>,
                  <Tooltip title="Delete">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteStep(step)}
                    />
                  </Tooltip>,
                ]}>
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: isCompleted ? "#52c41a" : "#1890ff",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                      }}>
                      {index + 1}
                    </div>
                  }
                  title={
                    <Space>
                      <span
                        style={{
                          textDecoration: isCompleted ? "line-through" : "none",
                        }}>
                        {step.title}
                      </span>
                      <Tag color={priorityConfig.color}>
                        {priorityConfig.label}
                      </Tag>
                      {isOverdue && <Tag color="error">Overdue</Tag>}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      {step.description && <span>{step.description}</span>}
                      {step.dueDate && (
                        <span
                          style={{ color: isOverdue ? "#ff4d4f" : "#8c8c8c" }}>
                          Due: {dayjs(step.dueDate).format("MMM D, YYYY")}
                          {step.completedDate &&
                            ` | Completed: ${dayjs(step.completedDate).format("MMM D, YYYY")}`}
                        </span>
                      )}
                      {step.notes && (
                        <span style={{ color: "#8c8c8c", fontSize: "12px" }}>
                          Notes: {step.notes}
                        </span>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}

      <CreateEditStepModal
        visible={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onSuccess={() => setIsCreateModalVisible(false)}
        matterId={matterId}
        editingStep={null}
      />

      <CreateEditStepModal
        visible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onSuccess={() => setIsEditModalVisible(false)}
        matterId={matterId}
        editingStep={editingStep}
      />

      <DeleteStepModal
        visible={isDeleteModalVisible}
        onCancel={() => setIsDeleteModalVisible(false)}
        onSuccess={() => setIsDeleteModalVisible(false)}
        matterId={matterId}
        step={editingStep}
      />

      <UpdateStepStatusModal
        visible={isStatusModalVisible}
        onCancel={() => setIsStatusModalVisible(false)}
        onSuccess={() => setIsStatusModalVisible(false)}
        matterId={matterId}
        step={editingStep}
      />
    </Card>
  );
};

export default LitigationSteps;
