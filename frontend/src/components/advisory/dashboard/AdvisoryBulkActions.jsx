// components/advisory/dashboard/AdvisoryBulkActions.jsx
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Button, Select, Space, message, Modal, Typography } from "antd";
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

import {
  bulkUpdateAdvisoryMatters,
  deleteAdvisoryDetails,
  fetchAllAdvisoryMatters,
} from "../../../redux/features/advisory/advisorySlice";

const { Option } = Select;
const { Text } = Typography;

const AdvisoryBulkActions = ({
  selectedCount,
  selectedIds,
  onClearSelection,
}) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleBulkStatusChange = async (status) => {
    setLoading(true);
    try {
      await dispatch(
        bulkUpdateAdvisoryMatters({
          matterIds: selectedIds,
          updates: { status },
        }),
      ).unwrap();

      message.success(
        <span>
          <CheckCircleOutlined className="mr-2" />
          {selectedCount} matter(s) updated to "{status}"
        </span>,
      );

      dispatch(fetchAllAdvisoryMatters());
      onClearSelection();
    } catch (error) {
      message.error("Failed to update matters");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = () => {
    Modal.confirm({
      title: "Delete Advisory Matters",
      icon: <ExclamationCircleOutlined className="text-red-500" />,
      content: (
        <div className="space-y-2">
          <Text>
            Are you sure you want to delete {selectedCount} selected matter(s)?
          </Text>
          <Text type="secondary" className="block text-sm">
            This action can be undone by restoring from trash.
          </Text>
        </div>
      ),
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        setLoading(true);
        try {
          // Sequential deletion to avoid overwhelming the server
          for (const id of selectedIds) {
            await dispatch(
              deleteAdvisoryDetails({ matterId: id, deletionType: "soft" }),
            ).unwrap();
          }

          message.success(`${selectedCount} matter(s) moved to trash`);
          dispatch(fetchAllAdvisoryMatters());
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
    <div className="bg-indigo-50/80 border-y border-indigo-200 px-6 py-3 animate-slideDown">
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
            style={{ width: 160 }}
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
              <CloseCircleOutlined className="mr-2 text-slate-500" />
              Set Closed
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

export default AdvisoryBulkActions;
