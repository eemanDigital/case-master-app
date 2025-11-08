import { Link } from "react-router-dom";
import { Pagination, Row, Alert, Card, Empty } from "antd";
import { PlusOutlined, EyeOutlined, TeamOutlined } from "@ant-design/icons";
import { useUserList } from "../hooks/useUserList";
import { useAdminHook } from "../hooks/useAdminHook";
import { useSelector } from "react-redux";
import ButtonWithIcon from "../components/ButtonWithIcon";
import PageErrorAlert from "../components/PageErrorAlert";
import StaffSearchBar from "../components/StaffSearchBar";
import UserListTable from "../components/UserListTable";
import ActiveFilters from "../components/ActiveFilters";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const ClientList = () => {
  useRedirectLogoutUser("/users/login");

  const { user } = useSelector((state) => state.auth);
  const { isSuperOrAdmin, isClient } = useAdminHook();

  const {
    filteredList: clientList,
    filters,
    currentPage,
    itemsPerPage,
    isError,
    loading,
    handleFiltersChange,
    resetFilters,
    removeUser,
    handlePageChange,
  } = useUserList("client");

  // Filter data based on user role
  const getFilteredClientData = () => {
    if (isClient && user) {
      // Clients can only see their own data
      return clientList.filter(
        (client) => client._id === user._id || client._id === user.data?._id
      );
    }
    // Admin/SuperAdmin can see all clients
    return clientList;
  };

  const filteredClients = getFilteredClientData();

  const handleFilterRemove = (key) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    handleFiltersChange(newFilters);
  };

  // Show empty state for clients with no access
  if (isClient && filteredClients.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="text-center shadow-lg">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No Client Data Found
                  </h3>
                  <p className="text-gray-500">
                    You don't have access to view other clients' information.
                    {user?.data?.firstName
                      ? ` You can only view your own profile.`
                      : ""}
                  </p>
                </div>
              }
            />
            <div className="mt-6">
              <Link
                to={`/dashboard/clients/${
                  user?._id || user?.data?._id
                }/details`}>
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
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <TeamOutlined className="text-blue-500" />
                Client Management
              </h1>
              <p className="text-gray-600 mt-2">
                {isClient
                  ? "Your client profile and information"
                  : "Manage all client accounts and information"}
              </p>
            </div>

            {/* Add Client Button - Only for Admin/SuperAdmin */}
            {isSuperOrAdmin && (
              <Link to="add-client">
                <ButtonWithIcon
                  onClick={() => {}}
                  icon={<PlusOutlined className="mr-2" />}
                  text="Add New Client"
                  type="primary"
                  size="large"
                  className="bg-blue-600 hover:bg-blue-700 border-0"
                />
              </Link>
            )}
          </div>

          {/* Client Access Notice */}
          {isClient && (
            <Alert
              message="Limited Access"
              description="As a client, you can only view your own profile information. You cannot see other clients' data."
              type="info"
              showIcon
              closable
              className="mb-6"
            />
          )}
        </div>

        {/* Search and Filters - Only for Admin/SuperAdmin */}
        {isSuperOrAdmin && (
          <>
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6 p-6 bg-white rounded-lg shadow-sm border">
              <div className="w-full lg:w-96">
                <StaffSearchBar
                  onFiltersChange={handleFiltersChange}
                  filters={filters}
                  loading={loading}
                  searchPlaceholder="Search clients by name, email, phone..."
                  showUserFilters={true}
                  hideFields={true}
                />
              </div>

              {/* Quick Stats for Admin */}
              <div className="flex gap-4 text-sm text-gray-600">
                <span className="bg-blue-50 px-3 py-1 rounded-full">
                  Total: {filteredClients.length}
                </span>
                <span className="bg-green-50 px-3 py-1 rounded-full">
                  Active: {filteredClients.filter((c) => c.isActive).length}
                </span>
                <span className="bg-purple-50 px-3 py-1 rounded-full">
                  Verified: {filteredClients.filter((c) => c.isVerified).length}
                </span>
              </div>
            </div>

            <ActiveFilters
              filters={filters}
              onFilterRemove={handleFilterRemove}
              onClearAll={resetFilters}
            />
          </>
        )}

        {/* Main Content */}
        {isError ? (
          <PageErrorAlert errorCondition={true} errorMessage={isError} />
        ) : (
          <>
            <Card className="shadow-sm border-0" bodyStyle={{ padding: 0 }}>
              <UserListTable
                dataSource={filteredClients}
                loading={loading}
                onDelete={isSuperOrAdmin ? removeUser : null} // Only admin can delete
                showActions={isSuperOrAdmin} // Only show actions for admin
                userType="client"
                basePath="/dashboard/clients"
                showEdit={isSuperOrAdmin} // Only admin can edit
                showDelete={isSuperOrAdmin} // Only admin can delete
                showView={true} // Everyone can view
              />

              {/* Empty State for Admin */}
              {filteredClients.length === 0 && !loading && isSuperOrAdmin && (
                <div className="p-12 text-center">
                  <Empty
                    description={
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          No Clients Found
                        </h3>
                        <p className="text-gray-500">
                          {Object.keys(filters).length > 0
                            ? "No clients match your current filters. Try adjusting your search criteria."
                            : "No clients have been added yet. Start by adding your first client."}
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
                    <Link to="add-client" className="mt-4 inline-block">
                      <ButtonWithIcon
                        icon={<PlusOutlined />}
                        text="Add First Client"
                        type="primary"
                      />
                    </Link>
                  )}
                </div>
              )}
            </Card>

            {/* Pagination - Only for Admin/SuperAdmin */}
            {isSuperOrAdmin && filteredClients.length > 0 && (
              <Row justify="center" style={{ marginTop: 24 }}>
                <Pagination
                  current={currentPage}
                  total={filteredClients.length * 5} // Adjust based on your API
                  pageSize={itemsPerPage}
                  onChange={handlePageChange}
                  onShowSizeChange={handlePageChange}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) =>
                    `Showing ${range[0]}-${range[1]} of ${total} clients`
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

export default ClientList;
