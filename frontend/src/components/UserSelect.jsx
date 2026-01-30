import React, { useState, useEffect } from "react";
import { Select, Spin, Empty, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import api from "../services/api";

const { Option } = Select;

const UserSelect = ({
  placeholder = "Select user",
  userType = "staff",
  onChange,
  value,
  mode = "default",
  style = {},
  disabled = false,
}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [userType]);

  const fetchUsers = async (search = "") => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/users", {
        params: {
          userType,
          search,
          limit: 50,
        },
      });
      setUsers(response.data?.data?.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    if (value.length > 0) {
      fetchUsers(value);
    }
  };

  console.log(users);
  return (
    <Select
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onSearch={handleSearch}
      showSearch
      mode={mode}
      style={{ width: "100%", ...style }}
      loading={loading}
      disabled={disabled}
      filterOption={false}
      allowClear
      notFoundContent={
        loading ? (
          <div className="flex justify-center py-4">
            <Spin size="small" />
          </div>
        ) : error ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={error}
            className="py-4"
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No users found"
            className="py-4"
          />
        )
      }>
      {users.map((user) => (
        <Option key={user._id} value={user._id}>
          <div className="flex items-center gap-2">
            <Avatar
              size="small"
              src={user.photo}
              icon={<UserOutlined />}
              className="flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="truncate">{`${user.firstName} ${user.lastName}`}</div>
              {user.email && (
                <div className="text-xs text-gray-500 truncate">
                  {user.email}
                </div>
              )}
            </div>
          </div>
        </Option>
      ))}
    </Select>
  );
};

export default UserSelect;
