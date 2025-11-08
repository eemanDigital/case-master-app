import { Link } from "react-router-dom";
import { Pagination, Row, Card, Empty, Alert, Tag, Statistic, Col } from "antd";
import {
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { useUserList } from "../hooks/useUserList";
import { useAdminHook } from "../hooks/useAdminHook";
import { useSelector } from "react-redux";
import ButtonWithIcon from "../components/ButtonWithIcon";
import PageErrorAlert from "../components/PageErrorAlert";
import StaffSearchBar from "../components/StaffSearchBar";
import UserListTable from "../components/UserListTable";
import ActiveFilters from "../components/ActiveFilters";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const StaffList = () => {
  useRedirectLogoutUser("/users/login");
  const { user } = useSelector((state) => state.auth);
  const { isAdminOrHr, isSuperOrAdmin, isStaff } = useAdminHook();

  const {
    filteredList: staffList,
    filters,
    currentPage,
    itemsPerPage,
    isError,
    users,
    message,
    loading,
    handleFiltersChange,
    resetFilters,
    removeUser,
    handlePageChange,
  } = useUserList("staff");

  // Calculate staff statistics
  const staffStats = {
    total: staffList.length,
    active: staffList.filter((staff) => staff.isActive).length,
    verified: staffList.filter((staff) => staff.isVerified).length,
    lawyers: staffList.filter((staff) => staff.isLawyer).length,
    admins: staffList.filter((staff) =>
      ["admin", "super-admin"].includes(staff.role)
    ).length,
  };

  const handleFilterRemove = (key) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    handleFiltersChange(newFilters);
  };

  // Regular staff can only see their own profile
  const getFilteredStaffData = () => {
    if (isStaff && !isAdminOrHr && !isSuperOrAdmin && user) {
      return staffList.filter(
        (staff) => staff._id === user._id || staff._id === user.data?._id
      );
    }
    return staffList;
  };

  const filteredStaff = getFilteredStaffData();

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
                  icon={<UserOutlined />}
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
        {/* Header Section */}
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

            {/* Add User Button - Only for Admin/HR/SuperAdmin */}
            {(isAdminOrHr || isSuperOrAdmin) && (
              <Link to="add-user">
                <ButtonWithIcon
                  onClick={() => {}}
                  icon={<PlusOutlined className="mr-2" />}
                  text="Add Staff Member"
                  type="primary"
                  size="large"
                  className="bg-blue-600 hover:bg-blue-700 border-0"
                />
              </Link>
            )}
          </div>

          {/* Access Notice for Regular Staff */}
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

        {/* Statistics Cards - Only for Admin/HR/SuperAdmin */}
        {(isAdminOrHr || isSuperOrAdmin) && (
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={8} md={6}>
              <Card className="text-center shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title="Total Staff"
                  value={staffStats.total}
                  prefix={<TeamOutlined className="text-blue-500" />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Card className="text-center shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title="Active"
                  value={staffStats.active}
                  prefix={<UserOutlined className="text-green-500" />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Card className="text-center shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title="Lawyers"
                  value={staffStats.lawyers}
                  prefix={
                    <SafetyCertificateOutlined className="text-purple-500" />
                  }
                  valueStyle={{ color: "#722ed1" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Card className="text-center shadow-sm hover:shadow-md transition-shadow">
                <Statistic
                  title="Admins"
                  value={staffStats.admins}
                  prefix={<CrownOutlined className="text-orange-500" />}
                  valueStyle={{ color: "#fa8c16" }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Search and Filters - Available for all staff but with different capabilities */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6 p-6 bg-white rounded-lg shadow-sm border">
          <div className="w-full lg:w-96">
            <StaffSearchBar
              onFiltersChange={handleFiltersChange}
              filters={filters}
              loading={loading}
              searchPlaceholder="Search staff by name, email, position..."
              showUserFilters={true}
              disabled={!isAdminOrHr && !isSuperOrAdmin} // Regular staff can search but not filter
            />
          </div>

          {/* Quick Stats for all staff */}
          <div className="flex gap-4 text-sm text-gray-600">
            <Tag color="blue">Total: {filteredStaff.length}</Tag>
            <Tag color="green">
              Active: {filteredStaff.filter((s) => s.isActive).length}
            </Tag>
            {(isAdminOrHr || isSuperOrAdmin) && (
              <Tag color="purple">Lawyers: {staffStats.lawyers}</Tag>
            )}
          </div>
        </div>

        {/* Active Filters - Only for Admin/HR/SuperAdmin */}
        {(isAdminOrHr || isSuperOrAdmin) && Object.keys(filters).length > 0 && (
          <ActiveFilters
            filters={filters}
            onFilterRemove={handleFilterRemove}
            onClearAll={resetFilters}
          />
        )}

        {/* Main Content */}
        {isError ? (
          <PageErrorAlert errorCondition={isError} errorMessage={message} />
        ) : (
          <>
            <Card className="shadow-sm border-0" bodyStyle={{ padding: 0 }}>
              <UserListTable
                dataSource={filteredStaff}
                loading={loading}
                onDelete={isSuperOrAdmin ? removeUser : null} // Only super-admin can delete
                showActions={isAdminOrHr || isSuperOrAdmin} // Admin/HR can perform actions
                showRole={true}
                showPosition={true}
                showLawyer={true}
                userType="staff"
                basePath="/dashboard/staff"
                showEdit={isAdminOrHr || isSuperOrAdmin} // Only admins can edit
                showDelete={isSuperOrAdmin} // Only super-admin can delete
                showView={true} // Everyone can view
              />

              {/* Empty State */}
              {filteredStaff.length === 0 && !loading && (
                <div className="p-12 text-center">
                  <Empty
                    description={
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          {Object.keys(filters).length > 0
                            ? "No Staff Found"
                            : "No Staff Members"}
                        </h3>
                        <p className="text-gray-500">
                          {Object.keys(filters).length > 0
                            ? "No staff members match your current filters. Try adjusting your search criteria."
                            : isAdminOrHr || isSuperOrAdmin
                            ? "No staff members have been added yet. Start by adding your first team member."
                            : "No staff members found in the directory."}
                        </p>
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
            {filteredStaff.length > 0 && (
              <Row justify="center" style={{ marginTop: 24 }}>
                <Pagination
                  current={currentPage}
                  total={
                    users?.pagination?.totalRecords || filteredStaff.length
                  }
                  pageSize={itemsPerPage}
                  onChange={handlePageChange}
                  onShowSizeChange={handlePageChange}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) =>
                    `Showing ${range[0]}-${range[1]} of ${total} staff members`
                  }
                  pageSizeOptions={["10", "20", "50", "100"]}
                  className="pagination-custom"
                />
              </Row>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StaffList;
