// components/litigation/dashboard/LitigationBulkActions.jsx
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Button, Select, Space, message, Modal, Typography } from "antd";
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";

import { bulkUpdateLitigationMatters } from "../../../redux/features/litigation/litigationService";
import { deleteLitigationDetails } from "../../../redux/features/litigation/litigationSlice";

const { Option } = Select;
const { Text } = Typography;

const LitigationBulkActions = ({
  selectedCount,
  selectedIds,
  onClearSelection,
  onSuccess,
}) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleBulkStatusChange = async (status) => {
    setLoading(true);
    try {
      await bulkUpdateLitigationMatters(selectedIds, { status });
      message.success(
        <span>
          <CheckCircleOutlined className="mr-2" />
          {selectedCount} {selectedCount === 1 ? "matter" : "matters"} updated
          to "{status}"
        </span>,
      );
      onSuccess?.();
      onClearSelection();
    } catch (error) {
      message.error("Failed to update matters");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = () => {
    Modal.confirm({
      title: "Delete Litigation Matters",
      icon: <ExclamationCircleOutlined className="text-red-500" />,
      content: (
        <div className="space-y-2">
          <Text>
            Are you sure you want to delete {selectedCount} selected{" "}
            {selectedCount === 1 ? "matter" : "matters"}?
          </Text>
          <Text type="secondary" className="block text-sm">
            This will soft delete the litigation details and move to trash.
          </Text>
        </div>
      ),
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        setLoading(true);
        try {
          for (const id of selectedIds) {
            await dispatch(deleteLitigationDetails(id)).unwrap();
          }
          message.success(`${selectedCount} matter(s) moved to trash`);
          onSuccess?.();
          onClearSelection();
        } catch (error) {
          message.error("Failed to delete some matters");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div className="bg-indigo-50/90 border-y border-indigo-200 px-6 py-4 animate-slideDown">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
            {selectedCount}
          </span>
          <span className="text-sm font-medium text-indigo-900">
            {selectedCount} {selectedCount === 1 ? "matter" : "matters"}{" "}
            selected
          </span>
        </div>

        <Space size={12}>
          <Select
            placeholder="Update status"
            style={{ width: 180 }}
            onChange={handleBulkStatusChange}
            disabled={loading}
            className="[&_.ant-select-selector]:rounded-lg">
            <Option value="active">
              <SyncOutlined className="mr-2 text-blue-500" />
              Set Active
            </Option>
            <Option value="pending">
              <ClockCircleOutlined className="mr-2 text-amber-500" />
              Set Pending
            </Option>
            <Option value="completed">
              <CheckCircleOutlined className="mr-2 text-emerald-500" />
              Set Completed
            </Option>
            <Option value="closed">
              <CloseCircleOutlined className="mr-2 text-gray-500" />
              Set Closed
            </Option>
            <Option value="settled">
              <CheckCircleOutlined className="mr-2 text-purple-500" />
              Set Settled
            </Option>
          </Select>

          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleBulkDelete}
            loading={loading}
            className="hover:bg-red-50">
            Delete
          </Button>

          <Button onClick={onClearSelection} disabled={loading}>
            Cancel
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default LitigationBulkActions;
