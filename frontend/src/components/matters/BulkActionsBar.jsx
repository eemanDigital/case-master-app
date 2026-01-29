import React, { useState } from "react";
import {
  Space,
  Button,
  Dropdown,
  Modal,
  Typography,
  Badge,
  Select,
  message,
  Tooltip,
  Alert,
} from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  TeamOutlined,
  EditOutlined,
  TagsOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  ExportOutlined,
  MailOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import UserSelect from "../UserSelect";

const { Text } = Typography;

const BulkActionsBar = ({
  selectedCount,
  selectedItems,
  onBulkDelete,
  onBulkAssign,
  onBulkChangeStatus,
  onClearSelection,
  onBulkExport,
  onBulkChangePriority,
  loading = false,
  className = "",
}) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState(null);

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
    { value: "on-hold", label: "On Hold" },
    { value: "completed", label: "Completed" },
    { value: "closed", label: "Closed" },
    { value: "archived", label: "Archived" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  const handleExport = (format) => {
    message.info(
      `Exporting ${selectedCount} matters as ${format.toUpperCase()}...`,
    );
    onBulkExport?.(selectedItems, format);
  };

  const exportMenuItems = [
    {
      key: "pdf",
      label: "Export as PDF",
      icon: <FilePdfOutlined />,
      onClick: () => handleExport("pdf"),
    },
    {
      key: "excel",
      label: "Export as Excel",
      icon: <FileExcelOutlined />,
      onClick: () => handleExport("excel"),
    },
    {
      key: "csv",
      label: "Export as CSV",
      icon: <ExportOutlined />,
      onClick: () => handleExport("csv"),
    },
  ];

  const handleAssignOfficer = () => {
    if (!selectedOfficer) {
      message.warning("Please select an account officer");
      return;
    }

    Modal.confirm({
      title: `Assign Officer to ${selectedCount} Matters?`,
      content: `Officer will be assigned to ${selectedCount} selected matters.`,
      okText: "Assign",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await onBulkAssign(selectedItems, selectedOfficer);
          setSelectedOfficer(null);
          setShowAssignModal(false);
        } catch (error) {
          message.error("Failed to assign officer");
        }
      },
    });
  };

  const handleChangeStatus = () => {
    if (!selectedStatus) {
      message.warning("Please select a status");
      return;
    }

    Modal.confirm({
      title: `Change Status for ${selectedCount} Matters?`,
      content: `Status will be changed to ${selectedStatus.toUpperCase()} for ${selectedCount} matters.`,
      okText: "Change",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await onBulkChangeStatus(selectedItems, selectedStatus);
          setSelectedStatus(null);
          setShowStatusModal(false);
        } catch (error) {
          message.error("Failed to change status");
        }
      },
    });
  };

  const handleChangePriority = () => {
    if (!selectedPriority) {
      message.warning("Please select a priority");
      return;
    }

    Modal.confirm({
      title: `Change Priority for ${selectedCount} Matters?`,
      content: `Priority will be changed to ${selectedPriority.toUpperCase()} for ${selectedCount} matters.`,
      okText: "Change",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await onBulkChangePriority(selectedItems, selectedPriority);
          setSelectedPriority(null);
          setShowPriorityModal(false);
        } catch (error) {
          message.error("Failed to change priority");
        }
      },
    });
  };

  const handleBulkDelete = () => {
    Modal.confirm({
      title: `Delete ${selectedCount} Matters?`,
      content: (
        <div>
          <Alert
            message="Warning"
            description="This action cannot be undone. All selected matters will be permanently deleted along with their associated data."
            type="warning"
            showIcon
            className="mb-4"
          />
          <Text strong>Selected Matters:</Text>
          <ul className="mt-2 max-h-40 overflow-y-auto">
            {selectedItems.slice(0, 10).map((id, index) => (
              <li key={id} className="text-sm text-gray-600">
                {index + 1}. Matter ID: {id}
              </li>
            ))}
            {selectedItems.length > 10 && (
              <li className="text-sm text-gray-500">
                ...and {selectedItems.length - 10} more
              </li>
            )}
          </ul>
        </div>
      ),
      okText: "Delete All",
      okType: "danger",
      cancelText: "Cancel",
      width: 500,
      onOk: () => onBulkDelete(selectedItems),
    });
  };

  const bulkActionsMenuItems = [
    {
      key: "assign-officer",
      label: "Assign Account Officer",
      icon: <TeamOutlined />,
      onClick: () => setShowAssignModal(true),
    },
    {
      key: "change-status",
      label: "Change Status",
      icon: <EditOutlined />,
      onClick: () => setShowStatusModal(true),
    },
    {
      key: "change-priority",
      label: "Change Priority",
      icon: <TagsOutlined />,
      onClick: () => setShowPriorityModal(true),
    },
    { type: "divider" },
    {
      key: "export",
      label: "Export Selected",
      icon: <DownloadOutlined />,
      children: exportMenuItems,
    },
    { type: "divider" },
    {
      key: "send-email",
      label: "Send Email Update",
      icon: <MailOutlined />,
      onClick: () => message.info("Email feature coming soon"),
    },
    {
      key: "transfer",
      label: "Transfer Matters",
      icon: <ArrowRightOutlined />,
      onClick: () => message.info("Transfer feature coming soon"),
    },
    { type: "divider" },
    {
      key: "delete",
      label: "Delete Selected",
      danger: true,
      icon: <DeleteOutlined />,
      onClick: handleBulkDelete,
    },
  ];

  if (selectedCount === 0) return null;

  return (
    <>
      <div
        className={`
          bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
          rounded-lg shadow-lg p-4 mb-6 sticky top-4 z-20
          ${className}
        `}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Badge
                count={selectedCount}
                style={{ backgroundColor: "#1890ff" }}
                overflowCount={999}
              />
              <div>
                <Text strong className="text-base">
                  {selectedCount} matter{selectedCount > 1 ? "s" : ""} selected
                </Text>
                <Text type="secondary" className="block text-sm">
                  Perform actions on all selected matters
                </Text>
              </div>
            </div>
          </div>

          <Space wrap>
            <Tooltip title="Clear Selection">
              <Button
                icon={<CloseOutlined />}
                onClick={onClearSelection}
                size="middle">
                Clear
              </Button>
            </Tooltip>

            <Dropdown
              menu={{ items: bulkActionsMenuItems }}
              trigger={["click"]}
              placement="bottomRight">
              <Button type="primary" loading={loading} size="middle">
                Bulk Actions
              </Button>
            </Dropdown>
          </Space>
        </div>
      </div>

      <Modal
        title="Assign Account Officer"
        open={showAssignModal}
        onCancel={() => {
          setShowAssignModal(false);
          setSelectedOfficer(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setShowAssignModal(false)}>
            Cancel
          </Button>,
          <Button
            key="assign"
            type="primary"
            onClick={handleAssignOfficer}
            loading={loading}>
            Assign Officer
          </Button>,
        ]}>
        <div className="space-y-4">
          <Text>
            Assign an account officer to {selectedCount} selected matter
            {selectedCount > 1 ? "s" : ""}.
          </Text>
          <div>
            <Text strong className="block mb-2">
              Select Account Officer
            </Text>
            <UserSelect
              placeholder="Select account officer"
              userType="staff"
              onChange={setSelectedOfficer}
              value={selectedOfficer}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="Change Status"
        open={showStatusModal}
        onCancel={() => {
          setShowStatusModal(false);
          setSelectedStatus(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>,
          <Button
            key="change"
            type="primary"
            onClick={handleChangeStatus}
            loading={loading}>
            Change Status
          </Button>,
        ]}>
        <div className="space-y-4">
          <Text>
            Change status for {selectedCount} selected matter
            {selectedCount > 1 ? "s" : ""}.
          </Text>
          <div>
            <Text strong className="block mb-2">
              Select New Status
            </Text>
            <Select
              placeholder="Select status"
              style={{ width: "100%" }}
              onChange={setSelectedStatus}
              value={selectedStatus}
              options={statusOptions}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="Change Priority"
        open={showPriorityModal}
        onCancel={() => {
          setShowPriorityModal(false);
          setSelectedPriority(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setShowPriorityModal(false)}>
            Cancel
          </Button>,
          <Button
            key="change"
            type="primary"
            onClick={handleChangePriority}
            loading={loading}>
            Change Priority
          </Button>,
        ]}>
        <div className="space-y-4">
          <Text>
            Change priority for {selectedCount} selected matter
            {selectedCount > 1 ? "s" : ""}.
          </Text>
          <div>
            <Text strong className="block mb-2">
              Select New Priority
            </Text>
            <Select
              placeholder="Select priority"
              style={{ width: "100%" }}
              onChange={setSelectedPriority}
              value={selectedPriority}
              options={priorityOptions}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BulkActionsBar;
