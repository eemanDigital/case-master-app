import React, { memo, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Pagination,
  Row,
  Card,
  Empty,
  Alert,
  Statistic,
  Col,
  Spin,
  Tag,
} from "antd";
import {
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useUserList } from "../hooks/useUserList";
import { useAdminHook } from "../hooks/useAdminHook";
import { useSelector } from "react-redux";
import ButtonWithIcon from "../components/ButtonWithIcon";
import StaffSearchBar from "../components/StaffSearchBar";
import UserListTable from "../components/UserListTable";
import ActiveFilters from "../components/ActiveFilters";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import useUsersCount from "../hooks/useUsersCount";

const StaffList = memo(() => {
  useRedirectLogoutUser("/users/login");
  const { user } = useSelector((state) => state.auth);
  const { isAdminOrHr, isSuperOrAdmin, isStaff } = useAdminHook();

  // ✅ Use fixed hook with "staff" filter
  const {
    filteredList: staffList,
    filters,
    currentPage,
    itemsPerPage,
    totalRecords,
    totalPages,
    loading,
    paginationData,
    statistics, // ✅ Get statistics directly from hook
    handleFiltersChange,
    resetFilters,
    removeUser,
    handlePageChange,
  } = useUserList("staff"); // ✅ Pass "staff" role

  console.log("✅ StaffList - Data:", {
    staffListLength: staffList.length,
    totalRecords,
    totalPages,
    currentPage,
    paginationData,
    statistics, // Debug log statistics
  });

  // ✅ Calculate statistics from the API response
  const usersCount = useUsersCount({
    statistics, // ✅ Use statistics directly from hook (FIXED)
    data: staffList,
  });

  console.log("📊 usersCount:", usersCount); // Debug log

  // ✅ Safely extract values from usersCount object
  const getUsersCountValue = (key, defaultValue = 0) => {
    if (!usersCount || typeof usersCount !== "object") return defaultValue;

    // If usersCount is a number, return it
    if (typeof usersCount === "number") return usersCount;

    // If usersCount is an object with nested structure
    if (usersCount[key] !== undefined) return usersCount[key];

    // Try to get from breakdown if available
    if (usersCount.breakdown && usersCount.breakdown[key] !== undefined) {
      return usersCount.breakdown[key];
    }

    // Try common keys
    const commonKeys = {
      staff: ["staff", "totalStaff", "staffCount"],
      totalActiveUsers: [
        "totalActiveUsers",
        "active",
        "activeUsers",
        "totalActive",
      ],
      lawyerCount: ["lawyerCount", "lawyers", "lawyer"],
      adminsCount: ["adminsCount", "admins", "adminCount"],
      hr: ["hr", "hrCount"],
      secretary: ["secretary", "secretaries", "secretaryCount"],
      clientCount: ["clientCount", "clients", "totalClients"],
      verifiedUsers: ["verifiedUsers", "verified"],
      inactiveUsers: ["inactiveUsers", "inactive"],
    };

    if (commonKeys[key]) {
      for (const altKey of commonKeys[key]) {
        if (usersCount[altKey] !== undefined) {
          return usersCount[altKey];
        }
      }
    }

    return defaultValue;
  };

  // ✅ Extract specific values
  const staffCount = getUsersCountValue("staff");
  const activeCount = getUsersCountValue("totalActiveUsers");
  const lawyerCount = getUsersCountValue("lawyerCount");
  const adminsCount = getUsersCountValue("adminsCount");
  const hrCount = getUsersCountValue("hr");
  const secretaryCount = getUsersCountValue("secretary");
  const clientCount = getUsersCountValue("clientCount");
  const verifiedCount = getUsersCountValue("verifiedUsers");
  const inactiveCount = getUsersCountValue("inactiveUsers");

  // ✅ Filter staff for current user if regular staff
  const filteredStaff = useMemo(() => {
    if (isStaff && !isAdminOrHr && !isSuperOrAdmin && user) {
      const userId = user._id || user.data?._id;
      return staffList.filter((staff) => staff._id === userId);
    }
    return staffList;
  }, [isStaff, isAdminOrHr, isSuperOrAdmin, user, staffList]);

  const handleFilterRemove = useCallback(
    (key) => {
      const newFilters = { ...filters };
      delete newFilters[key];
      handleFiltersChange(newFilters);
    },
    [filters, handleFiltersChange]
  );

  const paginationText = useCallback(
    (total) => {
      const start = (currentPage - 1) * itemsPerPage + 1;
      const end = Math.min(currentPage * itemsPerPage, total);
      return `Showing ${start}-${end} of ${total} staff members`;
    },
    [currentPage, itemsPerPage]
  );

  // Show limited access for regular staff
  if (
    isStaff &&
    !isAdminOrHr &&
    !isSuperOrAdmin &&
    filteredStaff.length === 0 &&
    !loading
  ) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="text-center shadow-lg">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Limited Staff Access
                  </h3>
                  <p className="text-gray-500">
                    As staff, you can only view your own profile. You cannot see
                    other staff members' information.
                  </p>
                </div>
              }
            />
            <div className="mt-6">
              <Link
                to={`/dashboard/staff/${user?._id || user?.data?._id}/details`}>
                <ButtonWithIcon
                  icon={<EyeOutlined />}
                  text="View My Profile"
                  type="primary"
                />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <TeamOutlined className="text-blue-500" />
                Staff Management
              </h1>
              <p className="text-gray-600 mt-2">
                {isAdminOrHr || isSuperOrAdmin
                  ? "Manage all staff accounts, roles, and permissions"
                  : "View staff directory and team information"}
              </p>
            </div>

            {/* Add Staff Button */}
            {(isAdminOrHr || isSuperOrAdmin) && (
              <Link to="add-user">
                <ButtonWithIcon
                  icon={<PlusOutlined className="mr-2" />}
                  text="Add Staff Member"
                  type="primary"
                  size="large"
                  className="bg-blue-600 hover:bg-blue-700 border-0"
                />
              </Link>
            )}
          </div>

          {/* Access Notice */}
          {isStaff && !isAdminOrHr && !isSuperOrAdmin && (
            <Alert
              message="Limited Access"
              description="You can view your own profile and basic staff directory. Administrative functions are restricted."
              type="info"
              showIcon
              closable
              className="mb-6"
            />
          )}
        </div>

        {/* Statistics Cards */}
        {(isAdminOrHr || isSuperOrAdmin) && (
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={4}>
              <Card className="text-center shadow-sm hover:shadow-md transition-shadow h-full">
                <Statistic
                  title="Total Staff"
                  value={staffCount}
                  prefix={<TeamOutlined className="text-blue-500" />}
                  valueStyle={{ color: "#1890ff", fontSize: "1.5rem" }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Card className="text-center shadow-sm hover:shadow-md transition-shadow h-full">
                <Statistic
                  title="Active"
                  value={activeCount}
                  prefix={<CheckCircleOutlined className="text-green-500" />}
                  valueStyle={{ color: "#52c41a", fontSize: "1.5rem" }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Card className="text-center shadow-sm hover:shadow-md transition-shadow h-full">
                <Statistic
                  title="Lawyers"
                  value={lawyerCount}
                  prefix={
                    <SafetyCertificateOutlined className="text-purple-500" />
                  }
                  valueStyle={{ color: "#722ed1", fontSize: "1.5rem" }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Card className="text-center shadow-sm hover:shadow-md transition-shadow h-full">
                <Statistic
                  title="Admins"
                  value={adminsCount}
                  prefix={<CrownOutlined className="text-orange-500" />}
                  valueStyle={{ color: "#fa8c16", fontSize: "1.5rem" }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Card className="text-center shadow-sm hover:shadow-md transition-shadow h-full">
                <Statistic
                  title="HR"
                  value={hrCount}
                  prefix={<UserOutlined className="text-red-500" />}
                  valueStyle={{ color: "#f5222d", fontSize: "1.5rem" }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Card className="text-center shadow-sm hover:shadow-md transition-shadow h-full">
                <Statistic
                  title="Secretaries"
                  value={secretaryCount}
                  prefix={<UserOutlined className="text-green-500" />}
                  valueStyle={{ color: "#13c2c2", fontSize: "1.5rem" }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6 p-6 bg-white rounded-lg shadow-sm border">
          <div className="w-full lg:w-96">
            <StaffSearchBar
              onFiltersChange={handleFiltersChange}
              filters={filters}
              loading={loading}
              searchPlaceholder="Search staff by name, email, position..."
              showUserFilters={true}
              disabled={!isAdminOrHr && !isSuperOrAdmin}
            />
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-3">
            <Tag color="blue" className="px-3 py-1 text-sm font-medium">
              <TeamOutlined className="mr-1" />
              Staff: {staffCount}
            </Tag>
            <Tag color="green" className="px-3 py-1 text-sm font-medium">
              <CheckCircleOutlined className="mr-1" />
              Active: {activeCount}
            </Tag>
            <Tag color="orange" className="px-3 py-1 text-sm font-medium">
              <UserOutlined className="mr-1" />
              Inactive: {inactiveCount}
            </Tag>
            {(isAdminOrHr || isSuperOrAdmin) && (
              <>
                <Tag color="purple" className="px-3 py-1 text-sm font-medium">
                  <SafetyCertificateOutlined className="mr-1" />
                  Lawyers: {lawyerCount}
                </Tag>
                <Tag color="gold" className="px-3 py-1 text-sm font-medium">
                  <CheckCircleOutlined className="mr-1" />
                  Verified: {verifiedCount}
                </Tag>
              </>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {(isAdminOrHr || isSuperOrAdmin) && Object.keys(filters).length > 0 && (
          <ActiveFilters
            filters={filters}
            onFilterRemove={handleFilterRemove}
            onClearAll={resetFilters}
          />
        )}

        {/* Main Content */}
        <Card
          className="shadow-sm border-0 relative"
          bodyStyle={{ padding: 0 }}>
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
              <Spin size="large" tip="Loading staff..." />
            </div>
          )}

          {/* Info Banner */}
          {!loading && filteredStaff.length > 0 && (
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between text-sm gap-2">
                <span className="text-blue-700">
                  <strong>Current Page:</strong> Showing {filteredStaff.length}{" "}
                  of {totalRecords} staff members
                </span>
                <span className="text-blue-600">
                  <strong>Status:</strong> {activeCount} active •{" "}
                  {inactiveCount} inactive
                </span>
              </div>
            </div>
          )}

          <UserListTable
            dataSource={filteredStaff}
            loading={loading}
            onDelete={isSuperOrAdmin ? removeUser : null}
            showActions={isAdminOrHr || isSuperOrAdmin}
            showRole={true}
            showPosition={true}
            showLawyer={true}
            userType="staff"
            basePath="/dashboard/staff"
          />

          {/* Empty State */}
          {!loading && filteredStaff.length === 0 && (
            <div className="p-12 text-center">
              <Empty
                description={
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {Object.keys(filters).length > 0
                        ? "No Staff Found"
                        : "No Staff Members"}
                    </h3>
                    <p className="text-gray-500 mb-2">
                      {Object.keys(filters).length > 0
                        ? "No staff members match your current filters. Try adjusting your search criteria."
                        : isAdminOrHr || isSuperOrAdmin
                        ? "No staff members have been added yet. Start by adding your first team member."
                        : "No staff members found in the directory."}
                    </p>
                    {/* Show system stats */}
                    {Object.keys(filters).length > 0 && (
                      <p className="text-blue-600 text-sm mt-3">
                        System has {staffCount} total staff members (
                        {activeCount} active, {inactiveCount} inactive)
                      </p>
                    )}
                  </div>
                }
              />
              {Object.keys(filters).length > 0 ? (
                <ButtonWithIcon
                  onClick={resetFilters}
                  text="Clear All Filters"
                  className="mt-4"
                />
              ) : (
                (isAdminOrHr || isSuperOrAdmin) && (
                  <Link to="add-user" className="mt-4 inline-block">
                    <ButtonWithIcon
                      icon={<PlusOutlined />}
                      text="Add First Staff Member"
                      type="primary"
                    />
                  </Link>
                )
              )}
            </div>
          )}
        </Card>

        {/* Pagination */}
        {totalRecords > 0 && (
          <Row justify="center" className="mt-6">
            <Pagination
              current={currentPage}
              total={totalRecords}
              pageSize={itemsPerPage}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
              showSizeChanger
              showQuickJumper
              showTotal={paginationText}
              pageSizeOptions={["10", "20", "50", "100"]}
              disabled={loading}
              className="pagination-custom"
            />
          </Row>
        )}
      </div>
    </div>
  );
});

StaffList.displayName = "StaffList";
export default StaffList;
