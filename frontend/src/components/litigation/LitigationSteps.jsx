import LoadingSpinner from "../LoadingSpinner.jsx";
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Card,
  Button,
  Space,
  Tag,
  List,
  Dropdown,
  Empty,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  fetchLitigationSteps,
  updateLitigationStepStatus,
  reorderLitigationSteps,
  selectLitigationSteps,
  selectStepsLoading,
  selectActionLoading,
} from "../../redux/features/litigation/litigationSlice";

import CreateEditStepModal from "./StepFormModal";
import DeleteStepModal from "./DeleteStepModal";
import ExpandableText from "../common/ExpandableText";

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
  const [editingStep, setEditingStep] = useState(null);

  useEffect(() => {
    if (matterId) {
      dispatch(fetchLitigationSteps(matterId));
    }
  }, [dispatch, matterId]);

  const sortedSteps = useMemo(
    () =>
      [...(steps || [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      ),
    [steps],
  );

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

  const handleStatusChange = (step, status) => {
    if (!matterId || !step?._id || step.status === status) return;

    dispatch(
      updateLitigationStepStatus({
        matterId,
        stepId: step._id,
        status,
      }),
    );
  };

  const handleMoveStep = (step, direction) => {
    if (!matterId || actionLoading) return;

    const currentIndex = sortedSteps.findIndex((s) => s._id === step._id);
    const targetIndex = currentIndex + direction;

    if (
      currentIndex === -1 ||
      targetIndex < 0 ||
      targetIndex >= sortedSteps.length
    ) {
      return;
    }

    const reordered = [...sortedSteps];
    [reordered[currentIndex], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[currentIndex],
    ];

    dispatch(
      reorderLitigationSteps({
        matterId,
        stepIds: reordered.map((s) => s._id),
      }),
    )
      .unwrap()
      .catch(() => {});
  };

  const getStatusMenu = (step) => ({
    selectable: true,
    selectedKeys: [step.status],
    onClick: ({ key }) => handleStatusChange(step, key),
    items: Object.entries(STATUS_CONFIG).map(([key, config]) => ({
      key,
      icon: config.icon,
      label: config.label,
    })),
  });

  return (
    <Card
      className="mx-2 sm:mx-0 mt-4 sm:mt-6"
      title={
        <Space>
          <span className="text-sm sm:text-base">Litigation Steps</span>
          <Tag color="blue">{sortedSteps.length}</Tag>
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddStep}
          size="small"
          disabled={!matterId}>
          Add Step
        </Button>
      }>
      {stepsLoading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <LoadingSpinner fullScreen={false} size="large" />
        </div>
      ) : sortedSteps.length === 0 ? (
        <Empty
          description="No steps added yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button type="primary" onClick={handleAddStep} disabled={!matterId}>
            Add First Step
          </Button>
        </Empty>
      ) : (
        <List
          dataSource={sortedSteps}
          rowKey="_id"
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
            const assigneeName =
              step.assignedTo && typeof step.assignedTo === "object"
                ? `${step.assignedTo.firstName || ""} ${step.assignedTo.lastName || ""}`.trim()
                : "";

            const actions = [
              <Dropdown
                key="status"
                menu={getStatusMenu(step)}
                trigger={["click"]}
                disabled={actionLoading}>
                <Button type="text" size="small">
                  <Tag color={statusConfig.color} icon={statusConfig.icon}>
                    {statusConfig.label}
                  </Tag>
                </Button>
              </Dropdown>,
            ];

            if (sortedSteps.length > 1) {
              actions.push(
                <Tooltip key="move-up" title="Move up">
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowUpOutlined />}
                    disabled={actionLoading || index === 0}
                    onClick={() => handleMoveStep(step, -1)}
                  />
                </Tooltip>,
                <Tooltip key="move-down" title="Move down">
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowDownOutlined />}
                    disabled={actionLoading || index === sortedSteps.length - 1}
                    onClick={() => handleMoveStep(step, 1)}
                  />
                </Tooltip>,
              );
            }

            actions.push(
              <Tooltip key="edit" title="Edit">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  disabled={actionLoading}
                  onClick={() => handleEditStep(step)}
                />
              </Tooltip>,
              <Tooltip key="delete" title="Delete">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={actionLoading}
                  onClick={() => handleDeleteStep(step)}
                />
              </Tooltip>,
            );

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
                actions={actions}>
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
                    <Space wrap>
                      <span
                        style={{
                          textDecoration: isCompleted ? "line-through" : "none",
                        }}
                        className="break-words whitespace-pre-wrap">
                        {step.title}
                      </span>
                      <Tag color={priorityConfig.color}>
                        {priorityConfig.label}
                      </Tag>
                      {isOverdue && <Tag color="error">Overdue</Tag>}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4} style={{ width: "100%" }}>
                      {step.description && (
                        <ExpandableText rows={2}>
                          {step.description}
                        </ExpandableText>
                      )}
                      {assigneeName && (
                        <span style={{ color: "#8c8c8c" }}>
                          Assigned to: {assigneeName}
                        </span>
                      )}
                      {step.dueDate && (
                        <span
                          style={{ color: isOverdue ? "#ff4d4f" : "#8c8c8c" }}>
                          Due: {dayjs(step.dueDate).format("MMM D, YYYY")}
                          {step.completedDate &&
                            ` | Completed: ${dayjs(step.completedDate).format("MMM D, YYYY")}`}
                        </span>
                      )}
                      {step.notes && (
                        <div style={{ color: "#8c8c8c", fontSize: "12px" }}>
                          <span>Notes: </span>
                          <ExpandableText rows={2} className="text-xs">
                            {step.notes}
                          </ExpandableText>
                        </div>
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
    </Card>
  );
};

LitigationSteps.propTypes = {
  matterId: PropTypes.string.isRequired,
};

export default LitigationSteps;
