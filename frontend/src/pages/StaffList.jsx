import { Link } from "react-router-dom";
import { Pagination, Row } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useUserList } from "../hooks/useUserList";
import { useAdminHook } from "../hooks/useAdminHook";
import ButtonWithIcon from "../components/ButtonWithIcon";
import PageErrorAlert from "../components/PageErrorAlert";
import StaffSearchBar from "../components/StaffSearchBar";
import UserListTable from "../components/UserListTable";
import ActiveFilters from "../components/ActiveFilters";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const StaffList = () => {
  useRedirectLogoutUser("/users/login");
  const { isAdminOrHr, isSuperOrAdmin } = useAdminHook();

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

  const handleFilterRemove = (key) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    handleFiltersChange(newFilters);
  };

  return (
    <>
      <div className="flex md:flex-row flex-col justify-between items-center gap-3 my-4">
        {isAdminOrHr && (
          <div className="flex gap-2">
            <Link to="add-user">
              <ButtonWithIcon
                onClick={() => {}}
                icon={<PlusOutlined className="mr-2" />}
                text="Add User"
              />
            </Link>
          </div>
        )}

        <div className="w-full md:w-96">
          <StaffSearchBar
            onFiltersChange={handleFiltersChange}
            filters={filters}
            loading={loading}
            searchPlaceholder="Search staff by name, email, position..."
            showUserFilters={true}
          />
        </div>
      </div>

      <ActiveFilters
        filters={filters}
        onFilterRemove={handleFilterRemove}
        onClearAll={resetFilters}
      />

      {isError ? (
        <PageErrorAlert errorCondition={isError} errorMessage={message} />
      ) : (
        <>
          <UserListTable
            dataSource={staffList}
            loading={loading}
            onDelete={removeUser}
            showActions={isSuperOrAdmin}
            showRole={true}
            showPosition={true}
            showLawyer={true}
            userType="staff"
            basePath="/dashboard/staff"
          />

          {(users?.pagination?.totalRecords > 0 || staffList.length > 0) && (
            <Row justify="center" style={{ marginTop: 16 }}>
              <Pagination
                current={currentPage}
                total={users?.pagination?.totalRecords || staffList.length}
                pageSize={itemsPerPage}
                onChange={handlePageChange}
                onShowSizeChange={handlePageChange}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) =>
                  `Showing ${range[0]}-${range[1]} of ${total} staff members`
                }
                pageSizeOptions={["10", "20", "50", "100"]}
              />
            </Row>
          )}
        </>
      )}
    </>
  );
};

export default StaffList;
