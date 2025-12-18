import { Space, Table, Button, Modal, Tooltip, Tag } from "antd";
import { Link } from "react-router-dom";
import { DeleteOutlined } from "@ant-design/icons";
import avatar from "../assets/avatar.png";

const { Column, ColumnGroup } = Table;

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
      "super-admin": "red",
      admin: "orange",
      hr: "purple",
      lawyer: "blue",
      secretary: "green",
    };
    return colors[role] || "gray";
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: `Are you sure you want to delete this ${userType}?`,
      onOk: () => onDelete(`soft-delete/${record._id}`),
    });
  };

  return (
    <div className="overflow-x-auto font-medium font-poppins">
      <Table
        dataSource={dataSource}
        scroll={{ x: 1000 }}
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
                  className="w-10 h-10 object-cover rounded-full"
                  src={photo || avatar}
                  alt={userType}
                />
              </div>
            )}
          />
          <Column
            title="Name"
            key="name"
            width={200}
            render={(text, record) => (
              <Tooltip title="Click for details">
                <Link
                  className="text-md font-bold capitalize text-blue-600 hover:text-blue-800 cursor-pointer flex items-center"
                  to={`${basePath}/${record?._id}/details`}>
                  {`${record.firstName} ${
                    record.lastName || record.secondName
                  }`}
                  {record.middleName && ` ${record.middleName}`}
                </Link>
              </Tooltip>
            )}
          />
          <Column title="Email" dataIndex="email" key="email" width={200} />
          {userType === "client" && (
            <Column title="Phone" dataIndex="phone" key="phone" width={150} />
          )}
        </ColumnGroup>

        {showRole && (
          <Column
            title="Role"
            dataIndex="role"
            key="role"
            width={120}
            render={(role) => (
              <Tag color={getRoleColor(role)} className="capitalize">
                {role?.replace("-", " ")}
              </Tag>
            )}
          />
        )}

        {showPosition && (
          <Column
            title="Position"
            dataIndex="position"
            key="position"
            width={150}
            render={(position) => position || "N/A"}
          />
        )}

        {showLawyer && (
          <Column
            title="Lawyer"
            dataIndex="isLawyer"
            key="isLawyer"
            width={100}
            render={(isLawyer) => (
              <Tag color={isLawyer ? "green" : "orange"}>
                {isLawyer ? "Yes" : "No"}
              </Tag>
            )}
          />
        )}

        <Column
          title={userType === "client" ? "isActive" : "Status"}
          dataIndex="isActive"
          key="isActive"
          width={100}
          render={(status) => (
            <Tag color={status ? "green" : "red"} className="capitalize">
              {status ? "active" : "inactive"}
            </Tag>
          )}
        />

        {showActions && (
          <Column
            title="Action"
            key="action"
            width={70}
            fixed="right"
            render={(text, record) => (
              <Space size="small">
                <Tooltip title={`Delete ${userType}`}>
                  <Button
                    icon={<DeleteOutlined />}
                    className="bg-red-200 text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(record)}
                    size="small"
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
