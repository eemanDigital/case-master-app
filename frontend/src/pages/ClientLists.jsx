// pages/ClientList.jsx
import React, { memo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Pagination,
  Row,
  Card,
  Empty,
  Statistic,
  Col,
  Spin,
  Tag,
  Space,
  Button,
} from "antd";
import {
  PlusOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useUserList } from "../hooks/useUserList";
import { useAdminHook } from "../hooks/useAdminHook";
import ButtonWithIcon from "../components/ButtonWithIcon";
import StaffSearchBar from "../components/StaffSearchBar";
import UserListTable from "../components/UserListTable";
import ActiveFilters from "../components/ActiveFilters";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import useUsersCount from "../hooks/useUsersCount";

const ClientList = memo(() => {
  useRedirectLogoutUser("/users/login");
  const { isAdminOrHr, isSuperOrAdmin } = useAdminHook();

  const {
    filteredList: clientList,
    filters,
    currentPage,
    itemsPerPage,
    totalRecords,
    loading,
    users,
    handleFiltersChange,
    resetFilters,
    removeUser,
    handlePageChange,
  } = useUserList("client");

  const usersCount = useUsersCount({
    statistics: users?.statistics,
    data: clientList,
  });

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
                  <UserOutlined className="text-blue-500 flex-shrink-0" />
                  <span className="truncate">Clients</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                  {isAdminOrHr || isSuperOrAdmin
                    ? "Manage client accounts"
                    : "View client directory"}
                </p>
              </div>

              {/* Add Button - Desktop */}
              {(isAdminOrHr || isSuperOrAdmin) && (
                <Link
                  to="/dashboard/clients/add-client"
                  className="hidden sm:block flex-shrink-0">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    className="bg-blue-600 hover:bg-blue-700">
                    <span className="hidden lg:inline ml-1">Add Client</span>
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Add Button */}
            {(isAdminOrHr || isSuperOrAdmin) && (
              <Link to="/dashboard/clients/add-client" className="sm:hidden">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="large"
                  block
                  className="bg-blue-600">
                  Add Client
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Statistics - Mobile Optimized */}
        {(isAdminOrHr || isSuperOrAdmin) && usersCount && (
          <div className="mb-4 sm:mb-6">
            {/* Mobile: 2 columns */}
            <Row gutter={[8, 8]} className="sm:hidden">
              <Col span={12}>
                <Card size="small" className="text-center">
                  <Statistic
                    title={<span className="text-xs">Total</span>}
                    value={usersCount.clientCount || 0}
                    prefix={<UserOutlined className="text-blue-500" />}
                    valueStyle={{ fontSize: "1.25rem", color: "#1890ff" }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="text-center">
                  <Statistic
                    title={<span className="text-xs">Active</span>}
                    value={usersCount.totalActiveUsers || 0}
                    prefix={<CheckCircleOutlined className="text-green-500" />}
                    valueStyle={{ fontSize: "1.25rem", color: "#52c41a" }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="text-center">
                  <Statistic
                    title={<span className="text-xs">Verified</span>}
                    value={usersCount.verifiedUsers || 0}
                    prefix={<CheckCircleOutlined className="text-purple-500" />}
                    valueStyle={{ fontSize: "1.25rem", color: "#722ed1" }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="text-center">
                  <Statistic
                    title={<span className="text-xs">Inactive</span>}
                    value={usersCount.inactiveUsers || 0}
                    prefix={<UserOutlined className="text-orange-500" />}
                    valueStyle={{ fontSize: "1.25rem", color: "#fa8c16" }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Desktop: 4 columns */}
            <Row gutter={[16, 16]} className="hidden sm:flex">
              <Col xs={24} sm={12} md={6}>
                <Card className="text-center hover:shadow-md transition-shadow">
                  <Statistic
                    title="Total Clients"
                    value={usersCount.clientCount || 0}
                    prefix={<UserOutlined className="text-blue-500" />}
                    valueStyle={{ color: "#1890ff", fontSize: "1.5rem" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className="text-center hover:shadow-md transition-shadow">
                  <Statistic
                    title="Active"
                    value={usersCount.totalActiveUsers || 0}
                    prefix={<CheckCircleOutlined className="text-green-500" />}
                    valueStyle={{ color: "#52c41a", fontSize: "1.5rem" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className="text-center hover:shadow-md transition-shadow">
                  <Statistic
                    title="Verified"
                    value={usersCount.verifiedUsers || 0}
                    prefix={<CheckCircleOutlined className="text-purple-500" />}
                    valueStyle={{ color: "#722ed1", fontSize: "1.5rem" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card className="text-center hover:shadow-md transition-shadow">
                  <Statistic
                    title="Inactive"
                    value={usersCount.inactiveUsers || 0}
                    prefix={<UserOutlined className="text-orange-500" />}
                    valueStyle={{ color: "#fa8c16", fontSize: "1.5rem" }}
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
              searchPlaceholder="Search clients..."
              showUserFilters={true}
              disabled={!isAdminOrHr && !isSuperOrAdmin}
            />

            {/* Quick Stats Tags - Scrollable on mobile */}
            <div className="overflow-x-auto pb-1">
              <Space size="small" className="whitespace-nowrap">
                <Tag color="blue" className="text-xs sm:text-sm">
                  <UserOutlined className="mr-1" />
                  {usersCount?.clientCount || 0}
                </Tag>
                <Tag color="green" className="text-xs sm:text-sm">
                  <CheckCircleOutlined className="mr-1" />
                  {usersCount?.totalActiveUsers || 0}
                </Tag>
                {(isAdminOrHr || isSuperOrAdmin) && (
                  <Tag color="purple" className="text-xs sm:text-sm">
                    <CheckCircleOutlined className="mr-1" />
                    {usersCount?.verifiedUsers || 0}
                  </Tag>
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
          {!loading && clientList.length > 0 && (
            <div className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-50 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs sm:text-sm">
                <span className="text-blue-700">
                  <strong>Page:</strong> {clientList.length} of {totalRecords}
                </span>
                {usersCount && (
                  <span className="text-blue-600">
                    <strong>Total:</strong> {usersCount.clientCount} clients
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Table */}
          <UserListTable
            dataSource={clientList}
            loading={loading}
            onDelete={isSuperOrAdmin ? removeUser : null}
            showActions={isAdminOrHr || isSuperOrAdmin}
            showRole={false}
            showPosition={false}
            showLawyer={false}
            userType="client"
            basePath="/dashboard/clients"
          />

          {/* Empty State */}
          {!loading && clientList.length === 0 && (
            <div className="p-6 sm:p-12 text-center">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Space direction="vertical" size="small">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700">
                      {Object.keys(filters).length > 0
                        ? "No Clients Found"
                        : "No Clients"}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {Object.keys(filters).length > 0
                        ? "Try adjusting filters"
                        : isAdminOrHr || isSuperOrAdmin
                          ? "Add your first client"
                          : "No clients in directory"}
                    </p>
                    {usersCount && Object.keys(filters).length > 0 && (
                      <p className="text-blue-600 text-xs mt-2">
                        System: {usersCount.clientCount} total
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
                  <Link to="/dashboard/clients/add-client">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      className="mt-4">
                      Add First Client
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
              showQuickJumper={false}
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

ClientList.displayName = "ClientList";
export default ClientList;
