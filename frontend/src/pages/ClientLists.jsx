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
  UserOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useUserList } from "../hooks/useUserList"; // ✅ Using fixed hook
import { useAdminHook } from "../hooks/useAdminHook";

import ButtonWithIcon from "../components/ButtonWithIcon";
import StaffSearchBar from "../components/StaffSearchBar";
import UserListTable from "../components/UserListTable";
import ActiveFilters from "../components/ActiveFilters";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import useUsersCount from "../hooks/useUsersCount";

const ClientList = memo(() => {
  useRedirectLogoutUser("/users/login");
  // const { user } = useSelector((state) => state.auth);
  const { isAdminOrHr, isSuperOrAdmin } = useAdminHook();

  // ✅ Use fixed hook with "client" filter
  const {
    filteredList: clientList,
    filters,
    currentPage,
    itemsPerPage,
    totalRecords,

    loading,

    users, // For statistics fallback
    handleFiltersChange,
    resetFilters,
    removeUser,
    handlePageChange,
  } = useUserList("client"); // ✅ Pass "client" role

  // console.log("✅ ClientList - Data:", {
  //   clientList,
  //   clientListLength: clientList.length,
  //   totalRecords,
  //   totalPages,
  //   currentPage,
  //   itemsPerPage,
  //   paginationData,
  // });

  // ✅ Calculate statistics from the API response
  const usersCount = useUsersCount({
    statistics: users?.statistics, // Use statistics from API
    data: clientList,
  });

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
      return `Showing ${start}-${end} of ${total} clients`;
    },
    [currentPage, itemsPerPage]
  );

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <UserOutlined className="text-blue-500" />
                Client Management
              </h1>
              <p className="text-gray-600 mt-2">
                {isAdminOrHr || isSuperOrAdmin
                  ? "Manage all client accounts and information"
                  : "View client directory"}
              </p>
            </div>

            {/* Add Client Button */}
            {(isAdminOrHr || isSuperOrAdmin) && (
              <Link to="/dashboard/clients/add-client">
                <ButtonWithIcon
                  icon={<PlusOutlined className="mr-2" />}
                  text="Add Client"
                  type="primary"
                  size="large"
                  className="bg-blue-600 hover:bg-blue-700 border-0"
                />
              </Link>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        {(isAdminOrHr || isSuperOrAdmin) && usersCount && (
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={6}>
              <Card className="text-center shadow-sm hover:shadow-md transition-shadow h-full">
                <Statistic
                  title="Total Clients"
                  value={usersCount.clientCount || 0}
                  prefix={<UserOutlined className="text-blue-500" />}
                  valueStyle={{ color: "#1890ff", fontSize: "1.5rem" }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card className="text-center shadow-sm hover:shadow-md transition-shadow h-full">
                <Statistic
                  title="Active Clients"
                  value={usersCount.totalActiveUsers || 0}
                  prefix={<CheckCircleOutlined className="text-green-500" />}
                  valueStyle={{ color: "#52c41a", fontSize: "1.5rem" }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card className="text-center shadow-sm hover:shadow-md transition-shadow h-full">
                <Statistic
                  title="Verified"
                  value={usersCount.verifiedUsers || 0}
                  prefix={<CheckCircleOutlined className="text-purple-500" />}
                  valueStyle={{ color: "#722ed1", fontSize: "1.5rem" }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card className="text-center shadow-sm hover:shadow-md transition-shadow h-full">
                <Statistic
                  title="Inactive"
                  value={usersCount.inactiveUsers || 0}
                  prefix={<UserOutlined className="text-orange-500" />}
                  valueStyle={{ color: "#fa8c16", fontSize: "1.5rem" }}
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
              searchPlaceholder="Search clients by name, email, phone..."
              showUserFilters={true}
              disabled={!isAdminOrHr && !isSuperOrAdmin}
            />
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-3">
            <Tag color="blue" className="px-3 py-1 text-sm font-medium">
              <UserOutlined className="mr-1" />
              Clients: {usersCount?.clientCount || 0}
            </Tag>
            <Tag color="green" className="px-3 py-1 text-sm font-medium">
              <CheckCircleOutlined className="mr-1" />
              Active: {usersCount?.totalActiveUsers || 0}
            </Tag>
            {(isAdminOrHr || isSuperOrAdmin) && (
              <Tag color="purple" className="px-3 py-1 text-sm font-medium">
                <CheckCircleOutlined className="mr-1" />
                Verified: {usersCount?.verifiedUsers || 0}
              </Tag>
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
              <Spin size="large" tip="Loading clients..." />
            </div>
          )}

          {/* Info Banner */}
          {!loading && clientList.length > 0 && (
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between text-sm gap-2">
                <span className="text-blue-700">
                  <strong>Current Page:</strong> Showing {clientList.length} of{" "}
                  {totalRecords} clients
                </span>
                {usersCount && (
                  <span className="text-blue-600">
                    <strong>System Totals:</strong> {usersCount.clientCount}{" "}
                    clients • {usersCount.staff} staff
                  </span>
                )}
              </div>
            </div>
          )}

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
            <div className="p-12 text-center">
              <Empty
                description={
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {Object.keys(filters).length > 0
                        ? "No Clients Found"
                        : "No Clients"}
                    </h3>
                    <p className="text-gray-500 mb-2">
                      {Object.keys(filters).length > 0
                        ? "No clients match your current filters. Try adjusting your search criteria."
                        : isAdminOrHr || isSuperOrAdmin
                        ? "No clients have been added yet. Start by adding your first client."
                        : "No clients found in the directory."}
                    </p>
                    {/* Show system stats */}
                    {usersCount && Object.keys(filters).length > 0 && (
                      <p className="text-blue-600 text-sm mt-3">
                        System has {usersCount.clientCount} total clients
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
                      text="Add First Client"
                      type="primary"
                    />
                  </Link>
                )
              )}
            </div>
          )}
        </Card>

        {/* ✅ PAGINATION - This is the key part! */}
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

ClientList.displayName = "ClientList";
export default ClientList;
