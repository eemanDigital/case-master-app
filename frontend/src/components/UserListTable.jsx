import React from "react";
import { Space, Table, Button, Modal, Tooltip, Tag, Typography } from "antd";
import { Link } from "react-router-dom";
import {
  DeleteOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs"; // Ensure you have dayjs installed
import avatar from "../assets/avatar.png";

const { Column, ColumnGroup } = Table;
const { Text } = Typography;

/**
 * Reusable User List Table Component
 */
const UserListTable = ({
  dataSource,
  loading,
  onDelete,
  showActions = true,
  showRole = false,
  showPosition = false,
  showLawyer = false,
  userType = "user",
  basePath = "/dashboard/users",
}) => {
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

  const handleDelete = (record) => {
    Modal.confirm({
      title: `Delete ${userType}?`,
      content: `Are you sure you want to delete ${record.firstName}? This action can be reversed by an admin.`,
      okText: "Yes, Delete",
      okType: "danger",
      onOk: () => onDelete(`soft-delete/${record._id}`),
    });
  };

  // console.log(dataSource, "UserListTable dataSource");

  return (
    <div className="overflow-x-auto font-medium font-poppins">
      <Table
        dataSource={dataSource}
        scroll={{ x: 1200 }}
        loading={loading}
        pagination={false}
        rowKey="_id">
        <ColumnGroup
          title={`${
            userType.charAt(0).toUpperCase() + userType.slice(1)
          } Details`}>
          <Column
            title="Photo"
            dataIndex="photo"
            key="photo"
            width={80}
            render={(photo) => (
              <div className="flex items-center justify-center">
                <img
                  className="w-10 h-10 object-cover rounded-full border border-gray-200"
                  src={photo || avatar}
                  alt={userType}
                />
              </div>
            )}
          />
          <Column
            title="Name"
            key="name"
            width={220}
            render={(text, record) => {
              // LOGIC: Staff uses lastName, Client uses secondName
              const surname = record.lastName || record.secondName || "";
              return (
                <div className="flex flex-col">
                  <Tooltip title="Click to view full profile">
                    <Link
                      className="text-sm font-bold capitalize text-gray-800 hover:text-blue-600 flex items-center gap-1"
                      to={`${basePath}/${record?._id}/details`}>
                      {`${record.firstName} ${surname}`}

                      {/* LOGIC: Show Verified Badge */}
                      {record.isVerified && (
                        <Tooltip title="Verified User">
                          <SafetyCertificateOutlined className="text-blue-500 text-xs" />
                        </Tooltip>
                      )}
                    </Link>
                  </Tooltip>
                  {/* LOGIC: Show secondary info (like company name if applicable, or small role text) */}
                  {userType === "staff" && record.middleName && (
                    <Text type="secondary" className="text-xs">
                      {record.middleName}
                    </Text>
                  )}
                </div>
              );
            }}
          />
          <Column
            title="Email"
            dataIndex="email"
            key="email"
            width={200}
            render={(email) => (
              <span className="text-xs text-gray-500">{email}</span>
            )}
          />

          {/* Universal Phone Column (Useful for both Staff and Clients) */}
          <Column
            title="Phone"
            dataIndex="phone"
            key="phone"
            width={150}
            render={(phone) =>
              phone || <span className="text-gray-300">-</span>
            }
          />
        </ColumnGroup>

        {showRole && (
          <Column
            title="Role"
            dataIndex="role"
            key="role"
            width={120}
            render={(role) => (
              <Tag color={getRoleColor(role)} className="capitalize rounded-md">
                {role?.replace("-", " ")}
              </Tag>
            )}
          />
        )}

        {/* Improved Position Column */}
        {showPosition && (
          <Column
            title="Position"
            key="position"
            width={150}
            render={(_, record) => (
              <div className="flex flex-col">
                <span className="text-sm">
                  {record.position || record.role || "N/A"}
                </span>
                {/* LOGIC: If they are a lawyer, show practice area here too if space permits, 
                    or rely on the lawyer column */}
              </div>
            )}
          />
        )}

        {/* Improved Lawyer Column */}
        {showLawyer && (
          <Column
            title="Practice Area"
            key="isLawyer"
            width={140}
            render={(_, record) => {
              if (record.isLawyer) {
                return (
                  <Tag color="purple" className="mr-0">
                    {record.practiceArea || "Lawyer"}
                  </Tag>
                );
              }
              return <span className="text-gray-300 text-xs">N/A</span>;
            }}
          />
        )}

        {/* Added Joined Date for context */}
        <Column
          title="Joined"
          dataIndex="createdAt"
          key="createdAt"
          width={120}
          render={(date) => (
            <span className="text-xs text-gray-500">
              {dayjs(date).format("MMM D, YYYY")}
            </span>
          )}
        />

        <Column
          title="Status"
          dataIndex="isActive"
          key="isActive"
          width={100}
          render={(status) => (
            <Tag
              icon={status ? <CheckCircleOutlined /> : <UserOutlined />}
              color={status ? "success" : "default"}
              className="capitalize">
              {status ? "Active" : "Inactive"}
            </Tag>
          )}
        />

        {showActions && (
          <Column
            title="Action"
            key="action"
            width={80}
            fixed="right"
            render={(text, record) => (
              <Space size="small">
                <Tooltip title={`Delete ${userType}`}>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(record)}
                  />
                </Tooltip>
              </Space>
            )}
          />
        )}
      </Table>
    </div>
  );
};

export default UserListTable;
