// pages/ArchivedUsers.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Table,
  Button,
  Modal,
  Tag,
  Space,
  Tooltip,
  Typography,
  Card,
  Row,
  Col,
  Spin,
  Empty,
  message,
} from "antd";
import {
  DeleteOutlined,
  RollbackOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { getDeletedUsers, restoreUser, deleteUser } from "../redux/features/auth/authSlice";
import avatar from "../assets/avatar.png";

const { Text } = Typography;

const ArchivedUsers = () => {
  const dispatch = useDispatch();
  const { deletedUsers, isLoading } = useSelector((state) => state.auth);
  const [loadingAction, setLoadingAction] = useState(null);

  useEffect(() => {
    dispatch(getDeletedUsers());
  }, [dispatch]);

  const handleRestore = async (id) => {
    Modal.confirm({
      title: "Restore User",
      content: "Are you sure you want to restore this user? They will be reactivated.",
      okText: "Yes, Restore",
      onOk: async () => {
        setLoadingAction(id);
        try {
          await dispatch(restoreUser(id)).unwrap();
          message.success("User restored successfully");
          dispatch(getDeletedUsers());
        } catch (error) {
          message.error(error || "Failed to restore user");
        } finally {
          setLoadingAction(null);
        }
      },
    });
  };

  const handlePermanentDelete = (record) => {
    Modal.confirm({
      title: "Permanently Delete User",
      content: `Are you sure you want to permanently delete ${record.firstName} ${record.lastName}? This action cannot be undone.`,
      okText: "Yes, Delete Permanently",
      okType: "danger",
      onOk: async () => {
        setLoadingAction(record._id);
        try {
          await dispatch(deleteUser(record._id)).unwrap();
          message.success("User permanently deleted");
          dispatch(getDeletedUsers());
        } catch (error) {
          message.error(error || "Failed to delete user");
        } finally {
          setLoadingAction(null);
        }
      },
    });
  };

  const getRoleColor = (role) => {
    const colors = {
      "super-admin": "volcano",
      admin: "orange",
      hr: "magenta",
      lawyer: "geekblue",
      secretary: "cyan",
      client: "blue",
      user: "default",
    };
    return colors[role] || "default";
  };

  const columns = [
    {
      title: "Photo",
      dataIndex: "photo",
      key: "photo",
      width: 60,
      render: (photo) => (
        <div className="flex items-center justify-center">
          <img
            className="w-10 h-10 object-cover rounded-full border border-gray-200"
            src={photo || avatar}
            alt="User"
          />
        </div>
      ),
    },
    {
      title: "Name",
      key: "name",
      width: 220,
      render: (_, record) => {
        const surname = record.lastName || record.secondName || "";
        return (
          <div className="flex flex-col">
            <Text strong>
              {record.firstName} {surname}
            </Text>
            {record.middleName && (
              <Text type="secondary" className="text-xs">
                {record.middleName}
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 120,
      render: (role) => (
        <Tag color={getRoleColor(role)} className="capitalize rounded-md">
          {role?.replace("-", " ")}
        </Tag>
      ),
    },
    {
      title: "Deleted At",
      dataIndex: "deletedAt",
      key: "deletedAt",
      width: 150,
      render: (date) => (
        <span className="text-xs text-gray-500">
          {date ? dayjs(date).format("MMM D, YYYY h:mm A") : "-"}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 150,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Restore User">
            <Button
              type="primary"
              icon={<RollbackOutlined />}
              onClick={() => handleRestore(record._id)}
              loading={loadingAction === record._id}
              size="small"
            >
              Restore
            </Button>
          </Tooltip>
          <Tooltip title="Permanently Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handlePermanentDelete(record)}
              loading={loadingAction === record._id}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const data = deletedUsers?.data || [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Archived Users</h1>
        <Text type="secondary">
          View and manage deleted users. Restore them or permanently delete.
        </Text>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Spin size="large" />
          </div>
        ) : data.length === 0 ? (
          <Empty
            description="No archived users"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            dataSource={data}
            columns={columns}
            rowKey="_id"
            pagination={{
              current: deletedUsers?.pagination?.currentPage || 1,
              pageSize: deletedUsers?.pagination?.limit || 10,
              total: deletedUsers?.pagination?.totalRecords || 0,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} archived users`,
            }}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>
    </div>
  );
};

export default ArchivedUsers;
