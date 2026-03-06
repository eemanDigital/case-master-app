import { Modal, message } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteLitigationStep,
  selectActionLoading,
} from "../../redux/features/litigation/litigationSlice";

const DeleteStepModal = ({ visible, onCancel, onSuccess, matterId, step }) => {
  const dispatch = useDispatch();
  const actionLoading = useSelector(selectActionLoading);

  const handleDelete = async () => {
    try {
      await dispatch(
        deleteLitigationStep({
          matterId,
          stepId: step?._id,
        })
      ).unwrap();
      message.success("Step deleted successfully");
      onSuccess?.();
    } catch (error) {
      message.error(error?.message || "Failed to delete step");
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
          Delete Step
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleDelete}
      okText="Delete"
      okType="danger"
      confirmLoading={actionLoading}
      destroyOnClose
    >
      <p>
        Are you sure you want to delete the step{" "}
        <strong>"{step?.title}"</strong>?
      </p>
      <p style={{ color: "#8c8c8c", fontSize: "12px" }}>
        This action cannot be undone.
      </p>
    </Modal>
  );
};

export default DeleteStepModal;
