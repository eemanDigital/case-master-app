// components/modals/DeleteConfirmModal.jsx
import React, { useState } from "react";
import { Modal, Button, Typography, Alert } from "antd";
import { ExclamationCircleOutlined, DeleteOutlined } from "@ant-design/icons";

const { Text } = Typography;

const DeleteConfirmModal = React.memo(
  ({
    visible,
    onConfirm,
    onCancel,
    title = "Confirm Deletion",
    content = "Are you sure you want to delete this item? This action cannot be undone.",
    confirmText = "Delete",
    cancelText = "Cancel",
    loading = false,
    type = "advisory",
    showSoftDeleteInfo = true,
  }) => {
    const [deletionType, setDeletionType] = useState("soft"); // 'soft' or 'hard'

    const handleConfirm = () => {
      onConfirm(deletionType);
    };

    return (
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ExclamationCircleOutlined className="text-red-500 text-lg" />
            <span className="font-semibold text-gray-900">{title}</span>
          </div>
        }
        open={visible}
        onCancel={onCancel}
        footer={
          <div className="flex flex-col gap-3">
            {showSoftDeleteInfo && type === "advisory" && (
              <div className="mb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={deletionType === "soft"}
                    onChange={() => setDeletionType("soft")}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">
                    Soft Delete (can be restored later)
                  </span>
                </label>
                <label className="flex items-center gap-2 text-sm mt-2">
                  <input
                    type="radio"
                    checked={deletionType === "hard"}
                    onChange={() => setDeletionType("hard")}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-gray-700">
                    Permanent Delete (cannot be recovered)
                  </span>
                </label>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button onClick={onCancel} disabled={loading} className="px-6">
                {cancelText}
              </Button>
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                onClick={handleConfirm}
                loading={loading}
                className="px-6">
                {confirmText}
              </Button>
            </div>
          </div>
        }
        width={500}
        centered
        destroyOnClose>
        <div className="space-y-4">
          <Text className="text-gray-700">{content}</Text>

          {type === "advisory" && showSoftDeleteInfo && (
            <Alert
              type="info"
              showIcon
              message="Advisory Deletion"
              description={
                <div className="text-sm">
                  <p className="mb-1">
                    <strong>Soft Delete:</strong> Marks as deleted but keeps
                    data. Can be restored from deleted items.
                  </p>
                  <p>
                    <strong>Hard Delete:</strong> Permanently removes all data
                    including research, deliverables, and documents.
                  </p>
                </div>
              }
              className="bg-blue-50 border-blue-200"
            />
          )}

          {deletionType === "hard" && (
            <Alert
              type="warning"
              showIcon
              message="Warning: Permanent Deletion"
              description="This will permanently delete all associated data including research questions, deliverables, documents, and activity logs. This action cannot be undone."
              className="bg-red-50 border-red-200"
            />
          )}
        </div>
      </Modal>
    );
  },
);

DeleteConfirmModal.displayName = "DeleteConfirmModal";

export default DeleteConfirmModal;
