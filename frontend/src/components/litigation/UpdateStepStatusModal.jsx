import { useState } from "react";
import { Modal, Select, Space, message } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  updateLitigationStepStatus,
  selectActionLoading,
} from "../../redux/features/litigation/litigationSlice";

const STATUS_CONFIG = {
  pending: {
    color: "default",
    icon: <ClockCircleOutlined />,
    label: "Pending",
  },
  "in-progress": {
    color: "processing",
    icon: <SyncOutlined />,
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

const UpdateStepStatusModal = ({ visible, onCancel, onSuccess, matterId, step }) => {
  const dispatch = useDispatch();
  const actionLoading = useSelector(selectActionLoading);
  const [selectedStatus, setSelectedStatus] = useState(step?.status || "pending");

  const handleUpdate = async () => {
    try {
      await dispatch(
        updateLitigationStepStatus({
          matterId,
          stepId: step?._id,
          status: selectedStatus,
        })
      ).unwrap();
      message.success(`Step marked as ${STATUS_CONFIG[selectedStatus]?.label || selectedStatus}`);
      onSuccess?.();
    } catch (error) {
      message.error(error?.message || "Failed to update status");
    }
  };

  return (
    <Modal
      title="Update Step Status"
      open={visible}
      onCancel={onCancel}
      onOk={handleUpdate}
      okText="Update Status"
      confirmLoading={actionLoading}
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <p>
          <strong>Step:</strong> {step?.title}
        </p>
        <div>
          <label style={{ display: "block", marginBottom: 8 }}>
            Select New Status:
          </label>
          <Select
            value={selectedStatus}
            onChange={setSelectedStatus}
            style={{ width: "100%" }}
          >
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <Select.Option key={key} value={key}>
                <Space>
                  <span style={{ color: config.color }}>{config.icon}</span>
                  {config.label}
                </Space>
              </Select.Option>
            ))}
          </Select>
        </div>
      </Space>
    </Modal>
  );
};

export default UpdateStepStatusModal;
