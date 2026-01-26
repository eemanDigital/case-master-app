import React, { useState, useEffect, useCallback } from "react";
import { Select, Avatar, Typography, Alert, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import userService from "../services/userService";

const { Text } = Typography;
const { Option } = Select;

const UserSelect = ({
  placeholder = "Select user",
  userType = "staff", // 'staff', 'client', or 'all'
  mode = "default", // 'default' or 'multiple'
  value,
  onChange,
  disabled = false,
  allowClear = true,
  style,
  className,
  showSearch = true,
  ...restProps
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch users based on search term and user type
  const fetchUsers = useCallback(
    async (search = "") => {
      setLoading(true);
      setError(null);

      try {
        let filters = {};

        // Filter by user type
        if (userType === "staff") {
          filters.role = { $in: ["admin", "lawyer", "hr", "paralegal"] };
        } else if (userType === "client") {
          filters.role = "client";
        }
        // For 'all', no role filter

        // Add search filter if provided
        if (search.trim()) {
          filters.search = search; // Let backend handle search
        }

        const response = await userService.getUsers({
          filters,
          limit: 20,
          select: "firstName lastName email photo role phone",
        });

        const users = response.data?.users || response.data || [];
        setOptions(users);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setError(error.message);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [userType],
  );

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search input change
  const handleSearch = (value) => {
    setSearchTerm(value);
    if (value) {
      fetchUsers(value);
    } else {
      fetchUsers();
    }
  };

  // Render a single option in the dropdown
  const renderOption = (user) => {
    const fullName = `${user.firstName} ${user.lastName}`;
    return (
      <Option key={user._id} value={user._id} label={fullName}>
        <div className="flex items-center gap-2 p-1">
          <Avatar
            size="small"
            src={user.photo}
            icon={<UserOutlined />}
            className="bg-blue-100 flex-shrink-0">
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </Avatar>
          <div className="flex-1 min-w-0">
            <Text strong className="block truncate text-sm">
              {fullName}
            </Text>
            <Text type="secondary" className="text-xs truncate">
              {user.email}
              {user.role && (
                <span className="ml-2 px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                  {user.role}
                </span>
              )}
            </Text>
          </div>
        </div>
      </Option>
    );
  };

  // Render loading or error state
  const renderDropdownContent = () => {
    if (loading) {
      return (
        <div className="p-2 text-center">
          <Spin size="small" />
          <Text type="secondary" className="block mt-1 text-xs">
            Loading users...
          </Text>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-2">
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            size="small"
            className="text-xs"
          />
        </div>
      );
    }

    if (options.length === 0) {
      return (
        <div className="p-2 text-center">
          <Text type="secondary" className="text-xs">
            {searchTerm ? "No users found" : "No users available"}
          </Text>
        </div>
      );
    }

    return options.map(renderOption);
  };

  return (
    <div>
      <Select
        placeholder={placeholder}
        mode={mode === "multiple" ? "multiple" : undefined}
        value={value}
        onChange={onChange}
        onSearch={showSearch ? handleSearch : undefined}
        disabled={disabled}
        allowClear={allowClear}
        loading={loading}
        showSearch={showSearch}
        filterOption={false}
        style={style}
        className={`w-full ${className}`}
        dropdownRender={(menu) => <div>{renderDropdownContent()}</div>}
        {...restProps}>
        {!loading && !error && options.map(renderOption)}
      </Select>
    </div>
  );
};

export default UserSelect;
