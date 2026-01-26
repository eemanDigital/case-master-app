// pages/StaffList.jsx
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
  Space,
  Button,
} from "antd";
import {
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  FilterOutlined,
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

  const {
    filteredList: staffList,
    filters,
    currentPage,
    itemsPerPage,
    totalRecords,
    totalPages,
    loading,
    paginationData,
    statistics,
    handleFiltersChange,
    resetFilters,
    removeUser,
    handlePageChange,
  } = useUserList("staff");

  // Extract statistics with safe fallbacks
  const usersCount = useUsersCount({
    statistics,
    data: staffList,
  });

  const getUsersCountValue = useCallback(
    (key, defaultValue = 0) => {
      if (!usersCount || typeof usersCount !== "object") return defaultValue;
      if (typeof usersCount === "number") return usersCount;
      if (usersCount[key] !== undefined) return usersCount[key];
      if (usersCount.breakdown?.[key] !== undefined) {
        return usersCount.breakdown[key];
      }

      const commonKeys = {
        staff: ["staff", "totalStaff", "staffCount"],
        totalActiveUsers: ["totalActiveUsers", "active", "activeUsers"],
        lawyerCount: ["lawyerCount", "lawyers", "lawyer"],
        adminsCount: ["adminsCount", "admins", "adminCount"],
        hr: ["hr", "hrCount"],
        secretary: ["secretary", "secretaries"],
        clientCount: ["clientCount", "clients"],
        verifiedUsers: ["verifiedUsers", "verified"],
        inactiveUsers: ["inactiveUsers", "inactive"],
      };

      if (commonKeys[key]) {
        for (const altKey of commonKeys[key]) {
          if (usersCount[altKey] !== undefined) return usersCount[altKey];
        }
      }
      return defaultValue;
    },
    [usersCount],
  );

  const staffCount = getUsersCountValue("staff");
  const activeCount = getUsersCountValue("totalActiveUsers");
  const lawyerCount = getUsersCountValue("lawyerCount");
  const adminsCount = getUsersCountValue("adminsCount");
  const hrCount = getUsersCountValue("hr");
  const secretaryCount = getUsersCountValue("secretary");
  const verifiedCount = getUsersCountValue("verifiedUsers");
  const inactiveCount = getUsersCountValue("inactiveUsers");

  // Filter staff for regular users
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
    [filters, handleFiltersChange],
  );

  const paginationText = useCallback(
    (total) => {
      const start = (currentPage - 1) * itemsPerPage + 1;
      const end = Math.min(currentPage * itemsPerPage, total);
      return `${start}-${end} of ${total}`;
    },
    [currentPage, itemsPerPage],
  );

  // Limited access view for staff
  if (
    isStaff &&
    !isAdminOrHr &&
    !isSuperOrAdmin &&
    filteredStaff.length === 0 &&
    !loading
  ) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 px-4">
        <Card className="max-w-2xl mx-auto text-center shadow-md">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size="small">
                <h3 className="text-base md:text-lg font-semibold text-gray-700">
                  Limited Staff Access
                </h3>
                <p className="text-sm text-gray-500">
                  You can only view your own profile. Contact HR for directory
                  access.
                </p>
              </Space>
            }
          />
          <div className="mt-6">
            <Link
              to={`/dashboard/staff/${user?._id || user?.data?._id}/details`}>
              <Button
                type="primary"
                icon={<EyeOutlined />}
                size="large"
                block
                className="max-w-xs mx-auto">
                View My Profile
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Mobile Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2 truncate">
                  <TeamOutlined className="text-blue-500 flex-shrink-0" />
                  <span className="truncate">Staff</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                  {isAdminOrHr || isSuperOrAdmin
                    ? "Manage team accounts and permissions"
                    : "View staff directory"}
                </p>
              </div>

              {/* Add Button - Desktop */}
              {(isAdminOrHr || isSuperOrAdmin) && (
                <Link to="add-user" className="hidden sm:block flex-shrink-0">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    className="bg-blue-600 hover:bg-blue-700">
                    <span className="hidden lg:inline ml-1">Add Staff</span>
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Add Button */}
            {(isAdminOrHr || isSuperOrAdmin) && (
              <Link to="add-user" className="sm:hidden">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="large"
                  block
                  className="bg-blue-600">
                  Add Staff Member
                </Button>
              </Link>
            )}
          </div>

          {/* Limited Access Alert */}
          {isStaff && !isAdminOrHr && !isSuperOrAdmin && (
            <Alert
              message="Limited Access"
              description="Basic directory access only. Administrative functions restricted."
              type="info"
              showIcon
              closable
              className="mt-4 text-xs sm:text-sm"
            />
          )}
        </div>

        {/* Statistics - Mobile Optimized */}
        {(isAdminOrHr || isSuperOrAdmin) && (
          <div className="mb-4 sm:mb-6">
            {/* Mobile: 2 columns */}
            <Row gutter={[8, 8]} className="sm:hidden">
              <Col span={12}>
                <Card size="small" className="text-center">
                  <Statistic
                    title={<span className="text-xs">Staff</span>}
                    value={staffCount}
                    prefix={<TeamOutlined className="text-blue-500" />}
                    valueStyle={{ fontSize: "1.25rem", color: "#1890ff" }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="text-center">
                  <Statistic
                    title={<span className="text-xs">Active</span>}
                    value={activeCount}
                    prefix={<CheckCircleOutlined className="text-green-500" />}
                    valueStyle={{ fontSize: "1.25rem", color: "#52c41a" }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="text-center">
                  <Statistic
                    title={<span className="text-xs">Lawyers</span>}
                    value={lawyerCount}
                    prefix={
                      <SafetyCertificateOutlined className="text-purple-500" />
                    }
                    valueStyle={{ fontSize: "1.25rem", color: "#722ed1" }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="text-center">
                  <Statistic
                    title={<span className="text-xs">Admins</span>}
                    value={adminsCount}
                    prefix={<CrownOutlined className="text-orange-500" />}
                    valueStyle={{ fontSize: "1.25rem", color: "#fa8c16" }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Tablet: 3 columns */}
            <Row
              gutter={[12, 12]}
              className="hidden sm:grid md:hidden grid-cols-3">
              <Col>
                <Card className="text-center">
                  <Statistic
                    title="Staff"
                    value={staffCount}
                    prefix={<TeamOutlined className="text-blue-500" />}
                    valueStyle={{ fontSize: "1.5rem", color: "#1890ff" }}
                  />
                </Card>
              </Col>
              <Col>
                <Card className="text-center">
                  <Statistic
                    title="Active"
                    value={activeCount}
                    prefix={<CheckCircleOutlined className="text-green-500" />}
                    valueStyle={{ fontSize: "1.5rem", color: "#52c41a" }}
                  />
                </Card>
              </Col>
              <Col>
                <Card className="text-center">
                  <Statistic
                    title="Lawyers"
                    value={lawyerCount}
                    prefix={
                      <SafetyCertificateOutlined className="text-purple-500" />
                    }
                    valueStyle={{ fontSize: "1.5rem", color: "#722ed1" }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Desktop: 6 columns */}
            <Row gutter={[16, 16]} className="hidden md:flex">
              <Col xs={24} sm={12} md={4}>
                <Card className="text-center hover:shadow-md transition-shadow">
                  <Statistic
                    title="Total Staff"
                    value={staffCount}
                    prefix={<TeamOutlined className="text-blue-500" />}
                    valueStyle={{ color: "#1890ff", fontSize: "1.5rem" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Card className="text-center hover:shadow-md transition-shadow">
                  <Statistic
                    title="Active"
                    value={activeCount}
                    prefix={<CheckCircleOutlined className="text-green-500" />}
                    valueStyle={{ color: "#52c41a", fontSize: "1.5rem" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Card className="text-center hover:shadow-md transition-shadow">
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
                <Card className="text-center hover:shadow-md transition-shadow">
                  <Statistic
                    title="Admins"
                    value={adminsCount}
                    prefix={<CrownOutlined className="text-orange-500" />}
                    valueStyle={{ color: "#fa8c16", fontSize: "1.5rem" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Card className="text-center hover:shadow-md transition-shadow">
                  <Statistic
                    title="HR"
                    value={hrCount}
                    prefix={<UserOutlined className="text-red-500" />}
                    valueStyle={{ color: "#f5222d", fontSize: "1.5rem" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Card className="text-center hover:shadow-md transition-shadow">
                  <Statistic
                    title="Secretaries"
                    value={secretaryCount}
                    prefix={<UserOutlined className="text-cyan-500" />}
                    valueStyle={{ color: "#13c2c2", fontSize: "1.5rem" }}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {/* Search & Filters - Mobile Optimized */}
        <Card
          className="mb-4 sm:mb-6"
          bodyStyle={{ padding: "12px" }}
          size="small">
          <Space direction="vertical" size="small" className="w-full">
            {/* Search Bar */}
            <StaffSearchBar
              onFiltersChange={handleFiltersChange}
              filters={filters}
              loading={loading}
              searchPlaceholder="Search staff..."
              showUserFilters={true}
              disabled={!isAdminOrHr && !isSuperOrAdmin}
            />

            {/* Quick Stats Tags - Scrollable on mobile */}
            <div className="overflow-x-auto pb-1">
              <Space size="small" className="whitespace-nowrap">
                <Tag color="blue" className="text-xs sm:text-sm">
                  <TeamOutlined className="mr-1" />
                  {staffCount}
                </Tag>
                <Tag color="green" className="text-xs sm:text-sm">
                  <CheckCircleOutlined className="mr-1" />
                  {activeCount}
                </Tag>
                <Tag color="orange" className="text-xs sm:text-sm">
                  <UserOutlined className="mr-1" />
                  {inactiveCount}
                </Tag>
                {(isAdminOrHr || isSuperOrAdmin) && (
                  <>
                    <Tag color="purple" className="text-xs sm:text-sm">
                      <SafetyCertificateOutlined className="mr-1" />
                      {lawyerCount}
                    </Tag>
                    <Tag color="gold" className="text-xs sm:text-sm">
                      <CheckCircleOutlined className="mr-1" />
                      {verifiedCount}
                    </Tag>
                  </>
                )}
              </Space>
            </div>
          </Space>
        </Card>

        {/* Active Filters */}
        {(isAdminOrHr || isSuperOrAdmin) && Object.keys(filters).length > 0 && (
          <div className="mb-4">
            <ActiveFilters
              filters={filters}
              onFilterRemove={handleFilterRemove}
              onClearAll={resetFilters}
            />
          </div>
        )}

        {/* Main Content */}
        <Card
          className="shadow-sm relative"
          bodyStyle={{ padding: 0 }}
          size="small">
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
              <Spin size="large" tip="Loading..." />
            </div>
          )}

          {/* Info Banner - Mobile Optimized */}
          {!loading && filteredStaff.length > 0 && (
            <div className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-50 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs sm:text-sm">
                <span className="text-blue-700">
                  <strong>Page:</strong> {filteredStaff.length} of{" "}
                  {totalRecords}
                </span>
                <span className="text-blue-600">
                  <strong>Status:</strong> {activeCount} active •{" "}
                  {inactiveCount} inactive
                </span>
              </div>
            </div>
          )}

          {/* Table */}
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
            <div className="p-6 sm:p-12 text-center">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size="small">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700">
                      {Object.keys(filters).length > 0
                        ? "No Staff Found"
                        : "No Staff"}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {Object.keys(filters).length > 0
                        ? "Try adjusting filters"
                        : isAdminOrHr || isSuperOrAdmin
                          ? "Add your first team member"
                          : "No staff in directory"}
                    </p>
                    {Object.keys(filters).length > 0 && (
                      <p className="text-blue-600 text-xs mt-2">
                        System: {staffCount} total ({activeCount} active)
                      </p>
                    )}
                  </Space>
                }
              />
              {Object.keys(filters).length > 0 ? (
                <Button onClick={resetFilters} className="mt-4">
                  Clear Filters
                </Button>
              ) : (
                (isAdminOrHr || isSuperOrAdmin) && (
                  <Link to="add-user">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      className="mt-4">
                      Add First Staff
                    </Button>
                  </Link>
                )
              )}
            </div>
          )}
        </Card>

        {/* Pagination - Mobile Optimized */}
        {totalRecords > 0 && (
          <div className="mt-4 sm:mt-6">
            <Pagination
              current={currentPage}
              total={totalRecords}
              pageSize={itemsPerPage}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
              showSizeChanger
              showQuickJumper={false} // Disabled on mobile for space
              showTotal={paginationText}
              pageSizeOptions={["10", "20", "50"]}
              disabled={loading}
              size="small"
              className="text-center"
              responsive
            />
          </div>
        )}
      </div>
    </div>
  );
});

StaffList.displayName = "StaffList";
export default StaffList;
