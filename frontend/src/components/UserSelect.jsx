import React, { useState, useEffect, useCallback } from "react";
import { Select, Spin, Empty, Avatar, Tag } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import debounce from "lodash/debounce";
import api from "../services/api";

const { Option } = Select;

const UserSelect = ({
  placeholder = "Select user",
  userType = null, // null = all users, or specific type: "staff", "client", "lawyer", "admin"
  excludeUserTypes = [], // Array of user types to exclude, e.g. ["client"]
  includeAdditionalRoles = [], // Filter by additional roles
  status = "active", // Filter by status: "active", "inactive", "all"
  onChange,
  value,
  mode = "default",
  style = {},
  disabled = false,
  allowClear = true,
  showAvatar = true,
  showUserType = false,
  showStatus = false,
  minSearchLength = 0,
  limit = 50,
}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");

  // User type icon mapping
  const userTypeIcons = {
    admin: <SafetyCertificateOutlined className="text-red-500" />,
    lawyer: <IdcardOutlined className="text-blue-500" />,
    staff: <UserOutlined className="text-green-500" />,
    client: <TeamOutlined className="text-purple-500" />,
    default: <UserOutlined className="text-gray-500" />,
  };

  // User type color mapping
  const userTypeColors = {
    admin: "red",
    "super-admin": "magenta",
    lawyer: "blue",
    staff: "green",
    client: "purple",
    hr: "orange",
    default: "default",
  };

  // Get user type display text
  const getUserTypeDisplay = (user) => {
    if (user.userType === "admin" && user.isSuperAdmin) {
      return "Super Admin";
    }
    if (user.userType === "lawyer") {
      return user.isSeniorLawyer ? "Senior Lawyer" : "Lawyer";
    }
    return (
      user.userType?.charAt(0).toUpperCase() + user.userType?.slice(1) || "User"
    );
  };

  // Build query params
  const buildQueryParams = (search = "") => {
    const params = {
      limit,
    };

    // Add search if provided
    if (search && search.trim().length >= minSearchLength) {
      params.search = search.trim();
    }

    // Add user type filter if specified
    if (userType && userType !== "all") {
      params.userType = userType;
    }

    // Add exclude user types
    if (excludeUserTypes.length > 0) {
      params.excludeUserTypes = excludeUserTypes.join(",");
    }

    // Add status filter
    if (status && status !== "all") {
      params.status = status;
    }

    // Add additional roles filter
    if (includeAdditionalRoles.length > 0) {
      params.additionalRoles = includeAdditionalRoles.join(",");
    }

    return params;
  };

  // Fetch users with debouncing
  const fetchUsers = useCallback(
    debounce(async (search = "") => {
      setLoading(true);
      setError(null);
      try {
        const params = buildQueryParams(search);
        const response = await api.get("/users", { params });

        // Ensure we have an array
        const usersData = Array.isArray(response?.data)
          ? response.data
          : response?.data?.users || [];

        // Apply additional client-side filtering if needed
        let filteredUsers = usersData;

        // Filter out excluded user types (client-side fallback)
        if (excludeUserTypes.length > 0) {
          filteredUsers = filteredUsers.filter(
            (user) => !excludeUserTypes.includes(user.userType),
          );
        }

        // Filter by additional roles (client-side fallback)
        if (includeAdditionalRoles.length > 0) {
          filteredUsers = filteredUsers.filter((user) =>
            includeAdditionalRoles.some((role) =>
              user.additionalRoles?.includes(role),
            ),
          );
        }

        setUsers(filteredUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load users",
        );
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [
      userType,
      excludeUserTypes,
      includeAdditionalRoles,
      status,
      limit,
      minSearchLength,
    ],
  );

  // Initial fetch
  useEffect(() => {
    fetchUsers("");
  }, [fetchUsers]);

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    fetchUsers(value);
  };

  // Clear search
  const handleClear = () => {
    setSearchText("");
    fetchUsers("");
  };

  // Render user option
  const renderUserOption = (user) => {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    const userTypeIcon = userTypeIcons[user.userType] || userTypeIcons.default;
    const userTypeColor =
      userTypeColors[user.userType] || userTypeColors.default;

    return (
      <Option key={user._id} value={user._id}>
        <div className="flex items-center gap-2">
          {showAvatar && (
            <Avatar
              size="small"
              src={user.photo}
              icon={userTypeIcon}
              className="flex-shrink-0"
              style={{ backgroundColor: `var(--ant-color-${userTypeColor})` }}
            />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">
                {fullName || "Unnamed User"}
              </span>

              {showUserType && (
                <Tag color={userTypeColor} size="small" className="text-xs">
                  {getUserTypeDisplay(user)}
                </Tag>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              {user.email && (
                <span className="text-gray-500 truncate">{user.email}</span>
              )}

              {showStatus && user.status && (
                <Tag
                  color={user.status === "active" ? "green" : "red"}
                  size="small">
                  {user.status}
                </Tag>
              )}
            </div>

            {/* Additional roles */}
            {user.additionalRoles?.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {user.additionalRoles.slice(0, 2).map((role, index) => (
                  <Tag key={index} color="cyan" size="small">
                    {role}
                  </Tag>
                ))}
                {user.additionalRoles.length > 2 && (
                  <Tag color="cyan" size="small">
                    +{user.additionalRoles.length - 2}
                  </Tag>
                )}
              </div>
            )}
          </div>
        </div>
      </Option>
    );
  };

  // Render not found content
  const renderNotFoundContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-4">
          <Spin size="small" />
        </div>
      );
    }

    if (error) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={error}
          className="py-4"
        />
      );
    }

    if (searchText.length >= minSearchLength) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={`No users found matching "${searchText}"`}
          className="py-4"
        />
      );
    }

    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No users found"
        className="py-4"
      />
    );
  };

  return (
    <Select
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onSearch={handleSearch}
      onClear={handleClear}
      showSearch
      mode={mode}
      style={{ width: "100%", ...style }}
      loading={loading}
      disabled={disabled}
      filterOption={false}
      allowClear={allowClear}
      notFoundContent={renderNotFoundContent()}
      optionLabelProp="label">
      {users.map(renderUserOption)}
    </Select>
  );
};

// Prop types validation
UserSelect.defaultProps = {
  userType: null,
  excludeUserTypes: [],
  includeAdditionalRoles: [],
  status: "active",
  mode: "default",
  disabled: false,
  allowClear: true,
  showAvatar: true,
  showUserType: false,
  showStatus: false,
  minSearchLength: 0,
  limit: 50,
};

export default UserSelect;
